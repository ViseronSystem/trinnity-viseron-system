import path from "path";
import { createTheme } from "./pdf-theme";

// TVS — PLANO ESTRATÉGICO VADILLOS 48 · LICITACIÓN SOMACYL
// Estratégia com pegada social + auditoria dos agentes TVS
// Saída: data/Viseron_Plan_Estrategico_Vadillos_Social.pdf

function main() {
  const outFile = path.resolve("data", "Viseron_Plan_Estrategico_Vadillos_Social.pdf");
  const t = createTheme({
    title: "VADILLOS 48 — El Edificio que Devuelve al Barrio",
    subject: "Plan estratégico + pegada social · Licitación Somacyl · €6,1M · 48 VPP jóvenes",
  });

  t.cover({
    title: "VADILLOS 48\nLA MANZANA QUE CRECE",
    subtitle: "Plan estratégico con pegada social para la licitación Somacyl\n48 viviendas protegidas para jóvenes · Valladolid · €6.107.038,30 · 23 meses",
    badges: ["Pegada Social", "BIM + Digital Twin", "Economía Circular", "Auditado por agentes TVS", "Ofertas: 14/09/2026"],
    date: new Date().toLocaleDateString("es-ES").toUpperCase(),
    version: "1.0",
    url: "www.trinnityviseronsystem.io",
  });

  // ── 1. RESUMEN EJECUTIVO ──
  t.section("1", "Resumen ejecutivo", "No ofrecemos construir 48 pisos. Ofrecemos devolver una manzana a su barrio.");
  t.bullet("▸", "Un edificio de 48 VPP para jóvenes — 10 de 1 dormitorio, 33 de 2, 5 de 3, 2 adaptadas — con calificación energética A, aerotermia, suelo radiante y fotovoltaica.");
  t.bullet("▸", "Nuestra propuesta diferencial: la promoción que deja huella — empleo juvenil local, formación en oficios, subcontratación de pymes de Castilla y León y barrio vivo.");
  t.bullet("▸", "Tecnología: BIM + digital twin + industrialización de fachada (ya prefabricada en proyecto) + residuo cero aprovechando la demolición.");
  t.bullet("▸", "Sociedad: 1 edificio · 3 compromisos · 7 ejes sociales — medibles, auditables, comunicables.");
  t.bullet("▸", "Equipo: UTE con adjudicatarios probados de Somacyl + líderes nacionales VPP + pyme local (ver lista de 30 socios potenciales).");
  t.bullet("▸", "Todo el plan ha sido auditado con los agentes del TVS (squads AIOX, knowledge graph, loop engineering, doctor).");

  // ── 2. LOS 3 COMPROMISOS ──
  t.section("2", "Los 3 compromisos", "Lo que hace única la oferta: una promesa medible por cada eje.");
  t.sub("Compromiso 1 · Empleo que queda en Valladolid");
  t.bullet("▸", "≥15% de plantilla de obra: jóvenes menores de 30 años residentes en Valladolid.");
  t.bullet("▸", "Escuela-taller en obra: 20 plazas de formación en oficios (encofrado, prefabricado, instalaciones) en convenio con FP de Valladolid.");
  t.bullet("▸", "≥2% de plantilla con discapacidad + inclusión de colectivos vulnerables del barrio.");
  t.sub("Compromiso 2 · Economía local, no solo el edificio");
  t.bullet("▸", "≥30% del importe en subcontratación de pymes de Castilla y León (fachada, instalaciones, acabados).");
  t.bullet("▸", "Comercio y servicios del barrio como proveedores preferentes (hostelería, logística, ferretería).");
  t.bullet("▸", "Acuerdo de medición: el 100% de la inversión local se reporta trimestralmente a Somacyl y a los vecinos.");
  t.sub("Compromiso 3 · Vivienda que no expulsa, que atrae");
  t.bullet("▸", "Coste energético objetivo ≤ €30/mes por vivienda (calificación A + aerotermia + fotovoltaica).");
  t.bullet("▸", "Llaves digitales + manual del edificio en formato digital twin para cada vecino joven.");
  t.bullet("▸", "Comunidad viva: espacio de coworking en bajocubierta + patio con juegos infantiles como punto de encuentro del barrio.");

  // ── 3. LOS 7 EJES ──
  t.section("3", "Los 7 ejes sociales y económicos", "Cada eje tiene meta, indicador y responsable.");
  const ejes: Array<[string, string, string]> = [
    ["E1 · Empleo joven", "15% plantilla <30 años · 20 plazas escuela-taller", "RRHH + Oficina de Empleo Joven"],
    ["E2 · Formación", "Convenio FP Valladolid · certificados profesionales · 10 becas oficios", "Escuela-taller + FP"],
    ["E3 · Pymes locales", "30% subcontratación CyL · registro de proveedores del barrio", "Compras + Cámara de Comercio"],
    ["E4 · Barrio vivo", "Patio abierto · coworking · actividades con asociaciones de Vadillos", "Relaciones comunitarias"],
    ["E5 · Energía y clima", "A energética · −60% emisiones vs obra convencional · residuo cero", "Técnica + Medio Ambiente"],
    ["E6 · Innovación", "BIM 100% · digital twin entregado · fachada industrializada · EV ampliado", "Jefatura de obra + BIM"],
    ["E7 · Transparencia", "Informes trimestrales públicos · comité vecinal de seguimiento", "Dirección + comunicación"],
  ];
  for (const [e, meta, resp] of ejes) t.kv(e, `${meta} · ${resp}`);

  // ── 4. DIFERENCIADORES TÉCNICOS ──
  t.section("4", "Diferenciadores técnicos", "La técnica al servicio del proyecto social.");
  t.bullet("▸", "BIM obligatorio (ISO 19650): modelo federado arquitectura + estructura + MEP + coordinación y detección de interferencias antes de ejecutar.");
  t.bullet("▸", "Digital twin de entrega: as-built + manuales + plan de mantenimiento + monitorización de aerotermia y consumos.");
  t.bullet("▸", "Industrialización: la fachada ya es prefabricada (proyecto básico) — proponemos baños industrializados y forjados modulares para reducir plazo y riesgo.");
  t.bullet("▸", "Economía circular: coordinación con la demolición (Erri-Berri) para reutilizar hormigón reciclado en firmes y zahorras; residuo cero certificado.");
  t.bullet("▸", "Energía: fotovoltaica ampliada + puntos de recarga EV activos + monitorización por vivienda (los jóvenes ven su consumo en el móvil).");
  t.bullet("▸", "Programa en 20 meses con hitos verificables y arranque inmediato al recibir el solar.");

  // ── 5. SOCIOS (30 EMPRESAS) ──
  t.section("5", "30 socios potenciales (UTE)", "Adjudicatarios probados de Somacyl + líderes de vivienda pública + grandes nacionales. Documento completo: Viseron_Empresas_Partner_Vadillos.pdf.");
  t.bullet("▸", "Núcleo local: Constructora San José (adjudicataria Somacyl CO/2024/13, oficina en Valladolid), Erri-Berri (demolición Vadillos), Peache (Palencia), VIPRESORIA (industrializada), Integración Exacta Organizada + Grulop 21 (Segovia).");
  t.bullet("▸", "Especialistas VPP: Ramírez (33M€ en 2025), Citanias, Oreco Balgón, Copasa, Civis Global, Copcisa, Prace, Consvial, Seranco, XAC/Orega, Proyecon, Vilor, Ogmios, Gómez Crespo, Francisco Gómez, Taboada y Ramos, Vázquez y Reino.");
  t.bullet("▸", "Grandes nacionales: Acciona (líder obra pública), ACS/Dragados, FCC, OHLA, Sacyr, Ferrovial.");
  t.bullet("▸", "Complementarios conocidos del sector VPP (verificar solvencia via PLACSP): Grup Ortiz, Lantania, Aldesa, Comsa, Sorigué, Rubau, Rover Alcisa, Begar (León), SOCAMEX (infraestructuras Somacyl).");

  // ── 6. AUDITORÍA DE AGENTES TVS ──
  t.section("6", "Auditoría de agentes TVS", "Este plan no se improvisa: se audita con el sistema.");
  t.bullet("✅", "Squad AIOX — escaneado real: 8/8 squads ativos (Business, Engineering, Marketing, Operations...).");
  t.bullet("✅", "Knowledge Graph (graphify) — 6.037 nós: pdf-engine, AgencyStore, JARVIS e módulos de automação verificados no grafo.");
  t.bullet("✅", "TVS Doctor — sistema saudável: 10 agentes no runtime, watchdog ativo, 22 apps, disco OK.");
  t.bullet("🔄", "Loop Engineering — 39/100 (L0): a melhorar com LOOP.md, constraints e verifier antes da entrega (plano de 5 dias).");
  t.bullet("✅", "Prospection OS — pipeline de captação B2B operativo (a usar depois da licitação, para o negócio de VPP).");
  t.bullet("✅", "Licitaciones OS — monitorização: Vadillos carregada com checklist de 10 passos e contagem regressiva (26 dias).");

  // ── 7. CALENDARIO ──
  t.section("7", "Calendario de guerra", "26 días — cada día con objetivo.");
  const days: Array<[string, string]> = [
    ["Día 1-3", "Pliegos + PCAP + visita parcela + fotos"],
    ["Día 4-6", "Contactar 5-8 empresas de la lista · formar UTE · consultas al órgano"],
    ["Día 7-12", "Memoria técnica: BIM, social (7 ejes), ambiental, mejoras"],
    ["Día 13-16", "Costes + baja óptima (sin temeridad)"],
    ["Día 17-20", "Sobre económico + revisión jurídica + auto-auditoría anti-exclusión"],
    ["Día 21-23", "Cierre de UTE · notaría · garantías"],
    ["Día 24-25", "Presentación anticipada en Somacyl/PLACSP"],
    ["Día 26", "Seguimiento de mesa · defensa de temeridad preparada"],
  ];
  for (const [d, task] of days) t.kv(d, task);

  // ── 8. NOMBRE Y MARCA DE LA OFERTA ──
  t.section("8", "La marca de la oferta", "Cómo se llama lo que presentamos.");
  t.title("VADILLOS 48 · LA MANZANA QUE CRECE", 15);
  t.para("Un edificio, tres compromisos, siete ejes. Cada vivienda es una oportunidad para que un joven se quede en Valladolid. Cada puesto de trabajo es una oportunidad para que el barrio crezca. Cada informe trimestral es una promesa cumplida.", 10.5, "#64748b");
  t.spacer(4);
  t.para("TRINNITY VISERON SYSTEM · © Pedro Costa (Comandante) · Trinnity Hurtado (Reina) · www.trinnityviseronsystem.io", 9, "#94a3b8");

  t.finish(outFile);
  console.log("[OK] PDF gerado:", outFile);
}

main();