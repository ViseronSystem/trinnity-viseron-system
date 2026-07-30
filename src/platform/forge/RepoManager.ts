import fs from "fs-extra";
import path from "path";

export interface ForgeRepo {
  id: string;
  owner: string;
  name: string;
  description: string;
  visibility: "public" | "private";
  language: string;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  forks: number;
  stars: number;
  watchers: number;
  openIssues: number;
  openPRs: number;
  website: string;
  isFork: boolean;
  forkedFrom?: string;
  isArchived: boolean;
  isTemplate: boolean;
  defaultBranch: string;
  license: string;
  readme: string;
}

export interface ForgeIssue {
  id: number;
  repoId: string;
  title: string;
  body: string;
  state: "open" | "closed";
  author: string;
  assignees: string[];
  labels: string[];
  comments: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  isPR: boolean;
  prBranch?: string;
  prTarget?: string;
  prMerged?: boolean;
}

export interface ForgeUser {
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  bio: string;
  company: string;
  location: string;
  website: string;
  twitter: string;
  createdAt: string;
  repos: number;
  stars: number;
  followers: number;
  following: number;
  isAdmin: boolean;
  token: string;
}

export class RepoManager {
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    fs.ensureDirSync(this.dataDir);
    fs.ensureDirSync(path.join(this.dataDir, "repos"));
    fs.ensureDirSync(path.join(this.dataDir, "users"));
    fs.ensureDirSync(path.join(this.dataDir, "issues"));
  }

  private repoMetaPath(owner: string, name: string): string {
    return path.join(this.dataDir, "repos", `${owner}__${name}.json`);
  }

  private userPath(username: string): string {
    return path.join(this.dataDir, "users", `${username}.json`);
  }

  private issuesPath(repoId: string): string {
    return path.join(this.dataDir, "issues", `${repoId}.json`);
  }

  async createRepo(owner: string, name: string, data: Partial<ForgeRepo>): Promise<ForgeRepo> {
    const now = new Date().toISOString();
    const repo: ForgeRepo = {
      id: `${owner}/${name}`,
      owner,
      name,
      description: data.description || "",
      visibility: data.visibility || "public",
      language: data.language || "",
      topics: data.topics || [],
      createdAt: now,
      updatedAt: now,
      pushedAt: now,
      forks: 0,
      stars: 0,
      watchers: 0,
      openIssues: 0,
      openPRs: 0,
      website: data.website || "",
      isFork: data.isFork || false,
      forkedFrom: data.forkedFrom,
      isArchived: false,
      isTemplate: data.isTemplate || false,
      defaultBranch: data.defaultBranch || "main",
      license: data.license || "",
      readme: data.readme || "",
    };

    fs.writeJsonSync(this.repoMetaPath(owner, name), repo, { spaces: 2 });
    this.incrementUserRepoCount(owner);
    return repo;
  }

  getRepo(owner: string, name: string): ForgeRepo | null {
    const p = this.repoMetaPath(owner, name);
    return fs.existsSync(p) ? fs.readJsonSync(p) : null;
  }

  updateRepo(owner: string, name: string, data: Partial<ForgeRepo>): ForgeRepo | null {
    const repo = this.getRepo(owner, name);
    if (!repo) return null;
    Object.assign(repo, data, { updatedAt: new Date().toISOString(), pushedAt: new Date().toISOString() });
    fs.writeJsonSync(this.repoMetaPath(owner, name), repo, { spaces: 2 });
    return repo;
  }

  deleteRepo(owner: string, name: string): boolean {
    const p = this.repoMetaPath(owner, name);
    if (fs.existsSync(p)) {
      fs.removeSync(p);
      this.decrementUserRepoCount(owner);
      return true;
    }
    return false;
  }

  listRepos(owner?: string, visibility?: "public" | "private"): ForgeRepo[] {
    const files = fs.readdirSync(path.join(this.dataDir, "repos")).filter(f => f.endsWith(".json"));
    return files.map(f => fs.readJsonSync(path.join(this.dataDir, "repos", f)) as ForgeRepo)
      .filter(r => !owner || r.owner === owner)
      .filter(r => !visibility || r.visibility === visibility)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  searchRepos(query: string): ForgeRepo[] {
    const q = query.toLowerCase();
    return this.listRepos("public")
      .filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q) ||
        r.topics.some(t => t.toLowerCase().includes(q))
      );
  }

  async starRepo(owner: string, name: string, username: string): Promise<void> {
    const repo = this.getRepo(owner, name);
    if (repo) {
      repo.stars++;
      fs.writeJsonSync(this.repoMetaPath(owner, name), repo, { spaces: 2 });
    }
  }

  async forkRepo(sourceOwner: string, sourceName: string, targetOwner: string, targetName: string): Promise<ForgeRepo> {
    const source = this.getRepo(sourceOwner, sourceName);
    if (!source) throw new Error(`Source repo ${sourceOwner}/${sourceName} not found`);

    const forked = await this.createRepo(targetOwner, targetName, {
      description: `Fork of ${sourceOwner}/${sourceName} - ${source.description}`,
      visibility: source.visibility,
      isFork: true,
      forkedFrom: `${sourceOwner}/${sourceName}`,
      defaultBranch: source.defaultBranch,
    });

    source.forks++;
    source.updatedAt = new Date().toISOString();
    fs.writeJsonSync(this.repoMetaPath(sourceOwner, sourceName), source, { spaces: 2 });

    return forked;
  }

  // --- Users ---
  async createUser(data: ForgeUser): Promise<ForgeUser> {
    const user: ForgeUser = {
      ...data,
      createdAt: new Date().toISOString(),
      repos: 0,
      stars: 0,
      followers: 0,
      following: 0,
      isAdmin: data.isAdmin || false,
    };
    fs.writeJsonSync(this.userPath(data.username), user, { spaces: 2 });
    return user;
  }

  getUser(username: string): ForgeUser | null {
    const p = this.userPath(username);
    return fs.existsSync(p) ? fs.readJsonSync(p) : null;
  }

  updateUser(username: string, data: Partial<ForgeUser>): ForgeUser | null {
    const user = this.getUser(username);
    if (!user) return null;
    Object.assign(user, data);
    fs.writeJsonSync(this.userPath(username), user, { spaces: 2 });
    return user;
  }

  private incrementUserRepoCount(username: string): void {
    const user = this.getUser(username);
    if (user) { user.repos++; fs.writeJsonSync(this.userPath(username), user, { spaces: 2 }); }
  }

  private decrementUserRepoCount(username: string): void {
    const user = this.getUser(username);
    if (user && user.repos > 0) { user.repos--; fs.writeJsonSync(this.userPath(username), user, { spaces: 2 }); }
  }

  // --- Issues & PRs ---
  listIssues(repoId: string, state?: "open" | "closed"): ForgeIssue[] {
    const p = this.issuesPath(repoId);
    if (!fs.existsSync(p)) return [];
    const issues: ForgeIssue[] = fs.readJsonSync(p);
    return state ? issues.filter(i => i.state === state) : issues;
  }

  createIssue(repoId: string, data: Partial<ForgeIssue>): ForgeIssue {
    const issues = fs.existsSync(this.issuesPath(repoId)) ? fs.readJsonSync(this.issuesPath(repoId)) : [];
    const issue: ForgeIssue = {
      id: issues.length + 1,
      repoId,
      title: data.title || "",
      body: data.body || "",
      state: "open",
      author: data.author || "",
      assignees: data.assignees || [],
      labels: data.labels || [],
      comments: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPR: data.isPR || false,
      prBranch: data.prBranch,
      prTarget: data.prTarget,
      prMerged: false,
    };
    issues.push(issue);
    fs.writeJsonSync(this.issuesPath(repoId), issues, { spaces: 2 });

    const repo = this.getRepo(...repoId.split("/") as [string, string]);
    if (repo) {
      if (issue.isPR) repo.openPRs++;
      else repo.openIssues++;
      fs.writeJsonSync(this.repoMetaPath(repo.owner, repo.name), repo, { spaces: 2 });
    }
    return issue;
  }

  updateIssue(repoId: string, issueId: number, data: Partial<ForgeIssue>): ForgeIssue | null {
    const p = this.issuesPath(repoId);
    if (!fs.existsSync(p)) return null;
    const issues: ForgeIssue[] = fs.readJsonSync(p);
    const idx = issues.findIndex(i => i.id === issueId);
    if (idx === -1) return null;
    Object.assign(issues[idx], data, { updatedAt: new Date().toISOString() });
    fs.writeJsonSync(p, issues, { spaces: 2 });
    return issues[idx];
  }

  closeIssue(repoId: string, issueId: number): ForgeIssue | null {
    return this.updateIssue(repoId, issueId, { state: "closed", closedAt: new Date().toISOString() });
  }

  mergePR(repoId: string, prId: number): ForgeIssue | null {
    return this.updateIssue(repoId, prId, { state: "closed", prMerged: true, closedAt: new Date().toISOString() });
  }

  // --- Activity ---
  getRecentActivity(limit: number = 20): any[] {
    const repos = this.listRepos();
    const activity: any[] = [];
    repos.forEach(r => {
      activity.push({
        type: "push",
        repo: `${r.owner}/${r.name}`,
        message: `Updated ${r.name}`,
        timestamp: r.pushedAt,
      });
    });
    return activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }
}
