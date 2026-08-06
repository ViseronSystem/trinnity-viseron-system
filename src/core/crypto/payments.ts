import fs from "fs";
import path from "path";
import { ExchangeAdapter, MockExchange } from "./exchange";

// ── TVS CRYPTO ENGINE — Pagamentos / Faturas ──────────────────────────
// Cria faturas em BTC/ETH/USDT para os planos, deteta o depósito na exchange
// e faz upgrade automático do plano (monetização automática).

export const CRYPTO_CURRENCIES = ["BTC", "ETH", "USDT"] as const;
export type CryptoCurrency = (typeof CRYPTO_CURRENCIES)[number];

export interface CryptoInvoice {
  id: string;
  plan: "core" | "pro" | "enterprise";
  planName: string;
  currency: CryptoCurrency;
  amountUsd: number;
  amount: number;
  address: string;
  network: string;
  memo?: string;
  tenantId?: string;
  status: "pending" | "paid" | "expired" | "cancelled";
  createdAt: number;
  expiresAt: number;
  paidAt?: number;
  txHash?: string;
}

interface InvoiceFile {
  invoices: CryptoInvoice[];
}

export interface PaidInvoiceContext {
  invoice: CryptoInvoice;
  upgraded: boolean;
}

export interface CryptoPaymentsOptions {
  onPaid?: (invoice: CryptoInvoice) => Promise<void> | void;
  logger?: { info?: (msg: string) => void; error?: (msg: string) => void };
}

export class CryptoPayments {
  private exchange: ExchangeAdapter;
  private file: string;
  private data: InvoiceFile;
  private onPaid?: CryptoPaymentsOptions["onPaid"];
  private logger: CryptoPaymentsOptions["logger"];

  constructor(exchange: ExchangeAdapter, dataDir: string, options?: CryptoPaymentsOptions) {
    this.exchange = exchange;
    this.file = path.join(dataDir, "crypto", "invoices.json");
    this.data = { invoices: [] };
    this.load();
    this.onPaid = options?.onPaid;
    this.logger = options?.logger;
  }

  private load(): void {
    try {
      if (fs.existsSync(this.file)) {
        const parsed = JSON.parse(fs.readFileSync(this.file, "utf8"));
        this.data = { invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [] };
      } else {
        this.data = { invoices: [] };
        this.persist();
      }
    } catch (e) {
      this.data = { invoices: [] };
    }
  }

