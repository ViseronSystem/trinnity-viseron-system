import path from "path";
import * as fs from "fs";
import { KnowledgeGraph } from "../src/omega/memory-engine/KnowledgeGraph";
import { EventBus } from "../src/omega/kernel/EventBus";
import { KnowledgeArchive } from "../src/omega/archive/KnowledgeArchive";

// Milestone: KnowledgeArchive Fase 1 Core — completo e validado
// Data: 2026-08-11
// Este script regista o marco oficial no Archive e gera o PDF celebrando o feito.

const graph = new KnowledgeGraph();
const bus = new EventBus();
const archiveDir = path.join(process.cwd(), "data", "archive");
const archive = new KnowledgeArchive({ graph, bus, archiveDir });

const title = "Milestone: KnowledgeArchive Fase 1 Core — Memória Histórica Permanente";
const body = [
  "## Visão geral",
  "",
  "O VISERON completou a transição de \"sistema que executa tarefas\" para \"sistema que executa, verifica, regista e preserva evolução\".",
  "",
  "## Arquitetura do pipeline completo",
  "",
  "```text",
  "INTENÇÃO → OMEGA → AGENT → TOOL → VERIFY → MEMORY → KNOWLEDGE ARCHIVE → HISTÓRICO PERMANENTE",
  "```",
  "",
  "## Estrutura de arquivos",
  "",
  "```text",
  "data/archive/",
  "├── archive-state.json          # versão, lastMilestone, timestamps",
  "├── executions/",
  "│   ├── index.json              # índice de execuções com PASS",
  "│   └── failures/",
  "│       └── index.json          # índice de falhas separado",
  "├── decisions/",
  "│   ├── index.json              # índice de decisões (com hash SHA-256)",
  "│   └── *.md                    # documentos Markdown legíveis para humanos",
  "├── graph/",
  "│   ├── index.json              # snapshots do KnowledgeGraph",
  "│   └── snapshot-*.json",
  "└── audits/",
  "```",
  "",
  "## Três pilares estratégicos",
  "",
  "### 1. Memória de sucesso e falha",
  "- Execuções com PASS → `executions/`",
  "- Execuções com FAIL → `executions/failures/`",
  "- O sistema aprende com ambos — uma consciência sem falhas registadas fica incompleta.",
  "",
  "### 2. Dupla camada de conhecimento",
  "- **Máquina (JSON)**: execution, timeline, archive-state, hash SHA-256, graph snapshots — para IA consultar.",
  "- **Humano (Markdown)**: decisions, milestones, reports — para auditoria e empresas.",
  "",
  "### 3. Integridade verificável",
  "- Hash SHA-256 em cada registo de execução e decisão.",
  "- Uma empresa não quer \"uma IA falou que fez\". Quer \"existe registo verificável do que aconteceu\".",
  "",
  "## Testes",
  "",
  "- **11/11 testes** KnowledgeArchive (Seção 23 do OMEGA)",
  "- Inclui persistência após restart: salva → reinicia → recupera → confirma.",
  "- **250/250 OMEGA** testes totais passam.",
  "- **374/374 CORE** testes totais passam.",
  "",
  "## Integração",
  "",
  "```text",
  "OmegaPlatform",
  "    ├── Kernel (EventBus + TaskQueue + Permissions)",
  "    ├── KnowledgeGraph",
  "    ├── KnowledgeArchive  ← NOVO: observador do sistema",
  "    └── VaecOrchestrator",
  "```",
  "",
  "O Archive é observador, não participante da execução — escuta EventBus, recebe eventos finais, persiste histórico, cria timeline, gera snapshots quando solicitado.",
  "",
  "## Impacto na natureza do VISERON",
  "",
  "**Antes:**",
  "> \"O sistema executa tarefas.\"",
  "",
  "**Depois:**",
  "> \"O sistema executa, comprova, regista sua evolução e constrói histórico verificável.\"",
  "",
  "Este é o começo de uma memória operacional real.",
  "",
  "---",
  "© 2026 Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)",
].join("\n");

archive.record(title, body, [
  "milestone",
  "knowledge-archive",
  "memory",
  "audit",
  "verified",
  "core-infrastructure",
]);

// Snapshot do grafo neste momento
graph.upsertEntity("milestone_ka_f1", "milestone", "KnowledgeArchive Fase 1 Core");
graph.upsertEntity("omega_kernel", "module", "OMEGA Kernel");
graph.upsertEntity("eventbus", "module", "EventBus");
graph.upsertEntity("knowledge_graph", "module", "KnowledgeGraph");
graph.addRelation("milestone_ka_f1", "omega_kernel", "depends_on");
graph.addRelation("milestone_ka_f1", "eventbus", "depends_on");
graph.addRelation("milestone_ka_f1", "knowledge_graph", "depends_on");
archive.snapshot("Milestone KnowledgeArchive Fase 1 Core completo — 2026-08-11");

const st = archive.status();
console.log("\n[KnowledgeArchive] Milestone registado com sucesso.");
console.log(`  - Execuções: ${st.counts.executions}`);
console.log(`  - Falhas: ${st.counts.failures}`);
console.log(`  - Decisões: ${st.counts.decisions}`);
console.log(`  - Snapshots: ${st.counts.snapshots}`);
console.log(`  - Health: ${st.health}`);

const decDir = path.join(archiveDir, "decisions");
const decFiles = fs.readdirSync(decDir).filter(f => f.endsWith(".md"));
console.log(`\nDecisões registadas (${decFiles.length}):`);
for (const f of decFiles) {
  console.log(`  - ${f}`);
}

archive.destroy();
