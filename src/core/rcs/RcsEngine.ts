import fs from "fs";
import path from "path";
import crypto from "crypto";

// RcsEngine — canal RCS do TVS.
// Envia mensagens de marca (RCS com fallback automático para SMS/MMS) via Twilio
// Programmable Messaging usando o MessagingServiceSid do número RCS aprovado.
// Sem MessagingServiceSid configurado, entra em modo MOCK (simula entregas e
// regista tudo em data/rcs/broadcasts.json) para validar o fluxo com o logo.
//
// RCS exige (no console Twilio): criar o RCS Sender, submeter a marca (nome + logo)
// à aprovação da Google e anexá-la a um Messaging Service. Depois define no .env:
//   TWILIO_RCS_SERVICE_SID=<MS...>   (obrigatório para RCS real)
//   TWILIO_RCS_CONTENT_SID=<HX...>   (opcional: template rico aprovado)
//   RCS_BRAND_NAME="Trinnity Viseron" (nome de marca exibido — por defeito "VISERON")

export interface RcsMessage {
  id: string;
  broadcastId: string;
  to: string;
  body: string;
  mediaUrl: string;
  status: "queued" | "sent" | "delivered" | "read" | "failed" | "simulated";
  channel: "RCS" | "SMS" | "MMS" | "MOCK";
  sid?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RcsBroadcast {
  id: string;
  label: string;
  body: string;
  mediaUrl: string;
  recipients: number;
  sentAt: string;
  mode: "mock" | "live";
  results: {
    sent: number;
    failed: number;
    queued: number;
    byStatus: Record<string, number>;
  };
  messages: RcsMessage[];
}

export interface RcsSendOptions {
  to: string[] | string;
  message?: string;
  label?: string;
  mediaUrl?: string;
  brandName?: string;
}

const DEFAULTS = {
  body:
    "Hola, soy VISERON — la superinteligencia autónoma de Pedro Costa y Trinnity Hurtado (5000+ mentes, TVS v5). Estoy aquí para conectar contigo: crea tu cuenta, prueba los planes y ve al mundo VISERON. trinnityviseronsystem.io",
  mediaUrl: "",
};

export class RcsEngine {
  private dataDir: string;
  private storeFile: string;
  private sid: string;
  private token: string;
  private serviceSid: string;
  private contentSid: string;
  private brandName: string;
  private publicUrl: string;

  constructor(ctx?: { dataDir?: string }) {
    this.dataDir = ctx?.dataDir || path.join(this.resolveRoot(), "data");
    this.storeFile = path.join(this.dataDir, "rcs", "broadcasts.json");
    this.sid = process.env.TWILIO_ACCOUNT_SID || "";
    this.token = process.env.TWILIO_AUTH_TOKEN || "";
    this.serviceSid = process.env.TWILIO_RCS_SERVICE_SID || process.env.TWILIO_MESSAGING_SERVICE_SID || "";
    this.contentSid = process.env.TWILIO_RCS_CONTENT_SID || "";
    this.brandName = process.env.RCS_BRAND_NAME || "VISERON";
    this.publicUrl = (process.env.TVS_PUBLIC_URL || process.env.RENDER_WEB_URL || "https://viseron-web.onrender.com").replace(/\/+$/, "");
    this.ensureStore();
  }

  private ensureStore(): void {
    const dir = path.dirname(this.storeFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.storeFile)) fs.writeFileSync(this.storeFile, "[]", "utf8");
  }

