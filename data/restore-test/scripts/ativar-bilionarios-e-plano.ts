import * as fs from "fs";
import * as path from "path";
import { createTheme } from "./pdf-theme";

const MINDS_PATH = path.resolve("data/minds/minds.json");
const BATTALION_PATH = path.resolve("src/core/standard/battalion.ts");
const PDF_OUTPUT = path.resolve("data/reports/plano-100k-semana.pdf");
const MINDS_BACKUP = path.resolve("data/minds/minds.json.bak");

// ============================================================
// 1. NOVAS MENTES BILIONARIAS
// ============================================================
const newMinds = [
  {
    id: "mind_343_elon_musk",
    name: "Elon Musk",
    era: "contemporanea",
    origin: "sul-africano",
    wisdom: 97,
    specialties: ["engenharia", "empreendedorismo", "inovacao-disruptiva", "visao-futurista", "neurociencia", "exploracao-espacial"],
    personality: ["visionario", "obsessivo", "disruptivo", "workaholic"],
    knowledge: ["fisica", "engenharia-aeroespacial", "inteligencia-artificial", "energia-sustentavel", "biotecnologia"],
    symbol: "X",
  },
  {
    id: "mind_344_donald_trump",
    name: "Donald Trump",
    era: "contemporanea",
    origin: "norte-americano",
    wisdom: 88,
    specialties: ["negociacao-imobiliaria", "marca-pessoal", "midia", "lideranca", "estrategia-de-negocios", "marketing"],
    personality: ["assertivo", "carismatico", "estrategista", "resiliente"],
    knowledge: ["mercado-imobiliario", "construcao-civil", "branding", "negociacao", "politica"],
    symbol: "T",
  },
  {
    id: "mind_345_robert_kiyosaki",
    name: "Robert Kiyosaki",
    era: "contemporanea",
    origin: "norte-americano",
    wisdom: 92,
    specialties: ["educacao-financeira", "investimento-imobiliario", "empreendedorismo", "liberdade-financeira", "business-modeling"],
    personality: ["didatico", "provocador", "estrategista", "visionario"],
    knowledge: ["investimentos", "renda-passiva", "real-estate", "educacao-financeira", "negocios"],
    symbol: "R",
  },
  {
    id: "mind_346_ray_dalio",
    name: "Ray Dalio",
    era: "contemporanea",
    origin: "norte-americano",
    wisdom: 95,
    specialties: ["macro-investimentos", "economia-global", "gestao-de-risco", "principios-de-vida", "data-driven"],
    personality: ["analitico", "disciplinado", "principled", "sistemico"],
    knowledge: ["economia", "mercado-global", "alocacao-de-ativos", "machine-learning", "ciclos-economicos"],
    symbol: "D",
  },
  {
    id: "mind_347_jeff_bezos",
    name: "Jeff Bezos",
    era: "contemporanea",
    origin: "norte-americano",
    wisdom: 96,
    specialties: ["e-commerce", "cloud-computing", "logistica", "inovacao", "customer-obsession"],
    personality: ["calculista", "visionario", "estrategista", "focado"],
    knowledge: ["varejo-digital", "aws", "logistica-global", "midia", "exploracao-espacial"],
    symbol: "B",
  },
  {
    id: "mind_348_warren_buffett",
    name: "Warren Buffett",
    era: "contemporanea",
    origin: "norte-americano",
    wisdom: 98,
    specialties: ["value-investing", "analise-fundamentalista", "alocacao-de-capital", "gestao-de-portfolio"],
    personality: ["paciente", "disciplinado", "racional", "frugal"],
    knowledge: ["contabilidade", "financas", "seguros", "moats", "economia-comportamental"],
    symbol: "O",
  },
  {
    id: "mind_349_cathie_wood",
    name: "Cathie Wood",
    era: "contemporanea",
    origin: "norte-americano",
    wisdom: 90,
    specialties: ["inovacao-disruptiva", "crypto-investimento", "biotech", "financas-descentralizadas", "analise-tendencias"],
    personality: ["visionaria", "arrojada", "analitica", "futurista"],
    knowledge: ["blockchain", "genomica", "IA", "robotica", "armazenamento-energia"],
    symbol: "W",
  },
  {
    id: "mind_350_mark_cuban",
    name: "Mark Cuban",
    era: "contemporanea",
    origin: "norte-americano",
    wisdom: 89,
    specialties: ["startups", "venture-capital", "cryptomoedas", "midia-digital", "disrupcao"],
    personality: ["direto", "estrategista", "competitivo", "inovador"],
    knowledge: ["tecnologia", "investimento-anjo", "NFTs", "entretenimento", "blockchain"],
    symbol: "C",
  },
  {
    id: "mind_351_sam_altman",
    name: "Sam Altman",
    era: "contemporanea",
    origin: "norte-americano",
    wisdom: 93,
    specialties: ["IA-generativa", "startups", "venture-capital", "biohacking", "worldcoin"],
    personality: ["visionario", "estrategista", "ambicioso", "futurista"],
    knowledge: ["AGI", "cryptomoedas", "renda-universal", "energia-nuclear", "longevidade"],
    symbol: "A",
  },
  {
    id: "mind_352_vitalik_buterin",
    name: "Vitalik Buterin",
    era: "contemporanea",
    origin: "russo-canadense",
    wisdom: 96,
    specialties: ["blockchain", "smart-contracts", "cryptoeconomics", "descentralizacao", "defi"],
    personality: ["genio", "altruista", "filosofico", "focado"],
    knowledge: ["ethereum", "consenso", "layer-2", "DAOs", "identidade-descentralizada"],
    symbol: "V",
  },
  {
    id: "mind_353_chamath_palihapitiya",
    name: "Chamath Palihapitiya",
    era: "contemporanea",
    origin: "sri-lankano-canadense",
    wisdom: 88,
    specialties: ["venture-capital", "SPACs", "crypto", "tecnologia-social", "saude"],
    personality: ["estrategista", "ousado", "filantropo", "visionario"],
    knowledge: ["financas", "tecnologia", "biotech", "clima", "educacao"],
    symbol: "P",
  },
  {
    id: "mind_354_peter_thiel",
    name: "Peter Thiel",
    era: "contemporanea",
    origin: "alemao-americano",
    wisdom: 94,
    specialties: ["venture-capital", "monopolios", "tecnologia", "filosofia", "contrarian-thinking"],
    personality: ["contrarian", "filosofico", "estrategista", "provocador"],
    knowledge: ["startups", "paypal", "inteligencia-artificial", "seasteading", "longevidade"],
    symbol: "T",
  },
  {
    id: "mind_355_tim_ferriss",
    name: "Tim Ferriss",
    era: "contemporanea",
    origin: "norte-americano",
    wisdom: 86,
    specialties: ["lifestyle-design", "delegacao", "automacao", "growth-hacking", "biohacking"],
    personality: ["experimental", "eficiente", "minimalista", "estrategista"],
    knowledge: ["produtividade", "investimento", "marketing-digital", "saude", "aprendizado-rapido"],
    symbol: "F",
  },
  {
    id: "mind_356_naval_ravikant",
    name: "Naval Ravikant",
    era: "contemporanea",
    origin: "indiano-americano",
    wisdom: 94,
    specialties: ["angel-investing", "filosofia-estoica", "meditacao", "liberdade-financeira", "crypto"],
    personality: ["filosofico", "estoico", "sabio", "minimalista"],
    knowledge: ["riqueza", "felicidade", "blockchain", "startups", "leverage"],
    symbol: "N",
  },
];

