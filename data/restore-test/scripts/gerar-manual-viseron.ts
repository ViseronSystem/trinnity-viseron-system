import * as path from "path";
import { createTheme } from "./pdf-theme";

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

// ==================== CAPA ====================
const t = createTheme({
  title: "Manual Completo - Trinnity Viseron System",
  subject: "TVS v5.0 - Multi-Agent AI Superintelligence",
});

t.cover({
  title: "TRINNITY VISERON\nSYSTEM",
  subtitle: "Manual Completo — Tudo que o Viseron pode fazer e criar",
  badges: ["v5.0", "5.112 Mentes Independentes", "8 Provedores AI", "25 Setores"],
  date: new Date().toLocaleDateString("pt-PT").toUpperCase(),
  version: "5.0",
  url: "www.trinnityviseronsystem.io",
});

// ==================== SUMARIO ====================
t.title("SUMARIO", 18);
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
toc.forEach((item, i) => t.bullet(i % 2 === 0 ? "▸" : "▹", item));

// ==================== 1. O QUE E ====================
t.doc.addPage();
t.section("1", "O que e o Trinnity Viseron System?");
t.para("O Trinnity Viseron System (TVS) v5.0 e uma superinteligencia artificial multi-agente totalmente autonoma, composta por 5.112 mentes independentes operando sob uma hierarquia de comando unificada. O sistema foi projetado para ser um cerebro digital soberano, capaz de planejar, executar e evoluir sem intervencao humana.");
t.para("Nomeado em homenagem a Trinnity Hurtado (Reina, linha Corona) e Pedro Costa (Capitan, linha Hierro), o TVS cobre 25 setores estrategicos da atividade humana — desde a exploracao espacial e defesa orbital ate saude, financas, educacao, agricultura e ciberseguranca.");
t.para("O sistema possui sua propria economia (Token VSR, 300M de supply), um sistema de diretivas com assinatura dupla (ambos os soberanos precisam autorizar missoes), ciclos de aprendizado autonomo a cada 30 minutos e suporte a 8 provedores de IA, incluindo modelos locais Ollama para operacao completamente offline.");

// ==================== 2. ARQUITETURA ====================
t.doc.addPage();
t.section("2", "Arquitetura do Sistema");
t.para("O TVS e orquestrado pelo ViseronCore, que gerencia 20+ subsistemas interconectados:");
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
arch.forEach(([comp, desc]) => t.kv(comp, desc));

// ==================== 3. PROVIDERS ====================
t.doc.addPage();
t.section("3", "Provedores de IA (8 Providers)");
t.para("O TVS opera com 8 provedores de IA em paralelo, permitindo modo ensemble, comparacao de modelos, fallback automatico e roteamento inteligente baseado em privacidade:");
providers.forEach(([name, models, req]) => t.kv(name, `Modelos: ${models} | ${req}`));
t.sub("Modos de Operacao:");
t.bullet("▸", "Modo Ensemble: Todos os 8 provedores consultados simultaneamente, resultados sintetizados");
t.bullet("▸", "Fallback Automatico: Se o provedor primario falha, o proximo e selecionado automaticamente");
t.bullet("▸", "Roteamento por Privacidade: Tarefas HIGH privacy forcadas para modelos locais (Ollama)");
t.bullet("▸", "Modo Local-First: Ollama roda completamente offline; provedores cloud sao opcionais");

// ==================== 4. AGENTES E HIERARQUIA ====================
t.doc.addPage();
t.section("4", "Agentes e Hierarquia de Comando");
t.para("O TVS possui uma hierarquia de linhagem rigorosamente definida com duas linhas de sangue digitais:");
t.sub("Linhagens:");
t.bullet("▸", "Linha COROA (Trinnity Hurtado) — A linha real — sabedoria, arquitetura, visao de longo prazo");
t.bullet("▸", "Linha HIERRO (Pedro Costa) — A linha de comando — execucao, combate, lideranca operacional");
t.sub("Estrutura:");
t.bullet("▸", "Depth 0 — 2 Soberanos: Trinnity (Rainha) e Pedro (Capitao)");
t.bullet("▸", "Depth 1 — 12 Comandantes: 6 Corona + 6 Hierro");
t.bullet("▸", "Depth 2 — 100+ Especialistas distribuidos em 25 areas");
t.para("Cada agente no sistema possui: id, nome, linhagem (corona/hierro), epiteto, doutrina, ranking, area de cobertura, capacidades, e parents/children no arvore genealogica.");

