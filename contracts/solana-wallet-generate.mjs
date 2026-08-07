#!/usr/bin/env node
// Viseron Cosmos — Gera a carteira oficial + frase secreta (BIP39, padrão Phantom)
// Escreve:
//   contracts/solana-keypair.json   (64-byte secretKey, gitignored — usada no deploy)
//   contracts/solana-seed.txt       (a frase de recuperação, gitignored — PARA GUARDARES)
// A frase NUNCA é impressa no terminal nem no chat: só aparece no ficheiro local.
import * as fs from "node:fs";
import * as path from "node:path";
import { generateMnemonic, mnemonicToSeedSync } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYPAIR_FILE = path.join(__dirname, "solana-keypair.json");
const SEED_FILE = path.join(__dirname, "solana-seed.txt");

function deriveKeypair(mnemonic) {
  const seed = mnemonicToSeedSync(mnemonic);
  // Phantom deriva a primeira conta com m/44'/501'/0'/0'
  const { key } = derivePath("m/44'/501'/0'/0'", Buffer.from(seed).toString("hex"));
  return Keypair.fromSeed(key);
}

async function main() {
  const mnemonic = generateMnemonic(wordlist, 128); // 12 palavras
  const kp = deriveKeypair(mnemonic);

  fs.writeFileSync(KEYPAIR_FILE, JSON.stringify(Array.from(kp.secretKey)), "utf8");
  fs.writeFileSync(SEED_FILE, mnemonic, "utf8");

  console.log("════════════════════════════════════════════════");
  console.log("WALLET VISERON COSMOS — CRIADA COM SUCESSO");
  console.log("════════════════════════════════════════════════");
  console.log(`Endereço público : ${kp.publicKey.toBase58()}`);
  console.log("");
  console.log(`Frase secreta    : ${SEED_FILE}`);
  console.log("   → ABRE ESTE FICHEIRO, GUARDA A FRASE EM PAPEL,");
  console.log("     E APAGA-O DEPOIS DE GUARDAR. Nunca no chat.");
  console.log("");
  console.log(`Keypair (deploy) : ${KEYPAIR_FILE}`);
  console.log("");
  console.log("PRÓXIMO PASSO: envia SOL da tua Phantom para o endereço acima.");
}

main().catch((e) => { console.error("\n❌ ERRO:", e.message); process.exit(1); });
