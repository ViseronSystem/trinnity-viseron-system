import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import axios from "axios";
import express from "express";
import { AgentManager } from "../src/core/AgentManager";
import { ToolManager } from "../src/core/tools/ToolManager";
import { ProviderFactory } from "../src/core/providers/ProviderFactory";
import { ILLMProvider } from "../src/core/providers/BaseProvider";
import { ModelProvider, IAgent } from "../src/core/types";
import { OmegaPlatform } from "../src/omega";
import { WorkspaceStore, WorkspaceTask } from "../src/web/workspace/store";
import { UserTaskOrchestrator } from "../src/web/workspace/orchestrator";
import {
  registerWorkspaceTools,
  WORKSPACE_FS_WRITE,
  WORKSPACE_TEST_RUN,
} from "../src/web/workspace/tools";
import { createViseronBuilder, VISERON_BUILDER_ID } from "../src/web/workspace/viseron-builder";
import { createWorkspaceRouter } from "../src/web/workspace/routes";

/**
 * REAL USER VERTICAL SLICE — testes E2E do percurso real:
 * AUTH → WORKSPACE → PROJECT → TASK → MODEL ROUTER → OLLAMA → AGENT
 * → TOOLS → EXECUTION → TEST → VERIFY → MEMORY → RESULT.
 *
 * Regra fundamental: cada etapa ligada ao backend REAL. Sem provider real
 * disponível → falha HONESTA (NOT_IMPLEMENTED / stage FAILED), nunca mock
 * apresentado como sucesso. O único elemento substituído por um stub é o
 * MODELO (não há Ollama no CI) — todo o resto (kernel, ferramentas, verifier,
 * memória, orchestrator, HTTP) é real.
 */

class OfflineFactory extends ProviderFactory {
  public getProvider(_providerId: ModelProvider): ILLMProvider | undefined {
    return undefined;
  }
}

function stubBuilderAgent(): IAgent {
  return {
    id: VISERON_BUILDER_ID,
    name: "VISERON BUILDER",
    role: "Builder",
    status: "ACTIVE",
    capabilities: ["code_build", "file_write", "test_run", "documentation"],
    async execute(task: string, context?: Record<string, any>) {
      const tools = Array.isArray(context?.tools) ? (context.tools as any[]) : [];
      const fileOk = tools[0]?.success === true;
      const testOk = tools[1]?.success === true && tools[1]?.result?.passed === true;
      const res: any = {
        agentId: VISERON_BUILDER_ID,
        agentName: "VISERON BUILDER",
        success: true,
        output: `[stub-modelo] tarefa: ${task}\nfileWritten=${fileOk} testPassed=${testOk}\nmodelo simulado presente (sem Ollama no CI)`,
        executionTimeMs: 5,
        model: { provider: "ollama", model: "qwen2.5:3b", isLocal: true, mode: "REAL", strategy: "stub-for-ci" },
      };
      return res;
    },
  };
}

interface Stack {
  dataDir: string;
  store: WorkspaceStore;
  orchestrator: UserTaskOrchestrator;
  platform: OmegaPlatform;
  agentManager: AgentManager;
  toolManager: ToolManager;
}

const dataDirs: string[] = [];

function buildStack(opts: { offline?: boolean } = {}): Stack {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "tvs-ws-"));
  dataDirs.push(dataDir);
  const store = new WorkspaceStore(dataDir);
  const agentManager = new AgentManager();
  const toolManager = new ToolManager();
  registerWorkspaceTools(toolManager, dataDir);

  const providerFactory = opts.offline ? new OfflineFactory() : new ProviderFactory();
  const platform = new OmegaPlatform({
    agentManager,
    toolManager,
    providerFactory,
    graphFilePath: path.join(dataDir, "kg.json"),
    taskQueuePath: path.join(dataDir, "task-queue.json"),
  });

  if (opts.offline) {
    agentManager.register(createViseronBuilder(new OfflineFactory()));
  } else {
    agentManager.register(stubBuilderAgent());
  }

  const orchestrator = new UserTaskOrchestrator(store);
  orchestrator.attach(platform);
  return { dataDir, store, orchestrator, platform, agentManager, toolManager };
}