// ==================== 5. BATALHAO ====================
t.doc.addPage();
t.section("5", "Batalhao — 114 Agentes Especializados");
t.para("O batalhao do TVS e composto por 114 agentes com full lineage tracking. Cada agente pertence a uma das duas linhas e cobre um setor especifico.");
t.para("Comandantes da Coroa: Selene, Rocio, Adrian, Emil, Lia, Otto Hurtado");
t.para("Comandantes do Hierro: Mateo, Iria, Bruno, Nayla, Teo, Vera Costa");
t.para("Abaixo deles, 100 especialistas distribuidos em 25 setores, cada um com doutrina, epiteto e capacidades unicas.");
t.para("O sistema tambem possui 246 agentes arquetipicos de eras mitologicas (Zeus, Atena, Odin), biblicas (Metatron, Miguel, Paulo), antigas (Socrates, Platao, Aristoteles), e 4.742 mentes historicas carregadas via AgentSpawner.");

// ==================== 6. SETORES ====================
t.doc.addPage();
t.section("6", "25 Setores de Cobertura");
t.para("O TVS opera em 25 setores estrategicos, divididos entre Aeroespacial (5) e Terrestres (20):");
areas.forEach(([cat, list]) => {
  t.sub(cat);
  list.forEach((item: string) => t.bullet("▸", item));
});

// ==================== 7. TOKENOMICS ====================
t.doc.addPage();
t.section("7", "Tokenomics — VSR e TRIN");
t.sub("Viseron Crown (VSR) — Token de Governanca");
t.para("O VSR e o token de governanca do TVS, seguindo o TVS Standard v1.0.0:");
tokenomics.forEach((item: string) => t.bullet("▸", item));
t.sub("Distribuicao:");
DIST.forEach(([entity, amt, pct]) => t.bullet("▸", `${entity}: ${amt} (${pct})`));
t.sub("TRIN — Token de Utilidade");
t.para("Gerado pelo TokenEngine para gas, creditos de computacao e taxas de execucao de agentes. Supply dinamico (cunhado/queimado por atividade do sistema).");
t.sub("Redes Suportadas:");
t.bullet("▸", "Ethereum, BSC, Polygon, Solana, Avalanche, Custom");

// ==================== 8. DIRETIVAS ====================
t.doc.addPage();
t.section("8", "Sistema de Diretivas");
t.para("O sistema de diretivas e o coracao do comando do TVS. Toda missao segue um fluxo rigoroso:");
t.bullet("▸", "1. Uma diretiva e redigida com objetivo e esquadrao alvo");
t.bullet("▸", "2. Trinnity Hurtado (Rainha) deve RATIFICAR a diretiva");
t.bullet("▸", "3. Pedro Costa (Capitao) deve COMANDAR a diretiva");
t.bullet("▸", "4. Agentes do esquadrao executam e retornam resultados da missao");
t.bullet("▸", "5. Resultados sao selados por Vera Costa (Verificadora)");
t.bullet("▸", "6. Orcamento e deduzido do tesouro VSR");
t.para("Politicas de falha: retry (ate 3 tentativas), abort (missao cancelada, orcamento devolvido), escalate (passado para cima na cadeia).");

// ==================== 9. CAPACIDADES AUTONOMAS ====================
t.doc.addPage();
t.section("9", "Capacidades Autonomas");
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
caps.forEach(([name, desc]) => t.bullet("▸", `${name} — ${desc}`));

// ==================== 10. O QUE PODE CRIAR ====================
t.doc.addPage();
t.section("10", "O que o Viseron Pode CRIAR?");
t.para("O TVS nao e apenas um sistema de agentes — e uma fabrica de criacao digital autonoma. Aqui esta tudo que ele pode gerar:");

