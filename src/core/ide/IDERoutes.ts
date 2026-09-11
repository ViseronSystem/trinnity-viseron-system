import { Router, Request, Response } from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';

const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', '.env'];

const EXTENSION_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescriptreact',
  '.js': 'javascript',
  '.jsx': 'javascriptreact',
  '.json': 'json',
  '.md': 'markdown',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.py': 'python',
  '.sol': 'solidity',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.sh': 'shell',
  '.ps1': 'powershell',
  '.env': 'dotenv',
  '.txt': 'plaintext',
  '.xml': 'xml',
  '.sql': 'sql',
  '.rs': 'rust',
  '.go': 'go',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.rb': 'ruby',
  '.php': 'php',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.dockerfile': 'dockerfile',
  '.test.ts': 'typescript',
  '.test.js': 'javascript',
  '.spec.ts': 'typescript',
  '.spec.js': 'javascript',
  '.cjs': 'javascript',
  '.mjs': 'javascript',
};

const BLOCKED_COMMANDS = [
  'rm -rf /',
  'rm -rf /*',
  'mkfs',
  'format',
  ':(){ :|:& };:',
  'dd if=/dev/zero of=/dev/sda',
  'dd if=/dev/random of=/dev/sda',
  'shutdown',
  'reboot',
  'halt',
  'init 0',
  'init 6',
  ':(){ :|:&',
  'chmod -R 777 /',
  'chown -R',
];

function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();

  if (base === 'dockerfile') return 'dockerfile';
  if (base === '.gitignore') return 'gitignore';
  if (base === '.env') return 'dotenv';
  if (base.endsWith('.test.ts') || base.endsWith('.spec.ts')) return 'typescript';
  if (base.endsWith('.test.js') || base.endsWith('.spec.js')) return 'javascript';
  return EXTENSION_MAP[ext] || 'plaintext';
}

function shouldExclude(name: string): boolean {
  return EXCLUDE_DIRS.includes(name) || name.startsWith('.');
}

