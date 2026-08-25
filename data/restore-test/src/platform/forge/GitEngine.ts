import fs from "fs-extra";
import path from "path";
import { execSync, spawn } from "child_process";

interface GitCommit {
  hash: string;
  author: string;
  email: string;
  message: string;
  date: string;
  branch: string;
}

interface GitBranch {
  name: string;
  latestCommit: string;
  isDefault: boolean;
}

interface GitTag {
  name: string;
  commitHash: string;
  message: string;
}

interface DiffEntry {
  file: string;
  status: "added" | "modified" | "deleted" | "renamed";
  additions: number;
  deletions: number;
  patch?: string;
}

export class GitEngine {
  private reposDir: string;

  constructor(reposDir: string) {
    this.reposDir = reposDir;
    fs.ensureDirSync(this.reposDir);
  }

  getRepoPath(owner: string, repo: string): string {
    return path.join(this.reposDir, owner, repo + ".git");
  }

  repoExists(owner: string, repo: string): boolean {
    return fs.existsSync(this.getRepoPath(owner, repo));
  }

  async createRepo(owner: string, repo: string, isBare: boolean = true): Promise<void> {
    const repoPath = this.getRepoPath(owner, repo);
    if (fs.existsSync(repoPath)) throw new Error(`Repo ${owner}/${repo} already exists`);

    fs.ensureDirSync(path.dirname(repoPath));

    if (isBare) {
      execSync(`git init --bare "${repoPath}"`, { stdio: "pipe" });
    } else {
      execSync(`git init "${repoPath}"`, { stdio: "pipe" });
    }

    const description = fs.readFileSync(path.join(repoPath, "description"), "utf-8").replace(
      "Unnamed repository; edit this file to 'name' the repository.",
      `${owner}/${repo} - ViseronForge repository`
    );
    fs.writeFileSync(path.join(repoPath, "description"), description);
  }

  async deleteRepo(owner: string, repo: string): Promise<void> {
    const repoPath = this.getRepoPath(owner, repo);
    if (!fs.existsSync(repoPath)) throw new Error(`Repo ${owner}/${repo} not found`);
    await fs.remove(repoPath);
  }

  async forkRepo(sourceOwner: string, sourceRepo: string, targetOwner: string, targetRepo: string): Promise<void> {
    const sourcePath = this.getRepoPath(sourceOwner, sourceRepo);
    const targetPath = this.getRepoPath(targetOwner, targetRepo);

    if (!fs.existsSync(sourcePath)) throw new Error(`Source repo ${sourceOwner}/${sourceRepo} not found`);
    if (fs.existsSync(targetPath)) throw new Error(`Target repo ${targetOwner}/${targetRepo} already exists`);

    fs.ensureDirSync(path.dirname(targetPath));
    execSync(`git clone --bare "${sourcePath}" "${targetPath}"`, { stdio: "pipe" });

    fs.writeFileSync(
      path.join(targetPath, "description"),
      `Fork of ${sourceOwner}/${sourceRepo} - ${targetOwner}/${targetRepo}`
    );
  }

  async getBranches(owner: string, repo: string): Promise<GitBranch[]> {
    const repoPath = this.getRepoPath(owner, repo);
    if (!fs.existsSync(repoPath)) throw new Error(`Repo ${owner}/${repo} not found`);

    const branches: GitBranch[] = [];
    const defaultBranch = this.getDefaultBranch(owner, repo);

    const raw = execSync(`git branch -a`, { cwd: repoPath, stdio: "pipe" }).toString();
    raw.split("\n").filter(Boolean).forEach(line => {
      const name = line.trim().replace("remotes/origin/", "").replace(/^\*?\s*/, "");
      if (name && !name.includes("HEAD")) {
        branches.push({
          name,
          latestCommit: this.getLatestCommit(owner, repo, name),
          isDefault: name === defaultBranch,
        });
      }
    });
    return branches;
  }

  getDefaultBranch(owner: string, repo: string): string {
    const repoPath = this.getRepoPath(owner, repo);
    try {
      const head = execSync(`git symbolic-ref HEAD`, { cwd: repoPath, stdio: "pipe" }).toString().trim();
      return head.replace("refs/heads/", "");
    } catch {
      return "main";
    }
  }

