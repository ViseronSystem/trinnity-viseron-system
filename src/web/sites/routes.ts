import { Router, Request, Response } from "express";
import path from "path";
import { SiteStore, slugify } from "./store";
import { createSite } from "./generator";

export function createSitesRouter(store: SiteStore, logger?: { info?: (message: string, meta?: Record<string, unknown>) => void }): Router {
  const router = Router();
  const log = (msg: string) => {
    if (logger && logger.info) logger.info(`[sites] ${msg}`);
    else console.log(`[sites] ${msg}`);
  };

  router.post("/sites/generate", async (req: Request, res: Response) => {
    try {
      const name = String(req.body?.name || "").trim();
      const description = String(req.body?.description || "").trim();
      const lang = (String(req.body?.lang || "pt") as "pt" | "en" | "es").slice(0, 2) as "pt" | "en" | "es";
      if (!name || !description) {
        res.status(400).json({ ok: false, error: "name and description required" });
        return;
      }
      const site = await createSite(store, name, description, lang);
      log(`generated site ${site.meta.slug} for "${name}"`);
      res.json({ ok: true, ...site, previewUrl: `/sites/${site.meta.slug}/index.html` });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  router.get("/sites/list", (_req: Request, res: Response) => {
    res.json({ ok: true, sites: store.list() });
  });

  router.get("/sites/:slug", (req: Request, res: Response) => {
    const site = store.get(String(req.params.slug || ""));
    if (!site) {
      res.status(404).json({ ok: false, error: "site not found" });
      return;
    }
    res.sendFile(path.resolve(site.htmlPath));
  });

  router.get("/sites/status", (_req: Request, res: Response) => {
    res.json({ ok: true, total: store.count() });
  });

  return router;
}

export { slugify };
