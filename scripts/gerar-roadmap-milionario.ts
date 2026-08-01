import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

const OUTPUT = path.join(__dirname, "..", "data", "Viseron_Roadmap_Milionario.pdf");

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 45, bottom: 45, left: 50, right: 50 },
  info: {
    Title: "Trinnity Viseron System — Roadmap para Projeto Milionário",
    Author: "Pedro Costa & Trinnity Hurtado",
    Subject: "Passo a passo completo: o que temos, o que falta, como chegar a €1M+ ARR",
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
  doc.text(`Trinnity Viseron System — Roadmap para Projeto Milionário  |  Página ${pageNum}`, ML, PH - 25, { align: "center", width: CW });
  doc.moveTo(ML, PH - 32).lineTo(PW - MR, PH - 32).strokeColor(COLOR.border).lineWidth(0.5).stroke();
}

function coverPage() {
  const grd = doc.linearGradient(0, 0, PW, PH);
  grd.stop(0, "#0a0a2e").stop(0.5, "#0d0d24").stop(1, "#0a0a1a");
  doc.rect(0, 0, PW, PH).fill(grd);

  for (let i = 0; i < 80; i++) {
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
  doc.text("PLANO DE EXECUÇÃO  ·  v6.0", ML, 130, { align: "center", width: CW });
  doc.opacity(1);

  doc.fillColor(COLOR.white).fontSize(40).font("Helvetica-Bold");
  doc.text("ROADMAP PARA O", ML, 158, { align: "center", width: CW });
  doc.fillColor(COLOR.gold).fontSize(44).font("Helvetica-Bold");
  doc.text("PROJETO MILIONÁRIO", ML, 205, { align: "center", width: CW });

  doc.fillColor(COLOR.muted).fontSize(13).font("Helvetica");
  doc.text("Do sistema funcional ao negócio de €1M+ ARR — passo a passo", ML, 268, { align: "center", width: CW });
  doc.fillColor(COLOR.secondary).fontSize(11).font("Helvetica");
  doc.text("O que já temos · O que falta · Como chegar lá", ML, 292, { align: "center", width: CW });

  doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3);
  doc.moveTo(180, 330).lineTo(PW - 180, 330).stroke();
  doc.opacity(1);

  const features = [
    "✅ Auditoria honesta do estado atual (o que funciona de verdade)",
    "❌ Checklist completo do que falta para o mercado",
    "📅 6 fases com prazos, responsáveis e KPIs",
    "💰 Projeção financeira: receita, custos e break-even",
    "🚀 Plano de go-to-market e canais de aquisição",
    "📈 Critérios para a rodada A de investimento",
  ];
  doc.fontSize(10.5).font("Helvetica");
  features.forEach((f, i) => {
    doc.fillColor(COLOR.body).text(f, 130, 355 + i * 23, { width: CW - 60 });
  });

  doc.fillColor(COLOR.muted).fontSize(10).font("Helvetica");
  doc.text("Agosto 2026  ·  Documento interno de execução", ML, 530, { align: "center", width: CW });
  doc.fillColor(COLOR.secondary).fontSize(11).font("Helvetica-Bold");
  doc.text("Pedro Costa (Commander)  ·  Trinnity Hurtado (Queen)", ML, 555, { align: "center", width: CW });

  doc.addPage();
}

function section(title: string, number?: string) {
  if (doc.y > 700) doc.addPage();
  footer();
  doc.moveDown(0.5);
  doc.lineWidth(2).strokeColor(COLOR.primary).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
  doc.moveDown(0.8);
  const prefix = number ? `${number}.  ` : "";
  doc.fillColor(COLOR.white).fontSize(23).font("Helvetica-Bold").text(prefix + title, { width: CW });
  doc.moveDown(0.3);
  doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3).moveTo(ML, doc.y).lineTo(ML + 80, doc.y).stroke();
  doc.opacity(1);
  doc.moveDown(0.8);
}

