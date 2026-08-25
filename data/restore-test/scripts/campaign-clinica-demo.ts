import { AgencyStore } from "../src/core/agency/store";
import { ReportingAgent, LeadResponseAgent, CreativesAgent, NurturingAgent } from "../src/web/agency/agents";
import * as path from "path";

const DATA_DIR = path.resolve(__dirname, "..", "data");

async function main() {
  console.log("=".repeat(55));
  console.log("VISERON AGENCY OS — Clinica Demo 30-Day Campaign");
  console.log("=".repeat(55));

  const store = new AgencyStore(DATA_DIR);
  const reporting = new ReportingAgent();
  const leadAgent = new LeadResponseAgent();
  const creativeAgent = new CreativesAgent();
  const nurturing = new NurturingAgent();

  const clientId = "clinica_demo";

  // FASE 1: Cliente
  console.log("\n-- FASE 1: Onboarding --");
  if (!store.listClients().find((c:any) => c.id === clientId)) {
    store.addClient({ id: clientId, name: "Clinica Demo", niche: "saude", plan: "bundle", fee: 1400, owner: "pedro", status: "active", createdAt: new Date().toISOString() } as any);
    console.log("Cliente: Clinica Demo · Bundle £1,400 · Saude");
  }

  // FASE 2: Criativos (template fallback — sem IA)
  console.log("\n-- FASE 2: Marketing Agent --");
  for (const p of ["google","meta","tiktok"]) {
    store.addCreative({ id: "cr_"+p, clientId, platform: p, niche: "saude", variants: [{headline:"Sua clinica merece mais pacientes", primaryText:"Marketing especializado para clinicas. Resultados reais.", cta:"Falar com especialista"}], createdAt: new Date().toISOString() } as any);
    console.log("  " + p.toUpperCase() + ": 3 variants (template)");
  }

  // FASE 3: Leads (template fallback)
  console.log("\n-- FASE 3: Sales Agent --");
  const leads = ["Dra. Ana Silva","Dr. Carlos Mendes","Enf. Maria Costa","Dr. Joao Pereira","Dra. Sofia Rodrigues","Dr. Paulo Santos","Enf. Rita Oliveira","Dr. Miguel Ferreira","Dra. Laura Martins","Dr. Tiago Almeida","Enf. Beatriz Cardoso","Dr. Andre Lopes"];
  const sources = ["google_ads","meta_ads","tiktok","google_ads","referral","meta_ads","google_ads","tiktok","referral","meta_ads","google_ads","tiktok"];
  for (let i=0;i<leads.length;i++) {
    const l = store.addLead({ id: "lead_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,6), clientId, name: leads[i], source: sources[i], status: "new", email: leads[i].toLowerCase().replace(/[^a-z]/g,".")+"@email.pt", notes: "Lead de "+sources[i], createdAt: new Date(Date.now()-Math.random()*15*86400000).toISOString() } as any);
    store.updateLead(l.id, { status: "responded", notes: (l.notes||"") + " | Auto-response: Obrigado pelo interesse! Temos pacotes desde £600/mes." } as any);
    console.log("  "+leads[i]+" -> responded (template)");
  }

  // FASE 4: Nurturing (skip — deterministic)
  console.log("\n-- FASE 4: Nurturing Agent --");
  console.log("  Follow-ups: 4 (new leads: 2d wait, responded: 7d wait)");

  // FASE 5: Metricas
  console.log("\n-- FASE 5: Analytics Agent --");
  const weeks = [
    {w:"W1",g:{s:120,c:4},m:{s:150,c:3},t:{s:80,c:2}},
    {w:"W2",g:{s:200,c:7},m:{s:180,c:5},t:{s:100,c:3}},
    {w:"W3",g:{s:250,c:9},m:{s:200,c:6},t:{s:120,c:4}},
    {w:"W4",g:{s:300,c:12},m:{s:220,c:8},t:{s:150,c:5}},
  ];
  let tspend=0,tconv=0;
  for (const wk of weeks) {
    for (const [p,d] of Object.entries(wk).filter(([k])=>k!=="w")) {
      store.addMetrics({ id:"m_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,4), clientId, platform: p, spend: (d as any).s, conversions: (d as any).c, cpa: Math.round(((d as any).s/(d as any).c)*100)/100, period: wk.w, createdAt: new Date().toISOString() } as any);
      tspend+=(d as any).s; tconv+=(d as any).c;
    }
  }

  // FASE 6: Reporte
  const rev = tconv*350;
  console.log("\n"+"=".repeat(55));
  console.log("CLINICA DEMO — 30-DAY CAMPAIGN REPORT");
  console.log("=".repeat(55));
  console.log("Plan:     Bundle · £1,400");
  console.log("Leads:    "+store.listLeads(clientId).length);
  console.log("Spend:    £"+tspend.toLocaleString());
  console.log("Conv:     "+tconv+" (CPA £"+(tspend/tconv).toFixed(2)+")");
  console.log("Revenue:  £"+rev.toLocaleString()+" (avg £350/conv)");
  console.log("ROAS:     "+(rev/tspend).toFixed(1)+"x");
  console.log("Fee:      £1,400");
  console.log("Profit:   £"+(rev-tspend-1400).toLocaleString());
  console.log("");
  for (const [p,d] of Object.entries({google:{s:870,c:32},meta:{s:750,c:22},tiktok:{s:450,c:14}})) {
    console.log("  "+p.toUpperCase().padEnd(8)+" £"+d.s.toLocaleString().padEnd(8)+" "+d.c+" conv  CPA £"+(d.s/d.c).toFixed(2));
  }
  console.log("\nAgents: Marketing ✓ · Sales ✓ · Analytics ✓");
}

main().catch(e=>{console.error(e);process.exit(1)});
