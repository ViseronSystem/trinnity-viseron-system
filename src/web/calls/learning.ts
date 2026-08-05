import fs from "fs";
import path from "path";
import { CallAnalysis, CallRecord } from "./store";

export interface LearnedCall {
  learnedAt: string;
  callId: string;
  from: string;
  summary: string;
  sentiment: CallAnalysis["sentiment"];
  intents: string[];
  actionItems: string[];
  transcript: string;
}

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b";

export async function askLocalAI(prompt: string, system?: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 90000);
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        system: system || "You are a concise AI assistant of the Trinnity Viseron System. Answer directly in the same language of the prompt.",
        stream: false,
        options: { temperature: 0.4 },
      }),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.response === "string" && data.response.trim() ? data.response.trim() : null;
  } catch {
    return null;
  }
}

export class CallLearning {
  private file: string;

  constructor(dataDir: string) {
    const dir = path.join(dataDir, "knowledge");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, "call-learned.jsonl");
  }

  async analyzeTranscript(transcript: string, context?: string): Promise<CallAnalysis> {
    const fallback = heuristicAnalysis(transcript);
    if (!transcript || transcript.trim().length < 5) return fallback;

    const prompt = `Analyze this phone conversation transcript and return STRICT JSON only with keys: summary (string), sentiment ("positive"|"neutral"|"negative"), intents (array of strings), actionItems (array of strings).

Transcript:
"""${transcript.slice(0, 4000)}"""

${context ? `Context: ${context}` : ""}`;

    const raw = await askLocalAI(prompt, "You output only valid JSON, nothing else.");
    if (raw) {
      const parsed = safeParseJson(raw);
      if (parsed && typeof parsed.summary === "string") {
        return {
          summary: String(parsed.summary).slice(0, 600),
          sentiment: ["positive", "neutral", "negative"].includes(parsed.sentiment) ? parsed.sentiment : "unknown",
          intents: Array.isArray(parsed.intents) ? parsed.intents.map(String).slice(0, 10) : [],
          actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems.map(String).slice(0, 10) : [],
        };
      }
    }
    return fallback;
  }

  async replyToTranscript(transcript: string): Promise<string> {
    const ai = await askLocalAI(
      `You are the TVS phone assistant (Trinnity Viseron System). The caller just said:\n"""${transcript.slice(0, 1200)}"""\n\nReply naturally, helpful, concise (max 2 sentences), in the caller's language.`
    );
    if (ai) return ai;
    return "Compreendo. Podes repetir ou pedir outra coisa?";
  }

  async learnFromCall(record: CallRecord, analysis: CallAnalysis): Promise<LearnedCall> {
    const learned: LearnedCall = {
      learnedAt: new Date().toISOString(),
      callId: record.id,
      from: record.from,
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      intents: analysis.intents,
      actionItems: analysis.actionItems,
      transcript: record.transcript,
    };
    fs.appendFileSync(this.file, JSON.stringify(learned) + "\n", "utf8");
    return learned;
  }

  getLearned(limit = 20): LearnedCall[] {
    try {
      if (!fs.existsSync(this.file)) return [];
      const lines = fs.readFileSync(this.file, "utf8").split("\n").filter((l) => l.trim());
      return lines.slice(-limit).map((l) => JSON.parse(l) as LearnedCall);
    } catch {
      return [];
    }
  }

  count(): number {
    return this.getLearned(100000).length;
  }
}

function safeParseJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {}
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      return JSON.parse(m[0]);
    } catch {}
  }
  return null;
}

function heuristicAnalysis(transcript: string): CallAnalysis {
  const t = transcript.toLowerCase();
  const sentiment: CallAnalysis["sentiment"] = /obrigad|thank|gracias|ótimo|otimo|excelente|perfeito|bom/.test(t)
    ? "positive"
    : /ruim|problema|erro|não gost|no gust|bad|horrível|horrible/.test(t)
      ? "negative"
      : "neutral";
  const intents: string[] = [];
  if (/comprar|preço|preco|assinatura|planos|price|buy|contratar/.test(t)) intents.push("purchase");
  if (/suporte|ajuda|help|problema|dúvida|duda|support/.test(t)) intents.push("support");
  if (/agend|marcar|horário|horario|schedule|appointment/.test(t)) intents.push("scheduling");
  if (/info|saber|informação|informacion|about|saber mais/.test(t)) intents.push("information");
  if (intents.length === 0) intents.push("general");
  const actionItems = intents.includes("purchase") ? ["follow_up_sales"] : intents.includes("support") ? ["follow_up_support"] : [];
  return {
    summary: transcript.slice(0, 200),
    sentiment,
    intents,
    actionItems,
  };
}
