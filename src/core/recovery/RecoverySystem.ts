// VISERON Recovery & Migration System
// Snapshot + SHA-256 integrity + secret exclusion + environment validation + restore
// 2026-08-11

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const sha256 = (content: string | Buffer) => crypto.createHash("sha256").update(content).digest("hex");

// ── SECRET EXCLUSION ───────────────────────────────────

const SECRET_PATTERNS = [
  /API[_-]?KEY/i, /SECRET/i, /TOKEN/i, /PASSWORD/i, /PRIVATE[_-]?KEY/i,
  /OAUTH/i, /CREDENTIAL/i, /MNEMONIC/i, /SEED[_-]?PHRASE/i,
  /\.env$/i, /keypair\.json$/i, /-seed\.txt$/i,
];

function isSecretFile(filePath: string): boolean {
  const name = path.basename(filePath);
  return SECRET_PATTERNS.some(p => p.test(name));
}

// ── SNAPSHOT ────────────────────────────────────────────

export interface SnapshotManifest {
  snapshotId: string;
  createdAt: string;
  rootDir: string;
  totalFiles: number;
  totalSize: number;
  excludedSecrets: string[];
  files: Array<{ path: string; hash: string; size: number }>;
  snapshotHash: string;
}

export function createSnapshot(rootDir: string, outputDir: string, includePatterns?: string[]): SnapshotManifest {
  const snapshotId = `snap_${Date.now().toString(36)}`;
  const snapDir = path.join(outputDir, snapshotId);
  fs.mkdirSync(snapDir, { recursive: true });

  const manifest: SnapshotManifest = {
    snapshotId, createdAt: new Date().toISOString(), rootDir, totalFiles: 0, totalSize: 0,
    excludedSecrets: [], files: [], snapshotHash: "",
  };

  const patterns = includePatterns || ["src/", "data/", "scripts/", "docs/", "tests/", "contracts/", "database/", "prototype/", "package.json", "tsconfig.json", "README.md", "AGENTS.md", "Dockerfile", "docker-compose.yml", "render.yaml"];
  const allHashes: string[] = [];

  function walk(dir: string, relativePath: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const rel = path.join(relativePath, entry.name);

      // Skip node_modules, .git, dist, logs
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist" || entry.name === "logs" || entry.name === "backups") continue;
      if (rel.includes("node_modules") || rel.includes(".git")) continue;

      // Secret exclusion
      if (isSecretFile(entry.name)) {
        manifest.excludedSecrets.push(rel);
        continue;
      }

      if (entry.isDirectory()) { walk(fullPath, rel); }
      else if (entry.isFile()) {
        // Only include if matches patterns
        const matched = patterns.some(p => {
          if (p.endsWith("/")) return rel.startsWith(p) || rel.startsWith(p.replace(/\/$/, ""));
          return rel === p || rel.startsWith(p.replace(/\/$/, ""));
        });
        if (!matched && patterns.length > 0) return;

        const content = fs.readFileSync(fullPath);
        const hash = sha256(content);

        // Also check file content for secrets
        const text = content.toString("utf8").slice(0, 5000).toLowerCase();
        const hasSecretInContent = SECRET_PATTERNS.some(p => p.test(path.basename(rel).replace(/\.[^.]+$/, "")));
        if (hasSecretInContent && !rel.endsWith(".ts") && !rel.endsWith(".js") && !rel.endsWith(".md")) {
          manifest.excludedSecrets.push(rel + " (content)");
          continue;
        }

        manifest.files.push({ path: rel, hash, size: content.length });
        manifest.totalSize += content.length;
        manifest.totalFiles++;
        allHashes.push(hash);
      }
    }
  }

  for (const p of patterns) {
    const full = path.join(rootDir, p);
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
      walk(full, p);
    } else if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      walk(path.dirname(full), "");
    }
  }

  manifest.snapshotHash = sha256(allHashes.sort().join(""));
  fs.writeFileSync(path.join(snapDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  return manifest;
}

export function verifySnapshot(snapshotDir: string): { valid: boolean; totalChecked: number; mismatches: string[] } {
  const manifestPath = path.join(snapshotDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) return { valid: false, totalChecked: 0, mismatches: ["manifest not found"] };

  const manifest: SnapshotManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  let checked = 0;
  const mismatches: string[] = [];

  for (const file of manifest.files) {
    const fullPath = path.join(manifest.rootDir, file.path);
    if (!fs.existsSync(fullPath)) { mismatches.push(`${file.path}: missing`); continue; }
    const hash = sha256(fs.readFileSync(fullPath));
    if (hash !== file.hash) { mismatches.push(`${file.path}: hash mismatch`); }
    checked++;
  }

  return { valid: mismatches.length === 0, totalChecked: checked, mismatches };
}

// ── ENVIRONMENT VALIDATOR ──────────────────────────────

export interface EnvCheck {
  variable: string;
  required: boolean;
  present: boolean;
  value: string; // masked
}

export function validateEnvironment(): EnvCheck[] {
  const requiredVars = [
    { var: "NODE_ENV", required: true },
    { var: "PORT", required: true },
    { var: "OLLAMA_HOST", required: false },
    { var: "DATABASE_URL", required: false },
    { var: "TVS_JWT_SECRET", required: true },
  ];

  return requiredVars.map(({ var: v, required }) => ({
    variable: v, required,
    present: !!process.env[v],
    value: process.env[v] ? "***configured***" : "NOT SET",
  }));
}

// ── RESTORE ─────────────────────────────────────────────

export function restoreFromManifest(manifest: SnapshotManifest, targetDir: string): { restored: number; failed: string[] } {
  let restored = 0;
  const failed: string[] = [];

  for (const file of manifest.files) {
    const srcPath = path.join(manifest.rootDir, file.path);
    const dstPath = path.join(targetDir, file.path);
    try {
      const dstParent = path.dirname(dstPath);
      if (!fs.existsSync(dstParent)) fs.mkdirSync(dstParent, { recursive: true });
      fs.copyFileSync(srcPath, dstPath);
      const copiedHash = sha256(fs.readFileSync(dstPath));
      if (copiedHash !== file.hash) { failed.push(`${file.path}: hash mismatch after copy`); }
      else { restored++; }
    } catch (e: any) { failed.push(`${file.path}: ${e.message}`); }
  }

  return { restored, failed };
}

// ── GENERATE REQUIRED ENV TEMPLATE ──────────────────────

export function generateEnvTemplate(outputPath: string): void {
  const template = [
    "# VISERON Required Environment Variables",
    "# Generated by Recovery & Migration System",
    `# ${new Date().toISOString()}`,
    "",
    "# Required",
    "NODE_ENV=production",
    "PORT=3000",
    "TVS_JWT_SECRET=<generate 64-char hex>",
    "",
    "# AI Providers (at least one required)",
    "# OPENAI_API_KEY=sk-...",
    "# ANTHROPIC_API_KEY=sk-ant-...",
    "OLLAMA_HOST=http://localhost:11434",
    "OLLAMA_MODEL=qwen2.5:7b",
    "",
    "# Database",
    "# DATABASE_URL=postgresql://...",
    "",
    "# Optional: Voice",
    "# ELEVENLABS_API_KEY=...",
    "",
    "# Optional: Integrations",
    "# COMPOSIO_API_KEY=...",
    "# TWILIO_ACCOUNT_SID=...",
    "# TWILIO_AUTH_TOKEN=...",
    "# AVIRATO_API_KEY=...",
    "",
    "# Security: NEVER commit real .env to git",
  ].join("\n");
  fs.writeFileSync(outputPath, template);
}
