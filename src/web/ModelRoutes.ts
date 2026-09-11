import { Router, Request, Response } from "express";
import { ModelRegistry } from "../core/models/ModelRegistry";

function getParam(p: string | string[] | undefined): string {
  return typeof p === "string" ? p : (p && p[0]) || "";
}

export function createModelRouter(registry: ModelRegistry): Router {
  const router = Router();

  // GET /models — lista todos os modelos (Ollama + registry)
  router.get("/models", async (_req: Request, res: Response) => {
    try {
      const models = await registry.listModels();
      res.json({ models, count: models.length });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "listModels failed" });
    }
  });

  // POST /models/pull — puxa modelo do Ollama {name}
  router.post("/models/pull", async (req: Request, res: Response) => {
    const { name } = req.body || {};
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
    }
    try {
      const result = await registry.pullModel(name);
      if (result.ok) {
        res.json({ ok: true, model: result.model });
      } else {
        res.status(500).json({ ok: false, error: result.error });
      }
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || "pull failed" });
    }
  });

  // DELETE /models/:name — remove modelo
  router.delete("/models/:name", async (req: Request, res: Response) => {
    const name = getParam(req.params.name);
    if (!name) {
      return res.status(400).json({ error: "name param is required" });
    }
    try {
      const result = await registry.deleteModel(name);
      if (result.ok) {
        res.json({ ok: true, deleted: name });
      } else {
        res.status(500).json({ ok: false, error: result.error });
      }
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || "delete failed" });
    }
  });

  // POST /models/infer — executa inferência {model, prompt, system?, temperature?, maxTokens?}
  router.post("/models/infer", async (req: Request, res: Response) => {
    const { model, prompt, system, temperature, maxTokens, stream } = req.body || {};
    if (!model || !prompt) {
      return res.status(400).json({ error: "model and prompt are required" });
    }
    try {
      const response = await registry.infer({
        model,
        prompt,
        system,
        temperature,
        maxTokens,
        stream,
      });
      res.json(response);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "inference failed" });
    }
  });

  // GET /models/templates — lista templates de tarefa
  router.get("/models/templates", (_req: Request, res: Response) => {
    try {
      const templates = registry.getTemplates();
      res.json({ templates, count: templates.length });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "getTemplates failed" });
    }
  });

  // POST /models/templates — adiciona template personalizado
  router.post("/models/templates", (req: Request, res: Response) => {
    const { name, description, model, systemPrompt, temperature, maxTokens, useCase } = req.body || {};
    if (!name || !model || !systemPrompt) {
      return res.status(400).json({ error: "name, model, and systemPrompt are required" });
    }
    try {
      const template = registry.addTemplate({
        name,
        description: description || "",
        model,
        systemPrompt,
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 2048,
        useCase: useCase || "custom",
      });
      res.status(201).json(template);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "addTemplate failed" });
    }
  });

  // DELETE /models/templates/:id — remove template
  router.delete("/models/templates/:id", (req: Request, res: Response) => {
    const id = getParam(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "id param is required" });
    }
    const removed = registry.removeTemplate(id);
    if (removed) {
      res.json({ ok: true, deleted: id });
    } else {
      res.status(404).json({ error: "Template not found" });
    }
  });

  // GET /models/usage — estatísticas de uso
  router.get("/models/usage", (_req: Request, res: Response) => {
    try {
      const usage = registry.getUsage();
      res.json(usage);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "getUsage failed" });
    }
  });

  // GET /models/status — estado dos providers
  router.get("/models/status", async (_req: Request, res: Response) => {
    try {
      const status = await registry.getStatus();
      res.json(status);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "getStatus failed" });
    }
  });

  return router;
}
