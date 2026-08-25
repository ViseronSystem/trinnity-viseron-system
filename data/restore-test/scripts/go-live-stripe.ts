import fs from "fs";
import path from "path";

// TVS — GO-LIVE STRIPE
// Cria os 3 produtos/preços no Stripe e atualiza src/web/billing/plans.ts
// com os priceId reais. Corre quando STRIPE_SECRET_KEY estiver no .env:
//   npm run go-live:stripe
// Depois: configurar o webhook (ver saída no fim).

function loadEnv(key: string): string {
  try {
    const envFile = fs.readFileSync(path.resolve(".env"), "utf8");
    const line = envFile.split("\n").find((l) => l.startsWith(`${key}=`));
    if (line) return line.slice(key.length + 1).trim().trim('"').trim("'");
  } catch {}
  return process.env[key] || "";
}

async function main() {
  const key = loadEnv("STRIPE_SECRET_KEY");
  console.log("\n==========================================");
  console.log("  TVS — GO-LIVE STRIPE (criar planos reais)");
  console.log("==========================================");

  if (!key) {
    console.log(`
Falta STRIPE_SECRET_KEY no .env.

COMO OBTER (2 minutos, no telemóvel ou PC):
1. Abre https://dashboard.stripe.com/register  → cria conta (email + password)
2. Completa os dados da empresa (nome, país, NIF/VAT se tiveres)
3. Developers → API keys → copia a chave "sk_live_..." (guarda-a bem)
4. Coloca no .env:
   STRIPE_SECRET_KEY=sk_live_...
5. Volta a correr: npm run go-live:stripe

(Sem a conta Stripe é IMPOSSÍVEL cobrar dinheiro real — Stripe é a entidade que
processa os cartões e transfere para a tua conta bancária. É obrigatório criar.)
`);
    process.exit(1);
  }

  const Stripe = require("stripe");
  const stripe = new Stripe(key);
  console.log("Conectado ao Stripe...");
  const account = await stripe.account.retrieve();
  console.log(`Conta: ${account.id} · país=${account.country} · ${account.business_profile?.name || "sem nome"}`);

  const plans = [
    { id: "core", name: "Core", amount: 2900, desc: "Para equipas a automatizar o primeiro fluxo de trabalho." },
    { id: "pro", name: "Pro", amount: 9900, desc: "Para empresas em escala com múltiplos agentes autónomos." },
    { id: "enterprise", name: "Enterprise", amount: 49900, desc: "SSO, SLA 99.9%, on-premise e white-label." },
  ];

  const priceIds: Record<string, string> = {};
  for (const p of plans) {
    let product = (await stripe.products.list({ active: true, limit: 100 })).data.find(
      (x: any) => x.metadata?.tvs_plan === p.id
    );
    if (!product) {
      product = await stripe.products.create({
        name: `Trinnity Viseron — ${p.name}`,
        description: p.desc,
        metadata: { tvs_plan: p.id },
      });
      console.log(`+ Produto criado: ${product.name} (${product.id})`);
    } else {
      console.log(`= Produto já existe: ${product.name} (${product.id})`);
    }
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: p.amount,
      currency: "eur",
      recurring: { interval: "month" },
      metadata: { tvs_plan: p.id },
    });
    priceIds[p.id] = price.id;
    console.log(`+ Preço ${p.name}: ${p.amount / 100}€/mês → ${price.id}`);
  }

  // Atualizar plans.ts com os priceId reais
  const plansFile = path.resolve("src/web/billing/plans.ts");
  let src = fs.readFileSync(plansFile, "utf8");
  for (const p of plans) {
    src = src.replace(new RegExp(`priceId: "price_${p.id}_monthly"`), `priceId: "${priceIds[p.id]}"`);
  }
  fs.writeFileSync(plansFile, src);
  console.log(`\n✅ plans.ts atualizado com os priceId reais (${plansFile})`);

  console.log(`
==========================================
  PRÓXIMO PASSO — WEBHOOK (upgrade automático)
==========================================
1. Cria o webhook em https://dashboard.stripe.com/webhooks
   → Add endpoint → URL: https://viseron-web.onrender.com/api/billing/webhook
   → Eventos: checkout.session.completed, invoice.payment_failed,
              customer.subscription.deleted
2. Copia o "Signing secret" (whsec_...) e coloca no .env:
   STRIPE_WEBHOOK_SECRET=whsec_...
3. Define as variáveis no Render (env do serviço viseron-web):
   STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET
4. Deploy: npm run deploy:render

Depois disso, /api/revenue/readiness mostra Stripe "Pronto para faturar".
`);
}

main().catch((e) => {
  console.error("Falha no go-live Stripe:", e?.message || e);
  process.exit(1);
});
