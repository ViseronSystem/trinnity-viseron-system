import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { AppScaffoldStore } from "./store";
import { createApp } from "./generator";

export function createAppsRouter(store: AppScaffoldStore, logger?: { info?: (message: string, meta?: Record<string, unknown>) => void }): Router {
  const router = Router();
  const log = (msg: string) => {
    if (logger && logger.info) logger.info(`[apps] ${msg}`);
    else console.log(`[apps] ${msg}`);
  };

  router.post("/apps/generate", async (req: Request, res: Response) => {
    try {
      const name = String(req.body?.name || "").trim();
      const description = String(req.body?.description || "").trim();
      if (!name || !description) {
        res.status(400).json({ ok: false, error: "name and description required" });
        return;
      }
      const app = await createApp(store, name, description);
      log(`generated app ${app.meta.slug} for "${name}"`);
      res.json({ ok: true, meta: app.meta, files: app.files });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  router.get("/apps/list", (_req: Request, res: Response) => {
    const apps = store.list().map((a) => ({
      ...a,
      apkBuilt: fs.existsSync(path.join(store.appDir(a.slug) + ".apk")),
    }));
    res.json({ ok: true, apps });
  });

  router.get("/apps/status", (_req: Request, res: Response) => {
    const apps = store.list();
    const built = apps.filter((a) => fs.existsSync(path.join(store.appDir(a.slug) + ".apk"))).length;
    res.json({ ok: true, total: apps.length, apkBuilt: built });
  });

  // Download do APK real compilado (data/apps/<slug>.apk)
  router.get("/apps/:slug/apk", (req: Request, res: Response) => {
    const slug = String(req.params.slug || "");
    const meta = store.get(slug);
    if (!meta) {
      res.status(404).json({ ok: false, error: "app not found" });
      return;
    }
    const apk = path.join(store.appDir(slug) + ".apk");
    if (!fs.existsSync(apk)) {
      res.status(404).json({ ok: false, error: "APK não compilado ainda. Usa: npm run app:create -- \"Nome\" \"Descrição\" (ou app:build)" });
      return;
    }
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Disposition", `attachment; filename="${slug}.apk"`);
    res.sendFile(apk);
  });

  router.get("/apps/:slug", (req: Request, res: Response) => {
    const slug = String(req.params.slug || "");
    const meta = store.get(slug);
    if (!meta) {
      res.status(404).json({ ok: false, error: "app not found" });
      return;
    }
    res.json({ ok: true, meta, files: store.listFiles(slug) });
  });

  router.get("/apps/:slug/source", (req: Request, res: Response) => {
    const slug = String(req.params.slug || "");
    const meta = store.get(slug);
    if (!meta) {
      res.status(404).json({ ok: false, error: "app not found" });
      return;
    }
    const files = store.listFiles(slug);
    const out: Record<string, string> = {};
    for (const rel of files) {
      out[rel] = fs.readFileSync(path.join(store.appDir(slug), rel), "utf8");
    }
    res.json({ ok: true, meta, files: out });
  });

  return router;
}
