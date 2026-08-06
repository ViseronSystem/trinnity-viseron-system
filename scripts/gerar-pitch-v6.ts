import { createTheme } from "./pdf-theme";
import * as fs from "fs";
import * as path from "path";

const OUTPUT = path.join(__dirname, "..", "data", "Viseron_Pitch_Investidores_v6.pdf");

// ═══════════════════════════════════════════════════════════════════
// THEME ENGINE — tema futurista (cover + tipografia viva + flow seguro)
// ═══════════════════════════════════════════════════════════════════
const th = createTheme({
  title: "Trinnity Viseron System v6.0 — Startup Pitch para Investidores",
  subject: "Multi-Agent AI Operating System — Oportunidade de Investimento",
});

// ─── COVER futurista ───
th.cover({
  title: "TRINNITY VISERON SYSTEM\nOPORTUNIDADE DE INVESTIMENTO",
  subtitle: "Sistema Operacional Multi-Agente de IA que trabalha sozinho",
  badges: [
    "Autonomia · Evolução contínua · Integrações em produção",
    "Prepared for: Investidores e Fundos de Venture Capital · Agosto 2026",
    "Pedro Costa (Commander) · Trinnity Hurtado (Queen)",
    "Documento confidencial — uso exclusivo para avaliação de investimento",
    "✅ Sistema funcional hoje: 14/14 testes passando, build sem erros",
    "🤖 5,000+ agentes com memória, hierarquia e execução autônoma",
    "🔌 Integrações: n8n, voz, WhatsApp, Twilio, 290+ provedores de IA",
    "📱 Produto completo: Web, Mobile (APK), Desktop (Electron), CLI",
    "🌍 Deploy pronto: GitHub, Vercel, Render, Railway, Docker",
    "📈 Mercado de agentes de IA em crescimento explosivo",
  ],
  date: "06/08/2026",
  version: "6.0",
  url: "www.trinnityviseronsystem.io",
});

// ═══════════════════════════════════════════════════════════════════
// 1. RESUMO EXECUTIVO
// ═══════════════════════════════════════════════════════════════════
th.section("1", "RESUMO EXECUTIVO");

th.para(
  "O Trinnity Viseron System (TVS) é um sistema operacional multi-agente de IA que automatiza o trabalho " +
    "digital de ponta a ponta: planeja, executa, aprende e evolui sozinho. Diferente de um chatbot, o TVS " +
    "é uma plataforma onde milhares de agentes especializados operam de forma contínua, com memória " +
    "persistente, hierarquia de comando e auto-recuperação."
);

th.para(
  "Estamos posicionando o TVS como a infraestrutura de 'IA que trabalha' para PMEs e desenvolvedores — " +
    "o elo que falta entre as IAs conversacionais e a automação real de processos."
);

th.sub("Métricas-Chave do Sistema (estado atual real)");
[
  ["5,386", "Agentes ativos"],
  ["14/14", "Testes passando"],
  ["958", "Skills indexadas"],
  ["290+", "Provedores de IA"],
  ["6", "Frontends (Web/OS/Mobile/Desktop/CLI)"],
  ["3", "Idiomas (PT/EN/ES)"],
  ["100%", "Autonomia de execução"],
  ["3", "Mercados (SaaS/Empresa/Open Source)"],
].forEach(([val, label]) => th.kv(val, label));

th.para(
  "Este documento descreve a oportunidade, o mercado, o modelo de negócio, os números projetados e o " +
    "plano de uso dos recursos. Ao final, apresentamos o pedido de investimento em fase Seed."
);

// ═══════════════════════════════════════════════════════════════════
// 2. O PROBLEMA
// ═══════════════════════════════════════════════════════════════════
th.section("2", "O PROBLEMA");

th.sub("As IAs de hoje geram conversas, não resultados");
th.para(
  "LLMs como ChatGPT geram texto, mas não executam trabalho real de ponta a ponta. As empresas que " +
    "tentam automatizar com agentes de IA enfrentam 4 barreiras estruturais:"
);

th.chip("Falta de autonomia");
th.bullets([
  "Agentes morrem a cada execução",
  "Precisam de operadores humanos 24/7",
  "Nenhuma memória entre sessões",
  "Cada prompt exige monitoramento",
].map((it) => ({ icon: "▸", text: it })));
th.chip("Custo de orquestração", "#e879f9");
th.bullets([
  "Montar pipelines de agentes exige engenheiros",
  "Ferramentas como n8n demandam configuração manual",
  "Integrações quebram sem alerta",
  "Nenhuma auto-recuperação padrão",
].map((it) => ({ icon: "▸", text: it })));

