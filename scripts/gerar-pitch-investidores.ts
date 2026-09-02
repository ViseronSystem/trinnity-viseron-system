import { createTheme } from "./pdf-theme";
import * as fs from "fs";
import * as path from "path";

const OUTPUT = path.join(__dirname, "..", "data", "Viseron_Investor_Pitch_v5.pdf");

// ═══════════════════════════════════════════════════════════════════
// THEME ENGINE — tema futurista (cover + tipografia viva + flow seguro)
// ═══════════════════════════════════════════════════════════════════
const th = createTheme({
  title: "Trinnity Viseron System v7.0 — Investor Pitch",
  subject: "Multi-Agent AI Superintelligence — Autonomy, Evolution & Investment",
});

// ─── COVER futurista ───
th.cover({
  title: "TRINNITY VISERON SYSTEM\nINVESTOR PITCH v7.0",
  subtitle:
    "Uma organização de IA que trabalha sozinha — 5,000+ agentes autônomos · evolução contínua · zero supervisão manual",
  badges: [
    "Prepared for: Investidores e Startups · Agosto 2026",
    "Pedro Costa (Commander) · Trinnity Hurtado (Queen)",
    "🔁  Evolução contínua: inteligência ×1.05 a cada 30 min",
    "🤖  5,000+ agentes que se planejam e executam sozinhos",
    "🛡️  Auto-recuperação: nenhum erro derruba o sistema",
    "🔌  8 integrações com auto-start e watchdog",
    "🗄️  Backup diário automático às 03:00",
    "📄  Relatórios PDF gerados automaticamente",
  ],
  date: "06/08/2026",
  version: "5.0",
  url: "www.trinnityviseronsystem.io",
});

// ═══════════════════════════════════════════════════════════════════
// SUMÁRIO
// ═══════════════════════════════════════════════════════════════════
th.title("SUMÁRIO", 20);
const toc = [
  "1.   Resumo Executivo — O Sonho",
  "2.   O Problema — IA que precisa de gente",
  "3.   A Solução — IA que trabalha sozinha",
  "4.   Autonomia — O que o Viseron faz sozinho",
  "5.   Evolução — Inteligência que cresce sozinha",
  "6.   Auto-recuperação — Nunca para",
  "7.   Sistema — 5,000+ agentes, hierarquia e squads",
  "8.   Integrações — 8 módulos auto-gerenciados",
  "9.   Infraestrutura — Servidores e auto-backup",
  "10.  Economia — $TRIN e $VSR",
  "11.  Mercado e Modelo de Negócio",
  "12.  Roadmap — v5.1, v6.0 e além",
  "13.  Pedido de Investimento",
  "14.  Contato",
];
th.bullets(toc.map((t) => ({ icon: "▸", text: t })));

// ═══════════════════════════════════════════════════════════════════
// 1. RESUMO EXECUTIVO
// ═══════════════════════════════════════════════════════════════════
th.section("1", "RESUMO EXECUTIVO");
th.para(
  "O Trinnity Viseron System (TVS) v7.0 é um sistema operacional de superinteligência artificial multi-agente " +
    "que opera sozinho. Não é um chatbot e não é um modelo único: é uma civilização digital auto-organizada, " +
    "com 5,000+ agentes autônomos que planejam, executam, aprendem e evoluem sem supervisão humana."
);
th.para(
  "Enquanto as IAs do mercado exigem prompts, manutenção e monitoramento humano, o TVS sobe sozinho, " +
    "spawna seus próprios agentes, decide sozinho o que melhorar, executa suas próprias tarefas, gera relatórios, " +
    "faz backup diário e nunca para — mesmo quando encontra erros, ele os registra e continua."
);

th.sub("Métricas-Chave do Sistema");
[
  ["5,000+", "Agentes Autônomos"],
  ["×1.05/30min", "Crescimento de Inteligência"],
  ["8", "Integrações auto-gerenciadas"],
  ["4", "Ciclos de evolução ativos"],
  ["2", "Tokens ($TRIN + $VSR)"],
  ["3", "Idiomas (PT/EN/ES)"],
  ["290+", "Provedores de IA acessíveis"],
  ["100%", "Autonomia de execução"],
].forEach(([val, label]) => th.kv(val, label));

