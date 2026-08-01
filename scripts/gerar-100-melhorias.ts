import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// TVS — LISTA DAS 100 MELHORIAS/INTEGRAÇÕES DE IA PARA TRAZER PARA DENTRO DA VISERON
// Cada item: o que é, o que faz, e como vira um "clone nosso" com autonomia TVS.

interface Item { name: string; what: string; clone: string; }
interface Category { title: string; icon: string; items: Item[]; }

const CATS: Category[] = [
  {
    title: "Automação & Workflows",
    icon: "⚙️",
    items: [
      { name: "n8n", what: "Orquestrador de workflows visual com 400+ nós.", clone: "Viseron Flow — agente que executa e monitora workflows, sem UI externa." },
      { name: "Activepieces", what: "Automação open-source com AI steps.", clone: "Viseron Automator — templates AI nativos no core." },
      { name: "Windmill", what: "Scripts como workflows com cron.", clone: "Viseron Scheduler — motor de cron interno (node-cron + agentes)." },
      { name: "Kestra", what: "Orquestração declarativa com versionamento.", clone: "Viseron Pipelines — pipelines em YAML auditáveis." },
      { name: "Temporal", what: "Workflows duráveis e tolerantes a falhas.", clone: "Viseron Durable — retry + resume automático no orchestrator." },
      { name: "Prefect", what: "Orquestração de data flows em Python.", clone: "Viseron DataOps — integra agentes de dados do core." },
      { name: "Airflow", what: "DAGs de dados em produção.", clone: "Viseron DAG — grafo de tarefas com memória persistente." },
      { name: "Zapier", what: "Conecta 6000+ apps sem código.", clone: "Viseron Connect — ponte de webhooks própria." },
      { name: "Make (Integromat)", what: "Automação visual com cenários.", clone: "Viseron Scenarios — cenas reutilizáveis de agentes." },
      { name: "Huginn", what: "Agentes que monitoram e reagem a eventos.", clone: "Viseron Watchdog — agentes de vigilância autónomos." },
    ],
  },
  {
    title: "Modelos & LLMs (local + cloud)",
    icon: "🧠",
    items: [
      { name: "Ollama", what: "LLMs locais de um comando (já usado).", clone: "Já integrado — provider padrão do TVS." },
      { name: "vLLM", what: "Inferência de alta performance em GPU.", clone: "Viseron vLLM — servidor de inferência dedicado." },
      { name: "llama.cpp", what: "LLMs em CPU, qualquer hardware.", clone: "Viseron Lite — modo CPU para edge." },
      { name: "HuggingFace TGI", what: "Text Generation Inference em escala.", clone: "Viseron Serving — API de geração própria." },
      { name: "DeepSeek", what: "Raciocínio de alto nível (local/API).", clone: "Provider TVS deepseek — já roteado pelo ModelRouter." },
      { name: "Qwen", what: "Modelos multi-lingua e tools.", clone: "Provider TVS qwen — rota local privada." },
      { name: "Mistral", what: "Modelos eficientes EU.", clone: "Provider TVS mistral — fallback cloud." },
      { name: "GPT4All", what: "LLMs em desktop offline.", clone: "Viseron Offline — camada desktop." },
      { name: "ExLlamaV2", what: "Inferência quantizada rápida.", clone: "Viseron Turbo — inferência otimizada." },
      { name: "Groq (LPU)", what: "Inferência extremamente rápida.", clone: "Provider TVS groq — latency crítica." },
    ],
  },
  {
    title: "Agentes & Frameworks",
    icon: "🤖",
    items: [
      { name: "LangChain", what: "Composição de agentes e tools.", clone: "Viseron Core já usa abstração própria; importa padrões." },
      { name: "LangGraph", what: "Grafo de agentes com estados.", clone: "Viseron Graph — estado persistente entre agentes." },
      { name: "AutoGen", what: "Múltiplos agentes conversando.", clone: "Viseron Council — colégio de agentes (já no SuperMind)." },
      { name: "CrewAI", what: "Equipas de agentes por papéis.", clone: "Viseron Squads — AIOX/Arkom nativos." },
      { name: "Semantic Kernel", what: "SDK de IA da Microsoft.", clone: "Viseron Kernel — unifica providers no core." },
      { name: "Haystack", what: "Pipelines de NLP em produção.", clone: "Viseron Pipeline NLP — ranqueamento interno." },
      { name: "DSPy", what: "Programação de prompts otimizada.", clone: "Viseron Optimizer — auto-tuning de prompts." },
      { name: "LlamaIndex", what: "Dados como contexto para LLMs.", clone: "Viseron Index — fonte de conhecimento unificada." },
      { name: "MCP (Model Context Protocol)", what: "Padrão aberto de ferramentas (já usado).", clone: "Viseron MCP Server — servidor próprio de tools." },
      { name: "A2A (Agent2Agent)", what: "Protocolo de comunicação entre agentes.", clone: "Viseron Mesh — rede de agentes interoperável." },
    ],
  },
  {
    title: "Memória & Vetores",
    icon: "💾",
    items: [
      { name: "Chroma", what: "Base vetorial leve em memória.", clone: "Viseron Memory Local — memória de sessão vetorizada." },
      { name: "Qdrant", what: "Vetores com filtros em escala.", clone: "Viseron VDB — base vetorial de produção." },
      { name: "Weaviate", what: "Vetores + graph híbrido.", clone: "Viseron Knowledge Graph." },
      { name: "Milvus", what: "Vetores distribuídos massivos.", clone: "Viseron Scale — vetores multi-nó." },
      { name: "pgvector", what: "Vetores dentro do Postgres.", clone: "Viseron DB — juntar memória e dados." },
      { name: "FAISS", what: "Índice vetorial da Meta (rápido).", clone: "Viseron Index Engine — busca local ultra-rápida." },
      { name: "Redis", what: "Cache e STM (Short Term Memory).", clone: "Viseron Cache — STM distribuída." },
      { name: "Vespa", what: "Busca + vetores em produção da Yahoo.", clone: "Viseron Search — busca unificada." },
      { name: "Mem0", what: "Memória de agente com aprendizagem.", clone: "Viseron Mem — LTM auto-evolutiva (base existente)." },
      { name: "Elasticsearch", what: "Busca full-text + vetores.", clone: "Viseron Index — logs e documentos pesquisáveis." },
    ],
  },
  {
    title: "RAG & Conhecimento",
    icon: "📚",
    items: [
      { name: "Dify", what: "Plataforma LLMOps com RAG visual.", clone: "Viseron LLMOps — canvas próprio." },
      { name: "RAGFlow", what: "RAG com qualidade de documentos.", clone: "Viseron RAG — parsing profundo de PDF/docs." },
      { name: "AnythingLLM", what: "Chat com seus documentos (local).", clone: "Viseron Docs — chat com documentação própria." },
      { name: "Unstructured", what: "Extrai texto de qualquer ficheiro.", clone: "Viseron Parser — extração universal." },
      { name: "LlamaParse", what: "Parsing de PDFs para RAG.", clone: "Viseron Parse — parse nativo dos relatórios." },
      { name: "GraphRAG", what: "RAG sobre grafos de conhecimento.", clone: "Viseron GraphRAG — relações entre memórias." },
      { name: "ColPali", what: "Busca multimodal por documentos.", clone: "Viseron Vision RAG." },
      { name: "Hybrid Search", what: "Lexical + semântico em conjunto.", clone: "Viseron Hybrid — melhor dos dois mundos." },
      { name: "Rerankers (bge/cross-encoder)", what: "Reordena resultados para precisão.", clone: "Viseron Rank — ranking interno." },
      { name: "BGE Embeddings", what: "Embeddings multi-lingua (PT/ES/EN).", clone: "Viseron Embed — embeddings nativos." },
    ],
  },
  {
    title: "Voz & Multimodal",
    icon: "🎙️",
    items: [
      { name: "Whisper", what: "Transcrição de voz local.", clone: "Viseron Listen — STT interno." },
      { name: "Piper", what: "TTS leve e offline.", clone: "Viseron Speak — voz local." },
      { name: "Coqui TTS", what: "Clonagem de voz open-source.", clone: "Viseron Voice — clone de voz do utilizador." },
      { name: "F5-TTS", what: "TTS neural de alta qualidade.", clone: "Viseron Voice Pro." },
      { name: "FunASR", what: "ASR multilíngue (Alibaba).", clone: "Viseron Listen Pro." },
      { name: "Stable Diffusion/Flux", what: "Geração de imagens.", clone: "Viseron Vision — gerador de imagens para conteúdo." },
      { name: "LLaVA", what: "Visão + linguagem local.", clone: "Viseron Eyes — análise de imagens." },
      { name: "CLIP", what: "Entendimento de imagem-texto.", clone: "Viseron Vision Index." },
      { name: "ElevenLabs (API)", what: "Voz ultra-realista (cloud).", clone: "Viseron Voice Cloud." },
      { name: "OpenAI Realtime", what: "Voz em tempo real.", clone: "Viseron Realtime — chamadas com IA (base Twilio já existe)." },
    ],
  },
  {
    title: "Integrações B2B / SaaS",
    icon: "🔌",
    items: [
      { name: "Stripe", what: "Pagamentos (já integrado — billing).", clone: "Viseron Pay — faturação própria." },
      { name: "HubSpot", what: "CRM e marketing.", clone: "Viseron CRM — agente de pipeline." },
      { name: "Salesforce", what: "CRM enterprise.", clone: "Viseron Enterprise CRM." },
      { name: "Shopify", what: "E-commerce.", clone: "Viseron Store — agente de loja." },
      { name: "Notion", what: "Docs e bases de conhecimento.", clone: "Viseron Wiki — docs do core." },
      { name: "Slack", what: "Comunicação de equipa.", clone: "Viseron Chat — agente no Slack." },
      { name: "WhatsApp (WAHA/Baileys)", what: "Mensagens (base ASNO existe).", clone: "Viseron WhatsApp — atendimento autónomo." },
      { name: "Gmail/Outlook (IMAP/Graph)", what: "Email (base existe).", clone: "Viseron Mail — agente de inbox." },
      { name: "Zendesk", what: "Suporte ao cliente.", clone: "Viseron Support — atendimento multi-canal." },
      { name: "Webhooks universais", what: "Qualquer sistema dispara o TVS.", clone: "Viseron Hook — endpoint de eventos." },
    ],
  },
  {
    title: "Dados & Analytics",
    icon: "📊",
    items: [
      { name: "ClickHouse", what: "Analytics de alta velocidade.", clone: "Viseron Analytics — métricas de uso." },
      { name: "DuckDB", what: "Analytics embutido (excelente).", clone: "Viseron OLAP — análise local dos dados." },
      { name: "Timescale", what: "Séries temporais no Postgres.", clone: "Viseron Time — métricas temporais." },
      { name: "Metabase", what: "Dashboards de BI open-source.", clone: "Viseron BI — relatórios visuais." },
      { name: "Grafana", what: "Dashboards de monitorização.", clone: "Viseron Monitor — painel do sistema." },
      { name: "Prometheus", what: "Métricas pull em escala.", clone: "Viseron Metrics (já há /api/metrics)." },
      { name: "OpenTelemetry", what: "Tracing padrão.", clone: "Viseron Trace — rastreamento de agentes." },
      { name: "Apache Kafka", what: "Streaming de eventos.", clone: "Viseron Stream — fila de eventos dos agentes." },
      { name: "Postgres CDC", what: "Captura de mudanças em tempo real.", clone: "Viseron Sync — replicação automática." },
      { name: "MinIO/S3", what: "Armazenamento de objetos.", clone: "Viseron Storage — ficheiros dos agentes." },
    ],
  },
  {
    title: "Segurança & Identidade",
    icon: "🛡️",
    items: [
      { name: "Keycloak", what: "IAM open-source.", clone: "Viseron IAM — identidade própria (auth já feito)." },
      { name: "OAuth2/OIDC", what: "Login com Google/GitHub.", clone: "Viseron OAuth — social login." },
      { name: "SAML/SSO", what: "Acesso enterprise.", clone: "Viseron SSO — plano enterprise." },
      { name: "HashiCorp Vault", what: "Gestão de segredos.", clone: "Viseron Vault — .env cifrado." },
      { name: "mTLS", what: "Comunicação cifrada serviço-a-serviço.", clone: "Viseron TLS — rede interna segura." },
      { name: "Audit logs", what: "Registo de tudo o que acontece.", clone: "Viseron Audit — trilha de agentes." },
      { name: "RBAC granular", what: "Controlo de acessos por papel.", clone: "Viseron RBAC (roles owner/admin/member já existem)." },
      { name: "Rate limiting", what: "Proteção anti-abuso.", clone: "Viseron Shield (já há RateLimiter)." },
      { name: "LGPD/GDPR", what: "Privacidade e direito ao esquecimento.", clone: "Viseron Privacy — export/delete de dados." },
      { name: "2FA/TOTP", what: "Autenticação em duas etapas.", clone: "Viseron 2FA — TOTP nativo." },
    ],
  },
  {
    title: "Infra & Escala",
    icon: "🚀",
    items: [
      { name: "Docker", what: "Empacotamento universal.", clone: "Viseron Containers — Dockerfile oficial." },
      { name: "Kubernetes", what: "Orquestração de escala.", clone: "Viseron K8s — helm charts." },
      { name: "Terraform", what: "Infra como código.", clone: "Viseron Infra — IaC do projeto." },
      { name: "GitHub Actions", what: "CI/CD (já há workflow).", clone: "Viseron CI — pipeline próprio." },
      { name: "Vercel", what: "Hosting de front-end com edge.", clone: "Viseron Edge — site + API." },
      { name: "Render", what: "Hosting de back-end.", clone: "Viseron Cloud — API e dashboard." },
      { name: "Cloudflare Workers", what: "Serverless edge global.", clone: "Viseron Workers — funções à beira da rede." },
      { name: "Redis Cluster", what: "Cache/sessões distribuídas.", clone: "Viseron Cluster — STM partilhada." },
      { name: "k6 / load tests", what: "Testes de carga.", clone: "Viseron Load — benchmark de agentes." },
      { name: "Uptime monitors", what: "Monitorização de disponibilidade 24/7.", clone: "Viseron Uptime — health checks (já há /api/health)." },
    ],
  },
];

