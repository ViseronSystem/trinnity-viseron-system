import path from "path";
import { EmailMessage, EmailResult, EmailTransport } from "./types";
import { EmailTokens } from "./tokens";
import { GmailTransport, gmailConfigured, gmailAuthUrl, gmailExchangeCode } from "./gmail";
import { createEmailTransport } from "./transport";
import {
  welcomeEmail,
  verificationEmail,
  resetPasswordEmail,
  invoiceEmail,
  agentReplyEmail,
} from "./templates";

export { gmailConfigured, gmailAuthUrl, gmailExchangeCode };

export class EmailService {
  readonly transport: EmailTransport;
  readonly tokens: EmailTokens;

  constructor(transport: EmailTransport, tokens: EmailTokens) {
    this.transport = transport;
    this.tokens = tokens;
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    return this.transport.send(message);
  }

  async sendWelcome(to: string, name: string, org: string, dashboardUrl: string): Promise<EmailResult> {
    return this.transport.send({ to, ...welcomeEmail(name, org, dashboardUrl) });
  }

  async sendVerification(to: string, name: string): Promise<{ result: EmailResult; code: string }> {
    const token = this.tokens.issue(to, "verify");
    const url = `${this.appUrl()}/verify?code=${token.code}&email=${encodeURIComponent(to)}`;
    const result = await this.transport.send({ to, ...verificationEmail(name, token.code, url) });
    return { result, code: token.code };
  }

  async sendReset(to: string, name: string): Promise<{ result: EmailResult; code: string }> {
    const token = this.tokens.issue(to, "reset");
    const url = `${this.appUrl()}/reset-password?code=${token.code}&email=${encodeURIComponent(to)}`;
    const result = await this.transport.send({ to, ...resetPasswordEmail(name, token.code, url) });
    return { result, code: token.code };
  }

  async sendInvoice(to: string, name: string, plan: string, amount: string, dashboardUrl: string): Promise<EmailResult> {
    return this.transport.send({ to, ...invoiceEmail(name, plan, amount, dashboardUrl) });
  }

  async sendAgentReply(to: string, name: string, reply: string): Promise<EmailResult> {
    return this.transport.send({ to, ...agentReplyEmail(name, reply) });
  }

  private appUrl(): string {
    return process.env.TVS_PUBLIC_URL || "https://www.trinnityviseronsystem.io";
  }
}

export function createEmailService(dataDir: string): EmailService {
  const transport = process.env.EMAIL_PROVIDER === "gmail" ? new GmailTransport() : createEmailTransport(path.join(dataDir, "emails"));
  const tokens = new EmailTokens(path.join(dataDir, "email-tokens.json"));
  return new EmailService(transport, tokens);
}
