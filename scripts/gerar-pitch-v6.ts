import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

const OUTPUT = path.join(__dirname, "..", "data", "Viseron_Pitch_Investidores_v6.pdf");

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 45, bottom: 45, left: 50, right: 50 },
  info: {
    Title: "Trinnity Viseron System v6.0 — Startup Pitch para Investidores",
    Author: "Pedro Costa & Trinnity Hurtado",
    Subject: "Multi-Agent AI Operating System — Oportunidade de Investimento",
  },
});

const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);

const COLOR = {
  bg: "#0a0a1a",
  primary: "#00f0ff",
  secondary: "#bf5af2",
  accent: "#ff2d55",
  gold: "#ffd700",
  white: "#ffffff",
  body: "#e0e0f0",
  muted: "#8888aa",
  card: "#0d0d24",
  border: "#1a1a3a",
  green: "#00ff87",
  red: "#ff2d55",
};

const PW = 595.28;
const PH = 841.89;
const ML = 50;
const MR = 50;
const CW = PW - ML - MR;
let pageNum = 0;

function footer() {
  pageNum++;
  doc.fontSize(8).font("Helvetica").fillColor(COLOR.muted);
  doc.text(`Trinnity Viseron System — Startup Pitch v6.0  |  Confidencial  |  Página ${pageNum}`, ML, PH - 25, { align: "center", width: CW });
  doc.moveTo(ML, PH - 32).lineTo(PW - MR, PH - 32).strokeColor(COLOR.border).lineWidth(0.5).stroke();
}

function coverPage() {
  const grd = doc.linearGradient(0, 0, PW, PH);
  grd.stop(0, "#0a0a2e").stop(0.5, "#0d0d24").stop(1, "#0a0a1a");
  doc.rect(0, 0, PW, PH).fill(grd);

  for (let i = 0; i < 90; i++) {
    doc.circle(Math.random() * PW, Math.random() * PH, Math.random() * 1.5 + 0.3)
      .fill(Math.random() > 0.5 ? COLOR.primary : COLOR.secondary)
      .opacity(Math.random() * 0.3 + 0.1);
  }
  doc.opacity(1);

  doc.lineWidth(1).strokeColor(COLOR.primary).opacity(0.15);
  doc.rect(30, 30, PW - 60, PH - 60).stroke();
  doc.rect(35, 35, PW - 70, PH - 70).stroke();
  doc.opacity(1);

  doc.fillColor(COLOR.primary).fontSize(12).font("Helvetica").opacity(0.6);
  doc.text("OPORTUNIDADE DE INVESTIMENTO  ·  v6.0", ML, 120, { align: "center", width: CW });
  doc.opacity(1);

  doc.fillColor(COLOR.white).fontSize(44).font("Helvetica-Bold");
  doc.text("TRINNITY VISERON", ML, 148, { align: "center", width: CW });
  doc.fillColor(COLOR.primary).fontSize(38).font("Helvetica-Bold");
  doc.text("SYSTEM", ML, 200, { align: "center", width: CW });

  doc.fillColor(COLOR.muted).fontSize(13).font("Helvetica");
  doc.text("Sistema Operacional Multi-Agente de IA que trabalha sozinho", ML, 258, { align: "center", width: CW });
  doc.fillColor(COLOR.gold).fontSize(11).font("Helvetica");
  doc.text("Autonomia · Evolução contínua · Integrações em produção", ML, 282, { align: "center", width: CW });

  doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3);
  doc.moveTo(180, 320).lineTo(PW - 180, 320).stroke();
  doc.opacity(1);

  const features = [
    "✅ Sistema funcional hoje: 14/14 testes passando, build sem erros",
    "🤖 5,000+ agentes com memória, hierarquia e execução autônoma",
    "🔌 Integrações: n8n, voz, WhatsApp, Twilio, 290+ provedores de IA",
    "📱 Produto completo: Web, Mobile (APK), Desktop (Electron), CLI",
    "🌍 Deploy pronto: GitHub, Vercel, Render, Railway, Docker",
    "📈 Mercado de agentes de IA em crescimento explosivo",
  ];
  doc.fontSize(10.5).font("Helvetica");
  features.forEach((f, i) => {
    doc.fillColor(COLOR.body).text(f, 130, 345 + i * 23, { width: CW - 60 });
  });

  doc.fillColor(COLOR.muted).fontSize(10).font("Helvetica");
  doc.text("Prepared for:  Investidores e Fundos de Venture Capital  ·  Agosto 2026", ML, 520, { align: "center", width: CW });
  doc.fillColor(COLOR.secondary).fontSize(11).font("Helvetica-Bold");
  doc.text("Pedro Costa (Commander)  ·  Trinnity Hurtado (Queen)", ML, 545, { align: "center", width: CW });

  doc.fillColor(COLOR.muted).fontSize(8).font("Helvetica");
  doc.text("Documento confidencial — uso exclusivo para avaliação de investimento", ML, PH - 55, { align: "center", width: CW });

  doc.addPage();
}

