import crypto from "crypto";

// ── TVS CRYPTO ENGINE — Exchange Adapters ─────────────────────────────
// Multi-exchange real (Binance · Kraken · Coinbase CDP) com fallback Mock.
// Seleção por CRYPTO_EXCHANGE=mock|binance|kraken|coinbase (default: mock).
// As chaves vivem no .env (gitignored). Sem chaves → modo teste seguro.

export interface Balance {
  asset: string;
  free: number;
  locked: number;
  total: number;
  usd: number;
}

export interface Deposit {
  id: string;
  asset: string;
  amount: number;
  status: "pending" | "credited";
  hash: string;
  creditedAt?: number;
  memo?: string;
}

export interface DepositAddress {
  asset: string;
  address: string;
  network: string;
  memo?: string;
}

export interface PriceQuote {
  asset: string;
  usd: number;
  eur: number;
}

export interface CryptoStatus {
  exchange: string;
  mode: "mock" | "live";
  connected: boolean;
  supportedAssets: string[];
}

export abstract class ExchangeAdapter {
  abstract readonly name: string;
  abstract readonly mode: "mock" | "live";
  abstract getBalances(): Promise<Balance[]>;
  abstract getDeposits(since?: number): Promise<Deposit[]>;
  abstract getDepositAddress(asset: string): Promise<DepositAddress>;
  abstract getPrices(assets: string[]): Promise<PriceQuote[]>;
  abstract status(): CryptoStatus;

  protected priceToEur(usd: number): number {
    const rate = parseFloat(process.env.MOCK_EUR_RATE || "0.92") || 0.92;
    return usd * rate;
  }
}

const USD_VALUE: Record<string, number> = {
  BTC: parseFloat(process.env.MOCK_BTC_USD || "61000") || 61000,
  ETH: parseFloat(process.env.MOCK_ETH_USD || "3400") || 3400,
  USDT: 1,
};

// ── MOCK (modo teste — sem dinheiro real) ─────────────────────────────
export class MockExchange extends ExchangeAdapter {
  readonly name = "Mock (teste)";
  readonly mode: "mock" = "mock";
  private balances: Balance[];
  private deposits: Deposit[] = [];

  constructor(balances?: Balance[]) {
    super();
    this.balances = balances ?? this.parseBalances();
  }

  private parseBalances(): Balance[] {
    const raw = process.env.MOCK_BALANCES || "BTC:0.52,ETH:3.10,USDT:12500";
    return raw
      .split(",")
      .map((pair) => {
        const [asset, amt] = pair.split(":").map((s) => s.trim());
        if (!asset || !amt) return null;
        const total = parseFloat(amt) || 0;
        const usd = USD_VALUE[asset.toUpperCase()] ?? 0;
        return { asset: asset.toUpperCase(), free: total, locked: 0, total, usd: total * usd };
      })
      .filter(Boolean) as Balance[];
  }