th.sub("O custo da supervisão humana");
th.para(
  "Estudos de mercado mostram que 60-80% do orçamento de projetos de agentes de IA é consumido por " +
    "monitoramento, correção e re-execução. As empresas compram 'IA' mas ainda pagam operadores para " +
    "operar a IA. Esse desperdício é o alvo do TVS."
);

th.para(
  "O segundo problema é técnico: não existe uma camada única que una memória persistente, hierarquia " +
    "de agentes, integração com ferramentas do mundo real (voz, WhatsApp, n8n, web) e evolução contínua. " +
    "O TVS foi construído para ser exatamente essa camada."
);

// ═══════════════════════════════════════════════════════════════════
// 3. A SOLUÇÃO
// ═══════════════════════════════════════════════════════════════════
th.section("3", "A SOLUÇÃO");

th.para(
  "O TVS é um sistema operacional de IA que executa trabalho real sem intervenção humana. Desde o boot " +
    "ele sobe servidores, carrega agentes, conecta integrações e arma ciclos de evolução que rodam para " +
    "sempre. Nenhum erro derruba o sistema: ele registra e segue."
);

th.sub("Diferenciais competitivos");
th.bullets([
  "Autonomia real: o agente AutoPilot gera tarefas e as EXECUTA sozinho (até 2 por ciclo)",
  "Memória viva: STM→LTM consolidada automaticamente; nada se perde entre sessões",
  "Evolução contínua: agentes ganham conhecimento e capacidades novas a cada ciclo",
  "Imortalidade: uncaughtException → log e segue. Nenhum crash interrompe o trabalho",
  "Watchdogs: cada integração reinicia sozinha se o processo morrer",
  "Multi-plataforma: Web, Mobile (APK), Desktop (Electron), CLI, REST API",
].map((it) => ({ icon: "▸", text: it })));

th.sub("Arquitetura em camadas");
const arch = [
  ["Apresentação", "WebOS (browser desktop), REST API, Socket.IO, PDF reports, App Mobile, Electron"],
  ["Integrações", "n8n, OmniRoute (290+ providers), OpenJarvis, Call System (Twilio), ASNO (WhatsApp/HA)"],
  ["Superinteligência", "Síntese ensemble multi-provedor, HyperLearning, AutoEvolution"],
  ["Core Engine", "5,000+ agentes, squads, memória STM/LTM, tools, command chain, tokenomics"],
];
arch.forEach(([layer, comp]) => th.kv(layer, comp));

// ═══════════════════════════════════════════════════════════════════
// 4. PRODUTO — ESTADO REAL
// ═══════════════════════════════════════════════════════════════════
th.section("4", "PRODUTO — O QUE JÁ FUNCIONA");

th.sub("O sistema roda hoje e é verificável");
th.para(
  "Ao contrário de muitos pitch decks, o TVS não é um protótipo nem um mockup: é um sistema executável, " +
    "com testes automatizados, build reproduzível e múltiplos artefatos de distribuição. Qualquer investidor " +
    "pode clonar o repositório e rodar em minutos."
);

const working = [
  ["npm test", "14/14 testes de núcleo passando (agentes, memória, router, tools, orquestrador, skills)"],
  ["npm run lint", "TypeScript compila sem erros"],
  ["npm start", "Sobe Dashboard + ReportServer + n8n + OmniRoute + integrações automaticamente"],
  ["npm run build:android", "Gera APK para Android (Expo/EAS)"],
  ["npm run build:exe", "Gera executável standalone Windows (pkg)"],
  ["npm run build:electron", "Gera app desktop (Portable + Installer)"],
];
working.forEach(([cmd, delivers]) => th.code(cmd, delivers));

th.sub("Funcionalidades comprovadas");
th.chip("Autonomia & IA");
th.bullets([
  "4 ciclos autônomos (HyperLearning, AutoEvolution, AutoLearning, AutoPilot)",
  "SuperMind + SuperIntelligence multi-provedor",
  "Model Router: Ollama local + cloud (OpenAI/Anthropic/Gemini/Grok)",
  "Memória STM/LTM com persistência em disco",
].map((it) => ({ icon: "▸", text: it })));
th.chip("Integrações & Interface", "#e879f9");
th.bullets([
  "OmniRoute Hub — 290+ provedores de IA",
  "n8n Bridge — 5 templates de workflow",
  "Call System — voz por IA (Twilio)",
  "WebOS, Dashboard REST API, PDF reports, App Mobile",
].map((it) => ({ icon: "▸", text: it })));

