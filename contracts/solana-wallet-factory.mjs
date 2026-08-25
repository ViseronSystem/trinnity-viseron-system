#!/usr/bin/env node
// VISERON COSMOS — FÁBRICA DE CARTEIRAS (Phantom, padrão oficial)
// Cria N carteiras Solana reais (BIP39 12 palavras, derivação Phantom m/44'/501'/0'/0').
// Cada carteira → keypair JSON + seed txt, e um documento único com TODOS os acessos.
//
// Uso:
//   node solana-wallet-factory.mjs            → 1 carteira
//   node solana-wallet-factory.mjs 50         → 50 carteiras
//   node solana-wallet-factory.mjs 50 --prefix clienteA
//
// Segurança (regras obrigatórias do TVS):
//   - Frase/chave privada NUNCA aparecem no terminal nem no chat.
//   - Tudo é escrito em ficheiros gitignored (contracts/wallets/ + data/).
//   - O documento de acesso abre-se no Bloco de Notas e guarda-se OFFLINE.
import * as fs from "node:fs";
import * as path from "node:path";
import bs58 from "bs58";
import { generateMnemonic, mnemonicToSeedSync } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WALLETS_DIR = path.join(__dirname, "wallets");

const COUNT_ARG = process.argv.find((a) => /^\d+$/.test(a));
const COUNT = COUNT_ARG ? Math.min(parseInt(COUNT_ARG, 10), 200) : 1;
const PREFIX_IDX = process.argv.indexOf("--prefix");
const PREFIX = PREFIX_IDX >= 0 && process.argv[PREFIX_IDX + 1] ? process.argv[PREFIX_IDX + 1] : "wallet";

function deriveKeypair(mnemonic) {
  const seed = mnemonicToSeedSync(mnemonic);
  const { key } = derivePath("m/44'/501'/0'/0'", Buffer.from(seed).toString("hex"));
  return Keypair.fromSeed(key);
}

function main() {
  fs.mkdirSync(WALLETS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
  const docPath = path.join(ROOT, "data", `Viseron_Wallets_Fabrica_${stamp}.txt`);
  const indexPath = path.join(WALLETS_DIR, "index.json");

  const wallets = [];
  let doc = "";
  doc += "════════════════════════════════════════════════════════════\n";
  doc += "  VISERON COSMOS — FÁBRICA DE CARTEIRAS (acesso completo)\n";
  doc += `  ${COUNT} carteiras · ${new Date().toISOString()}\n`;
  doc += "  © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)\n";
  doc += "  CONFIDENCIAL — guarda OFFLINE. NUNCA partilhar no chat/repo.\n";
  doc += "════════════════════════════════════════════════════════════\n\n";

  for (let i = 0; i < COUNT; i++) {
    const idx = String(i + 1).padStart(3, "0");
    const tag = `${PREFIX}_${idx}`;
    const mnemonic = generateMnemonic(wordlist, 128);
    const kp = deriveKeypair(mnemonic);
    const secret = Array.from(kp.secretKey);
    const privBase58 = bs58.encode(Buffer.from(kp.secretKey.slice(0, 32)));
    const privFullBase58 = bs58.encode(Buffer.from(kp.secretKey));
    const keypairJson = JSON.stringify(secret);

    // Ficheiros individuais por carteira (gitignored)
    const kpFile = path.join(WALLETS_DIR, `${tag}-keypair.json`);
    const seedFile = path.join(WALLETS_DIR, `${tag}-seed.txt`);
    fs.writeFileSync(kpFile, keypairJson, "utf8");
    fs.writeFileSync(seedFile, mnemonic + "\n", "utf8");

    wallets.push({
      id: tag,
      address: kp.publicKey.toBase58(),
      keypairFile: `contracts/wallets/${tag}-keypair.json`,
      seedFile: `contracts/wallets/${tag}-seed.txt`,
    });

    doc += `\n────────────────────────────────────────\n`;
    doc += `CARTEIRA ${i + 1}/${COUNT} — ${tag}\n`;
    doc += `────────────────────────────────────────\n`;
    doc += `1. ENDEREÇO PÚBLICO (para receber SOL/tokens)\n   ${kp.publicKey.toBase58()}\n`;
    doc += `2. FRASE SECRETA (SEED) — 12 palavras (Import Recovery Phrase na Phantom)\n   ${mnemonic}\n`;
    doc += `3. CHAVE PRIVADA — base58 32 bytes (Import Private Key na Phantom)\n   ${privBase58}\n`;
    doc += `4. CHAVE PRIVADA COMPLETA — base58 64 bytes\n   ${privFullBase58}\n`;
    doc += `5. KEYPAIR JSON (64 números) — formato Solana CLI\n   ${keypairJson}\n`;
  }

  doc += "\n════════════════════════════════════════════════════════════\n";
  doc += "GUARDA ESTE DOCUMENTO OFFLINE (papel + gestor de passwords).\n";
  doc += "NUNCA no GitHub, NUNCA no chat, NUNCA em screenshots.\n";
  doc += "Quem tem a frase controla a carteira.\n";
  doc += "════════════════════════════════════════════════════════════\n";

  fs.writeFileSync(docPath, doc, "utf8");
  fs.writeFileSync(indexPath, JSON.stringify({ createdAt: new Date().toISOString(), count: COUNT, prefix: PREFIX, wallets }, null, 2), "utf8");

  console.log("══════════════════════════════════════════════════");
  console.log(`FÁBRICA DE CARTEIRAS — ${COUNT} carteira(s) criada(s)`);
  console.log("══════════════════════════════════════════════════");
  console.log(`Documento de acesso (ABRE NO BLOCO DE NOTAS):`);
  console.log(`  ${docPath}`);
  console.log("");
  console.log("Keypairs + seeds (gitignored):");
  console.log(`  ${WALLETS_DIR}`);
  console.log("");
  console.log("ENDEREÇOS PÚBLICOS (podem partilhar-se):");
  for (const w of wallets) console.log(`  [${w.id}] ${w.address}`);
  console.log("");
  console.log("⚠  Frases/chaves privadas: só dentro do documento. NUNCA no chat.");
}

main();