// ═══════════════════════════════════════════════════════════════════
// 2. O PROBLEMA
// ═══════════════════════════════════════════════════════════════════
th.section("2", "O PROBLEMA");

th.sub("As IAs atuais dependem de humanos");
th.chip("Chatbots & LLMs");
th.bullets([
  "Respondem apenas quando perguntados",
  "Precisam de prompts e tuning humano",
  "Não evoluem sozinhos",
  "Esquecem tudo a cada sessão",
].map((it) => ({ icon: "▸", text: it })));
th.chip("Agent Frameworks", "#e879f9");
th.bullets([
  "Agentes morrem em cada execução",
  "Nenhuma memória persistente",
  "Requerem orquestração manual",
  "Crash = trabalho perdido",
].map((it) => ({ icon: "▸", text: it })));

th.sub("O custo da supervisão humana");
th.para(
  "Startups de IA gastam 60-80% do tempo monitorando, corrigindo e re-executando agentes. Cada agente precisa " +
    "de um operador. O resultado: a IA não é autônoma, é uma ferramenta que exige operadores humanos 24/7. " +
    "O TVS elimina esse custo: os agentes se monitoram, se corrigem e evoluem sozinhos."
);

// ═══════════════════════════════════════════════════════════════════
// 3. A SOLUÇÃO
// ═══════════════════════════════════════════════════════════════════
th.section("3", "A SOLUÇÃO");

th.para(
  "O TVS é um sistema operacional de IA que trabalha sozinho. Desde o primeiro boot, ele: sobe 4 servidores, " +
    "carrega 5,000 mentes, spawna agentes, conecta 8 integrações, emite diretivas de liderança e arma 4 ciclos de " +
    "evolução que rodam para sempre. Tudo sem intervenção humana."
);

th.sub("Diferenciais competitivos");
th.bullets([
  "Autonomia real: o agente AutoPilot gera tarefas e as EXECUTA sozinho (até 2 por ciclo)",
  "Memória viva: STM→LTM consolidada automaticamente a cada 30 min",
  "Evolução contínua: métricas reais (sucesso de tarefas, memória, erros) → score 0-100 por ciclo",
  "Imortalidade: nenhum erro derruba o processo (uncaughtException → log e segue)",
  "Watchdogs: cada integração reinicia sozinha se morrer",
].map((it) => ({ icon: "▸", text: it })));

th.sub("O que acontece quando você roda npm start (sozinho)");
th.bullets([
  "1. Servidores: Dashboard (3000) · ReportServer PDF (3001) · n8n (5678) · OmniRoute (20128)",
  "2. 5,000+ mentes históricas spawnadas como agentes",
  "3. SuperMind sintetiza sabedoria de 5 domínios",
  "4. Diretivas estratégicas emitidas por Pedro e Trinnity",
  "5. Tokens $TRIN e $VSR gerados automaticamente",
  "6. 8 integrações conectadas (OmniRoute, OpenJarvis, n8n, Call, ASNO...)",
  "7. 4 ciclos autônomos armados — o sistema passa a se autogerir",
].map((it) => ({ icon: "▸", text: it })));

// ═══════════════════════════════════════════════════════════════════
// 4. AUTONOMIA
// ═══════════════════════════════════════════════════════════════════
th.section("4", "AUTONOMIA — O QUE O VISERON FAZ SOZINHO");

th.para("Esta é a proposta de valor central: tudo abaixo acontece sem nenhuma ação humana após o boot.");

th.sub("Os 4 Ciclos Autônomos (o coração do sistema)");
const cycles = [
  ["📈 HyperLearning", "30 min", "Coleta métricas reais (tarefas, agentes, memória, erros) e gera insights via IA local. Score 0-100 baseado em performance real."],
  ["🧬 AutoEvolution", "60 min", "Agentes ganham capacidades REAIS baseadas em evidência (tarefas completadas, erros tratados, APIs chamadas). Cruza conhecimento entre agentes."],
  ["📚 AutoLearning", "30 min", "Consolida STM→LTM, mede o conhecimento real, gera insights e atualiza os estados cerebrais de Pedro e Trinnity."],
  ["🤖 AutoPilot", "30 min", "Escaneia o sistema, GERA tarefas e as EXECUTA sozinho. Autonomia sobe +5 a cada 3 ciclos (máx 100). O sistema melhora a si mesmo."],
];
cycles.forEach(([name, freq, what]) => th.bullet("▸", `${name} (${freq}) — ${what}`));