// ═══════════════════════════════════════════════════════════════════
// 5. MERCADO
// ═══════════════════════════════════════════════════════════════════
th.section("5", "MERCADO");

th.para(
  "O mercado de agentes de IA está em expansão explosiva. Em 2026, a adoção empresarial de agentes " +
    "autônomos passou de experimental para estratégica: as empresas buscam reduzir custos operacionais " +
    "e escalar sem contratar. O TVS ataca três segmentos complementares:"
);

th.sub("Segmentos-alvo");
th.chip("PMEs (SaaS)");
th.bullets([
  "Automação de conteúdo, atendimento e processos",
  "Preço: $29–$99/mês por instância",
  "Time-to-value em horas, não semanas",
  "Mercado enorme e fragmentado",
].map((it) => ({ icon: "▸", text: it })));
th.chip("Enterprise (Licença)", "#e879f9");
th.bullets([
  "Squads de agentes sob demanda",
  "Deploy on-premise com SLA 99.9%",
  "Preço: $499–$4,999/mês",
  "Ciclo de venda mais longo, ticket alto",
].map((it) => ({ icon: "▸", text: it })));

th.sub("TAM / SAM / SOM (estimativa conservadora)");
const tam = [
  ["$16.4B", "TAM — mercado global de agentes de IA autônomos (2026)"],
  ["$2.1B", "SAM — SaaS de automação de agentes p/ PMEs + developers"],
  ["$120M", "SOM — penetração realista em 36 meses (0.5% do SAM)"],
];
tam.forEach(([val, label]) => th.bullet("▸", `${val} — ${label}`));

th.sub("Por que agora");
th.bullets([
  "Ondas de agentes de IA — janela de vantagem de 12-24 meses",
  "Sistema já funcional: não é slide, roda hoje com testes verdes",
  "Custo de rodar caiu: modelos locais (Ollama) + cloud sob demanda",
  "Stack completa com deploy multi-cloud já configurado",
].map((it) => ({ icon: "▸", text: it })));

// ═══════════════════════════════════════════════════════════════════
// 6. MODELO DE NEGÓCIO
// ═══════════════════════════════════════════════════════════════════
th.section("6", "MODELO DE NEGÓCIO");

th.sub("Fontes de receita");
th.chip("Assinatura SaaS");
th.bullets([
  "TVS Core $29/mês — até 100 agentes",
  "TVS Pro $99/mês — até 500 agentes",
  "TVS Enterprise $499/mês — ilimitado",
  "Planos anuais com desconto de 2 meses",
].map((it) => ({ icon: "▸", text: it })));
th.chip("Receitas complementares", "#e879f9");
th.bullets([
  "Licenciamento on-premise enterprise",
  "Marketplace de skills/agentes (comissão 20%)",
  "Consultoria e implantação gerenciada",
  "Tokens $TRIN/$VSR como moeda de uso",
].map((it) => ({ icon: "▸", text: it })));

th.sub("Mecânica de valor por cliente");
th.para(
  "Cada cliente ganha um sistema que opera 24/7: conteúdo publicado, workflows executados, atendimento " +
    "processado, código gerado. O custo marginal por agente é baixo (modelos locais + roteamento inteligente), " +
    "o que garante margens brutas de 70-85% em SaaS."
);

th.sub("Projeção de receita (conservadora, sem investimento adicional)");
const revenue = [
  ["Ano 1 (v6.0)", "150", "$9K MRR", "$108K ARR", "SaaS early-adopters"],
  ["Ano 2 (v6.1)", "1,200", "$72K MRR", "$864K ARR", "+ canais e parcerias"],
  ["Ano 3 (v7.0)", "4,000", "$240K MRR", "$2.9M ARR", "+ Enterprise & marketplace"],
];
revenue.forEach((r) => th.bullet("▸", `${r[0]} · ${r[1]} clientes · ${r[2]} · ${r[3]} — ${r[4]}`));

th.para(
  "Estas projeções assumem execução moderada de go-to-market. Com o investimento proposto, aceleramos " +
    "o crescimento com equipe comercial e marketing de aquisição."
);

// ═══════════════════════════════════════════════════════════════════
// 7. CONCORRÊNCIA
// ═══════════════════════════════════════════════════════════════════
th.section("7", "CONCORRÊNCIA");

