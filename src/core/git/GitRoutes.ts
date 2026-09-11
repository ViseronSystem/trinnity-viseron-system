import { Router, Request, Response } from "express";
import { GitServer } from "./GitServer";

// TVS — GIT SERVER ROUTES (GitHub-like API)
// Express router for all git operations

export function createGitRouter(server: GitServer, logger?: { info?: (message: string, meta?: Record<string, unknown>) => void }): Router {
  const router = Router();
  const log = (msg: string) => {
    if (logger && logger.info) logger.info(`[git] ${msg}`);
    else console.log(`[git] ${msg}`);
  };

  // ─── Repos ───────────────────────────────────────────────────────────

  router.post("/git/repos", (req: Request, res: Response) => {
    try {
      const name = String(req.body?.name || "").trim();
      if (!name) return void res.status(400).json({ ok: false, error: "name required" });
      const description = String(req.body?.description || "");
      const isPublic = req.body?.isPublic !== false;
      const owner = String(req.body?.owner || "system");
      const repo = server.createRepo(name, description, isPublic, owner);
      log(`repo created: ${repo.id} (${repo.name})`);
      res.json({ ok: true, repo });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  router.get("/git/repos", (_req: Request, res: Response) => {
    res.json({ ok: true, repos: server.listRepos() });
  });

  router.get("/git/repos/:id", (req: Request, res: Response) => {
    const repo = server.getRepo(String(req.params.id || ""));
    if (!repo) return void res.status(404).json({ ok: false, error: "repo not found" });
    res.json({ ok: true, repo });
  });

  router.delete("/git/repos/:id", (req: Request, res: Response) => {
    const ok = server.deleteRepo(String(req.params.id || ""));
    if (!ok) return void res.status(404).json({ ok: false, error: "repo not found" });
    log(`repo deleted: ${req.params.id}`);
    res.json({ ok: true });
  });

  // ─── Files ───────────────────────────────────────────────────────────

  router.get("/git/repos/:id/files", (req: Request, res: Response) => {
    try {
      const repo = server.getRepo(String(req.params.id || ""));
      if (!repo) return void res.status(404).json({ ok: false, error: "repo not found" });
      const filePath = String(req.query.path || "");
      const branch = String(req.query.branch || "");
      const files = server.listFiles(repo.id, filePath, branch);
      res.json({ ok: true, files });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  router.get("/git/repos/:id/file", (req: Request, res: Response) => {
    try {
      const repo = server.getRepo(String(req.params.id || ""));
      if (!repo) return void res.status(404).json({ ok: false, error: "repo not found" });
      const filePath = String(req.query.path || "");
      if (!filePath) return void res.status(400).json({ ok: false, error: "path query param required" });
      const branch = String(req.query.branch || "");
      const result = server.getFile(repo.id, filePath, branch);
      res.json({ ok: true, ...result });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  router.post("/git/repos/:id/file", (req: Request, res: Response) => {
    try {
      const repo = server.getRepo(String(req.params.id || ""));
      if (!repo) return void res.status(404).json({ ok: false, error: "repo not found" });
      const filePath = String(req.body?.path || "").trim();
      const content = String(req.body?.content ?? "");
      const message = String(req.body?.message || "update file").trim();
      const author = String(req.body?.author || "system");
      if (!filePath) return void res.status(400).json({ ok: false, error: "path required" });
      const commit = server.saveFile(repo.id, filePath, content, message, author);
      log(`file saved: ${filePath} in ${repo.id} (${commit.shortHash})`);
      res.json({ ok: true, commit });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  // ─── Branches ────────────────────────────────────────────────────────

  router.post("/git/repos/:id/branch", (req: Request, res: Response) => {
    try {
      const repo = server.getRepo(String(req.params.id || ""));
      if (!repo) return void res.status(404).json({ ok: false, error: "repo not found" });
      const name = String(req.body?.name || "").trim();
      if (!name) return void res.status(400).json({ ok: false, error: "branch name required" });
      const from = String(req.body?.from || "");
      const branch = server.createBranch(repo.id, name, from);
      log(`branch created: ${name} in ${repo.id}`);
      res.json({ ok: true, branch });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  router.get("/git/repos/:id/branches", (req: Request, res: Response) => {
    try {
      const repo = server.getRepo(String(req.params.id || ""));
      if (!repo) return void res.status(404).json({ ok: false, error: "repo not found" });
      const branches = server.listBranches(repo.id);
      res.json({ ok: true, branches });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  // ─── Log / Diff / Status ─────────────────────────────────────────────

  router.get("/git/repos/:id/log", (req: Request, res: Response) => {
    try {
      const repo = server.getRepo(String(req.params.id || ""));
      if (!repo) return void res.status(404).json({ ok: false, error: "repo not found" });
      const branch = String(req.query.branch || "");
      const limit = Math.min(parseInt(String(req.query.limit || "20"), 10) || 20, 200);
      const log = server.getLog(repo.id, branch, limit);
      res.json({ ok: true, log });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  router.get("/git/repos/:id/diff", (req: Request, res: Response) => {
    try {
      const repo = server.getRepo(String(req.params.id || ""));
      if (!repo) return void res.status(404).json({ ok: false, error: "repo not found" });
      const from = String(req.query.from || "HEAD~1");
      const to = String(req.query.to || "HEAD");
      const diff = server.getDiff(repo.id, from, to);
      res.json({ ok: true, diff });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  router.get("/git/repos/:id/status", (req: Request, res: Response) => {
    try {
      const repo = server.getRepo(String(req.params.id || ""));
      if (!repo) return void res.status(404).json({ ok: false, error: "repo not found" });
      const status = server.getStatus(repo.id);
      res.json({ ok: true, status });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  // ─── Pull Requests ───────────────────────────────────────────────────

  router.post("/git/repos/:id/pr", (req: Request, res: Response) => {
    try {
      const repo = server.getRepo(String(req.params.id || ""));
      if (!repo) return void res.status(404).json({ ok: false, error: "repo not found" });
      const title = String(req.body?.title || "").trim();
      if (!title) return void res.status(400).json({ ok: false, error: "title required" });
      const description = String(req.body?.description || "");
      const sourceBranch = String(req.body?.sourceBranch || "").trim();
      const targetBranch = String(req.body?.targetBranch || repo.defaultBranch);
      const author = String(req.body?.author || "system");
      if (!sourceBranch) return void res.status(400).json({ ok: false, error: "sourceBranch required" });
      const pr = server.createPR(repo.id, title, description, sourceBranch, targetBranch, author);
      log(`PR created: #${pr.number} in ${repo.id}`);
      res.json({ ok: true, pr });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  router.get("/git/repos/:id/prs", (req: Request, res: Response) => {
    try {
      const repo = server.getRepo(String(req.params.id || ""));
      if (!repo) return void res.status(404).json({ ok: false, error: "repo not found" });
      const status = String(req.query.status || "") || undefined;
      const prs = server.listPRs(repo.id, status);
      res.json({ ok: true, prs });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  router.post("/git/repos/:id/pr/:number/merge", (req: Request, res: Response) => {
    try {
      const repo = server.getRepo(String(req.params.id || ""));
      if (!repo) return void res.status(404).json({ ok: false, error: "repo not found" });
      const number = parseInt(String(req.params.number || "0"), 10);
      if (!number) return void res.status(400).json({ ok: false, error: "invalid PR number" });
      const pr = server.mergePR(repo.id, number);
      if (!pr) return void res.status(404).json({ ok: false, error: "PR not found or already closed/merged" });
      log(`PR merged: #${pr.number} in ${repo.id}`);
      res.json({ ok: true, pr });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  // ─── Search ──────────────────────────────────────────────────────────

  router.get("/git/search", (req: Request, res: Response) => {
    const query = String(req.query.q || "").trim();
    if (!query) return void res.status(400).json({ ok: false, error: "q query param required" });
    const repos = server.searchRepos(query);
    res.json({ ok: true, repos });
  });

  return router;
}