  setDefaultBranch(owner: string, repo: string, branch: string): void {
    const repoPath = this.getRepoPath(owner, repo);
    execSync(`git symbolic-ref HEAD refs/heads/${branch}`, { cwd: repoPath, stdio: "pipe" });
  }

  private getLatestCommit(owner: string, repo: string, branch: string): string {
    const repoPath = this.getRepoPath(owner, repo);
    try {
      return execSync(`git rev-parse ${branch}`, { cwd: repoPath, stdio: "pipe" }).toString().trim();
    } catch {
      return "";
    }
  }

  async getCommits(owner: string, repo: string, branch: string = "main", limit: number = 50): Promise<GitCommit[]> {
    const repoPath = this.getRepoPath(owner, repo);
    if (!fs.existsSync(repoPath)) throw new Error(`Repo ${owner}/${repo} not found`);

    const commits: GitCommit[] = [];
    try {
      const raw = execSync(
        `git log ${branch} --format="%H|%an|%ae|%s|%ai" --max-count=${limit}`,
        { cwd: repoPath, stdio: "pipe" }
      ).toString();

      raw.split("\n").filter(Boolean).forEach(line => {
        const [hash, author, email, ...msgParts] = line.split("|");
        const message = msgParts.join("|");
        const datePart = message.split(" ").slice(-5).join(" ");
        const cleanMsg = message.replace(datePart, "").trim();
        commits.push({
          hash: hash?.trim() || "",
          author: author?.trim() || "",
          email: email?.trim() || "",
          message: cleanMsg,
          date: datePart,
          branch,
        });
      });
    } catch {}
    return commits;
  }

  async getCommitDiff(owner: string, repo: string, commitHash: string): Promise<DiffEntry[]> {
    const repoPath = this.getRepoPath(owner, repo);
    const diffs: DiffEntry[] = [];

    try {
      const raw = execSync(
        `git diff-tree --no-commit-id -r -p ${commitHash}`,
        { cwd: repoPath, stdio: "pipe", maxBuffer: 10 * 1024 * 1024 }
      ).toString();

      let currentFile = "";
      let currentPatch: string[] = [];
      let additions = 0;
      let deletions = 0;
      let status: "added" | "modified" | "deleted" | "renamed" = "modified";

      raw.split("\n").forEach(line => {
        if (line.startsWith("diff --git")) {
          if (currentFile && currentPatch.length > 0) {
            diffs.push({ file: currentFile, status, additions, deletions, patch: currentPatch.join("\n") });
          }
          const match = line.match(/diff --git a\/(.+?) b\/(.+?)$/);
          currentFile = match?.[1] || "";
          currentPatch = [line];
          additions = 0;
          deletions = 0;
          status = "modified";
        } else if (line.startsWith("new file")) {
          status = "added";
          currentPatch.push(line);
        } else if (line.startsWith("deleted file")) {
          status = "deleted";
          currentPatch.push(line);
        } else if (line.startsWith("rename from")) {
          status = "renamed";
          currentPatch.push(line);
        } else if (line.startsWith("+") && !line.startsWith("+++")) {
          additions++;
          currentPatch.push(line);
        } else if (line.startsWith("-") && !line.startsWith("---")) {
          deletions++;
          currentPatch.push(line);
        } else {
          currentPatch.push(line);
        }
      });

      if (currentFile && currentPatch.length > 0) {
        diffs.push({ file: currentFile, status, additions, deletions, patch: currentPatch.join("\n") });
      }
    } catch {}
    return diffs;
  }

  async getFileContent(owner: string, repo: string, filePath: string, ref: string = "main"): Promise<string | null> {
    const repoPath = this.getRepoPath(owner, repo);
    try {
      return execSync(`git show ${ref}:${filePath}`, { cwd: repoPath, stdio: "pipe" }).toString();
    } catch {
      return null;
    }
  }

