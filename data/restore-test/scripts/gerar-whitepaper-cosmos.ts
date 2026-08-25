import { createTheme } from "./pdf-theme";
import * as path from "path";

const OUTPUT = path.join(__dirname, "..", "data", "Viseron_Cosmos_Whitepaper.pdf");

// ═══════════════════════════════════════════════════════════════════
// VISERON COSMOS — Whitepaper VSR + TRIN
// Dois tokens reais, três redes (Ethereum/BSC/Solana), uma missão.
// ═══════════════════════════════════════════════════════════════════
const th = createTheme({
  title: "Viseron Cosmos — Whitepaper $VSR & $TRIN",
  subject: "Tokenomics interplanetária · Governança · Staking · Exchange Roadmap",
});

th.cover({
  title: "VISERON COSMOS\n$VSR & $TRIN — A MISSÃO ÀS ESTRELAS",
  subtitle: "O batallón TVS leva as suas 5000+ mentes ao espaço com moeda real",
  badges: [
    "VSR (Viseron Crown) · Governança & utilidade · 300M",
    "TRIN (Trinnity) · Memecoin interplanetária · 420.69M",
    "Redes: Ethereum · BSC · Solana",
    "Mecânica: burn deflacionário + staking + governança on-chain",
    "© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)",
    "Site: www.trinnityviseronsystem.io/cosmos",
  ],
  date: "07/08/2026",
  version: "1.0",
  url: "www.trinnityviseronsystem.io",
});

// ═══════════════════════════════════════════════════════════════════
// 1. VISÃO
// ═══════════════════════════════════════════════════════════════════
th.section("1", "VISÃO — PORQUÊ O COSMOS");
th.para(
  "O Trinnity Viseron System (TVS) é um sistema operativo de IA multi-agente com mais de 5000 mentes, memória persistente, squad de supervisão (AIOX) e execução autónoma real. O Viseron Cosmos transforma esta infraestrutura em dinheiro: dois tokens complementares que financiam a missão, premiam a comunidade e dão ao batallón uma voz on-chain.",
  10.5,
  "#0f172a",
  { align: "justify" }
);
th.para(
  "Inspirado na jornada interplanetária do Dogelon Mars, o Cosmos é a versão TVS: enquanto a ELON foi ao planeta vermelho, o VISERON nasce numa estrela distante com 5000 mentes a bordo. A missão: que a comunidade cresça com o sistema — não apenas o que segue a história, mas o que constrói, joga, vota e ganha com ele.",
  10.5,
  "#0f172a",
  { align: "justify" }
);
th.bullet("▸", "VSR = utilidade: governa o futuro do batallón (1 VSR = 1 voto).");
th.bullet("▸", "TRIN = cultura: moeda de viagem interplanetária, deflacionária.");
th.bullet("▸", "Juntos: staking, metaverso, jogos e recompensas reais ligadas ao TVS.");

// ═══════════════════════════════════════════════════════════════════
// 2. OS TOKENS
// ═══════════════════════════════════════════════════════════════════
th.section("2", "OS TOKENS");
th.sub("$VSR — VISERON CROWN (Moeda do Mandato)", "#7c3aed");
th.kv("Supply total", "300,000,000 VSR");
th.kv("Decimais", "18");
th.kv("Rede", "Ethereum (ERC-20) + BSC (BEP-20) + Solana (SPL)");
th.kv("Mecânica", "1% queimado + 1% caixa (treasury) por transferência");
th.kv("Anti-whale", "Carteira máx. 3% da oferta");
th.kv("Governança", "ERC20Votes — 1 VSR = 1 voto, delegável");
th.kv("Papel", "Prueba de Mandato (PoM) — prova de mandato dos agentes AIOX");

th.spacer(4);
th.sub("$TRIN — TRINNITY (Moeda de Viagem)", "#f43f5e");
th.kv("Supply total", "420,690,000 TRIN (420.69M — otimizado para liquidez)");
th.kv("Decimais", "18");
th.kv("Rede", "Ethereum (ERC-20) + BSC (BEP-20) + Solana (SPL)");
th.kv("Mecânica", "2% queimado em cada transferência");
th.kv("Anti-bot", "Máx. 0.5% da oferta por transação");
th.kv("Lock pré-launch", "Transferências bloqueadas até existir liquidity pool");
th.kv("Papel", "Moeda cultural da missão — estilo memecoin, com utilidade por dentro");