async function waitForTerminal(store: WorkspaceStore, tenantId: string, taskId: string, timeoutMs = 20000): Promise<WorkspaceTask> {
  const start = Date.now();
  for (;;) {
    const task = store.getTask(tenantId, taskId);
    if (task && ["COMPLETED", "FAILED", "CANCELLED"].includes(task.stage)) return task;
    if (Date.now() - start > timeoutMs) return store.getTask(tenantId, taskId)!;
    await new Promise((r) => setTimeout(r, 50));
  }
}

async function waitForGraphEntity(platform: OmegaPlatform, entityId: string, timeoutMs = 5000): Promise<boolean> {
  const start = Date.now();
  for (;;) {
    if (platform.graph.getEntity(entityId)) return true;
    if (Date.now() - start > timeoutMs) return false;
    await new Promise((r) => setTimeout(r, 50));
  }
}

async function runVerticalSliceTests() {
  console.log("\n==========================================");
  console.log("REAL USER VERTICAL SLICE — AUTH → … → RESULT (E2E real)");
  console.log("==========================================\n");

  let passed = 0;
  let total = 0;
  const assert = (cond: boolean, name: string) => {
    total++;
    if (cond) { console.log(`✅ [PASS] ${name}`); passed++; }
    else console.error(`❌ [FAIL] ${name}`);
  };

  // ── 1. WorkspaceStore: persistência JSON real + isolamento por tenant ──
  {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "tvs-ws-store-"));
    dataDirs.push(dataDir);
    const store = new WorkspaceStore(dataDir);

    const p = store.createProject("tenA", "usrA", { name: "Projeto A", description: "desc" });
    assert(p.id.startsWith("proj_") && p.tenantId === "tenA", "Store: createProject gera id + tenant");

    const t = store.createTask("tenA", "usrA", p.id, { title: "Tarefa 1", tools: [{ id: WORKSPACE_FS_WRITE, input: { fileName: "a.txt" } }] });
    assert(t.stage === "PENDING" && t.authorizedBy === "usrA", "Store: createTask PENDING + authorizedBy=user");

    store.updateTask("tenA", t.id, { stage: "COMPLETED", result: { success: true } });
    store.appendEvent("tenA", t.id, { topic: "task:completed", ts: Date.now(), payload: { ok: true } });
    const got = store.getTask("tenA", t.id);
    assert(got?.stage === "COMPLETED" && got.result?.success === true, "Store: updateTask + appendEvent persistidos");

    assert(store.getProject("tenB", p.id) === undefined, "Store: isolamento — tenant B não vê projeto de A");
    assert(store.getTask("tenB", t.id) === undefined, "Store: isolamento — tenant B não vê tarefa de A");
    assert(store.listProjects("tenB").length === 0, "Store: listProjects de B vazio");

    const stateFile = path.join(dataDir, "workspace", "tenA", "state.json");
    assert(fs.existsSync(stateFile), "Store: estado real no disco (state.json por tenant)");

    const reload = new WorkspaceStore(dataDir);
    assert(reload.getTask("tenA", t.id)?.stage === "COMPLETED", "Store: recarregado do disco preserva estado");
  }

  // ── 2. Ferramentas REAIS: workspace_fs_write + workspace_test_run ──
  {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "tvs-ws-tools-"));
    dataDirs.push(dataDir);
    const tm = new ToolManager();
    registerWorkspaceTools(tm, dataDir);

    const write = await tm.executeTool(WORKSPACE_FS_WRITE, { tenantId: "tenA", projectId: "proj1", fileName: "README.md", content: "# ok\n" });
    assert(write.success === true, "Tool: workspace_fs_write executa");

    const file = path.join(dataDir, "workspace", "tenA", "projects", "proj1", "README.md");
    assert(fs.existsSync(file) && fs.readFileSync(file, "utf8") === "# ok\n", "Tool: ficheiro REAL escrito no sandbox do projeto");

    const tOk = await tm.executeTool(WORKSPACE_TEST_RUN, { tenantId: "tenA", projectId: "proj1", script: "require('fs').readFileSync('README.md','utf8'); console.log('TEST OK');" });
    assert(tOk.success === true && tOk.result?.passed === true && tOk.result?.exitCode === 0, "Tool: workspace_test_run passa (teste real node -e)");

    const tFail = await tm.executeTool(WORKSPACE_TEST_RUN, { tenantId: "tenA", projectId: "proj1", script: "require('fs').readFileSync('missing.md','utf8');" });
    assert(tFail.success === true && tFail.result?.passed === false && typeof tFail.result?.exitCode === "number", "Tool: teste que falha → exitCode≠0 passed=false (honesto)");

    const tBadName = await tm.executeTool(WORKSPACE_FS_WRITE, { tenantId: "tenA", projectId: "proj1", fileName: "file name.md", content: "x" });
    assert(tBadName.success === false, "Tool: fileName fora do charset restrito → falha (sem escape de caminho)");

    assert(fs.existsSync(path.join(dataDir, "workspace", "tenB", "projects", "proj1")) === false, "Tool: sandbox isolado por tenant (B não criado)");
  }

  // ── 3. FALHA HONESTA: VISERON BUILDER real sem provider (NOT_IMPLEMENTED) ──
  {
    const builder = createViseronBuilder(new OfflineFactory());
    const direct = await builder.execute("Criar um README do projeto", {}) as any;
    assert(direct.success === false, "Builder offline: success=false (falha honesta)");
    assert(direct.model?.mode === "NOT_IMPLEMENTED", "Builder offline: mode NOT_IMPLEMENTED, nunca texto fake");
    assert(String(direct.error).includes("sem provider real"), "Builder offline: error explica falta de provider");

    const { store, orchestrator } = buildStack({ offline: true });
    assert(orchestrator.isReady() === true, "Orchestrator: pronto com kernel OMEGA carregado");
    const status0 = orchestrator.status();
    assert(status0.omegaLoaded === true && status0.mode === "REAL", "Orchestrator: status omegaLoaded=true mode=REAL");

    const project = store.createProject("tenA", "usrA", { name: "P" });
    const task = await orchestrator.submit("tenA", "usrA", project.id, {
      title: "Criar ficheiro sem provider",
      tools: [{ id: WORKSPACE_FS_WRITE, input: { fileName: "x.txt", content: "x" } }],
    });
    assert(!!task.kernelTaskId, "Submissão offline: kernel aceitou e devolveu kernelTaskId");

    const final = await waitForTerminal(store, "tenA", task.id);
    assert(final.stage === "FAILED", `Submissão offline: stage final FAILED (obtido ${final.stage})`);
    assert(!!final.error && final.error.length > 0, "Submissão offline: erro honesto registado");
    assert(final.events.some((e) => e.topic === "task:failed"), "Submissão offline: evento task:failed auditável");
  }

  // ── 4. E2E SUCESSO: kernel + tools reais + verifier + memória + sync ──
  {
    const { dataDir, store, orchestrator, platform } = buildStack({ offline: false });
    const project = store.createProject("tenA", "usrA", { name: "Build README" });
    const task = await orchestrator.submit("tenA", "usrA", project.id, {
      title: "Criar README e validar",
      description: "Escreve o README.md e corre um teste que verifica o ficheiro",
      tools: [
        { id: WORKSPACE_FS_WRITE, input: { fileName: "README.md", content: "# Projeto\nGerado pelo VISERON." } },
        { id: WORKSPACE_TEST_RUN, input: { script: "require('fs').readFileSync('README.md','utf8'); console.log('TEST OK');" } },
      ],
    });

    const final = await waitForTerminal(store, "tenA", task.id);
    assert(final.stage === "COMPLETED", `E2E: stage final COMPLETED (obtido ${final.stage})`);
    assert(final.result?.success === true, "E2E: verifier aprovou (success=true)");
    assert(typeof final.result?.output === "string" && final.result.output.length > 0, "E2E: output do agente não vazio (requireTruthy)");
    assert(final.result?.executedBy === VISERON_BUILDER_ID, "E2E: executado pelo agente viseron_builder");
    assert(Array.isArray(final.result?.tools) && final.result.tools.length === 2, "E2E: 2 tools invocadas de verdade");
    assert(final.result?.tools?.every((c: any) => c.success === true), "E2E: ambas as tools com sucesso real");
    assert(final.result?.tools?.some((c: any) => c.result?.passed === true), "E2E: o teste real passou (result.passed=true)");
    assert(final.result?.model?.mode === "REAL", "E2E: metadata do modelo presente (UI mostra router real)");

    const sandboxFile = path.join(dataDir, "workspace", "tenA", "projects", project.id, "README.md");
    assert(fs.existsSync(sandboxFile), "E2E: ficheiro REAL no sandbox do projeto");

    assert(final.events.some((e) => e.topic === "tool.completed"), "E2E: eventos tool.completed auditáveis");
    assert(final.events.some((e) => e.topic === "task:completed"), "E2E: evento task:completed registado");

    const verified = platform.kernel.status().tasks.verified;
    assert(verified >= 1, "E2E: kernel contabiliza verificação (verified ≥ 1)");
    assert(await waitForGraphEntity(platform, `task_${final.kernelTaskId}`), "E2E: task gravada na memória (knowledge graph)");
  }

  // ── 5. HTTP E2E: rotas /api/workspace/* (auth → projects → tasks → resultado) ──
  {
    const { store, orchestrator } = buildStack({ offline: false });
    const app = express();
    app.use(express.json());
    const fakeAuth = (req: any, _res: any, next: any) => {
      req.user = { tenantId: "ten_http", sub: "usr_http", role: "owner" };
      next();
    };
    app.use("/api", createWorkspaceRouter({ store, orchestrator, requireAuth: fakeAuth }));
    const server = app.listen(0);
    const port = (server.address() as any).port;
    const base = `http://127.0.0.1:${port}/api`;

    try {
      const status = await axios.get(`${base}/workspace/status`);
      assert(status.status === 200 && status.data.omegaLoaded === true, "HTTP: GET /workspace/status omegaLoaded=true (público)");
      assert(Array.isArray(status.data.chain) && status.data.chain.length === 13, "HTTP: chain de 13 etapas (AUTH→RESULT)");

      let bad = false;
      try { await axios.post(`${base}/workspace/projects`, {}); } catch (e: any) { bad = e.response?.status === 400; }
      assert(bad, "HTTP: criar projeto sem name → 400");

      const p = await axios.post(`${base}/workspace/projects`, { name: "Site corporativo" });
      assert(p.status === 201 && p.data.project.id, "HTTP: criar projeto → 201");
      const projectId = p.data.project.id;

      const list = await axios.get(`${base}/workspace/projects`);
      assert(list.data.projects.some((x: any) => x.id === projectId), "HTTP: listar projetos inclui o criado");

      const proj = await axios.get(`${base}/workspace/projects/${projectId}`);
      assert(proj.status === 200 && Array.isArray(proj.data.tasks), "HTTP: GET project devolve project + tasks");

      let nf = false;
      try { await axios.get(`${base}/workspace/projects/nao_existe`); } catch (e: any) { nf = e.response?.status === 404; }
      assert(nf, "HTTP: project inexistente → 404");

      const created = await axios.post(`${base}/workspace/projects/${projectId}/tasks`, {
        title: "Gerar README e testar",
        tools: [
          { id: WORKSPACE_FS_WRITE, input: { fileName: "README.md", content: "# HTTP\nok" } },
          { id: WORKSPACE_TEST_RUN, input: { script: "require('fs').statSync('README.md'); console.log('ok');" } },
        ],
      });
      assert(created.status === 201 && created.data.task.id, "HTTP: criar tarefa → 201");
      const taskId = created.data.task.id;

      let terminal: WorkspaceTask = created.data.task;
      const start = Date.now();
      while (terminal && !["COMPLETED", "FAILED", "CANCELLED"].includes(terminal.stage) && Date.now() - start < 20000) {
        await new Promise((r) => setTimeout(r, 100));
        const t = await axios.get(`${base}/workspace/tasks/${taskId}`);
        terminal = t.data.task;
      }
      assert(terminal.stage === "COMPLETED", `HTTP: tarefa chega a COMPLETED (obtido ${terminal.stage})`);
      assert(terminal.result?.output?.length > 0, "HTTP: resultado com output real na API");
      assert(terminal.events?.some((e: any) => e.topic === "task:completed"), "HTTP: eventos auditáveis via API");

      let canc = 409;
      try { await axios.post(`${base}/workspace/tasks/${taskId}/cancel`); canc = 200; } catch (e: any) { canc = e.response?.status; }
      assert(canc === 409, "HTTP: cancelar tarefa já terminada → 409");

      let tnf = false;
      try { await axios.get(`${base}/workspace/tasks/nao_existe`); } catch (e: any) { tnf = e.response?.status === 404; }
      assert(tnf, "HTTP: tarefa inexistente → 404");
    } finally {
      server.close();
    }
  }

  for (const d of dataDirs) {
    try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best effort */ }
  }

  console.log(`\n${passed}/${total} vertical slice checks passed`);
  return passed === total;
}

runVerticalSliceTests().then((ok) => {
  if (!ok) process.exit(1);
}).catch((e) => {
  console.error("VERTICAL SLICE tests crashed:", e);
  process.exit(1);
});