function section(title: string, number?: string) {
  if (doc.y > 700) doc.addPage();
  footer();
  doc.moveDown(0.5);
  doc.lineWidth(2).strokeColor(COLOR.primary).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
  doc.moveDown(0.8);
  const prefix = number ? `${number}.  ` : "";
  doc.fillColor(COLOR.white).fontSize(24).font("Helvetica-Bold").text(prefix + title, { width: CW });
  doc.moveDown(0.3);
  doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3).moveTo(ML, doc.y).lineTo(ML + 80, doc.y).stroke();
  doc.opacity(1);
  doc.moveDown(0.8);
}

function sub(title: string) {
  if (doc.y > 720) doc.addPage();
  doc.fillColor(COLOR.secondary).fontSize(15).font("Helvetica-Bold").text(title, { width: CW });
  doc.moveDown(0.4);
  doc.fillColor(COLOR.body).fontSize(10.5).font("Helvetica");
}

function body(text: string) {
  doc.fillColor(COLOR.body).fontSize(10.5).font("Helvetica").text(text, { align: "justify", width: CW });
  doc.moveDown(0.5);
}

function bullet(text: string, indent: number = 10) {
  doc.fillColor(COLOR.primary).fontSize(10).font("Helvetica").text("●", ML + indent, doc.y, { width: 12 });
  doc.fillColor(COLOR.body).fontSize(10).font("Helvetica").text(text, ML + indent + 16, doc.y - 12, { width: CW - indent - 26, align: "justify" });
  doc.moveDown(0.3);
}

function card(title: string, items: string[], color: string = COLOR.primary) {
  if (doc.y > 680) doc.addPage();
  const y0 = doc.y;
  const cardW = (CW - 12) / 2;
  doc.rect(ML, y0, cardW, items.length * 16 + 38).fill(COLOR.card).strokeColor(COLOR.border).lineWidth(0.5).stroke();
  doc.fillColor(color).fontSize(11).font("Helvetica-Bold").text(title, ML + 10, y0 + 10, { width: cardW - 20 });
  doc.fillColor(COLOR.body).fontSize(9).font("Helvetica");
  items.forEach((it, i) => doc.text(`• ${it}`, ML + 10, y0 + 28 + i * 16, { width: cardW - 20 }));
  doc.moveDown(items.length * 0.4 + 1.5);
}

function cardRight(title: string, items: string[], color: string = COLOR.secondary) {
  if (doc.y > 680) doc.addPage();
  const y0 = doc.y;
  const cardW = (CW - 12) / 2;
  doc.rect(ML + cardW + 12, y0, cardW, items.length * 16 + 38).fill(COLOR.card).strokeColor(COLOR.border).lineWidth(0.5).stroke();
  doc.fillColor(color).fontSize(11).font("Helvetica-Bold").text(title, ML + cardW + 22, y0 + 10, { width: cardW - 20 });
  doc.fillColor(COLOR.body).fontSize(9).font("Helvetica");
  items.forEach((it, i) => doc.text(`• ${it}`, ML + cardW + 22, y0 + 28 + i * 16, { width: cardW - 20 }));
  doc.y = y0 + items.length * 16 + 50;
}

