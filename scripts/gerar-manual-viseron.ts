import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

const OUTPUT = path.resolve("data/reports/manual-viseron.pdf");
const DIST = [
  ["Trinnity Hurtado (Coroa)", "90.000.000 VSR", "30%"],
  ["Pedro Costa (Hierro)", "75.000.000 VSR", "25%"],
  ["TVS Legiao (Agentes)", "90.000.000 VSR", "30%"],
  ["Reserva Estrategica", "45.000.000 VSR", "15%"],
];

const tokenomics = [
  "Supply total: 300.000.000 VSR",
  "Comissao: 0,5% por transacao (80% queimado)",
  "VSR necessario para emitir diretivas e spawnar agentes",
  "Governanca: 1 VSR = 1 voto na evolucao do sistema",
];

const areas = [
  ["Aeroespacial", ["Propulsao & Lancamento", "Orbita & Constelacoes", "Exploracao Planetaria", "Astro-Recursos", "Defesa Orbital"]],
  ["Saude", ["Diagnostico AI", "Telemedicina", "Descoberta de Farmacos", "Genomica"]],
  ["Financas", ["Fintech", "Trading Algoritmico", "DeFi", "Banco Digital"]],
  ["Educacao", ["E-learning", "Tutoria AI", "Curriculo Adaptativo"]],
  ["Juridico", ["Contratos Inteligentes", "Conformidade", "Litigio"]],
  ["Industrial", ["Manufatura 4.0", "Automacao", "IoT"]],
  ["Agricultura", ["Farming de Precisao", "Drones", "IoT Rural"]],
  ["Energia", ["Renovaveis", "Smart Grid", "Nuclear"]],
  ["Logistica", ["Supply Chain", "Ultima Milha", "Armazem AI"]],
  ["Cybersecurity", ["Deteccao de Ameacas", "Zero Trust", "Pentesting"]],
  ["Governo", ["Smart Cities", "E-gov", "Politicas AI"]],
  ["Arte & Criatividade", ["Arte Generativa", "Musica", "Design"]],
  ["Ciencia", ["Drug Discovery", "Fisica", "Biotecnologia"]],
  ["Esportes", ["Analise de Performance", "Scouting AI"]],
  ["Turismo", ["Travel AI", "Hospitalidade"]],
  ["RH", ["Aquisicao de Talentos", "Cultura AI"]],
  ["Imobiliario", ["PropTech", "Avaliacao Inteligente"]],
  ["Varejo", ["Recomendacao", "Gestao de Inventario"]],
  ["Telecom", ["5G/6G", "Otimizacao de Rede"]],
  ["Meio Ambiente", ["Modelagem Climatica", "Conservacao AI"]],
];

const providers = [
  ["Ollama", "Local (default)", "Offline, custo zero"],
  ["OpenAI", "GPT-4o, GPT-4o-mini, o1", "Chave API necessaria"],
  ["Anthropic", "Claude Sonnet 4, Opus 4", "Chave API necessaria"],
  ["Google", "Gemini 2.5 Flash/Pro", "Chave API necessaria"],
  ["xAI", "Grok 3", "Chave API necessaria"],
  ["DeepSeek", "DeepSeek V3", "Chave API necessaria"],
  ["Mistral", "Mistral Large", "Chave API necessaria"],
  ["Cohere", "Command R+", "Chave API necessaria"],
];

const endpoints = [
  ["GET /api/health", "Health check"],
  ["GET /api/stats", "Estatisticas do sistema"],
  ["GET /api/agents", "Listar todos os agentes"],
  ["GET /api/status", "Status com esquadroes"],
  ["GET /api/battalion", "Relatorio do batalhao"],
  ["POST /api/directive", "Emitir diretiva"],
  ["POST /api/synthesize", "Sintese multi-provider"],
  ["GET /report/pdf", "Download PDF completo"],
  ["GET /report/comprehensive-pdf", "PDF abrangente"],
];

