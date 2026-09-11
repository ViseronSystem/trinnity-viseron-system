import { Router, Request, Response } from "express";
import { MemoryEngine, MemoryQuery } from "./MemoryEngine";

export function createMemoryRouter(engine: MemoryEngine): Router {
  const router = Router();

  // POST /api/memory/remember — add memory
  router.post("/memory/remember", (req: Request, res: Response) => {
    try {
      const { content, type, metadata } = req.body;
      if (!content || typeof content !== "string") {
        res.status(400).json({ ok: false, error: "content is required" });
        return;
      }
      const validTypes = [
        "interaction",
        "knowledge",
        "fact",
        "code",
        "decision",
        "error",
      ];
      const entryType = validTypes.includes(type) ? type : "interaction";

      const entry = engine.remember(content, entryType, metadata || {});
      res.json({ ok: true, entry });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // POST /api/memory/recall — search
  router.post("/memory/recall", (req: Request, res: Response) => {
    try {
      const { text, type, tags, limit, minImportance, timeRange } = req.body;
      if (!text || typeof text !== "string") {
        res.status(400).json({ ok: false, error: "text is required" });
        return;
      }

      const query: MemoryQuery = {
        text,
        type,
        tags,
        limit: Math.min(limit || 20, 100),
        minImportance,
        timeRange,
      };

      const results = engine.recall(query);
      res.json({
        ok: true,
        count: results.length,
        results: results.map((r) => ({
          id: r.entry.id,
          type: r.entry.type,
          content: r.entry.content,
          score: Math.round(r.score * 10000) / 10000,
          layer: r.layer,
          metadata: r.entry.metadata,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /api/memory/recent — recent entries
  router.get("/memory/recent", (req: Request, res: Response) => {
    try {
      const rawLimit = typeof req.query.limit === "string" ? req.query.limit : "50";
      const limit = Math.min(parseInt(rawLimit, 10) || 50, 200);
      const entries = engine.getRecent(limit);
      res.json({
        ok: true,
        count: entries.length,
        entries,
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // DELETE /api/memory/:id — forget
  router.delete("/memory/:id", (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const removed = engine.forget(id);
      if (!removed) {
        res.status(404).json({ ok: false, error: "entry not found" });
        return;
      }
      res.json({ ok: true, id });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // PATCH /api/memory/:id — update importance
  router.patch("/memory/:id", (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const { importance } = req.body;
      if (importance === undefined || typeof importance !== "number") {
        res
          .status(400)
          .json({ ok: false, error: "importance (number 0-1) is required" });
        return;
      }
      const updated = engine.updateImportance(id, importance);
      if (!updated) {
        res.status(404).json({ ok: false, error: "entry not found" });
        return;
      }
      res.json({ ok: true, id, importance: Math.max(0, Math.min(1, importance)) });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // POST /api/memory/knowledge — add knowledge
  router.post("/memory/knowledge", (req: Request, res: Response) => {
    try {
      const { content, source, tags } = req.body;
      if (!content || typeof content !== "string") {
        res.status(400).json({ ok: false, error: "content is required" });
        return;
      }
      if (!source || typeof source !== "string") {
        res.status(400).json({ ok: false, error: "source is required" });
        return;
      }
      const entry = engine.addKnowledge(content, source, tags || []);
      res.json({ ok: true, entry });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // POST /api/memory/consolidate — trigger consolidation
  router.post("/memory/consolidate", (_req: Request, res: Response) => {
    try {
      const result = engine.consolidate();
      res.json({ ok: true, ...result });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /api/memory/stats — statistics
  router.get("/memory/stats", (_req: Request, res: Response) => {
    try {
      const stats = engine.getStats();
      res.json({ ok: true, stats });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /api/memory/export — export all memory as JSON
  router.get("/memory/export", (_req: Request, res: Response) => {
    try {
      const data = engine.exportAll();
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=viseron-memory-export.json"
      );
      res.json({ ok: true, ...data });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  return router;
}
