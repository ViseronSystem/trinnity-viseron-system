export type EmailProvider = "dev" | "smtp" | "resend" | "sendgrid" | "gmail";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{ filename: string; content: string | Buffer; contentType?: string }>;
}

export interface EmailResult {
  ok: boolean;
  provider: EmailProvider;
  messageId?: string;
  error?: string;
}

export interface EmailTransport {
  readonly provider: EmailProvider;
  readonly enabled: boolean;
  send(message: EmailMessage): Promise<EmailResult>;
}