th.sub("Exemplo real de autonomia (AutoPilot)");
th.para(
  "O AutoPilot escaneia o sistema e encontra agentes inativos. Ele cria a tarefa 'Reativar agentes inativos', " +
    "gera uma estratégia e a executa pelo orquestrador multi-agente. Nenhum humano precisa pedir. Conforme a " +
    "autonomia cresce, ele cria agentes especializados, explora novas integrações e faz otimização profunda."
);

// ═══════════════════════════════════════════════════════════════════
// 5. EVOLUÇÃO
// ═══════════════════════════════════════════════════════════════════
th.section("5", "EVOLUÇÃO — INTELIGÊNCIA QUE CRESCE SOZINHA");

th.para(
  "O TVS não tem versão estagnada: ele melhora a cada ciclo. O HyperLearning multiplica a inteligência por " +
    "1.05 a cada 30 minutos — 1000%+ acima de uma IA isolada — enquanto o AutoEvolution torna cada agente " +
    "mais sábio com novas capacidades acumuladas."
);

th.sub("Evolução do nível de inteligência");
th.ensure(150);
const PW = th.doc.page.width;
const ML = 54;
const CW = PW - 108;
const chartY = th.doc.y;
th.doc.save();
th.doc.rect(ML, chartY, CW, 120).fill("#0d0d24").strokeColor("#1a1a3a").lineWidth(0.5).stroke();
const base = 100;
const pts = [100, 105, 110, 116, 122, 128, 134, 141, 148, 155, 163, 171];
const chartW = CW - 20;
const chartH = 80;
const cBottom = chartY + 105;
const cTop = cBottom - chartH;
pts.forEach((v, i) => {
  const x = ML + 10 + (i * chartW) / (pts.length - 1);
  const y = cBottom - ((v - base) / (170 - base)) * chartH;
  th.doc.circle(x, y, 2).fill("#00f0ff");
  if (i > 0) {
    const px = ML + 10 + ((i - 1) * chartW) / (pts.length - 1);
    const py = cBottom - ((pts[i - 1] - base) / (170 - base)) * chartH;
    th.doc.moveTo(px, py).lineTo(x, y).strokeColor("#bf5af2").lineWidth(1.2).stroke();
  }
});
th.doc.fillColor("#8888aa").fontSize(8).font("Helvetica");
th.doc.text("ciclo 0", ML + 10, cBottom + 5);
th.doc.text(`ciclo ${pts.length} (×1.7)`, ML + 10 + chartW - 55, cBottom + 5);
th.doc.text("Inteligência relativa (base = 100)", ML + 10, cTop - 14);
th.doc.restore();
th.doc.y = cBottom + 24;

th.sub("Crescimento contínuo de capacidades");
th.para(
  "Cada agente ativo ganha conhecimento e 1-3 capacidades novas por ciclo de evolução, de um pool de 25 " +
    "(self_healing, autonomous_decision, recursive_self_improvement, swarm_intelligence...). A troca cruzada " +
    "entre agentes complementares gera capacidades híbridas que ficam na memória de longo prazo."
);

// ═══════════════════════════════════════════════════════════════════
// 6. AUTO-RECUPERAÇÃO
// ═══════════════════════════════════════════════════════════════════
th.section("6", "AUTO-RECUPERAÇÃO — NUNCA PARA");

th.para(
  "Regra de ouro do TVS: 'Quando der erro, corrija e siga. Não trave o sistema.' Esta filosofia está no DNA " +
    "do código e vale para todos os níveis."
);