  injectDeposit(asset: string, amount: number, memo?: string): Deposit {
    const d: Deposit = {
      id: `mockdep_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      asset: asset.toUpperCase(),
      amount,
      status: "credited",
      hash: "0x" + crypto.createHash("sha256").update(`${asset}${amount}${memo}${Date.now()}`).digest("hex").slice(0, 40),
      creditedAt: Date.now(),
      memo,
    };
    this.deposits.push(d);
    return d;
  }

  async getBalances(): Promise<Balance[]> {
    return this.balances.map((b) => ({ ...b }));
  }

  async getDeposits(since?: number): Promise<Deposit[]> {
    return this.deposits.filter((d) => !since || (d.creditedAt ?? 0) >= since);
  }

  async getDepositAddress(asset: string): Promise<DepositAddress> {
    const a = asset.toUpperCase();
    const hash = crypto.createHash("sha256").update(`tvs-mock-${a}`).digest("hex");
    const base = {
      BTC: { address: "bc1q" + hash.slice(0, 38), network: "bitcoin" },
      ETH: { address: "0x" + hash.slice(0, 40), network: "ethereum" },
      USDT: { address: "TVA" + hash.slice(0, 32), network: "tron", memo: "" },
    }[a] ?? { address: "0x" + hash.slice(0, 40), network: "ethereum" };
    return { asset: a, ...base };
  }

  async getPrices(assets: string[]): Promise<PriceQuote[]> {
    return assets.map((a) => {
      const usd = USD_VALUE[a.toUpperCase()] ?? 0;
      return { asset: a.toUpperCase(), usd, eur: this.priceToEur(usd) };
    });
  }

  status(): CryptoStatus {
    return { exchange: "mock", mode: "mock", connected: true, supportedAssets: Object.keys(USD_VALUE) };
  }
}

// ── BINANCE (HMAC-SHA256) ─────────────────────────────────────────────
export class BinanceExchange extends ExchangeAdapter {
  readonly name = "Binance";
  readonly mode: "live" = "live";
  private apiKey: string;
  private secret: string;
  private base = "https://api.binance.com";

  constructor(apiKey: string, secret: string) {
    super();
    this.apiKey = apiKey;
    this.secret = secret;
  }

  private async signed(path: string, params: Record<string, string> = {}): Promise<any> {
    const qs = new URLSearchParams({ timestamp: String(Date.now()), ...params }).toString();
    const signature = crypto.createHmac("sha256", this.secret).update(qs).digest("hex");
    const res = await fetch(`${this.base}${path}?${qs}&signature=${signature}`, {
      headers: { "X-MBX-APIKEY": this.apiKey },
    });
    if (!res.ok) throw new Error(`Binance ${path}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    return res.json();
  }

  private async publicGet(path: string, params: Record<string, string> = {}): Promise<any> {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${this.base}${path}?${qs}`);
    if (!res.ok) throw new Error(`Binance ${path}: HTTP ${res.status}`);
    return res.json();
  }

  async getBalances(): Promise<Balance[]> {
    const data = await this.signed("/api/v3/account");
    const prices = await this.pricesMap(["BTC", "ETH", "USDT"]);
    const out: Balance[] = [];
    for (const b of data.balances ?? []) {
      const free = parseFloat(b.free);
      const locked = parseFloat(b.locked);
      const total = free + locked;
      if (total <= 0) continue;
      const asset = b.asset;
      out.push({ asset, free, locked, total, usd: total * (prices[asset] ?? 0) });
    }
    return out.sort((a, b) => b.usd - a.usd);
  }

  async getDeposits(since?: number): Promise<Deposit[]> {
    const params: Record<string, string> = {};
    if (since) params.startTime = String(since);
    const data = await this.signed("/sapi/v1/capital/deposit/hisrec", params);
    return (data ?? [])
      .filter((d: any) => d.status === 1)
      .map((d: any) => ({
        id: String(d.id),
        asset: d.coin,
        amount: parseFloat(d.amount),
        status: "credited" as const,
        hash: d.txId || "",
        creditedAt: d.insertTime,
      }));
  }

  async getDepositAddress(asset: string): Promise<DepositAddress> {
    const a = asset.toUpperCase();
    const networkMap: Record<string, string> = { BTC: "BTC", ETH: "ETH", USDT: "TRX" };
    const data = await this.signed("/sapi/v1/capital/deposit/address", { coin: a, network: networkMap[a] || a });
    return { asset: a, address: data.address || "", network: data.network || a, memo: data.tag || undefined };
  }

  private async pricesMap(assets: string[]): Promise<Record<string, number>> {
    const map: Record<string, number> = {};
    for (const a of assets) {
      try {
        const t = await this.publicGet("/api/v3/ticker/price", { symbol: `${a}USDT` });
        map[a] = parseFloat(t.price);
      } catch {}
    }
    return map;
  }

  async getPrices(assets: string[]): Promise<PriceQuote[]> {
    const map = await this.pricesMap(assets);
    return assets.map((a) => {
      const usd = map[a.toUpperCase()] ?? 0;
      return { asset: a.toUpperCase(), usd, eur: this.priceToEur(usd) };
    });
  }

  status(): CryptoStatus {
    return { exchange: "binance", mode: "live", connected: true, supportedAssets: ["BTC", "ETH", "USDT"] };
  }
}

// ── KRAKEN (Ed25519) ──────────────────────────────────────────────────
export class KrakenExchange extends ExchangeAdapter {
  readonly name = "Kraken";
  readonly mode: "live" = "live";
  private apiKey: string;
  private secret: Buffer;
  private base = "https://api.kraken.com";

  constructor(apiKey: string, secretB64: string) {
    super();
    this.apiKey = apiKey;
    this.secret = Buffer.from(secretB64, "base64");
  }

  private async privateCall(path: string, body: Record<string, string>): Promise<any> {
    const nonce = String(Date.now() * 1000);
    const data = { nonce, ...body };
    const bodyStr = new URLSearchParams(data).toString();
    const sha256 = crypto.createHash("sha256").update(nonce + bodyStr).digest();
    const msg = Buffer.concat([Buffer.from(path), sha256]);
    const signature = crypto.sign(null, msg, { key: this.secret, padding: crypto.constants.RSA_PKCS1_PADDING });
    const res = await fetch(`${this.base}${path}`, {
      method: "POST",
      headers: {
        "API-Key": this.apiKey,
        "API-Sign": signature.toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyStr,
    });
    const json = await res.json();
    if (json.error?.length) throw new Error(`Kraken: ${json.error.join("; ")}`);
    return json.result ?? {};
  }

  private async publicCall(path: string, params: Record<string, string> = {}): Promise<any> {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${this.base}${path}?${qs}`);
    const json = await res.json();
    if (json.error?.length) throw new Error(`Kraken: ${json.error.join("; ")}`);
    return json.result ?? {};
  }