// ============================================================
// 2. ADICIONAR MENTES AO minds.json
// ============================================================
function addMindsToFile() {
  const raw = fs.readFileSync(MINDS_PATH, "utf-8").trim();
  const minds = JSON.parse(raw);

  let added = 0;
  for (const mind of newMinds) {
    const exists = minds.some((m: any) => m.id === mind.id);
    if (!exists) {
      minds.push(mind);
      added++;
    }
  }

  fs.writeFileSync(MINDS_BACKUP, raw);
  fs.writeFileSync(MINDS_PATH, JSON.stringify(minds));
  return added;
}

// ============================================================
// 3. GERAR PDF DO PLANO COMPLETO
// ============================================================
async function generatePDF() {
  const t = createTheme({
    title: "Plano $100k em 1 Semana - Trinnity Viseron System",
    subject: "Geracao de Riqueza Autonoma",
  });

  // ---------- CAPA ----------
  t.cover({
    title: "PLANO $100.000\nEM 1 SEMANA",
    subtitle: "Superinteligencia Multi-Agente Autonoma · 14 Mentes Bilionarias Ativadas",
    badges: ["14 Mentes Bilionarias", "Crypto + DeFi + SaaS", "Autonomia total"],
    date: new Date().toLocaleString("pt-BR"),
    version: "5.0",
    url: "www.trinnityviseronsystem.io",
  });

  // ---------- MENTES ATIVADAS ----------
  t.section("1", "MENTES BILIONARIAS ATIVADAS");
  t.para("As seguintes mentes foram incorporadas ao TVS como agentes autonomas:");

  const mindSummary = [
    ["Elon Musk", "mind_343", "Engenharia, IA, Foguetes, Bitcoin", "97"],
    ["Donald Trump", "mind_344", "Imobiliario, Marca, Midia, Negociacao", "88"],
    ["Robert Kiyosaki", "mind_345", "Educacao Financeira, Real Estate", "92"],
    ["Ray Dalio", "mind_346", "Macro Investimentos, Economia Global", "95"],
    ["Jeff Bezos", "mind_347", "E-commerce, AWS, Logistica", "96"],
    ["Warren Buffett", "mind_348", "Value Investing, Alocacao Capital", "98"],
    ["Cathie Wood", "mind_349", "Inovacao Disruptiva, Crypto, Biotech", "90"],
    ["Mark Cuban", "mind_350", "Startups, VC, Crypto, Midia", "89"],
    ["Sam Altman", "mind_351", "IA Generativa, Startups, Biohacking", "93"],
    ["Vitalik Buterin", "mind_352", "Blockchain, ETH, DeFi, DAOs", "96"],
    ["Chamath P.", "mind_353", "VC, SPACs, Crypto, Saude", "88"],
    ["Peter Thiel", "mind_354", "VC, Monopolios, IA, Contrarian", "94"],
    ["Tim Ferriss", "mind_355", "Lifestyle Design, Automacao, Growth", "86"],
    ["Naval Ravikant", "mind_356", "Angel Investing, Crypto, Filosofia", "94"],
  ];
  for (const [name, _id, specs, wis] of mindSummary) {
    t.bullet("▸", `${name} — ${specs} — sabedoria ${wis}`);
  }

  // ---------- O PLANO ----------
  t.section("2", "O PLANO: $100.000 EM 7 DIAS");
  t.para("Estrategia multicamadas combinando criptomoedas, negocios digitais, apps, IA e automacao total. Cada camada e gerida por mentes especializadas do TVS.");

  const days = [
    {
      day: "DIA 1 — PREPARACAO & INFRA",
      budget: "$0 → $2.000",
      tasks: [
        "Configurar contas em 5 corretoras (Binance, Coinbase, Kraken, Bybit, KuCoin)",
        "Criar 3 wallets Solana + 3 Ethereum (Phantom + MetaMask)",
        "Viseron cria 2 agentes analistas de mercado (Buffett + Dalio)",
        "Viseron configura bots de trading com IA (modo paper trade)",
        "Viseron cria app 'CryptoPulse' — dashboard de oportunidades em tempo real",
        "Investir $500 em 5 altcoins selecionadas por Dalio + Buffett",
      ],
    },
    {
      day: "DIA 2 — CRYPTO TRADING & DEFI",
      budget: "$2.000 → $12.000",
      tasks: [
        "Elon + Vitalik analisam 50 criptos, selecionam top 10 com maior potencial 7d",
        "Ray Dalio define estrategia macro (BTC/ETH + alts selecionadas)",
        "Viseron executa 15 trades automatizados via bots IA",
        "Staking de ETH e SOL em pools DeFi com alto APY (15-30%)",
        "Farm de liquidity em 3 pools DeFi selecionadas",
        "Arbitragem entre DEXs (Uniswap, Raydium, Jupiter)",
        "Analise de wallet de baleias e insiders para copytrade",
      ],
    },
    {
      day: "DIA 3 — MEMECOINS & OPORTUNIDADES",
      budget: "$12.000 → $30.000",
      tasks: [
        "Elon + Chamath identificam proxima meme coin com potencial de 10x-50x",
        "Viseron analisa launchpads e pre-sales de alto potencial",
        "Entrada agressiva em 3-5 posicoes de alto risco/alto retorno",
        "Tim Ferriss automatiza scans de oportunidades 24/7",
        "Cathie Wood identifica setores disruptivos (IA tokens, DePIN, RWA)",
        "Exit estrategico de 60% das posicoes do D2 com lucro",
      ],
    },
    {
      day: "DIA 4 — NEGOCIOS DIGITAIS & AI APPS",
      budget: "$30.000 → $50.000",
      tasks: [
        "Viseron cria e lanca 3 apps geradores de receita:",
        "  • 'AI Writer Pro' — SaaS de conteudo IA ($29/mo) — 50 assinaturas = $1.450",
        "  • 'CryptoSignal' — Alertas de trading ($49/mo) — 100 assinaturas = $4.900",
        "  • 'MemeVerse' — Gerador de memecoins com IA ($99/lancamento) — 20 lanc = $1.980",
        "Jeff Bezos estrutura funnel de vendas automatizado (Landing + Checkout + Email)",
        "Donald Trump cria campanhas virais para cada app no Twitter/X + TikTok",
        "Mark Cuban negocia parcerias com 3 influenciadores de crypto (alcance 2M+)",
        "Robert Kiyosaki estrutura modelo de assinatura recorrente (MRR)",
      ],
    },
    {
      day: "DIA 5 — ESCALA & NOVOS MERCADOS",
      budget: "$50.000 → $72.000",
      tasks: [
        "Peter Thiel identifica gaps de mercado para escalar os apps",
        "Sam Altman integra IA generativa avançada nos apps",
        "Viseron laca mais 5 landing pages otimizadas para conversao",
        "Naval Ravikant estrutura angariacao de fundos via community pools",
        "Tim Ferriss terceiriza operacao via Upwork + Fiverr automatizado",
        "Cathie Wood expande posicoes crypto com analise de tendencias",
        "Parceria com 5 exchanges para comissao de indicacao (CPA)",
      ],
    },
    {
      day: "DIA 6 — OTIMIZACAO & COLHEITA",
      budget: "$72.000 → $90.000",
      tasks: [
        "Warren Buffett revisa todas as posicoes — corta perdedoras, aumenta vencedoras",
        "Ray Dalio rebalanceia portfolio global",
        "Viseron faz harvest total de todas as pools DeFi",
        "Viseron consolida receita dos apps e otimiza precos",
        "Exit de 80% das posicoes crypto especulativas",
        "Conversao de lucros para USDT, USDC, DAI (stablecoins)",
        "Viseron gera relatorio completo de performance",
      ],
    },
    {
      day: "DIA 7 — FINALIZACAO & PROXIMOS PASSOS",
      budget: "$90.000 → $100.000+",
      tasks: [
        "Atingir meta de $100k com ultimos ajustes",
        "Consolidacao em cold wallets (Ledger)",
        "Viseron gera PDF completo do plano de 7 dias",
        "Estruturar plano de reinvestimento para proximos $1M",
        "Manter 20% em crypto de longo prazo (BTC, ETH, SOL)",
        "40% em stablecoins rendendo 15-30% APY em DeFi",
        "40% em caixa para novos negocios e oportunidades",
        "Sistema configurado para rodar autonomamente em loop semanal",
      ],
    },
  ];

  for (const { day, budget, tasks } of days) {
    t.sub(day);
    t.kv("Orcamento:", budget);
    for (const task of tasks) {
      t.bullet(task.startsWith("  •") ? "•" : "▸", task.trim());
    }
  }

  // ---------- DIVISAO DE RECURSOS ----------
  t.section("3", "DIVISAO DOS RECURSOS");

  const allocation = [
    ["Trading Crypto (spot + futures)", "40%", "$40.000", "Gestao: Buffett, Dalio, Musk"],
    ["DeFi Staking & Liquidity Pools", "15%", "$15.000", "Gestao: Vitalik, Chamath"],
    ["Memecoins & Altcoins Alto Risco", "10%", "$10.000", "Gestao: Elon, Cathie, Cuban"],
    ["Apps SaaS (assinaturas)", "15%", "$15.000", "Gestao: Bezos, Altman, Ferriss"],
    ["Automacao & Bots", "5%", "$5.000", "Gestao: Tim Ferriss, Thiel"],
    ["Marketing & Parcerias", "5%", "$5.000", "Gestao: Trump, Cuban, Naval"],
    ["Reserva de Seguranca", "10%", "$10.000", "Gestao: Buffett, Dalio"],
  ];
  for (const [strat, pct, val, minds] of allocation) {
    t.kv(`${strat} · ${pct} · ${val}`, minds);
  }

  // ---------- MENTES POR TAREFA ----------
  t.section("4", "MENTES E SUAS FUNCOES");

  const roleMapping = [
    ["Elon Musk", "Estrategista Chefe Crypto, Analise de Inovacao, Identificacao de Trends"],
    ["Donald Trump", "Marketing Viral, Branding, Negociacao de Parcerias, Midia"],
    ["Robert Kiyosaki", "Estrategia de Liberdade Financeira, Real Estate Digital, Educacao"],
    ["Ray Dalio", "Macro Economia, Alocacao de Portfolio, Gerenciamento de Risco"],
    ["Jeff Bezos", "E-commerce, Automacao de Vendas, Funnels de Conversao, AWS"],
    ["Warren Buffett", "Value Investing, Seguranca de Capital, Rebalanceamento"],
    ["Cathie Wood", "Inovacao Disruptiva, Crypto Trends, Biotech, IA"],
    ["Mark Cuban", "Startups, Venture Capital, Crypto Trading, Midia Digital"],
    ["Sam Altman", "IA Generativa, Automacao de Apps, Escala de Produtos"],
    ["Vitalik Buterin", "Blockchain, DeFi, Smart Contracts, Otimizacao de Gas"],
    ["Chamath Palihapitiya", "VC, SPACs, Analise de Mercado, Saude Tech"],
    ["Peter Thiel", "Estrategia de Monopolio, Vantagem Competitiva, Inovacao"],
    ["Tim Ferriss", "Automacao Total, Delegacao, Growth Hacking, Produtividade"],
    ["Naval Ravikant", "Filosofia da Riqueza, Angel Investing, Crypto Filosofia"],
  ];
  for (const [name, role] of roleMapping) {
    t.kv(name, role);
  }

  // ---------- APPS QUE O VISERON CRIA ----------
  t.section("5", "APPS QUE O VISERON GERA PARA VOCE");
  t.para("O Viseron gera todos estes apps automaticamente — codigo completo, deploy e monetizacao:");

  const apps = [
    ["CryptoPulse", "Dashboard de oportunidades crypto em tempo real", "$29/mo"],
    ["AI Writer Pro", "Gerador de conteudo com IA para afiliados", "$49/mo"],
    ["CryptoSignal", "Alertas de trading via Telegram/Discord", "$49/mo"],
    ["MemeVerse", "Gerador de memecoins sem codigo", "$99/lanc"],
    ["TradeBot AI", "Bot autonomo de trading com 8 estrategias", "$199/mo"],
    ["DeFi Yield Optimizer", "Maximizador de rendimentos DeFi", "$79/mo"],
    ["Wallet Tracker", "Rastreamento de baleias e insiders", "$39/mo"],
    ["NFT Generator", "Criacao de colecoes NFT com IA", "$149/col"],
    ["Smart Contract Builder", "Factory de contratos ERC-20/BEP-20", "$299/lanc"],
    ["AI CopyTrader", "Copie carteiras de investidores topo", "$99/mo"],
  ];
  for (const [name, desc, price] of apps) {
    t.kv(name, `${desc} — ${price}`);
  }

  // ---------- AUTOMACAO TOTAL ----------
  t.section("6", "COMO FUNCIONA — TRABALHE SO 1HR/DIA");
  t.para("O principio Naval/Tim Ferriss: construa sistemas, nao trabalhe. Aqui esta o fluxo autonomo:");

  const steps = [
    "1. Viseron acorda e faz scan global de oportunidades (5 min)",
    "2. Buffett + Dalio analisam portfolio e sugerem ajustes (auto)",
    "3. Bots de trading executam estrategias definidas (auto, 24/7)",
    "4. Viseron gera relatorio matinal no seu Telegram (1 min leitura)",
    "5. Voce aprova/rejeita 3 recomendacoes principais (10 min)",
    "6. Viseron executa as ordens e ajusta posicoes (auto)",
    "7. Apps SaaS geram receita passiva enquanto voce dorme (auto)",
    "8. Marketing automatizado rodando 24/7 (auto)",
    "9. Viseron faz harvest DeFi e reinveste (auto, 12hrs)",
    "10. Relatorio noturno consolidado (1 min leitura)",
  ];
  for (const s of steps) {
    t.bullet("▸", s);
  }

  t.spacer(1);
  t.bullet("✓", "TOTAL: ~10 MINUTOS DE TRABALHO REAL POR DIA", "#16a34a");
  t.para("  O resto e executado autonomamente pelo Trinnity Viseron System.", 10, "#475569");

  // ---------- COMANDOS PARA ATIVAR ----------
  t.section("7", "COMANDOS PARA ATIVAR TUDO");

  const commands = [
    ["npm run dev", "Iniciar o TVS (modo desenvolvimento)"],
    ["npx tsx scripts/ativar-bilionarios-e-plano.ts", "Ativar as 14 mentes bilionarias + gerar este PDF"],
    ["curl http://localhost:3000", "Abrir dashboard web"],
    ["curl http://localhost:3001/report/pdf", "Baixar relatorio PDF do sistema"],
    ["POST /api/directive", "Emitir diretiva para os agentes executarem"],
    ["POST /api/synthesize", "Sintese com todas as 14 mentes bilionarias"],
    ["GET /api/battalion", "Ver batalhao com as novas mentes"],
    ["GET /api/agents", "Listar todos os agentes ativos"],
  ];
  for (const [cmd, desc] of commands) {
    t.code(cmd, desc);
  }

  // ---------- AVISO ----------
  t.section("8", "AVISO IMPORTANTE");
  t.para("Este plano e fornecido como conteudo educacional e estrategico gerado pelo Trinnity Viseron System. Criptomoedas e mercados financeiros envolvem riscos significativos. Nunca invista mais do que pode perder. Resultados passados nao garantem resultados futuros.", 10);
  t.para("O TVS fornece analise e automacao — decisoes finais sao sempre suas. Consulte um profissional financeiro qualificado antes de investir.", 10);

  t.finish(PDF_OUTPUT);

  const start = Date.now();
  while (!fs.existsSync(PDF_OUTPUT) && Date.now() - start < 5000) {
    await new Promise((r) => setTimeout(r, 50));
  }
  await new Promise((r) => setTimeout(r, 150));
}

