import { Router, Response } from "express";
import { AuthedRequest, requireAuth } from "../auth/middleware";
import { ComposioBridge } from "../../core/composio/ComposioBridge";

/**
 * Composio router - expõe o consumo MCP das ferramentas Composio.
 * status/tools: público (leitura). connect/execução: autenticado (JWT).
 */
export function createComposioRouter(bridge: ComposioBridge): Router {
  const router = Router();

  router.get("/composio/status", (_req, res: Response) => {
    res.json({ ok: true, ...bridge.getStatus() });
  });

  router.get("/composio/tools", (_req, res: Response) => {
    res.json({ ok: true, tools: bridge.listTools() });
  });

  router.post("/composio/connect", requireAuth, async (_req: AuthedRequest, res: Response) => {
    if (!bridge.configured) {
      res.status(400).json({ ok: false, error: "COMPOSIO_API_KEY não definida no .env" });
      return;
    }
    const ok = await bridge.connect();
    if (!ok) {
      res.status(502).json({ ok: false, error: bridge.getStatus().lastError || "Falha ao ligar ao Composio" });
      return;
    }
    res.json({ ok: true, ...bridge.getStatus() });
  });

  router.post("/composio/tools/:name", requireAuth, async (req: AuthedRequest, res: Response) => {
    const name = String(req.params.name || "").trim();
    if (!name) {
      res.status(400).json({ ok: false, error: "tool name required" });
      return;
    }
    if (!bridge.configured) {
      res.status(400).json({ ok: false, error: "COMPOSIO_API_KEY não definida no .env" });
      return;
    }
    const args = req.body && typeof req.body === "object" ? (req.body.arguments ?? req.body) : {};
    try {
      const result = await bridge.callTool(name, args);
      res.json({ ok: true, output: result.output });
    } catch (e: any) {
      res.status(502).json({ ok: false, error: e.message || String(e) });
    }
  });

  return router;
}