  async getBalances(): Promise<Balance[]> {
    const data = await this.privateCall("/0/private/Balance", {});
    const prices = await this.pricesMap(["BTC", "ETH", "USDT"]);
    return Object.entries(data)
      .map(([asset, totalRaw]) => {
        const total = parseFloat(totalRaw as string);
        if (!total) return null;
        return { asset, free: total, locked: 0, total, usd: total * (prices[asset] ?? 0) };
      })
      .filter(Boolean) as Balance[];
  }

  async getDeposits(_since?: number): Promise<Deposit[]> {
    const data = await this.privateCall("/0/private/Deposits", {});
    return (Array.isArray(data) ? data : [])
      .filter((d: any) => d.status === "Success")
      .map((d: any) => ({ id: String(d.refid), asset: d.asset, amount: parseFloat(d.amount), status: "credited" as const, hash: d.txid || "", creditedAt: d.time }));
  }

  async getDepositAddress(asset: string): Promise<DepositAddress> {
    const envKey = `KRAKEN_${asset.toUpperCase()}_ADDRESS`;
    const address = process.env[envKey] || "";
    if (!address) throw new Error(`Definir ${envKey} no .env para depósitos ${asset} na Kraken`);
    return { asset: asset.toUpperCase(), address, network: asset.toUpperCase() };
  }

  private async pricesMap(assets: string[]): Promise<Record<string, number>> {
    const pairMap: Record<string, string> = { BTC: "XXBTZUSD", ETH: "XETHZUSD", USDT: "USDTZUSD" };
    const map: Record<string, number> = {};
    for (const a of assets) {
      try {
        const r = await this.publicCall("/0/public/Ticker", { pair: pairMap[a] || `${a}ZUSD` });
        const key = Object.keys(r)[0];
        map[a] = parseFloat(r[key]?.c?.[0] ?? "0");
      } catch {}
    }
    return map;
  }

  async getPrices(assets: string[]): Promise<PriceQuote[]> {
    const map = await this.pricesMap(assets);
    return assets.map((a) => {
      const usd = map[a.toUpperCase()] ?? 0;
      return { asset: a.toUpperCase(), usd, eur: this.priceToEur(usd) };
    });
  }

  status(): CryptoStatus {
    return { exchange: "kraken", mode: "live", connected: true, supportedAssets: ["BTC", "ETH", "USDT"] };
  }
}

// ── COINBASE (CDP — JWT ES256) ────────────────────────────────────────
export class CoinbaseExchange extends ExchangeAdapter {
  readonly name = "Coinbase";
  readonly mode: "live" = "live";
  private nameKey: string;
  private privateKey: string;
  private base = "https://api.coinbase.com";