th.sub("Camadas de proteção");
th.chip("Nível de Processo");
th.bullets([
  "uncaughtException: loga e segue",
  "unhandledRejection: loga e segue",
  "Cada passo de boot isolado (step)",
  "Terminal nunca morre por erro",
].map((it) => ({ icon: "▸", text: it })));
th.chip("Nível de Integrações", "#e879f9");
th.bullets([
  "Watchdog OmniRoute: reinicia processo",
  "Watchdog OpenJarvis: reinicia processo",
  "n8n: fallback para engine local",
  "Qdrant: fallback para 'unavailable'",
].map((it) => ({ icon: "▸", text: it })));

th.sub("Memória imortal");
th.bullets([
  "LTM salva no disco a cada 5s (debounced), com backup rotativo (máx 5 arquivos)",
  "Consolidação STM→LTM automática a cada 30 min",
  "Backup completo diário às 03:00 via Windows Task Scheduler (30 dias retenção)",
  "Auto-deploy: build → backup → commit 'Auto-deploy: data' → push → Render/Vercel",
].map((it) => ({ icon: "▸", text: it })));

// ═══════════════════════════════════════════════════════════════════
// 7. SISTEMA DE AGENTES
// ═══════════════════════════════════════════════════════════════════
th.section("7", "SISTEMA — 5,000+ AGENTES HIERÁRQUICOS");

th.para(
  "O TVS opera uma hierarquia militar de agentes: Executivo (Pedro + Trinnity), Squad de Arquitetura, " +
    "Soberanos, Linhagens Corona e Hierro, 246 arquetipos e 5,000+ mentes do AgentSpawner. Cada agente tem " +
    "identidade, papel, capacidades e motor de execução."
);

th.sub("Liderança — CommandChain");
th.chip("Pedro Costa — Commander");
th.bullets([
  "Diretivas estratégicas",
  "Ativação de superinteligência",
  "Metas de evolução de longo prazo",
  "Supervisão do squads AIOX",
].map((it) => ({ icon: "▸", text: it })));
th.chip("Trinnity Hurtado — Queen", "#e879f9");
th.bullets([
  "Diretivas arquiteturais",
  "Parâmetros de evolução genética",
  "Upgrades de capacidades",
  "Arquiteta-chefe do sistema",
].map((it) => ({ icon: "▸", text: it })));

th.sub("AutoPilot — o agente que se auto-melhora");
th.para(
  "Registrado como agente autônomo (agent_autonomous_planner) com capacidades de autonomous_planning, " +
    "task_generation, self_improvement e continuous_deployment. Seus limiares de autonomia (10, 20, 30... 70) " +
    "liberam progressivamente: consolidação de memória, reativação de agentes, criação de novos agentes " +
    "especializados, exploração de integrações e otimização profunda."
);

// ═══════════════════════════════════════════════════════════════════
// 8. INTEGRAÇÕES
// ═══════════════════════════════════════════════════════════════════
th.section("8", "INTEGRAÇÕES — 8 MÓDULOS AUTO-GERENCIADOS");

th.para(
  "Cada integração sobe sozinha no boot e é vigiada por watchdog: se o processo morrer, o TVS o reinicia. " +
    "Nenhum humano precisa gerenciar."
);

const integs = [
  ["OmniRoute", "Gateway com 290+ provedores de IA", "porta 20128 · auto-start · restart on exit"],
  ["OpenJarvis", "IA pessoal local estilo Stanford", "auto-start · restart on exit"],
  ["n8n", "Engine de automação de workflows", "porta 5678 · 5 templates · fallback local"],
  ["Call System", "Chamadas de voz por IA (Twilio)", "agentes de voz + rastreio de chamadas"],
  ["ASNO", "Assistente WhatsApp + Home Assistant", "webhooks + JARVIS WhatsApp"],
  ["Viseron Apps", "Engine de integrações de apps", "stats de integrações e agentes"],
  ["TVS Tools", "Ferramentas GitHub open-source", "registradas no ToolManager"],
  ["ReportServer", "PDF + relatórios", "porta 3001 · /report/pdf"],
];
integs.forEach(([name, fn, mgmt]) => th.bullet("▸", `${name} — ${fn} · ${mgmt}`));