function safePath(baseDir: string, targetPath: string): string {
  const resolved = path.resolve(baseDir, targetPath);
  if (!resolved.startsWith(baseDir)) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

function isBlocked(command: string): boolean {
  const lower = command.toLowerCase().trim();
  for (const blocked of BLOCKED_COMMANDS) {
    if (lower.includes(blocked)) {
      return true;
    }
  }
  if (lower.includes('rm -rf') && (lower.includes('/') || lower.includes('..'))) {
    return true;
  }
  return false;
}

export function createIDERouter(dataDir: string): Router {
  const router = Router();

  router.get('/ide/files', async (req: Request, res: Response) => {
    try {
      const targetPath = (req.query.path as string) || '.';
      const resolved = safePath(dataDir, targetPath);

      if (!await fs.pathExists(resolved)) {
        res.status(404).json({ error: 'Path not found' });
        return;
      }

      const stat = await fs.stat(resolved);
      if (!stat.isDirectory()) {
        res.status(400).json({ error: 'Path is not a directory' });
        return;
      }

      const entries = await fs.readdir(resolved);
      const items = [];

      for (const entry of entries) {
        if (shouldExclude(entry)) continue;

        try {
          const entryPath = path.join(resolved, entry);
          const entryStat = await fs.stat(entryPath);
          items.push({
            name: entry,
            type: entryStat.isDirectory() ? 'directory' as const : 'file' as const,
            size: entryStat.size,
            modified: entryStat.mtime.toISOString(),
          });
        } catch {
          continue;
        }
      }

      items.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });

      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list files' });
    }
  });

  router.get('/ide/file', async (req: Request, res: Response) => {
    try {
      const targetPath = req.query.path as string;
      if (!targetPath) {
        res.status(400).json({ error: 'path query parameter required' });
        return;
      }

      const resolved = safePath(dataDir, targetPath);

      if (!await fs.pathExists(resolved)) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const stat = await fs.stat(resolved);
      if (stat.isDirectory()) {
        res.status(400).json({ error: 'Path is a directory, not a file' });
        return;
      }

      if (stat.size > 5 * 1024 * 1024) {
        res.status(413).json({ error: 'File too large (max 5MB)' });
        return;
      }

      const content = await fs.readFile(resolved, 'utf-8');
      const lines = content.split('\n').length;

      res.json({
        path: path.relative(dataDir, resolved),
        content,
        language: detectLanguage(resolved),
        size: stat.size,
        lines,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to read file' });
    }
  });

  router.post('/ide/file', async (req: Request, res: Response) => {
    try {
      const { path: filePath, content } = req.body;
      if (!filePath || content === undefined) {
        res.status(400).json({ error: 'path and content are required' });
        return;
      }

      const resolved = safePath(dataDir, filePath);
      const dir = path.dirname(resolved);
      await fs.ensureDir(dir);
      await fs.writeFile(resolved, content, 'utf-8');

      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save file' });
    }
  });

  router.delete('/ide/file', async (req: Request, res: Response) => {
    try {
      const targetPath = req.query.path as string;
      if (!targetPath) {
        res.status(400).json({ error: 'path query parameter required' });
        return;
      }

      const resolved = safePath(dataDir, targetPath);

      if (!await fs.pathExists(resolved)) {
        res.status(404).json({ error: 'Path not found' });
        return;
      }

      const stat = await fs.stat(resolved);
      if (stat.isDirectory()) {
        await fs.remove(resolved);
      } else {
        await fs.unlink(resolved);
      }

      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete' });
    }
  });

  router.post('/ide/mkdir', async (req: Request, res: Response) => {
    try {
      const { path: dirPath } = req.body;
      if (!dirPath) {
        res.status(400).json({ error: 'path is required' });
        return;
      }

      const resolved = safePath(dataDir, dirPath);
      await fs.ensureDir(resolved);

      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create directory' });
    }
  });

  router.post('/ide/terminal', async (req: Request, res: Response) => {
    try {
      const { command, cwd } = req.body;
      if (!command) {
        res.status(400).json({ error: 'command is required' });
        return;
      }

      if (isBlocked(command)) {
        res.status(403).json({ error: 'Command blocked for safety' });
        return;
      }

      const workingDir = cwd && cwd !== '~' && cwd !== '.' ? safePath(dataDir, cwd) : dataDir;

      if (!await fs.pathExists(workingDir)) {
        res.status(400).json({ error: 'Working directory not found' });
        return;
      }

      try {
        const stdout = execSync(command, {
          cwd: workingDir,
          timeout: 30000,
          encoding: 'utf-8',
          maxBuffer: 1024 * 1024,
          windowsHide: true,
        });

        res.json({ stdout, stderr: '', exitCode: 0 });
      } catch (err: any) {
        res.json({
          stdout: err.stdout || '',
          stderr: err.stderr || err.message || 'Command failed',
          exitCode: err.status || 1,
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Terminal error' });
    }
  });

  router.post('/ide/ai', async (req: Request, res: Response) => {
    try {
      const { message, file, language, context } = req.body;
      if (!message) {
        res.status(400).json({ error: 'message is required' });
        return;
      }

      const systemPrompt = 'You are VISERON AI, a code assistant. Help the user with coding. Be concise. Output code blocks when appropriate.';

      let userPrompt = message;
      if (file) {
        userPrompt = `File: ${file}${language ? ` (${language})` : ''}\n\n${message}`;
      }
      if (context) {
        userPrompt = `${userPrompt}\n\nContext:\n${context}`;
      }

      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5:3b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        const fallback = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'qwen2.5:1.5b',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            stream: false,
          }),
        });

        if (!fallback.ok) {
          res.status(503).json({ error: 'Ollama not available' });
          return;
        }

        const data = await fallback.json() as any;
        res.json({
          response: data.message?.content || 'No response',
          model: 'qwen2.5:1.5b',
          tokens: data.eval_count || 0,
        });
        return;
      }

      const data = await response.json() as any;
      res.json({
        response: data.message?.content || 'No response',
        model: 'qwen2.5:3b',
        tokens: data.eval_count || 0,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'AI request failed' });
    }
  });

  router.get('/ide/git/status', async (_req: Request, res: Response) => {
    try {
      const isRepo = await fs.pathExists(path.join(dataDir, '.git'));
      if (!isRepo) {
        res.json({ branch: null, dirty: false, files: [] });
        return;
      }

      let branch = '';
      try {
        branch = execSync('git rev-parse --abbrev-ref HEAD', {
          cwd: dataDir,
          encoding: 'utf-8',
          timeout: 5000,
          windowsHide: true,
        }).trim();
      } catch {
        branch = 'detached';
      }

      let dirty = false;
      let files: { status: string; path: string }[] = [];
      try {
        const status = execSync('git status --porcelain', {
          cwd: dataDir,
          encoding: 'utf-8',
          timeout: 5000,
          windowsHide: true,
        }).trim();

        dirty = status.length > 0;
        files = status.split('\n').filter(Boolean).map((line) => {
          const statusPart = line.substring(0, 2).trim();
          const filePath = line.substring(3).trim();
          return { status: statusPart, path: filePath };
        });
      } catch {
        dirty = false;
      }

      res.json({ branch, dirty, files });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Git status failed' });
    }
  });

  router.get('/ide/git/log', async (req: Request, res: Response) => {
    try {
      const isRepo = await fs.pathExists(path.join(dataDir, '.git'));
      if (!isRepo) {
        res.json([]);
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const safeLimit = Math.min(limit, 100);

      let output = '';
      try {
        output = execSync(
          `git log --oneline -${safeLimit} --format="%H|%s|%an|%ai"`,
          {
            cwd: dataDir,
            encoding: 'utf-8',
            timeout: 5000,
            windowsHide: true,
          }
        ).trim();
      } catch {
        res.json([]);
        return;
      }

      if (!output) {
        res.json([]);
        return;
      }

      const commits = output.split('\n').filter(Boolean).map((line) => {
        const [hash, message, author, date] = line.split('|');
        return { hash, message, author, date };
      });

      res.json(commits);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Git log failed' });
    }
  });

  return router;
}

export function serveIDE(app: any) {
  app.get('/ide', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../dashboard/public/ide.html'));
  });
}
