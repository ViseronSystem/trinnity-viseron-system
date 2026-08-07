import * as fs from "fs";
import * as path from "path";
import { createTheme } from "./pdf-theme";

// ═══════════════════════════════════════════════════════════════════
// PDF CONTRATOS — VISERON COSMOS ($VSR · $TRIN)
// Trilingue (PT/ES/EN): tokenomics, contratos, endereços, deploy, roadmap.
// © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)
// ═══════════════════════════════════════════════════════════════════

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "Viseron_Cosmos_Contratos.pdf");

function loadDeployments(): Record<string, any> {
  const f = path.join(ROOT, "contracts", "deployments.json");
  if (!fs.existsSync(f)) return {};
  try {
    return JSON.parse(fs.readFileSync(f, "utf-8"));
  } catch {
    return {};
  }
}
function loadTokenomics(): Record<string, any> {
  const f = path.join(ROOT, "contracts", "tokenomics.json");
  if (!fs.existsSync(f)) return {};
  try {
    return JSON.parse(fs.readFileSync(f, "utf-8"));
  } catch {
    return {};
  }
}

const dep = loadDeployments();
const tok = loadTokenomics();
const addr = (k: string) => (dep[k] && dep[k].address ? dep[k].address : "— (deploy real pendente)");

const t = createTheme({
  title: "Viseron Cosmos — Contracts | Contratos | Contratos",
  subject: "$VSR · $TRIN — tokenomics, addresses, deploy & roadmap (PT/ES/EN)",
});

t.cover({
  title: "VISERON COSMOS\nCONTRATOS & TOKENOMICS",
  subtitle: "Contracts & Tokenomics | Contratos y Tokenomía | Contratos e Tokenomics",
  badges: ["$VSR 300M", "$TRIN 420.69B", "Ethereum", "BSC", "Solana", "Staking", "Governança", "Burn deflacionário"],
  date: "07/08/2026",
  version: "1.1",
  url: "www.trinnityviseronsystem.io/cosmos",
});
t.para("AUTORIA & PROPRIEDADE INTELECTUAL — © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha). Todos os direitos reservados · All rights reserved · Todos los derechos reservados.", 10, "#7c3aed");

// ─── 1. TOKENS ───
t.section("1", "Tokens · Tokens · Tokens");
t.sub("$VSR — VISERON CROWN (Governança)", "#7c3aed");
t.kv("Supply total / Total supply", "300,000,000 VSR");
t.kv("Mecânica", "1% burn + 1% treasury por transferência");
t.kv("Anti-whale", "Máx. 3% por carteira / Max 3% per wallet");
t.kv("Governança", "ERC20Votes · 1 VSR = 1 voto delegável");
t.kv("Papel", "Prueba de Mandato (PoM) — voz dos agentes AIOX");

t.spacer(3);
t.sub("$TRIN — TRINNITY (Moeda de Viagem)", "#f43f5e");
t.kv("Supply total / Total supply", "420,690,000,000 TRIN (420.69B)");
t.kv("Mecânica", "2% queimado por transferência / 2% burned per transfer");
t.kv("Anti-bot", "Máx. 0.5% da oferta por transação / 0.5% max per tx");
t.kv("Lock pré-launch", "Transferências bloqueadas até existir pool / blocked until pool");
t.kv("Papel", "Moeda cultural da missão, otimizada para liquidez");

// ─── 2. CONTRATOS ───
t.section("2", "Contratos EVM (Ethereum + BSC)");
t.sub("Deploy local verificado (rede hardhat) / Local verified deploy", "#22c55e");
t.kv("ViseronCrown (VSR)", addr("VSR"));
t.kv("Trinnity (TRIN)", addr("TRIN"));
t.kv("ViseronStaking", addr("Staking"));
t.kv("ViseronGovernance", addr("Governance"));
t.para("Deploy real requer chave privada + gás (ETH/BNB). NUNCA versionar a chave. Real deploy requires private key + gas. NUNCA versionar la clave.", 9.5, "#ef4444");

t.sub("Ficheiros / Files / Archivos");
t.code("contracts/sol/ViseronCrown.sol", "VSR — ERC20 + Votes + burn + tax + anti-whale");
t.code("contracts/sol/Trinnity.sol", "TRIN — ERC20 + burn 2% + anti-bot + lock");
t.code("contracts/sol/ViseronStaking.sol", "Stake VSR → recompensas TRIN");
t.code("contracts/sol/ViseronGovernance.sol", "Governança on-chain com VSR");
t.code("contracts/scripts/deploy.cjs", "Deploy EVM (Hardhat) automático");
t.code("contracts/tokenomics.json", "Distribuição + roadmap + plano exchanges");

