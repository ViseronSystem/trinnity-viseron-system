#!/usr/bin/env node
import path from "path";
import { createTheme } from "./pdf-theme";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "Viseron_Ecosistema_10_Repositorios.pdf");

const t = createTheme({
  title: "TVS Ecosistema - 10 Repos Integrados",
  subject: "Guia completo de execucao de todos os repositorios integrados",
  accent: "#22d3ee",
  accent2: "#a855f7",
});

t.cover({
  title: "TVS ECOSISTEMA\n10 REPOSITORIOS\nINTEGRADOS",
  subtitle: "Guia de Instalacao, Configuracao e Execucao\nTodos com autorinha TVS",
  badges: ["10 Repos", "TypeScript", "Python", "C++", "Monitoramento"],
  date: "26/08/2026",
  version: "1.0",
  url: "www.trinnityviseronsystem.io",
});

t.section("0", "Indice");
["1. Visao Geral do Ecossistema","2. CamoFox Browser - Anti-Detection Browser","3. Vibe Trading - AI Trading Platform","4. Claude Ads - 12-Platform Ad Operations","5. AI Ads Strategist - Ad Strategy Generator","6. HyperFrames - HTML to MP4 Video Renderer","7. Fincept Terminal - Financial Research","8. OpenGen - Distributed AI Research","9. Open Generative AI - 400+ AI Models","10. Strix - AI Pentesting","11. Comandos Globais de Execucao","12. Monitoramento Pedro/Trinnity/Squads","13. API Endpoints"].forEach((i) => t.bullet("\u25b8", i));
t.spacer(6);

t.section("1", "Visao Geral do Ecossistema");
t.para("O Trinnity Viseron System integra 10 repositorios open-source de ultima geracao, todos com autorinha de Pedro Costa (Comandante) e Trinnity Hurtado (Rainha). Cada repositorio foi clonado, analisado e integrado com monitoramento completo para os Squads AIOX.", 10);
t.sub("Repositorios Integrados");
[{id:"1",n:"CamoFox Browser",l:"TypeScript",d:"Anti-detection browser para AI agents"},{id:"2",n:"Vibe Trading",l:"Python",d:"74+ MCP tools, 13 brokers, trading AI"},{id:"3",n:"Claude Ads",l:"Python",d:"12 plataformas de midia paga"},{id:"4",n:"AI Ads Strategist",l:"Python",d:"15 comandos, 5 agentes paralelos"},{id:"5",n:"HyperFrames",l:"TypeScript",d:"HTML to MP4 deterministic rendering"},{id:"6",n:"Fincept Terminal",l:"C++20",d:"100+ data connectors finance"},{id:"7",n:"OpenGen",l:"Python",d:"Research AI distribuido, verificacao"},{id:"8",n:"Open Generative AI",l:"Next.js",d:"400+ modelos imagem/video"},{id:"9",n:"Strix",l:"Python",d:"AI pentesting autonomo"},{id:"10",n:"TVS Core",l:"TypeScript",d:"Sistema integrador + monitoramento"}].forEach((r) => t.kv(`${r.id}. ${r.n} (${r.l})`, r.d));
t.spacer(4);

t.section("2", "CamoFox Browser - Anti-Detection Browser");
t.para("Browser server anti-detection para AI agents, powered by Camoufox (Firefox fork com patches C++). Bypass de Cloudflare, Google bot detection e fingerprint tracking. Duas versoes integradas: jo-inc (original) e redf0x1 (TypeScript rewrite com Auth Vault AES-256-GCM).");
t.sub("Capacidades");
t.bullets(["C++ anti-detection (bypass Google/Cloudflare/bot detection)","Accessibility snapshots (~90% smaller than HTML)","14+ search macros (Google, YouTube, Amazon, Reddit, LinkedIn)","YouTube transcript extraction via yt-dlp","Auth Vault (AES-256-GCM encrypted credentials)","Pipeline scripting (multi-step workflows)","Proxy + GeoIP routing, session persistence","MCP compatible, CLI com 50+ comandos"]);
t.sub("Como Executar");
t.code("cd camofox-browser-red", "Entrar no diretorio TypeScript");
t.code("npm install", "Instalar dependencias");
t.code("npm run build", "Compilar TypeScript");
t.code("npm start", "Iniciar servidor na porta 3000");
t.code("docker compose up -d", "Ou iniciar com Docker");
t.sub("Variaveis de Ambiente");
t.kv("PORT:", "3000 (porta do servidor)");
t.kv("PROXY_URL:", "proxy://user:pass@host:port (opcional)");
t.kv("CAMOUFOX_HEADLESS:", "true/false (modo headless)");
t.sub("Uso no TVS");
t.para("Substitui Playwright para browsing autonomo dos agentes JARVIS/AIOX. Search macros alimentam telecom prospecting. YouTube transcripts alimentam knowledge graph. Auth Vault segura credenciais Composio/RCS.", 9);