  constructor(nameKey: string, privateKey: string) {
    super();
    this.nameKey = nameKey;
    this.privateKey = privateKey;
  }

  private jwt(): string {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "ES256", kid: this.nameKey, typ: "JWT" };
    const payload = { sub: this.nameKey, iss: "cdp", nbf: now - 30, exp: now + 110, uri: "https://api.coinbase.com/v2/accounts" };
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const signingInput = `${b64(header)}.${b64(payload)}`;
    const signature = crypto.createSign("SHA256").update(signingInput).sign(this.privateKey);
    return `${signingInput}.${signature.toString("base64url")}`;
  }

  private async get(path: string): Promise<any> {
    const res = await fetch(`${this.base}${path}`, { headers: { Authorization: `Bearer ${this.jwt()}` } });
    if (!res.ok) throw new Error(`Coinbase ${path}: HTTP ${res.status}`);
    return res.json();
  }

  async getBalances(): Promise<Balance[]> {
    const data = await this.get("/v2/accounts");
    const prices = await this.pricesMap(["BTC", "ETH", "USDT"]);
    return (data.data ?? [])
      .filter((a: any) => a.type === "wallet" && parseFloat(a.balance?.amount) > 0)
      .map((a: any) => {
        const total = parseFloat(a.balance.amount);
        return { asset: a.currency, free: total, locked: 0, total, usd: total * (prices[a.currency] ?? 0) };
      })
      .sort((x: Balance, y: Balance) => y.usd - x.usd) as Balance[];
  }

  async getDeposits(_since?: number): Promise<Deposit[]> {
    const data = await this.get("/v2/transactions");
    return (data.data ?? [])
      .filter((t: any) => t.type === "in" && t.status === "completed")
      .map((t: any) => ({ id: t.id, asset: t.amount?.currency, amount: parseFloat(t.amount?.amount ?? "0"), status: "credited" as const, hash: t.details?.cryptoTransactionHash || "", creditedAt: Date.parse(t.created_at || "0") }));
  }

  async getDepositAddress(asset: string): Promise<DepositAddress> {
    const envKey = `COINBASE_${asset.toUpperCase()}_ADDRESS`;
    const address = process.env[envKey] || "";
    if (!address) throw new Error(`Definir ${envKey} no .env para depósitos ${asset} na Coinbase`);
    return { asset: asset.toUpperCase(), address, network: asset.toUpperCase() };
  }

  private async pricesMap(assets: string[]): Promise<Record<string, number>> {
    const map: Record<string, number> = {};
    for (const a of assets) {
      try {
        const d = await this.get(`/v2/prices/${a}-USD/spot`);
        map[a] = parseFloat(d.data?.amount ?? "0");
      } catch {}
    }
    return map;
  }

  async getPrices(assets: string[]): Promise<PriceQuote[]> {
    const map = await this.pricesMap(assets);
    return assets.map((a) => {
      const usd = map[a.toUpperCase()] ?? 0;
      return { asset: a.toUpperCase(), usd, eur: this.priceToEur(usd) };
    });
  }

  status(): CryptoStatus {
    return { exchange: "coinbase", mode: "live", connected: true, supportedAssets: ["BTC", "ETH", "USDT"] };
  }
}

// ── Fábrica ───────────────────────────────────────────────────────────
export function createCryptoExchange(): ExchangeAdapter {
  const name = (process.env.CRYPTO_EXCHANGE || "mock").toLowerCase();

  if (name === "binance" && process.env.BINANCE_API_KEY && process.env.BINANCE_API_SECRET) {
    return new BinanceExchange(process.env.BINANCE_API_KEY, process.env.BINANCE_API_SECRET);
  }
  if (name === "kraken" && process.env.KRAKEN_API_KEY && process.env.KRAKEN_API_SECRET) {
    return new KrakenExchange(process.env.KRAKEN_API_KEY, process.env.KRAKEN_API_SECRET);
  }
  if (name === "coinbase" && process.env.COINBASE_CDP_NAME && process.env.COINBASE_CDP_PRIVATE_KEY) {
    return new CoinbaseExchange(process.env.COINBASE_CDP_NAME, process.env.COINBASE_CDP_PRIVATE_KEY);
  }
  return new MockExchange();
}
