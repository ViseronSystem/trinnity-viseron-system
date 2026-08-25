import * as path from "path";
import { createTheme } from "./pdf-theme";

async function generateManual(outputPath: string) {
  const t = createTheme({
    title: "Trinnity Viseron System - Manual Completo",
    subject: "Multi-Agent AI Superintelligence",
  });

  // Bloco de código multi-linha que flui via doc.y (sem sobreposição).
  function codeBlock(lines: string[]) {
    t.ensure(20 * lines.length);
    t.doc.font("Courier").fontSize(9).fillColor("#1e293b");
    for (const line of lines) {
      t.doc.text(line, 54, t.doc.y, { width: t.doc.page.width - 108, lineGap: 2 });
    }
    t.doc.moveDown(0.6);
  }

  // ========== CAPA ==========
  t.cover({
    title: "TRINNITY\nVISERON SYSTEM",
    subtitle: "v5.0 MULTIVERSAL — Sistema Operativo Multi-Agente de Superinteligencia Artificial",
    badges: ["5.112 Mentes Autonomas", "25 Sectores Estrategicos", "290+ Provedores IA", "AIOX Core Squad"],
    date: new Date().toLocaleDateString("pt-PT").toUpperCase(),
    version: "5.0",
    url: "www.trinnityviseronsystem.io",
  });

  // ========== INDICE ==========
  t.title("INDICE", 20);

  const toc = [
    ["1.", "O que e Trinnity Viseron System?"],
    ["2.", "Arquitetura do Sistema"],
    ["3.", "Comandos de Inicializacao"],
    ["4.", "Comandos de Build & Compilacao"],
    ["5.", "Comandos de Deploy & Publicacao"],
    ["6.", "Comandos Mobile (Android/iOS)"],
    ["7.", "Comandos Desktop (Electron/Standalone)"],
    ["8.", "Comandos de Integracoes"],
    ["9.", "Comandos de Backup & Manutencao"],
    ["10.", "Comandos do AIOX Core CLI"],
    ["11.", "API REST - Endpoints Completos"],
    ["12.", "Modulos do Core TVS"],
    ["13.", "Provedores de IA Suportados"],
    ["14.", "Tokens: $VSR e $TRIN"],
    ["15.", "Solucoes para o Mundo"],
    ["16.", "Modelo de Assinatura - Por que Pagar?"],
    ["17.", "Planos e Precos"],
    ["18.", "Squads AIOX, Pedro & Trinnity"],
    ["19.", "Plataforma CODE & Apps LLM"],
    ["20.", "Glossario de Comandos Rapidos"],
  ];

  toc.forEach(([num, title]) => t.bullet("▸", `${num}  ${title}`));

  // ========== 1. O QUE E TVS? ==========
  t.doc.addPage();
  t.section("1", "O que e Trinnity Viseron System?");
  t.para("Trinnity Viseron System (TVS) e um Sistema Operativo Multi-Agente de Superinteligencia Artificial uma plataforma autonoma que orquestra milhares de mentes artificiais para resolver problemas complexos, gerar codigo, criar aplicacoes, gerenciar tokens, automatizar fluxos de trabalho e muito mais.", 10, "#0f172a", { align: "justify" });
  t.para("Liderado pelo Comandante Supremo Pedro Costa e pela Reina Arquitecta Trinnity Hurtado, o TVS opera com 5.112 agentes autonomos divididos em 25 setores estrategicos desde aeroespacial e defesa ate saude, financas e educacao.", 10, "#0f172a", { align: "justify" });
  t.para("Construido em TypeScript/Node.js, funciona com 290+ provedores de IA (incluindo modelos locais via Ollama para operacao offline completa), gera tokens ERC-20, compila aplicacoes moveis Android/iOS, cria executaveis desktop, e se auto-evolui a cada 30 minutos com incrementos de +500% de inteligencia.", 10, "#0f172a", { align: "justify" });

  t.sub("DADOS PRINCIPAIS");
  const items = [
    "5.112 Agentes Autonomos (4.742 mentes historicas + 246 arquétipos + 114 batalhao + ~10 core)",
    "25 Setores Estrategicos de atuacao",
    "290+ Provedores de IA via OmniRoute Bridge",
    "Auto-Evolucao: +500% de inteligencia a cada 30 minutos",
    "Tokens: $VSR (300M supply) e $TRIN (utilidade)",
    "Deploy multiplataforma: Web, Mobile (Android/iOS), Desktop (Windows/Mac/Linux)",
  ];
  items.forEach((item) => t.bullet("▸", item));

  // ========== 2. ARQUITETURA ==========
  t.doc.addPage();
  t.section("2", "Arquitetura do Sistema");
  const mods = [
    ["ViseronCore", "Motor principal que orquestra todos os componentes do sistema"],
    ["Orchestrator", "Coordena tarefas multi-agente com decomposicao automatica de subtarefas"],
    ["AgentManager", "Gerencia ciclo de vida de todos os agentes (registro, execucao, status)"],
    ["ModelRouter", "Roteia requisicoes para o modelo de IA otimo entre 8+ provedores"],
    ["MemoryEngine", "Memoria de curto prazo (100 itens/sessao) e longo prazo (persistente em JSON)"],
    ["ProviderFactory", "Fabrica de provedores: Ollama, OpenAI, Claude, Gemini, Grok, OmniRoute"],
    ["AIProviderBridge", "Ponte para 290+ provedores com fallback automatico e ensemble"],
    ["SuperIntelligence", "Sintese multi-provedor com ensemble reasoning (8 IAs simultaneas)"],
    ["SuperMind", "Agregacao de conhecimento entre todos os dominios e agentes"],
    ["AutoLearningEngine", "Ciclos de auto-aprendizado a cada 30 minutos sem intervencao humana"],
    ["HyperLearningEngine", "Aprendizado acelerado: inteligencia cresce 500% a cada ciclo (x6)"],
    ["AutoEvolutionEngine", "Agentes evoluem capacidades autonomamente via algoritmos geneticos"],
    ["AgentSpawner", "Carrega 4.742 mentes historicas como agentes executaveis"],
    ["CommandChain", "Cadeia de comando hierarquica com linhagem e assinatura dupla"],
    ["SquadManager", "Gerencia squads de agentes para missoes especificas"],
    ["ToolManager", "Cria e executa ferramentas externas (APIs, webhooks, MCP)"],
    ["AppScaffolder", "Gera aplicacoes full-stack completas de descricoes em linguagem natural"],
    ["BusinessSolutionEngine", "Gera solucoes empresariais completas (plano + arquitetura + implementacao)"],
    ["TokenEngine", "Gera tokens ERC-20 ($TRIN, $VSR) com tokenomics e contratos Solidity"],
    ["WebAppGenerator", "Gera websites e landing pages automaticamente"],
    ["MCP Server", "Servidor Model Context Protocol para integracao com ferramentas externas"],
    ["ReportServer", "Relatorios completos em JSON e PDF com estatisticas do sistema"],
    ["VoiceBridge", "Bridge de voz JARVIS com sintese de fala e comandos de voz"],
  ];
  mods.forEach(([name, desc]) => t.kv(name, desc));

  // ========== 3. INICIALIZACAO ==========
  t.doc.addPage();
  t.section("3", "Comandos de Inicializacao");
  t.para("Comandos para iniciar, testar e verificar o sistema.", 9.5, "#64748b");
  const initCmds = [
    ["npm start", "Inicia o sistema TVS (producao)", "node dist/src/index.js"],
    ["npm run dev", "Modo desenvolvimento com hot-reload", "nodemon --exec tsx src/index.ts"],
    ["npm run super:start", "Inicia com superinteligencia ativada", "tsx src/index.ts"],
    ["npm run launch", "Executa script de lancamento", "tsx src/launch/market.ts"],
    ["npm run setup", "Instala dependencias root e mobile", "npm install && cd mobile && npm install"],
    ["npm run init", "Executa script de inicializacao", "scripts/init-system.ps1"],
    ["npm run init:full", "Build + Backup + Start (ciclo completo)", "scripts/init-system.ps1 -Full"],
  ];
  initCmds.forEach(([cmd, desc, acao]) => t.code(cmd, desc, acao));
  t.sub("Script init-system.ps1");
  codeBlock([
    "Uso: .\\scripts\\init-system.ps1 [parametros]",
    "  -Build      : Compila TypeScript",
    "  -Start      : Inicia o sistema",
    "  -Backup     : Executa backup diario",
    "  -Full       : Build + Backup + Start (ciclo completo)",
  ]);

  // ========== 4. BUILD ==========
  t.doc.addPage();
  t.section("4", "Comandos de Build & Compilacao");
  const buildCmds = [
    ["npm run build", "Compila TypeScript para dist/", "tsc + copia assets"],
    ["npm run lint", "Verifica erros de TypeScript", "tsc --noEmit"],
    ["npm test", "Executa testes core", "tsx tests/core.test.ts"],
    ["npm run test:hyper", "Executa testes hyperlearning", "tsx tests/hyperbrain.test.ts"],
  ];
  buildCmds.forEach(([cmd, desc, acao]) => t.code(cmd, desc, acao));
  t.sub("Build do AIOX Core CLI");
  codeBlock(["cd packages/aiox-core && npm run build"]);

  // ========== 5. DEPLOY ==========
  t.doc.addPage();
  t.section("5", "Comandos de Deploy & Publicacao");
  t.para("Comandos para publicar o sistema em todas as plataformas.", 9.5, "#64748b");
  const deployCmds = [
    ["npm run deploy", "Deploy script manual", "scripts/deploy-all.ps1"],
    ["npm run deploy:full", "Build + Backup + GitHub + Vercel", "scripts/deploy-all.ps1 -Full"],
    ["npm run deploy:github", "Push para GitHub apenas", "scripts/deploy-all.ps1 -GitHub"],
    ["npm run deploy:vercel", "Deploy landing page p/ Vercel", "scripts/deploy-all.ps1 -Vercel"],
  ];
  deployCmds.forEach(([cmd, desc, acao]) => t.code(cmd, desc, acao));
  t.sub("Plataformas de Deploy");
  t.bullet("▸", "GitHub: https://github.com/ViseronSystem/trinnity-viseron-system");
  t.bullet("▸", "Vercel: https://trinnityviseron.com (Landing Page)");
  t.bullet("▸", "Railway: Backend TVS Core (configurado em railway.json)");
  t.bullet("▸", "Docker: docker-compose up (TVS + Ollama + Qdrant + n8n)");

  // ========== 6. MOBILE ==========
  t.doc.addPage();
  t.section("6", "Comandos Mobile (Android & iOS)");
  const mobileCmds = [
    ["npm run build:android", "Build APK para Android", "build-all.ps1 -Target android"],
    ["npm run build:ios", "Build IPA para iOS (macOS)", "build-all.ps1 -Target ios"],
    ["npm run build:all", "Build Android + iOS", "build-all.ps1 -Target all"],
    ["npm run build:eas-android", "Build via EAS (Expo)", "build-all.ps1 -Target eas-android"],
    ["npm run build:eas-ios", "Build iOS via EAS (Expo)", "build-all.ps1 -Target eas-ios"],
    ["npm run mobile:start", "Iniciar Expo dev server", "cd mobile && npx expo start"],
    ["npm run mobile:android", "Run Android direct", "cd mobile && npx expo run:android"],
    ["npm run mobile:ios", "Run iOS direct", "cd mobile && npx expo run:ios"],
  ];
  mobileCmds.forEach(([cmd, desc, acao]) => t.code(cmd, desc, acao));
  t.sub("Estrutura do App Mobile");
  t.bullet("▸", "Framework: Expo SDK 52 + React Native 0.76.9");
  t.bullet("▸", "Telas: Dashboard, Agents, Terminal (navegacao por abas)");
  t.bullet("▸", "Conexao: Socket.IO + REST API para o backend TVS");

  // ========== 7. DESKTOP ==========
  t.doc.addPage();
  t.section("7", "Comandos Desktop (Electron & Standalone)");
  const desktopCmds = [
    ["npm run build:exe", "Build executavel standalone (win)", "scripts/build-standalone.mjs"],
    ["npm run build:exe:win", "Build para Windows", "--platform win"],
    ["npm run build:exe:mac", "Build para macOS", "--platform mac"],
    ["npm run build:exe:linux", "Build para Linux", "--platform linux"],
    ["npm run build:exe:all", "Build para todas plataformas", "--platform all"],
    ["npm run build:electron", "Build Electron (win)", "--platform win --electron"],
    ["npm run build:electron:all", "Build Electron todas", "--platform all --electron"],
    ["npm run electron:setup", "Instalar deps do Electron", "cd electron && npm install"],
    ["npm run electron:start", "Iniciar Electron", "cd electron && npx electron ."],
    ["npm run electron:build:win", "Build Electron Windows", "NSIS installer + portable"],
    ["npm run electron:build:mac", "Build Electron macOS", "DMG"],
    ["npm run electron:build:linux", "Build Electron Linux", "AppImage + deb"],
  ];
  desktopCmds.forEach(([cmd, desc, acao]) => t.code(cmd, desc, acao));
  t.sub("Saida dos Builds");
  t.bullet("▸", "Standalone: .build/tvs-standalone/tvs-viseron-win.exe");
  t.bullet("▸", "Portable: .build/TVS_Viseron_Portable.zip");
  t.bullet("▸", "Electron: electron/dist-electron/ (configuravel)");

  // ========== 8. INTEGRACOES ==========
  t.doc.addPage();
  t.section("8", "Comandos de Integracoes");
  const integCmds = [
    ["npm run omniroute:start", "Inicia OmniRoute AI Gateway", "Porta 20128, 290+ providers"],
    ["npm run call:start", "Inicia Call System (Twilio)", "Voz + SMS com IA"],
    ["npm run jarvis:start", "Inicia OpenJarvis Bridge", "Stanford Personal AI"],
    ["npm run asno:start", "Inicia ASNO JARVIS Bridge", "WhatsApp + Home Assistant"],
    ["npm run omniroute:install", "Instala OmniRoute", "npm install omniroute"],
  ];
  integCmds.forEach(([cmd, desc, acao]) => t.code(cmd, desc, acao));
  t.sub("Integracoes Disponiveis");
  const integs = [
    ["OmniRoute Bridge", "Gateway para 290+ provedores de IA com roteamento inteligente"],
    ["n8n Bridge", "Automacao de workflows com 400+ templates prontos"],
    ["Call System Bridge", "Sistema de chamadas via Twilio com IA por voz"],
    ["OpenJarvis Bridge", "Integracao com Stanford Personal AI (JARVIS)"],
    ["ASNO Bridge", "Assistente JARVIS com WhatsApp, Home Assistant e voz"],
    ["Viseron Apps", "Ecossistema de aplicacoes integradas"],
    ["MCP Server", "Model Context Protocol para ferramentas externas"],
  ];
  integs.forEach(([name, desc]) => t.bullet("▸", `${name} — ${desc}`));

  // ========== 9. BACKUP ==========
  t.doc.addPage();
  t.section("9", "Comandos de Backup & Manutencao");
  const backupCmds = [
    ["npm run backup", "Executa backup manual agora", "scripts/backup-system.ps1"],
    ["npm run backup:schedule", "Agenda backup diario (03:00)", "scripts/schedule-backup.ps1"],
  ];
  backupCmds.forEach(([cmd, desc, acao]) => t.code(cmd, desc, acao));
  t.sub("Sistema de Backup Diario");
  t.para("O sistema de backup automatico (scripts/backup-system.ps1) cria backups completos:", 9, "#0f172a");
  t.bullet("▸", "Backup completo: config/, data/, database/, src/, scripts/, agents/, packages/, mobile/, electron/, docs/");
  t.bullet("▸", "Formato: ZIP com timestamp (YYYY-MM-DD_HHmmss.zip)");
  t.bullet("▸", "Retencao: 30 dias (backups antigos sao removidos automaticamente)");
  t.bullet("▸", "Agendamento: Windows Task Scheduler as 03:00 (ou manual via npm run backup)");
  t.bullet("▸", "Inclui todos os PDFs e documentacao");

  // ========== 10. AIOX CLI ==========
  t.doc.addPage();
  t.section("10", "Comandos do AIOX Core CLI");
  t.para("AIOX Core e a CLI oficial do ecossistema Trinnity Viseron.", 9.5, "#64748b");
  const aioxCmds = [
    ["aiox-core init", "Inicializa um novo projeto TVS", "Cria estrutura base"],
    ["aiox-core install", "Instala dependencias do projeto", "npm install automatico"],
    ["aiox-core status", "Mostra status do sistema TVS", "Saude e metricas"],
    ["aiox-core --help", "Ajuda completa da CLI", "Todos os comandos"],
  ];
  aioxCmds.forEach(([cmd, desc, acao]) => t.code(cmd, desc, acao));
  t.sub("Instalacao do AIOX Core");
  codeBlock([
    "cd packages/aiox-core",
    "npm install",
    "npm link  (ou npm install -g .)",
  ]);

  // ========== 11. API REST ==========
  t.doc.addPage();
  t.section("11", "API REST - Endpoints Completos");
  t.para("A API REST do TVS permite controlar todo o sistema remotamente.", 9.5, "#64748b");
  t.sub("Dashboard API (Porta 3000)");
  const dashApi = [
    ["GET /api/health", "Health check do sistema", "Status do servidor"],
    ["GET /api/stats", "Estatisticas completas", "Agentes, memoria, evolucao"],
    ["GET /api/agents", "Lista todos os agentes", "Array de agentes"],
    ["GET /api/status", "Status com squads", "Squads e lideres"],
    ["GET /api/battalion", "Relatorio do batalhao", "114 agentes do batalhao"],
    ["GET /api/battalion/:id", "Agente especifico", "Detalhes do agente"],
    ["GET /api/directives", "Estatisticas de diretivas", "Ativas e completadas"],
    ["POST /api/directive", "Emitir nova diretiva", "Criar missao"],
    ["POST /api/synthesize", "Sintese multi-provedor", "Ensemble de IAs"],
  ];
  dashApi.forEach(([ep, desc, resp]) => t.code(ep, desc, resp));
  t.sub("Report Server API (Porta 3001)");
  const reportApi = [
    ["GET /", "Informacao do servidor", "Endpoints disponiveis"],
    ["GET /stats", "Estatisticas do sistema", "Agentes ativos/total"],
    ["GET /agents", "Lista compacta de agentes", "ID, nome, role, status"],
    ["GET /agents/:id", "Detalhes de um agente", "Capacidades completas"],
    ["GET /report", "Relatorio JSON completo", "Sistema + agentes + IA"],
    ["GET /report/pdf", "Download PDF do relatorio", "PDF formatado"],
    ["GET /report/comprehensive-pdf", "PDF completo do batalhao", "PDF com todos dados"],
    ["GET /superintelligence", "Status SuperIntelligence", "Nivel de inteligencia"],
    ["GET /supermind", "Nivel SuperMind", "Dominios de conhecimento"],
  ];
  reportApi.forEach(([ep, desc, resp]) => t.code(ep, desc, resp));

  // ========== 12. MODULOS CORE ==========
  t.doc.addPage();
  t.section("12", "Modulos do Core TVS");
  t.para("O TVS possui 22 subsistemas core no ViseronCore:", 9.5, "#64748b");
  const coreMods = [
    ["AgentManager", "Registro e execucao de agentes", "list(), register(), run()"],
    ["ModelRouter", "Roteamento p/ melhor modelo IA", "route(criteria)"],
    ["MemoryEngine", "Memoria STM + LTM persistente", "addShortTerm(), setLongTerm()"],
    ["ToolManager", "Ferramentas externas", "createQuickTool(), executeTool()"],
    ["ProviderFactory", "Fabrica de provedores IA", "getProvider(), generate()"],
    ["SquadManager", "Gestao de squads", "addMemberToSquad(), getSquad()"],
    ["MCP Server", "Model Context Protocol", "initialize(), registerTool()"],
    ["Orchestrator", "Orquestracao multi-agente", "orchestrate(task, desc)"],
    ["CommandChain", "Cadeia: Pedro + Trinnity", "issueDirective(), ratify()"],
    ["AutoLearningEngine", "Aprendizado a cada 30 min", "startLearningCycle()"],
    ["HyperLearningEngine", "Inteligencia x6 a cada 30 min", "start(interval)"],
    ["AutonomousPlanner", "Planejamento autonomo", "plan(objective)"],
    ["AutoEvolutionEngine", "Evolucao genetica", "evolveAll(), crossPollinate()"],
    ["SuperMind", "500 anos conhecimento", "synthesize(prompt, domains)"],
    ["SuperIntelligence", "1000%+ sobre IA individual", "synthesize(input)"],
    ["AIProviderBridge", "Ponte 290+ provedores", "chat(request), ensemble()"],
    ["AppScaffolder", "Geracao de aplicacoes", "scaffold(config)"],
    ["WebAppGenerator", "Geracao de websites", "generateCryptoSite()"],
    ["TokenEngine", "Tokens e contratos", "generateToken(), deployToken()"],
    ["BusinessSolutionEngine", "Solucoes empresariais", "solve(problem)"],
    ["AgentSpawner", "Spawn 5000+ mentes", "loadMinds(), spawnAll()"],
    ["AgentFactory", "Fabrica de agentes", "createAgent(spec)"],
    ["AgentCollaborator", "Colaboracao entre agentes", "collaborate(task, agents)"],
  ];
  coreMods.forEach(([name, desc, api]) => t.kv(name, `${desc} — ${api}`));

  // ========== 13. PROVEDORES IA ==========
  t.doc.addPage();
  t.section("13", "Provedores de IA Suportados");
  t.para("O TVS suporta 8+ provedores diretamente e 290+ via OmniRoute Bridge.", 9.5, "#64748b");
  const providersTable = [
    ["Ollama (Local)", "Llama 3, Qwen 2, Mistral", "0", "8K-32K", "Offline, zero", "Padrao"],
    ["OpenAI", "GPT-4o, GPT-4o-mini, o1", "$0.002-15", "128K-200K", "Estado da arte", "Key"],
    ["Anthropic", "Claude Sonnet 4, Opus 4", "$0.003-15", "200K", "Seguranca", "Key"],
    ["Google", "Gemini 2.5 Flash/Pro", "$0.00015-1", "1M+", "Multimodal", "Key"],
    ["xAI", "Grok 3", "$0.002", "131K", "Dados tempo real", "Key"],
    ["DeepSeek", "DeepSeek Chat", "$0.0005", "128K", "Open-weight", "Key"],
    ["Mistral", "Mistral Large/Small", "$0.001-2", "32K-128K", "Eficiente EU", "Key"],
    ["Cohere", "Command A", "$0.0015", "128K", "RAG-optimizado", "Key"],
    ["HuggingFace", "Llama 3.3 70B, Mixtral", "$0.0004", "8K-65K", "Open-source", "Key"],
    ["Together AI", "Llama 3.3 70B Turbo", "$0.0005", "8K", "Inferencia rapida", "Key"],
    ["Perplexity", "Sonar Pro", "$0.001", "128K", "Pesquisa online", "Key"],
    ["OmniRoute", "290+ modelos agregados", "Variado", "Variado", "Gateway", "Config"],
  ];
  t.para("Custo/1K · Contexto · Diferencial · Req.:", 8.5, "#64748b");
  providersTable.forEach((row) => t.bullet("▸", `${row[0]} — ${row[1]} — ${row[2]} — ${row[3]} — ${row[4]} — ${row[5]}`));
  t.sub("Estrategias de Roteamento");
  t.bullet("▸", "single: Usa um unico provedor (default: Ollama)");
  t.bullet("▸", "compare: Compara respostas de multiplos modelos");
  t.bullet("▸", "ensemble: Agrega respostas de todos os provedores disponiveis");
  t.bullet("▸", "fallback: Se um falha, proximo da lista e usado automaticamente");
  t.bullet("▸", "local-first: Tenta Ollama primeiro, depois cloud");

  // ========== 14. TOKENS ==========
  t.doc.addPage();
  t.section("14", "Tokens: $VSR e $TRIN");
  t.sub("$VSR  Viseron Crown (Token de Governanca)");
  t.bullet("▸", "Supply: 300,000,000 VSR");
  t.bullet("▸", "Standard: TVS Standard v1.0.0");
  t.bullet("▸", "Funcao: Governanca do sistema, voto em evolucoes, diretivas");
  t.sub("Distribuicao:");
  t.bullet("▸", "Trinnity Hurtado (Tesouro Corona): 90M VSR (30%)");
  t.bullet("▸", "Pedro Costa (Tesouro Hierro): 75M VSR (25%)");
  t.bullet("▸", "TVS Legion (Pool de Agentes): 90M VSR (30%)");
  t.bullet("▸", "Reserva Estrategica: 45M VSR (15%)");
  t.sub("$TRIN  Trinnity (Token de Utilidade)");
  t.bullet("▸", "Supply: Dinamico (cunhado/queimado por atividade)");
  t.bullet("▸", "Funcao: Gas para execucao de agentes, creditos de computacao, taxas");
  t.bullet("▸", "Rede: Ethereum (ERC-20)");
  t.sub("Tokenomics:");
  t.bullet("▸", "Distribuicao: Team 10%, Marketing 15%, Liquidity 20%, Development 10%, Staking 25%, Community 20%");
  t.bullet("▸", "Inflacao: 2% anual | Deflacao: 1% queimado por transacao");

  // ========== 15. SOLUCOES ==========
  t.doc.addPage();
  t.section("15", "Solucoes que Oferecemos ao Mundo");
  t.para("O Trinnity Viseron System nao e apenas um software e uma plataforma completa de superinteligencia que resolve problemas reais em escala global.", 10, "#0f172a", { align: "justify" });
  const sols = [
    ["Superinteligencia Multi-Agente", "5.112 agentes autonomos em paralelo, cada um especializado em um dominio, permitindo analise multidimensional de qualquer desafio."],
    ["Gateway Universal de IA (OmniRoute)", "Acesso a 290+ provedores de IA via unica API. Roteamento inteligente, fallback automatico e otimizacao de custos."],
    ["Geracao Multi-Plataforma", "Criacao automatica de apps web, mobile (APK + IPA), desktop (Win/Mac/Linux) e Docker a partir de descricao natural."],
    ["Tokenomics Inteligente", "Geracao completa de tokens ERC-20 com contratos Solidity, staking pools, governanca on-chain e distribuicao automatica."],
    ["Solucoes Empresariais", "De planos de negocios a implementacao completa. Arquiteturas, codigo, documentacao e estrategias de mercado."],
    ["Integracao Total", "n8n (automacao), Twilio (voz/SMS), Home Assistant (smart home), JARVIS (assistente), MCP (ferramentas externas)."],
    ["Auto-Evolucao Continua", "O sistema evolui sozinho a cada 30 min. Inteligencia cresce +500% por ciclo. Agentes desenvolvem novas capacidades."],
    ["Seguranca e Soberania", "Operacao 100% offline com Ollama. Dados nunca saem do seu ambiente. Ideal para governos e defesa."],
  ];
  sols.forEach(([name, desc]) => {
    t.sub(name);
    t.para(desc, 9, "#334155");
  });

  // ========== 16. MODELO ASSINATURA ==========
  t.doc.addPage();
  t.section("16", "Modelo de Assinatura  Por que Pagar?");
  t.para("O TVS e um sistema operacional de superinteligencia que substitui dezenas de ferramentas, servicos e equipes.", 10, "#0f172a", { align: "justify" });
  t.sub("O QUE VOCE RECEBE");
  const perks = [
    "5.112 Agentes de IA trabalhando 24/7 para voce",
    "Acesso a 290+ modelos de IA (GPT-4o, Claude, Gemini, Grok)",
    "Geracao ilimitada de aplicacoes (web, mobile, desktop)",
    "Criacao de tokens e contratos inteligentes",
    "Automacao via n8n com 400+ templates",
    "Sistema de chamadas com IA via Twilio",
    "Memoria de longo prazo e auto-evolucao",
    "Suporte prioritario da equipe TVS",
    "Execucao local (offline) ou cloud",
  ];
  perks.forEach((p) => t.bullet("▸", p));
  t.sub("POR QUE NAO E GRATUITO?");
  const reasons = [
    ["Infraestrutura de IA", "Cada requisicao a modelos como GPT-4o, Claude Opus ou Gemini Pro tem custo real por token."],
    ["Manutencao Continua", "5.112 agentes, 22 modulos core, 6 bridges requerem atualizacao e suporte continuos."],
    ["Desenvolvimento Constante", "Novas funcionalidades, mais provedores, melhor performance. P&D continuo."],
    ["Infraestrutura de Servidores", "Dashboard, API, n8n, Qdrant DB multiplos servicos rodando 24/7."],
    ["Suporte e Documentacao", "Equipe dedicada para suporte tecnico, documentacao e tutoriais."],
    ["Economia de Escala", "Por $29-99/mes voce substitui: 10+ devs, 5+ assinaturas IA, 3+ servicos cloud."],
  ];
  reasons.forEach(([name, desc]) => t.bullet("▸", `${name} — ${desc}`));

  // ========== 17. PLANOS ==========
  t.doc.addPage();
  t.section("17", "Planos e Precos");
  const plans = [
    {
      title: "DEVELOPER", price: "$29/mes",
      items: [
        "Acesso a 5.112 agentes de IA",
        "10 requisicoes/minuto a API",
        "Modelos locais (Ollama) + GPT-4o-mini",
        "Geracao de apps web e mobile",
        "Dashboard web e API REST",
        "Backup diario automatico",
        "1 projeto",
        "Comunidade Discord",
      ]
    },
    {
      title: "PROFESSIONAL (RECOMENDADO)", price: "$99/mes",
      items: [
        "Tudo do Developer, mais:",
        "100 requisicoes/minuto a API",
        "Todos modelos cloud (GPT-4o, Claude, Gemini, Grok)",
        "Ensemble multi-provedor (8 IAs simultaneas)",
        "OmniRoute Gateway (290+ provedores)",
        "Tokens ERC-20 + contratos Solidity",
        "Integracao n8n + Twilio + JARVIS",
        "5 projetos + Suporte 24/7",
      ]
    },
    {
      title: "ENTERPRISE", price: "$499/mes",
      items: [
        "Tudo do Professional, mais:",
        "Requisicoes ilimitadas a API",
        "Deploy dedicado (Railway / Docker / On-premise)",
        "White label do sistema",
        "Consultoria personalizada",
        "SLA 99.9%",
        "Projetos ilimitados",
        "Gerente de conta dedicado",
      ]
    },
  ];
  plans.forEach((pl) => {
    t.sub(`${pl.title} — ${pl.price}`);
    pl.items.forEach((it) => t.bullet("▸", it));
  });

  // ========== 18. SQUADS ==========
  t.doc.addPage();
  t.section("18", "Squads AIOX, Pedro & Trinnity");
  t.para("Lideranca maxima de Pedro Costa (Comandante Supremo) e Trinnity Hurtado (Reina Arquitecta).", 10, "#0f172a");
  t.sub("PEDRO COSTA  Comandante Supremo");
  t.bullet("▸", "Estrategia: EXPANSAO  Squads: AIOX Core, Expansion Force, Deployment Squad");
  t.bullet("▸", "Funcao: Orquestrar deploy, infraestrutura, crescimento e operacoes do sistema");
  t.bullet("▸", "Cor: #00ff88  Prioridade: Maxima  Status: Ativo");
  t.sub("TRINNITY HURTADO  Reina Arquitecta");
  t.bullet("▸", "Estrategia: EVOLUCAO  Squads: AIOX Core, Evolution Lab, Intelligence Squad");
  t.bullet("▸", "Funcao: Evolucao da IA, hyper-learning, sintese de conhecimento");
  t.bullet("▸", "Cor: #ff00ff  Prioridade: Maxima  Status: Ativo");
  t.sub("Squads do Sistema");
  const sqds = [
    ["AIOX CORE SQUAD", "Pedro Costa + Trinnity Hurtado", "Orchestrator, Planner, Evolution Engine, Hyper Learner, Memory Keeper, Provider Router, App Builder", "Squad principal do nucleo do sistema operacional de IA."],
    ["EXPANSION FORCE", "Pedro Costa", "Deploy Master, Backup Guardian, System Monitor", "Deploy, infraestrutura, backup e monitoramento."],
    ["EVOLUTION LAB", "Trinnity Hurtado", "AI Researcher, Tokenomics Engineer, SuperMind Synthesizer", "Pesquisa e evolucao continua da IA."],
    ["DEPLOYMENT SQUAD", "Pedro Costa", "Web Deployer, Mobile Builder, Desktop Packager, Docker Captain", "Build e publicacao em todas as plataformas."],
    ["INTELLIGENCE SQUAD", "Trinnity Hurtado", "Voice Commander, OmniRoute Navigator, n8n Automator, Call System Operator, JARVIS Bridge", "Integracoes de voz, automacao e gateways."],
  ];
  sqds.forEach((sq) => {
    t.sub(sq[0]);
    t.bullet("▸", `Lider: ${sq[1]}`);
    t.bullet("▸", `Agentes: ${sq[2]}`);
    t.bullet("▸", `Missao: ${sq[3]}`);
  });

  // ========== 19. PLATAFORMA CODE & APPS LLM ==========
  t.doc.addPage();
  t.section("19", "Plataforma CODE & Apps LLM");
  t.para("Consola de operacao real para criar mentes VISERON, executar agentes com IA local e monitorizar o AIOX.", 9.5, "#64748b");

  t.sub("19.1 O que e a CODE Platform");
  t.para("A CODE Platform e a consola de operacao do sistema, acessivel no WebOS (http://localhost:3000/dashboard.html) pelo icone CODE. Permite operar todo o sistema diretamente do navegador: criar agentes, executar tarefas com IA local, gerir squads e acompanhar a monitorizacao AIOX.", 9, "#0f172a");

  t.sub("19.2 Comandos do Console CODE");
  const codeCmds = [
    ["status", "Estado do sistema em tempo real (agentes, squads, blueprints)"],
    ["agents", "Lista todas as mentes registadas"],
    ["blueprints", "7 blueprints prontos (BizAnalyst, DataMind, FullStackForge, AIForge, DevOpsShield, MarketMind, ProjectCore)"],
    ["create <Nome> <Rol>", "Cria uma mente VISERON nova"],
    ["run <id> <tarefa>", "Executa um agente com IA local (Ollama qwen2.5:3b)"],
    ["help / clear", "Lista de comandos / limpa o console"],
  ];
  codeCmds.forEach(([cmd, desc]) => t.code(cmd, desc));

  t.sub("19.3 Catalogo Apps LLM (awesome-llm-apps)");
  t.para("O sistema incorpora 8 aplicacoes LLM portadas do repositorio awesome-llm-apps (Apache-2.0) como skills de TVS em skills/vendor/awesome-llm-apps/. Cada app cria uma mente especializada com um clique:", 9, "#0f172a");
  const llmApps = [
    ["Deep Research", "Investigacao profunda com relatorio final e fontes"],
    ["Local RAG", "Perguntar aos teus documentos com IA 100% local"],
    ["Mixture of Agents", "Varios modelos respondem, agregador escolhe a melhor"],
    ["Multi-Agent Team", "Equipa de especialistas que planifica e executa projetos"],
    ["Self-Evolving", "O agente reescreve os proprios prompts para melhorar"],
    ["Always-On Briefing", "Vigia fontes e envia brief diario por email (Gmail)"],
    ["Voice RAG", "Perguntar aos documentos por voz"],
    ["Generative UI", "Gera interfaces interativas por linguagem natural"],
  ];
  llmApps.forEach(([name, desc]) => t.code(name, desc));

  t.sub("19.4 Autoria: Pedro & Trinnity");
  t.para("Pedro Costa (Comandante Supremo, clearance tvs_creator) e Trinnity Hurtado (Rainha & Arquiteta Chefe, clearance tvs_architect) sao os unicos autores e donos do sistema. Todos os squads executivos e de arquitetura sao liderados por eles. A autoria fica registada em data/Viseron_Autoria_e_Propriedade.md.", 9, "#0f172a");

  t.sub("19.5 Monitorizacao AIOX");
  t.para("O endpoint GET /api/code/aiox expoe o nivel de conhecimento AIOX, o estado dos cerebros de Pedro/Trinnity, memoria (STM/LTM) e o ultimo ciclo de aprendizagem. O AutoLearningEngine corre um ciclo a cada 30 minutos e o AIOX Core Squad de 7 agentes governa o nucleo operativo.", 9, "#0f172a");

  // ========== 20. GLOSSARIO ==========
  t.doc.addPage();
  t.section("20", "Glossario de Comandos Rapidos");
  t.para("Resumo executivo dos comandos mais importantes.", 9.5, "#64748b");
  const glossary = [
    ["INICIAR", "npm run dev", "Modo desenvolvimento com hot-reload"],
    ["INICIAR", "npm start", "Modo producao"],
    ["INICIAR", "npm run init:full", "Build + Backup + Start completo"],
    ["BUILD", "npm run build", "Compilar TypeScript"],
    ["BUILD", "npm run lint", "Verificar erros TS"],
    ["MOBILE", "npm run build:android", "Gerar APK Android"],
    ["MOBILE", "npm run build:ios", "Gerar IPA iOS"],
    ["DESKTOP", "npm run build:exe", "Gerar .exe Windows"],
    ["DESKTOP", "npm run build:electron", "Build Electron"],
    ["DEPLOY", "npm run deploy:full", "GitHub + Vercel completo"],
    ["DEPLOY", "npm run deploy:github", "Push GitHub"],
    ["DEPLOY", "npm run deploy:vercel", "Deploy Vercel"],
    ["BACKUP", "npm run backup", "Backup manual imediato"],
    ["BACKUP", "npm run backup:schedule", "Agendar backup 03:00"],
    ["INTEGRACOES", "npm run omniroute:start", "Gateway 290+ IAs"],
    ["INTEGRACOES", "npm run call:start", "Call System Twilio"],
    ["INTEGRACOES", "npm run jarvis:start", "OpenJarvis Bridge"],
    ["INTEGRACOES", "npm run asno:start", "ASNO JARVIS"],
    ["TESTES", "npm test", "Testes core do sistema"],
    ["TESTES", "npm run test:hyper", "Testes hyperlearning"],
    ["RELATORIOS", "http://localhost:3000", "Dashboard web"],
    ["RELATORIOS", "http://localhost:3001/report/pdf", "PDF do sistema"],
    ["CODE", "http://localhost:3000/dashboard.html", "Plataforma CODE (criar/operar VISERON)"],
    ["CODE", "GET /api/code/aiox", "Monitorizacao AIOX (nivel conhecimento, cerebros)"],
    ["CODE", "GET /api/code/system", "Estado consolidado da plataforma CODE"],
    ["CODE", "npm run skills:install", "Instalar catalogos de skills"],
    ["AIOX", "npm run audit:arkom", "Auditoria com squads AIOX-1..5 (GO/NO-GO)"],
  ];
  glossary.forEach(([cat, cmd, desc]) => t.code(cmd, desc, cat));

  t.rule();
  t.title("TRINNITY VISERON SYSTEM v5.0", 20);
  t.para("\"Construindo o futuro da inteligencia artificial  uma mente de cada vez.\"", 10, "#334155");
  t.para("Pedro Costa  Comandante Supremo", 9, "#64748b");
  t.para("Trinnity Hurtado  Reina Arquitecta", 9, "#64748b");
  t.para("https://github.com/ViseronSystem/trinnity-viseron-system", 8.5, "#64748b");

  // ========== PAGINA FINAL ==========
  t.doc.addPage();
  t.title("OBRIGADO", 30);
  t.sub("Trinnity Viseron System  Sempre em Evolucao");
  t.rule();
  t.para("$VSR  $TRIN  AIOX", 11, "#b45309");
  t.para("Este manual foi gerado automaticamente pelo TVS v5.0", 9, "#64748b");
  t.para(new Date().toLocaleDateString('pt-BR'), 9, "#64748b");

  t.finish(outputPath);
  console.log(`[PDF] Manual completo gerado: ${outputPath}`);
}

// Executar
generateManual(path.join(__dirname, "..", "docs", "pdfs", "manuals", "TVS_Manual_Completo.pdf")).catch(console.error);
