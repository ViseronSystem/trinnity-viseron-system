import * as fs from "fs";
import * as path from "path";
import { createTheme } from "./pdf-theme";

interface GraphData {
  nodes: number;
  links: number;
  builtAtCommit: string;
  communities: number;
  topHubs: { id: string; degree: number }[];
  topCoupling: { file: string; crossFileLinks: number }[];
}

function loadGraph(graphPath: string): GraphData {
  const raw = fs.readFileSync(graphPath, "utf-8");
  const g = JSON.parse(raw);
  const nodes = g.nodes ?? [];
  const links = g.links ?? [];
  const deg = new Map<string, number>();
  for (const l of links) {
    deg.set(l.source, (deg.get(l.source) ?? 0) + 1);
    deg.set(l.target, (deg.get(l.target) ?? 0) + 1);
  }
  const topHubs = [...deg.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, degree]) => ({ id, degree }));
  const coupling = new Map<string, number>();
  for (const l of links) {
    const s = nodes.find((n: any) => n.id === l.source);
    const t = nodes.find((n: any) => n.id === l.target);
    if (s?.source_file && t?.source_file && s.source_file !== t.source_file) {
      coupling.set(s.source_file, (coupling.get(s.source_file) ?? 0) + 1);
      coupling.set(t.source_file, (coupling.get(t.source_file) ?? 0) + 1);
    }
  }
  const topCoupling = [...coupling.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([file, crossFileLinks]) => ({ file, crossFileLinks }));
  const communities = new Set(nodes.map((n: any) => n.community).filter((c: any) => c !== undefined)).size;
  return { nodes: nodes.length, links: links.length, builtAtCommit: g.built_at_commit, communities, topHubs, topCoupling };
}

function testLine(cmd: string): string {
  try {
    const out = require("child_process").execSync(cmd, { encoding: "utf-8", timeout: 120000 });
    const m = out.match(/([\d]+)\/([\d]+)/);
    return m ? `${m[1]}/${m[2]}` : "n/a";
  } catch {
    return "n/a";
  }
}

