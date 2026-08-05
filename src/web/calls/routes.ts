import { Router, Request, Response } from "express";
import { CallLogStore, CallRecord } from "./store";
import { CallLearning } from "./learning";

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER || "";
const PUBLIC_URL = process.env.TVS_PUBLIC_URL || "";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function twimlSay(text: string): string {
  return `<Response><Say language="pt-PT" voice="pt-PT-Wavenet-D">${escapeXml(text)}</Say></Response>`;
}

function twimlGather(text: string, gatherUrl: string, prompt?: string): string {
  return `<Response>
<Say language="pt-PT" voice="pt-PT-Wavenet-D">${escapeXml(text)}</Say>
<Gather input="speech" language="pt-PT" timeout="4" speechTimeout="auto" action="${escapeXml(gatherUrl)}" method="POST">
${prompt ? `<Say language="pt-PT" voice="pt-PT-Wavenet-D">${escapeXml(prompt)}</Say>` : ""}
</Gather>
</Response>`;
}

function twimlHangup(text?: string): string {
  return text ? `<Response><Say language="pt-PT" voice="pt-PT-Wavenet-D">${escapeXml(text)}</Say><Hangup/></Response>` : "<Response><Hangup/></Response>";
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function createCallsRouter(store: CallLogStore, learning: CallLearning, logger?: { info?: (message: string, meta?: Record<string, unknown>) => void; log?: (message: string) => void }): Router {
  const router = Router();
  const log = (msg: string) => {
    if (logger && logger.info) logger.info(`[calls] ${msg}`);
    else if (logger && logger.log) logger.log(`[calls] ${msg}`);
    else console.log(`[calls] ${msg}`);
  };

  const gatherUrl = PUBLIC_URL ? `${PUBLIC_URL}/api/calls/twilio/gather` : "/api/calls/twilio/gather";

  router.post("/calls/twilio/inbound", (req: Request, res: Response) => {
    const from = String(req.body?.From || "unknown");
    const to = String(req.body?.To || "");
    const callSid = String(req.body?.CallSid || "");
    const record: CallRecord = {
      id: newId("call"),
      direction: "inbound",
      from,
      to,
      status: "in_progress",
      callSid,
      transcript: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.append(record);
    log(`inbound call from ${from} (${record.id})`);
    res.type("text/xml").send(
      twimlGather(
        "Olá! Falas com o assistente inteligente Trinnity Viseron. Em que posso ajudar?",
        gatherUrl,
        "Estou à escuta."
      )
    );
  });

  router.post("/calls/twilio/gather", async (req: Request, res: Response) => {
    const from = String(req.body?.From || "unknown");
    const to = String(req.body?.To || "");
    const callSid = String(req.body?.CallSid || "");
    const speech = String(req.body?.SpeechResult || req.body?.TranscriptionText || "").trim();
    const record = store.list(100000).reverse().find((r) => (callSid && r.callSid === callSid) || (r.from === from && r.status === "in_progress"));

    if (!speech) {
      if (record) store.update(record.id, { status: "completed" });
      log(`no speech from ${from}; ending call`);
      res.type("text/xml").send(twimlHangup("Sem resposta. Até breve!"));
      return;
    }

    const id = record ? record.id : newId("call");
    const transcript = record && record.transcript ? `${record.transcript}\n${speech}` : speech;
    const createdAt = record ? record.createdAt : new Date().toISOString();
    const updatedAt = new Date().toISOString();
    if (record) {
      store.update(record.id, { transcript, status: "in_progress", updatedAt });
    } else {
      store.append({
        id,
        direction: "inbound",
        from,
        to,
        status: "in_progress",
        callSid,
        transcript,
        createdAt,
        updatedAt,
      });
    }

    let analysis;
    try {
      analysis = await learning.analyzeTranscript(transcript);
    } catch {
      analysis = undefined;
    }
    const baseRecord: CallRecord = { id, direction: "inbound", from, to, status: "in_progress", callSid, transcript, createdAt, updatedAt };
    if (analysis) {
      await learning.learnFromCall({ ...baseRecord, analysis }, analysis);
      store.update(id, { transcript, analysis });
    }
    log(`speech (${id}): ${speech.slice(0, 80)}`);

    let reply: string;
    try {
      reply = await learning.replyToTranscript(transcript);
    } catch {
      reply = "Compreendo. Podes continuar?";
    }
    res.type("text/xml").send(twimlGather(reply, gatherUrl, "Podes continuar. Estou a ouvir."));
  });

  router.post("/calls/twilio/status", (req: Request, res: Response) => {
    const callSid = String(req.body?.CallSid || "");
    const status = String(req.body?.CallStatus || "");
    const duration = parseInt(String(req.body?.CallDuration || "0"), 10) || undefined;
    const record = store.list(100000).find((r) => r.callSid === callSid);
    if (record) store.update(record.id, { status, durationSec: duration });
    res.type("text/xml").send("<Response/>");
  });

  router.post("/calls/outbound", async (req: Request, res: Response) => {
    const to = String(req.body?.to || "").trim();
    if (!to || !TWILIO_SID || !TWILIO_TOKEN || !TWILIO_NUMBER) {
      res.status(400).json({ ok: false, error: "Missing 'to' or Twilio not configured" });
      return;
    }
    const record: CallRecord = {
      id: newId("call"),
      direction: "outbound",
      from: TWILIO_NUMBER,
      to,
      status: "queued",
      transcript: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.append(record);
    try {
      const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");
      const body = new URLSearchParams({
        From: TWILIO_NUMBER,
        To: to,
        Url: `${PUBLIC_URL || "https://viseron-web.onrender.com"}/api/calls/twilio/inbound`,
        StatusCallback: `${PUBLIC_URL || "https://viseron-web.onrender.com"}/api/calls/twilio/status`,
      }).toString();
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Calls.json`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const data: any = await r.json().catch(() => ({}));
      const sid = data?.sid;
      if (sid) {
        store.update(record.id, { status: "queued", callSid: sid });
        res.json({ ok: true, callId: record.id, callSid: sid, to });
      } else {
        store.update(record.id, { status: `error:${r.status}` });
        res.status(502).json({ ok: false, error: data?.message || `Twilio ${r.status}` });
      }
    } catch (e: any) {
      store.update(record.id, { status: `error:${e?.message || e}` });
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  router.get("/calls/logs", (_req: Request, res: Response) => {
    res.json({ ok: true, calls: store.list(200) });
  });

  router.get("/calls/learned", (_req: Request, res: Response) => {
    res.json({ ok: true, learned: learning.getLearned(50) });
  });

  router.get("/calls/status", (_req: Request, res: Response) => {
    res.json({ ok: true, ...store.count(), learned: learning.count(), twilioConfigured: Boolean(TWILIO_SID && TWILIO_TOKEN && TWILIO_NUMBER) });
  });

  return router;
}
