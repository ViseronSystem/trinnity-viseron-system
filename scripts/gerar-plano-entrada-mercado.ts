import * as fs from "fs";
import * as path from "path";
import { createTheme } from "./pdf-theme";

// TVS — PLANO DE ENTRADA NO MERCADO (REFINADO)
// "Não vendes o VISERON. Vendes a AGÊNCIA que o VISERON autonomiza."
// Trilingue: PT / EN / ES
// © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)
// Uso: npm run mercado:plano

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(OUT_DIR, "Viseron_Plano_Entrada_Mercado.pdf");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const today = new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });

const t = createTheme({
  title: "TVS — Plano de Entrada no Mercado | Market Entry Plan | Plan de Entrada al Mercado",
  subject: "Trinnity Viseron System v7.0 — Estratégia de entrada real no mercado (CONFIDENCIAL)",
});

// ══ CAPA ══
t.cover({
  title: "ENTRAR NO MERCADO\nMarket Entry Plan\nEntrar en el Mercado",
  subtitle: "O que podemos fazer REALMENTE com o que já temos — agência × VISERON × receita",
  badges: ["PT 🇧🇷", "EN 🇺🇸", "ES 🇪🇸", "v7.0", "Squad AIOX", "CONFIDENCIAL"],
  version: "1.0",
});
t.para("AUTORIA & PROPRIEDADE INTELECTUAL — Pedro Costa (Comandante) & Trinnity Hurtado (Rainha) — Todos os direitos reservados · All rights reserved · Todos los derechos reservados.", 10, "#7c3aed");
t.para(`Gerado em: ${today}`, 8.5, "#64748b");

// ══ 1 — A VERDADE NUA ══
t.section("1", "A Verdade Nua · The Raw Truth · La Verdad Desnuda");
t.para("Antes da estratégia, a verdade: o TVS tem excesso de produto e falta de caso de referência. Before strategy: too much product, no reference case yet. Antes de la estrategia: exceso de producto, falta caso de referencia.", 9.5, "#334155");

t.sub("VENDÁVEL AGORA · SELLABLE NOW · VENDIBLE YA", "#22c55e");
const sellable: [string, string][] = [
  ["Agency OS", "4 agentes IA reais (Reporting, Leads, Creativos, Nurturing) com dados vivos em data/agency/. Único produto com prova de valor em £ que o cliente percebe. 4 AI agents with live data. Only product with £-value proof. 4 agentes IA reales con datos vivos. Único producto con prueba de valor en £."],
  ["RCS + base 45k telecom", "32.4k contactos, campanha gerada por IA, canal de marketing pronto (mock até aprovar RCS sender). 32.4k contacts, AI-generated campaign, marketing channel ready. 32.4k contactos, campaña generada por IA, canal listo."],
  ["Billing real", "Avirato LIVE a funcionar — consegues cobrar hoje. Live billing — you can charge today. Facturación REAL en marcha — hoy puedes cobrar."],
  ["Site + API + Postgres", "Infraestrutura a sério, 21 tenants (0 pagantes — seed, não receita). Real infrastructure, 21 tenants (0 paying — seed). Infraestructura seria, 21 tenants (0 pagando)."],
];
for (const [k, v] of sellable) t.bullet("▸", `${k} — ${v}`, "#166534");

t.sub("QUASE · ALMOST · CASI", "#f59e0b");
const almost: [string, string][] = [
  ["VISERON/OMEGA", "O produto enterprise é o sonho, mas exige 5+ clientes de referência que ainda não há. Enterprise product is the dream, needs 5+ reference clients. El producto enterprise es el sueño, exige 5+ clientes de referencia."],
  ["App Factory", "Gera APKs reais, mas mercado saturado. Generates real APKs, but saturated market. Genera APKs reales, pero mercado saturado."],
  ["Cosmos tokens", "Ativos reais na Solana, mas sem pool de liquidez = não há swap. Real assets, but no liquidity pool = no swap. Activos reales, pero sin pool de liquidez."],
];
for (const [k, v] of almost) t.bullet("▸", `${k} — ${v}`, "#92400e");

