import "dotenv/config";
import fs from "fs";
import path from "path";
import { ProviderFactory } from "../src/core/providers/ProviderFactory";

// TVS — CAMPANHA DE APRESENTAÇÃO 45K TELECOM
// Gera as mensagens de marketing de apresentação do VISERON aos clientes de
// telecomunicações, segmentadas por nível (gold/platinum/premium...) e operador,
// em es/EN/pt. Guarda tudo em data/telecom/campaign.json — pronto para envio
// por RCS/SMS (data/telecom/sms.json) e email (data/telecom/emails.json).
// Uso: npm run telecom:campaign

const DATA = path.resolve("data/telecom");
const OUT = path.join(DATA, "campaign.json");

interface Segment {
  key: string;
  label: string;
  count: number;
  operators: Record<string, number>;
}

const PRIORITY = ["platino", "gold", "silver", "bronze", "cantera", "plomo", "sin metal", ""];

async function askAI(prompt: string, system: string): Promise<string> {
  const factory = new ProviderFactory();
  const errors: string[] = [];
  // Prioridade: omniroute → ollama (local)
  for (const id of ["omniroute", "ollama"] as const) {
    try {
      const provider = factory.getProvider(id as any);
      if (!provider) continue;
      const ok = await provider.isAvailable();
      if (!ok) continue;
      const res = await provider.generateResponse({ prompt, systemPrompt: system, temperature: 0.4 });
      if (res.text?.trim()) return res.text.trim();
    } catch (e) {
      errors.push(`${id}: ${(e as Error).message}`);
    }
  }
  throw new Error("Nenhum provider de IA disponível: " + errors.join(" | "));
}

function parseJson(text: string): any {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch { /* noop */ }
  }
  return null;
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

async function main() {
  if (!fs.existsSync(path.join(DATA, "contacts.json"))) {
    console.error("Base não existe. Correr primeiro: npm run import:telecom");
    process.exit(1);
  }
  const contacts = JSON.parse(fs.readFileSync(path.join(DATA, "contacts.json"), "utf-8"));
  const emails = JSON.parse(fs.readFileSync(path.join(DATA, "emails.json"), "utf-8"));
  const sms = JSON.parse(fs.readFileSync(path.join(DATA, "sms.json"), "utf-8"));

  // Segmentação por nível
  const segMap = new Map<string, { count: number; operators: Record<string, number> }>();
  for (const c of contacts) {
    const key = PRIORITY.includes(c.metal) ? (c.metal || "sin metal") : "sin metal";
    const s = segMap.get(key) || { count: 0, operators: {} };
    s.count++;
    if (c.operator) s.operators[c.operator] = (s.operators[c.operator] || 0) + 1;
    segMap.set(key, s);
  }
  const segments: Segment[] = PRIORITY.map((k) => {
    const s = segMap.get(k);
    return { key: k || "sin metal", label: titleCase(k || "Sin segmento"), count: s?.count || 0, operators: s?.operators || {} };
  }).filter((s) => s.count > 0);

  console.log("Segmentos:");
  for (const s of segments) console.log(`  ${s.label}: ${s.count}`);

  // Gera as mensagens de apresentação por segmento com IA
  const messages: Record<string, { rcs: string; email_subject: string; email_body: string }> = {};
  for (const seg of segments) {
    const label = seg.label;
    console.log(`\nGerando mensagens para segmento "${label}" (${seg.count} contactos)...`);
    const prompt = `Eres el equipo de marketing de VISERON, la agencia de IA de Trinnity Viseron System.
Vamos a contactar clientes de telecomunicaciones del segmento "${label}" (clientes de operadoras como ${Object.keys(seg.operators).slice(0, 5).join(", ")}).
Escribe UNA propuesta de mensaje de presentación corto y convincente en ESPAÑOL (idioma principal de Pedro Costa y Trinnity Hurtado), para enviar por RCS/SMS de marca (con logo). Máximo 140 caracteres. No uses emojis. Habla de: ahorro en su factura de móvil/internet, mejor tarifa, servicio al cliente 24/7 con IA en su idioma, sin compromiso.
Además escribe asunto y cuerpo de un email de presentación (máximo 120 palabras), personalizable con nombre y operador.
Devuelve SOLO JSON: {"rcs":"...", "email_subject":"...", "email_body":"..."}`;
    const system = "Eres un copywriter experto en telecomunicaciones. Devuelves solo JSON válido.";
    try {
      const raw = await askAI(prompt, system);
      const j = parseJson(raw);
      if (j && j.rcs && j.email_subject && j.email_body) {
        messages[seg.key] = { rcs: j.rcs, email_subject: j.email_subject, email_body: j.email_body };
      } else {
        throw new Error("JSON inválido");
      }
    } catch (e) {
      const label2 = label.toLowerCase();
      messages[seg.key] = {
        rcs: `Hola ${label2}. VISERON ha analizado tu factura y hay una tarifa mejor para ti: ahorra y habla con IA 24/7. Sin compromiso. Responde AHORA o llama.`,
        email_subject: `${label}: ahorra en tu factura de móvil con VISERON`,
        email_body: `Hola ${label2}, en VISERON usamos IA para encontrar la tarifa ideal según tu consumo real de datos y llamadas. Resultado: hasta un 30% de ahorro en tu factura de móvil e internet, con atención al cliente 24/7 en tu idioma. Sin permanencia ni compromiso. Responde a este email o visita nuestro sitio para un análisis gratuito. — VISERON, Trinnity Viseron System.`,
      };
    }
    console.log(`  RCS: ${messages[seg.key].rcs}`);
  }

  // Totais por canal
  const campaign = {
    generatedAt: new Date().toISOString(),
    brand: "VISERON — Trinnity Viseron System",
    lang: "es",
    segments,
    messages,
    channels: {
      rcs_sms: { recipients: sms.length, note: "Enviar via Twilio RCS/SMS (data/telecom/sms.json)" },
      email: { recipients: emails.length, note: "Enviar via Gmail OAuth (data/telecom/emails.json)" },
    },
    totalReachable: sms.length + emails.length,
  };
  fs.writeFileSync(OUT, JSON.stringify(campaign, null, 2), "utf-8");
  console.log(`\nCampanha gravada em ${OUT}`);
  console.log(`Alcance total: ${campaign.totalReachable} contactos (${sms.length} RCS/SMS + ${emails.length} email)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