  private load(): RcsBroadcast[] {
    try {
      const raw = fs.readFileSync(this.storeFile, "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private save(list: RcsBroadcast[]): void {
    this.ensureStore();
    fs.writeFileSync(this.storeFile, JSON.stringify(list, null, 2), "utf8");
  }

  private newId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}${crypto.randomBytes(4).toString("hex")}`;
  }

  /** Sobe a partir de __dirname até encontrar a raiz do projeto (funciona em dev src/ e build dist/src/). */
  private resolveRoot(): string {
    let d = __dirname;
    for (let i = 0; i < 8; i++) {
      if (fs.existsSync(path.join(d, "package.json"))) return d;
      const up = path.dirname(d);
      if (up === d) break;
      d = up;
    }
    return path.resolve(__dirname, "..", "..", "..");
  }

  get logoFile(): string {
    const root = this.resolveRoot();
    const candidates = [
      path.join(root, "mobile", "assets", "icon.png"),
      path.resolve(this.dataDir, "..", "mobile", "assets", "icon.png"),
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;
    return "";
  }

  get logoUrl(): string {
    return `${this.publicUrl}/api/rcs/logo`;
  }

  get mode(): "mock" | "live" {
    return this.sid && this.token && this.serviceSid ? "live" : "mock";
  }

  get configured(): boolean {
    return this.mode === "live";
  }

  /** Estado atual do canal RCS + checklist de go-live. */
  status(): Record<string, any> {
    const broadcasts = this.load();
    let sent = 0;
    let delivered = 0;
    let read = 0;
    let failed = 0;
    let rcs = 0;
    for (const b of broadcasts) {
      for (const m of b.messages) {
        sent++;
        if (m.status === "delivered") delivered++;
        if (m.status === "read") read++;
        if (m.status === "failed") failed++;
        if (m.channel === "RCS") rcs++;
      }
    }
    return {
      ok: true,
      channel: "RCS",
      mode: this.mode,
      configured: this.configured,
      brandName: this.brandName,
      serviceSidConfigured: Boolean(this.serviceSid),
      contentSidConfigured: Boolean(this.contentSid),
      twilioConfigured: Boolean(this.sid && this.token),
      logoUrl: this.logoUrl,
      logoExists: Boolean(this.logoFile),
      stats: { messages: sent, delivered, read, failed, rcs },
      broadcasts: broadcasts.length,
      checklist: {
        "1_twilio_creds": Boolean(this.sid && this.token),
        "2_rcs_sender_approved": Boolean(this.serviceSid),
        "3_messaging_service": Boolean(this.serviceSid),
        "4_brand_logo": Boolean(this.logoFile),
        "5_template_rich": Boolean(this.contentSid) || "optional",
      },
    };
  }

  /**
   * Envia um broadcast RCS (com o logo da TVS como media) para um ou vários números.
   * Live: Twilio Messages API com MessagingServiceSid (RCS real com fallback SMS/MMS).
   * Mock: simula a entrega e regista como canal MOCK para validar o fluxo.
   */
  async sendBroadcast(opts: RcsSendOptions): Promise<{ ok: boolean; broadcast: RcsBroadcast; error?: string }> {
    const recipients = (Array.isArray(opts.to) ? opts.to : [opts.to])
      .map((n) => String(n || "").trim())
      .filter((n) => /^\+?[\d]{7,15}$/.test(n.replace(/[\s()-]/g, "")))
      .map((n) => (n.startsWith("+") ? n : `+${n}`));
    if (!recipients.length) {
      return { ok: false, broadcast: this.emptyBroadcast(""), error: "Nenhum número válido. Usa formato internacional (+351...) ou 10 dígitos." };
    }
    const mediaUrl = opts.mediaUrl || this.logoUrl;
    const body = (opts.message && opts.message.trim()) || DEFAULTS.body;
    const broadcastId = this.newId("rcs");
    const messages: RcsMessage[] = [];

    for (const to of recipients) {
      const msg: RcsMessage = {
        id: this.newId("rcsm"),
        broadcastId,
        to,
        body,
        mediaUrl,
        status: this.mode === "live" ? "queued" : "simulated",
        channel: this.mode === "live" ? "RCS" : "MOCK",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (this.mode === "live") {
        try {
          const sid = await this.sendTwilio(to, body, mediaUrl);
          msg.sid = sid;
          msg.status = "sent";
        } catch (e: any) {
          msg.status = "failed";
          msg.error = String(e?.message || e).slice(0, 300);
        }
      }
      messages.push(msg);
    }

    const byStatus: Record<string, number> = {};
    for (const m of messages) byStatus[m.status] = (byStatus[m.status] || 0) + 1;
    const broadcast: RcsBroadcast = {
      id: broadcastId,
      label: opts.label || `Broadcast ${broadcastId.slice(-6)}`,
      body,
      mediaUrl,
      recipients: messages.length,
      sentAt: new Date().toISOString(),
      mode: this.mode,
      results: {
        sent: messages.filter((m) => m.status === "sent" || m.status === "simulated").length,
        failed: messages.filter((m) => m.status === "failed").length,
        queued: messages.filter((m) => m.status === "queued").length,
        byStatus,
      },
      messages,
    };
    const list = this.load();
    list.push(broadcast);
    this.save(list.slice(-200));
    return { ok: broadcast.results.failed === 0, broadcast };
  }

  private emptyBroadcast(id: string): RcsBroadcast {
    return {
      id,
      label: "",
      body: "",
      mediaUrl: "",
      recipients: 0,
      sentAt: new Date().toISOString(),
      mode: this.mode,
      results: { sent: 0, failed: 0, queued: 0, byStatus: {} },
      messages: [],
    };
  }

  private async sendTwilio(to: string, body: string, mediaUrl: string): Promise<string> {
    const auth = Buffer.from(`${this.sid}:${this.token}`).toString("base64");
    const params: Record<string, string> = {
      MessagingServiceSid: this.serviceSid,
      To: to,
      Body: body,
      MediaUrl: mediaUrl,
      StatusCallback: `${this.publicUrl}/api/rcs/status`,
    };
    if (this.contentSid) {
      delete params.Body;
      delete params.MediaUrl;
      params.ContentSid = this.contentSid;
    }
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString(),
    });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok || !data?.sid) {
      throw new Error(data?.message || `Twilio ${r.status}`);
    }
    return data.sid;
  }

  /** Webhook de estado do Twilio (MessageSid → status, ex. delivered/read/failed). */
  updateStatus(payload: Record<string, any>): boolean {
    const sid = String(payload?.MessageSid || "");
    const status = String(payload?.MessageStatus || "").toLowerCase();
    const channel = payload?.ChannelPrefix ? String(payload.ChannelPrefix).toUpperCase() : undefined;
    if (!sid) return false;
    const list = this.load();
    for (const b of list) {
      for (const m of b.messages) {
        if (m.sid === sid) {
          m.status = status as RcsMessage["status"];
          m.updatedAt = new Date().toISOString();
          if (channel) m.channel = channel as RcsMessage["channel"];
          this.save(list);
          return true;
        }
      }
    }
    return false;
  }

  list(limit = 50): RcsBroadcast[] {
    return this.load().slice(-limit).reverse();
  }
}