t.section("3", "Vibe Trading - AI Trading Platform");
t.para("Plataforma completa de trading AI com 74+ MCP tools, 286+ quantlib functions, 13 broker connectors, 25+ market data sources, backtesting engines, swarm multi-agent research e portfolio risk analysis.");
t.sub("Capacidades");
t.bullets(["74+ MCP tools de mercado (opcoes, bonds, VaR, portfolio)","286+ quantlib functions testadas","13 broker connectors (IBKR, Alpaca, eToro, Futu)","25+ market data sources (Yahoo, FRED, BaoStock)","9 backtest engines (US, China A-share, HK, Korea)","Swarm multi-agent research","Portfolio risk x-ray e options lab","Shadow/paper trading sem risco real"]);
t.sub("Como Executar");
t.code("cd vibe-trading", "Entrar no diretorio");
t.code("pip install -e .", "Instalar como pacote Python");
t.code("pip install vibe-trading-ai", "Ou instalar do PyPI");
t.code("vibe-trading", "Iniciar a plataforma");
t.sub("Modo API (FastAPI)");
t.code("uvicorn vibe_trading.api:app --host 0.0.0.0 --port 8000", "API na porta 8000");
t.sub("Uso no TVS");
t.para("Powera VISERON Finance Agent com analytics institucionais. MCP tools registadas no ToolManager. Backtesting para estrategias Cosmos ($VSR/$TRIN). QuantLib exposto via OMEGA kernel.");

t.section("4", "Claude Ads - 12-Platform Ad Operations");
t.para("Operacoes de midia paga em 12 plataformas com safety gates. Claude-first, read-only por omisso. Cobre Google Ads, Meta Ads, YouTube, LinkedIn, TikTok, Reddit, Snapchat, X, Apple, Amazon, Pinterest e Microsoft Advertising.");
t.sub("Capacidades");
t.bullets(["12 plataformas de advertising","Audits com evidencias datadas e confidence levels","Campaign planning e budget allocation","Creative workflows (copy/image/video)","Monitoring (pacing, delivery, fatigue, policy)","Health scoring com evidence coverage analysis","Safety gates: read-only default, approval antes de mutation","Versioned JSON bundles to Markdown/HTML/PDF"]);
t.sub("Como Executar");
t.code("cd claude-ads", "Entrar no diretorio");
t.code("pip install -r requirements.txt", "Instalar dependencias Python");
t.code("python -m claude_ads --help", "Ver comandos disponiveis");
t.code("python -m claude_ads audit --platform google --account-id XXX", "Auditar Google Ads");
t.code("python -m claude_ads plan --platform meta --budget 5000", "Criar campanha Meta");
t.sub("Uso no TVS");
t.para("Enriquece Agency OS reporting e creativos agents. 12 plataformas substituem foco Meta/Google. Pipeline audit-plan-create-monitor-report mapeia workflow da agencia.");

t.section("5", "AI Ads Strategist - Ad Strategy Generator");
t.para("15 comandos, 5 agentes paralelos, 6 plataformas. Gera estrategia completa de ads a partir de uma unica URL, incluindo audience personas, campaign funnels, budget allocation e PDF reports. Ad Readiness Score de 0-100.");
t.sub("Comandos Disponiveis");
t.bullets(["/ads strategy - Estrategia completa a partir de URL","/ads quick - Analise rapida","/ads audience - Personas de audiencia","/ads competitors - Analise competitiva","/ads keywords - Pesquisa de palavras-chave","/ads audit - Auditoria de ads existentes","/ads copy - Copywriting para anuncios","/ads hooks - Ganchos criativos","/ads creative - Criativos visuais","/ads video - Script de video","/ads funnel - Funil de conversao","/ads budget - Alocacao de orcamento","/ads testing - Plano de testes A/B","/ads landing - Otimizacao de landing page","/ads report-pdf - Gerar relatorio PDF"]);
t.sub("Como Executar");
t.code("cd ai-ads-claude", "Entrar no diretorio");
t.code("pip install -r requirements.txt", "Instalar dependencias");
t.code("python ads_cli.py strategy https://meusite.com", "Estrategia completa");
t.code("python ads_cli.py quick https://meusite.com", "Analise rapida");
t.code("python ads_cli.py report-pdf https://meusite.com", "Gerar PDF");
t.sub("Uso no TVS");
t.para("Agente creativos da agencia com geracao estruturada. Ad Readiness Score exposto via agency API. Arquitetura paralela (5 agentes) espelha padrao squad AIOX.");

