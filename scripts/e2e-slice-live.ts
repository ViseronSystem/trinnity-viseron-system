/**
 * REAL E2E do vertical slice contra o servidor LIVE (porta 32123) com Ollama real.
 * Isolado: regista um utilizador/tenant NOVO, cria projeto, submete tarefa com
 * as 2 ferramentas e aguarda o resultado REAL do modelo qwen2.5:3b.
 * Não toca em dados existentes — tenant novo a cada corrida.
 */
const BASE = "http://127.0.0.1:32123/api";

async function j(path: string, opts: any = {}, token?: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data };
}

(async () => {
  const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const email = `slice_${suffix}@tvs.local`;
  const orgName = `SliceOrg_${suffix}`;

  // 1. AUTH — registo real (tenant isolado novo)
  const reg = await j("/auth/register", { method: "POST", body: { org: orgName, name: "Slice User", email, password: "SlicePass123!" } });
  if (reg.status !== 201 && reg.status !== 200) { console.error("REGISTER FAIL", reg.status, JSON.stringify(reg.data)); process.exit(1); }
  const token = reg.data.token;
  const tenantId = reg.data.user?.tenantId || reg.data.tenantId;
  console.log(`AUTH OK  tenant=${tenantId}  email=${email}`);

  // 2. PROJECT
  const proj = await j("/workspace/projects", { method: "POST", body: { name: `Projeto Slice ${suffix}`, description: "E2E real Ollama" } }, token);
  if (proj.status !== 201) { console.error("PROJECT FAIL", proj.status, JSON.stringify(proj.data)); process.exit(1); }
  const projectId = proj.data.project.id;
  console.log(`PROJECT OK  id=${projectId}`);

  // 3. TASK com as 2 ferramentas obrigatórias (hints)
  const taskRes = await j(`/workspace/projects/${projectId}/tasks`, { method: "POST", body: {
    title: "Criar README.md do projeto e validar com um teste",
    description: "Escreve o ficheiro README.md com uma breve descrição do projeto e depois corre um teste que lê o ficheiro para confirmar que existe.",
    tools: [
      { id: "workspace_fs_write", input: { fileName: "README.md", content: "# Projeto Slice\nGerado pelo VISERON BUILDER (E2E real)." } },
      { id: "workspace_test_run", input: { script: "const fs=require('fs'); if(!fs.existsSync('README.md')) process.exit(1); console.log('TEST OK README existe');" } },
    ],
  } }, token);
  if (taskRes.status !== 201) { console.error("TASK FAIL", taskRes.status, JSON.stringify(taskRes.data)); process.exit(1); }
  const taskId = taskRes.data.task.id;
  const kernelTaskId = taskRes.data.task.kernelTaskId;
  console.log(`TASK OK  id=${taskId}  kernel=${kernelTaskId}  stage=${taskRes.data.task.stage}`);

  // 4. Poll até terminal (Ollama real pode demorar)
  let final: any = taskRes.data.task;
  const start = Date.now();
  while (!["COMPLETED", "FAILED", "CANCELLED"].includes(final.stage) && Date.now() - start < 300000) {
    await new Promise((r) => setTimeout(r, 3000));
    const t = await j(`/workspace/tasks/${taskId}`, {}, token);
    final = t.data.task;
  }
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n===== RESULT (${elapsed}s) =====`);
  console.log(`stage=${final.stage}`);
  console.log(`error=${final.error ?? "—"}`);
  const r = final.result ?? {};
  console.log(`result.success=${r.success}`);
  console.log(`result.executedBy=${r.executedBy}`);
  console.log(`model=${JSON.stringify(r.model ?? null)}`);
  console.log(`toolsSummary=${JSON.stringify(r.toolsSummary ?? null)}`);
  const tools = Array.isArray(r.tools) ? r.tools : [];
  tools.forEach((t: any, i: number) => {
    console.log(`tool[${i}] ${t.toolId}  success=${t.success}  ${t.error ? "error=" + t.error : ""}  result=${JSON.stringify(t.result ?? null)}`);
  });
  console.log(`output=${String(r.output ?? "").slice(0, 400)}`);
  console.log(`events=${(final.events ?? []).map((e: any) => e.topic).join(",")}`);

  // 5. Verificação do ficheiro no sandbox via listagem de memória
  const mem = await j(`/omega/memory/graph/entity/task_${kernelTaskId}`, {}, token);
  console.log(`\nMEMORY entity task_${kernelTaskId}: ${mem.status === 200 ? "present" : mem.status + " " + JSON.stringify(mem.data)}`);

  const ok = final.stage === "COMPLETED" && r.success === true && tools.length === 2 && tools.every((t: any) => t.success === true);
  console.log(`\n${ok ? "✅ E2E REAL PASS" : "⚠️ E2E REAL NOT-COMPLETED (ver acima)"}`);
  process.exit(ok ? 0 : 2);
})().catch((e) => { console.error("E2E CRASH", e); process.exit(1); });
