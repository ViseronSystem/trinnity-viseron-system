import fs from "fs";
import path from "path";

// TVS — DEMO CHECKOUT AVIRATO
// Cria uma sessão de pagamento real (não cobra até o cliente pagar) e mostra
// o paymentUrl. Uso: npm run demo:avirato -- core|pro|enterprise
// AVISO: em ambiente LIVE, se abrires o paymentUrl e completares o pagamento,
// é uma cobrança real (para a tua conta Avirato).

function loadEnv(key: string): string {
  try {
    const envFile = fs.readFileSync(path.resolve(".env"), "utf8");
    const line = envFile.split("\n").find((l) => l.startsWith(`${key}=`));
    if (line) return line.slice(key.length + 1).trim().trim('"').trim("'");
  } catch {}
  return process.env[key] || "";
}

async function main() {
  const planId = process.argv[2] || "core";
  const apiKey = loadEnv("AVIRATO_API_KEY");
  const webcode = loadEnv("AVIRATO_WEBCODE");
  const test = (loadEnv("AVIRATO_ENV") || "live").toLowerCase() === "test";
  const base = test ? "https://aviratopayments.com/external/v1/test/" : "https://aviratopayments.com/external/v1/";

  const plans: Record<string, { name: string; amount: number }> = {
    core: { name: "Core", amount: 2900 },
    pro: { name: "Pro", amount: 9900 },
    enterprise: { name: "Enterprise", amount: 49900 },
  };
  const plan = plans[planId];
  if (!plan) throw new Error(`Plano inválido: ${planId} (core|pro|enterprise)`);

  console.log(`\n  TVS — Demo Checkout ${test ? "TESTE" : "LIVE"} (${plan.name})`);
  if (!apiKey) throw new Error("Falta AVIRATO_API_KEY no .env");
  if (!webcode) {
    console.log("\nFalta AVIRATO_WEBCODE no .env.\n");
    console.log("Onde encontrar: painel Avirato (app.aviratopayments.com) → Integrations → API Keys.");
    console.log("O webcode é o identificador do teu negócio (ex.: SHOP01, TVS01...). Cola o valor aqui e eu guardo:");
    console.log("  AVIRATO_WEBCODE=...");
    process.exit(1);
  }

  const body = {
    webcode,
    amount: { value: plan.amount, currency: "EUR" },
    urlOk: "https://www.trinnityviseron.com/dashboard?checkout=success",
    urlKo: "https://www.trinnityviseron.com/dashboard?checkout=cancel",
    countryCode: "PT",
    shopperLocale: "pt-PT",
    description: `Trinnity Viseron System - Plano ${plan.name}`,
    customReference: `tvs:demo-tenant:${planId}`,
  };

  const res = await fetch(`${base}payment/session`, {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) {
    console.log(`\nErro: ${json.error?.code} ${json.error?.message} (traceId ${json.error?.traceId})`);
    process.exit(1);
  }
  const d = json.data;
  console.log(`\n  Sessão criada: ${d.sessionId}`);
  console.log(`  Montante:       ${d.amount.value / 100}€ ${d.amount.currency}`);
  console.log(`  Status:         ${d.status}`);
  console.log(`\n  URL DE PAGAMENTO (abre para testar):\n  ${d.paymentUrl}\n`);
  if (!test) {
    console.log("  ⚠️  Ambiente LIVE: só completa o pagamento se quiseres cobrança real (€" + plan.amount / 100 + ").");
  }
}

main().catch((e) => {
  console.error("Falha:", e.message || e);
  process.exit(1);
});