t.section("6", "HyperFrames - HTML to MP4 Video Renderer");
t.para("Framework open-source pela Heygen para tornar HTML, CSS, media e animacoes em videos MP4 deterministicos. Write HTML. Render video. Built for agents. Rendering deterministica (mesmo input = mesmo output).");
t.sub("Capacidades");
t.bullets(["Composicao de video nativa HTML (sem build React)","Rendering deterministica (mesmo input = mesmo output)","20 agent skills para criacao de video","Catalog de reusable blocks/transitions/overlays","Frame.md design system para video","CLI preview/lint/render/publish","AWS Lambda rendering distribuido","WebGL shader transitions","MCP compatible"]);
t.sub("Como Executar");
t.code("cd hyperframes", "Entrar no diretorio");
t.code("npm install", "Instalar dependencias Node.js");
t.code("npm run build", "Compilar projeto");
t.code("npx hyperframes render input.html output.mp4", "Renderizar video");
t.code("npx hyperframes preview input.html", "Preview no browser");
t.code("npx hyperframes lint input.html", "Validar HTML");
t.sub("Uso no TVS");
t.para("Criacao automatica de conteudo video para agencia e redes sociais. Agent skills permitem JARVIS gerar product launch videos, explainers e social clips.");

t.section("7", "Fincept Terminal - Financial Research Terminal");
t.para("Terminal C++20 nativo para pesquisa financeira com analytics institucionais, 100+ data connectors, 37 AI agents, 16 broker integrations. Edicao gratuita AGPL-3.0 e Enterprise ($99-$299/user/mes).");
t.sub("Capacidades");
t.bullets(["41 modulos em 6 desks","100+ data connectors (FRED, IMF, World Bank, Polygon, Kraken, Yahoo)","37 AI agents (trader/investor, economic, geopolitics)","16 broker integrations","DCF / portfolio optimization / VaR / Sharpe / derivatives pricing","Visual node editor para workflows","MCP tools","AI Quant Lab (ML, factor discovery, RL)","Maritime tracking e geopolitical analysis"]);
t.sub("Como Executar");
t.code("cd fincept-terminal", "Entrar no diretorio");
t.code("cmake -B build -DCMAKE_BUILD_TYPE=Release", "Configurar build CMake");
t.code("cmake --build build --config Release", "Compilar (pode demorar)");
t.code("./build/fincept-terminal", "Iniciar terminal");
t.sub("Modo Python (analytics)");
t.code("pip install -r requirements.txt", "Instalar Python deps");
t.code("python -m fincept.api", "Iniciar API de dados");
t.sub("Uso no TVS");
t.para("Dados financeiros institucionais como TVS tool. 100+ connectors alimentam analise Cosmos tokens ($VSR/$TRIN). 37 AI agents registados via MCP.");

t.section("8", "OpenGen - Distributed AI Research");
t.para("Sistema de pesquisa AI distribuido com pipeline de 5 agentes, verificacao comunitaria (25+ reviewers com trust-weighted votes), knowledge graph publico e worker network para compute distribuido.");
t.sub("Capacidades");
t.bullets(["Pipeline de 5 agentes (Retriever, Planner, Stylist, Visualizer, Critic)","Ate 20 rodadas de refinamento por tarefa","Verificacao comunitaria com trust-weighted voting","Deteccao de manipulacao/lobby","Knowledge graph publico com API gratuita","Worker network para compute distribuido","Processo de pesquisa transparente (live em opengen.live)"]);
t.sub("Como Executar");
t.code("cd opengen", "Entrar no diretorio");
t.code("pip install -r requirements.txt", "Instalar dependencias");
t.code("python -m opengen.worker --join", "Tornar-se worker");
t.code("python -m opengen.client --task 'research topic'", "Submeter tarefa");
t.code("python -m opengen.api", "Iniciar API publica");
t.code("docker compose up -d", "Ou via Docker");
t.sub("Uso no TVS");
t.para("Modelo para sistema VERIFIER do TVS. Pipeline multi-agente (5 agentes, 20 rounds) melhora OMEGA Kernel task execution. Verificacao comunitaria inspira mecanismos de governanca $VSR.");