// ══ 2 — A CUNHA ══
t.section("2", "A Cunha · The Wedge · La Cuña");
t.para("O problema do plano original ('vender o AI Operating System') é ser amplo demais para fechar o primeiro contrato. Ninguém compra um sistema operativo de IA — compra resultado medível.", 10);
t.para("The original plan ('sell the AI Operating System') is too broad to close the first deal. Nobody buys an AI OS — they buy measurable results.", 9.5, "#475569");
t.para("El plan original ('vender el AI Operating System') es demasiado amplio para cerrar el primer contrato. Nadie compra un sistema operativo de IA — compra resultados medibles.", 9.5, "#475569");

t.code("NÃO vendes o VISERON. Vendes a AGÊNCIA que o VISERON autonomiza.", "You don't sell VISERON. You sell the AGENCY that VISERON automates.", "No vendes el VISERON. Vendes la AGENCIA que el VISERON automatiza.");

// ══ 3 — TRÊS CAMADAS ══
t.section("3", "Três Camadas por Velocidade de Venda · Three Layers · Tres Capas");
const layers: [string, string, string, string, string][] = [
  ["1", "AI Agency OS", "PMEs com Google/Meta Ads", "£1.000-1.500/mês", "30-60 dias"],
  ["2", "ATLAS — inglês de negócios + voz", "Indivíduos/executivos", "$29-49/sub", "60 dias"],
  ["3", "TVS Enterprise Autonomy", "Empresas maiores", "$499-2.499", "6-12 meses"],
];
for (const [n, prod, cli, price, time] of layers) t.bullet("▸", `${n}. ${prod} → ${cli} → ${price} (${time})`, n === "1" ? "#16a34a" : n === "2" ? "#f59e0b" : "#64748b");

// ══ 4 — PLANO 30 DIAS ══
t.section("4", "Plano de Entrada — 30 Dias · 30-Day Entry Plan · Plan de Entrada — 30 Días");
t.sub("Fase 1 · Semanas 1-2 · Fase 1 · Weeks 1-2", "#22d3ee");
t.para("Fechar 3 clientes de agência com o que já tens agora. O npm run agency:demo semeia dados; usa-os como demo ao vivo no site. Cobra via Avirato (já pronto).", 9.5);
t.para("Close 3 agency clients with what you already have. agency:demo seeds data; use it as a live demo. Charge via Avirato (already live).", 9, "#475569");
t.code("npm run agency:demo", "Semeia 10 clientes + leads + 64 métricas + criativos em data/agency/agency.json");
t.code("npm run demo:avirato -- core", "Testa checkout Avirato real (cria sessão de pagamento)");

t.sub("Fase 2 · Semanas 3-4 · Fase 2 · Weeks 3-4", "#22d3ee");
t.para("Usar a base 45k na tua própria prospeção — não como base fria (RGPD), mas para construir o pipeline de leads da agência real que o AIOX já tem.", 9.5);
t.para("Use the 45k base for YOUR OWN prospecting — not as cold base (GDPR), but to build the agency's real lead pipeline AIOX already has.", 9, "#475569");
t.code("npm run import:telecom", "Importa 45k telecomunicaciones.xlsx → data/telecom/ (32.4k únicos)");
t.code("npm run telecom:campaign", "Gera campanha de apresentação segmentada por nível/operador com IA");

t.sub("Fase 3 · Mês 2-3 · Phase 3 · Month 2-3", "#22d3ee");
t.para("RCS go-live (aprovar RCS sender na Google, ~$200 Aegis) = diferencial real de spam e inaugura o canal de aquisição da agência.", 9.5);
t.para("RCS go-live (approve RCS sender with Google, ~$200 Aegis) = real spam differentiation and opens the agency's acquisition channel.", 9, "#475569");
t.para("Cada cliente novo alimenta agency.json → o Reporting gera o relatório dele → isso vira prova social e moat. Each new client feeds agency.json → Reporting generates their report → social proof and moat.", 9, "#475569");

