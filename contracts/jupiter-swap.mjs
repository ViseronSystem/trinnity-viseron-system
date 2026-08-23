#!/usr/bin/env node
// JUPITER SWAP EXECUTOR — modo DRY (solo cotiza, no envia) o LIVE (firma y envia).
// Uso: node contracts/jupiter-swap.mjs <walletIndex> [live]
//      node contracts/jupiter-swap.mjs all dry     -> cotiza para las 10 sin enviar
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const JUP_QUOTE = "https://lite-api.jup.ag/swap/v1/quote";
const JUP_SWAP = "https://lite-api.jup.ag/swap/v1/swap";
const RPC = "https://api.mainnet-beta.solana.com";

const idxFile = path.join(__dirname, "wallets", "index.json");
const index = JSON.parse(fs.readFileSync(idxFile, "utf8"));
const entries = [];
const pushEntry = (e) => { if (e && e.address && e.keypairFile) entries.push(e); };
if (Array.isArray(index)) index.forEach(pushEntry);
else Object.values(index).forEach(v => Array.isArray(v) ? v.forEach(pushEntry) : pushEntry(v));

const target = process.argv[2] || "all";
const mode = (process.argv[3] || "dry").toLowerCase();
const conn = new Connection(RPC, "confirmed");

async function loadKeypair(entry) {
  const candidates = [
    path.resolve(__dirname, "..", entry.keypairFile),
    path.join(__dirname, "wallets", `${entry.id}-keypair.json`),
  ];
  for (const c of candidates) {
    try {
      if (c && fs.existsSync(c)) return Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(c, "utf8"))));
    } catch {}
  }
  throw new Error(`keypair no encontrada para ${entry.address}`);
}

async function quoteAndMaybeSwap(kp, amountLamports, live) {
  const qUrl = `${JUP_QUOTE}?inputMint=${SOL_MINT}&outputMint=${USDC_MINT}&amount=${amountLamports}&slippageBps=100`;
  const qRes = await fetch(qUrl);
  if (!qRes.ok) throw new Error(`quote HTTP ${qRes.status}`);
  const quote = await qRes.json();
  const outUsdc = Number(quote.outAmount) / 1e6;
  if (!live) return { dry: true, outUsdc: outUsdc.toFixed(4) };
  const sRes = await fetch(JUP_SWAP, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quoteResponse: quote, userPublicKey: kp.publicKey.toBase58(), wrapAndUnwrapSol: true }),
  });
  if (!sRes.ok) throw new Error(`swap HTTP ${sRes.status}`);
  const { swapTransaction } = await sRes.json();
  const tx = VersionedTransaction.deserialize(Buffer.from(swapTransaction, "base64"));
  tx.sign([kp]);
  const sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false });
  await conn.confirmTransaction(sig, "confirmed");
  return { live: true, sig, outUsdc: outUsdc.toFixed(4) };
}

const list = target === "all" ? entries : [entries[parseInt(target, 10)]].filter(Boolean);
console.log(`=== JUPITER EXECUTOR (${mode.toUpperCase()}) — ${new Date().toISOString()} ===`);
let ok = 0, fail = 0;
for (const e of list) {
  try {
    const kp = await loadKeypair(e);
    const bal = await conn.getBalance(kp.publicKey);
    const usable = bal - 15000; // margen fees
    if (usable < 100_000) { console.log(`${kp.publicKey.toBase58()} saldo ${(bal/1e9).toFixed(6)} SOL -> insuficiente`); fail++; continue; }
    let amt;
    if (mode === "live") {
      // LIVE: el swap transitorio exige renta de DOS cuentas (wSOL temporal ~2.04M
      // + USDC ATA permanente ~2.04M) + fees con prioridad. Sin ese colchon -> 0x1.
      if (usable < 4_300_000) {
        console.log(`${kp.publicKey.toBase58()} saldo ${(bal/1e9).toFixed(6)} SOL -> necesita top-up hasta ~0.006 SOL`);
        fail++;
        continue;
      }
      amt = usable - 4_180_000;
    } else {
      // DRY: cotizacion nominal representativa
      amt = Math.max(Math.floor(usable / 2), 100_000);
    }
    const r = await quoteAndMaybeSwap(kp, amt, mode === "live");
    console.log(`${mode === "live" ? "[LIVE]" : "[DRY]"} ${kp.publicKey.toBase58()} -> ${r.outUsdc} USDC ${r.sig ? `sig=${r.sig}` : "(sin enviar)"}`);
    ok++;
  } catch (err) {
    console.error(`ERROR ${e.address}: ${err.message}`);
    fail++;
  }
}
console.log(`\nResultado: ${ok} ok / ${fail} fallo`);
