#!/usr/bin/env node
// Viseron Cosmos — Solana SPL go-live (VSR · TRIN)
// Cria mints + minta o supply para a wallet de treasury.
//
// Uso: node solana-go-live.mjs [--mainnet|--devnet]
// Exige contracts/solana-keypair.json (gitignored) com a chave privada exportada
// da Phantom (Settings → Export Private Key → copia o array JSON).
// Exige SOL na wallet para o rent + fees.
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

const SUPPLY = {
  VSR: { supply: 300_000_000n, decimals: 9, name: "Viseron Crown", symbol: "VSR" },
  TRIN: { supply: 420_690_000_000n, decimals: 9, name: "Trinnity", symbol: "TRIN" },
};

function loadKeypair() {
  if (!fs.existsSync(KEYPAIR_FILE)) {
    console.error(`
❌ Ficheiro de keypair não encontrado: ${KEYPAIR_FILE}
Passos:
  1. Abre a Phantom → Settings → Export Private Key (colar a frase NÃO funciona aqui).
  2. Copia o array JSON [...,...] (64 números + o de baixo).
  3. Cria ${KEYPAIR_FILE} com o conteúdo JSON exato do passo 2.
  4. NUNCA commitar este ficheiro (já está no .gitignore).
`);
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

async function createMint(conn, payer, token, dest) {
  console.log(`\n[${token.symbol}] Criando mint...`);
  const mint = await spl.createMint(conn, payer, payer.publicKey, payer.publicKey, token.decimals);
  console.log(`  mint      : ${mint.toBase58()}`);

  console.log(`[${token.symbol}] Criando conta do owner...`);
  const ownerAta = await spl.getOrCreateAssociatedTokenAccount(conn, payer, mint, payer.publicKey);
  console.log(`  ata owner : ${ownerAta.address.toBase58()}`);

  const supply = token.supply * 10n ** BigInt(token.decimals);
  console.log(`[${token.symbol}] Mintando ${token.supply.toLocaleString()} ${token.symbol} (${supply} unidades base)...`);
  const sig = await spl.mintTo(conn, payer, mint, ownerAta.address, payer, supply);
  console.log(`  mint tx   : ${sig}`);

  console.log(`[${token.symbol}] Revogando mint authority (imprime-se em 2 txs)...`);
  await spl.setAuthority(conn, payer, mint, payer.publicKey, spl.AuthorityType.MintTokens, null);
  console.log(`  mint authority revogado ✓`);

  return {
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    supply: token.supply.toString(),
    mint: mint.toBase58(),
    ownerAta: ownerAta.address.toBase58(),
    owner: payer.publicKey.toBase58(),
  };
}

async function main() {
  const payer = loadKeypair();
  const conn = new web3.Connection(NET.url, "confirmed");
  const bal = await conn.getBalance(payer.publicKey);
  console.log(`\n⚠  REDE: ${NET.name.toUpperCase()}  (${NET.url})`);
  console.log(`Carteira: ${payer.publicKey.toBase58()}`);
  console.log(`Balance : ${(bal / 1e9).toFixed(6)} SOL`);

  const minRent = await conn.getMinimumBalanceForRentExemption(82);
  const minRentBig = BigInt(minRent);
  console.log(`Rent mínimo por mint: ${(Number(minRentBig) / 1e9).toFixed(6)} SOL`);
  if (bal < minRentBig * 4n) {
    console.error(`\n❌ SOL insuficiente. Precisas de pelo menos ${(Number(minRentBig) * 4 / 1e9).toFixed(4)} SOL.`);
    process.exit(1);
  }

  const results = [];
  for (const tok of [SUPPLY.VSR, SUPPLY.TRIN]) {
    const r = await createMint(conn, payer, tok, payer.publicKey);
    results.push(r);
  }

  const snapshot = {
    network: NET.name,
    deployedAt: Date.now(),
    key: "solana",
    tokens: results,
  };
  fs.mkdirSync(path.dirname(MINT_FILE), { recursive: true });
  fs.writeFileSync(MINT_FILE, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`\n✅ Snapshot gravado: ${MINT_FILE}`);

  console.log("\n========== RESUMO GO-LIVE SOLANA ==========");
  for (const r of results) {
    console.log(`\n${r.symbol} (${r.name})`);
    console.log(`  Mint : ${r.mint}`);
    console.log(`  Supply mintado: ${r.supply} ${r.symbol} (9 decimais)`);
  }
  console.log("\nPróximo passo: criar a pool na Raydium (ver runbook).");
}

main().catch((e) => { console.error("\n❌ ERRO:", e.message); process.exit(1); });
