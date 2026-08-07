#!/usr/bin/env node
// Viseron Cosmos — Exporta a keypair da Phantom para contracts/solana-keypair.json
// A chave privada NUNCA é escrita no chat: é colada apenas no terminal local.
//
// Uso: node contracts/solana-export-helper.mjs
// Passos:
//   1. Phantom → ⚙️ Settings → Security → Export Private Key → Copy
//   2. Cola no terminal (a entrada fica escondida) e Enter
//   3. O script converte e grava contracts/solana-keypair.json (gitignored)
import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYPAIR_FILE = path.join(__dirname, "solana-keypair.json");
const EXPECTED = "3MbcNZBGJLiuGwUbsqjUvxpgipiuFKrNHVS9mZ6vwwrY";

function readHidden(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = () => {}; // esconde o que o utilizador digita/cola
    process.stdout.write(prompt);
    rl.question("", (answer) => {
      process.stdout.write("\n");
      rl.close();
      resolve(answer.trim());
    });
  });
}

function toKeypair(input) {
  const trimmed = input.replace(/^["']|["']$/g, "").trim();
  // Caso 1: array JSON [64 números] (formato keypair do CLI)
  if (trimmed.startsWith("[")) {
    const arr = JSON.parse(trimmed);
    if (!Array.isArray(arr) || arr.length < 64) throw new Error("array JSON inválido (precisa de 64 números)");
    return Keypair.fromSecretKey(Uint8Array.from(arr.slice(0, 64)));
  }
  // Caso 2: base58 (Phantom exporta o private key em base58)
  const bytes = bs58.decode(trimmed);
  if (bytes.length === 64) return Keypair.fromSecretKey(bytes);
  if (bytes.length === 32) return Keypair.fromSeed(bytes);
  throw new Error(`chave com tamanho inesperado (${bytes.length} bytes) — esperava 32 (base58) ou 64 (array)`);
}

async function main() {
  console.log("──────────────────────────────────────────────────────────");
  console.log("VISERON COSMOS — Exportar keypair da Phantom");
  console.log("──────────────────────────────────────────────────────────");
  console.log("1. Abre a Phantom → ⚙️ Settings → Security → Export Private Key");
  console.log("2. Copia a chave (string longa ou array JSON)");
  console.log("3. Cola aqui em baixo e carrega Enter (a entrada fica oculta)");
  console.log("");
  const input = await readHidden("   Chave privada > ");

  let kp;
  try {
    kp = toKeypair(input);
  } catch (e) {
    console.error(`\n❌ Erro a ler a chave: ${e.message}`);
    process.exit(1);
  }

  const pub = kp.publicKey.toBase58();
  console.log("");
  console.log(`Carteira exportada: ${pub}`);
  console.log(`Carteira esperada : ${EXPECTED}`);

  if (pub !== EXPECTED) {
    console.error("\n⚠️  A chave exportada NÃO corresponde à carteira 3MbcNZ...rY.");
    console.error("Exportaste da carteira certa? Se a tua carteira de liquidez for esta, re-executa.");
    console.error("Se a carteira esperada for outra, edita EXPECTED no início deste script.");
    process.exit(1);
  }

  const json = JSON.stringify(Array.from(kp.secretKey));
  fs.writeFileSync(KEYPAIR_FILE, json, "utf8");
  console.log(`\n✅ Keypair gravada em ${KEYPAIR_FILE}`);
  console.log("   (ficheiro gitignored — nunca vai para o GitHub)");
  console.log("\nPróximo passo: npm run cosmos:solana -- --mainnet");
}

main().catch((e) => { console.error("\n❌ ERRO:", e.message); process.exit(1); });
