#!/usr/bin/env node
// Viseron Cosmos — Correção do mint TRIN na Solana
// 1) Cria um mint TRIN NOVO com 420.69M (420_690_000n × 10^9 = 4.2e17 base, cabe em u64).
// 2) Minta o supply para a wallet.
// 3) VERIFICA o supply on-chain ANTES de revogar authority (lição do erro anterior).
// 4) Revoga a mint authority.
// 5) Queima os TRIN do mint antigo (36DgSEod...) e fecha a ATA antiga (reavê o rent).
// 6) Atualiza contracts/solana/mints.json.
//
// Uso: node solana-fix-trin.mjs [--mainnet|--devnet]
import * as fs from "node:fs";
import * as path from "node:path";
import * as web3 from "@solana/web3.js";
import * as spl from "@solana/spl-token";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYPAIR_FILE = path.join(__dirname, "solana-keypair.json");
const MINT_FILE = path.join(__dirname, "solana", "mints.json");
const NET = process.argv.includes("--devnet")
  ? { name: "devnet", url: web3.clusterApiUrl("devnet") }
  : { name: "mainnet", url: web3.clusterApiUrl("mainnet-beta") };

const NEW_TRIN = { supply: 420_690_000n, decimals: 9, name: "Trinnity", symbol: "TRIN" };
const OLD_TRIN_MINT = "36DgSEodzm4kCu56CY3nkXSGKK6Tr2PNvNV9ha5Mbe2j";
const OLD_TRIN_ATA = "5yTFyAPKN19AfQQHrjVJefQLuftf4VSpxMfayWBDEmfA";

function loadKeypair() {
  if (!fs.existsSync(KEYPAIR_FILE)) {
    console.error(`\n❌ Ficheiro de keypair não encontrado: ${KEYPAIR_FILE}`);
    process.exit(1);
  }
  try {
    const data = JSON.parse(fs.readFileSync(KEYPAIR_FILE, "utf8"));
    const arr = Array.isArray(data) ? data : data.secretKey;
    if (!Array.isArray(arr) || arr.length < 64) throw new Error("formato inválido");
    return web3.Keypair.fromSecretKey(Uint8Array.from(arr));
  } catch (e) {
    console.error("❌ Keypair inválida:", e.message);
    process.exit(1);
  }
}

