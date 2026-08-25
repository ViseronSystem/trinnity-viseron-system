import path from "path";
import { createTheme } from "./pdf-theme";

// TVS — ESTRATÉGIA DE LICITAÇÃO · Somacyl · Antiguo Cuartel de Vadillos (Valladolid)
// 48 viviendas protegidas para jóvenes · €6.107.038,30 IVA incl. · 23 meses · ofertas até 14/09/2026

function main() {
  const outFile = path.resolve("data", "Viseron_Estrategia_Licitacion_Vadillos.pdf");
  const t = createTheme({
    title: "Estrategia para Ganar la Licitación",
    subject: "Somacyl · Antiguo Cuartel de Vadillos · 48 viviendas para jóvenes · Valladolid",
  });

  t.cover({
    title: "PLAN DE CONQUISTA\nLICITACIÓN VADILLOS",
    subtitle: "48 viviendas protegidas para jóvenes · Somacyl · Valladolid\nPresupuesto: €6.107.038,30 (IVA incl.) · Plazo: 23 meses · Ofertas hasta el 14/09/2026",
    badges: ["FASE 0 · Inteligencia", "FASE 1 · Equipo", "FASE 2 · Técnica", "FASE 3 · Economía", "FASE 4 · Presentación", "26 días para ganar"],
    date: new Date().toLocaleDateString("es-ES").toUpperCase(),
    version: "1.0",
    url: "www.trinnityviseronsystem.io",
  });

  // ── CONTEXTO ──
  t.section("0", "El proyecto que vamos a ganar", "Contrato mixto: consultoría (redacción de proyectos + dirección) + ejecución de obra.");
  t.bullet("▸", "48 viviendas de protección pública para jóvenes — 10 de 1 dormitorio · 33 de 2 · 5 de 3. Dos adaptadas para discapacidad en el portal A.");
  t.bullet("▸", "Edificio de 7 plantas · 4.757,26 m² construidos · garaje subterráneo con 20 plazas (2 adaptadas, preinstalación EV) + aparcamiento de bicicletas.");
  t.bullet("▸", "Estructura de pórticos de hormigón armado · fachada de paneles prefabricados (blanco/gris + franjas de ladrillo azul) · lana mineral 80 mm.");
  t.bullet("▸", "Aerotermia centralizada con apoyo de gas + suelo radiante + fotovoltaica en cubierta → calificación energética A.");
  t.bullet("▸", "3 meses de consultoría/proyectos + 20 meses de obra. Demolición ya adjudicada a Erri-Berri (€240.359, plazo 6 meses).");
  t.bullet("▸", "Proyecto básico firmado por Ana Isabel Jiménez y María de la O García. Demolición proyectada por Marcelino Hurtado.");
  t.bullet("▸", "Órgano de contratación: Somacyl (Sociedad Pública de Infraestructuras y Medio Ambiente de Castilla y León).");

  // ── FASE 0 ──
  t.section("0", "Inteligencia — empieza hoy", "Todo lo que se sabe antes de la mesa de contratación es ventaja.");
  t.sub("Tareas (3 días)");
  t.bullet("☑", "Descargar PCAP + PPT + proyecto básico en la Plataforma de Contratación del Sector Público (buscar: Somacyl · Vadillos · 48 viviendas).");
  t.bullet("☑", "Extraer criterios de adjudicación: pesos precio/técnico, fórmula de temeridad (baja anormal), mejoras evaluables, cláusulas sociales.");
  t.bullet("☑", "Verificar clasificación exigida (grupo C subgrupo 2 — edificaciones, categoría según presupuesto) o solvencia equivalente.");
  t.bullet("☑", "Estudiar el contrato de demolición de Erri-Berri: fecha de entrega del solar → engranar el inicio de obra.");
  t.bullet("☑", "Enviar consultas al órgano de contratación (los plazos de respuesta ayudan solo a quien pregunta).");
  t.bullet("☑", "Visitar la parcela (plaza de Vadillos / calle Silió 7) y fotografiar el estado real del solar.");
  t.spacer(0.4);
  t.title("El PCAP es la biblia: léelo 3 veces. Los errores de otros son tus puntos.", 12);

  // ── FASE 1 ──
  t.section("1", "Equipo ganador", "Si no se cumple la solvencia en solitario, la UTE es la jugada.");
  t.bullet("▸", "UTE recomendada: constructora con clasificación C-2 (edificaciones) + consultora de proyectos + empresa local de Valladolid (cláusulas sociales).");
  t.bullet("▸", "Jefe de obra con experiencia acreditada en vivienda protegida (VPP) — es el perfil que más puntúa en solvencia técnica.");
  t.bullet("▸", "Coordinador BIM certificado (gestión de modelo + coordinación de instalaciones).");
  t.bullet("▸", "Dirección facultativa con experiencia en aerotermia centralizada y rehabilitación/obra nueva eficiente.");
  t.bullet("▸", "Técnico de prevención + responsable de calidad + responsable medioambiental.");
  t.bullet("▸", "Refuerzo jurídico para revisión del pliego: 1 día de abogado especializado en contratación pública vale más que 5.000€ de baja.");

  // ── FASE 2 ──
  t.section("2", "Oferta técnica que puntúa", "Donde se decide la licitación cuando el precio no diferencia.");
  t.title("Programa de obra (20 meses)", 13);
  t.bullet("▸", "Industrialización: la fachada ya es prefabricada → proponer baños industrializados y forjados modulares para reducir plazo y riesgo.");
  t.bullet("▸", "Hitos verificables: estructura (mes 6-8), cerramientos (9-11), instalaciones (12-16), acabados (17-19), entrega (20).");
  t.bullet("▸", "Plan de demolición coordinado: arranque inmediato al recibir el solar de Erri-Berri.");
  t.title("BIM + Digital Twin", 13);
  t.bullet("▸", "Plan de gestión BIM (ISO 19650) con modelo federado: arquitectura + estructura + MEP.");
  t.bullet("▸", "Entrega de digital twin del edificio: documentación as-built + manuales + plan de mantenimiento → valor diferencial.");
  t.title("Ambiental y social", 13);
  t.bullet("▸", "Calificación A obligatoria → añadir: residuo cero, huella de carbono medida, más potencia fotovoltaica de la exigida.");
  t.bullet("▸", "Plan de empleo: contratación local de jóvenes en formación (coherente con el destino del edificio: vivienda joven).");
  t.bullet("▸", "2% de plantilla con discapacidad + cláusulas de subcontratación responsable.");
  t.title("Mejoras evaluables (las que puntúan)", 13);
  t.bullet("▸", "Más plazas de recarga EV (de la preinstalación a puntos activos).");
  t.bullet("▸", "Domótica básica en las 48 viviendas (control de climatización y consumo).");
  t.bullet("▸", "1 año de mantenimiento post-entrega + monitorización remota de la aerotermia.");
  t.bullet("▸", "Garantía ampliada (de 2 a 5 años en cubierta y fachada).");

  // ── FASE 3 ──
  t.section("3", "Oferta económica", "Ganar con margen, no regalar el contrato.");
  t.bullet("▸", "Coste realista estimado: €1.100–1.200/m² construido (hormigón armado + prefabricado + aerotermia centralizada + suelo radiante).");
  t.bullet("▸", "Margen objetivo: 5–8%. Baja estratégica: suficiente para ganar, sin tocar el umbral de temeridad.");
  t.bullet("▸", "Calcular la fórmula exacta de baja anormal del pliego (normalmente: media aritmética + dispersión). Presentar justificación de costes preventiva.");
  t.bullet("▸", "Desglosar partidas con criterio: las certificaciones mensuales de Somacyl pagan flujo de caja — evitar desequilibrios en estructura y fachada.");
  t.bullet("▸", "Si el pliego valora mejoras económicas, solo ofrecer las que amortizan en el propio contrato (fotovoltaica extra, EV).");

  // ── FASE 4 ──
  t.section("4", "Presentación impecable", "El 90% de las exclusiones son errores de forma, no de fondo.");
  t.bullet("☑", "Declaración responsable firmada + clasificación/solvencia acreditada (certificaciones ISO 9001/14001/45001).");
  t.bullet("☑", "Garantía provisional si la exige el PCAP (habitualmente 3% del presupuesto base).");
  t.bullet("☑", "Sobre correcto: documentos en el orden del pliego, foliados, firmados, sin borrones.");
  t.bullet("☑", "Presentar en la plataforma o registro de Somacyl ANTES de las 14:00 del 14/09/2026 — no el último día.");
  t.bullet("☑", "Preparar defensa de temeridad por escrito (estructura de costes, medios propios, precios de mercado).");
  t.bullet("☑", "Plan de alegaciones: si otro licitador queda excluido, revisar si la exclusión es recurrible a nuestro favor (art. 50 LCSP).");

  // ── CALENDARIO ──
  t.section("5", "Calendario de guerra (26 días)", "Cada día tiene un objetivo. Sin excepciones.");
  const days = [
    ["Día 1-3", "Descargar pliegos · leer PCAP 3 veces · extraer fórmulas · visitar parcela"],
    ["Día 4-6", "Decidir UTE y equipo · redactar consultas y enviarlas"],
    ["Día 7-12", "Redactar memoria técnica: programa, BIM, ambiental, social, mejoras"],
    ["Día 13-16", "Costear la obra con precisión · calcular la baja óptima"],
    ["Día 17-20", "Montar oferta económica + mejoras · revisión jurídica del sobre completo"],
    ["Día 21-23", "Auto-auditoría del sobre (checklist anti-exclusión) · preparar defensa de temeridad"],
    ["Día 24-25", "Presentación anticipada en Somacyl/plataforma · confirmar recepción"],
    ["Día 26", "Plan de espera: seguimiento de apertura, mesa de contratación, posible recurso"],
  ];
  for (const [d, task] of days) t.kv(d, task);
  t.spacer(0.4);
  t.title("Recordatorio: el contrato incluye 3 meses de consultoría — la oferta técnica debe demostrar que sabemos redactar y dirigir, no solo construir.", 11);

  // ── CIERRE ──
  t.spacer(10);
  t.rule();
  t.para("TRINNITY VISERON SYSTEM · Estrategia generada con IA operativa del TVS · © Pedro Costa (Comandante) · Trinnity Hurtado (Reina)", 9, "#94a3b8");

  t.finish(outFile);
  console.log("[OK] PDF gerado:", outFile);
}

main();