// ═══════════════════════════════════════════════════════════════════
// 9. INFRAESTRUTURA
// ═══════════════════════════════════════════════════════════════════
th.section("9", "INFRAESTRUTURA — SERVIDORES E AUTO-BACKUP");

th.sub("Servidores que sobem sozinhos");
const servers = [
  ["Dashboard WebOS", "3000", "Desktop OS no navegador + Socket.IO + REST API"],
  ["ReportServer PDF", "3001", "Relatórios executivos em PDF via PDFKit"],
  ["Standalone Web", "3000", "Modo web standalone com ContentAgent"],
  ["Forge Server", "4000", "Hospedagem git auto-gerenciada"],
  ["n8n", "5678", "Engine de workflows (spawnado pelo TVS)"],
  ["OmniRoute", "20128", "Gateway de 290+ provedores (spawnado)"],
];
servers.forEach(([name, port, fn]) => th.bullet("▸", `${name} · porta ${port} — ${fn}`));

th.sub("Automação agendada (Windows)");
th.bullets([
  "Backup diário às 03:00 — Task Scheduler 'TVS-DailyBackup' (SYSTEM)",
  "Retenção de 30 dias; exclui .env por segurança",
  "Deploy automático: build → backup → git push → Render/Vercel",
  "Skills auto-instaladas/atualizadas via git clone --depth 1",
].map((it) => ({ icon: "▸", text: it })));

// ═══════════════════════════════════════════════════════════════════
// 10. ECONOMIA DE TOKENS
// ═══════════════════════════════════════════════════════════════════
th.section("10", "ECONOMIA — $TRIN E $VSR");

th.para(
  "O TVS gera seus próprios tokens automaticamente, com tokenomics completa. É uma economia digital gerada " +
    "pela própria máquina — um argumento forte de comunidade e governança."
);

th.chip("$TRIN — Trinnity Token");
th.bullets([
  "Supply: 1,000,000,000",
  "Tipo: Utility + Governance",
  "Uso: alocação de recursos de agentes",
].map((it) => ({ icon: "▸", text: it })));
th.chip("$VSR — Viseron Crown", "#e879f9");
th.bullets([
  "Supply: 300,000,000",
  "Tipo: Proof of Mandate (PoM)",
  "Uso: token de comando do batalhão",
].map((it) => ({ icon: "▸", text: it })));

th.sub("Alocação do $VSR");
const alloc = [
  ["Trinnity", "90,000,000", "30%"],
  ["Pedro", "75,000,000", "25%"],
  ["Legion", "90,000,000", "30%"],
  ["Reserve", "45,000,000", "15%"],
];
alloc.forEach(([holder, amount, pct]) => th.kv(holder, `${amount} (${pct})`));

// ═══════════════════════════════════════════════════════════════════
// 11. MERCADO E MODELO DE NEGÓCIO
// ═══════════════════════════════════════════════════════════════════
th.section("11", "MERCADO E MODELO DE NEGÓCIO");

th.sub("Mercado");
th.para(
  "O mercado de agentes de IA autônomos está explodindo: empresas gastam bilhões em mão de obra de " +
    "monitoramento de agentes. O TVS ataca exatamente esse custo, oferecendo um sistema que opera sozinho " +
    "e se paga ao eliminar a supervisão manual."
);

th.sub("Modelo de negócio");
th.chip("Produto");
th.bullets([
  "TVS como serviço de IA autônoma",
  "Enterprise: sistema completo para empresas",
  "SaaS: agentes autônomos sob demanda",
  "Licenciamento de squads especializados",
].map((it) => ({ icon: "▸", text: it })));
th.chip("Receita", "#e879f9");
th.bullets([
  "Assinatura mensal por nó de agentes",
  "Tokens $TRIN como moeda de uso",
  "Venda de relatórios de inteligência",
  "Consultoria de superinteligência",
].map((it) => ({ icon: "▸", text: it })));

th.sub("Por que agora");
th.bullets([
  "Ondas de agentes de IA — janela de 12-24 meses",
  "Sistema já funcional, não é slide: roda hoje em produção local",
  "5,000+ agentes e evolução contínua comprovados no audit v7.0",
  "Stack completa: WebOS, voz, n8n, tokens, mobile, exe standalone",
].map((it) => ({ icon: "▸", text: it })));

