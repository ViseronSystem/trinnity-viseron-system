import path from "path";
import { createTheme } from "./pdf-theme";

// TVS — 30 EMPRESAS SOCIAS PARA UTE VADILLOS 48
// Adjudicatarios probados Somacyl + líderes vivienda pública + grandes nacionales
// Saída: data/Viseron_Empresas_Partner_Vadillos.pdf

type Empresa = [string, string, string, string];

const NACIONALES: Empresa[] = [
  ["Acciona", "Madrid", "Líder obra pública España 2025 (596M€, EXPANSIÓN); VPP: Xuxán 12M€", "Núcleo duro UTE"],
  ["ACS / Dragados", "Madrid", "2º del ranking 2025 (588M€); constructoras VPP en CyL", "Núcleo duro UTE"],
  ["FCC Construcción", "Madrid", "3º del ranking 2025 (584M€); fuerte en promoción pública", "Núcleo duro UTE"],
  ["Sacyr Construcción", "Madrid", "4º ranking 2025 (320M€); residencial y obra pública", "Alternativa"],
  ["OHLA", "Madrid", "5º ranking 2025; grandes contratos (Hospital Málaga 500M€)", "Alternativa"],
  ["Ferrovial Construcción", "Madrid", "Líder en rail y obra civil; capacidad financiera", "Alternativa"],
];

const SOMACYL_CYL: Empresa[] = [
  ["Constructora San José", "Valladolid (oficina)", "ADJUDICATARIA Somacyl CO/2024/13 viviendas colaborativas jóvenes (16,4M€) — 08/05/2024", "Socio nº1 · probado Somacyl"],
  ["Construcciones Erri-Berri", "Navarra", "Adjudicataria demolición Antiguo Cuartel Vadillos (240.359€, 6 meses)", "Socio nº2 · ya en la parcela"],
  ["Integración Exacta Organizada", "Segovia", "Adjudicataria 93 VPP Segovia (11,8M€)", "Socio nº3"],
  ["Grulop 21", "Segovia", "UTE con Integración Exacta en Segovia", "Socio nº4"],
  ["Constructora Peache", "Palencia", "Adjudicataria 50 VPP Palencia (6,4M€)", "Socio nº5"],
  ["VIPRESORIA", "Soria", "7 VPP industrializadas Langa de Duero (1,07M€) — piloto industrialización CyL", "Socio nº6 · industrialización"],
  ["SOCAMEX", "Valladolid", "Infraestructuras Somacyl (EDAR 6,6M€)", "Complementario"],
];

const VPP_ESPANA: Empresa[] = [
  ["Construcciones Ramírez", "Galicia", "33M€ en 2025 · ~200 VPP · reina del mercado VPP", "Núcleo UTE"],
  ["Citanias (Kimak)", "Galicia", "25,4M€ 2025 · VPP en Xunta", "Núcleo UTE"],
  ["Oreco Balgón", "Galicia", "22,4M€ 2025 · VPP y obra civil", "Núcleo UTE"],
  ["Copasa", "Galicia", "14,2M€ · 176 VPP Valdecorvos", "Núcleo UTE"],
  ["Civis Global", "Galicia", "12,2M€ · 100 VPP Garabolos", "Núcleo UTE"],
  ["Copcisa", "Galicia", "9,1M€ · 93 VPP Navia", "Núcleo UTE"],
  ["Prace", "Galicia", "9,0M€ · VPP", "Núcleo UTE"],
  ["Consvial", "Galicia", "6,5M€ · VPP (UTE con Tapusa)", "Núcleo UTE"],
  ["Seranco", "Galicia", "5,7M€ · VPP", "Núcleo UTE"],
  ["XAC / Orega", "Galicia", "16,7M€ · VPP", "Núcleo UTE"],
  ["Proyecon", "Galicia", "Ofertas en 4 concursos VPP", "Núcleo UTE"],
  ["Vilor", "Galicia", "VPP O Bertón", "Núcleo UTE"],
  ["Ogmios", "Galicia", "VPP (UTE con Ferrovial/ACS)", "Núcleo UTE"],
  ["Gómez Crespo", "Galicia", "VPP habitual", "Núcleo UTE"],
  ["Francisco Gómez y Cía", "Galicia", "40M€+ Xunta 2025", "Núcleo UTE"],
  ["Taboada y Ramos", "Galicia", "40M€+ Xunta 2025", "Núcleo UTE"],
  ["Vázquez y Reino", "Galicia", "40M€+ Xunta 2025", "Núcleo UTE"],
];