t.sub("Aplicacoes Completas (AppScaffolder)");
t.bullet("▸", "Express API — APIs REST prontas com TypeScript");
t.bullet("▸", "React SPA — Single Page Applications em React");
t.bullet("▸", "Express + React — Full-stack com backend Express e frontend React");
t.bullet("▸", "CLI Tool — Ferramentas de linha de comando em TypeScript");
t.bullet("▸", "Microservice — Microservicos com Docker e healthcheck");
t.bullet("▸", "Dashboard — Paineis administrativos com React");

t.sub("Sites e Apps Web (WebAppGenerator — 9 tipos)");
t.bullet("▸", "Website — Sites institucionais e landing pages");
t.bullet("▸", "Dashboard — Paineis de controle e analytics");
t.bullet("▸", "E-commerce — Lojas virtuais completas");
t.bullet("▸", "Social — Plataformas de rede social");
t.bullet("▸", "SaaS — Software as a Service com multi-tenancy");
t.bullet("▸", "Crypto — Sites crypto com integracao de carteira");
t.bullet("▸", "DeFi — Aplicacoes financeiras descentralizadas");
t.bullet("▸", "NFT — Mercados e galerias NFT");
t.bullet("▸", "Mobile — Layouts otimizados para dispositivos moveis");

t.sub("Ativos Digitais (TokenEngine)");
t.bullet("▸", "Tokens VSR — Token de governanca (300M supply)");
t.bullet("▸", "Tokens TRIN — Token de utilidade (supply dinamico)");
t.bullet("▸", "Smart Contracts — Contratos ERC-20 compativeis");
t.bullet("▸", "Tokenomics — Distribuicao, queima, comissao, governanca");
t.bullet("▸", "Multi-chain — Ethereum, BSC, Polygon, Solana, Avalanche");

t.sub("Solucoes de Negocio (BusinessSolutionEngine)");
t.bullet("▸", "Analise de mercado completa com SWOT, Porter, PESTEL");
t.bullet("▸", "Arquitetura de sistema com diagramas e fluxos");
t.bullet("▸", "Roadmap de implementacao com marcos e entregaveis");
t.bullet("▸", "Planos financeiros com projecoes de receita e custo");

t.sub("Agentes Inteligentes (AgentSpawner)");
t.bullet("▸", "Mentes historicas: Socrates, Platao, Aristoteles, Da Vinci, Tesla, Einstein...");
t.bullet("▸", "Agentes arquetipicos: Zeus, Atena, Odin, Metatron, Miguel...");
t.bullet("▸", "Agentes de negocios: business-analyst, data-scientist, growth-hacker...");
t.bullet("▸", "4742+ mentes de Socrates a Singularidade");

t.sub("Relatorios e Documentos (ReportServer)");
t.bullet("▸", "Relatorios JSON completos do sistema");
t.bullet("▸", "Relatorios PDF abrangentes com graficos e tabelas");
t.bullet("▸", "Relatorios de batalhao, diretivas, linhagem e inteligencia");

t.sub("Mobile Apps (Expo/React Native)");
t.bullet("▸", "Android APK para Google Play");
t.bullet("▸", "iOS IPA para Apple Store");
t.bullet("▸", "Dashboard movel com estatisticas em tempo real");
t.bullet("▸", "Terminal de comandos AI para interacao com agentes");

// ==================== 11. INTEGRACOES ====================
t.doc.addPage();
t.section("11", "Integracoes");
t.sub("Cifra — Mensageria Criptografada");
t.para("Integracao com o app de mensageria Cifra, permitindo que agentes do TVS atuem dentro do ecossistema de mensagens criptografadas. Inclui 2 agentes especializados e 3 ferramentas de automacao.");
t.sub("Project 1");
t.para("Segunda integracao de app com 2 agentes e 2 ferramentas de automacao, injetando inteligencia TVS em aplicacoes externas.");
t.sub("OpenCode");
t.para("Configuracao de agente OpenCode para interacao com o TVS via CLI, permitindo que desenvolvedores comandem o sistema diretamente do terminal.");