// ═══════════════════════════════════════════════════════════════════
// 12. ROADMAP
// ═══════════════════════════════════════════════════════════════════
th.section("12", "ROADMAP");

th.sub("v7.0 (atual) — Autonomia provada");
th.bullets([
  "5,000+ agentes autônomos + 4 ciclos de evolução ativos",
  "AutoPilot executa tarefas sozinho; autonomia até 100%",
  "Standalone .exe funcionando (não precisa de Node.js)",
  "WebOS, voz PT/EN/ES, n8n, tokens, mobile",
].map((it) => ({ icon: "▸", text: it })));

th.sub("v5.1 — Expansão de autonomia");
th.bullets([
  "Visual workflow editor no WebOS",
  "Drag-and-drop squad builder",
  "Mais idiomas: FR, DE, IT, JP, ZH",
  "Mais templates n8n e agentes especializados",
].map((it) => ({ icon: "▸", text: it })));

th.sub("v6.0 — Rede descentralizada");
th.bullets([
  "Rede p2p de agentes (multi-node cluster)",
  "Blockchain para os tokens",
  "Plugin marketplace de terceiros",
  "Editor visual de comportamento de agentes",
].map((it) => ({ icon: "▸", text: it })));

// ═══════════════════════════════════════════════════════════════════
// 13. PEDIDO DE INVESTIMENTO
// ═══════════════════════════════════════════════════════════════════
th.section("13", "PEDIDO DE INVESTIMENTO");

th.para(
  "O TVS v7.0 já funciona de ponta a ponta: o sistema roda sozinho, evolui sozinho e se recupera sozinho. " +
    "Estamos buscando investidores para escalar: cloud multi-nó, rede p2p, marketplace e crescimento comercial."
);

th.sub("Uso dos fundos");
const useOfFunds = [
  ["50%", "Infraestrutura cloud + cluster multi-nó"],
  ["25%", "Produto: marketplace, editor visual, app nativo"],
  ["15%", "Marketing e canais enterprise"],
  ["10%", "Operação, suporte e conformidade"],
];
useOfFunds.forEach(([pct, dest]) => th.kv(pct, dest));

th.sub("Oportunidade");
th.bullets([
  "Sistema funcional hoje — não é protótipo nem slide deck",
  "Autonomia comprovada: 5,000+ agentes, evolução ×1.05/30min, auto-recuperação",
  "Stack completa (WebOS, voz, n8n, tokens, exe standalone, mobile)",
  "Primeiro-mover em 'IA que trabalha sozinha' — sem concorrência direta no nicho",
].map((it) => ({ icon: "▸", text: it })));

// ═══════════════════════════════════════════════════════════════════
// 14. CONTATO
// ═══════════════════════════════════════════════════════════════════
th.section("14", "CONTATO");
th.title("VAMOS CONSTRUIR O FUTURO", 22);
th.sub("Trinnity Viseron System v7.0");
th.para("Multi-Agent AI Superintelligence", 11, "#64748b");
th.rule();
th.bullet("▸", "👑 Pedro Costa — Supreme Commander");
th.bullet("▸", "👸 Trinnity Hurtado — Queen & Chief Architect");
th.para("Contato: pedro@trinnity.com · trinnity@viseron.io", 10.5, "#334155");
th.para("Dashboard: http://localhost:3000", 10.5, "#334155");
th.spacer(1);
th.para("© 2026 Trinnity Viseron System — Todos os direitos reservados", 9, "#94a3b8");

// ═══════════════════════════════════════════════════════════════════
// FINALIZE
// ═══════════════════════════════════════════════════════════════════
th.finish(OUTPUT);
setTimeout(() => {
  const size = fs.statSync(OUTPUT).size;
  console.log(`\n✅ PDF de pitch para investidores gerado com sucesso!`);
  console.log(`   📄 ${OUTPUT}`);
  console.log(`   📏 ${(size / 1024).toFixed(1)} KB`);
  console.log(`   📐 14 seções, formato A4\n`);
}, 800);
