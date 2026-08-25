import * as fs from "fs";
import * as path from "path";
import { createTheme } from "./pdf-theme";
import type { Theme } from "./pdf-theme";

const OUTPUT = path.join(__dirname, "..", "data", "Viseron_Roadmap_Milionario.pdf");

const WIDTHS_VERIFIED = [95, 70, 320];
const WIDTHS_TWO = [110, 385];
const WIDTHS_FINANCE = [70, 55, 70, 70, 90, 140];
const WIDTHS_MIX = [110, 80, 110, 185];
const WIDTHS_IMMEDIATE = [50, 445];

function drawTable(t: Theme, headers: string[], rows: string[][], colWidths: number[]): void {
  const W = t.doc.page.width;
  const ML = 54;
  const total = colWidths.reduce((a, b) => a + b, 0);
  const scale = (W - 108) / total;
  const widths = colWidths.map((w) => w * scale);

  const drawRow = (cells: string[], bold: boolean, color: string) => {
    t.ensure(30);
    const y0 = t.doc.y;
    let maxH = 0;
    let x = ML;
    for (let i = 0; i < cells.length; i++) {
      t.doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(8.5).fillColor(color);
      t.doc.text(cells[i], x, y0, { width: widths[i], lineGap: 1 });
      maxH = Math.max(maxH, t.doc.y - y0);
      x += widths[i];
    }
    t.doc.y = y0 + maxH + 3;
  };

  drawRow(headers, true, "#0f172a");
  t.rule();
  for (let r = 0; r < rows.length; r++) {
    drawRow(rows[r], false, "#334155");
    if (r < rows.length - 1) {
      const yy = t.doc.y;
      t.doc.save();
      t.doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(ML, yy).lineTo(W - ML, yy).stroke();
      t.doc.restore();
      t.doc.y = yy + 4;
    }
  }
  t.spacer(0.6);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const t = createTheme({
    title: "Trinnity Viseron System — Roadmap para Projeto Milionário",
    subject: "Passo a passo completo: o que temos, o que falta, como chegar a €1M+ ARR",
  });

  // ═══════════════════════════════════════════════════════════════════
  // COVER
  // ═══════════════════════════════════════════════════════════════════
  t.cover({
    title: "ROADMAP PARA O\nPROJETO MILIONÁRIO",
    subtitle: "Do sistema funcional ao negócio de €1M+ ARR — passo a passo · O que já temos · O que falta · Como chegar lá",
    badges: ["Auditoria honesta", "6 fases + KPIs", "Projeção financeira", "Go-to-market", "Rodada A"],
    date: "Agosto 2026",
    version: "5.0",
    url: "www.trinnityviseronsystem.io",
  });

  // ═══════════════════════════════════════════════════════════════════
  // 1. INTRODUÇÃO
  // ═══════════════════════════════════════════════════════════════════
  t.section("1", "INTRODUÇÃO — POR QUE ESTE DOCUMENTO");

  t.para(
    "O Trinnity Viseron System (TVS) é um dos sistemas multi-agente de IA mais completos construídos até " +
    "hoje do ponto de vista técnico: 5,000+ agentes, memória persistente, integrações de voz/WhatsApp/n8n, " +
    "deploy multi-plataforma. Porém, um projeto vira 'milionário' quando resolve um problema que alguém paga " +
    "para resolver, com distribuição, confiança e receita recorrente."
  );

  t.para(
    "Este documento é o plano de execução completo: uma auditoria honesta do que já funciona, o checklist de " +
    "tudo o que falta, as fases de implementação com prazos e KPIs, e a projeção financeira para alcançar " +
    "€1M+ de receita anual recorrente (ARR)."
  );

  t.sub("Princípios de execução");
  t.bullet("●", "Receita antes de escala: cada fase entrega algo que gera dinheiro ou reduz risco");
  t.bullet("●", "Dados antes de opinião: decisões baseadas em métricas reais (MRR, churn, ativação)");
  t.bullet("●", "Aproveitar o que já existe: o núcleo está pronto; investir onde falta valor");
  t.bullet("●", "Comunidade e open-source como motor de aquisição de baixo custo");

  t.doc.addPage();

  // ═══════════════════════════════════════════════════════════════════
  // 2. AUDITORIA DO ESTADO ATUAL
  // ═══════════════════════════════════════════════════════════════════
  t.section("2", "AUDITORIA — O QUE JÁ FUNCIONA (VERIFICADO)");

  t.sub("Status técnico real (agosto 2026)");
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
  drawTable(t, ["Área", "Estado", "Detalhe"], verified, WIDTHS_VERIFIED);

  t.sub("Conclusão da auditoria");
  t.para(
    "A engenharia está à frente do negócio. O TVS provou que consegue construir; agora precisa provar que " +
    "consegue vender. O foco das próximas fases muda de features técnicas para produto, confiança e " +
    "distribuição."
  );

  t.doc.addPage();

  // ═══════════════════════════════════════════════════════════════════
  // 3. O QUE FALTA — CHECKLIST COMPLETO
  // ═══════════════════════════════════════════════════════════════════
  t.section("3", "O QUE FALTA — CHECKLIST COMPLETO");

  t.sub("1. Fundação de produto (crítico — sem isso não há SaaS)");
  const c1 = [
    ["Auth & contas", "Login/registro, JWT, perfis, multi-tenant"],
    ["Billing", "Stripe/Paddle, planos, upgrades, faturas, trial"],
    ["Persistência real", "Postgres/SQLite + migrations + backups de dados"],
    ["Segurança", "HTTPS, rate limiting, sanitização, .env protegido"],
    ["Observabilidade", "Métricas, logs centralizados, alertas, uptime"],
    ["Onboarding", "Setup guiado, templates de 1-clique, docs"],
  ];
  drawTable(t, ["Item", "O que entregar"], c1, WIDTHS_TWO);

  t.sub("2. Confiança e governança (para enterprise e investidores)");
  const c2 = [
    ["CI/CD real", "Pipeline com testes + coverage em todo PR"],
    ["Testes de integração", "Fluxos de ponta a ponta (auth → agente → resultado)"],
    ["Compliance", "LGPD/GDPR, termos de uso, política de privacidade"],
    ["Licenciamento claro", "Licença open-source + licenças comerciais"],
    ["Contratos", "Modelo de contrato SaaS, SLA, DPA"],
  ];
  drawTable(t, ["Item", "O que entregar"], c2, WIDTHS_TWO);

  t.sub("3. Distribuição e receita (o motor do crescimento)");
  const c3 = [
    ["Docs de API", "Docs interativos (OpenAPI/Swagger) para devs"],
    ["Canais de conteúdo", "Blog, tutorial em vídeo, casos de uso, SEO"],
    ["Marketplace", "Venda de skills/agentes com comissão"],
    ["Programa de afiliados", "Incentivo a criadores e revendas"],
    ["Comunidade", "Discord/Telegram, contribuições open-source, badges"],
  ];
  drawTable(t, ["Item", "O que entregar"], c3, WIDTHS_TWO);

  t.sub("4. Expansão de mercado");
  const c4 = [
    ["App stores", "Publicar APK/AAB e iOS (contas de desenvolvedor)"],
    ["Idiomas", "Mais de 3 idiomas (FR, DE, IT, JP, ZH)"],
    ["Enterprise", "Deploy on-premise, SSO, white-label"],
    ["Multi-nó", "Cluster distribuído e rede p2p de agentes"],
  ];
  drawTable(t, ["Item", "O que entregar"], c4, WIDTHS_TWO);

  t.doc.addPage();

  // ═══════════════════════════════════════════════════════════════════
  // 4. FASES DE EXECUÇÃO
  // ═══════════════════════════════════════════════════════════════════
  t.section("4", "FASES DE EXECUÇÃO — PASSO A PASSO");

  t.sub("Fase 0 — Fundação de produto (Meses 1-3)");
  t.para("Objetivo: tornar o sistema vendável. Sem auth e billing, ninguém paga. KPI de saída: 50 pilotos ativos pagantes (trial → pago).");
  t.bullet("●", "Implementar autenticação multi-tenant (registro, login, JWT, perfis)");
  t.bullet("●", "Implementar billing com Stripe (planos Core/Pro/Enterprise + trial 14 dias)");
  t.bullet("●", "Persistência: adicionar Postgres com migrations; garantir backup automático de dados");
  t.bullet("●", "Observabilidade: métricas de uso, logs centralizados, alertas de erro");
  t.bullet("●", "Onboarding: setup guiado com 3 templates de 1-clique (conteúdo, atendimento, código)");
  t.bullet("●", "CI/CD: pipeline de testes + coverage mínimo de 70% em todo PR");

  t.sub("Fase 1 — Confiança e docs (Meses 3-5)");
  t.para("Objetivo: transformar quem testa em quem paga. KPI: ativação ≥40% e NPS ≥50 entre pilotos.");
  t.bullet("●", "Documentação de API (OpenAPI) e tutoriais em vídeo");
  t.bullet("●", "Termos de uso, privacidade (LGPD/GDPR) e modelo de contrato SaaS");
  t.bullet("●", "Licença dupla: open-source + licença comercial (a base do modelo de receita)");
  t.bullet("●", "Segurança: HTTPS forçado, rate limiting, revisão de endpoints sensíveis");
  t.bullet("●", "Testes de integração de ponta a ponta para os fluxos principais");

  t.sub("Fase 2 — Go-to-market (Meses 5-9)");
  t.para("Objetivo: gerar receita recorrente. KPI: €9K MRR ao final da fase.");
  t.bullet("●", "Lançamento público do SaaS com preços ($29/$99/$499)");
  t.bullet("●", "Blog com 2-4 posts/mês, casos de uso e SEO (o TVS já publica conteúdo sozinho)");
  t.bullet("●", "Comunidade Discord/Telegram + programa de afiliados");
  t.bullet("●", "2 parcerias de canal (agências e marketplaces)");
  t.bullet("●", "Marketplace de skills com comissão de 20%");

  t.sub("Fase 3 — Escala (Meses 9-15)");
  t.para("Objetivo: escala operacional e enterprise. KPI: €72K MRR e 2 clientes enterprise.");
  t.bullet("●", "Publicar APK/AAB nas stores e iOS (se macOS disponível)");
  t.bullet("●", "Oferta enterprise: on-premise, SSO, SLA 99.9%, white-label");
  t.bullet("●", "Cluster multi-nó e alta disponibilidade em 2 regiões cloud");
  t.bullet("●", "Programa de parceiros enterprise (revendas)");
  t.bullet("●", "Série de relatórios de impacto para imprensa/VCs");

  t.sub("Fase 4 — Ecossistema e rodada A (Meses 15-24)");
  t.para("Objetivo: consolidar e preparar a próxima rodada. KPI: €240K MRR / €2.9M ARR.");
  t.bullet("●", "Marketplace maduro com criadores externos vendendo skills");
  t.bullet("●", "Tokens $TRIN/$VSR integrados ao billing (descontos e governança)");
  t.bullet("●", "Rede p2p multi-nó em produção para clientes enterprise");
  t.bullet("●", "Rodada Série A: €2-5M com base em ARR, churn e NRR comprovados");

  t.doc.addPage();

  // ═══════════════════════════════════════════════════════════════════
  // 5. PROJEÇÃO FINANCEIRA
  // ═══════════════════════════════════════════════════════════════════
  t.section("5", "PROJEÇÃO FINANCEIRA");

  t.sub("Cenário conservador (sem investimento externo)");
  const finance = [
    ["Mês 1-3", "Fase 0", "50 pilotos", "€1.5K", "€4K", "Desenvolvimento"],
    ["Mês 4-6", "Fase 1-2", "150 clientes", "€9K", "€8K", "Launch + marketing"],
    ["Mês 7-12", "Fase 2-3", "1,200 clientes", "€72K", "€25K", "Canais + enterprise"],
    ["Mês 13-18", "Fase 3", "2,500 clientes", "€150K", "€45K", "Enterprise + stores"],
    ["Mês 19-24", "Fase 4", "4,000 clientes", "€240K", "€70K", "Marketplace + rodada A"],
  ];
  drawTable(t, ["Período", "Fase", "Clientes", "MRR", "Custo/mês", "Motor"], finance, WIDTHS_FINANCE);

  t.para(
    "Notas: (1) MRR médio ponderado entre os planos ($29/$99/$499) com mix realista. (2) Custos incluem " +
    "infraestrutura cloud, APIs de IA e equipe enxuta. (3) Break-even operacional é alcançado entre os meses " +
    "10-12, com menos de 500 clientes — o modelo é asset-light."
  );

  t.sub("Hipótese de preço e mix");
  const mix = [
    ["TVS Core", "$29/mês", "60% dos clientes", "Automação pessoal / freelancers"],
    ["TVS Pro", "$99/mês", "30% dos clientes", "PMEs e agências"],
    ["TVS Enterprise", "$499+/mês", "10% dos clientes", "Corporações on-premise"],
  ];
  drawTable(t, ["Plano", "Preço", "Mix", "Perfil"], mix, WIDTHS_MIX);

  t.sub("Investimento necessário para acelerar (rodada Seed €250K)");
  t.para(
    "Com €250K contratamos equipe de produto/growth, lançamos o SaaS em 3 meses em vez de 6, e alcançamos " +
    "€72K MRR no mês 12 em vez do mês 18. O investimento compra tempo e distribuição, não sobrevivência."
  );

  t.doc.addPage();

  // ═══════════════════════════════════════════════════════════════════
  // 6. KPIS E CONTROLE
  // ═══════════════════════════════════════════════════════════════════
  t.section("6", "KPIs E CONTROLE");

  t.sub("Métricas que definimos como verdade");
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
  drawTable(t, ["KPI", "Definição / meta"], kpis, WIDTHS_TWO);

  t.sub("Rituais de operação");
  t.bullet("●", "Revisão semanal de métricas (MRR, ativação, churn)");
  t.bullet("●", "Sprint quinzenal com 2-3 entregas que movem métrica");
  t.bullet("●", "Relatório automático de status gerado pelo próprio TVS");
  t.bullet("●", "Reunião mensal de roadmap com os principais pilotos");

  t.doc.addPage();

  // ═══════════════════════════════════════════════════════════════════
  // 7. EXECUÇÃO IMEDIATA
  // ═══════════════════════════════════════════════════════════════════
  t.section("7", "EXECUÇÃO IMEDIATA — PRÓXIMAS 2 SEMANAS");

  t.sub("O que fazer agora (sem depender de investimento)");
  const immediate = [
    ["S1", "Auditar .env e remover segredos do repositório; .gitignore ok"],
    ["S1", "Adicionar auth mínimo (JWT) para o dashboard e API"],
    ["S1", "Publicar docs de API (OpenAPI) a partir dos endpoints existentes"],
    ["S2", "Subir o SaaS em produção (Render/Railway) com HTTPS"],
    ["S2", "Criar página de espera com email capture no site"],
    ["S2", "Lançar 1 post de blog + caso de uso no site"],
    ["S2", "Preparar repositório público limpo com README profissional"],
  ];
  drawTable(t, ["Semana", "Ação"], immediate, WIDTHS_IMMEDIATE);

  t.sub("Checklist diário de execução");
  t.para(
    "1) Toda mudança passa por `npm run lint` + `npm test`. 2) Todo commit vai para o GitHub com mensagem " +
    "clara. 3) Toda entrega de produto é refletida no site e nos PDFs. 4) Métricas atualizadas semanalmente " +
    "no dashboard."
  );

  t.doc.addPage();

  // ═══════════════════════════════════════════════════════════════════
  // 8. CONCLUSÃO
  // ═══════════════════════════════════════════════════════════════════
  t.section("8", "CONCLUSÃO — O CAMINHO É EXECUÇÃO");

  t.para(
    "O TVS tem o que 99% das startups não têm: um sistema funcional, testado e multi-plataforma. O que falta " +
    "não é mais engenharia bruta — é transformar o sistema em produto vendável. As próximas 24 semanas " +
    "definem a trajetória."
  );

  t.sub("Os 3 maiores riscos de não executar");
  t.bullet("●", "Continuar adicionando features técnicas sem um cliente pagante (custo de oportunidade)");
  t.bullet("●", "Não definir preço/praça → o projeto permanece uma demonstração, não um negócio");
  t.bullet("●", "Manter tudo interno → perder a janela de mercado e a comunidade");

  t.sub("Os 3 maiores acertos se executarmos");
  t.bullet("●", "Primeiro-mover em 'IA que trabalha sozinha' acessível a PMEs");
  t.bullet("●", "Sistema open-source com moat de integrações e skills (comunidade defensável)");
  t.bullet("●", "Modelo asset-light com margens altas e break-even baixo — atrativo para VCs");

  t.sub("Meta definitiva");
  t.para(
    "€1,000,000 ARR até o mês 24. Cada fase deste documento é um degrau para esse número. O próximo commit " +
    "no GitHub deve ser um passo de produto, não de demonstração."
  );

  // ═══════════════════════════════════════════════════════════════════
  // FINALIZE
  // ═══════════════════════════════════════════════════════════════════
  t.finish(OUTPUT);

  const start = Date.now();
  while (!fs.existsSync(OUTPUT) && Date.now() - start < 5000) await sleep(50);
  await sleep(150);
  const size = fs.statSync(OUTPUT).size;
  console.log(`\n✅ PDF de roadmap gerado com sucesso!`);
  console.log(`   📄 ${OUTPUT}`);
  console.log(`   📏 ${(size / 1024).toFixed(1)} KB`);
  console.log(`   📐 8 seções, formato A4\n`);
}

main().catch((e) => {
  console.error("Falha ao gerar roadmap:", e.message);
  process.exit(1);
});
