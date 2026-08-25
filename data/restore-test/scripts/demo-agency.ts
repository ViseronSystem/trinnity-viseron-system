import "dotenv/config";
import path from "path";
import { AgencyStore, AgencyClient, AgencyLead, newAgencyId } from "../src/core/agency/store";
import { CreativesAgent } from "../src/web/agency/agents";

// TVS — DEMO AGENCY OS
// Semeia dados realistas da agência (só se o store estiver vazio):
// 10 clientes (Londres, mercados de habla inglesa), 5 leads, métricas Google/Meta,
// e gera 1 job de creativos. Uso: npm run agency:demo

const NICHES = ["SaaS", "E-commerce", "Dental", "Real Estate", "Fitness", "Legal", "Home Services", "Coaching", "Fintech", "MedSpa"];

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function main() {
  const store = new AgencyStore(path.resolve("data"));
  const existing = store.listClients();
  if (existing.length > 0) {
    console.log(`Agency OS já tem ${existing.length} clientes — demo não sobrescrito. Para recriar, apaga data/agency/agency.json.`);
    return;
  }

  const now = new Date().toISOString();
  const clients: AgencyClient[] = NICHES.map((niche, i) => ({
    id: newAgencyId("cli"),
    name: `${niche} Partner ${String(i + 1).padStart(2, "0")}`,
    niche,
    plan: i < 6 ? "bundle" : "solo_ads",
    fee: i < 6 ? 1000 : 900,
    status: i < 8 ? "active" : "onboarding",
    owner: i % 3 === 0 ? "premi" : i % 3 === 1 ? "trafico" : "pedro",
    country: i % 5 === 0 ? "US" : "GB",
    createdAt: daysAgo(40 - i * 3),
    updatedAt: now,
    notes: "Onboarding estandarizado · reporte quincenal",
  }));
  clients.forEach((c) => store.addClient(c));

  const leads: AgencyLead[] = [
    { id: newAgencyId("lead"), name: "James Carter", email: "james@brightsaas.io", company: "Bright SaaS", source: "google_ads", status: "new", lang: "en", firstContact: daysAgo(0.5), lastContact: daysAgo(0.5), followUpAt: "", notes: "Quiere más MQLs con Google Ads" },
    { id: newAgencyId("lead"), name: "Laura Gómez", email: "laura@clinicadental.com", company: "Clínica Dental", source: "meta_ads", status: "responded", lang: "es", firstContact: daysAgo(3), lastContact: daysAgo(2), followUpAt: "", notes: "Interesada en bundle completo" },
    { id: newAgencyId("lead"), name: "Ana Ferreira", email: "ana@ecommerce.pt", company: "Loja Online", source: "referral", status: "nurturing", lang: "pt", firstContact: daysAgo(12), lastContact: daysAgo(8), followUpAt: "", notes: "Comparando agencias" },
    { id: newAgencyId("lead"), name: "Michael Smith", email: "mike@fitlegal.co.uk", company: "Fit Legal", source: "landing", status: "won", lang: "en", firstContact: daysAgo(20), lastContact: daysAgo(15), followUpAt: "", notes: "Cerró bundle £1,500/mes" },
    { id: newAgencyId("lead"), name: "Sofia Reyes", email: "sofia@estudiofitness.com", company: "Estudio Fitness", source: "google_ads", status: "new", lang: "es", firstContact: daysAgo(0.2), lastContact: daysAgo(0.2), followUpAt: "", notes: "Pide creativos nuevos" },
  ];
  leads.forEach((l) => store.addLead(l));

  // Métricas Google/Meta para os 8 clientes ativos (últimas 4 semanas).
  for (let week = 0; week < 4; week++) {
    for (let i = 0; i < 8; i++) {
      const client = clients[i];
      const baseSpend = 800 + i * 120 + week * 25;
      const conv = 6 + i + week;
      store.addMetrics({
        id: newAgencyId("met"),
        clientId: client.id,
        platform: "google",
        period: daysAgo(week * 7).slice(0, 10),
        spend: baseSpend,
        conversions: conv,
        cpa: 0,
        roas: 0,
        recordedAt: daysAgo(week * 7),
      });
      store.addMetrics({
        id: newAgencyId("met"),
        clientId: client.id,
        platform: "meta",
        period: daysAgo(week * 7).slice(0, 10),
        spend: Math.round(baseSpend * 0.6),
        conversions: Math.round(conv * 0.7),
        cpa: 0,
        roas: 0,
        recordedAt: daysAgo(week * 7),
      });
    }
  }

  console.log(`✔ Agency OS semeado: ${clients.length} clientes · ${leads.length} leads · 64 registos de métricas (8 clientes × 4 semanas × 2 plataformas)`);

  // Gera 1 job de creativos (fallback trilingue se Ollama não estiver ligado).
  new CreativesAgent()
    .generate(store, "SaaS", "google", "en")
    .then((job) => console.log(`✔ Creativos: ${job.id} · ${job.variants.length} variantes para "${job.niche}" (${job.platform})`))
    .catch((e: any) => console.error(`✖ Creativos falharam: ${e.message}`));
}

main();