t.section("9", "Open Generative AI - 400+ AI Models");
t.para("Estudio de geracao AI com 400+ modelos state-of-the-art em 8 categorias e 14 estdios. Sem filtros de conteudo, sem taxas de assinatura, self-hosted. Powered by MuAPI. Desktop app para macOS/Windows/Linux.");
t.sub("Capacidades");
t.bullets(["400+ modelos: text-to-image, image-to-image, text-to-video, etc.","14 estdios (Image, Video, Audio, Cinema, Marketing, Agent, Design...)","Inferencia local: sd.cpp (CPU/Metal), Wan2GP (CUDA/ROCm)","Multi-image input (ate 14 reference images)","Workflow studio (node-based visual pipeline builder)","Cinema studio (pro camera controls)","Marketing studio para ad creatives","Desktop app (macOS/Windows/Linux)","White-label / resell option via MuAPI"]);
t.sub("Como Executar");
t.code("cd open-generative-ai", "Entrar no diretorio");
t.code("npm install", "Instalar dependencias");
t.code("npm run dev", "Iniciar em modo desenvolvimento (porta 3000)");
t.code("npm run build", "Compilar para producao");
t.code("npm start", "Iniciar servidor de producao");
t.sub("Desktop App");
t.code("npm run electron:dev", "Iniciar desktop app em dev");
t.code("npm run electron:build", "Empacotar desktop app");
t.sub("Uso no TVS");
t.para("Agente creativos da agencia com geracao profissional de imagem/video. Marketing studio gera ad creatives para clientes. Workflow studio encadeia modelos image-video-audio. Inferencia local (sd.cpp) sem custos API.");

t.section("10", "Strix - AI Pentesting");
t.para("Ferramenta open-source de pentesting autonoma com agents AI que encontram e validam vulnerabilizacoes reais. Multi-agent orchestration, real exploit validation, developer-first CLI, auto-fix e reporting. Powered by Docker sandbox.");
t.sub("Capacidades");
t.bullets(["Full pentesting toolkit (recon, exploitation, validation)","Multi-agent orchestration (equipas de AI pentesters)","Real exploit validation (working PoCs, nao false positives)","Developer-first CLI com remediation guidance","Auto-fix e reporting (SARIF, Markdown, PDF)","HTTP Interception Proxy (Caido)","Browser exploitation (XSS, CSRF, clickjacking)","Shell e command execution","OWASP Top 10 completo"]);
t.sub("Como Executar");
t.code("cd strix", "Entrar no diretorio");
t.code("pip install -e .", "Instalar Strix");
t.code("export STRIX_LLM='openai/gpt-5.4'", "Configurar modelo LLM");
t.code("export LLM_API_KEY='sua-chave'", "Configurar API key");
t.code("strix --target ./src", "Scan do codigo fonte TVS");
t.code("strix --target https://example.com", "Scan de sitio web");
t.code("strix -n --target ./src --scan-mode quick", "Modo headless");
t.code("strix view", "Abrir dashboard local");
t.sub("Via TVS CLI");
t.code("npm run strix:status", "Estado do Strix");
t.code("npm run strix:scan -- https://example.com", "Executar scan");
t.code("npm run strix:selftest", "Auto-teste do TVS");
t.code("npm run strix:history", "Historico de scans");
t.sub("Uso no TVS");
t.para("Seguranca autonoma do TVS. O squad AIOX pode executar pentests periodicos. Integrado com governanca biblica (so opera com autorizacao). Scan self-test valida o proprio sistema TVS.");

