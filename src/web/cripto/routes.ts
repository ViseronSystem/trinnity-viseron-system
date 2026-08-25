// Cripto Live API — estado on-chain real das wallets farming + transações + radar.
import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Connection, PublicKey } from "@solana/web3.js";

const ROOT = process.cwd();
const IDX_FILE = path.join(ROOT, "contracts", "wallets", "index.json");
const SWAPS_FILE = path.join(ROOT, "data", "crypto", "swaps.jsonl");
const RADAR_FILE = path.join(ROOT, "data", "crypto", "radar-masivo.json");
const OPS_FILE = path.join(ROOT, "data", "crypto", "oportunidades.json");
const SCAN_LOG = path.join(ROOT, "tools", "puzzle-scanner", "scan.log");

const RPC = "https://api.mainnet-beta.solana.com";
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const FUNDED_LAMPORTS_PER_WALLET = 5_000_000; // 0.005 SOL por wallet (goteo oficial documentado)

interface CacheEntry<T> { at: number; data: T }
const balCache: CacheEntry<any> = { at: 0, data: null };
const priceCache: CacheEntry<number | null> = { at: 0, data: null };

async function getSolPrice(): Promise<number | null> {
  if (Date.now() - priceCache.at < 300_000) return priceCache.data;
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", { signal: AbortSignal.timeout(8000) });
    const j: any = await r.json();
    priceCache.data = typeof j?.solana?.usd === "number" ? j.solana.usd : null;
  } catch { priceCache.data = null; }
  priceCache.at = Date.now();
  return priceCache.data;
}

async function readScanLog(): Promise<{ rate: string | null; lastLine: string | null }> {
  try {
    const txt = fs.readFileSync(SCAN_LOG, "utf8");
    const lines = txt.trim().split("\n").filter(Boolean);
    const last = lines[lines.length - 1] ?? null;
    const m = last?.match(/([\d.,]+)\s*[kKmMgG]??\s*keys\/s/i);
    return { rate: m ? m[1] : null, lastLine: last?.slice(0, 200) ?? null };
  } catch { return { rate: null, lastLine: null }; }
}

export function createCriptoRouter(): Router {
  const router = Router();

  // GET /api/cripto/status — tudo o que o painel precisa numa chamada
  router.get("/status", async (_req: Request, res: Response) => {
    try {
      // ── Wallets + saldos (cache 60s) ──
      let walletsBlock = balCache.data;
      if (!walletsBlock || Date.now() - balCache.at > 60_000) {
        const idx = JSON.parse(fs.readFileSync(IDX_FILE, "utf8"));
        const conn = new Connection(RPC, "confirmed");
        const wallets: any[] = [];
        for (const w of idx.wallets ?? []) {
          const pub = new PublicKey(w.address);
          let sol = 0, usdc = 0;
          try { sol = (await conn.getBalance(pub)) / 1e9; } catch {}
          try {
            const tas = await conn.getParsedTokenAccountsByOwner(pub, { mint: USDC_MINT });
            for (const ta of tas.value) usdc += ta.account.data.parsed.info.tokenAmount.uiAmount ?? 0;
          } catch {}
          wallets.push({ id: w.id, address: w.address, sol: +sol.toFixed(6), usdc: +usdc.toFixed(4), keypairFile: w.keypairFile });
        }
        walletsBlock = { wallets, generatedAt: new Date().toISOString() };
        balCache.data = walletsBlock;
        balCache.at = Date.now();
      }

      const price = await getSolPrice();
      const nWallets = walletsBlock.wallets.length;
      const totalSol = walletsBlock.wallets.reduce((s: number, w: any) => s + w.sol, 0);
      const totalUsdc = walletsBlock.wallets.reduce((s: number, w: any) => s + w.usdc, 0);
      const fundedSol = (nWallets * FUNDED_LAMPORTS_PER_WALLET) / 1e9;
      const valueUsd = price != null ? totalSol * price + totalUsdc : null;
      const investedUsd = price != null ? fundedSol * price : null;
      const pnlUsd = valueUsd != null && investedUsd != null ? +(valueUsd - investedUsd).toFixed(4) : null;

      // ── Transações (últimos 60 swaps) ──
      let txs: any[] = [], txCount = 0;
      try {
        const lines = fs.readFileSync(SWAPS_FILE, "utf8").trim().split("\n").filter(Boolean);
        txCount = lines.length;
        txs = lines.slice(-60).reverse().map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      } catch {}

      // ── Radar ──
      let radar: any = null;
      try {
        const r = JSON.parse(fs.readFileSync(RADAR_FILE, "utf8"));
        radar = { sourcesCovered: r.sourcesCovered ?? r.totalSources ?? null, generatedAt: r.generatedAt ?? null,
          opportunities: (r.opportunities ?? []).slice(0, 6).map((o: any) => ({ title: o.title ?? o.name, prize: o.prize ?? o.reward ?? null, url: o.url ?? o.link ?? null })) };
      } catch {}
      let opsTotal: number | null = null;
      try {
        const o = JSON.parse(fs.readFileSync(OPS_FILE, "utf8"));
        opsTotal = Array.isArray(o.hackathons) ? o.hackathons.length : null;
      } catch {}

      // ── Scanner puzzle #71 ──
      const scanner = await readScanLog();

      res.json({
        ok: true,
        updatedAt: new Date().toISOString(),
        solPriceUsd: price,
        totals: { wallets: nWallets, fundedSol: +fundedSol.toFixed(4), totalSol: +totalSol.toFixed(6), totalUsdc: +totalUsdc.toFixed(4), investedUsd, valueUsd, pnlUsd },
        wallets: walletsBlock.wallets.map((w: any) => ({ ...w, keypairFile: undefined })),
        txs, txCount,
        radar, opsTotal,
        scanner,
      });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  return router;
}