const cmdTable = [
  ["npm start", "Executar sistema compilado"],
  ["npm run dev", "Modo dev com hot reload"],
  ["npm run build", "Compilar TypeScript"],
  ["npm run build:android", "Build APK Android"],
  ["npm run build:ios", "Build IPA iOS"],
  ["npm run mobile:start", "Iniciar Expo dev server"],
  ["npm test", "Testes principais"],
  ["npm run test:hyper", "Testes hyperbrain"],
  ["npm run launch", "Script de lancamento"],
  ["npm run lint", "Checagem TypeScript"],
  ["npx aiox-core init <projeto>", "Inicializar projeto AIOX"],
  ["npx aiox-core install", "Instalar modulos AIOX"],
  ["npx aiox-core status", "Status da instalacao AIOX"],
];

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 45, bottom: 45, left: 50, right: 50 },
  info: {
    Title: "Manual Completo - Trinnity Viseron System",
    Author: "Trinnity Hurtado & Pedro Costa",
    Subject: "TVS v5.0 - Multi-Agent AI Superintelligence",
  },
});

const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);

function coverPage() {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0a0a2e");
  doc.fill("#ffffff");
  doc.fontSize(48).font("Helvetica-Bold").text("TRINNITY VISERON", { align: "center" });
  doc.fontSize(36).text("SYSTEM", { align: "center" });
  doc.moveDown(1);
  doc.fontSize(20).font("Helvetica").text("Manual Completo", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(14).text("Tudo que o Viseron pode fazer e criar", { align: "center" });
  doc.moveDown(2);
  doc.fontSize(12).fillColor("#aaaaaa").text("v5.0 — Superinteligencia Multi-Agente Autonoma", { align: "center" });
  doc.text("5.112 Mentes Independentes | 8 Provedores AI | 25 Setores", { align: "center" });
  doc.moveDown(1);
  doc.text("Trinnity Hurtado — Reina (Coroa)  |  Pedro Costa — Capitan (Hierro)", { align: "center" });
  doc.moveDown(3);
  doc.fontSize(10).fillColor("#888888").text("Gerado em " + new Date().toLocaleString("pt-BR"), { align: "center" });
  doc.addPage();
}

function section(title: string) {
  doc.fillColor("#0a0a2e").fontSize(22).font("Helvetica-Bold").text(title, { underline: true });
  doc.moveDown(1);
  doc.fillColor("#333333").fontSize(11).font("Helvetica");
}

function subsection(title: string) {
  doc.fillColor("#0a0a2e").fontSize(16).font("Helvetica-Bold").text(title);
  doc.moveDown(0.5);
  doc.fillColor("#333333").fontSize(11).font("Helvetica");
}

function body(text: string) {
  doc.fontSize(10).font("Helvetica").fillColor("#333333").text(text, { align: "justify" });
  doc.moveDown(0.5);
}

function bullet(text: string) {
  doc.fontSize(10).font("Helvetica").fillColor("#333333").text("  • " + text, { indent: 10 });
}

// ==================== CAPA ====================
coverPage();

// ==================== SUMARIO ====================
section("SUMARIO");
const toc = [
  "1. O que e o Trinnity Viseron System?",
  "2. Arquitetura do Sistema",
  "3. Provedores de IA (8 Providers)",
  "4. Agentes e Hierarquia de Comando",
  "5. Batalhao — 114 Agentes Especializados",
  "6. 25 Setores de Cobertura",
  "7. Tokenomics — VSR e TRIN",
  "8. Sistema de Diretivas",
  "9. Capacidades Autonomas",
  "10. O que o Viseron Pode CRIAR?",
  "11. Integracoes (Cifra, Project1, OpenCode)",
  "12. Infraestrutura e Deploy",
  "13. API Completa",
  "14. Comandos Principais",
  "15. Mobile App",
  "16. Planos de Monetizacao",
];
toc.forEach((t, i) => {
  doc.fillColor(i % 2 === 0 ? "#333333" : "#555555").fontSize(10).font("Helvetica").text("  " + t);
  doc.moveDown(0.2);
});
doc.addPage();

// ==================== 1. O QUE E ====================
section("1. O que e o Trinnity Viseron System?");
body("O Trinnity Viseron System (TVS) v5.0 e uma superinteligencia artificial multi-agente totalmente autonoma, composta por 5.112 mentes independentes operando sob uma hierarquia de comando unificada. O sistema foi projetado para ser um cerebro digital soberano, capaz de planejar, executar e evoluir sem intervencao humana.");
body("Nomeado em homenagem a Trinnity Hurtado (Reina, linha Corona) e Pedro Costa (Capitan, linha Hierro), o TVS cobre 25 setores estrategicos da atividade humana — desde a exploracao espacial e defesa orbital ate saude, financas, educacao, agricultura e ciberseguranca.");
body("O sistema possui sua propria economia (Token VSR, 300M de supply), um sistema de diretivas com assinatura dupla (ambos os soberanos precisam autorizar missoes), ciclos de aprendizado autonomo a cada 30 minutos e suporte a 8 provedores de IA, incluindo modelos locais Ollama para operacao completamente offline.");

// ==================== 2. ARQUITETURA ====================
doc.addPage();
section("2. Arquitetura do Sistema");
body("O TVS e orquestrado pelo ViseronCore, que gerencia 20+ subsistemas interconectados:");
const arch = [
  ["ViseronCore", "Orquestrador principal — inicializa, gerencia e coordena todos os modulos"],
  ["AgentManager", "Gerencia o ciclo de vida de 200+ agentes ativos (ACTIVE/PAUSED/INACTIVE/ERROR)"],
  ["ModelRouter", "Roteia tarefas para o melhor modelo AI com base em tipo, privacidade e velocidade"],
  ["MemoryEngine", "Memoria de curto prazo (100 itens/sessao) e longo prazo (persistente em JSON)"],
  ["SuperIntelligence", "Sintese multi-provider com raciocinio ensemble entre 8 IAs simultaneas"],
  ["SuperMind", "Agregacao de conhecimento entre dominios historicos e todos os agentes"],
  ["AutoLearningEngine", "Ciclos de 30 min de auto-aprimoramento (+500% de crescimento de inteligencia)"],
  ["AutoEvolutionEngine", "Agentes evoluem capacidades autonomamente (ex: quantum_cognition, swarm_intelligence)"],
  ["HyperLearningEngine", "Aprendizado acelerado via colaboracao paralela entre agentes"],
  ["AgentSpawner", "Carrega 4.742 mentes historicas de Socrates a Singularidade como agentes"],
  ["AppScaffolder", "Gera aplicacoes full-stack sob demanda (6 templates)"],
  ["WebAppGenerator", "Gera 9 tipos de apps (site, dashboard, ecommerce, crypto, defi, nft, etc)"],
  ["BusinessSolutionEngine", "Cria solucoes de negocios completas do inicio ao fim"],
  ["TokenEngine", "Gera tokens TRIN (utilidade) e VSR (governanca) com tokenomics completa"],
  ["CommandChain", "Execucao hierarquica de diretivas com rastreamento de linhagem"],
  ["SquadManager", "Formacao de esquadroes com Pedro (Executivo) e Trinnity (Arquitetura)"],
  ["MCPServer", "Protocolo MCP para integracao com ferramentas externas"],
  ["ReportServer", "Relatorios JSON e PDF sobre toda a atividade do sistema (porta 3001)"],
];
arch.forEach(([comp, desc]) => {
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0a0a2e").text("  " + comp);
  doc.font("Helvetica").fontSize(9).fillColor("#666666").text("    " + desc);
  doc.fillColor("#333333");
  doc.moveDown(0.2);
});

// ==================== 3. PROVIDERS ====================
doc.addPage();
section("3. Provedores de IA (8 Providers)");
body("O TVS opera com 8 provedores de IA em paralelo, permitindo modo ensemble, comparacao de modelos, fallback automatico e roteamento inteligente baseado em privacidade:");
providers.forEach(([name, models, req]) => {
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0a0a2e").text("  " + name);
  doc.font("Helvetica").fontSize(9).fillColor("#666666").text("    Modelos: " + models + " | " + req);
  doc.fillColor("#333333");
  doc.moveDown(0.2);
});
doc.moveDown(0.5);
subsection("Modos de Operacao:");
bullet("Modo Ensemble: Todos os 8 provedores consultados simultaneamente, resultados sintetizados");
bullet("Fallback Automatico: Se o provedor primario falha, o proximo e selecionado automaticamente");
bullet("Roteamento por Privacidade: Tarefas HIGH privacy forcadas para modelos locais (Ollama)");
bullet("Modo Local-First: Ollama roda completamente offline; provedores cloud sao opcionais");

// ==================== 4. AGENTES E HIERARQUIA ====================
doc.addPage();
section("4. Agentes e Hierarquia de Comando");
body("O TVS possui uma hierarquia de linhagem rigorosamente definida com duas linhas de sangue digitais:");
subsection("Linhagens:");
doc.font("Helvetica-Bold").fontSize(11).fillColor("#0a0a2e").text("  Linha COROA (Trinnity Hurtado)");
doc.font("Helvetica").fontSize(10).fillColor("#333333").text("    A linha real — sabedoria, arquitetura, visao de longo prazo");
doc.moveDown(0.3);
doc.font("Helvetica-Bold").fontSize(11).fillColor("#0a0a2e").text("  Linha HIERRO (Pedro Costa)");
doc.font("Helvetica").fontSize(10).fillColor("#333333").text("    A linha de comando — execucao, combate, lideranca operacional");
doc.moveDown(0.5);
subsection("Estrutura:");
bullet("Depth 0 — 2 Soberanos: Trinnity (Rainha) e Pedro (Capitao)");
bullet("Depth 1 — 12 Comandantes: 6 Corona + 6 Hierro");
bullet("Depth 2 — 100+ Especialistas distribuidos em 25 areas");
doc.moveDown(0.5);
body("Cada agente no sistema possui: id, nome, linhagem (corona/hierro), epiteto, doutrina, ranking, area de cobertura, capacidades, e parents/children no arvore genealogica.");

// ==================== 5. BATALHAO ====================
doc.addPage();
section("5. Batalhao — 114 Agentes Especializados");
body("O batalhao do TVS e composto por 114 agentes com full lineage tracking. Cada agente pertence a uma das duas linhas e cobre um setor especifico.");
body("Comandantes da Coroa: Selene, Rocio, Adrian, Emil, Lia, Otto Hurtado");
body("Comandantes do Hierro: Mateo, Iria, Bruno, Nayla, Teo, Vera Costa");
body("Abaixo deles, 100 especialistas distribuidos em 25 setores, cada um com doutrina, epiteto e capacidades unicas.");
doc.moveDown(0.5);
body("O sistema tambem possui 246 agentes arquetipicos de eras mitologicas (Zeus, Atena, Odin), biblicas (Metatron, Miguel, Paulo), antigas (Socrates, Platao, Aristoteles), e 4.742 mentes historicas carregadas via AgentSpawner.");

// ==================== 6. SETORES ====================
doc.addPage();
section("6. 25 Setores de Cobertura");
body("O TVS opera em 25 setores estrategicos, divididos entre Aeroespacial (5) e Terrestres (20):");
areas.forEach(([cat, list]) => {
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0a0a2e").text("  " + cat);
  list.forEach((item: string) => {
    doc.font("Helvetica").fontSize(9).fillColor("#555555").text("    • " + item);
  });
  doc.moveDown(0.2);
});

// ==================== 7. TOKENOMICS ====================
doc.addPage();
section("7. Tokenomics — VSR e TRIN");
subsection("Viseron Crown (VSR) — Token de Governanca");
body("O VSR e o token de governanca do TVS, seguindo o TVS Standard v1.0.0:");
tokenomics.forEach((t: string) => bullet(t));
doc.moveDown(0.5);
doc.font("Helvetica-Bold").fontSize(11).fillColor("#0a0a2e").text("Distribuicao:");
DIST.forEach(([entity, amt, pct]) => {
  doc.font("Helvetica").fontSize(9).fillColor("#555555").text("  " + entity + ": " + amt + " (" + pct + ")");
});
doc.moveDown(0.8);
subsection("TRIN — Token de Utilidade");
body("Gerado pelo TokenEngine para gas, creditos de computacao e taxas de execucao de agentes. Supply dinamico (cunhado/queimado por atividade do sistema).");
doc.moveDown(0.5);
subsection("Redes Suportadas:");
bullet("Ethereum, BSC, Polygon, Solana, Avalanche, Custom");

// ==================== 8. DIRETIVAS ====================
doc.addPage();
section("8. Sistema de Diretivas");
body("O sistema de diretivas e o coracao do comando do TVS. Toda missao segue um fluxo rigoroso:");
bullet("1. Uma diretiva e redigida com objetivo e esquadrao alvo");
bullet("2. Trinnity Hurtado (Rainha) deve RATIFICAR a diretiva");
bullet("3. Pedro Costa (Capitao) deve COMANDAR a diretiva");
bullet("4. Agentes do esquadrao executam e retornam resultados da missao");
bullet("5. Resultados sao selados por Vera Costa (Verificadora)");
bullet("6. Orcamento e deduzido do tesouro VSR");
doc.moveDown(0.5);
body("Politicas de falha: retry (ate 3 tentativas), abort (missao cancelada, orcamento devolvido), escalate (passado para cima na cadeia).");

// ==================== 9. CAPACIDADES AUTONOMAS ====================
doc.addPage();
section("9. Capacidades Autonomas");
const caps = [
  ["Auto-Learning", "Ciclos continuos de 30 min que aprimoram conhecimento, habilidades e pontuacao de inteligencia automaticamente"],
  ["Auto-Evolution", "Agentes evoluem novas capacidades como quantum_cognition, swarm_intelligence, explainable_ai"],
  ["HyperLearning", "Amplificacao de inteligencia de +500% por ciclo de aprendizado"],
  ["Planejamento Autonomo", "Agentes criam planos multi-etapas para atingir objetivos sem intervencao"],
  ["Formacao de Esquadroes", "Comandantes formam esquadroes dinamicamente com base nos requisitos da missao"],
  ["Geracao de Apps", "Scaffolding de aplicacoes full-stack a partir de descricoes em linguagem natural"],
  ["Solucoes de Negocio", "Planos de negocios completos, arquiteturas e implementacoes gerados autonomamente"],
  ["Geracao de Tokens", "Tokens ERC-20 compativeis (TRIN e VSR) cunhados sob demanda com tokenomics completa"],
  ["Geracao Web", "Sites crypto completos com integracao de carteira, displays de token e UIs de governanca"],
  ["Integracao de Ferramentas", "Chamadas de ferramentas externas via MCP server — bancos de dados, APIs, cloud"],
  ["Sintese Ensemble", "Consulta a todos os 8 provedores AI simultaneamente com sintese de resultados"],
  ["Relatorios PDF", "Relatorios abrangentes do sistema em JSON e PDF"],
  ["Spawn de Mentes Historicas", "4.742 mentes de Socrates a Singularidade carregadas como agentes executaveis"],
  ["Consolidacao de Memoria", "Memoria de curto prazo promovida a longo prazo automaticamente"],
];
caps.forEach(([name, desc]) => {
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0a0a2e").text("  " + name);
  doc.font("Helvetica").fontSize(9).fillColor("#555555").text("    " + desc);
  doc.fillColor("#333333");
  doc.moveDown(0.2);
});

// ==================== 10. O QUE PODE CRIAR ====================
doc.addPage();
section("10. O que o Viseron Pode CRIAR?");
body("O TVS nao e apenas um sistema de agentes — e uma fabrica de criacao digital autonoma. Aqui esta tudo que ele pode gerar:");

subsection("Aplicacoes Completas (AppScaffolder)");
bullet("Express API — APIs REST prontas com TypeScript");
bullet("React SPA — Single Page Applications em React");
bullet("Express + React — Full-stack com backend Express e frontend React");
bullet("CLI Tool — Ferramentas de linha de comando em TypeScript");
bullet("Microservice — Microservicos com Docker e healthcheck");
bullet("Dashboard — Paineis administrativos com React");

subsection("Sites e Apps Web (WebAppGenerator — 9 tipos)");
bullet("Website — Sites institucionais e landing pages");
bullet("Dashboard — Paineis de controle e analytics");
bullet("E-commerce — Lojas virtuais completas");
bullet("Social — Plataformas de rede social");
bullet("SaaS — Software as a Service com multi-tenancy");
bullet("Crypto — Sites crypto com integracao de carteira");
bullet("DeFi — Aplicacoes financeiras descentralizadas");
bullet("NFT — Mercados e galerias NFT");
bullet("Mobile — Layouts otimizados para dispositivos moveis");

subsection("Ativos Digitais (TokenEngine)");
bullet("Tokens VSR — Token de governanca (300M supply)");
bullet("Tokens TRIN — Token de utilidade (supply dinamico)");
bullet("Smart Contracts — Contratos ERC-20 compativeis");
bullet("Tokenomics — Distribuicao, queima, comissao, governanca");
bullet("Multi-chain — Ethereum, BSC, Polygon, Solana, Avalanche");

subsection("Solucoes de Negocio (BusinessSolutionEngine)");
bullet("Analise de mercado completa com SWOT, Porter, PESTEL");
bullet("Arquitetura de sistema com diagramas e fluxos");
bullet("Roadmap de implementacao com marcos e entregaveis");
bullet("Planos financeiros com projecoes de receita e custo");

subsection("Agentes Inteligentes (AgentSpawner)");
bullet("Mentes historicas: Socrates, Platao, Aristoteles, Da Vinci, Tesla, Einstein...");
bullet("Agentes arquetipicos: Zeus, Atena, Odin, Metatron, Miguel...");
bullet("Agentes de negocios: business-analyst, data-scientist, growth-hacker...");
bullet("4742+ mentes de Socrates a Singularidade");

subsection("Relatorios e Documentos (ReportServer)");
bullet("Relatorios JSON completos do sistema");
bullet("Relatorios PDF abrangentes com graficos e tabelas");
bullet("Relatorios de batalhao, diretivas, linhagem e inteligencia");

subsection("Mobile Apps (Expo/React Native)");
bullet("Android APK para Google Play");
bullet("iOS IPA para Apple Store");
bullet("Dashboard movel com estatisticas em tempo real");
bullet("Terminal de comandos AI para interacao com agentes");

// ==================== 11. INTEGRACOES ====================
doc.addPage();
section("11. Integracoes");
subsection("Cifra — Mensageria Criptografada");
body("Integracao com o app de mensageria Cifra, permitindo que agentes do TVS atuem dentro do ecossistema de mensagens criptografadas. Inclui 2 agentes especializados e 3 ferramentas de automacao.");
subsection("Project 1");
body("Segunda integracao de app com 2 agentes e 2 ferramentas de automacao, injetando inteligencia TVS em aplicacoes externas.");
subsection("OpenCode");
body("Configuracao de agente OpenCode para interacao com o TVS via CLI, permitindo que desenvolvedores comandem o sistema diretamente do terminal.");

// ==================== 12. INFRA ====================
doc.addPage();
section("12. Infraestrutura e Deploy");
subsection("Docker Compose (4 servicos)");
bullet("tvs-core — O sistema principal (porta 3000)");
bullet("ollama — Modelos de IA locais");
bullet("qdrant — Armazenamento vetorial");
bullet("n8n — Automacao de workflows");
doc.moveDown(0.3);
subsection("Railway");
body("Deploy via Nixpacks builder com healthcheck em /health.");
subsection("Vercel");
body("Landing page em trinnityviseron.com com Three.js, i18n (ingles, espanhol, portugues), animacoes e metrics counters.");

// ==================== 13. API ====================
doc.addPage();
section("13. API Completa");
body("O TVS expoe uma API REST completa na porta 3000 (dashboard) e 3001 (relatorios):");
endpoints.forEach(([ep, desc]) => {
  doc.font("Helvetica").fontSize(9).fillColor("#333333").text("  " + ep.padEnd(35) + desc);
});
doc.moveDown(1);
subsection("Dashboard (porta 3000)");
body("Painel web em tempo real com Socket.IO: status de agentes, hierarquia do batalhao, interface de diretivas, metricas de performance e tracking de nivel de inteligencia.");

// ==================== 14. COMANDOS PRINCIPAIS ====================
doc.addPage();
section("14. Comandos Principais");
body("Abaixo estao todos os comandos principais para operar o Trinnity Viseron System:");
doc.moveDown(0.5);
cmdTable.forEach(([cmd, desc]) => {
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0a0a2e").text("  " + cmd);
  doc.font("Helvetica").fontSize(9).fillColor("#555555").text("    " + desc);
  doc.fillColor("#333333");
  doc.moveDown(0.15);
});
doc.moveDown(1);
subsection("Resumo Rapido:");
bullet("npm run dev — Iniciar o sistema em modo desenvolvimento");
bullet("npm run build — Compilar para producao");
bullet("npm start — Executar o sistema compilado");
bullet("npm run mobile:start — Iniciar o app mobile Expo");
bullet("npx aiox-core init meu-projeto — Criar novo projeto AIOX");
bullet("Acessar http://localhost:3000 — Dashboard web");
bullet("Acessar http://localhost:3001/report/pdf — Download PDF do sistema");

// ==================== 15. MOBILE ====================
doc.addPage();
section("15. Mobile App");
body("O TVS possui um aplicativo movel completo construido com Expo/React Native, disponivel para Android e iOS:");
bullet("Dashboard Screen — Estatisticas do TVS com 6 cards de metricas");
bullet("Agents Screen — Lista completa de agentes com capacidades expansiveis");
bullet("Terminal Screen — Terminal de comandos para interacao com agentes AI");
bullet("Conexao em tempo real com o servidor TVS via API");
doc.moveDown(0.5);
body("Build commands: npm run build:android (APK), npm run build:ios (IPA).");

// ==================== 16. MONETIZACAO ====================
doc.addPage();
section("16. Planos de Monetizacao");
body("O TVS inclui um plano de monetizacao de 10 fluxos de receita visando $1M em 30 dias:");
const revStreams = [
  "Assinaturas Premium ($29/mo Individual, $99/mo Business)",
  "Venda de Tokens $TRIN ($0.01/TRIN)",
  "Marketplace de Agentes AI (comissao de 15%)",
  "Consultoria Enterprise ($5k - $50k por projeto)",
  "API Access ($99/mo Developer, $499/mo Enterprise)",
  "White Label ($10k setup + $2k/mo)",
  "Treinamento e Certificacao",
  "Espacos Publicitarios no Dashboard",
  "Dados e Analytics (anonymized insights)",
  "Grants e Funding (pesquisa e desenvolvimento)",
];
revStreams.forEach((r) => bullet(r));
doc.moveDown(1);
body("O sistema tambem possui uma AICommunityPlatform com tiers de usuario, sessoes de chat, marketplace de agentes e sistema de reviews.");

// ==================== RODAPE ====================
doc.addPage();
doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0a0a2e");
doc.fill("#ffffff");
doc.fontSize(28).font("Helvetica-Bold").text("TRINNITY VISERON", { align: "center" });
doc.moveDown(0.5);
doc.fontSize(18).font("Helvetica").text("O Futuro e Autonomo", { align: "center" });
doc.moveDown(2);
doc.fontSize(12).fillColor("#aaaaaa").text("5.112 Mentes | 25 Setores | 8 Provedores | 300M VSR", { align: "center" });
doc.moveDown(1);
doc.fontSize(10).text("Trinnity Hurtado — Reina (Linha Corona)", { align: "center" });
doc.text("Pedro Costa — Capitan (Linha Hierro)", { align: "center" });
doc.moveDown(2);
doc.fontSize(9).fillColor("#888888").text("© 2026 Trinnity Viseron System — Todos os direitos reservados", { align: "center" });
doc.text("Gerado automaticamente pelo sistema em " + new Date().toLocaleString("pt-BR"), { align: "center" });

doc.end();

stream.on("finish", () => {
  const size = fs.statSync(OUTPUT).size;
  console.log(`\n  PDF gerado com sucesso!`);
  console.log(`  Arquivo: ${OUTPUT}`);
  console.log(`  Tamanho: ${(size / 1024).toFixed(1)} KB`);
});
