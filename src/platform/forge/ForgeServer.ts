import express from "express";
import http from "http";
import path from "path";
import fs from "fs-extra";
import { RepoManager, ForgeRepo, ForgeUser, ForgeIssue } from "./RepoManager";
import { GitEngine } from "./GitEngine";

const ROOT = path.resolve(__dirname, "..", "..", "..");
const DATA_DIR = path.join(ROOT, "src", "platform", "forge", "data");
const PUBLIC_DIR = path.join(ROOT, "src", "platform", "forge", "public");

export class ForgeServer {
  private app: express.Application;
  private server: http.Server;
  private repoManager: RepoManager;
  private gitEngine: GitEngine;
  private port: number;

  constructor(port: number = 4000) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.repoManager = new RepoManager(DATA_DIR);
    this.gitEngine = new GitEngine(path.join(DATA_DIR, "repos_git"));
    this.setupMiddleware();
    this.setupAPI();
    this.setupGitHTTP();
    this.setupFrontend();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: "50mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  }

  private auth(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token as string;
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const users = this.repoManager["listUsers"]?.() || [];
    const user = users.find((u: ForgeUser) => u.token === token);
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    (req as any).user = user;
    next();
  }

  private setupAPI(): void {
    const api = express.Router();

    // --- Health ---
    api.get("/health", (req, res) => {
      res.json({ status: "ok", service: "ViseronForge", version: "1.0.0", uptime: process.uptime() });
    });

    // --- Auth ---
    api.post("/auth/login", (req, res) => {
      const { username, password } = req.body;
      const user = this.repoManager.getUser(username);
      if (!user || user.token !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      res.json({ token: user.token, user: { username: user.username, displayName: user.displayName, avatar: user.avatar } });
    });

    api.post("/auth/register", async (req, res) => {
      const { username, email, password, displayName } = req.body;
      if (this.repoManager.getUser(username)) {
        return res.status(409).json({ error: "Username already exists" });
      }
      const user = await this.repoManager.createUser({
        username, email, displayName: displayName || username,
        avatar: "", bio: "", company: "", location: "", website: "", twitter: "",
        createdAt: "", repos: 0, stars: 0, followers: 0, following: 0,
        isAdmin: false, token: password,
      });
      res.json({ token: user.token, user: { username: user.username, displayName: user.displayName } });
    });

    // --- Users ---
    api.get("/users/:username", (req, res) => {
      const user = this.repoManager.getUser(req.params.username);
      if (!user) return res.status(404).json({ error: "User not found" });
      const { token, ...safe } = user;
      res.json(safe);
    });

    // --- Repos ---
    api.get("/repos", (req, res) => {
      const { owner, visibility, q } = req.query;
      if (q) {
        return res.json(this.repoManager.searchRepos(q as string));
      }
      res.json(this.repoManager.listRepos(owner as string, visibility as any));
    });

    api.get("/repos/:owner/:name", (req, res) => {
      const repo = this.repoManager.getRepo(req.params.owner, req.params.name);
      if (!repo) return res.status(404).json({ error: "Repository not found" });
      res.json(repo);
    });

    api.post("/repos", this.auth.bind(this), async (req, res) => {
      try {
        const { name, description, visibility, language, license, defaultBranch, isTemplate } = req.body;
        const user = (req as any).user;

        if (!name) return res.status(400).json({ error: "Repository name is required" });

        const gitPath = this.gitEngine.getRepoPath(user.username, name);
        if (this.gitEngine.repoExists(user.username, name)) {
          return res.status(409).json({ error: "Repository already exists" });
        }

        await this.gitEngine.createRepo(user.username, name, true);
        const repo = await this.repoManager.createRepo(user.username, name, {
          description, visibility, language, license, defaultBranch, isTemplate,
        });

        res.status(201).json(repo);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    api.delete("/repos/:owner/:name", this.auth.bind(this), async (req, res) => {
      try {
        const user = (req as any).user;
        if (user.username !== req.params.owner && !user.isAdmin) {
          return res.status(403).json({ error: "Not authorized" });
        }
        await this.gitEngine.deleteRepo(req.params.owner, req.params.name);
        this.repoManager.deleteRepo(req.params.owner, req.params.name);
        res.json({ deleted: true });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    api.post("/repos/:owner/:name/fork", this.auth.bind(this), async (req, res) => {
      try {
        const user = (req as any).user;
        await this.gitEngine.forkRepo(req.params.owner, req.params.name, user.username, req.params.name);
        const forked = await this.repoManager.forkRepo(req.params.owner, req.params.name, user.username, req.params.name);
        res.status(201).json(forked);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    api.post("/repos/:owner/:name/star", this.auth.bind(this), async (req, res) => {
      const user = (req as any).user;
      await this.repoManager.starRepo(req.params.owner, req.params.name, user.username);
      res.json({ starred: true });
    });

    // --- Git Data ---
    api.get("/repos/:owner/:name/git/branches", async (req, res) => {
      try {
        const branches = await this.gitEngine.getBranches(req.params.owner, req.params.name);
        res.json(branches);
      } catch (err: any) {
        res.status(404).json({ error: err.message });
      }
    });

    api.get("/repos/:owner/:name/git/commits", async (req, res) => {
      try {
        const branch = req.query.branch as string || "main";
        const limit = parseInt(req.query.limit as string) || 50;
        const commits = await this.gitEngine.getCommits(req.params.owner, req.params.name, branch, limit);
        res.json(commits);
      } catch (err: any) {
        res.status(404).json({ error: err.message });
      }
    });

    api.get("/repos/:owner/:name/git/commits/:hash/diff", async (req, res) => {
      try {
        const diff = await this.gitEngine.getCommitDiff(req.params.owner, req.params.name, req.params.hash);
        res.json(diff);
      } catch (err: any) {
        res.status(404).json({ error: err.message });
      }
    });

    api.get("/repos/:owner/:name/git/tree", async (req, res) => {
      try {
        const ref = req.query.ref as string || "main";
        const dirPath = req.query.path as string || "";
        const tree = await this.gitEngine.getFileTree(req.params.owner, req.params.name, ref, dirPath);
        res.json(tree);
      } catch (err: any) {
        res.status(404).json({ error: err.message });
      }
    });

    api.get("/repos/:owner/:name/git/blobs/*", async (req, res) => {
      try {
        const filePath = req.params[0];
        const ref = req.query.ref as string || "main";
        const content = await this.gitEngine.getFileContent(req.params.owner, req.params.name, filePath, ref);
        if (content === null) return res.status(404).json({ error: "File not found" });
        res.json({ path: filePath, content, size: content.length });
      } catch (err: any) {
        res.status(404).json({ error: err.message });
      }
    });

    api.get("/repos/:owner/:name/git/tags", async (req, res) => {
      try {
        const tags = await this.gitEngine.getTags(req.params.owner, req.params.name);
        res.json(tags);
      } catch (err: any) {
        res.status(404).json({ error: err.message });
      }
    });

    api.get("/repos/:owner/:name/git/info", async (req, res) => {
      try {
        const info = await this.gitEngine.getRepoInfo(req.params.owner, req.params.name);
        const meta = this.repoManager.getRepo(req.params.owner, req.params.name);
        res.json({ ...info, ...meta });
      } catch (err: any) {
        res.status(404).json({ error: err.message });
      }
    });

    // --- Issues ---
    api.get("/repos/:owner/:name/issues", (req, res) => {
      const repoId = `${req.params.owner}/${req.params.name}`;
      const state = req.query.state as "open" | "closed" | undefined;
      res.json(this.repoManager.listIssues(repoId, state));
    });

    api.post("/repos/:owner/:name/issues", this.auth.bind(this), (req, res) => {
      const repoId = `${req.params.owner}/${req.params.name}`;
      const user = (req as any).user;
      const issue = this.repoManager.createIssue(repoId, { ...req.body, author: user.username });
      res.status(201).json(issue);
    });

    api.patch("/repos/:owner/:name/issues/:id", this.auth.bind(this), (req, res) => {
      const repoId = `${req.params.owner}/${req.params.name}`;
      const issue = this.repoManager.updateIssue(repoId, parseInt(req.params.id), req.body);
      if (!issue) return res.status(404).json({ error: "Issue not found" });
      res.json(issue);
    });

    // --- Pull Requests ---
    api.post("/repos/:owner/:name/pulls", this.auth.bind(this), (req, res) => {
      const repoId = `${req.params.owner}/${req.params.name}`;
      const user = (req as any).user;
      const pr = this.repoManager.createIssue(repoId, {
        title: req.body.title,
        body: req.body.body,
        author: user.username,
        isPR: true,
        prBranch: req.body.head,
        prTarget: req.body.base,
      });
      res.status(201).json(pr);
    });

    api.post("/repos/:owner/:name/pulls/:id/merge", this.auth.bind(this), async (req, res) => {
      const repoId = `${req.params.owner}/${req.params.name}`;
      const pr = this.repoManager.getIssue?.(repoId, parseInt(req.params.id));
      if (!pr) return res.status(404).json({ error: "PR not found" });
      try {
        await this.gitEngine.mergeBranch(req.params.owner, req.params.name, pr.prBranch!, pr.prTarget!);
        this.repoManager.mergePR(repoId, parseInt(req.params.id));
        res.json({ merged: true });
      } catch (err: any) {
        res.status(409).json({ error: `Merge conflict: ${err.message}` });
      }
    });

    // --- Activity ---
    api.get("/activity", (req, res) => {
      res.json(this.repoManager.getRecentActivity());
    });

    // --- Trending ---
    api.get("/trending", (req, res) => {
      const repos = this.repoManager.listRepos("public")
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 25);
      res.json(repos);
    });

    this.app.use("/api", api);
  }

  private setupGitHTTP(): void {
    this.app.post("/git/:owner/:name/git-receive-pack", (req, res) => {
      const { owner, name } = req.params;
      if (!this.gitEngine.repoExists(owner, name)) {
        return res.status(404).send("Repository not found");
      }
      res.set("Content-Type", "application/x-git-receive-pack-result");
      res.send("");
    });

    this.app.get("/git/:owner/:name/info/refs", (req, res) => {
      const { owner, name } = req.params;
      const service = req.query.service as string;

      if (!this.gitEngine.repoExists(owner, name)) {
        return res.status(404).send("Repository not found");
      }

      const repoPath = this.gitEngine.getRepoPath(owner, name);
      try {
        const result = require("child_process").execSync(
          `git ${service === "git-upload-pack" ? "upload-pack" : "receive-pack"} --advertise-refs "${repoPath}"`,
          { stdio: "pipe" }
        );
        res.set("Content-Type", `application/x-${service}-advertisement`);
        res.send(result);
      } catch (err: any) {
        res.status(500).send(err.message);
      }
    });
  }

  private setupFrontend(): void {
    this.app.get("/", (req, res) => {
      res.send(this.getHTML("ViseronForge - Git Platform", this.getDashboardHTML()));
    });

    this.app.get("/login", (req, res) => {
      res.send(this.getHTML("ViseronForge - Login", this.getLoginHTML()));
    });

    this.app.get("/register", (req, res) => {
      res.send(this.getHTML("ViseronForge - Register", this.getRegisterHTML()));
    });

    this.app.get("/explore", (req, res) => {
      const repos = this.repoManager.listRepos("public").sort((a, b) => b.stars - a.stars);
      res.send(this.getHTML("Explore - ViseronForge", this.getExploreHTML(repos)));
    });

    this.app.get("/:owner", (req, res) => {
      const user = this.repoManager.getUser(req.params.owner);
      if (!user) return res.status(404).send("User not found");
      const repos = this.repoManager.listRepos(user.username);
      res.send(this.getHTML(`${user.displayName} - ViseronForge`, this.getProfileHTML(user, repos)));
    });

    this.app.get("/:owner/:repo", (req, res) => {
      const repo = this.repoManager.getRepo(req.params.owner, req.params.repo);
      if (!repo) return res.status(404).send("Repository not found");
      res.send(this.getHTML(`${repo.owner}/${repo.name} - ViseronForge`, this.getRepoHTML(repo)));
    });

    this.app.get("/:owner/:repo/tree/:ref(.*)", async (req, res) => {
      const repo = this.repoManager.getRepo(req.params.owner, req.params.repo);
      if (!repo) return res.status(404).send("Repository not found");
      try {
        const tree = await this.gitEngine.getFileTree(req.params.owner, req.params.repo, req.params.ref);
        const readme = await this.gitEngine.getFileContent(req.params.owner, req.params.repo, "README.md", req.params.ref);
        res.send(this.getHTML(`${repo.owner}/${repo.name} - ${req.params.ref}`, this.getTreeHTML(repo, req.params.ref, tree, readme)));
      } catch {
        res.send(this.getHTML(`${repo.owner}/${repo.name}`, this.getRepoHTML(repo)));
      }
    });

    this.app.get("/:owner/:repo/blob/:ref(.*)", async (req, res) => {
      const repo = this.repoManager.getRepo(req.params.owner, req.params.repo);
      if (!repo) return res.status(404).send("Repository not found");
      const parts = req.params.ref.split("/");
      const ref = parts[0];
      const filePath = parts.slice(1).join("/");
      try {
        const content = await this.gitEngine.getFileContent(req.params.owner, req.params.repo, filePath, ref);
        if (content === null) return res.status(404).send("File not found");
        res.send(this.getHTML(`${filePath} - ${repo.owner}/${repo.name}`, this.getFileHTML(repo, filePath, ref, content)));
      } catch {
        res.status(404).send("File not found");
      }
    });

    this.app.get("/:owner/:repo/commits/:branch(*)", async (req, res) => {
      const repo = this.repoManager.getRepo(req.params.owner, req.params.repo);
      if (!repo) return res.status(404).send("Repository not found");
      const commits = await this.gitEngine.getCommits(req.params.owner, req.params.repo, req.params.branch);
      res.send(this.getHTML(`Commits - ${repo.owner}/${repo.name}`, this.getCommitsHTML(repo, req.params.branch, commits)));
    });

    this.app.get("/:owner/:repo/issues", (req, res) => {
      const repo = this.repoManager.getRepo(req.params.owner, req.params.repo);
      if (!repo) return res.status(404).send("Repository not found");
      const issues = this.repoManager.listIssues(`${req.params.owner}/${req.params.repo}`);
      res.send(this.getHTML(`Issues - ${repo.owner}/${repo.name}`, this.getIssuesHTML(repo, issues)));
    });

    this.app.get("/:owner/:repo/pulls", (req, res) => {
      const repo = this.repoManager.getRepo(req.params.owner, req.params.repo);
      if (!repo) return res.status(404).send("Repository not found");
      const prs = this.repoManager.listIssues(`${req.params.owner}/${req.params.repo}`).filter(i => i.isPR);
      res.send(this.getHTML(`Pull Requests - ${repo.owner}/${repo.name}`, this.getIssuesHTML(repo, prs, true)));
    });

    // Static files
    this.app.use("/assets", express.static(PUBLIC_DIR));
  }

  // --- HTML Generators ---
  private getHTML(title: string, content: string): string {
    return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif}
body{background:#0d1117;color:#e6edf3;min-height:100vh}
a{color:#58a6ff;text-decoration:none}
a:hover{text-decoration:underline}
input,textarea,select{background:#21262d;border:1px solid #30363d;color:#e6edf3;padding:8px 12px;border-radius:6px;font-size:14px;width:100%}
input:focus,textarea:focus,select:focus{outline:none;border-color:#58a6ff;box-shadow:0 0 0 3px rgba(88,166,255,0.3)}
button{cursor:pointer;padding:8px 16px;border-radius:6px;font-size:14px;font-weight:500;border:1px solid;transition:all 0.2s}
.btn-primary{background:#238636;color:#fff;border-color:#2ea043}
.btn-primary:hover{background:#2ea043}
.btn-secondary{background:#21262d;color:#c9d1d9;border-color:#30363d}
.btn-secondary:hover{background:#30363d}
.header{background:#161b22;border-bottom:1px solid #30363d;padding:16px 24px;display:flex;align-items:center;justify-content:space-between}
.header-logo{font-size:20px;font-weight:700;color:#f0f6fc;display:flex;align-items:center;gap:8px}
.header-logo span{color:#58a6ff}
.header-nav{display:flex;gap:20px;align-items:center}
.header-nav a{color:#8b949e;font-size:14px}
.header-nav a:hover{color:#e6edf3}
.container{max-width:1280px;margin:0 auto;padding:24px}
.card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:20px;margin-bottom:16px}
.repo-header{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.repo-header h1{font-size:24px}
.repo-header .tag{background:#1f6feb33;color:#58a6ff;padding:2px 8px;border-radius:12px;font-size:12px}
.stats-row{display:flex;gap:24px;margin:12px 0;color:#8b949e;font-size:14px}
.stat{display:flex;align-items:center;gap:4px}
.branch-bar{background:#161b22;border:1px solid #30363d;border-radius:6px;padding:8px 12px;display:flex;align-items:center;gap:12px;margin-bottom:16px;font-size:13px;color:#8b949e}
.file-list{background:#0d1117;border:1px solid #30363d;border-radius:8px;overflow:hidden}
.file-row{display:flex;align-items:center;padding:8px 16px;border-bottom:1px solid #21262d;font-size:14px}
.file-row:last-child{border-bottom:none}
.file-row:hover{background:#161b22}
.file-icon{margin-right:12px;width:16px;text-align:center}
.file-name{flex:1;color:#e6edf3}
.file-msg{flex:2;color:#8b949e;font-size:13px}
.file-time{color:#8b949e;font-size:12px;white-space:nowrap}
.commit-list{background:#0d1117;border:1px solid #30363d;border-radius:8px;overflow:hidden}
.commit-row{padding:12px 16px;border-bottom:1px solid #21262d}
.commit-row:last-child{border-bottom:none}
.commit-msg{font-size:14px;color:#e6edf3;margin-bottom:2px}
.commit-meta{font-size:12px;color:#8b949e}
.commit-hash{color:#58a6ff;font-family:monospace;font-size:12px}
.code-block{background:#161b22;padding:16px;border-radius:8px;overflow-x:auto;font-family:'Cascadia Code','Fira Code',monospace;font-size:13px;line-height:1.5;border:1px solid #30363d}
.repo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
.repo-card{padding:20px}
.repo-card h3{margin-bottom:6px}
.repo-card p{color:#8b949e;font-size:13px;margin-bottom:10px}
.repo-card .topics{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}
.repo-card .topic{background:#1f6feb33;color:#58a6ff;padding:2px 6px;border-radius:10px;font-size:11px}
.auth-form{max-width:420px;margin:60px auto;background:#161b22;border:1px solid #30363d;border-radius:8px;padding:32px}
.auth-form h2{margin-bottom:24px;text-align:center}
.auth-form .field{margin-bottom:16px}
.auth-form label{display:block;font-size:13px;margin-bottom:4px;color:#8b949e}
.profile-header{display:flex;gap:24px;margin-bottom:32px;align-items:center}
.profile-avatar{width:80px;height:80px;border-radius:50%;background:#30363d;display:flex;align-items:center;justify-content:center;font-size:32px;color:#8b949e}
.empty-state{text-align:center;padding:40px;color:#8b949e}
.empty-state p{margin-bottom:12px}
.search-bar{display:flex;gap:8px;margin-bottom:24px}
.search-bar input{flex:1}
footer{border-top:1px solid #30363d;padding:24px;text-align:center;color:#8b949e;font-size:12px;margin-top:40px}
</style></head><body>
<div class="header">
<a href="/" class="header-logo">&#60;<span>V</span>/&#62; <span>ViseronForge</span></a>
<div class="header-nav">
<a href="/explore">Explore</a>
<a href="/trending">Trending</a>
<a href="/login">Sign in</a>
<a href="/register"><button class="btn-primary" style="padding:4px 12px;font-size:12px">Sign up</button></a>
</div></div>
<div class="container">${content}</div>
<footer>ViseronForge &copy; 2026 - Built with TVS Viseron System</footer>
</body></html>`;
  }

  private getDashboardHTML(): string {
    const stars = this.repoManager.listRepos("public").reduce((s, r) => s + r.stars, 0);
    return `<div style="text-align:center;padding:60px 20px">
<h1 style="font-size:48px;margin-bottom:16px">&#60;<span style="color:#58a6ff">V</span>/&#62;</h1>
<h2 style="font-size:28px;margin-bottom:8px">ViseronForge</h2>
<p style="color:#8b949e;font-size:18px;margin-bottom:32px">Your Open Source Git Platform — Built with TVS Superintelligence</p>
<div class="stats-row" style="justify-content:center;font-size:16px">
<span class="stat">📦 ${this.repoManager.listRepos().length} Repositories</span>
<span class="stat">⭐ ${stars} Stars</span>
</div>
<div style="margin-top:32px;display:flex;gap:12px;justify-content:center">
<a href="/explore"><button class="btn-primary">Explore Repos</button></a>
<a href="/register"><button class="btn-secondary">Create Account</button></a>
</div>
<div style="margin-top:48px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:800px;margin-left:auto;margin-right:auto">
<div class="card"><h3>📂 Git Hosting</h3><p style="color:#8b949e;font-size:13px;margin-top:8px">Unlimited public & private repositories with full git protocol support</p></div>
<div class="card"><h3>🔀 Pull Requests</h3><p style="color:#8b949e;font-size:13px;margin-top:8px">Code review with branching, forking, merging, and conflict resolution</p></div>
<div class="card"><h3>🚀 CI/CD Ready</h3><p style="color:#8b949e;font-size:13px;margin-top:8px">Integrated with TVS automation for continuous deployment</p></div>
</div></div>`;
  }

  private getLoginHTML(): string {
    return `<div class="auth-form">
<h2>Sign in to ViseronForge</h2>
<form method="POST" action="/api/auth/login" onsubmit="event.preventDefault();login(this)">
<div class="field"><label>Username</label><input name="username" required></div>
<div class="field"><label>Token / Password</label><input name="password" type="password" required></div>
<button class="btn-primary" style="width:100%;margin-top:8px">Sign in</button>
</form>
<p style="text-align:center;margin-top:16px;font-size:13px;color:#8b949e">New to ViseronForge? <a href="/register">Create an account</a></p>
<script>
async function login(f){const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:f.username.value,password:f.password.value})});const d=await r.json();if(r.ok){localStorage.setItem('vf_token',d.token);localStorage.setItem('vf_user',JSON.stringify(d.user));window.location.href='/'}else{alert(d.error)}}
</script></div>`;
  }

  private getRegisterHTML(): string {
    return `<div class="auth-form">
<h2>Create Account</h2>
<form method="POST" action="/api/auth/register" onsubmit="event.preventDefault();register(this)">
<div class="field"><label>Username</label><input name="username" required></div>
<div class="field"><label>Email</label><input name="email" type="email" required></div>
<div class="field"><label>Display Name</label><input name="displayName"></div>
<div class="field"><label>Token (use as password)</label><input name="password" type="text" required value="vf_${Date.now().toString(36)}"></div>
<button class="btn-primary" style="width:100%;margin-top:8px">Create account</button>
</form>
<p style="text-align:center;margin-top:16px;font-size:13px;color:#8b949e">Already have an account? <a href="/login">Sign in</a></p>
<script>
async function register(f){const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:f.username.value,email:f.email.value,displayName:f.displayName.value,password:f.password.value})});const d=await r.json();if(r.ok){localStorage.setItem('vf_token',d.token);localStorage.setItem('vf_user',JSON.stringify(d.user));window.location.href='/'}else{alert(d.error)}}
</script></div>`;
  }

  private getExploreHTML(repos: ForgeRepo[]): string {
    return `<h2 style="margin-bottom:20px">Explore Repositories</h2>
<div class="search-bar"><input id="searchInput" placeholder="Search repositories..." oninput="filterRepos(this.value)"></div>
<div class="repo-grid" id="repoGrid">
${repos.map(r => `<div class="card repo-card" data-name="${r.owner}/${r.name}" data-desc="${r.description}" data-topics="${r.topics.join(' ')}">
<h3><a href="/${r.owner}/${r.name}">${r.owner}/<span style="font-weight:700">${r.name}</span></a></h3>
<p>${r.description || 'No description'}</p>
${r.topics.length ? `<div class="topics">${r.topics.map(t => `<span class="topic">${t}</span>`).join('')}</div>` : ''}
<div class="stats-row" style="margin:4px 0 0;font-size:12px">
<span class="stat">⭐ ${r.stars}</span>
<span class="stat">⑂ ${r.forks}</span>
<span class="stat">${r.language || 'Unknown'}</span>
</div></div>`).join('')}
</div>
<script>
function filterRepos(q){const ql=q.toLowerCase();document.querySelectorAll('.repo-card').forEach(c=>{const m=c.dataset.name.includes(ql)||c.dataset.desc.includes(ql)||c.dataset.topics.includes(ql);c.style.display=m?'':'none'})}
</script>`;
  }

  private getProfileHTML(user: ForgeUser, repos: ForgeRepo[]): string {
    return `<div class="profile-header">
<div class="profile-avatar">${user.displayName.charAt(0).toUpperCase()}</div>
<div><h2>${user.displayName}</h2><p style="color:#8b949e">${user.username}</p>
<p style="font-size:13px;margin-top:4px">${user.bio || ''}</p>
<div class="stats-row" style="margin-top:8px">
<span class="stat">📦 ${user.repos} repos</span>
<span class="stat">⭐ ${user.stars} stars</span>
</div></div></div>
<h3 style="margin-bottom:16px">Repositories</h3>
${repos.length ? `<div class="repo-grid">${repos.map(r => `<div class="card repo-card"><h3><a href="/${r.owner}/${r.name}">${r.name}</a></h3><p>${r.description || ''}</p><div class="stats-row" style="margin:4px 0 0;font-size:12px"><span class="stat">⭐ ${r.stars}</span><span class="stat">${r.language || ''}</span></div></div>`).join('')}</div>` : `<div class="empty-state"><p>No repositories yet</p></div>`}`;
  }

  private getRepoHTML(repo: ForgeRepo): string {
    return `<div class="repo-header">
<h1>${repo.owner}/<span style="font-weight:700">${repo.name}</span></h1>
<span class="tag">${repo.visibility}</span>
</div>
<p style="color:#8b949e;margin-bottom:12px">${repo.description || 'No description'}</p>
<div class="stats-row">
<span class="stat">⭐ ${repo.stars}</span>
<span class="stat">⑂ ${repo.forks}</span>
<span class="stat">⚠ ${repo.openIssues} issues</span>
<span class="stat">🔀 ${repo.openPRs} PRs</span>
</div>
${repo.topics.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">${repo.topics.map(t => `<span class="topic">${t}</span>`).join('')}</div>` : ''}
<div class="branch-bar">🌿 ${repo.defaultBranch} &nbsp;|&nbsp; <a href="/${repo.owner}/${repo.name}/commits/${repo.defaultBranch}">${repo.stars + repo.forks} commits</a></div>
<div class="file-list">
<div class="file-row" style="background:#161b22;font-weight:500;color:#8b949e;font-size:12px;text-transform:uppercase">
<span class="file-icon"></span>
<span class="file-name">Name</span>
<span class="file-msg">Last commit</span>
<span class="file-time">Date</span>
</div>
<div class="file-row"><span class="file-icon">📄</span><span class="file-name"><a href="/${repo.owner}/${repo.name}/blob/${repo.defaultBranch}/README.md">README.md</a></span><span class="file-msg">Initial setup</span><span class="file-time">now</span></div>
</div>
<div style="margin-top:24px;display:flex;gap:8px">
<a href="/${repo.owner}/${repo.name}/issues"><button class="btn-secondary">⚠ Issues</button></a>
<a href="/${repo.owner}/${repo.name}/pulls"><button class="btn-secondary">🔀 Pull Requests</button></a>
</div>`;
  }

  private async getTreeHTML(repo: ForgeRepo, ref: string, tree: any[], readme: string | null): Promise<string> {
    const readmeHTML = readme ? `<div class="card" style="margin-top:16px"><pre class="code-block" style="border:none;background:transparent;white-space:pre-wrap">${this.escapeHtml(readme)}</pre></div>` : '';
    return `<div class="repo-header">
<h1><a href="/${repo.owner}/${repo.name}" style="color:#58a6ff">${repo.owner}/${repo.name}</a> / <span style="font-weight:700">${ref}</span></h1>
</div>
<div class="branch-bar">🌿 ${ref}</div>
<div class="file-list">
<div class="file-row" style="background:#161b22;font-weight:500;color:#8b949e;font-size:12px;text-transform:uppercase">
<span class="file-icon"></span><span class="file-name">Name</span><span class="file-msg"></span><span class="file-time"></span>
</div>
${tree.map((f: any) => `<div class="file-row">
<span class="file-icon">${f.type === 'dir' ? '📁' : '📄'}</span>
<span class="file-name"><a href="/${repo.owner}/${repo.name}/${f.type === 'dir' ? 'tree' : 'blob'}/${ref}/${f.path}">${f.name}</a></span>
<span class="file-msg" style="color:#8b949e">${f.type === 'dir' ? '' : f.hash?.substring(0, 7) || ''}</span>
<span class="file-time"></span>
</div>`).join('')}
</div>${readmeHTML}`;
  }

  private getFileHTML(repo: ForgeRepo, filePath: string, ref: string, content: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const isImage = ["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext);
    return `<div class="repo-header">
<h1><a href="/${repo.owner}/${repo.name}" style="color:#58a6ff">${repo.owner}/${repo.name}</a> / <a href="/${repo.owner}/${repo.name}/tree/${ref}" style="color:#58a6ff">${ref}</a> / ${filePath}</h1>
</div>
<div class="branch-bar" style="justify-content:space-between">
<span>📄 ${filePath}</span>
<span style="color:#8b949e;font-size:12px">${content.length} bytes</span>
</div>
${isImage ? `<div style="text-align:center;padding:20px"><img src="data:image/${ext};base64,${Buffer.from(content).toString('base64')}" style="max-width:100%;max-height:600px"></div>` : `<pre class="code-block">${this.escapeHtml(content)}</pre>`}`;
  }

  private getCommitsHTML(repo: ForgeRepo, branch: string, commits: any[]): string {
    return `<div class="repo-header"><h1><a href="/${repo.owner}/${repo.name}" style="color:#58a6ff">${repo.owner}/${repo.name}</a> / Commits</h1></div>
<div class="branch-bar">🌿 ${branch} · ${commits.length} commits</div>
<div class="commit-list">
${commits.map((c: any) => `<div class="commit-row">
<div class="commit-msg">${this.escapeHtml(c.message)}</div>
<div class="commit-meta">
<span class="commit-hash">${c.hash?.substring(0, 7) || ''}</span>
 by ${c.author} · ${c.date}
</div>
</div>`).join('')}
</div>`;
  }

  private getIssuesHTML(repo: ForgeRepo, items: ForgeIssue[], isPR: boolean = false): string {
    const title = isPR ? "Pull Requests" : "Issues";
    return `<div class="repo-header"><h1><a href="/${repo.owner}/${repo.name}" style="color:#58a6ff">${repo.owner}/${repo.name}</a> / ${title}</h1></div>
<p style="margin-bottom:16px;color:#8b949e">${items.length} ${isPR ? 'pull requests' : 'issues'}</p>
${items.length ? `<div class="file-list">${items.map(i => `<div class="file-row"><span class="file-icon">${i.isPR ? '🔀' : '⚠'}</span><span class="file-name"><a href="#">${this.escapeHtml(i.title)}</a></span><span class="file-msg" style="color:#8b949e">#${i.id} by ${i.author}</span><span class="file-time" style="color:#8b949e">${i.state}</span></div>`).join('')}</div>` : `<div class="empty-state"><p>No ${isPR ? 'pull requests' : 'issues'} yet</p></div>`}`;
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`\n  ╔════════════════════════════════════════════════╗`);
        console.log(`  ║     VISERONFORGE - Git Platform v1.0          ║`);
        console.log(`  ║     Your Open Source GitHub Alternative       ║`);
        console.log(`  ╠════════════════════════════════════════════════╣`);
        console.log(`  ║  Server:  http://localhost:${this.port}            ║`);
        console.log(`  ║  API:     http://localhost:${this.port}/api        ║`);
        console.log(`  ║  Git:     http://localhost:${this.port}/git        ║`);
        console.log(`  ╠════════════════════════════════════════════════╣`);
        console.log(`  ║  Repos:   ${this.repoManager.listRepos().length}                    ║`);
        console.log(`  ║  Users:   ${this.repoManager.listAllUsers?.()?.length || 0}                    ║`);
        console.log(`  ╚════════════════════════════════════════════════╝\n`);
        resolve();
      });
    });
  }

  stop(): void {
    this.server.close();
  }

  getPort(): number {
    return this.port;
  }
}

// Extend RepoManager for internal use
(RepoManager.prototype as any).listUsers = function() {
  const usersDir = path.join(this["dataDir"], "users");
  if (!fs.existsSync(usersDir)) return [];
  return fs.readdirSync(usersDir).filter(f => f.endsWith(".json")).map(f => fs.readJsonSync(path.join(usersDir, f)));
};

(RepoManager.prototype as any).getIssue = function(repoId: string, issueId: number): ForgeIssue | null {
  const issues = this.listIssues(repoId);
  return issues.find((i: ForgeIssue) => i.id === issueId) || null;
};

(RepoManager.prototype as any).listAllUsers = function(): ForgeUser[] {
  const usersDir = path.join(this["dataDir"], "users");
  if (!fs.existsSync(usersDir)) return [];
  return fs.readdirSync(usersDir).filter(f => f.endsWith(".json")).map(f => fs.readJsonSync(path.join(usersDir, f)));
};