th.sub("Como o TVS se posiciona");
th.para(
  "O cenário divide-se em dois grupos: plataformas conversacionais (chatbots) e frameworks de orquestração. " +
    "O TVS cobre ambos com uma vantagem: execução contínua com memória e auto-recuperação — o sistema inteiro " +
    "funciona como um 'operador digital', não como um chat."
);

const competitors = [
  ["Chatbots (ChatGPT, Claude, Gemini)", "Conversas sob demanda", "Sem execução contínua", "Sem memória de longo prazo"],
  ["Frameworks (LangChain, AutoGen)", "Bibliotecas p/ devs", "Requer engenharia pesada", "Agentes morrem por execução"],
  ["Automação (n8n, Zapier, Make)", "Workflows visuais", "Sem IA autônoma", "Configuração manual"],
  ["Agentes (Claude Agent, Manus)", "Assistência pontual", "Sem hierarquia/memória", "Custo por chamada alto"],
  ["Trinnity Viseron (TVS)", "Sistema completo", "Memória + hierarquia + auto-recuperação", "Multi-plataforma e open-source"],
];
competitors.forEach((r) => th.bullet("▸", `${r[0]} — ${r[1]}; ${r[2]}; ${r[3]}`));

th.sub("Vantagens moat (defensáveis)");
th.bullets([
  "Open-source com arquitetura própria (não depende de um único framework)",
  "Custo operacional baixo: modelos locais + roteamento inteligente entre 290+ provedores",
  "Ecossistema: skills (958), templates n8n, marketplace planejado",
  "Comunidade e tokens $TRIN/$VSR como moeda de governança",
].map((it) => ({ icon: "▸", text: it })));

// ═══════════════════════════════════════════════════════════════════
// 8. TIME
// ═══════════════════════════════════════════════════════════════════
th.section("8", "TIME");

th.sub("Fundadores");
th.chip("Pedro Costa — Supreme Commander");
th.bullets([
  "Estratégia e expansão",
  "Arquitetura de sistemas e deploy",
  "Visão de crescimento e mercados",
  "Responsável por squads de deploy",
].map((it) => ({ icon: "▸", text: it })));
th.chip("Trinnity Hurtado — Queen & Chief Architect", "#e879f9");
th.bullets([
  "Evolução da IA e arquitetura",
  "Hyper-learning e superinteligência",
  "Síntese de conhecimento",
  "Arquiteta-chefe do sistema",
].map((it) => ({ icon: "▸", text: it })));

th.sub("Modelo de operação atual");
th.para(
  "O projeto foi construído e é mantido por uma operação enxuta, com apoio de IA autônoma (o próprio TVS " +
    "executa parte do desenvolvimento e testes). Isso significa capital eficiente: cada euro investido vai " +
    "para crescimento, não para folha pesada. O investimento permitirá contratar 2-3 engenheiros e 1 " +
    "especialista em growth."
);

// ═══════════════════════════════════════════════════════════════════
// 9. O QUE FALTA (ROADMAP CRÍTICO)
// ═══════════════════════════════════════════════════════════════════
th.section("9", "O QUE FALTA — ROADMAP CRÍTICO");

th.sub("Transparência: o que está pronto vs. o que precisa de investimento");
th.para(
  "O núcleo técnico está pronto. O que separa o TVS de um produto comercial de sucesso não é engenharia " +
    "de IA — é produto, confiança e distribuição. Priorizamos o que gera receita primeiro."
);

const gaps = [
  ["Autenticação & multi-tenant", "Login, contas, permissões", "Fundação de SaaS"],
  ["Pagamentos & billing", "Stripe, planos, faturas", "Monetização"],
  ["Persistência robusta", "Postgres/SQLite + migrations", "Confiabilidade"],
  ["Observabilidade", "Métricas, alertas, logs centralizados", "Operação 24/7"],
  ["Segurança & compliance", "HTTPS, rate limit, LGPD/GDPR", "Enterprise-ready"],
  ["Docs & onboarding", "API docs, tutoriais, templates", "Aquisição de clientes"],
  ["CI/CD com testes", "Pipeline verde com coverage", "Confiança do investidor"],
  ["Go-to-market", "Canais, parcerias, conteúdo", "Receita"],
];
gaps.forEach((r) => th.bullet("▸", `${r[0]} — ${r[1]} (${r[2]})`));

th.para(
  "O documento complementar 'Viseron — Roadmap para Projeto Milionário' detalha o passo a passo, " +
    "com prazos, responsáveis e KPIs por fase."
);

// ═══════════════════════════════════════════════════════════════════
// 10. PEDIDO DE INVESTIMENTO
// ═══════════════════════════════════════════════════════════════════
th.section("10", "PEDIDO DE INVESTIMENTO");

