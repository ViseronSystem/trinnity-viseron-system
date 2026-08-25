import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import axios from "axios";
import { EmailMessage, EmailResult, EmailTransport, EmailProvider } from "./types";

const DEFAULT_FROM = process.env.EMAIL_FROM || "Trinnity Viseron System <no-reply@trinnityviseronsystem.io>";

function pickProvider(): EmailProvider {
  const p = (process.env.EMAIL_PROVIDER || "dev").toLowerCase();
  if (p === "smtp" || p === "resend" || p === "sendgrid" || p === "gmail") return p;
  return "dev";
}

class DevTransport implements EmailTransport {
  readonly provider: EmailProvider = "dev";
  readonly enabled = true;
  private outDir: string;

  constructor(outDir: string) {
    this.outDir = outDir;
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    const id = `dev_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const file = path.join(this.outDir, `${id}.json`);
    const record = { id, from: DEFAULT_FROM, ...message, sentAt: new Date().toISOString() };
    fs.writeFileSync(file, JSON.stringify(record, null, 2));
    return { ok: true, provider: "dev", messageId: id };
  }
}

class SmtpTransport implements EmailTransport {
  readonly provider: EmailProvider = "smtp";
  readonly enabled = true;
  private transporter: ReturnType<typeof nodemailer.createTransport>;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: (process.env.SMTP_SECURE || "false") === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || "" }
        : undefined,
    });
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: DEFAULT_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments,
      });
      return { ok: true, provider: "smtp", messageId: info.messageId };
    } catch (e: any) {
      return { ok: false, provider: "smtp", error: e.message };
    }
  }
}

class HttpTransport implements EmailTransport {
  readonly provider: EmailProvider;
  readonly enabled = true;
  private kind: "resend" | "sendgrid";
  private apiKey: string;

  constructor(kind: "resend" | "sendgrid") {
    this.kind = kind;
    this.provider = kind;
    this.apiKey = kind === "resend" ? process.env.RESEND_API_KEY || "" : process.env.SENDGRID_API_KEY || "";
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      if (this.kind === "resend") {
        const res = await axios.post(
          "https://api.resend.com/emails",
          { from: DEFAULT_FROM, to: [message.to], subject: message.subject, text: message.text, html: message.html },
          { headers: { Authorization: `Bearer ${this.apiKey}` } }
        );
        return { ok: true, provider: "resend", messageId: res.data?.id };
      }
      const res = await axios.post(
        "https://api.sendgrid.com/v3/mail/send",
        {
          personalizations: [{ to: [{ email: message.to }] }],
          from: { email: "no-reply@trinnityviseronsystem.io", name: "Trinnity Viseron System" },
          subject: message.subject,
          content: [
            { type: "text/plain", value: message.text },
            { type: "text/html", value: message.html || "" },
          ],
        },
        { headers: { Authorization: `Bearer ${this.apiKey}` } }
      );
      return { ok: true, provider: "sendgrid", messageId: res.headers?.["x-message-id"] };
    } catch (e: any) {
      return { ok: false, provider: this.kind, error: e.response?.data ? JSON.stringify(e.response.data) : e.message };
    }
  }
}

export function createEmailTransport(outDir?: string): EmailTransport {
  const provider = pickProvider();
  switch (provider) {
    case "smtp":
      return new SmtpTransport();
    case "resend":
    case "sendgrid":
      return new HttpTransport(provider);
    case "gmail":
      const { GmailTransport } = require("./gmail");
      return new GmailTransport();
    case "dev":
    default:
      return new DevTransport(outDir || path.resolve(process.cwd(), "data", "emails"));
  }
}
