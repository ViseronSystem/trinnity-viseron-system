#!/usr/bin/env node
// FUND-BURNERS — envia gas de la wallet oficial a las 10 wallets quemables farming.
// Ejecutar en el PC donde EXISTA contracts/solana-keypair.json con saldo.
// Uso: node contracts/fund-burners.mjs [solPorWallet] [--yes]
import fs from "node:fs";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import readline from "node:readline";

const BURNERS = [
  "6DgJewwXB3ELWSwDZ54bAbTnQo7KDtpmUD33XDYVbwUv",
  "9j6qA3eBABqGSzpMQK2bawKtM4WH9vbC3kg3DHHVyKqy",
  "AgVHC6U2pFHixMY8AyjwaXDi8AqTiccdWRPMRPzyD9JC",
  "BzeJvbc9jK7NxepJq429D885XCJYjvotcEdiw4FTp2f3",
  "5fFjgzTtMXRyHyKwUvyCegqd4fgTsqyps7nXf4Z8W7TQ",
  "FDKGWo3g5PbUWeBzxapJbwDSthCQC3H9MMbyyqCmDNho",
  "5jPQu4y3z4GvEPMdibwQ61W5PwosGHug3Fj3n6qeFPZg",
  "4zqR1eKCxyVPuQA6adsRDQsLEk3ifLXvXdgJCH79LenG",
  "3W5vg8wj4kgaoxRbVxkQCgYWQNTs4ev6uXyQ4ANHc6mF",
  "PRkw9jiPzyQiNZVNaWGdrjyDzzJsWQgE95H7ALY1qWK",
];

const args = process.argv.slice(2);
const perWallet = Math.min(parseFloat(args[0]) || 0.002, 0.01); // CAP duro: max 0.01 SOL/wallet sin editar codigo
const autoYes = args.includes("--yes");
const LAMPORTS = Math.floor(perWallet * 1e9);

const kpFile = new URL("./solana-keypair.json", import.meta.url);
if (!fs.existsSync(kpFile)) {
  console.error("ERROR: no existe contracts/solana-keypair.json en ESTE pc.");
  process.exit(1);
}
const kp = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(kpFile, "utf8"))));
const conn = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

const bal = await conn.getBalance(kp.publicKey);
const solBal = bal / 1e9;
const need = BURNERS.length * (LAMPORTS + 5000);
console.log(`Wallet origen : ${kp.publicKey.toBase58()}`);
console.log(`Saldo         : ${solBal.toFixed(6)} SOL`);
console.log(`Enviar        : ${BURNERS.length} x ${perWallet} SOL (+fees) = total ~${(need / 1e9).toFixed(6)} SOL`);

if (bal < need) {
  console.error(`SALDO INSUFICIENTE: faltan ${((need - bal) / 1e9).toFixed(6)} SOL`);
  process.exit(1);
}

if (!autoYes) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = await new Promise(r => rl.question("Escribe SI para confirmar: ", r));
  rl.close();
  if (ans.trim().toUpperCase() !== "SI") { console.log("Cancelado."); process.exit(0); }
}

let ok = 0;
for (const addr of BURNERS) {
  try {
    const tx = new Transaction().add(SystemProgram.transfer({
      fromPubkey: kp.publicKey,
      toPubkey: new PublicKey(addr),
      lamports: LAMPORTS,
    }));
    const sig = await sendAndConfirmTransaction(conn, tx, [kp]);
    console.log(`OK ${addr} -> ${sig}`);
    ok++;
  } catch (e) {
    console.error(`FALLO ${addr}: ${e.message}`);
  }
}
console.log(`\nCompletado: ${ok}/${BURNERS.length} wallets financiadas.`);