async function main() {
  const payer = loadKeypair();
  const conn = new web3.Connection(NET.url, "confirmed");
  const bal = await conn.getBalance(payer.publicKey);
  console.log(`\n⚠  REDE: ${NET.name.toUpperCase()}`);
  console.log(`Carteira: ${payer.publicKey.toBase58()}`);
  console.log(`Balance : ${(bal / 1e9).toFixed(6)} SOL`);

  const supply = NEW_TRIN.supply * 10n ** BigInt(NEW_TRIN.decimals);
  const U64_MAX = 2n ** 64n - 1n;
  if (supply > U64_MAX) {
    console.error(`❌ ${supply} excede u64 — supply/decimais incompatíveis.`);
    process.exit(1);
  }
  console.log(`\nNovo supply TRIN: 420.690.000 (${supply} unidades base — cabe em u64 ✓)`);

  // ── 1+2+3: mint novo, ATA, mintar, VERIFICAR antes de revogar ──
  console.log(`\n[TRIN] Criando mint NOVO...`);
  const mint = await spl.createMint(conn, payer, payer.publicKey, payer.publicKey, NEW_TRIN.decimals);
  console.log(`  mint      : ${mint.toBase58()}`);

  const ownerAta = await spl.getOrCreateAssociatedTokenAccount(conn, payer, mint, payer.publicKey);
  console.log(`  ata owner : ${ownerAta.address.toBase58()}`);

  console.log(`[TRIN] Mintando ${NEW_TRIN.supply.toLocaleString()} TRIN (${supply} base)...`);
  const sigMint = await spl.mintTo(conn, payer, mint, ownerAta.address, payer, supply);
  console.log(`  mint tx   : ${sigMint}`);

  console.log(`[TRIN] VERIFICANDO supply on-chain (antes de revogar)...`);
  const check = await conn.getTokenSupply(mint, "confirmed");
  if (check.value.amount !== supply.toString()) {
    console.error(`❌ SUPPLY ON-CHAIN ${check.value.amount} ≠ ${supply} — ABORTADO, authority NÃO revogada.`);
    process.exit(1);
  }
  console.log(`  supply on-chain OK ✓ (${check.value.uiAmountString} TRIN)`);

  console.log(`[TRIN] Revogando mint authority...`);
  await spl.setAuthority(conn, payer, mint, payer.publicKey, spl.AuthorityType.MintTokens, null);
  console.log(`  mint authority revogado ✓`);

  // ── 5: queimar o mint antigo + fechar ATA antiga ──
  console.log(`\n[TRIN-OLD] Queimando TRIN do mint antigo...`);
  const oldMint = new web3.PublicKey(OLD_TRIN_MINT);
  const oldAta = new web3.PublicKey(OLD_TRIN_ATA);
  const oldBal = await conn.getTokenAccountBalance(oldAta, "confirmed");
  const oldAmount = BigInt(oldBal.value.amount);
  console.log(`  saldo antigo: ${oldBal.value.uiAmountString} TRIN`);
  if (oldAmount > 0n) {
    const sigBurn = await spl.burn(conn, payer, oldAta, oldMint, payer, oldAmount);
    console.log(`  burn tx    : ${sigBurn}`);
  } else {
    console.log(`  sem saldo, nada a queimar`);
  }
  const sigClose = await spl.closeAccount(conn, payer, oldAta, payer.publicKey, payer);
  console.log(`  ATA antiga fechada (rent reavido) ✓ : ${sigClose}`);

  // ── 6: atualizar mints.json ──
  const existing = fs.existsSync(MINT_FILE)
    ? JSON.parse(fs.readFileSync(MINT_FILE, "utf8"))
    : { network: NET.name, deployedAt: Date.now(), key: "solana", tokens: [] };
  existing.network = NET.name;
  const newTrin = {
    symbol: NEW_TRIN.symbol,
    name: NEW_TRIN.name,
    decimals: NEW_TRIN.decimals,
    supply: NEW_TRIN.supply.toString(),
    mint: mint.toBase58(),
    ownerAta: ownerAta.address.toBase58(),
    owner: payer.publicKey.toBase58(),
  };
  existing.tokens = existing.tokens.filter((t) => t.symbol !== "TRIN");
  existing.tokens.push(newTrin);
  existing.tokens.push({
    symbol: "TRIN_OLD_ABANDONED",
    name: "Trinnity (mint defeituoso, abandonado)",
    decimals: 9,
    supply: "1643320312500000000",
    mint: OLD_TRIN_MINT,
    ownerAta: OLD_TRIN_ATA,
    owner: payer.publicKey.toBase58(),
    note: "supply parcial 1.643B (erro u64) — queimado e fechado",
  });
  fs.mkdirSync(path.dirname(MINT_FILE), { recursive: true });
  fs.writeFileSync(MINT_FILE, JSON.stringify(existing, null, 2), "utf8");
  console.log(`\n✅ mints.json atualizado`);

  console.log("\n========== RESUMO CORREÇÃO TRIN ==========");
  console.log(`  Mint NOVO  : ${mint.toBase58()}`);
  console.log(`  Supply     : ${NEW_TRIN.supply.toLocaleString()} TRIN (9 decimais)`);
  console.log(`  Owner ATA  : ${ownerAta.address.toBase58()}`);
  console.log(`  Mint antigo: ${OLD_TRIN_MINT} (queimado + ATA fechada)`);
  console.log("\nPróximo passo: metadata (logo trin.png) + pool Raydium (ver runbook).");
}

main().catch((e) => { console.error("\n❌ ERRO:", e.message); process.exit(1); });
