import "dotenv/config";
import fs from "fs";
import path from "path";
import { AgencyStore } from "../src/core/agency/store";
import { AGENCY_PACKAGES, capacityIndicators, projectionTable, LEGACY_FEE, NEW_FEE } from "../src/core/agency/finance";
import { createTheme } from "./pdf-theme";

// TVS — PLANO AGENCIA × VISERON (trilingue ES/PT/EN)
// Documento final que junta:
//   1. A implementação da agência (Estructura del Equipo → Agency OS no TVS)
//   2. Como o VISERON cria o que queremos (flywheel de agentes de IA)
//   3. Como entramos no mercado (Londres, pacotes £) e arrecadamos o esperado
//   4. Projeção financeira MRR/ARR (50 → 100 clientes)
// Uso: npm run plano:agencia  →  data/Viseron_Agencia_Mercado_Receita.pdf

const STORE_FILE = path.resolve("data", "agency", "agency.json");

interface TeamMember {
  name: string;
  role: string;
  duties: string[];
}

const TEAM: TeamMember[] = [
  {
    name: "Pedro",
    role: "IA, Workflows & Creatividad",
    duties: ["Agentes de IA: reporting, leads, creativos, nurturing", "Creatividad: anuncios, guiones, copy", "Landing pages (con apoyo de IA)", "Onboarding técnico de clientes", "Priorización por nicho"],
  },
  {
    name: "Tráfico Pago",
    role: "Google Ads & Meta Ads",
    duties: ["Gestión y optimización de campañas pagadas", "Onboarding de clientes", "Relación con cliente y decisiones estratégicas", "Cierre de nuevos clientes (con Premi)"],
  },
  {
    name: "Premi",
    role: "Ventas, Cuentas & Contabilidad",
    duties: ["Prospección y cierre en mercados de habla inglesa", "Gestión de cuentas: llamadas y reportes quincenales", "Contabilidad: facturación, márgenes, finanzas", "Relación con cliente y cierre de nuevos clientes"],
  },
];

