import axios from "axios";
import { EmailMessage, EmailResult, EmailTransport } from "./types";

const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

export function gmailConfig(): { clientId: string; clientSecret: string; refreshToken: string; user: string } {
  const clientId = process.env.GMAIL_CLIENT_ID || "";
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || "";
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN || "";
  const user = process.env.GMAIL_USER || "";
  return { clientId, clientSecret, refreshToken, user };
}

export function gmailConfigured(): boolean {
  const c = gmailConfig();
  return !!(c.clientId && c.clientSecret && c.refreshToken && c.user);
}

export function gmailAuthUrl(redirectUri: string): string {
  const c = gmailConfig();
  const params = new URLSearchParams({
    client_id: c.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.send",
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function gmailExchangeCode(code: string, redirectUri: string): Promise<string> {
  const c = gmailConfig();
  const res = await axios.post(OAUTH_TOKEN_URL, new URLSearchParams({
    client_id: c.clientId,
    client_secret: c.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  return res.data?.refresh_token as string;
}

async function gmailAccessToken(): Promise<string> {
  const c = gmailConfig();
  const res = await axios.post(OAUTH_TOKEN_URL, new URLSearchParams({
    client_id: c.clientId,
    client_secret: c.clientSecret,
    refresh_token: c.refreshToken,
    grant_type: "refresh_token",
  }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  const token = res.data?.access_token as string;
  if (!token) throw new Error("Não foi possível obter access token do Gmail");
  return token;
}

function buildRawMessage(message: EmailMessage): string {
  const boundary = `tvs_${Date.now().toString(36)}`;
  const headers = [
    `From: ${process.env.EMAIL_FROM || "Trinnity Viseron System <no-reply@trinnityviseronsystem.io>"}`,
    `To: ${message.to}`,
    `Subject: ${message.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].join("\r\n");

  let body = `--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${message.text}\r\n`;
  if (message.html) {
    body += `--${boundary}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${message.html}\r\n`;
  }
  body += `--${boundary}--`;

  const raw = `${headers}\r\n\r\n${body}`;
  return Buffer.from(raw, "utf8").toString("base64url");
}

export class GmailTransport implements EmailTransport {
  readonly provider = "gmail" as const;
  readonly enabled = gmailConfigured();

  async send(message: EmailMessage): Promise<EmailResult> {
    if (!this.enabled) return { ok: false, provider: "gmail", error: "GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN/USER não configurados" };
    try {
      const token = await gmailAccessToken();
      const res = await axios.post(GMAIL_SEND_URL, { raw: buildRawMessage(message) }, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      return { ok: true, provider: "gmail", messageId: res.data?.id };
    } catch (e: any) {
      return { ok: false, provider: "gmail", error: e.response?.data?.message || e.message };
    }
  }
}
