import { createTheme } from "./pdf-theme";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "reports", "VISERON_Clinical_Growth_System.pdf");

async function main() {
  const t = createTheme({
    accent: "#1a6bff", accent2: "#c9a84c",
    ink: "#0f172a", muted: "#64748b", soft: "#f8fafc",
    title: "VISERON Clinical Growth System",
    subject: "Intelligent Business Growth Infrastructure"
  });

  t.doc.rect(0, 0, t.doc.page.width, t.doc.page.height).fill("#050510");
  t.page();

  // ── COVER ──
  t.cover({
    title: "VISERON",
    subtitle: "Clinical Growth System\nIntelligent Business Growth Infrastructure",
    badges: ["COMERCIAL", "2026", "v5.0"],
    date: "2026",
    version: "v5.0 Cognitive OS",
    brand: "© Pedro Costa · Trinnity Hurtado · Trinnity Viseron System",
  });

  t.page();

  // ── PAGE 2: DESAFIO ──
  t.section("1", "O DESAFIO DAS CLINICAS");
  t.para("Clinicas enfrentam desafios operacionais que limitam o crescimento:", 11);
  t.spacer(0.5);
  t.bullets([
    { text: "Dificuldade em gerar novos pacientes de forma previsivel" },
    { text: "Processos comerciais desorganizados e inconsistentes" },
    { text: "Falta de acompanhamento estruturado de leads" },
    { text: "Ausencia de dados consolidados para tomada de decisao" },
    { text: "Criacao constante de conteudo sem estrategia" },
    { text: "Operacoes manuais que consomem tempo da equipa clinica" },
  ]);
  t.spacer();
  t.para("Objetivo: Criar uma operacao previsivel de crescimento, onde cada lead e acompanhado, cada metrica e visivel e cada decisao tem dados.", 11);
  t.spacer();

  // ── PAGE 3: COMO OPERA ──
  t.section("2", "COMO A VISERON OPERA");
  t.para("A VISERON funciona como uma camada inteligente de coordenacao — nao substitui pessoas, aumenta a sua capacidade.", 11);
  t.spacer();
  t.bullets([
    { icon: "●", text: "Marketing Intelligence — estrategia, criativos, campanhas", color: "#1a6bff" },
    { icon: "●", text: "Sales Operations — gestao de leads, follow-up, conversao", color: "#22c55e" },
    { icon: "●", text: "Content Creation — scripts, posts, calendario editorial", color: "#c9a84c" },
    { icon: "●", text: "Analytics — metricas, relatorios, insights de performance", color: "#a855f7" },
    { icon: "●", text: "Automation — workflows, integracoes, processos escalaveis", color: "#fb923c" },
  ]);
  t.spacer();

  // ── PAGE 4: CAPACIDADES ──
  t.section("3", "CAPACIDADES REAIS DISPONIVEIS HOJE", "IMPLEMENTADO — v5.0 Cognitive OS");
  t.spacer();
  t.sub("Cognitive Telemetry");
  t.para("Rastreamento completo de cada operacao. Evidencias. Metricas. SHA-256 verified.", 10);
  t.spacer(0.5);
  t.sub("Embeddings + RAG Pipeline");
  t.para("Consulta inteligente ao conhecimento da empresa. Recuperacao semantica de informacao com fontes.", 10);
  t.spacer(0.5);
  t.sub("GraphRAG — Knowledge Graph");
  t.para("Conexao entre entidades de conhecimento. Busca hibrida: grafo + vetores.", 10);
  t.spacer(0.5);
  t.sub("Memory System (4 camadas)");
  t.para("STM → LTM → Knowledge Base → Vector Store. Historico persistente. Decisoes arquivadas.", 10);
  t.spacer(0.5);
  t.sub("Evolution Layer");
  t.para("Analise de desempenho baseada em evidencia. Zero formulas. Zero random. Metricas reais.", 10);
  t.spacer(0.5);
  t.sub("Command Center 2.0");
  t.para("Visualizacao operacional 3D. Agentes em tempo real. Terminal de comandos. Voice-ready.", 10);
  t.spacer();

  // ── PAGE 5: ENTREGA ──
  t.section("4", "ENTREGA PARA UMA CLINICA");
  t.para("Fluxo operacional VISERON para crescimento de clinicas:", 11);
  t.spacer();
  t.bullets([
    { icon: "1", text: "Diagnostico — analise da situacao atual, mercado, concorrencia" },
    { icon: "2", text: "Estrategia — definicao de canais, publico, orcamento, metas" },
    { icon: "3", text: "Campanhas — criacao e gestao de trafego pago (Google, Meta, TikTok)" },
    { icon: "4", text: "Conteudo — producao de criativos, landing pages, scripts" },
    { icon: "5", text: "Leads — captura, qualificacao, resposta automatica, CRM" },
    { icon: "6", text: "Automacao — follow-ups, nurturing, workflows de conversao" },
    { icon: "7", text: "Analise — metricas semanais, CPA, ROAS, taxa de conversao, relatorios" },
  ]);
  t.spacer();

  // ── PAGE 6: STACK ──
  t.section("5", "STACK DE INTEGRACOES");
  t.para("Ferramentas conectadas pela estrategia operacional VISERON:", 10, "#64748b");
  t.spacer(0.5);
  t.kv("Aquisicao", "Apollo · Clay · Instantly");
  t.kv("CRM", "GoHighLevel · HubSpot · Pipedrive");
  t.kv("Automacao", "Make · Zapier · n8n");
  t.kv("Conteudo", "ChatGPT · Claude · Canva · CapCut · Opus Clip");
  t.kv("Analytics", "Google Ads · Meta Ads · TikTok Ads");
  t.spacer();
  t.para("Estas ferramentas sao conectadas pela camada VISERON — que coordena, mede e otimiza.", 10, "#64748b");
  t.spacer();

  // ── PAGE 7: AGENTES ──
  t.section("6", "AGENTES ESPECIALIZADOS", "Clinical Growth Squad");
  t.spacer();
  t.sub("Marketing Agent");
  t.para("Analise de mercado, ideias de campanhas, pesquisa de publico.", 10);
  t.spacer(0.5);
  t.sub("Content Agent");
  t.para("Scripts para videos, criativos para anuncios, calendario editorial.", 10);
  t.spacer(0.5);
  t.sub("Sales Agent");
  t.para("Organizacao de leads, respostas automaticas, follow-up estruturado.", 10);
  t.spacer(0.5);
  t.sub("Analytics Agent");
  t.para("Metricas de campanha, relatorios de performance, insights de melhoria.", 10);
  t.spacer(0.5);
  t.sub("Operations Agent");
  t.para("Workflows, automacao de processos, integracao entre ferramentas.", 10);
  t.spacer();
  t.para("IMPORTANTE: Agentes funcionais sao implementados conforme necessidade do cliente. O Clinical Growth Squad e uma configuracao de agentes VISERON adaptada ao nicho de saude.", 10, "#64748b");

  t.spacer();

  // ── PAGE 8: ENTREGA AO CLIENTE ──
  t.section("7", "O QUE A VISERON ENTREGA");
  t.bullets([
    { icon: "✓", text: "Estrategia de crescimento documentada e mensuravel", color: "#22c55e" },
    { icon: "✓", text: "Automacao de processos comerciais repetitivos", color: "#22c55e" },
    { icon: "✓", text: "Organizacao comercial com CRM estruturado", color: "#22c55e" },
    { icon: "✓", text: "Producao de conteudo com calendario editorial", color: "#22c55e" },
    { icon: "✓", text: "Analise de dados com metricas em tempo real", color: "#22c55e" },
    { icon: "✓", text: "Relatorios inteligentes baseados em dados reais", color: "#22c55e" },
    { icon: "✓", text: "Processos escalaveis que crescem com a clinica", color: "#22c55e" },
    { icon: "✓", text: "Infraestrutura de conhecimento que acumula com o tempo", color: "#22c55e" },
  ]);
  t.spacer();

  // ── PAGE 9: LIMITES ──
  t.section("8", "LIMITES ATUAIS E TRANSPARENCIA", "Construcao baseada em realidade");
  t.para("A VISERON e uma infraestrutura de inteligencia — nao substitui completamente:", 11);
  t.spacer(0.5);
  t.bullets([
    { text: "Gestor humano — decisoes estrategicas permanecem com pessoas" },
    { text: "Especialista de anuncios — a VISERON organiza, nao clica em botoes" },
    { text: "Vendedor humano — a VISERON prepara, organiza e faz follow-up" },
    { text: "Decisoes criativas — a VISERON gera ideias, o humano aprova" },
  ]);
  t.spacer();
  t.para("A VISERON AUMENTA a capacidade humana — atraves de inteligencia, automacao e organizacao. Nao e uma substituicao, e uma amplificacao.", 11, "#1a6bff");
  t.spacer();

  // ── PAGE 10: VISAO ──
  t.section("9", "VISAO FUTURA");
  t.spacer();
  t.kv("Hoje", "Intelligent Business Infrastructure — coordenacao com agentes, dados e automacao");
  t.kv("Proximo", "Autonomous Business Operations — agentes que executam workflows com supervisao humana");
  t.kv("Futuro", "Multi-Agent Enterprise OS — ecossistema autonomo de crescimento empresarial");
  t.spacer(2);
  t.rule();
  t.spacer();
  t.para("VISERON nao e apenas uma ferramenta. E uma infraestrutura inteligente criada para conectar pessoas, conhecimento, agentes e operacoes empresariais.", 12, "#1a6bff");
  t.spacer();
  t.para("Gerado por VISERON Intelligence System · 2026", 8, "#64748b");
  t.para("© Pedro Costa · Trinnity Hurtado · Trinnity Viseron System v5.0", 8, "#64748b");

  t.finish(OUT);
  console.log("[TVS] PDF: " + OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
