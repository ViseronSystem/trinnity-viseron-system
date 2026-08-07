#!/usr/bin/env node
// Viseron Cosmos — Gera o DOCUMENTO DE ACESSO COMPLETO da wallet oficial.
// Escreve data/Viseron_Cosmos_Wallet_ACESSO.txt (gitignored) com:
//   - Endereço público
//   - Frase secreta (seed) — importar na Phantom como "Recovery Phrase"
//   - Chave privada base58 — formato que a Phantom pede para "Private Key"
//   - Keypair JSON (64 números) — formato do Solana CLI
// O ficheiro NÃO é impresso no terminal: abre-se no Bloco de Notas.
import * as fs from "node:fs";
import * as path from "node:path";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const KEYPAIR_FILE = path.join(__dirname, "solana-keypair.json");
const SEED_FILE = path.join(__dirname, "solana-seed.txt");
const OUT = path.join(ROOT, "data", "Viseron_Cosmos_Wallet_ACESSO.txt");

function main() {
  const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_FILE, "utf8"))));
  const seed = fs.readFileSync(SEED_FILE, "utf8").trim();
  const privBase58 = bs58.encode(Buffer.from(kp.secretKey.slice(0, 32)));
  const privFullBase58 = bs58.encode(Buffer.from(kp.secretKey));
  const jsonArray = JSON.stringify(Array.from(kp.secretKey));

  const doc = `════════════════════════════════════════════════════════════
  VISERON COSMOS — ACESSO COMPLETO DA CARTEIRA OFICIAL
  © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)
  CONFIDENCIAL — guarda este ficheiro OFFLINE. NUNCA partilhar.
════════════════════════════════════════════════════════════

REDE: SOLANA (mainnet)

1. ENDEREÇO PÚBLICO (para receber SOL e tokens)
   ${kp.publicKey.toBase58()}

2. FRASE SECRETA (SEED) — 12 palavras
   Importar na Phantom: Add Wallet → Import Recovery Phrase
   ${seed}

3. CHAVE PRIVADA — base58 (32 bytes)
   Formato que a Phantom pede em "Import Private Key"
   ${privBase58}

4. CHAVE PRIVADA COMPLETA — base58 (64 bytes)
   ${privFullBase58}

5. KEYPAIR JSON (64 números) — formato do Solana CLI
   (é o conteúdo de contracts/solana-keypair.json)
   ${jsonArray}

════════════════════════════════════════════════════════════
GUARDA ESTE DOCUMENTO:
- Em papel (2 cópias) e/ou num gestor de palavras-passe offline.
- NUNCA no GitHub, NUNCA no chat, NUNCA em screenshots.
- Se alguém tiver a frase ou a chave privada, controla a carteira.
════════════════════════════════════════════════════════════
`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, doc, "utf8");
  console.log("✅ Documento de acesso gerado:");
  console.log(`   ${OUT}`);
  console.log("   ABRE O FICHEIRO, GUARDA-O OFFLINE e APAGA o .txt depois.");
  console.log("");
  console.log("Endereço público da wallet: " + kp.publicKey.toBase58());
}

main();