  async getFileTree(owner: string, repo: string, ref: string = "main", dirPath: string = ""): Promise<any[]> {
    const repoPath = this.getRepoPath(owner, repo);
    const files: any[] = [];

    try {
      const raw = execSync(
        `git ls-tree ${ref}:${dirPath}`,
        { cwd: repoPath, stdio: "pipe" }
      ).toString();

      raw.split("\n").filter(Boolean).forEach(line => {
        const parts = line.split(/\s+/);
        if (parts.length >= 4) {
          const [mode, type, hash, ...nameParts] = parts;
          files.push({
            mode,
            type: type === "tree" ? "dir" : "file",
            hash,
            name: nameParts.join(" "),
            path: dirPath ? `${dirPath}/${nameParts.join(" ")}` : nameParts.join(" "),
          });
        }
      });
    } catch {}
    return files;
  }

  async getTags(owner: string, repo: string): Promise<GitTag[]> {
    const repoPath = this.getRepoPath(owner, repo);
    const tags: GitTag[] = [];

    try {
      const raw = execSync(`git tag -l --format="%(refname:short)|%(objectname)|%(contents:subject)"`, {
        cwd: repoPath, stdio: "pipe"
      }).toString();

      raw.split("\n").filter(Boolean).forEach(line => {
        const [name, commitHash, ...msgParts] = line.split("|");
        tags.push({ name: name?.trim() || "", commitHash: commitHash?.trim() || "", message: msgParts.join("|").trim() });
      });
    } catch {}
    return tags;
  }

  async createTag(owner: string, repo: string, tagName: string, commitHash: string, message: string = ""): Promise<void> {
    const repoPath = this.getRepoPath(owner, repo);
    execSync(`git tag -a ${tagName} ${commitHash} -m "${message}"`, { cwd: repoPath, stdio: "pipe" });
  }

  async createBranch(owner: string, repo: string, branchName: string, sourceRef: string = "main"): Promise<void> {
    const repoPath = this.getRepoPath(owner, repo);
    execSync(`git branch ${branchName} ${sourceRef}`, { cwd: repoPath, stdio: "pipe" });
  }

  async deleteBranch(owner: string, repo: string, branchName: string): Promise<void> {
    const repoPath = this.getRepoPath(owner, repo);
    execSync(`git branch -D ${branchName}`, { cwd: repoPath, stdio: "pipe" });
  }

  async mergeBranch(owner: string, repo: string, sourceBranch: string, targetBranch: string): Promise<string> {
    const repoPath = this.getRepoPath(owner, repo);
    const tmpDir = path.join(this.reposDir, `__tmp_merge_${Date.now()}`);

    try {
      fs.ensureDirSync(tmpDir);
      execSync(`git clone "${repoPath}" "${tmpDir}"`, { stdio: "pipe" });
      execSync(`git checkout ${targetBranch}`, { cwd: tmpDir, stdio: "pipe" });
      const result = execSync(`git merge ${sourceBranch} --no-edit`, { cwd: tmpDir, stdio: "pipe" }).toString();
      execSync(`git push origin ${targetBranch}`, { cwd: tmpDir, stdio: "pipe" });
      return result;
    } finally {
      await fs.remove(tmpDir);
    }
  }

  async repoSize(owner: string, repo: string): Promise<number> {
    const repoPath = this.getRepoPath(owner, repo);
    let total = 0;
    const walkDir = (dir: string) => {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(entry => {
          const full = path.join(dir, entry);
          const stat = fs.statSync(full);
          if (stat.isDirectory()) walkDir(full);
          else total += stat.size;
        });
      }
    };
    walkDir(repoPath);
    return total;
  }

  async getRepoInfo(owner: string, repo: string): Promise<any> {
    const repoPath = this.getRepoPath(owner, repo);
    const branches = await this.getBranches(owner, repo);
    const tags = await this.getTags(owner, repo);
    const defaultBranch = this.getDefaultBranch(owner, repo);
    const size = await this.repoSize(owner, repo);
    let lastCommit: GitCommit | null = null;
    const commits = await this.getCommits(owner, repo, defaultBranch, 1);
    if (commits.length > 0) lastCommit = commits[0];

    return {
      owner,
      name: repo,
      defaultBranch,
      branches: branches.length,
      tags: tags.length,
      size,
      sizeHuman: size < 1024 ? `${size} B` : size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`,
      lastCommit,
      isBare: true,
    };
  }
}
