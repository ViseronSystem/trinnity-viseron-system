import "dotenv/config";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { AgencyStore } from "../src/core/agency/store";
import { AGENCY_PACKAGES, capacityIndicators, projectionTable, LEGACY_FEE, NEW_FEE } from "../src/core/agency/finance";

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

  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
  doc.pipe(fs.createWriteStream(outFile));

  const W = doc.page.width;
  const PH = doc.page.height;
  const pageCount = () => doc.bufferedPageRange().count;
  const drawFooter = () => {
    doc.page.margins.bottom = 8;
    doc.fontSize(8).fillColor("#888888").text(`TVS v5.0 · Agency OS × Viseron · ${new Date().toLocaleString("pt-PT")} · p.${pageCount() + 1}`, 50, PH - 28, { width: W - 100 });
    doc.page.margins.bottom = 50;
  };
  const heading = (t: string) => {
    if (doc.y > PH - 90) { doc.addPage(); drawFooter(); }
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(18).text(t, 50, doc.y);
    doc.fillColor("#22d3ee").rect(50, doc.y + 2, 28, 2).fill();
    doc.moveDown();
  };
  const subheading = (t: string) => {
    if (doc.y > PH - 70) { doc.addPage(); drawFooter(); }
    doc.fillColor("#0e7490").font("Helvetica-Bold").fontSize(13).text(t, 50, doc.y);
    doc.moveDown(0.4);
  };
  const para = (t: string, opts?: { bold?: boolean; color?: string; size?: number }) => {
    if (doc.y > PH - 60) { doc.addPage(); drawFooter(); }
    doc.fillColor(opts?.color || "#334155").font(opts?.bold ? "Helvetica-Bold" : "Helvetica").fontSize(opts?.size || 10.5).text(t, 50, doc.y, { width: W - 100 });
    doc.moveDown(0.5);
  };
  const bullet = (t: string) => {
    if (doc.y > PH - 60) { doc.addPage(); drawFooter(); }
    doc.fillColor("#334155").font("Helvetica").fontSize(10).text(`•  ${t}`, 62, doc.y, { width: W - 112 });
    doc.moveDown(0.25);
  };
  const langLabel = (code: "ES" | "PT" | "EN", title: string) => {
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11).text(`[${code}] ${title}`, 50, doc.y);
    doc.moveDown(0.2);
  };
  const table = (headers: string[], rows: string[][], colWidths: number[]) => {
    if (doc.y > PH - 60) { doc.addPage(); drawFooter(); }
    let x = 50;
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(9);
    headers.forEach((h, i) => {
      doc.text(h, x, doc.y, { width: colWidths[i] });
      x += colWidths[i];
    });
    doc.moveDown(0.2);
    doc.strokeColor("#e2e8f0").moveTo(50, doc.y).lineTo(W - 50, doc.y).stroke();
    doc.moveDown(0.2);
    for (const row of rows) {
      if (doc.y > PH - 60) { doc.addPage(); drawFooter(); }
      let rx = 50;
      doc.fillColor("#334155").font("Helvetica").fontSize(9);
      row.forEach((cell, i) => {
        doc.text(cell, rx, doc.y, { width: colWidths[i] });
        rx += colWidths[i];
      });
      doc.moveDown(0.3);
      doc.strokeColor("#f1f5f9").moveTo(50, doc.y).lineTo(W - 50, doc.y).stroke();
      doc.moveDown(0.2);
    }
    doc.moveDown(0.6);
  };

  // ============ CAPA ============
  doc.fillColor("#0f172a").rect(0, 0, W, PH).fill();
  doc.fillColor("#22d3ee").font("Helvetica-Bold").fontSize(11).text("TRINNITY VISERON SYSTEM · PLANO DE NEGOCIO", W / 2, 130, { align: "center", width: W - 100 });
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(26).text("AGENCY OS × VISERON", W / 2, 165, { align: "center", width: W - 100 });
  doc.fillColor("#cbd5e1").font("Helvetica").fontSize(13).text("Cómo entramos al mercado · cómo arrecadamos lo esperado · cómo VISERON crea lo que queremos", W / 2, 225, { align: "center", width: W - 100 });
  doc.fillColor("#22c55e").font("Helvetica-Bold").fontSize(15).text(`Proyección: £${projection[projection.length - 1].mrr.toLocaleString()} MRR · £${projection[projection.length - 1].arr.toLocaleString()}/año`, W / 2, 265, { align: "center", width: W - 100 });
  doc.fillColor("#94a3b8").font("Helvetica").fontSize(11).text(`Clientes en TVS: ${report.clients} (${report.active} activos) · Leads: ${report.leads} · Creativos: ${report.creatives} · Métricas: ${report.metrics}`, W / 2, 300, { align: "center", width: W - 100 });
  doc.fillColor("#22d3ee").fontSize(11).text("Trilingue ES · PT · EN — Implementación real en el sistema", W / 2, 335, { align: "center", width: W - 100 });
  doc.fillColor("#64748b").fontSize(9).text("Trinnity Hurtado — Rainha  |  Pedro Costa — Comandante", W / 2, 380, { align: "center", width: W - 100 });
  doc.addPage();
  drawFooter();

  // ============ 1. LA AGENCIA — ESTRUCTURA DEL EQUIPO ============
  heading("1 · La Agencia — Estructura del Equipo");
  langLabel("ES", "Tres áreas complementarias que cubren el ciclo completo del cliente.");
  langLabel("PT", "Três áreas complementares que cobrem todo o ciclo do cliente.");
  langLabel("EN", "Three complementary areas covering the full client cycle.");
  doc.moveDown(0.4);

  for (const member of TEAM) {
    if (doc.y > PH - 120) { doc.addPage(); drawFooter(); }
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(12).text(member.name + " — " + member.role, 50, doc.y);
    doc.moveDown(0.2);
    for (const d of member.duties) bullet(d);
    doc.moveDown(0.4);
  }

  subheading("Matriz de responsabilidades");
  table(
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
    ],
    [210, 60, 70, 70]
  );

  // ============ 2. AGENCY OS EN TVS — IMPLEMENTACIÓN REAL ============
  heading("2 · Agency OS en TVS — Implementación real");
  langLabel("ES", "Todo lo anterior ya está construido dentro del sistema como módulo Agency OS.");
  langLabel("PT", "Tudo o anterior já está construído dentro do sistema como módulo Agency OS.");
  langLabel("EN", "Everything above is now built inside the system as the Agency OS module.");
  doc.moveDown(0.3);
  bullet("Stack de 4 agentes de IA reales: Reporting · Respuesta a Leads · Creativos · Nurturing (IA local Ollama, fallback trilingue).");
  bullet("Datos vivos en data/agency/agency.json — clientes, leads, métricas, creativos, nurturing y ciclo de 2 semanas.");
  bullet("API web /api/agency/*: status, clients, leads (con respuesta automática), metrics, report, creatives, nurture, projection, capacity.");
  bullet("JARVIS integrado: 'estado de la agencia', 'nuevo lead de X', 'genera creativos para SaaS', 'corre el reporte', 'proyección de ingresos'.");
  bullet(`Capacidad actual con IA: ${cap.clientsPerDayComfortable} clientes/día · ${cap.clientsPerCycle}/ciclo · ${cap.minutesPerClient} min/cliente (vs ${cap.minutesWithoutAI} sin IA).`);

  subheading("Agentes de IA activos (Pedro)");
  table(
    ["Agente", "Función", "Frecuencia"],
    [
      ["Reporting", "Extrae métricas Google/Meta Ads y arma la base del reporte quincenal", "Cada 2 semanas"],
      ["Respuesta a Leads", "Responde el primer contacto de un lead nuevo en tiempo real", "Tiempo real"],
      ["Generación de Creativos", "Variantes de anuncios, copy y guiones por nicho", "Semanal"],
      ["Seguimiento / Nurturing", "Follow-ups automáticos a leads que no convierten", "Continuo"],
    ],
    [150, 250, 110]
  );

  subheading("Estado vivo (datos del TVS)");
  table(
    ["Indicador", "Valor", "Indicador", "Valor"],
    [
      ["Clientes", String(report.clients), "Clientes activos", String(report.active)],
      ["Leads", String(report.leads), "Leads ganados", String(report.wonLeads)],
      ["Creativos generados", String(report.creatives), "Registros de métricas", String(report.metrics)],
      ["Follow-ups de nurturing", String(report.nurtureQueued), "Fuente de datos", STORE_FILE.replace(/\\/g, "/")],
    ],
    [130, 150, 130, 150]
  );

  // ============ 3. CÓMO VISERON CREA LO QUE QUEREMOS ============
  heading("3 · Cómo VISERON crea lo que queremos");
  langLabel("ES", "El flywheel completo del cliente vive dentro de VISERON — cada paso lo ejecuta un agente.");
  langLabel("PT", "O flywheel completo do cliente vive dentro do VISERON — cada passo é executado por um agente.");
  langLabel("EN", "The full client flywheel lives inside VISERON — every step is executed by an agent.");
  doc.moveDown(0.3);

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
    if (doc.y > PH - 70) { doc.addPage(); drawFooter(); }
    doc.fillColor("#0e7490").font("Helvetica-Bold").fontSize(11).text(`${step}  ${title}`, 50, doc.y);
    doc.fillColor("#475569").font("Helvetica").fontSize(10).text(desc, 66, doc.y, { width: W - 116 });
    doc.moveDown(0.3);
  }

  subheading("Autonomía exterior (Composio)");
  bullet("Cuando Google Ads / Meta Ads estén conectados via Composio, el agente Reporting puede leer métricas reales y el agente Creativos puede publicar variantes directamente.");
  bullet("Gmail conectado → Respuesta a Leads y Nurturing envían los emails reales sin intervención humana.");
  bullet("JARVIS recuerda cada operación (data/knowledge/jarvis-memory.jsonl) — el squad AIOX audita con Pedro y Trinnity.");

  // ============ 4. ENTRADA AL MERCADO ============
  heading("4 · Entrada al mercado");
  langLabel("ES", "Benchmarks de Londres (2026) y paquetes para entrar con precio ancla creíble.");
  langLabel("PT", "Benchmarks de Londres (2026) e pacotes para entrar com preço-âncora credível.");
  langLabel("EN", "London (2026) benchmarks and packages to enter with a credible anchor price.");
  doc.moveDown(0.3);
  bullet("El cliente paga su propio ad spend a la plataforma; el fee es 100% por gestión y servicio.");
  bullet("Los 50 clientes actuales se mantienen en £1,000/mes (bundle); los nuevos entran a £1,500/mes (bundle) en adelante.");
  bullet("Landing page se cotiza aparte (pago único) o se incluye sin costo como incentivo de cierre en el bundle completo.");

  subheading("Paquetes (Londres 2026)");
  table(
    ["Paquete", "Incluye", "Precio sugerido"],
    AGENCY_PACKAGES.map((p) => [p.name, p.includes, `£${p.priceMin.toLocaleString()} – £${p.priceMax.toLocaleString()}/${p.unit === "month" ? "mes" : "único"}`]),
    [130, 230, 150]
  );

  subheading("Cómo entrar y arrecadar lo esperado");
  table(
    ["Fase", "Acción", "Resultado esperado"],
    [
      ["S0 · Base", "Sistema TVS + Agency OS operativos, 50 clientes a £1,000/mes", "£50,000 MRR"],
      ["S1 · Precio nuevo", "Clientes nuevos a £1,500/mes (bundle) desde ya", "MRR crece por cada alta"],
      ["S2 · Prospección con IA", "Respuesta a Leads + Nurturing automáticos (Gmail/Composio)", "Más oportunidades sin más horas"],
      ["S3 · Reportes con IA", "Reporting quincenal automático libera ~1h/día de Tráfico Pago", "Más clientes por ciclo"],
      ["S4 · Escala", "Al acercarse a 100 clientes, sumar 1 account manager junior", "Evita el techo de capacidad"],
    ],
    [110, 270, 130]
  );

  // ============ 5. PROYECCIÓN DE INGRESOS ============
  heading("5 · Proyección de ingresos (MRR / ARR)");
  para(`Base actual en TVS: ${report.active} clientes activos (se aplica el escenario del documento: ${baseCurrent} clientes actuales a £${LEGACY_FEE}/mes, nuevos a £${NEW_FEE}/mes).`, { bold: true });
  doc.moveDown(0.2);
  table(
    ["Total clientes", "Nuevos (£1,500)", "MRR total", "Fee promedio", "MRR anual"],
    projection.map((p) => [String(p.totalClients), String(p.newClients), `£${p.mrr.toLocaleString()}`, `£${p.avgFee.toLocaleString()}`, `£${p.arr.toLocaleString()}`]),
    [110, 130, 120, 110, 140]
  );

  subheading("Lectura clave");
  bullet("El ingreso incremental de los nuevos clientes es en su mayoría margen: no requiere contratar más gente con la capacidad actual.");
  bullet(`De 50 a 100 clientes, el MRR crece 150% (£${(50 * LEGACY_FEE).toLocaleString()} → £${(50 * LEGACY_FEE + 50 * NEW_FEE).toLocaleString()}) gracias al nuevo precio.`);
  bullet("Los 50 actuales pueden migrar gradualmente a £1,200-1,300 en renovación, una vez respaldado por más casos de éxito.");
  bullet(`Punto de alerta — capacidad: al acercarse a 100 clientes se roza el techo cómodo de ${cap.clientsPerCycle}/ciclo; evaluar sumar un account manager junior de apoyo a Premi.`);

  // ============ 6. PRÓXIMOS PASOS / ROADMAP 90 DÍAS ============
  heading("6 · Próximos pasos · Roadmap 90 días");
  subheading("Día 1 – 30 · Cimentar");
  bullet("Validar la estructura de roles con Pedro, Premi y Tráfico Pago (confirmación humana).");
  bullet("Cargar los 50 clientes actuales en el Agency OS (POST /api/agency/clients).");
  bullet("Conectar Google Ads / Meta Ads y Gmail via Composio para autonomía real.");
  bullet("Estandarizar onboarding y reporte quincenal para los 50 clientes activos.");
  subheading("Día 31 – 60 · Activar agentes");
  bullet("Respuesta a Leads en tiempo real (email Gmail real via Composio).");
  bullet("Generación semanal de creativos por nicho y subida automática.");
  bullet("Nurturing continuo a leads que no convierten.");
  subheading("Día 61 – 90 · Escalar e ingresar");
  bullet("Aplicar £1,500/mes a clientes nuevos desde ya.");
  bullet("Definir el gatillo numérico de contratación (90-100 clientes activos).");
  bullet("Revisar capacidad real vs proyectada y ajustar precios de los 50 actuales en su renovación.");

  doc.moveDown(1);
  doc.fillColor("#0f172a").rect(0, 0, W, PH).fill();
  doc.fillColor("#22d3ee").font("Helvetica-Bold").fontSize(11).text("TRINNITY VISERON SYSTEM · AGENCY OS × VISERON", W / 2, 150, { align: "center", width: W - 100 });
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20).text("El sistema ya construye lo que queremos.", W / 2, 190, { align: "center", width: W - 100 });
  doc.fillColor("#cbd5e1").font("Helvetica").fontSize(11).text(`De £${projection[0].mrr.toLocaleString()} a £${projection[projection.length - 1].mrr.toLocaleString()} MRR · £${projection[projection.length - 1].arr.toLocaleString()}/año · 4 agentes de IA · 1 sistema`, W / 2, 250, { align: "center", width: W - 100 });
  doc.fillColor("#94a3b8").fontSize(10).text("Trilingue ES · PT · EN · Datos vivos: npm run plano:agencia", W / 2, 300, { align: "center", width: W - 100 });
  doc.fillColor("#64748b").fontSize(9).text("Trinnity Hurtado — Rainha  |  Pedro Costa — Comandante", W / 2, 340, { align: "center", width: W - 100 });
  doc.end();

  console.log(`✔ Viseron_Agencia_Mercado_Receita.pdf gerado (${outFile})`);
  console.log(`  Clientes: ${report.clients} (${report.active} ativos) · Leads: ${report.leads} · Creativos: ${report.creatives} · Métricas: ${report.metrics}`);
  console.log(`  Projeção (${baseCurrent} atuais a £${LEGACY_FEE}, novos £${NEW_FEE}):`);
  for (const p of projection) console.log(`   ${String(p.totalClients).padStart(3)} clientes → £${p.mrr.toLocaleString().padStart(8)} MRR · £${p.arr.toLocaleString().padStart(8)}/ano`);
}

main();