t.section("11", "Comandos Globais de Execucao");
t.sub("Ecosistema");
t.code("npm run eco", "Visao geral dos 8 modulos");
t.code("npm run eco:status", "Estado de todos");
t.code("npm run eco:detail -- camofox-browser", "Detalhe de um modulo");
t.code("npm run eco:monitor", "Dashboard Pedro/Trinnity/Squads");
t.code("npm run eco:logs", "Operacoes registadas");
t.sub("Strix (Seguranca)");
t.code("npm run strix:status", "Estado do Strix");
t.code("npm run strix:scan -- <target>", "Scan de seguranca");
t.code("npm run strix:selftest", "Auto-teste");
t.code("npm run strix:history", "Historico");
t.sub("Individuais (via diretorio)");
t.code("cd camofox-browser-red && npm start", "CamoFox Browser");
t.code("cd vibe-trading && pip install -e . && vibe-trading", "Vibe Trading");
t.code("cd claude-ads && pip install -r requirements.txt", "Claude Ads");
t.code("cd ai-ads-claude && python ads_cli.py strategy <url>", "AI Ads");
t.code("cd hyperframes && npm install && npm run build", "HyperFrames");
t.code("cd fincept-terminal && cmake -B build && cmake --build build", "Fincept");
t.code("cd opengen && pip install -r requirements.txt", "OpenGen");
t.code("cd open-generative-ai && npm install && npm run dev", "Open Gen AI");

t.section("12", "Monitoramento Pedro/Trinnity/Squads");
t.para("Todos os 10 repositorios integrados tienen monitoramento completo para o commando do TVS:");
t.sub("Pedro Costa (Comandante)");
t.bullets(["Dashboard completo de todos os modulos via /api/ecosystem","Operacoes registadas com timestamp e resultado","Relatorios de seguranca (Strix scans)","Historico de decisoes e aprovacoes","Alertas automaticos em caso de erro"]);
t.sub("Trinnity Hurtado (Rainha)");
t.bullets(["Dashboard de monitoramento em tempo real via /api/ecosystem/dashboard","Status de todos os agentes e squads","Metricas de performance por modulo","Governanca biblica (9 principios) em cada operacao","Relatorios automaticos quinzenais"]);
t.sub("Squads AIOX");
t.bullets(["Cada operacao e auditada e registada","Supervisao continua via data/knowledge/viseron-supervision.jsonl","EventBus conecta todos os modulos ao kernel OMEGA","VAEC (Validacao Evolutiva) garante qualidade","Scans de seguranca periodicos via Strix"]);

t.section("13", "API Endpoints");
t.sub("Ecosistema");
t.kv("GET /api/ecosystem", "Visao geral 8 modulos");
t.kv("GET /api/ecosystem/dashboard", "Monitoramento Pedro/Trinnity/Squads");
t.kv("GET /api/ecosystem/module/:id", "Detalhe de um modulo");
t.kv("GET /api/ecosystem/logs", "Logs de operacoes");
t.kv("POST /api/ecosystem/log", "Registar operacao (auth)");
t.kv("GET /api/ecosystem/monitoring", "Status do monitoramento");
t.sub("Strix (Seguranca)");
t.kv("GET /api/strix/status", "Estado do Strix");
t.kv("POST /api/strix/scan", "Executar pentest (auth)");
t.kv("POST /api/strix/scan/:id/cancel", "Cancelar scan (auth)");
t.kv("GET /api/strix/scan/:id", "Resultado de um scan");
t.kv("GET /api/strix/scan/:id/vuln/:vulnId", "Detalhe de vulnerabilidade");
t.kv("GET /api/strix/history", "Historico de scans");
t.kv("GET /api/strix/running", "Scans em execucao");
t.kv("POST /api/strix/scan-selftest", "Auto-teste do TVS (auth)");

t.spacer(10);
t.rule();
t.spacer(4);
t.para("Autorinha: Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)", 10, "#a855f7", { align: "center" });
t.para("Trinnity Viseron System v7.0 - www.trinnityviseronsystem.io", 9, "#64748b", { align: "center" });
t.para("Todos os repositorios integrados com autorinha TVS. Nenhuma decisao e tomada sem aprovacao do Comandante e da Rainha.", 8, "#64748b", { align: "center" });

const pages = t.page();
t.finish(OUT);
setTimeout(() => {
  const size = require("fs").statSync(OUT).size;
  console.log(`PDF gerado - ${(size / 1024).toFixed(1)} KB - ${pages} paginas`);
  console.log(`Local: ${OUT}`);
}, 800);