  private persist(): void {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), "utf8");
      fs.renameSync(tmp, this.file);
    } catch (e) {
      this.logger?.error?.(`[crypto] falha ao gravar faturas: ${(e as Error).message}`);
    }
  }

  private log(msg: string): void {
    this.logger?.info?.(`[crypto] ${msg}`);
  }

  get exchangeAdapter(): ExchangeAdapter {
    return this.exchange;
  }

  status() {
    return this.exchange.status();
  }

  async balances() {
    return this.exchange.getBalances();
  }

  async prices() {
    return this.exchange.getPrices([...CRYPTO_CURRENCIES]);
  }

  async createInvoice(input: {
    plan: "core" | "pro" | "enterprise";
    planName: string;
    amountUsd: number;
    currency: CryptoCurrency;
    tenantId?: string;
    memo?: string;
  }): Promise<CryptoInvoice> {
    const [price] = await this.exchange.getPrices([input.currency]);
    if (!price || price.usd <= 0) throw new Error(`Sem preço para ${input.currency}`);
    const address = await this.exchange.getDepositAddress(input.currency);
    const invoice: CryptoInvoice = {
      id: `inv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      plan: input.plan,
      planName: input.planName,
      currency: input.currency,
      amountUsd: input.amountUsd,
      amount: parseFloat((input.amountUsd / price.usd).toFixed(6)),
      address: address.address,
      network: address.network,
      memo: input.memo ?? address.memo,
      tenantId: input.tenantId,
      status: "pending",
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    this.data.invoices.push(invoice);
    this.persist();
    this.log(`fatura ${invoice.id} criada: ${invoice.currency} ${invoice.amount} (${invoice.amountUsd} USD) → ${invoice.address}`);
    return invoice;
  }

  list(tenantId?: string): CryptoInvoice[] {
    const all = [...this.data.invoices].sort((a, b) => b.createdAt - a.createdAt);
    return tenantId ? all.filter((i) => !i.tenantId || i.tenantId === tenantId) : all;
  }

  get(id: string): CryptoInvoice | undefined {
    return this.data.invoices.find((i) => i.id === id);
  }

  private async markPaid(invoice: CryptoInvoice, txHash?: string): Promise<boolean> {
    if (invoice.status === "paid") return false;
    invoice.status = "paid";
    invoice.paidAt = Date.now();
    invoice.txHash = txHash;
    this.persist();
    this.log(`fatura ${invoice.id} PAGA (${invoice.currency} ${invoice.amount}, tx ${txHash || "—"})`);
    if (this.onPaid) {
      try {
        await this.onPaid(invoice);
      } catch (e) {
        this.logger?.error?.(`[crypto] onPaid falhou: ${(e as Error).message}`);
      }
    }
    return true;
  }

  // Deteta depósitos recebidos e confirma faturas pendentes (monetização automática).
  async detect(): Promise<PaidInvoiceContext[]> {
    const pending = this.data.invoices.filter((i) => i.status === "pending" && i.createdAt < Date.now());
    if (pending.length === 0) return [];
    const since = Math.min(...pending.map((i) => i.createdAt)) - 60_000;
    const deposits = await this.exchange.getDeposits(since);
    const paid: PaidInvoiceContext[] = [];
    for (const inv of pending) {
      const match = deposits.find((d) => {
        if (d.asset.toUpperCase() !== inv.currency) return false;
        if (d.status !== "credited") return false;
        const memoOk = inv.memo ? d.memo === inv.memo || !d.memo : true;
        const amountOk = Math.abs(d.amount - inv.amount) <= Math.max(inv.amount * 0.01, 1e-6);
        return amountOk && memoOk;
      });
      if (match) {
        const changed = await this.markPaid(inv, match.hash);
        if (changed) paid.push({ invoice: inv, upgraded: true });
      }
    }
    return paid;
  }

  // Confirma uma fatura (usado pelo endpoint; em modo mock injeta o depósito para simular).
  async confirm(id: string): Promise<{ invoice?: CryptoInvoice; paid: boolean; mode: string; error?: string }> {
    const invoice = this.get(id);
    if (!invoice) return { paid: false, mode: this.exchange.mode, error: "Fatura não encontrada" };
    if (invoice.status === "paid") return { invoice, paid: true, mode: this.exchange.mode };
    if (this.exchange instanceof MockExchange) {
      this.exchange.injectDeposit(invoice.currency, invoice.amount, invoice.memo);
    }
    const paid = await this.detect();
    const updated = this.get(id);
    const isPaid = updated?.status === "paid";
    return { invoice: updated, paid: isPaid, mode: this.exchange.mode };
  }

  // Expira faturas pendentes com mais de 24h.
  expireStale(): number {
    let n = 0;
    for (const inv of this.data.invoices) {
      if (inv.status === "pending" && inv.expiresAt < Date.now()) {
        inv.status = "expired";
        n++;
      }
    }
    if (n > 0) this.persist();
    return n;
  }

  totals(): { paidCount: number; paidUsd: number; pendingUsd: number; pendingCount: number } {
    let paidCount = 0, paidUsd = 0, pendingUsd = 0, pendingCount = 0;
    for (const inv of this.data.invoices) {
      if (inv.status === "paid") {
        paidCount++;
        paidUsd += inv.amountUsd;
      } else if (inv.status === "pending") {
        pendingCount++;
        pendingUsd += inv.amountUsd;
      }
    }
    return { paidCount, paidUsd, pendingUsd, pendingCount };
  }
}
