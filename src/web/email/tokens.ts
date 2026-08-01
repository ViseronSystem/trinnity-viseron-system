import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface EmailToken {
  code: string;
  email: string;
  purpose: "verify" | "reset";
  expiresAt: number;
  attempts: number;
}

interface TokenFile {
  tokens: EmailToken[];
  verified: Record<string, string>;
}

export class EmailTokens {
  private file: string;
  private data: TokenFile;
  private ttlMs: number;

  constructor(filePath: string, ttlMinutes = 15) {
    this.file = filePath;
    this.ttlMs = ttlMinutes * 60 * 1000;
    this.data = { tokens: [], verified: {} };
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.file)) {
        const parsed = JSON.parse(fs.readFileSync(this.file, "utf8"));
        this.data = {
          tokens: Array.isArray(parsed.tokens) ? parsed.tokens : [],
          verified: parsed.verified || {},
        };
      } else {
        this.persist();
      }
    } catch (e) {
      console.error(`[EmailTokens] Falha ao ler ${this.file}: ${(e as Error).message}`);
    }
  }

  private persist(): void {
    try {
      const dir = path.dirname(this.file);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), "utf8");
      fs.renameSync(tmp, this.file);
    } catch (e) {
      console.error(`[EmailTokens] Falha ao gravar: ${(e as Error).message}`);
    }
  }

  issue(email: string, purpose: "verify" | "reset"): EmailToken {
    const code = crypto.randomInt(100000, 999999).toString();
    this.data.tokens = this.data.tokens.filter((t) => t.email !== email || t.purpose !== purpose);
    const token: EmailToken = { code, email, purpose, expiresAt: Date.now() + this.ttlMs, attempts: 0 };
    this.data.tokens.push(token);
    this.persist();
    return token;
  }

  consume(email: string, purpose: "verify" | "reset", code: string): EmailToken | null {
    const token = this.data.tokens.find((t) => t.email === email && t.purpose === purpose);
    if (!token) return null;
    if (Date.now() > token.expiresAt) return null;
    if (token.code !== code) {
      token.attempts += 1;
      if (token.attempts >= 5) this.data.tokens = this.data.tokens.filter((t) => t !== token);
      this.persist();
      return null;
    }
    this.data.tokens = this.data.tokens.filter((t) => t !== token);
    this.persist();
    return token;
  }

  markVerified(email: string): void {
    this.data.verified[email] = new Date().toISOString();
    this.persist();
  }

  isVerified(email: string): boolean {
    return !!this.data.verified[email];
  }
}