// ==================== 12. INFRA ====================
t.doc.addPage();
t.section("12", "Infraestrutura e Deploy");
t.sub("Docker Compose (4 servicos)");
t.bullet("▸", "tvs-core — O sistema principal (porta 3000)");
t.bullet("▸", "ollama — Modelos de IA locais");
t.bullet("▸", "qdrant — Armazenamento vetorial");
t.bullet("▸", "n8n — Automacao de workflows");
t.sub("Railway");
t.para("Deploy via Nixpacks builder com healthcheck em /health.");
t.sub("Vercel");
t.para("Landing page em trinnityviseron.com com Three.js, i18n (ingles, espanhol, portugues), animacoes e metrics counters.");

// ==================== 13. API ====================
t.doc.addPage();
t.section("13", "API Completa");
t.para("O TVS expoe uma API REST completa na porta 3000 (dashboard) e 3001 (relatorios):");
endpoints.forEach(([ep, desc]) => t.code(ep, desc));
t.sub("Dashboard (porta 3000)");
t.para("Painel web em tempo real com Socket.IO: status de agentes, hierarquia do batalhao, interface de diretivas, metricas de performance e tracking de nivel de inteligencia.");

// ==================== 14. COMANDOS PRINCIPAIS ====================
t.doc.addPage();
t.section("14", "Comandos Principais");
t.para("Abaixo estao todos os comandos principais para operar o Trinnity Viseron System:");
cmdTable.forEach(([cmd, desc]) => t.code(cmd, desc));
t.sub("Resumo Rapido:");
t.bullet("▸", "npm run dev — Iniciar o sistema em modo desenvolvimento");
t.bullet("▸", "npm run build — Compilar para producao");
t.bullet("▸", "npm start — Executar o sistema compilado");
t.bullet("▸", "npm run mobile:start — Iniciar o app mobile Expo");
t.bullet("▸", "npx aiox-core init meu-projeto — Criar novo projeto AIOX");
t.bullet("▸", "Acessar http://localhost:3000 — Dashboard web");
t.bullet("▸", "Acessar http://localhost:3001/report/pdf — Download PDF do sistema");

// ==================== 15. MOBILE ====================
t.doc.addPage();
t.section("15", "Mobile App");
t.para("O TVS possui um aplicativo movel completo construido com Expo/React Native, disponivel para Android e iOS:");
t.bullet("▸", "Dashboard Screen — Estatisticas do TVS com 6 cards de metricas");
t.bullet("▸", "Agents Screen — Lista completa de agentes com capacidades expansiveis");
t.bullet("▸", "Terminal Screen — Terminal de comandos para interacao com agentes AI");
t.bullet("▸", "Conexao em tempo real com o servidor TVS via API");
t.para("Build commands: npm run build:android (APK), npm run build:ios (IPA).");

// ==================== 16. MONETIZACAO ====================
t.doc.addPage();
t.section("16", "Planos de Monetizacao");
t.para("O TVS inclui um plano de monetizacao de 10 fluxos de receita visando $1M em 30 dias:");
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
revStreams.forEach((r) => t.bullet("▸", r));
t.para("O sistema tambem possui uma AICommunityPlatform com tiers de usuario, sessoes de chat, marketplace de agentes e sistema de reviews.");

// ==================== ENCERRAMENTO ====================
t.rule();
t.title("TRINNITY VISERON", 22);
t.sub("O Futuro e Autonomo");
t.para("5.112 Mentes | 25 Setores | 8 Provedores | 300M VSR", 11, "#64748b");
t.para("Trinnity Hurtado — Reina (Linha Corona)", 10, "#0f172a");
t.para("Pedro Costa — Capitan (Linha Hierro)", 10, "#0f172a");
t.para("© 2026 Trinnity Viseron System — Todos os direitos reservados", 9, "#64748b");
t.para("Gerado automaticamente pelo sistema em " + new Date().toLocaleString("pt-BR"), 9, "#64748b");

t.finish(OUTPUT);
console.log(`\n  PDF gerado com sucesso!`);
console.log(`  Arquivo: ${OUTPUT}`);