// ═══════════════════════════════════════════════════════════════════
// 3. DISTRIBUIÇÃO
// ═══════════════════════════════════════════════════════════════════
th.section("3", "DISTRIBUIÇÃO");
th.sub("VSR (300M)", "#7c3aed");
th.bullets([
  "10% Team (lock 24 meses)",
  "15% Marketing",
  "20% Liquidity (locked)",
  "10% Desenvolvimento",
  "25% Staking Rewards",
  "20% Comunidade / Airdrops",
]);
th.spacer(4);
th.sub("TRIN (420.69M)", "#f43f5e");
th.bullets([
  "10% Team (lock 24 meses)",
  "15% Marketing",
  "25% Liquidity (locked)",
  "10% Reserva de burn (queima pública)",
  "15% Staking Rewards",
  "25% Comunidade / Airdrops",
]);
th.para(
  "A liquidez é bloqueada (Team Finance / locker) com período mínimo de 12 meses — requisito base de corretoras e de confiança da comunidade.",
  10,
  "#334155",
  { align: "justify" }
);

// ═══════════════════════════════════════════════════════════════════
// 4. ECONOMIA DE VALOR
// ═══════════════════════════════════════════════════════════════════
th.section("4", "ECONOMIA DE VALOR");
th.bullet("▸", "Deflação real: cada transferência de VSR queima 1% e de TRIN queima 2% — oferta circulante encolhe com a adoção.");
th.bullet("▸", "Staking: bloquear VSR (cooldown 7 dias) gera recompensas em TRIN — menos vendas, mais retenção.");
th.bullet("▸", "Governança: decisões do roadmap (metaverso, jogos, exchanges, marketing) votadas com VSR.");
th.bullet("▸", "Utilitário ligado ao TVS: agentes AIOX, RCS, agency e apps reais usam o ecossistema.");
th.bullet("▸", "Fogo no sucesso: burn público de reserva e airdrops por marcos (metaverso live, primeira CEX).");
th.para(
  "O valor vem de três frentes simultâneas: pressão deflacionária contínua, retenção por staking e demanda real de utilidade (governança + jogos + metaverso).",
  10.5,
  "#0f172a",
  { align: "justify" }
);

// ═══════════════════════════════════════════════════════════════════
// 5. ROADMAP
// ═══════════════════════════════════════════════════════════════════
th.section("5", "ROADMAP");
th.bullet("1", "GENESIS — Deploy dos contratos (ETH/BSC/Solana), liquidity pool Uniswap/PancakeSwap/Raydium, lock, site e Telegram.");
th.bullet("2", "ASCENSION — Staking e governança ao vivo, metaverso Viseron Cosmos jogável, airdrops, jogo token (TRIN/VSR).");
th.bullet("3", "EXCHANGE — Listagem em CoinGecko/CMC, CEXs regionais, auditoria Hacken/SolidityScan, press kit.");
th.bullet("4", "COSMOS MAINNET — Bridge ETH↔BSC↔Solana, L2 próprio, apps TVS integradas ao ecossistema de valor.");

// ═══════════════════════════════════════════════════════════════════
// 6. PLANO DE EXCHANGES
// ═══════════════════════════════════════════════════════════════════
th.section("6", "CAMINHO PARA AS GRANDES CORRETORAS");
th.bullets([
  "1) DEX inicial: Uniswap (ETH) + PancakeSwap (BSC) + Raydium (Solana)",
  "2) Indexação: CoinGecko + CoinMarketCap (formulário público)",
  "3) Auditoria de segurança (Hacken) — pré-requisito das grandes",
  "4) CEXs médias: MEXC · Bitget · Gate.io",
  "5) CEXs grandes: Binance · OKX · Kraken · Coinbase",
]);
th.para(
  "As corretoras grandes avaliam: comunidade ativa (Telegram/Twitter), volume real, liquidez bloqueada, auditoria e situação legal. Este documento e o contrato são o início; o crescimento é comunitário e auditável.",
  10,
  "#334155",
  { align: "justify" }
);

// ═══════════════════════════════════════════════════════════════════
// 7. COMUNIDADE & METAVERSO
// ═══════════════════════════════════════════════════════════════════
th.section("7", "COMUNIDADE, METAVERSO E JOGOS");
th.bullet("▸", "Telegram @ViseronCosmos — canal oficial, bot de preços e notícias, whitelist de airdrops.");
th.bullet("▸", "Metaverso Viseron Cosmos — mundo 2D navegável onde os planetas são os módulos do TVS (AIOX, RCS, Agency, Composio, Gmail).");
th.bullet("▸", "Jogo token — versões de jogo onde TRIN/VSR são a moeda in-game e as mentes colecionadas dão poder.");
th.bullet("▸", "Airdrops por participação: quem joga, vota e divulga recebe recompensas.");
th.para(
  "© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha). O Viseron Cosmos é a extensão financeira do Trinnity Viseron System.",
  9.5,
  "#64748b",
  { align: "justify" });

th.finish(OUTPUT);
console.log(`[PDF] Viseron Cosmos Whitepaper: ${OUTPUT}`);