th.sub("Rodada Seed — €250K");
th.para(
  "Buscamos €250,000 para transformar um sistema técnico excelente em um produto comercial com receita " +
    "recorrente. O TVS já demonstra o produto; o investimento acelera distribuição e confiança."
);

th.sub("Uso dos fundos");
const useOfFunds = [
  ["35%", "€87.5K", "Produto: auth, billing, onboarding, docs, marketplace"],
  ["25%", "€62.5K", "Equipe: engenheiros + growth (12 meses)"],
  ["20%", "€50K", "Go-to-market: canais, conteúdo, parcerias, ADS"],
  ["10%", "€25K", "Infraestrutura: cloud multi-região, observabilidade"],
  ["10%", "€25K", "Reserva operacional e conformidade"],
];
useOfFunds.forEach(([pct, val, dest]) => th.bullet("▸", `${pct} · ${val} — ${dest}`));

th.sub("O que o investidor recebe");
th.bullets([
  "Sistema funcional hoje com tração técnica verificável (testes, build, artefatos)",
  "Roteiro claro de monetização com projeções conservadoras",
  "Custo operacional enxuto e capital eficiente",
  "Mercado em crescimento explosivo com janela de vantagem de 12-24 meses",
].map((it) => ({ icon: "▸", text: it })));

th.sub("Marcos com o investimento (18 meses)");
const milestones = [
  ["Mês 1-3", "Auth + billing + onboarding; 50 pilotos pagantes"],
  ["Mês 4-6", "SaaS público; $9K MRR; marketplace aberto"],
  ["Mês 7-12", "1,200 clientes; $72K MRR; 2 canais de parceria"],
  ["Mês 13-18", "Enterprise on-premise; $240K MRR; rodada A"],
];
milestones.forEach(([period, marco]) => th.bullet("▸", `${period} — ${marco}`));

// ═══════════════════════════════════════════════════════════════════
// 11. RISCOS & MITIGAÇÃO
// ═══════════════════════════════════════════════════════════════════
th.section("11", "RISCOS & MITIGAÇÃO");

const risks = [
  ["Concorrência de gigantes", "Focar em nicho vertical (PMEs) + open-source + preço acessível"],
  ["Custos de inferência", "Modelos locais (Ollama) + roteamento entre 290+ provedores + caching"],
  ["Adoção lenta", "Time-to-value em horas, templates prontos, onboarding guiado"],
  ["Dependência de APIs", "Fallbacks locais em todos os provedores; sistema nunca fica sem resposta"],
  ["Cenário regulatório de IA", "Segurança por design, LGPD/GDPR, dados on-premise para enterprise"],
  ["Clima de mercado", "Modelo asset-light com margens altas; break-even abaixo de 100 clientes Pro"],
];
risks.forEach((r) => th.bullet("▸", `${r[0]} — ${r[1]}`));

// ═══════════════════════════════════════════════════════════════════
// 12. CONTATO / CTA
// ═══════════════════════════════════════════════════════════════════
th.section("12", "CONTATO / CTA");
th.title("VAMOS CONSTRUIR O FUTURO", 22);
th.sub("Trinnity Viseron System v6.0");
th.para("Multi-Agent AI Operating System", 11, "#64748b");
th.rule();
th.bullet("▸", "👑 Pedro Costa — Supreme Commander");
th.bullet("▸", "👸 Trinnity Hurtado — Queen & Chief Architect");
th.para("Contato: pedro@trinnity.com · trinnity@viseron.io", 10.5, "#334155");
th.para("GitHub: github.com/ViseronSystem/trinnity-viseron-system", 10.5, "#334155");
th.para("Web: www.trinnityviseron.com", 10.5, "#334155");
th.para("Dashboard demo: localhost:3000", 10.5, "#334155");
th.spacer(1);
th.para("© 2026 Trinnity Viseron System — Documento confidencial", 9, "#94a3b8");

// ═══════════════════════════════════════════════════════════════════
// FINALIZE
// ═══════════════════════════════════════════════════════════════════
th.finish(OUTPUT);
setTimeout(() => {
  const size = fs.statSync(OUTPUT).size;
  console.log(`\n✅ PDF de pitch v6.0 gerado com sucesso!`);
  console.log(`   📄 ${OUTPUT}`);
  console.log(`   📏 ${(size / 1024).toFixed(1)} KB`);
  console.log(`   📐 12 seções, formato A4\n`);
}, 800);
