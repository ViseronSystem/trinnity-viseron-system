import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { ToolManager } from "../../core/tools/ToolManager";

/**
 * Ferramentas REAIS do workspace vertical slice.
 *
 *  - workspace_fs_write: escreve um ficheiro REAL no sandbox do projeto
 *    (`<dataDir>/workspace/<tenantId>/projects/<projectId>/`) — isolado por
 *    tenant, sem escape de caminho (basename + charset restrito).
 *  - workspace_test_run: executa um teste REAL (`node -e <script>`) com cwd
 *    no sandbox do projeto, timeout 15s, e devolve exitCode/stdout/stderr.
 *
 * Nenhuma das duas é mock: tocam o disco e o runtime Node de verdade.
 */

export const WORKSPACE_FS_WRITE = "workspace_fs_write";
export const WORKSPACE_TEST_RUN = "workspace_test_run";

const SAFE_NAME = /^[a-zA-Z0-9._-]+$/;

export function registerWorkspaceTools(toolManager: ToolManager, dataDir: string): void {
  const root = path.join(dataDir, "workspace");

  const sandboxFor = (tenantId: string, projectId: string): string => {
    const tenant = String(tenantId || "").replace(/[^a-zA-Z0-9._-]/g, "");
    const project = String(projectId || "").replace(/[^a-zA-Z0-9._-]/g, "");
    if (!tenant || !project) throw new Error("tenantId e projectId obrigatórios");
    const dir = path.join(root, tenant, "projects", project);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  };

  toolManager.createQuickTool(
    WORKSPACE_FS_WRITE,
    "Workspace File Write",
    "AUTOMATION",
    "Escreve um ficheiro real no sandbox do projeto do utilizador (isolamento por tenant)",
    async (input) => {
      const { tenantId, projectId, fileName, content } = input ?? {};
      if (!tenantId || !projectId || !fileName) throw new Error("tenantId, projectId e fileName obrigatórios");
      const safeName = path.basename(String(fileName));
      if (!SAFE_NAME.test(safeName)) throw new Error(`fileName inválido: ${safeName}`);
      const dir = sandboxFor(String(tenantId), String(projectId));
      const file = path.join(dir, safeName);
      fs.writeFileSync(file, String(content ?? ""), "utf8");
      const stat = fs.statSync(file);
      return { fileName: safeName, path: file, bytes: stat.size, written: true };
    }
  );

  toolManager.createQuickTool(
    WORKSPACE_TEST_RUN,
    "Workspace Test Run",
    "AUTOMATION",
    "Executa um teste real (node -e) no sandbox do projeto e devolve exitCode/stdout/stderr",
    (input) =>
      new Promise((resolve, reject) => {
        const { tenantId, projectId, script } = input ?? {};
        if (!tenantId || !projectId) return reject(new Error("tenantId e projectId obrigatórios"));
        if (!script || typeof script !== "string") return reject(new Error("script obrigatório (código JS do teste)"));
        const dir = sandboxFor(String(tenantId), String(projectId));
        execFile(
          process.execPath,
          ["-e", script],
          { cwd: dir, timeout: 15000, maxBuffer: 1024 * 1024 },
          (err, stdout, stderr) => {
            if (err) {
              const code = (err as any)?.code;
              return resolve({ exitCode: typeof code === "number" ? code : 1, stdout, stderr: String(stderr || err?.message || ""), passed: false });
            }
            resolve({ exitCode: 0, stdout, stderr: "", passed: true });
          }
        );
      })
  );
}