function sub(title: string) {
  if (doc.y > 720) doc.addPage();
  doc.fillColor(COLOR.secondary).fontSize(14).font("Helvetica-Bold").text(title, { width: CW });
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
// 1. INTRODUÇÃO
// ═══════════════════════════════════════════════════════════════════
section("INTRODUÇÃO — POR QUE ESTE DOCUMENTO", "1");

body(
  "O Trinnity Viseron System (TVS) é um dos sistemas multi-agente de IA mais completos construídos até " +
  "hoje do ponto de vista técnico: 5,000+ agentes, memória persistente, integrações de voz/WhatsApp/n8n, " +
  "deploy multi-plataforma. Porém, um projeto vira 'milionário' quando resolve um problema que alguém paga " +
  "para resolver, com distribuição, confiança e receita recorrente."
);

body(
  "Este documento é o plano de execução completo: uma auditoria honesta do que já funciona, o checklist de " +
  "tudo o que falta, as fases de implementação com prazos e KPIs, e a projeção financeira para alcançar " +
  "€1M+ de receita anual recorrente (ARR)."
);

sub("Princípios de execução");
bullet("Receita antes de escala: cada fase entrega algo que gera dinheiro ou reduz risco");
bullet("Dados antes de opinião: decisões baseadas em métricas reais (MRR, churn, ativação)");
bullet("Aproveitar o que já existe: o núcleo está pronto; investir onde falta valor");
bullet("Comunidade e open-source como motor de aquisição de baixo custo");

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 2. AUDITORIA DO ESTADO ATUAL
// ═══════════════════════════════════════════════════════════════════
section("AUDITORIA — O QUE JÁ FUNCIONA (VERIFICADO)", "2");

sub("Status técnico real (agosto 2026)");
const verified = [
  ["Núcleo multi-agente", "✅ Pronto", "AgentManager, Squads, Orchestrator, 5,000+ agentes, memória STM/LTM"],
  ["Testes e build", "✅ Verde", "14/14 testes passando; TypeScript sem erros (npm run lint)"],
  ["Modelos de IA", "✅ Pronto", "Ollama local + OpenAI/Anthropic/Gemini/Grok + OmniRoute (290+ provedores)"],
  ["Autonomia", "✅ Pronto", "4 ciclos: HyperLearning, AutoEvolution, AutoLearning, AutoPilot"],
  ["Integrações", "✅ Pronto", "n8n, Call System (Twilio), ASNO (WhatsApp/HA), OpenJarvis, Viseron Apps"],
  ["Frontends", "✅ Pronto", "WebOS, Dashboard REST API, PDF reports, Mobile (APK), Electron, CLI"],
  ["Deploy", "✅ Pronto", "GitHub, Vercel, Render, Railway, Docker, exe standalone"],
  ["Automação operacional", "✅ Pronto", "Backup diário 03:00, auto-deploy, skills auto-instaladas"],
  ["Skills & templates", "✅ Pronto", "958 skills, 5 templates n8n, tokenomics $TRIN/$VSR"],
  ["Documentação", "🟡 Parcial", "Manuais e PDFs existem, mas faltam docs de API e onboarding"],
  ["Site & marketing", "🟡 Parcial", "Landing page no ar, mas sem blog ativo nem funil de conversão"],
  ["Receita", "❌ Não existe", "Nenhum cliente pagante ainda — é o gap crítico"],
];
table(["Área", "Estado", "Detalhe"], verified, [95, 70, CW - 175], 26);

sub("Conclusão da auditoria");
body(
  "A engenharia está à frente do negócio. O TVS provou que consegue construir; agora precisa provar que " +
  "consegue vender. O foco das próximas fases muda de features técnicas para produto, confiança e " +
  "distribuição."
);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 3. O QUE FALTA — CHECKLIST COMPLETO
// ═══════════════════════════════════════════════════════════════════
section("O QUE FALTA — CHECKLIST COMPLETO", "3");

sub("1. Fundação de produto (crítico — sem isso não há SaaS)");
const c1 = [
  ["Auth & contas", "Login/registro, JWT, perfis, multi-tenant"],
  ["Billing", "Stripe/Paddle, planos, upgrades, faturas, trial"],
  ["Persistência real", "Postgres/SQLite + migrations + backups de dados"],
  ["Segurança", "HTTPS, rate limiting, sanitização, .env protegido"],
  ["Observabilidade", "Métricas, logs centralizados, alertas, uptime"],
  ["Onboarding", "Setup guiado, templates de 1-clique, docs"],
];
table(["Item", "O que entregar"], c1, [110, CW - 120], 22);

sub("2. Confiança e governança (para enterprise e investidores)");
const c2 = [
  ["CI/CD real", "Pipeline com testes + coverage em todo PR"],
  ["Testes de integração", "Fluxos de ponta a ponta (auth → agente → resultado)"],
  ["Compliance", "LGPD/GDPR, termos de uso, política de privacidade"],
  ["Licenciamento claro", "Licença open-source + licenças comerciais"],
  ["Contratos", "Modelo de contrato SaaS, SLA, DPA"],
];
table(["Item", "O que entregar"], c2, [110, CW - 120], 22);

sub("3. Distribuição e receita (o motor do crescimento)");
const c3 = [
  ["Docs de API", "Docs interativos (OpenAPI/Swagger) para devs"],
  ["Canais de conteúdo", "Blog, tutorial em vídeo, casos de uso, SEO"],
  ["Marketplace", "Venda de skills/agentes com comissão"],
  ["Programa de afiliados", "Incentivo a criadores e revendas"],
  ["Comunidade", "Discord/Telegram, contribuições open-source, badges"],
];
table(["Item", "O que entregar"], c3, [110, CW - 120], 22);

sub("4. Expansão de mercado");
const c4 = [
  ["App stores", "Publicar APK/AAB e iOS (contas de desenvolvedor)"],
  ["Idiomas", "Mais de 3 idiomas (FR, DE, IT, JP, ZH)"],
  ["Enterprise", "Deploy on-premise, SSO, white-label"],
  ["Multi-nó", "Cluster distribuído e rede p2p de agentes"],
];
table(["Item", "O que entregar"], c4, [110, CW - 120], 22);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 4. FASES DE EXECUÇÃO
// ═══════════════════════════════════════════════════════════════════
section("FASES DE EXECUÇÃO — PASSO A PASSO", "4");

sub("Fase 0 — Fundação de produto (Meses 1-3)");
body("Objetivo: tornar o sistema vendável. Sem auth e billing, ninguém paga. KPI de saída: 50 pilotos ativos pagantes (trial → pago).");
bullet("Implementar autenticação multi-tenant (registro, login, JWT, perfis)");
bullet("Implementar billing com Stripe (planos Core/Pro/Enterprise + trial 14 dias)");
bullet("Persistência: adicionar Postgres com migrations; garantir backup automático de dados");
bullet("Observabilidade: métricas de uso, logs centralizados, alertas de erro");
bullet("Onboarding: setup guiado com 3 templates de 1-clique (conteúdo, atendimento, código)");
bullet("CI/CD: pipeline de testes + coverage mínimo de 70% em todo PR");

sub("Fase 1 — Confiança e docs (Meses 3-5)");
body("Objetivo: transformar quem testa em quem paga. KPI: ativação ≥40% e NPS ≥50 entre pilotos.");
bullet("Documentação de API (OpenAPI) e tutoriais em vídeo");
bullet("Termos de uso, privacidade (LGPD/GDPR) e modelo de contrato SaaS");
bullet("Licença dupla: open-source + licença comercial (a base do modelo de receita)");
bullet("Segurança: HTTPS forçado, rate limiting, revisão de endpoints sensíveis");
bullet("Testes de integração de ponta a ponta para os fluxos principais");

sub("Fase 2 — Go-to-market (Meses 5-9)");
body("Objetivo: gerar receita recorrente. KPI: €9K MRR ao final da fase.");
bullet("Lançamento público do SaaS com preços ($29/$99/$499)");
bullet("Blog com 2-4 posts/mês, casos de uso e SEO (o TVS já publica conteúdo sozinho)");
bullet("Comunidade Discord/Telegram + programa de afiliados");
bullet("2 parcerias de canal (agências e marketplaces)");
bullet("Marketplace de skills com comissão de 20%");

sub("Fase 3 — Escala (Meses 9-15)");
body("Objetivo: escala operacional e enterprise. KPI: €72K MRR e 2 clientes enterprise.");
bullet("Publicar APK/AAB nas stores e iOS (se macOS disponível)");
bullet("Oferta enterprise: on-premise, SSO, SLA 99.9%, white-label");
bullet("Cluster multi-nó e alta disponibilidade em 2 regiões cloud");
bullet("Programa de parceiros enterprise (revendas)");
bullet("Série de relatórios de impacto para imprensa/VCs");

sub("Fase 4 — Ecossistema e rodada A (Meses 15-24)");
body("Objetivo: consolidar e preparar a próxima rodada. KPI: €240K MRR / €2.9M ARR.");
bullet("Marketplace maduro com criadores externos vendendo skills");
bullet("Tokens $TRIN/$VSR integrados ao billing (descontos e governança)");
bullet("Rede p2p multi-nó em produção para clientes enterprise");
bullet("Rodada Série A: €2-5M com base em ARR, churn e NRR comprovados");

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 5. PROJEÇÃO FINANCEIRA
// ═══════════════════════════════════════════════════════════════════
section("PROJEÇÃO FINANCEIRA", "5");

sub("Cenário conservador (sem investimento externo)");
const finance = [
  ["Mês 1-3", "Fase 0", "50 pilotos", "€1.5K", "€4K", "Desenvolvimento"],
  ["Mês 4-6", "Fase 1-2", "150 clientes", "€9K", "€8K", "Launch + marketing"],
  ["Mês 7-12", "Fase 2-3", "1,200 clientes", "€72K", "€25K", "Canais + enterprise"],
  ["Mês 13-18", "Fase 3", "2,500 clientes", "€150K", "€45K", "Enterprise + stores"],
  ["Mês 19-24", "Fase 4", "4,000 clientes", "€240K", "€70K", "Marketplace + rodada A"],
];
table(["Período", "Fase", "Clientes", "MRR", "Custo/mês", "Motor"], finance, [70, 55, 70, 70, 90, CW - 355], 22);

body(
  "Notas: (1) MRR médio ponderado entre os planos ($29/$99/$499) com mix realista. (2) Custos incluem " +
  "infraestrutura cloud, APIs de IA e equipe enxuta. (3) Break-even operacional é alcançado entre os meses " +
  "10-12, com menos de 500 clientes — o modelo é asset-light."
);

sub("Hipótese de preço e mix");
const mix = [
  ["TVS Core", "$29/mês", "60% dos clientes", "Automação pessoal / freelancers"],
  ["TVS Pro", "$99/mês", "30% dos clientes", "PMEs e agências"],
  ["TVS Enterprise", "$499+/mês", "10% dos clientes", "Corporações on-premise"],
];
table(["Plano", "Preço", "Mix", "Perfil"], mix, [110, 80, 110, CW - 310], 22);

sub("Investimento necessário para acelerar (rodada Seed €250K)");
body(
  "Com €250K contratamos equipe de produto/growth, lançamos o SaaS em 3 meses em vez de 6, e alcançamos " +
  "€72K MRR no mês 12 em vez do mês 18. O investimento compra tempo e distribuição, não sobrevivência."
);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 6. KPIS E CONTROLE
// ═══════════════════════════════════════════════════════════════════
section("KPIs E CONTROLE", "6");

sub("Métricas que definimos como verdade");
const kpis = [
  ["MRR / ARR", "Receita recorrente mensal e anual"],
  ["MRR novo", "Receita vinda de novos clientes por mês"],
  ["Churn mensal", "% de clientes que cancelam (meta <3%)"],
  ["NRR", "Net revenue retention (meta >110%)"],
  ["Ativação", "% de novos usuários com 1º workflow rodando em 24h"],
  ["CAC payback", "Tempo para recuperar custo de aquisição (meta <6 meses)"],
  ["Uptime", "Disponibilidade da plataforma (meta 99.9%)"],
  ["Coverage de testes", "% de código coberto por testes (meta >70%)"],
];
table(["KPI", "Definição / meta"], kpis, [110, CW - 120], 22);

sub("Rituais de operação");
bullet("Revisão semanal de métricas (MRR, ativação, churn)");
bullet("Sprint quinzenal com 2-3 entregas que movem métrica");
bullet("Relatório automático de status gerado pelo próprio TVS");
bullet("Reunião mensal de roadmap com os principais pilotos");

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 7. EXECUÇÃO IMEDIATA
// ═══════════════════════════════════════════════════════════════════
section("EXECUÇÃO IMEDIATA — PRÓXIMAS 2 SEMANAS", "7");

sub("O que fazer agora (sem depender de investimento)");
const immediate = [
  ["S1", "Auditar .env e remover segredos do repositório; .gitignore ok"],
  ["S1", "Adicionar auth mínimo (JWT) para o dashboard e API"],
  ["S1", "Publicar docs de API (OpenAPI) a partir dos endpoints existentes"],
  ["S2", "Subir o SaaS em produção (Render/Railway) com HTTPS"],
  ["S2", "Criar página de espera com email capture no site"],
  ["S2", "Lançar 1 post de blog + caso de uso no site"],
  ["S2", "Preparar repositório público limpo com README profissional"],
];
table(["Semana", "Ação"], immediate, [50, CW - 60], 22);

sub("Checklist diário de execução");
body(
  "1) Toda mudança passa por `npm run lint` + `npm test`. 2) Todo commit vai para o GitHub com mensagem " +
  "clara. 3) Toda entrega de produto é refletida no site e nos PDFs. 4) Métricas atualizadas semanalmente " +
  "no dashboard."
);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 8. CONCLUSÃO
// ═══════════════════════════════════════════════════════════════════
section("CONCLUSÃO — O CAMINHO É EXECUÇÃO", "8");

body(
  "O TVS tem o que 99% das startups não têm: um sistema funcional, testado e multi-plataforma. O que falta " +
  "não é mais engenharia bruta — é transformar o sistema em produto vendável. As próximas 24 semanas " +
  "definem a trajetória."
);

sub("Os 3 maiores riscos de não executar");
bullet("Continuar adicionando features técnicas sem um cliente pagante (custo de oportunidade)");
bullet("Não definir preço/praça → o projeto permanece uma demonstração, não um negócio");
bullet("Manter tudo interno → perder a janela de mercado e a comunidade");

sub("Os 3 maiores acertos se executarmos");
bullet("Primeiro-mover em 'IA que trabalha sozinha' acessível a PMEs");
bullet("Sistema open-source com moat de integrações e skills (comunidade defensável)");
bullet("Modelo asset-light com margens altas e break-even baixo — atrativo para VCs");

sub("Meta definitiva");
body(
  "€1,000,000 ARR até o mês 24. Cada fase deste documento é um degrau para esse número. O próximo commit " +
  "no GitHub deve ser um passo de produto, não de demonstração."
);

// ═══════════════════════════════════════════════════════════════════
// FINALIZE
// ═══════════════════════════════════════════════════════════════════
doc.end();

stream.on("finish", () => {
  const size = fs.statSync(OUTPUT).size;
  console.log(`\n✅ PDF de roadmap gerado com sucesso!`);
  console.log(`   📄 ${OUTPUT}`);
  console.log(`   📏 ${(size / 1024).toFixed(1)} KB`);
  console.log(`   📐 8 seções, formato A4\n`);
});