async function main() {
  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
  const outFile = path.resolve("data", "Viseron_100_Melhorias_Integracao.pdf");
  if (!fs.existsSync(path.dirname(outFile))) fs.mkdirSync(path.dirname(outFile), { recursive: true });
  doc.pipe(fs.createWriteStream(outFile));

  const W = doc.page.width;
  const PH = doc.page.height;
  const drawFooter = () => {
    doc.page.margins.bottom = 8;
    doc.fontSize(8).fillColor("#94a3b8").text(`TVS v5.0 · 100 melhorias · página ${doc.page.number}`, W - 50, PH - 28, { align: "right", width: W - 100 });
    doc.page.margins.bottom = 50;
  };

  // Capa
  doc.fillColor("#0f172a").rect(0, 0, W, PH).fill();
  doc.fillColor("#22d3ee").font("Helvetica-Bold").fontSize(11).text("TRINNITY VISERON SYSTEM · PLANO DE EXPANSÃO", W / 2, 170, { align: "center", width: W - 100 });
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(34).text("100 MELHORIAS E INTEGRAÇÕES DE IA", W / 2, 210, { align: "center", width: W - 100 });
  doc.fillColor("#94a3b8").font("Helvetica").fontSize(14).text("Para trazer para dentro da Viseron — como clones nossos, com autonomia total", W / 2, 280, { align: "center", width: W - 100 });
  doc.fillColor("#22d3ee").fontSize(12).text("www.trinnityviseronsystem.io", W / 2, 330, { align: "center", width: W - 100 });
  doc.addPage();
  drawFooter();

  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(16).text("100 itens em 10 categorias", 50, 60);
  doc.fillColor("#1e293b").font("Helvetica").fontSize(10).text("Cada integração é planeada como um módulo nativo do TVS (clone nosso com autonomia), não como dependência externa. Isto garante que não perdemos nada se o fornecedor mudar.", 50, 90, { width: W - 100 });
  doc.moveDown(2);

  for (const cat of CATS) {
    if (doc.y > PH - 120) { doc.addPage(); drawFooter(); }
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(14).text(`${cat.icon} ${cat.title}`, 50, doc.y + 8);
    doc.moveDown(0.4);
    let n = 0;
    for (const item of cat.items) {
      n++;
      if (doc.y > PH - 90) { doc.addPage(); drawFooter(); }
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10).text(`${n}. ${item.name}`, 50, doc.y + 2, { continued: true });
      doc.fillColor("#64748b").font("Helvetica").fontSize(9).text(`  ${item.what}`, { width: W - 100 });
      doc.fillColor("#0891b2").font("Helvetica").fontSize(8.5).text(`   → ${item.clone}`, 50, doc.y + 1, { width: W - 100 });
      doc.moveDown(0.5);
    }
    doc.moveDown(0.5);
  }

  doc.end();
  console.log(`✅ PDF gerado: ${outFile}`);
}

main().catch((e) => {
  console.error("Falha:", e.message);
  process.exit(1);
});