function main() {
  const outFile = path.resolve("data", "Viseron_Agencia_Mercado_Receita.pdf");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  const store = new AgencyStore(path.resolve("data"));
  const snapshot = store.snapshot();
  const clients = store.listClients();
  const leads = store.listLeads();
  const active = clients.filter((c) => c.status === "active").length;
  const baseCurrent = active > 0 ? active : 50; // assume os 50 atuais do documento
  const projection = projectionTable(baseCurrent, LEGACY_FEE, NEW_FEE);
  const cap = capacityIndicators(active);
  const report = {
    generatedAt: new Date().toISOString(),
    clients: clients.length,
    active,
    leads: leads.length,
    wonLeads: leads.filter((l) => l.status === "won").length,
    nurtureQueued: snapshot.nurture.filter((a) => a.status === "queued").length,
    creatives: snapshot.creatives.length,
    metrics: snapshot.metrics.length,
  };

  const t = createTheme({ title: "Agency OS × Viseron", subject: "Plano de negócio — agência × VISERON (ES · PT · EN)" });
  const last = projection[projection.length - 1];

  // ============ CAPA ============
  t.cover({
    title: "AGENCY OS × VISERON",
    subtitle: "Cómo entramos al mercado · cómo arrecadamos lo esperado · cómo VISERON crea lo que queremos",
    badges: ["ES · PT · EN", "Agency OS", "TVS v5.0"],
    version: "5.0",
  });
  t.kv("Proyección", `£${last.mrr.toLocaleString()} MRR · £${last.arr.toLocaleString()}/año`);
  t.kv("Clientes en TVS", `${report.clients} (${report.active} activos) · Leads: ${report.leads} · Creativos: ${report.creatives} · Métricas: ${report.metrics}`);
  t.kv("Trilingue", "ES · PT · EN — Implementación real en el sistema");
  t.kv("Autoría", "Trinnity Hurtado — Rainha  |  Pedro Costa — Comandante");

  const renderTable = (headers: string[], rows: string[][]) => {
    t.kv(headers[0], headers.slice(1).join("  ·  "));
    for (const row of rows) {
      t.kv(row[0], headers.slice(1).map((h, i) => `${h}: ${row[i + 1] ?? ""}`.trimEnd()).join("  ·  "));
    }
  };

  // ============ 1. LA AGENCIA — ESTRUCTURA DEL EQUIPO ============
  t.section("1", "La Agencia — Estructura del Equipo");
  t.para("[ES] Tres áreas complementarias que cubren el ciclo completo del cliente.", 10);
  t.para("[PT] Três áreas complementares que cobrem todo o ciclo do cliente.", 10);
  t.para("[EN] Three complementary areas covering the full client cycle.", 10);

  for (const member of TEAM) {
    t.sub(`${member.name} — ${member.role}`);
    for (const d of member.duties) t.bullet("▸", d);
  }

  t.sub("Matriz de responsabilidades");
  renderTable(
    ["Área", "Pedro", "Tráfico", "Premi"],
    [
      ["Workflows IA / automatización", "✔", "", ""],
      ["Creatividad / copy / guiones", "✔", "", ""],
      ["Diseño de landing pages", "✔", "", ""],
      ["Onboarding de clientes", "✔", "✔", ""],
      ["Priorización por nicho", "✔", "✔", ""],
      ["Gestión / optimización de Ads", "", "✔", ""],
      ["Relación con el cliente", "", "✔", "✔"],
      ["Decisiones estratégicas de Ads", "", "✔", "✔"],
      ["Cierre de nuevos clientes", "", "✔", "✔"],
      ["Contabilidad", "", "", "✔"],
    ]
  );

  // ============ 2. AGENCY OS EN TVS — IMPLEMENTACIÓN REAL ============
  t.section("2", "Agency OS en TVS — Implementación real");
  t.para("[ES] Todo lo anterior ya está construido dentro del sistema como módulo Agency OS.", 10);
  t.para("[PT] Tudo o anterior já está construído dentro do sistema como módulo Agency OS.", 10);
  t.para("[EN] Everything above is now built inside the system as the Agency OS module.", 10);
  t.bullet("▸", "Stack de 4 agentes de IA reales: Reporting · Respuesta a Leads · Creativos · Nurturing (IA local Ollama, fallback trilingue).");
  t.bullet("▸", "Datos vivos en data/agency/agency.json — clientes, leads, métricas, creativos, nurturing y ciclo de 2 semanas.");
  t.bullet("▸", "API web /api/agency/*: status, clients, leads (con respuesta automática), metrics, report, creatives, nurture, projection, capacity.");
  t.bullet("▸", "JARVIS integrado: 'estado de la agencia', 'nuevo lead de X', 'genera creativos para SaaS', 'corre el reporte', 'proyección de ingresos'.");
  t.bullet("▸", `Capacidad actual con IA: ${cap.clientsPerDayComfortable} clientes/día · ${cap.clientsPerCycle}/ciclo · ${cap.minutesPerClient} min/cliente (vs ${cap.minutesWithoutAI} sin IA).`);

  t.sub("Agentes de IA activos (Pedro)");
  renderTable(
    ["Agente", "Función", "Frecuencia"],
    [
      ["Reporting", "Extrae métricas Google/Meta Ads y arma la base del reporte quincenal", "Cada 2 semanas"],
      ["Respuesta a Leads", "Responde el primer contacto de un lead nuevo en tiempo real", "Tiempo real"],
      ["Generación de Creativos", "Variantes de anuncios, copy y guiones por nicho", "Semanal"],
      ["Seguimiento / Nurturing", "Follow-ups automáticos a leads que no convierten", "Continuo"],
    ]
  );

  t.sub("Estado vivo (datos del TVS)");
  renderTable(
    ["Indicador", "Valor", "Indicador", "Valor"],
    [
      ["Clientes", String(report.clients), "Clientes activos", String(report.active)],
      ["Leads", String(report.leads), "Leads ganados", String(report.wonLeads)],
      ["Creativos generados", String(report.creatives), "Registros de métricas", String(report.metrics)],
      ["Follow-ups de nurturing", String(report.nurtureQueued), "Fuente de datos", STORE_FILE.replace(/\\/g, "/")],
    ]
  );

  // ============ 3. CÓMO VISERON CREA LO QUE QUEREMOS ============
  t.section("3", "Cómo VISERON crea lo que queremos");
  t.para("[ES] El flywheel completo del cliente vive dentro de VISERON — cada paso lo ejecuta un agente.", 10);
  t.para("[PT] O flywheel completo do cliente vive dentro do VISERON — cada passo é executado por um agente.", 10);
  t.para("[EN] The full client flywheel lives inside VISERON — every step is executed by an agent.", 10);

  const flywheel: [string, string, string][] = [
    ["1 · Captura", "Lead entra (web/formulario)", "POST /api/agency/leads — agente Respuesta a Leads responde en <60s en su idioma"],
    ["2 · Cierre", "Premi / Tráfico Pago cierran", "Lead pasa a cliente con plan y fee (£) — POST /api/agency/clients"],
    ["3 · Onboarding", "Configuran accesos y automatizaciones", "Cliente activo; ciclo de 2 semanas se registra en el Agency OS"],
    ["4 · Optimización", "Campañas + creativos ajustados", "Agente Creativos genera variantes por nicho; se suben vía Composio (Google/Meta Ads)"],
    ["5 · Reporte", "Reporte quincenal automático", "Agente Reporting agrega métricas (spend, conv, CPA, ROAS) y arma la base del reporte"],
    ["6 · Ingresos", "Cobro recurrente", "MRR/ARR computado en la proyección — de £50k a £125k MRR sin contratar más gente"],
    ["7 · Retención", "Nurturing continuo", "Agente Nurturing hace follow-up a leads que no convierten"],
  ];
  for (const [step, title, desc] of flywheel) {
    t.sub(`${step}  ${title}`);
    t.para(desc, 10, "#475569");
  }

  t.sub("Autonomía exterior (Composio)");
  t.bullet("▸", "Cuando Google Ads / Meta Ads estén conectados via Composio, el agente Reporting puede leer métricas reales y el agente Creativos puede publicar variantes directamente.");
  t.bullet("▸", "Gmail conectado → Respuesta a Leads y Nurturing envían los emails reales sin intervención humana.");
  t.bullet("▸", "JARVIS recuerda cada operación (data/knowledge/jarvis-memory.jsonl) — el squad AIOX audita con Pedro y Trinnity.");

  // ============ 4. ENTRADA AL MERCADO ============
  t.section("4", "Entrada al mercado");
  t.para("[ES] Benchmarks de Londres (2026) y paquetes para entrar con precio ancla creíble.", 10);
  t.para("[PT] Benchmarks de Londres (2026) e pacotes para entrar com preço-âncora credível.", 10);
  t.para("[EN] London (2026) benchmarks and packages to enter with a credible anchor price.", 10);
  t.bullet("▸", "El cliente paga su propio ad spend a la plataforma; el fee es 100% por gestión y servicio.");
  t.bullet("▸", "Los 50 clientes actuales se mantienen en £1,000/mes (bundle); los nuevos entran a £1,500/mes (bundle) en adelante.");
  t.bullet("▸", "Landing page se cotiza aparte (pago único) o se incluye sin costo como incentivo de cierre en el bundle completo.");

  t.sub("Paquetes (Londres 2026)");
  renderTable(
    ["Paquete", "Incluye", "Precio sugerido"],
    AGENCY_PACKAGES.map((p) => [p.name, p.includes, `£${p.priceMin.toLocaleString()} – £${p.priceMax.toLocaleString()}/${p.unit === "month" ? "mes" : "único"}`])
  );

  t.sub("Cómo entrar y arrecadar lo esperado");
  renderTable(
    ["Fase", "Acción", "Resultado esperado"],
    [
      ["S0 · Base", "Sistema TVS + Agency OS operativos, 50 clientes a £1,000/mes", "£50,000 MRR"],
      ["S1 · Precio nuevo", "Clientes nuevos a £1,500/mes (bundle) desde ya", "MRR crece por cada alta"],
      ["S2 · Prospección con IA", "Respuesta a Leads + Nurturing automáticos (Gmail/Composio)", "Más oportunidades sin más horas"],
      ["S3 · Reportes con IA", "Reporting quincenal automático libera ~1h/día de Tráfico Pago", "Más clientes por ciclo"],
      ["S4 · Escala", "Al acercarse a 100 clientes, sumar 1 account manager junior", "Evita el techo de capacidad"],
    ]
  );

  // ============ 5. PROYECCIÓN DE INGRESOS ============
  t.section("5", "Proyección de ingresos (MRR / ARR)");
  t.para(`Base actual en TVS: ${report.active} clientes activos (se aplica el escenario del documento: ${baseCurrent} clientes actuales a £${LEGACY_FEE}/mes, nuevos a £${NEW_FEE}/mes).`, 10.5, "#0f172a");
  renderTable(
    ["Total clientes", "Nuevos (£1,500)", "MRR total", "Fee promedio", "MRR anual"],
    projection.map((p) => [String(p.totalClients), String(p.newClients), `£${p.mrr.toLocaleString()}`, `£${p.avgFee.toLocaleString()}`, `£${p.arr.toLocaleString()}`])
  );

  t.sub("Lectura clave");
  t.bullet("▸", "El ingreso incremental de los nuevos clientes es en su mayoría margen: no requiere contratar más gente con la capacidad actual.");
  t.bullet("▸", `De 50 a 100 clientes, el MRR crece 150% (£${(50 * LEGACY_FEE).toLocaleString()} → £${(50 * LEGACY_FEE + 50 * NEW_FEE).toLocaleString()}) gracias al nuevo precio.`);
  t.bullet("▸", "Los 50 actuales pueden migrar gradualmente a £1,200-1,300 en renovación, una vez respaldado por más casos de éxito.");
  t.bullet("▸", `Punto de alerta — capacidad: al acercarse a 100 clientes se roza el techo cómodo de ${cap.clientsPerCycle}/ciclo; evaluar sumar un account manager junior de apoyo a Premi.`);

  // ============ 6. PRÓXIMOS PASOS / ROADMAP 90 DÍAS ============
  t.section("6", "Próximos pasos · Roadmap 90 días");
  t.sub("Día 1 – 30 · Cimentar");
  t.bullet("▸", "Validar la estructura de roles con Pedro, Premi y Tráfico Pago (confirmación humana).");
  t.bullet("▸", "Cargar los 50 clientes actuales en el Agency OS (POST /api/agency/clients).");
  t.bullet("▸", "Conectar Google Ads / Meta Ads y Gmail via Composio para autonomía real.");
  t.bullet("▸", "Estandarizar onboarding y reporte quincenal para los 50 clientes activos.");
  t.sub("Día 31 – 60 · Activar agentes");
  t.bullet("▸", "Respuesta a Leads en tiempo real (email Gmail real via Composio).");
  t.bullet("▸", "Generación semanal de creativos por nicho y subida automática.");
  t.bullet("▸", "Nurturing continuo a leads que no convierten.");
  t.sub("Día 61 – 90 · Escalar e ingresar");
  t.bullet("▸", "Aplicar £1,500/mes a clientes nuevos desde ya.");
  t.bullet("▸", "Definir el gatillo numérico de contratación (90-100 clientes activos).");
  t.bullet("▸", "Revisar capacidad real vs proyectada y ajustar precios de los 50 actuales en su renovación.");

  // ============ CIERRE ============
  t.doc.addPage();
  t.cover({
    title: "El sistema ya construye lo que queremos.",
    subtitle: `De £${projection[0].mrr.toLocaleString()} a £${projection[projection.length - 1].mrr.toLocaleString()} MRR · £${projection[projection.length - 1].arr.toLocaleString()}/año · 4 agentes de IA · 1 sistema`,
    badges: ["ES · PT · EN", "Datos vivos: npm run plano:agencia", "Agency OS"],
    version: "5.0",
  });

  t.finish(outFile);

  console.log(`✔ Viseron_Agencia_Mercado_Receita.pdf gerado (${outFile})`);
  console.log(`  Clientes: ${report.clients} (${report.active} ativos) · Leads: ${report.leads} · Creativos: ${report.creatives} · Métricas: ${report.metrics}`);
  console.log(`  Projeção (${baseCurrent} atuais a £${LEGACY_FEE}, novos £${NEW_FEE}):`);
  for (const p of projection) console.log(`   ${String(p.totalClients).padStart(3)} clientes → £${p.mrr.toLocaleString().padStart(8)} MRR · £${p.arr.toLocaleString().padStart(8)}/ano`);
}

main();