function metricBoxes(metrics: Array<[string, string]>) {
  metrics.forEach(([val, label], i) => {
    if (i % 4 === 0 && i > 0) doc.moveDown(0.2);
    const col = i % 4;
    const x = ML + col * (CW / 4);
    doc.rect(x - 5, doc.y - 2, CW / 4 - 8, 42).fill(COLOR.card).strokeColor(COLOR.border).lineWidth(0.3).stroke();
    doc.fillColor(COLOR.primary).fontSize(15).font("Helvetica-Bold").text(val, x - 2, doc.y + 1, { width: CW / 4 - 12, align: "center" });
    doc.fillColor(COLOR.muted).fontSize(7.5).font("Helvetica").text(label, x - 2, doc.y + 20, { width: CW / 4 - 12, align: "center" });
    if (i % 4 === 3 && i < metrics.length - 1) doc.moveDown(1.2);
  });
  doc.moveDown(1);
}

function table(headers: string[], rows: Array<string[]>, colWidths: number[], rowH: number = 15) {
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor(COLOR.primary);
  let x = ML;
  headers.forEach((h, i) => {
    doc.text(h, x, doc.y, { width: colWidths[i] });
    x += colWidths[i];
  });
  doc.moveDown(0.3);
  doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
  doc.opacity(1);
  doc.moveDown(0.3);
  rows.forEach((r) => {
    doc.fontSize(8.5).font("Helvetica").fillColor(COLOR.body);
    let cx = ML;
    r.forEach((cell, i) => {
      doc.text(cell, cx, doc.y, { width: colWidths[i] });
      cx += colWidths[i];
    });
    doc.moveDown(0.6);
    doc.lineWidth(0.2).strokeColor(COLOR.border).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
    doc.moveDown(0.2);
  });
  doc.moveDown(0.3);
}

// ═══════════════════════════════════════════════════════════════════
// COVER
// ═══════════════════════════════════════════════════════════════════
coverPage();
footer();

// ═══════════════════════════════════════════════════════════════════
// SUMÁRIO EXECUTIVO
// ═══════════════════════════════════════════════════════════════════
section("RESUMO EXECUTIVO", "1");

body(
  "O Trinnity Viseron System (TVS) é um sistema operacional multi-agente de IA que automatiza o trabalho " +
  "digital de ponta a ponta: planeja, executa, aprende e evolui sozinho. Diferente de um chatbot, o TVS " +
  "é uma plataforma onde milhares de agentes especializados operam de forma contínua, com memória " +
  "persistente, hierarquia de comando e auto-recuperação."
);

body(
  "Estamos posicionando o TVS como a infraestrutura de 'IA que trabalha' para PMEs e desenvolvedores — " +
  "o elo que falta entre as IAs conversacionais e a automação real de processos."
);

sub("Métricas-Chave do Sistema (estado atual real)");
metricBoxes([
  ["5,386", "Agentes ativos"],
  ["14/14", "Testes passando"],
  ["958", "Skills indexadas"],
  ["290+", "Provedores de IA"],
  ["6", "Frontends (Web/OS/Mobile/Desktop/CLI)"],
  ["3", "Idiomas (PT/EN/ES)"],
  ["100%", "Autonomia de execução"],
  ["3", "Mercados (SaaS/Empresa/Open Source)"],
]);

body(
  "Este documento descreve a oportunidade, o mercado, o modelo de negócio, os números projetados e o " +
  "plano de uso dos recursos. Ao final, apresentamos o pedido de investimento em fase Seed."
);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 2. O PROBLEMA
// ═══════════════════════════════════════════════════════════════════
section("O PROBLEMA", "2");

sub("As IAs de hoje geram conversas, não resultados");
body(
  "LLMs como ChatGPT geram texto, mas não executam trabalho real de ponta a ponta. As empresas que " +
  "tentam automatizar com agentes de IA enfrentam 4 barreiras estruturais:"
);

card("Falta de autonomia", [
  "Agentes morrem a cada execução",
  "Precisam de operadores humanos 24/7",
  "Nenhuma memória entre sessões",
  "Cada prompt exige monitoramento",
]);
cardRight("Custo de orquestração", [
  "Montar pipelines de agentes exige engenheiros",
  "Ferramentas como n8n demandam configuração manual",
  "Integrações quebram sem alerta",
  "Nenhuma auto-recuperação padrão",
]);

