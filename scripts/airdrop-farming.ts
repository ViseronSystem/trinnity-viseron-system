// Motor de farming de airdrops — wallets quemables × tareas diarias por protocolo
// Modo PLAN (default): genera el plan del día + verifica saldos. Sin gas no ejecuta nada.
import * as fs from "fs";
import * as path from "path";

const WALLETS_INDEX = path.resolve(__dirname, "..", "contracts", "wallets", "index.json");
const DATA_DIR = path.resolve(__dirname, "..", "data", "crypto");
const RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";

interface WalletEntry { id?: string; address: string; keypairPath?: string; seedPath?: string; }

async function getBalance(address: string): Promise<number> {
  try {
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [address] }),
      signal: AbortSignal.timeout(10000),
    });
    const j = (await res.json()) as any;
    return ((j?.result?.value ?? 0) / 1e9);
  } catch {
    return -1;
  }
}

// Tareas típicas de farming Solana (baratas: ~0.000005 SOL/tx)
const TASKS = [
  { protocolo: "Jupiter", accion: "swap minimo SOL->USDC y vuelta", costoSol: 0.00002, prioridad: "alta" },
  { protocolo: "Kamino", accion: "deposito simbolico en vault LST", costoSol: 0.00005, prioridad: "media" },
  { protocolo: "Jito", accion: "stake minimo con JitoSOL", costoSol: 0.00005, prioridad: "media" },
  { protocolo: "Tensor/MagicEden", accion: "mint gratuito de coleccion nueva", costoSol: 0, prioridad: "baja" },
];

function loadAirdropWallets(): WalletEntry[] {
  if (!fs.existsSync(WALLETS_INDEX)) return [];
  const idx = JSON.parse(fs.readFileSync(WALLETS_INDEX, "utf8")) as any;
  const list = Array.isArray(idx) ? idx : idx.wallets || Object.values(idx).flat();
  return (list as any[]).filter(w => JSON.stringify(w).includes("airdrop") && w.address);
}

async function main() {
  const wallets = loadAirdropWallets();
  console.log(`=== FARMING ENGINE — ${new Date().toISOString()} ===`);
  console.log(`Wallets quemables detectadas: ${wallets.length}`);

  let funded = 0;
  for (const w of wallets) {
    const bal = await getBalance(w.address);
    if (bal > 0) funded++;
    console.log(`  ${w.address}  ${bal < 0 ? "(rpc fallo)" : bal.toFixed(6) + " SOL"}`);
  }

  console.log(`\n--- PLAN DE HOY (${TASKS.length} tareas x ${wallets.length} wallets) ---`);
  for (const t of TASKS) {
    console.log(`  [${t.prioridad}] ${t.protocolo}: ${t.accion}`);
  }
  const totalCost = TASKS.reduce((s, t) => s + t.costoSol * Math.max(1, wallets.length), 0);
  console.log(`\nGas total estimado del ciclo: ${totalCost.toFixed(6)} SOL (~$${(totalCost * 200).toFixed(2)})`);

  if (funded === 0) {
    console.log("\n[ESTADO] Ninguna wallet financiada -> motor en modo PLAN.");
    console.log("Para activar ejecucion automatica: envia ~0.01-0.05 SOL a cada wallet (o a la primera) y re-ejecuta.");
  } else {
    console.log(`\n[ESTADO] ${funded} wallets con saldo -> listo para modo EJECUCION (requiere integracion Jupiter API).`);
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(DATA_DIR, `farming-${new Date().toISOString().slice(0, 10)}.json`),
    JSON.stringify({ generatedAt: new Date().toISOString(), wallets: wallets.map((w, i) => ({ address: w.address })), tasks: TASKS, funded }, null, 2)
  );
  console.log(`Snapshot: data/crypto/farming-<hoy>.json`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