t.sub("Comandos / Commands");
t.code("cd contracts && npm install", "instala hardhat + OZ + ethers");
t.code("npx hardhat compile --force", "compila (solc 0.8.20)");
t.code("npx hardhat run scripts/deploy.cjs --network hardhat", "deploy local de teste");
t.code("npx hardhat run scripts/deploy.cjs --network ethereum", "deploy real Ethereum (via contracts/.env)");

// ─── 3. SOLANA ───
t.section("3", "Solana (SPL)");
t.code("spl-token create-token --decimals 9", "criar mint VSR / TRIN");
t.code("spl-token mint <VSR_MINT> 300000000000000000000000000 <dest>", "VSR 300M (9 decimais)");
t.code("spl-token mint <TRIN_MINT> 420690000000000000000000000 <dest>", "TRIN 420,690,000,000 (420.69B, 9 decimais)");
t.kv("Metadata VSR", "contracts/solana/vsr-metadata.json");
t.kv("Metadata TRIN", "contracts/solana/trin-metadata.json");
t.para("Liquidez: Raydium CLMM ou Jupiter. Liquidity via Raydium or Jupiter.", 9.5, "#334155");

// ─── 4. DISTRIBUIÇÃO ───
t.section("4", "Distribuição · Distribution · Distribución");
if (tok.tokens) {
  const vsr = tok.tokens.VSR, trin = tok.tokens.TRIN;
  t.sub("VSR (300M)", "#7c3aed");
  const d1 = vsr.distribution || {};
  t.bullets([
    `Team (lock 24m) ${d1.team}%`,
    `Marketing ${d1.marketing}%`,
    `Liquidity (locked) ${d1.liquidity}%`,
    `Development ${d1.development}%`,
    `Staking Rewards ${d1.stakingRewards}%`,
    `Community / Airdrops ${d1.community}%`,
  ]);
  t.spacer(3);
  t.sub("TRIN (420.69B)", "#f43f5e");
  const d2 = trin.distribution || {};
  t.bullets([
    `Team (lock 24m) ${d2.team}%`,
    `Marketing ${d2.marketing}%`,
    `Liquidity (locked) ${d2.liquidity}%`,
    `Burn Reserve ${d2.burnReserve}%`,
    `Staking Rewards ${d2.stakingRewards}%`,
    `Community / Airdrops ${d2.community}%`,
  ]);
}

// ─── 5. ROADMAP ───
t.section("5", "Roadmap · Hoja de ruta · Rota");
if (Array.isArray(tok.roadmap)) {
  for (const r of tok.roadmap) t.bullet("▸", `${r.phase}. ${r.title} — ${r.desc}`);
}
t.sub("Plano de Exchanges / Exchange Plan");
if (tok.exchangePlan) {
  const ep = tok.exchangePlan;
  for (let i = 1; i <= 5; i++) {
    const key = `step${i}`;
    if (ep[key]) t.bullet("▸", ep[key]);
  }
  t.para(`Requisitos: ${(ep.requisites || []).join(" · ")}`, 9.5, "#64748b");
}

// ─── 6. SEGURANÇA ───
t.section("6", "Segurança · Security · Seguridad");
t.bullet("▸", "Liquidez bloqueada ≥12 meses (Team Finance / locker)");
t.bullet("▸", "Auditoria Hacken antes de CEXs grandes");
t.bullet("▸", "NUNCA commitar chave privada nem deployments.json");
t.bullet("▸", "Verificação do código no Etherscan/BSCScan (compilador 0.8.20, MIT)");

t.spacer(1);
t.para("© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) · Viseron Cosmos — CONFIDENCIAL", 9, "#7c3aed", { align: "center" });
t.para(`Gerado pelo Squad AIOX · ${new Date().toLocaleDateString("pt-PT")}`, 8.5, "#64748b", { align: "center" });

const pages = t.page();
t.finish(OUT);
setTimeout(() => {
  const size = fs.statSync(OUT).size;
  console.log(`✅ Viseron_Cosmos_Contratos.pdf gerado — ${(size / 1024).toFixed(1)} KB · ${pages} páginas`);
}, 800);