sub("O custo da supervisão humana");
body(
  "Estudos de mercado mostram que 60-80% do orçamento de projetos de agentes de IA é consumido por " +
  "monitoramento, correção e re-execução. As empresas compram 'IA' mas ainda pagam operadores para " +
  "operar a IA. Esse desperdício é o alvo do TVS."
);

body(
  "O segundo problema é técnico: não existe uma camada única que una memória persistente, hierarquia " +
  "de agentes, integração com ferramentas do mundo real (voz, WhatsApp, n8n, web) e evolução contínua. " +
  "O TVS foi construído para ser exatamente essa camada."
);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 3. A SOLUÇÃO
// ═══════════════════════════════════════════════════════════════════
section("A SOLUÇÃO", "3");

body(
  "O TVS é um sistema operacional de IA que executa trabalho real sem intervenção humana. Desde o boot " +
  "ele sobe servidores, carrega agentes, conecta integrações e arma ciclos de evolução que rodam para " +
  "sempre. Nenhum erro derruba o sistema: ele registra e segue."
);

sub("Diferenciais competitivos");
bullet("Autonomia real: o agente AutoPilot gera tarefas e as EXECUTA sozinho (até 2 por ciclo)");
bullet("Memória viva: STM→LTM consolidada automaticamente; nada se perde entre sessões");
bullet("Evolução contínua: agentes ganham conhecimento e capacidades novas a cada ciclo");
bullet("Imortalidade: uncaughtException → log e segue. Nenhum crash interrompe o trabalho");
bullet("Watchdogs: cada integração reinicia sozinha se o processo morrer");
bullet("Multi-plataforma: Web, Mobile (APK), Desktop (Electron), CLI, REST API");

sub("Arquitetura em camadas");
const arch = [
  ["Apresentação", "WebOS (browser desktop), REST API, Socket.IO, PDF reports, App Mobile, Electron"],
  ["Integrações", "n8n, OmniRoute (290+ providers), OpenJarvis, Call System (Twilio), ASNO (WhatsApp/HA)"],
  ["Superinteligência", "Síntese ensemble multi-provedor, HyperLearning, AutoEvolution"],
  ["Core Engine", "5,000+ agentes, squads, memória STM/LTM, tools, command chain, tokenomics"],
];
doc.fontSize(8.5).font("Helvetica-Bold").fillColor(COLOR.primary);
doc.text("Camada", ML, doc.y, { width: 90 });
doc.text("Componentes", ML + 95, doc.y - 11, { width: CW - 95 });
doc.moveDown(0.3);
doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
doc.opacity(1);
doc.moveDown(0.3);
arch.forEach(([layer, comp]) => {
  const y = doc.y;
  doc.fillColor(COLOR.secondary).fontSize(8.5).font("Helvetica-Bold").text(layer, ML, y, { width: 88 });
  doc.fillColor(COLOR.body).fontSize(8.5).font("Helvetica").text(comp, ML + 95, y, { width: CW - 105 });
  doc.moveDown(0.7);
  doc.lineWidth(0.2).strokeColor(COLOR.border).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
  doc.moveDown(0.2);
});
doc.moveDown(0.3);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 4. PRODUTO — ESTADO REAL
// ═══════════════════════════════════════════════════════════════════
section("PRODUTO — O QUE JÁ FUNCIONA", "4");

