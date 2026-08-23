// Radar de oportunidades cripto reales: hackathones activos + airdrops vetados + faucets
// Fuentes públicas. Sin auth. Guarda snapshot en data/crypto/oportunidades.json
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.resolve(__dirname, "..", "data", "crypto");

interface Hackathon { name: string; prize: string; deadline?: string; url?: string; }
interface Airdrop { name: string; cost?: string; risk?: string; url?: string; }
interface Report {
  generatedAt: string;
  hackathons: Hackathon[];
  airdrops: Airdrop[];
  faucets: Record<string, string[]>;
  errors: string[];
}

const SCAM_PATTERNS = /(send|private key|seed phrase|pay .*to claim|deposit.*unlock|connect.*seed)/i;

async function fetchHackathons(): Promise<{ items: Hackathon[]; err?: string }> {
  try {
    const res = await fetch("https://devpost.com/api/hackathons?status[]=open", {
      headers: { "User-Agent": "Mozilla/5.0 TVS-Radar/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { items: [], err: `devpost HTTP ${res.status}` };
    const json = (await res.json()) as any;
    const items: Hackathon[] = (json.hackathons || []).slice(0, 12).map((h: any) => ({
      name: h.title,
      prize: (() => { const amt = parseInt(String(h.prize_amount ?? "").replace(/[^0-9]/g, ""), 10); return amt > 0 ? `$${amt.toLocaleString()}` : "ver página"; })(),
      deadline: h.submission_due_date,
      url: h.url,
    }));
    return { items };
  } catch (e: any) {
    return { items: [], err: `devpost: ${e.message}` };
  }
}

async function fetchAirdrops(): Promise<{ items: Airdrop[]; err?: string }> {
  try {
    const res = await fetch("https://airdrops.io/latest/", {
      headers: { "User-Agent": "Mozilla/5.0 TVS-Radar/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { items: [], err: `airdrops.io HTTP ${res.status}` };
    const html = await res.text();
    const seen = new Set<string>();
    const items: Airdrop[] = [];
    const re = /<h3[^>]*>([^<]{3,80})<\/h3>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) && items.length < 15) {
      const name = m[1].trim();
      if (seen.has(name)) continue;
      seen.add(name);
      // Vetado: descartar titulos con patrones tipicos de estafa
      const risk = SCAM_PATTERNS.test(name) ? "FLAG: revisar antes" : "ok";
      items.push({ name, url: "https://airdrops.io/?s=" + encodeURIComponent(name), risk });
    }
    return { items };
  } catch (e: any) {
    return { items: [], err: `airdrops.io: ${e.message}` };
  }
}

function faucetsStatic(): Record<string, string[]> {
  return {
    solana_devnet: ["https://faucet.solana.com/", "https://solfaucet.com/"],
    ethereum_sepolia: ["https://sepoliafaucet.com/", "https://www.alchemy.com/faucets/ethereum-sepolia"],
    base_sepolia: ["https://www.coinbase.com/faucets/base-ethereum-goerli-faucet", "https://faucet.quicknode.com/base/sepolia"],
    bsc_testnet: ["https://testnet.bnbchain.org/faucet-smart"],
    polygon_amoy: ["https://faucet.polygon.technology/"],
    nota: "Los faucets MAINNET no existen gratis: mainnet requiere capital propio. Faucets sirven para testnet/demos.",
  };
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const errors: string[] = [];
  const [hk, ad] = await Promise.all([fetchHackathons(), fetchAirdrops()]);
  if (hk.err) errors.push(hk.err);
  if (ad.err) errors.push(ad.err);

  const report: Report = {
    generatedAt: new Date().toISOString(),
    hackathons: hk.items,
    airdrops: ad.items.filter(a => !a.risk?.startsWith("FLAG")),
    faucets: faucetsStatic(),
    errors,
  };

  const file = path.join(DATA_DIR, "oportunidades.json");
  fs.writeFileSync(file, JSON.stringify(report, null, 2));

  console.log("=== RADAR DE OPORTUNIDADES CRIPTO ===");
  console.log(`Fecha: ${report.generatedAt}`);
  console.log(`\n--- HACKATHONES ABIERTOS (${report.hackathons.length}) ---`);
  for (const h of report.hackathons.slice(0, 8)) {
    console.log(`  ${h.prize.padEnd(14)} ${h.name}`);
  }
  console.log(`\n--- AIRDROPS VETADOS (${report.airdrops.length}) ---`);
  for (const a of report.airdrops.slice(0, 10)) {
    console.log(`  ${a.name}  ->  ${a.url}`);
  }
  console.log(`\n--- FAUCETS (testnet) ---`);
  for (const [k, v] of Object.entries(report.faucets)) {
    if (Array.isArray(v)) console.log(`  ${k}: ${v[0]}`);
  }
  if (errors.length) console.log(`\n[avisos] ${errors.join(" | ")}`);
  console.log(`\nSnapshot: ${file}`);
}

main().catch(e => { console.error("radar fallo:", e.message); process.exit(1); });

