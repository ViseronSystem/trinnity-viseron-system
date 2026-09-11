import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// TVS — GIT SERVER (GitHub-like repo management)
// Real git operations via CLI + metadata store in data/git/

export interface GitRepository {
  id: string;
  name: string;
  description: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  defaultBranch: string;
  isPublic: boolean;
  owner: string;
  stars: number;
  forks: number;
  topics: string[];
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  email: string;
  date: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface GitBranch {
  name: string;
  isCurrent: boolean;
  lastCommit: string;
  lastCommitDate: string;
  ahead: number;
  behind: number;
}

export interface GitPullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  status: "open" | "closed" | "merged";
  author: string;
  createdAt: string;
  updatedAt: string;
  commits: number;
  additions: number;
  deletions: number;
}

export interface GitFile {
  path: string;
  name: string;
  type: "file" | "directory";
  size: number;
  lastCommit: string;
  lastCommitDate: string;
}

interface RepoMetadata {
  repos: GitRepository[];
  pullRequests: GitPullRequest[];
  nextPRNumber: Record<string, number>;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function git(cwd: string, args: string): string {
  try {
    return execSync(`git ${args}`, { cwd, encoding: "utf8", timeout: 30_000, stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch (e: any) {
    const stderr = e?.stderr?.toString?.() || "";
    const stdout = e?.stdout?.toString?.() || "";
    throw new Error(`git ${args.split(" ")[0]} failed: ${stderr || stdout || e.message}`);
  }
}

function gitSafe(cwd: string, args: string, fallback = ""): string {
  try { return git(cwd, args); } catch { return fallback; }
}

export class GitServer {
  private reposDir: string;
  private metadataFile: string;
  private data: RepoMetadata;

  constructor(dataDir: string) {
    this.reposDir = path.join(dataDir, "git", "repos");
    if (!fs.existsSync(this.reposDir)) fs.mkdirSync(this.reposDir, { recursive: true });
    this.metadataFile = path.join(dataDir, "git", "repos.json");
    this.data = this.loadMetadata();
  }

  // ─── Metadata persistence ────────────────────────────────────────────

  private loadMetadata(): RepoMetadata {
    const base: RepoMetadata = { repos: [], pullRequests: [], nextPRNumber: {} };
    try {
      if (!fs.existsSync(this.metadataFile)) return base;
      const parsed = JSON.parse(fs.readFileSync(this.metadataFile, "utf8")) as Partial<RepoMetadata>;
      return { ...base, ...parsed };
    } catch {
      return base;
    }
  }

  private saveMetadata(): void {
    const dir = path.dirname(this.metadataFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.metadataFile, JSON.stringify(this.data, null, 2), "utf8");
  }

  private findRepo(id: string): GitRepository | undefined {
    return this.data.repos.find((r) => r.id === id);
  }

  private repoDir(id: string): string {
    const repo = this.findRepo(id);
    if (!repo) throw new Error("repository not found");
    return repo.path;
  }

  // ─── Repository CRUD ─────────────────────────────────────────────────

  createRepo(name: string, description = "", isPublic = true, owner = "system"): GitRepository {
    const sanitizedName = name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
    const id = newId("repo");
    const repoPath = path.join(this.reposDir, `${id}-${sanitizedName}`);
    fs.mkdirSync(repoPath, { recursive: true });
    git(repoPath, "init");
    git(repoPath, "config user.name TVS-GitServer");
    git(repoPath, "config user.email git@trinnityviseronsystem.io");

    const now = new Date().toISOString();
    const repo: GitRepository = {
      id,
      name: sanitizedName,
      description: description.slice(0, 500),
      path: repoPath,
      createdAt: now,
      updatedAt: now,
      defaultBranch: "main",
      isPublic,
      owner,
      stars: 0,
      forks: 0,
      topics: [],
    };
    this.data.repos.push(repo);
    this.saveMetadata();
    return repo;
  }

  deleteRepo(id: string): boolean {
    const idx = this.data.repos.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    const repo = this.data.repos[idx];
    try { fs.rmSync(repo.path, { recursive: true, force: true }); } catch { /* ignore */ }
    this.data.pullRequests = this.data.pullRequests.filter((pr) => pr.id !== id);
    this.data.repos.splice(idx, 1);
    this.saveMetadata();
    return true;
  }

  listRepos(): GitRepository[] {
    return [...this.data.repos].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getRepo(id: string): GitRepository | null {
    return this.findRepo(id) || null;
  }

  cloneRepo(id: string, targetPath: string): string {
    const repoPath = this.repoDir(id);
    const dest = path.resolve(targetPath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    git(path.dirname(dest), `clone "${repoPath}" "${dest}"`);
    return dest;
  }

  searchRepos(query: string): GitRepository[] {
    const q = query.toLowerCase();
    return this.data.repos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.topics.some((t) => t.toLowerCase().includes(q))
    );
  }

  // ─── File operations ─────────────────────────────────────────────────

  listFiles(repoId: string, filePath = "", branch = ""): GitFile[] {
    const repoPath = this.repoDir(repoId);
    const repo = this.findRepo(repoId)!;
    const ref = branch || repo.defaultBranch;

    const treeOutput = gitSafe(repoPath, `ls-tree -r --name-only ${ref}`, "");
    const allPaths = treeOutput ? treeOutput.split("\n").filter(Boolean) : [];

    // If filePath is empty, list root-level entries (files + dirs)
    const prefix = filePath ? filePath.replace(/^\//, "").replace(/\/$/, "") + "/" : "";
    const entries = new Map<string, GitFile>();

    for (const p of allPaths) {
      if (prefix && !p.startsWith(prefix)) continue;
      const relative = prefix ? p.slice(prefix.length) : p;
      if (!relative) continue;

      const slashIdx = relative.indexOf("/");
      const isDir = slashIdx !== -1;
      const entryPath = isDir ? prefix + relative.slice(0, slashIdx) : (prefix ? prefix + relative : relative);
      const entryName = isDir ? relative.slice(0, slashIdx) : relative;

      if (entries.has(entryPath)) continue;

      const logLine = gitSafe(repoPath, `log -1 --format="%H" -- "${entryPath}"`, "");
      const dateLine = gitSafe(repoPath, `log -1 --format="%aI" -- "${entryPath}"`, "");
      const sizeStr = gitSafe(repoPath, `ls-tree -r -l ${ref} -- "${entryPath}"`, "");
      const sizeMatch = sizeStr.match(/\s(\d+)\s/);
      const size = isDir ? 0 : (sizeMatch ? parseInt(sizeMatch[1], 10) : 0);

      entries.set(entryPath, {
        path: entryPath,
        name: entryName,
        type: isDir ? "directory" : "file",
        size,
        lastCommit: logLine.slice(0, 8),
        lastCommitDate: dateLine,
      });
    }
    return Array.from(entries.values());
  }

  getFile(repoId: string, filePath: string, branch = ""): { content: string; info: GitFile } {
    const repoPath = this.repoDir(repoId);
    const repo = this.findRepo(repoId)!;
    const ref = branch || repo.defaultBranch;

    const content = git(repoPath, `show ${ref}:${filePath}`);
    const logLine = gitSafe(repoPath, `log -1 --format="%H" -- "${filePath}"`, "");
    const dateLine = gitSafe(repoPath, `log -1 --format="%aI" -- "${filePath}"`, "");

    return {
      content,
      info: {
        path: filePath,
        name: path.posix.basename(filePath),
        type: "file",
        size: Buffer.byteLength(content),
        lastCommit: logLine.slice(0, 8),
        lastCommitDate: dateLine,
      },
    };
  }

  saveFile(repoId: string, filePath: string, content: string, message: string, author = "system"): GitCommit {
    const repoPath = this.repoDir(repoId);
    const full = path.join(repoPath, filePath);
    const dir = path.dirname(full);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(full, content, "utf8");

    git(repoPath, "add -A");
    const authorLine = author.replace(/"/g, '\\"');
    git(repoPath, `commit --author="${authorLine} <${authorLine}@tvs>"" -m "${message.replace(/"/g, '\\"')}"`);

    const hash = git(repoPath, "rev-parse HEAD");
    const statOutput = gitSafe(repoPath, `diff --stat HEAD~1 HEAD`, "0 files changed");
    const filesMatch = statOutput.match(/(\d+) files? changed/);
    const insMatch = statOutput.match(/(\d+) insertions?/);
    const delMatch = statOutput.match(/(\d+) deletions?/);

    const repo = this.findRepo(repoId)!;
    repo.updatedAt = new Date().toISOString();
    this.saveMetadata();

    return {
      hash,
      shortHash: hash.slice(0, 8),
      message,
      author,
      email: `${author}@tvs`,
      date: new Date().toISOString(),
      filesChanged: filesMatch ? parseInt(filesMatch[1], 10) : 0,
      insertions: insMatch ? parseInt(insMatch[1], 10) : 0,
      deletions: delMatch ? parseInt(delMatch[1], 10) : 0,
    };
  }

  // ─── Branches ────────────────────────────────────────────────────────

  createBranch(repoId: string, name: string, from = ""): GitBranch {
    const repoPath = this.repoDir(repoId);
    const repo = this.findRepo(repoId)!;
    const startRef = from || repo.defaultBranch;
    git(repoPath, `branch ${name} ${startRef}`);
    return this.describeBranch(repoPath, name, repo.defaultBranch);
  }

  listBranches(repoId: string): GitBranch[] {
    const repoPath = this.repoDir(repoId);
    const repo = this.findRepo(repoId)!;
    const current = gitSafe(repoPath, "branch --show-current", "");
    const branchOutput = git(repoPath, "branch --format=%(refname:short)");
    const branches = branchOutput.split("\n").filter(Boolean);

    return branches.map((b) => this.describeBranch(repoPath, b, repo.defaultBranch, b === current));
  }

  private describeBranch(repoPath: string, name: string, defaultBranch: string, isCurrent = false): GitBranch {
    const currentBranch = isCurrent ? name : gitSafe(repoPath, "branch --show-current", "");
    const lastCommit = gitSafe(repoPath, `log -1 --format="%H" ${name}`, "");
    const lastDate = gitSafe(repoPath, `log -1 --format="%aI" ${name}`, "");
    const aheadStr = gitSafe(repoPath, `rev-list --count ${defaultBranch}..${name}`, "0");
    const behindStr = gitSafe(repoPath, `rev-list --count ${name}..${defaultBranch}`, "0");

    return {
      name,
      isCurrent: name === currentBranch,
      lastCommit: lastCommit.slice(0, 8),
      lastCommitDate: lastDate,
      ahead: parseInt(aheadStr, 10) || 0,
      behind: parseInt(behindStr, 10) || 0,
    };
  }

  switchBranch(repoId: string, name: string): void {
    const repoPath = this.repoDir(repoId);
    git(repoPath, `checkout ${name}`);
  }

  // ─── Commits / Log / Diff ────────────────────────────────────────────

  getLog(repoId: string, branch = "", limit = 20): GitCommit[] {
    const repoPath = this.repoDir(repoId);
    const repo = this.findRepo(repoId)!;
    const ref = branch || repo.defaultBranch;

    const SEP = "---TVS_SEP---";
    const format = `%H${SEP}%h${SEP}%s${SEP}%an${SEP}%ae${SEP}%aI`;
    const logOutput = git(repoPath, `log ${ref} --format="${format}" -n ${limit}`);
    if (!logOutput) return [];

    return logOutput.split("\n").filter(Boolean).map((line) => {
      const [hash, shortHash, message, author, email, date] = line.split(SEP);
      const stat = gitSafe(repoPath, `diff --stat ${hash}~1 ${hash}`, "0 files changed");
      const filesMatch = stat.match(/(\d+) files? changed/);
      const insMatch = stat.match(/(\d+) insertions?/);
      const delMatch = stat.match(/(\d+) deletions?/);
      return {
        hash,
        shortHash,
        message,
        author,
        email,
        date,
        filesChanged: filesMatch ? parseInt(filesMatch[1], 10) : 0,
        insertions: insMatch ? parseInt(insMatch[1], 10) : 0,
        deletions: delMatch ? parseInt(delMatch[1], 10) : 0,
      };
    });
  }

  getCommit(repoId: string, hash: string): GitCommit | null {
    const repoPath = this.repoDir(repoId);
    const SEP = "---TVS_SEP---";
    const format = `%H${SEP}%h${SEP}%s${SEP}%an${SEP}%ae${SEP}%aI`;
    const line = gitSafe(repoPath, `log -1 --format="${format}" ${hash}`, "");
    if (!line) return null;
    const [fullHash, shortHash, message, author, email, date] = line.split(SEP);
    const stat = gitSafe(repoPath, `diff --stat ${fullHash}~1 ${fullHash}`, "0 files changed");
    const filesMatch = stat.match(/(\d+) files? changed/);
    const insMatch = stat.match(/(\d+) insertions?/);
    const delMatch = stat.match(/(\d+) deletions?/);
    return {
      hash: fullHash,
      shortHash,
      message,
      author,
      email,
      date,
      filesChanged: filesMatch ? parseInt(filesMatch[1], 10) : 0,
      insertions: insMatch ? parseInt(insMatch[1], 10) : 0,
      deletions: delMatch ? parseInt(delMatch[1], 10) : 0,
    };
  }

  getDiff(repoId: string, from = "HEAD~1", to = "HEAD"): string {
    const repoPath = this.repoDir(repoId);
    return gitSafe(repoPath, `diff ${from} ${to}`, "");
  }

  getStatus(repoId: string): string {
    const repoPath = this.repoDir(repoId);
    return git(repoPath, "status --short");
  }

  // ─── Pull Requests ───────────────────────────────────────────────────

  createPR(repoId: string, title: string, description: string, sourceBranch: string, targetBranch: string, author = "system"): GitPullRequest {
    if (!this.findRepo(repoId)) throw new Error("repository not found");
    if (!this.data.nextPRNumber[repoId]) this.data.nextPRNumber[repoId] = 1;
    const number = this.data.nextPRNumber[repoId]++;

    // count commits, additions, deletions between branches
    const repoPath = this.repoDir(repoId);
    const logOutput = gitSafe(repoPath, `log --oneline ${targetBranch}..${sourceBranch}`, "");
    const commitCount = logOutput ? logOutput.split("\n").filter(Boolean).length : 0;

    const stat = gitSafe(repoPath, `diff --stat ${targetBranch}..${sourceBranch}`, "0 files changed");
    const insMatch = stat.match(/(\d+) insertions?/);
    const delMatch = stat.match(/(\d+) deletions?/);

    const now = new Date().toISOString();
    const pr: GitPullRequest = {
      id: newId("pr"),
      number,
      title: title.slice(0, 200),
      description: description.slice(0, 5000),
      sourceBranch,
      targetBranch,
      status: "open",
      author,
      createdAt: now,
      updatedAt: now,
      commits: commitCount,
      additions: insMatch ? parseInt(insMatch[1], 10) : 0,
      deletions: delMatch ? parseInt(delMatch[1], 10) : 0,
    };
    this.data.pullRequests.push(pr);
    this.saveMetadata();
    return pr;
  }

  listPRs(repoId: string, status?: string): GitPullRequest[] {
    return this.data.pullRequests
      .filter((pr) => pr.id === repoId && (!status || pr.status === status))
      .sort((a, b) => b.number - a.number);
  }

  mergePR(repoId: string, prNumber: number): GitPullRequest | null {
    const pr = this.data.pullRequests.find((p) => p.id === repoId && p.number === prNumber);
    if (!pr || pr.status !== "open") return null;

    const repoPath = this.repoDir(repoId);
    git(repoPath, `checkout ${pr.targetBranch}`);
    git(repoPath, `merge ${pr.sourceBranch} --no-edit -m "Merge PR #${prNumber}: ${pr.title}"`);

    pr.status = "merged";
    pr.updatedAt = new Date().toISOString();
    this.saveMetadata();

    const repo = this.findRepo(repoId)!;
    repo.updatedAt = new Date().toISOString();
    this.saveMetadata();
    return pr;
  }
}