sub("O sistema roda hoje e é verificável");
body(
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
table(["Comando", "O que entrega hoje"], working, [120, CW - 130], 22);

sub("Funcionalidades comprovadas");
card("Autonomia & IA", [
  "4 ciclos autônomos (HyperLearning, AutoEvolution, AutoLearning, AutoPilot)",
  "SuperMind + SuperIntelligence multi-provedor",
  "Model Router: Ollama local + cloud (OpenAI/Anthropic/Gemini/Grok)",
  "Memória STM/LTM com persistência em disco",
]);
cardRight("Integrações & Interface", [
  "OmniRoute Hub — 290+ provedores de IA",
  "n8n Bridge — 5 templates de workflow",
  "Call System — voz por IA (Twilio)",
  "WebOS, Dashboard REST API, PDF reports, App Mobile",
]);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 5. MERCADO
// ═══════════════════════════════════════════════════════════════════
section("MERCADO", "5");

body(
  "O mercado de agentes de IA está em expansão explosiva. Em 2026, a adoção empresarial de agentes " +
  "autônomos passou de experimental para estratégica: as empresas buscam reduzir custos operacionais " +
  "e escalar sem contratar. O TVS ataca três segmentos complementares:"
);

sub("Segmentos-alvo");
card("PMEs (SaaS)", [
  "Automação de conteúdo, atendimento e processos",
  "Preço: $29–$99/mês por instância",
  "Time-to-value em horas, não semanas",
  "Mercado enorme e fragmentado",
]);
cardRight("Enterprise (Licença)", [
  "Squads de agentes sob demanda",
  "Deploy on-premise com SLA 99.9%",
  "Preço: $499–$4,999/mês",
  "Ciclo de venda mais longo, ticket alto",
]);

sub("TAM / SAM / SOM (estimativa conservadora)");
const tam = [
  ["$16.4B", "TAM — mercado global de agentes de IA autônomos (2026)"],
  ["$2.1B", "SAM — SaaS de automação de agentes p/ PMEs + developers"],
  ["$120M", "SOM — penetração realista em 36 meses (0.5% do SAM)"],
];
doc.fontSize(9).font("Helvetica-Bold").fillColor(COLOR.gold);
tam.forEach(([val, label]) => {
  doc.fillColor(COLOR.gold).fontSize(10).font("Helvetica-Bold").text(val, ML, doc.y, { width: 80 });
  doc.fillColor(COLOR.body).fontSize(9.5).font("Helvetica").text(label, ML + 85, doc.y - 12, { width: CW - 95 });
  doc.moveDown(0.7);
});

sub("Por que agora");
bullet("Ondas de agentes de IA — janela de vantagem de 12-24 meses");
bullet("Sistema já funcional: não é slide, roda hoje com testes verdes");
bullet("Custo de rodar caiu: modelos locais (Ollama) + cloud sob demanda");
bullet("Stack completa com deploy multi-cloud já configurado");

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 6. MODELO DE NEGÓCIO
// ═══════════════════════════════════════════════════════════════════
section("MODELO DE NEGÓCIO", "6");

sub("Fontes de receita");
card("Assinatura SaaS", [
  "TVS Core $29/mês — até 100 agentes",
  "TVS Pro $99/mês — até 500 agentes",
  "TVS Enterprise $499/mês — ilimitado",
  "Planos anuais com desconto de 2 meses",
]);
cardRight("Receitas complementares", [
  "Licenciamento on-premise enterprise",
  "Marketplace de skills/agentes (comissão 20%)",
  "Consultoria e implantação gerenciada",
  "Tokens $TRIN/$VSR como moeda de uso",
]);

sub("Mecânica de valor por cliente");
body(
  "Cada cliente ganha um sistema que opera 24/7: conteúdo publicado, workflows executados, atendimento " +
  "processado, código gerado. O custo marginal por agente é baixo (modelos locais + roteamento inteligente), " +
  "o que garante margens brutas de 70-85% em SaaS."
);

sub("Projeção de receita (conservadora, sem investimento adicional)");
const revenue = [
  ["Ano 1 (v6.0)", "150", "$9K MRR", "$108K ARR", "SaaS early-adopters"],
  ["Ano 2 (v6.1)", "1,200", "$72K MRR", "$864K ARR", "+ canais e parcerias"],
  ["Ano 3 (v7.0)", "4,000", "$240K MRR", "$2.9M ARR", "+ Enterprise & marketplace"],
];
table(["Fase", "Clientes", "Receita mensal", "Receita anual", "Impulsionadores"], revenue, [80, 55, 100, 100, CW - 345], 22);

body(
  "Estas projeções assumem execução moderada de go-to-market. Com o investimento proposto, aceleramos " +
  "o crescimento com equipe comercial e marketing de aquisição."
);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 7. CONCORRÊNCIA
// ═══════════════════════════════════════════════════════════════════
section("CONCORRÊNCIA", "7");

sub("Como o TVS se posiciona");
body(
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
table(["Concorrente", "O que faz", "Limitação", "O que falta"], competitors, [135, 130, 145, CW - 410], 28);

sub("Vantagens moat (defensáveis)");
bullet("Open-source com arquitetura própria (não depende de um único framework)");
bullet("Custo operacional baixo: modelos locais + roteamento inteligente entre 290+ provedores");
bullet("Ecossistema: skills (958), templates n8n, marketplace planejado");
bullet("Comunidade e tokens $TRIN/$VSR como moeda de governança");

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 8. TIME
// ═══════════════════════════════════════════════════════════════════
section("TIME", "8");

sub("Fundadores");
card("Pedro Costa — Supreme Commander", [
  "Estratégia e expansão",
  "Arquitetura de sistemas e deploy",
  "Visão de crescimento e mercados",
  "Responsável por squads de deploy",
]);
cardRight("Trinnity Hurtado — Queen & Chief Architect", [
  "Evolução da IA e arquitetura",
  "Hyper-learning e superinteligência",
  "Síntese de conhecimento",
  "Arquiteta-chefe do sistema",
]);

sub("Modelo de operação atual");
body(
  "O projeto foi construído e é mantido por uma operação enxuta, com apoio de IA autônoma (o próprio TVS " +
  "executa parte do desenvolvimento e testes). Isso significa capital eficiente: cada euro investido vai " +
  "para crescimento, não para folha pesada. O investimento permitirá contratar 2-3 engenheiros e 1 " +
  "especialista em growth."
);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 9. O QUE FALTA (ROADMAP CRÍTICO)
// ═══════════════════════════════════════════════════════════════════
section("O QUE FALTA — ROADMAP CRÍTICO", "9");

sub("Transparência: o que está pronto vs. o que precisa de investimento");
body(
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
table(["Item", "O que precisa ser feito", "Por que importa"], gaps, [120, CW - 265, 145], 28);

body(
  "O documento complementar 'Viseron — Roadmap para Projeto Milionário' detalha o passo a passo, " +
  "com prazos, responsáveis e KPIs por fase."
);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 10. PEDIDO DE INVESTIMENTO
// ═══════════════════════════════════════════════════════════════════
section("PEDIDO DE INVESTIMENTO", "10");

sub("Rodada Seed — €250K");
body(
  "Buscamos €250,000 para transformar um sistema técnico excelente em um produto comercial com receita " +
  "recorrente. O TVS já demonstra o produto; o investimento acelera distribuição e confiança."
);

sub("Uso dos fundos");
const useOfFunds = [
  ["35%", "€87.5K", "Produto: auth, billing, onboarding, docs, marketplace"],
  ["25%", "€62.5K", "Equipe: engenheiros + growth (12 meses)"],
  ["20%", "€50K", "Go-to-market: canais, conteúdo, parcerias, ADS"],
  ["10%", "€25K", "Infraestrutura: cloud multi-região, observabilidade"],
  ["10%", "€25K", "Reserva operacional e conformidade"],
];
doc.fontSize(9).font("Helvetica-Bold").fillColor(COLOR.primary);
doc.text("Alocação", ML, doc.y, { width: 60 });
doc.text("Valor", ML + 65, doc.y - 11, { width: 70 });
doc.text("Destino", ML + 140, doc.y - 11, { width: CW - 140 });
doc.moveDown(0.3);
doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
doc.opacity(1);
doc.moveDown(0.3);
useOfFunds.forEach(([pct, val, dest]) => {
  const y = doc.y;
  doc.fillColor(COLOR.gold).fontSize(9).font("Courier").text(pct, ML, y, { width: 60 });
  doc.fillColor(COLOR.primary).fontSize(9).font("Courier").text(val, ML + 65, y, { width: 70 });
  doc.fillColor(COLOR.body).fontSize(9).font("Helvetica").text(dest, ML + 140, y, { width: CW - 150 });
  doc.moveDown(0.7);
  doc.lineWidth(0.2).strokeColor(COLOR.border).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
  doc.moveDown(0.2);
});
doc.moveDown(0.5);

sub("O que o investidor recebe");
bullet("Sistema funcional hoje com tração técnica verificável (testes, build, artefatos)");
bullet("Roteiro claro de monetização com projeções conservadoras");
bullet("Custo operacional enxuto e capital eficiente");
bullet("Mercado em crescimento explosivo com janela de vantagem de 12-24 meses");

sub("Marcos com o investimento (18 meses)");
const milestones = [
  ["Mês 1-3", "Auth + billing + onboarding; 50 pilotos pagantes"],
  ["Mês 4-6", "SaaS público; $9K MRR; marketplace aberto"],
  ["Mês 7-12", "1,200 clientes; $72K MRR; 2 canais de parceria"],
  ["Mês 13-18", "Enterprise on-premise; $240K MRR; rodada A"],
];
table(["Período", "Marco"], milestones, [70, CW - 80], 22);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 11. RISCOS & MITIGAÇÃO
// ═══════════════════════════════════════════════════════════════════
section("RISCOS & MITIGAÇÃO", "11");

const risks = [
  ["Concorrência de gigantes", "Focar em nicho vertical (PMEs) + open-source + preço acessível"],
  ["Custos de inferência", "Modelos locais (Ollama) + roteamento entre 290+ provedores + caching"],
  ["Adoção lenta", "Time-to-value em horas, templates prontos, onboarding guiado"],
  ["Dependência de APIs", "Fallbacks locais em todos os provedores; sistema nunca fica sem resposta"],
  ["Cenário regulatório de IA", "Segurança por design, LGPD/GDPR, dados on-premise para enterprise"],
  ["Clima de mercado", "Modelo asset-light com margens altas; break-even abaixo de 100 clientes Pro"],
];
table(["Risco", "Mitigação"], risks, [120, CW - 130], 26);

// ═══════════════════════════════════════════════════════════════════
// 12. CONTATO / CTA
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
const grd = doc.linearGradient(0, 0, PW, PH);
grd.stop(0, "#0a0a2e").stop(0.5, "#0d0d24").stop(1, "#0a0a1a");
doc.rect(0, 0, PW, PH).fill(grd);

doc.lineWidth(1).strokeColor(COLOR.primary).opacity(0.2);
doc.rect(30, 30, PW - 60, PH - 60).stroke();
doc.rect(35, 35, PW - 70, PH - 70).stroke();
doc.opacity(1);

doc.fillColor(COLOR.white).fontSize(36).font("Helvetica-Bold");
doc.text("VAMOS", ML, 170, { align: "center", width: CW });
doc.fillColor(COLOR.primary).fontSize(40).font("Helvetica-Bold");
doc.text("CONSTRUIR O FUTURO", ML, 215, { align: "center", width: CW });

doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3);
doc.moveTo(180, 285).lineTo(PW - 180, 285).stroke();
doc.opacity(1);

doc.fillColor(COLOR.body).fontSize(12).font("Helvetica");
const contact = [
  "Trinnity Viseron System v6.0",
  "Multi-Agent AI Operating System",
  "",
  "👑 Pedro Costa — Supreme Commander",
  "👸 Trinnity Hurtado — Queen & Chief Architect",
  "",
  "Contato: pedro@trinnity.com · trinnity@viseron.io",
  "GitHub: github.com/ViseronSystem/trinnity-viseron-system",
  "Web: www.trinnityviseron.com",
  "Dashboard demo: localhost:3000",
];
contact.forEach((l, i) => {
  if (l === "") { doc.moveDown(0.6); return; }
  doc.text(l, ML, 320 + i * 26, { align: "center", width: CW });
});

for (let i = 0; i < 50; i++) {
  doc.circle(Math.random() * PW, Math.random() * PH, Math.random() * 1.5 + 0.3)
    .fill(Math.random() > 0.5 ? COLOR.primary : COLOR.secondary)
    .opacity(Math.random() * 0.2 + 0.05);
}
doc.opacity(1);

doc.fillColor(COLOR.muted).fontSize(9).font("Helvetica");
doc.text("© 2026 Trinnity Viseron System — Documento confidencial", ML, PH - 60, { align: "center", width: CW });

// ═══════════════════════════════════════════════════════════════════
// FINALIZE
// ═══════════════════════════════════════════════════════════════════
doc.end();

stream.on("finish", () => {
  const size = fs.statSync(OUTPUT).size;
  console.log(`\n✅ PDF de pitch v6.0 gerado com sucesso!`);
  console.log(`   📄 ${OUTPUT}`);
  console.log(`   📏 ${(size / 1024).toFixed(1)} KB`);
  console.log(`   📐 12 seções, formato A4\n`);
});