// ══ 5 — PACOTES ══
t.section("5", "Pacotes Reais · Real Packages · Paquetes Reales", "Londres 2026");
const pkgs: [string, string, string][] = [
  ["Solo Ads", "£900-1.200/mês", "Gestión Google/Meta Ads"],
  ["Solo Creativos/IA", "£600-900/mês", "Copy, guiones, automatización de leads"],
  ["Landing Page", "£600-1.200 (único)", "Diseño + copy con apoyo de IA"],
  ["Bundle completo", "£1.400-1.800/mês", "Ads + Creativos/IA + Cuentas"],
];
for (const [k, v, d] of pkgs) t.bullet("▸", `${k}: ${v} — ${d}`, "#334155");
t.para("Projeção: 50 clientes a £1.000 + novos a £1.500 → £50k→£125k MRR · até ~£1.5M ARR sem contratar mais gente. Gatilho de contratação aos 90-100 clientes.", 9.5, "#7c3aed");
t.para("Projection: 50 clients at £1,000 + new at £1,500 → £50k→£125k MRR · up to ~£1.5M ARR without hiring. Hiring trigger at 90-100 clients.", 9, "#64748b");

// ══ 6 — PITCH DE VENDA ══
t.section("6", "Pitch de Venda · Sales Pitch · Pitch de Venta");
t.code("'Sua agência sem hiato: a IA responde leads em 24/7, cria criativos e gere o relatório quinzenal em 5 minutos.'", "Your agency without gaps: AI answers leads 24/7, creates creatives, generates the fortnightly report in 5 minutes.");
t.para("Para o cliente PME: 'reduza 60% do trabalho administrativo' + relatório real de gasto/conversão/CPA por plataforma.", 9.5);
t.para("For the SME client: 'reduce 60% of admin work' + real spend/conversion/CPA report per platform.", 9, "#475569");

// ══ 7 — O QUE NÃO FAZER ══
t.section("7", "O Que Não Fazer Agora · What NOT to Do · Lo que NO Hacer");
const donts: string[] = [
  "Não maratonar mais features — tens excesso de produto e falta de caso de referência. Don't marathon more features — product surplus, no reference case.",
  "Não vender '5.000 agentes' — vende resultado medível. Don't sell '5,000 agents' — sell measurable results.",
  "Não prometer retorno financeiro/fluência irreal (governança bíblica). Don't promise unrealistic returns/fluency (biblical governance).",
  "Não comprar seguidores nem gastar em ads antes de 3 clientes pagantes. Don't buy followers or spend on ads before 3 paying clients.",
];
for (const d of donts) t.bullet("✗", d, "#dc2626");

// ══ 8 — PRÓXIMO RECURSO ══
t.section("8", "O Próximo Recurso Que Importa · The Next Resource That Matters");
t.para("Não são mais módulos internos — é uma página de demo de 5 minutos da Agency OS para o prospect fechar.", 10);
t.para("Not more internal modules — it's a 5-minute demo page of the Agency OS to close the prospect.", 9.5, "#475569");
t.para("No son más módulos internos — es una página de demo de 5 minutos de la Agency OS para cerrar al prospecto.", 9.5, "#475569");

// ══ RODAPÉ ══
t.spacer(1);
t.para("Trinnity Viseron System v7.0 — © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)", 9, "#7c3aed", { align: "center" });
t.para("CONFIDENCIAL · Gerado pelo Squad AIOX · " + today, 8.5, "#64748b", { align: "center" });

const pages = t.page();
t.finish(OUT_FILE);
console.log(`\n✅ PDF gerado: ${OUT_FILE}`);
const sizeKb = fs.existsSync(OUT_FILE) ? `${(fs.statSync(OUT_FILE).size / 1024).toFixed(1)} KB · ` : "";
console.log(`   ${sizeKb}${pages} páginas`);
console.log(`   © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)`);