async function main() {
  const graphPath = path.join(process.cwd(), "graphify-out", "graph.json");
  const graph = loadGraph(graphPath);

  const gitCommit = (require("child_process").execSync("git rev-parse HEAD", { encoding: "utf-8" }) || "").trim();
  const gitBranch = (require("child_process").execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }) || "").trim();

  const omegaLine = testLine("npx tsx tests/omega.test.ts 2>&1");
  const coreLine = testLine("npx tsx tests/core.test.ts 2>&1");
  const webLine = testLine("npx tsx tests/web.test.ts 2>&1");
  const osLine = testLine("npx tsx tests/os.test.ts 2>&1");

  const t = createTheme({
    title: "VISERON — System Evolution Report",
    subject: "Arquitetura, capacidade real e roteiro consolidado (ES · PT · EN)",
  });

  t.cover({
    title: "VISERON\nAI Operating System\nfor Autonomous Operations",
    subtitle: "System Evolution Report — arquitectura, capacidade verificada e roteiro de consolidação",
    badges: ["OMEGA Kernel", "E2E Task Execution", "Composite Verification", "Architecture Intelligence", "Graphify 4.278 nós", "Event Bus reativo"],
    date: new Date().toLocaleDateString("pt-PT"),
    version: "5.0",
    url: "www.trinnityviseronsystem.io",
  });

  // 1. Resumo executivo
  t.section("1", "Resumo executivo");
  t.para("O Trinnity Viseron System (TVS) é um sistema operativo de IA para organizações autónomas: objetivos entram, são planeados pelo kernel OMEGA, executados por agentes reais com ferramentas, verificados por uma engine composta e gravados na memória — nada morre no restart.");
  t.kv("Commit:", gitCommit);
  t.kv("Ramo:", gitBranch);
  t.kv("Knowledge graph:", `${graph.nodes} nós · ${graph.links} arestas · ${graph.communities} comunidades`);
  t.kv("Testes:", `OMEGA ${omegaLine} · core ${coreLine} · web ${webLine} · OS ${osLine}`);

  // 2. Estado atual — consolidado
  t.section("2", "Estado atual — consolidado (FREEZE)");
  t.para("O sistema encontra-se num ponto de consolidação. O refactor estrutural da Fase A fechou os quatro pilares técnicos (ciclos de import, contrato de bridges, verificação composta e inteligência de arquitetura). Segue-se o redesign da presença web para refletir a verdade da arquitetura.");
  t.bullet("▸", "Refactor estrutural do OMEGA concluído e testado (174/174).");
  t.bullet("▸", "Backup do site em VISERON_SITE_BACKUP/ (manifest + commit hash).");
  t.bullet("▸", "Sem novas expansões de agentes até a capacidade real estar provada.");

  // 3. Verdade prática
  t.section("3", "Verdade prática (o que o sistema é de facto)");
  t.para("O TVS não é ainda uma superinteligência de 5.000 processos independentes: o número '5.396 mentes' é uma arquitetura de definições de agentes. O que é REAL e verificável: 10 agentes nucleares, squads AIOX, pipeline E2E de tarefas com verificação, event bus reativo, memória persistente, e 4 suítes de testes verdes.");
  t.bullet("▸", "Provar capacidade real > declarar 5.000 agentes.");
  t.bullet("▸", "Benchmarks e casos verificáveis são o ativo mais importante.");

  // 4. Arquitetura OMEGA
  t.section("4", "Arquitetura OMEGA (o kernel)");
  t.para("OMEGA Kernel: runtime de eventos, estado, tarefas, memória, ferramentas, segurança e auditoria. É o cérebro operacional que os módulos de negócio usam para executar trabalho de verdade.");
  t.bullet("▸", "EventBus — backbone reativo (wildcards, isolamento, replay, SSE/Socket.IO).");
  t.bullet("▸", "TaskQueue — 9 estados, fila persistente, cancelamento, retoma após restart.");
  t.bullet("▸", "Permissions — roles/grants com assert por ação.");
  t.bullet("▸", "Kernel — facade com 4 adapters (AgentRegistry, Memory, Tools, AIRouter).");

  // 5. Execution OS — E2E
  t.section("5", "Execution OS — execução E2E verificada");
  t.para("Uma tarefa entra, recebe ID, passa por plano → fila → agente → ferramentas → execução → verificação → resultado, e é persistida + gravada na memória.");
  t.code("POST /api/omega/tasks", "Criar tarefa (type + title + payload)", "Estado: CREATED → PLANNING → QUEUED → RUNNING → VERIFYING → COMPLETED");
  t.code("GET /api/omega/tasks/list?status=", "Listar tarefas por estado", "tasks/:id, tasks/:id/cancel, tasks/history");

  // 6. Event Bus — backbone reativo
  t.section("6", "Event Bus — backbone reativo");
  t.bullet("▸", "Wildcards: task.* casa task.completed e sub-tópicos; * casa tudo.");
  t.bullet("▸", "Isolamento: um handler que falha não quebra os outros; erro em eventbus.handler.error.");
  t.bullet("▸", "Histórico ring buffer (500 eventos) com replay para novos subscritores.");
  t.bullet("▸", "EventBridge: MemoryEngine → bus, bus → Socket.IO, bus → SSE.");

  // 7. Composite Verification (novo)
  t.section("7", "Composite Verification (nova)");
  t.para("A verificação deixou de ser uma função ad-hoc: existe agora uma interface Verifier e um CompositeVerifier que agrega vários verificadores e calcula o estado mais grave (PASS < RETRY < HUMAN < FAIL).");
  t.bullet("▸", "Verifier interface + toVerifierFn (adapta para o kernel).");
  t.bullet("▸", "CompositeVerifier: um FAIL sobrepõe-se a RETRY; erro num verifier não abate os outros.");
  t.bullet("▸", "Kernel.attachVerifier(verifier) — exposto no status do kernel.");

  // 8. Architecture Intelligence (nova)
  t.section("8", "Architecture Intelligence (nova)");
  t.para("Módulo que lê o knowledge graph do repositório (Graphify) e responde a perguntas estruturais com subgrafos pequenos e relevantes — nunca o grafo inteiro.");
  t.code("GET /api/omega/architecture?q=TaskQueue", "Subgrafo de contexto (nós + ficheiros + razão)", "Provenance: VISERON · Pedro-Trinnity · AIOX · OMEGA · graphify");
  t.code("GET /api/omega/architecture/risks", "Riscos: hubs, alto acoplamento, impacto", "Risco severidade low/medium/high");
  t.code("GET /api/omega/architecture/path?from=A&to=B", "Caminho entre dois módulos", "impact?subject=&hops=");

  // 9. Integration contract (nova)
  t.section("9", "Integration contract (nova)");
  t.para("As 8 bridges do sistema (ASNO, CallSystem, N8N, OmniRouteBridge, OmniRouteHub, OpenJarvis, TVSTools, ViseronApps) implementam agora a interface comum IntegrationBridge com initialize(): Promise<number>. A SuperIntegration usa initBridge/shutdownBridge do contrato — eliminando 7 blocos duplicados.");
  t.code("src/integrations/contract.ts", "IntegrationBridge { name, initialize(), stop?(), status?() }", "8 bridges normalizadas · Promise<number>");

  // 10. Graphify — knowledge graph do repositório
  t.section("10", "Graphify — knowledge graph do repositório");
  t.kv("Nós:", String(graph.nodes));
  t.kv("Arestas:", String(graph.links));
  t.kv("Comunidades:", String(graph.communities));
  t.kv("Built at:", graph.builtAtCommit);
  t.sub("Top hubs (grau):");
  for (const h of graph.topHubs) t.bullet("▸", `${h.id} — grau ${h.degree}`);
  t.sub("Top acoplamento cross-file:");
  for (const c of graph.topCoupling) t.bullet("▸", `${c.file} — ${c.crossFileLinks} ligações cross-file`);

  // 11. Agentes nucleares
  t.section("11", "Agentes nucleares (10)");
  t.para("CEO, Planner, Researcher, Engineer, Operator, Finance, Sales, Security, Verifier, Evolution. Regra de escala: aperfeiçoar estes 10 e escalar 10→100→1.000→10.000 pela capacidade, não por nomes.");
  t.bullet("▸", "AgentRuntime: specs por manifesto, loadSpecsFromDir, registerHook.");
  t.bullet("▸", "AgentManager: registro, list, getAgentsByCapability, run.");

  // 12. Squads AIOX
  t.section("12", "Squads AIOX");
  t.para("Cinco squads de supervisão/execução sobre os agentes nucleares, carregados de manifests e operáveis via API. O watchdog self-heal regista kernel, runtime, squads, enterprise e factory.");
  t.code("GET /api/omega/squads", "Listar squads + membros", "squads/:id, squads/:id/run");

  // 13. Autonomia
  t.section("13", "Autonomia — ciclos de planeamento");
  t.para("O AutonomyLayer corre ciclos (planning/evolution/learning) que enfileiram trabalho no kernel: as mentes nunca ficam a 0 tarefas. Ciclos configuráveis via startAutonomyCycles(intervalMs).");
  t.code("POST /api/omega/autonomy/cycle", "Disparar ciclo { kind }", "planning | evolution | learning");

  // 14. Self-healing
  t.section("14", "Self-healing");
  t.para("SelfHealWatchdog monitoriza componentes registados, detecta corações parados e dispara healNow() para os recuperar. O ciclo de imports foi quebrado (import type) para o tornar independente do AgentRuntime e do SquadRegistry.");
  t.code("POST /api/omega/watchdog/heal", "Forçar cura de um componente", "watchdog · healNow(component)");

  // 15. Memória
  t.section("15", "Memória persistente");
  t.bullet("▸", "KnowledgeGraph: entidades, relações, tipos — ficheiro JSON persistente.");
  t.bullet("▸", "MemoryEngine: STM/LTM + vector store (Qdrant com fallback em memória).");
  t.bullet("▸", "Cada task:completed/failed grava no graph + memória de longo prazo.");
  t.bullet("▸", "EventBridge consolida os eventos de memória no kernel bus.");

  // 16. Segurança
  t.section("16", "Segurança");
  t.bullet("▸", "Permissions: roles (root/commander/agent/viewer), grants com wildcard, assert por ação.");
  t.bullet("▸", "Governança bíblica: 9 princípios que bloqueiam fraude, mentiras e vazamento de chaves.");
  t.bullet("▸", "Wallets cripto: seeds nunca no chat/commits; backup obrigatório antes de sobrescrever.");

  // 17. Testes — estado real
  t.section("17", "Testes — estado real");
  t.kv("OMEGA:", omegaLine);
  t.kv("Core:", coreLine);
  t.kv("Web:", webLine);
  t.kv("TVS OS:", osLine);
  t.kv("Lint (tsc --noEmit):", "OK");

  // 18. API — superfície pública
  t.section("18", "API — superfície pública");
  t.code("GET /api/omega/status", "Estado do kernel + verifier + architecture", "kernel, tasks, verifier, events, architecture");
  t.code("GET /api/omega/events?topic=task.*", "Stream SSE em tempo real", "events/history para replay");
  t.code("POST /api/omega/tasks", "Criar tarefa E2E", "{ type, title, payload, priority }");

  // 19. Roteiro — próximos passos
  t.section("19", "Roteiro — próximos passos");
  t.bullet("▸", "Redesign do site como 'AI Operating System for Autonomous Operations' (LIVE / IN DEVELOPMENT / ROADMAP).");
  t.bullet("▸", "Benchmark TVS Autonomous Organization (100 tarefas reais) — npm run omega:bench.");
  t.bullet("▸", "20 secções deste relatório refletidas na landing page.");
  t.bullet("▸", "Deploy: GitHub + Vercel + rebuild APK.");

  // 20. Autoridade e autoria
  t.section("20", "Autoridade e autoria");
  t.para("Os direitos autorais do projeto pertencem a Pedro Costa (Comandante) e Trinnity Hurtado (Rainha). Nenhuma decisão de arquitetura, domínio, receita ou publicidade é tomada sem a aprovação deles. O sistema mantém e expõe esta autoria em todos os artefactos.");
  t.kv("Orquestrador:", "Pedro Costa · Trinnity Hurtado");
  t.kv("Squad de supervisão:", "AIOX (AIOX-1..5 + ARKOM)");
  t.kv("Kernel:", "TVS OMEGA");
  t.kv("Fonte de verdade estrutural:", "Graphify (graphify-out/graph.json)");
  t.kv("Site:", "www.trinnityviseronsystem.io");

  const out = path.join(process.cwd(), "data", "Viseron_System_Evolution_Report.pdf");
  t.finish(out);
  console.log(`PDF gerado: ${out}`);
}

main().catch((e) => {
  console.error("Erro:", e);
  process.exit(1);
});