const COMPLEMENTARIOS: Empresa[] = [
  ["Grup Ortiz", "Madrid", "Especialista VPP Madrid (miles de viviendas)", "Verificar solvencia"],
  ["Lantania", "Madrid", "Infraestructuras + VPP", "Verificar solvencia"],
  ["Aldesa", "Madrid", "Residencial y concesiones", "Verificar solvencia"],
  ["Comsa", "Cataluña", "Obra civil y edificación", "Verificar solvencia"],
  ["Sorigué", "Lleida", "Edificación + ciclo del agua", "Verificar solvencia"],
  ["Rubau", "Cataluña", "Edificación VPP", "Verificar solvencia"],
  ["Rover Alcisa", "Aragón", "Edificación y residencial", "Verificar solvencia"],
  ["Begar Construcciones", "León", "Grandes obras CyL (edificios)", "Verificar solvencia"],
];

function renderSection(t: any, title: string, desc: string, rows: Empresa[], note: string) {
  t.section(title, desc, note);
  for (const [name, city, why, role] of rows) {
    t.kv(name, `${city} — ${why} · ${role}`);
  }
}

function main() {
  const outFile = path.resolve("data", "Viseron_Empresas_Partner_Vadillos.pdf");
  const t = createTheme({
    title: "30 EMPRESAS SOCIAS · UTE VADILLOS 48",
    subject: "Adjudicatarios Somacyl + líderes VPP + grandes nacionales · para UTE de la licitación",
  });

  t.cover({
    title: "30 EMPRESAS SOCIAS\nPARA LA UTE VADILLOS 48",
    subtitle: "Adjudicatarios probados de Somacyl · líderes de vivienda protegida · grandes nacionales\n48 VPP jóvenes · Valladolid · Ofertas: 14/09/2026",
    badges: ["Adjudicaciones verificadas", "PLACSP + EXPANSIÓN 2025", "Por prioridad de contacto"],
    date: new Date().toLocaleDateString("es-ES").toUpperCase(),
    version: "1.0",
    url: "www.trinnityviseronsystem.io",
  });

  t.para("Regla de oro: la UTE ideal = 1 gran constructor nacional (garantías + capacidad) + 1 adjudicatario probado de Somacyl (conocimiento del órgano) + 1 pyme local de Valladolid (pegada social). Empezar por San José y Erri-Berri.", 10.5, "#475569");
  t.spacer(6);

  renderSection(t, "Grandes nacionales (6)", "Capacidad financiera y garantías", NACIONALES, "Contacto: departamento de obra pública — 3-4 semanas de negociación.");
  renderSection(t, "Adjudicatarios Somacyl y Castilla y León (7)", "Probados ante el mismo órgano", SOMACYL_CYL, "Contacto: primera semana — son los socios decisivos.");
  renderSection(t, "Especialistas vivienda protegida (17)", "Ganan concursos VPP en toda España", VPP_ESPANA, "Contacto: segunda semana — solvencia técnica demostrada.");
  renderSection(t, "Complementarios (8)", "Para reforzar capacidad", COMPLEMENTARIOS, "Contacto: solo si falta capacidad en un oficio.");

  t.section("38 en total", "Cómo se gestiona la lista", "Cada contacto queda registrado en Licitaciones OS (checklist de UTE).");
  t.bullet("▸", "Día 4-6: contactar 8 de la lista (San José, Erri-Berri, Peache, VIPRESORIA, Ramírez, Acciona, Copasa, Begar).");
  t.bullet("▸", "Día 7: firmar acuerdos de confidencialidad + solvencia (CAE).");
  t.bullet("▸", "Día 12: carta de compromiso de la UTE (obligatoria para el sobre).");
  t.bullet("▸", "Día 20: notaría + documento de constitución de UTE.");
  t.bullet("▸", "La UTE ideal es de 2-3 socios: más de 3 complica la junta de administración y la firma.");

  t.finish(outFile);
  console.log("[OK] PDF gerado:", outFile);
}

main();