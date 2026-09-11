import { Router, Response } from "express";
import { AuthedRequest, requireAuth } from "../auth/middleware";
import { Marketplace } from "../../core/marketplace/Marketplace";

export function createMarketplaceRouter(marketplace: Marketplace, logger?: { info?: (message: string, meta?: Record<string, unknown>) => void }): Router {
  const router = Router();
  const log = (msg: string) => {
    if (logger && logger.info) logger.info(`[marketplace] ${msg}`);
    else console.log(`[marketplace] ${msg}`);
  };

  // ── Packages ──────────────────────────────────────────────

  router.get("/marketplace/packages", (req: AuthedRequest, res: Response) => {
    try {
      const category = String(req.query.category || "").trim() || undefined;
      const sort = String(req.query.sort || "").trim() || undefined;
      const search = String(req.query.search || "").trim() || undefined;
      const featured = String(req.query.featured || "").trim();
      const verified = String(req.query.verified || "").trim();
      const limit = String(req.query.limit || "").trim();
      const offset = String(req.query.offset || "").trim();
      const packages = marketplace.listPackages({
        category: category as any,
        sort: sort as any,
        search: search || undefined,
        featured: featured ? featured === "true" : undefined,
        verified: verified ? verified === "true" : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      });
      res.json({ ok: true, packages, total: packages.length });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.get("/marketplace/packages/:id", (req: AuthedRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const pkg = marketplace.getPackage(id);
      if (!pkg) {
        res.status(404).json({ ok: false, error: "Package not found" });
        return;
      }
      const reviews = marketplace.getReviews(pkg.id);
      const installed = marketplace.listInstalled().find((i) => i.packageId === pkg.id);
      res.json({ ok: true, package: pkg, reviews, installed: installed || null });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.post("/marketplace/packages", requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const pkg = marketplace.createPackage(req.body);
      log(`Package created: ${pkg.id} by ${req.user?.sub}`);
      res.status(201).json({ ok: true, package: pkg });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  router.patch("/marketplace/packages/:id", requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const pkg = marketplace.updatePackage(id, req.body);
      if (!pkg) {
        res.status(404).json({ ok: false, error: "Package not found" });
        return;
      }
      log(`Package updated: ${pkg.id} by ${req.user?.sub}`);
      res.json({ ok: true, package: pkg });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  router.delete("/marketplace/packages/:id", requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const deleted = marketplace.deletePackage(id);
      if (!deleted) {
        res.status(404).json({ ok: false, error: "Package not found" });
        return;
      }
      log(`Package deleted: ${id} by ${req.user?.sub}`);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.get("/marketplace/featured", (_req: AuthedRequest, res: Response) => {
    try {
      const featured = marketplace.getFeatured();
      res.json({ ok: true, packages: featured, total: featured.length });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.get("/marketplace/popular", (req: AuthedRequest, res: Response) => {
    try {
      const limit = String(req.query.limit || "").trim();
      const popular = marketplace.getPopular(limit ? parseInt(limit, 10) : 10);
      res.json({ ok: true, packages: popular, total: popular.length });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ── Install / Uninstall ──────────────────────────────────

  router.post("/marketplace/install/:id", requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const install = marketplace.installPackage(id, req.body?.config);
      if (!install) {
        res.status(404).json({ ok: false, error: "Package not found" });
        return;
      }
      log(`Package installed: ${id} by ${req.user?.sub}`);
      res.json({ ok: true, install });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.post("/marketplace/uninstall/:id", requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const uninstalled = marketplace.uninstallPackage(id);
      if (!uninstalled) {
        res.status(404).json({ ok: false, error: "Package not installed" });
        return;
      }
      log(`Package uninstalled: ${id} by ${req.user?.sub}`);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.get("/marketplace/installed", requireAuth, (_req: AuthedRequest, res: Response) => {
    try {
      const installed = marketplace.listInstalled();
      const detailed = installed.map((inst) => ({
        ...inst,
        package: marketplace.getPackage(inst.packageId) || null,
      }));
      res.json({ ok: true, installed: detailed, total: installed.length });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.post("/marketplace/toggle/:id", requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const installed = marketplace.listInstalled().find((i) => i.packageId === id);
      if (!installed) {
        res.status(404).json({ ok: false, error: "Package not installed" });
        return;
      }

      if (installed.enabled) {
        marketplace.disablePackage(id);
        log(`Package disabled: ${id} by ${req.user?.sub}`);
      } else {
        marketplace.enablePackage(id);
        log(`Package enabled: ${id} by ${req.user?.sub}`);
      }

      const updated = marketplace.listInstalled().find((i) => i.packageId === id);
      res.json({ ok: true, install: updated });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ── Reviews ──────────────────────────────────────────────

  router.post("/marketplace/reviews", requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const { packageId, rating, title, content } = req.body;
      if (!packageId || !rating || !title || !content) {
        res.status(400).json({ ok: false, error: "packageId, rating, title, and content are required" });
        return;
      }

      const review = marketplace.addReview({
        packageId: String(packageId),
        userId: req.user?.sub || "anonymous",
        userName: req.user?.email || "Anonymous",
        rating: parseInt(String(rating), 10),
        title: String(title),
        content: String(content),
      });

      if (!review) {
        res.status(404).json({ ok: false, error: "Package not found" });
        return;
      }

      log(`Review added for ${packageId} by ${req.user?.sub}`);
      res.status(201).json({ ok: true, review });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  router.get("/marketplace/reviews/:packageId", (req: AuthedRequest, res: Response) => {
    try {
      const packageId = String(req.params.packageId);
      const reviews = marketplace.getReviews(packageId);
      res.json({ ok: true, reviews, total: reviews.length });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ── Search ───────────────────────────────────────────────

  router.get("/marketplace/search", (req: AuthedRequest, res: Response) => {
    try {
      const q = String(req.query.q || "").trim();
      if (!q) {
        res.status(400).json({ ok: false, error: "Query parameter 'q' is required" });
        return;
      }
      const result = marketplace.search(q, {
        category: String(req.query.category || "").trim() as any || undefined,
        sort: String(req.query.sort || "").trim() as any || undefined,
        limit: String(req.query.limit || "").trim() ? parseInt(String(req.query.limit), 10) : undefined,
      });
      res.json({ ok: true, ...result });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ── Stats ────────────────────────────────────────────────

  router.get("/marketplace/stats", (_req: AuthedRequest, res: Response) => {
    try {
      const stats = marketplace.getStats();
      res.json({ ok: true, stats });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.get("/marketplace/trending", (_req: AuthedRequest, res: Response) => {
    try {
      const trending = marketplace.getTrending();
      res.json({ ok: true, packages: trending, total: trending.length });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  return router;
}