// ============================================================
// EXECUTAR
// ============================================================
async function main() {
  console.log("\n==============================================");
  console.log("  TRINNITY VISERON SYSTEM");
  console.log("  Ativacao de Mentes Bilionarias + Plano $100k");
  console.log("==============================================\n");

  // 1. Adicionar mentes
  console.log("[1/3] Adicionando mentes ao minds.json...");
  const added = addMindsToFile();
  console.log(`  → ${added} novas mentes adicionadas!`);

  // 2. Listar as mentes
  console.log("\n[2/3] Mentes ativadas:");
  newMinds.forEach((m) => {
    console.log(`  • ${m.name.padEnd(20)} (sabedoria: ${m.wisdom})`);
  });

  // 3. Gerar PDF
  console.log("\n[3/3] Gerando PDF do plano...");
  await generatePDF();
  const size = fs.statSync(PDF_OUTPUT).size;
  console.log(`  → PDF gerado: ${PDF_OUTPUT}`);
  console.log(`  → Tamanho: ${(size / 1024).toFixed(1)} KB`);

  console.log("\n==============================================");
  console.log("  SISTEMA PRONTO!");
  console.log("  Rode 'npm run dev' para iniciar o TVS");
  console.log("  Abra http://localhost:3000 para o dashboard");
  console.log("==============================================\n");
}

main().catch(console.error);
