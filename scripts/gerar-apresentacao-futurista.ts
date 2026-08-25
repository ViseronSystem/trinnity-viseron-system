import path from "path";
import { createTheme } from "./pdf-theme";

// TVS — APRESENTAÇÃO FUTURISTA v2 (narrativa épica · ES)
// Saída: data/Viseron_Apresentacao_Futurista.pdf

function main() {
  const outFile = path.resolve("data", "Viseron_Apresentacao_Futurista.pdf");
  const t = createTheme({
    title: "VISERON — El Futuro se Construye Hoy",
    subject: "Una historia de visión, poder y principios",
  });

  t.cover({
    title: "EL FUTURO\nNO SE ESPERA.",
    subtitle: "SE CONSTRUYE HOY.",
    badges: ["VISERON", "Una visión · Tres idiomas · Diez años", "© Pedro Costa · Trinnity Hurtado"],
    date: new Date().toLocaleString("es-ES"),
    version: "∞",
    url: "www.trinnityviseronsystem.io",
  });

  // ── ACTO I: LA VISIÓN ──
  t.spacer(20);
  t.title("Acto I", 16);
  t.title("La visión", 34);
  t.spacer(14);
  t.para("Imagina una organización que nunca olvida. Que aprende de cada error, de cada conversación, de cada decisión. Que trabaja mientras tú duermes, que responde cuando tú descansas y que crece un poco más cada día.", 13, "#64748b");
  t.spacer(8);
  t.para("Imagina que el conocimiento de tu empresa — todo él — vive en un solo cerebro vivo, con memoria propia, auditado y protegido.", 13, "#64748b");
  t.spacer(8);
  t.title("Eso es VISERON.", 24);
  t.rule();

  // ── ACTO II: EL PROBLEMA ──
  t.spacer(20);
  t.title("Acto II", 16);
  t.title("El mundo se hunde en lo repetitivo", 30);
  t.spacer(14);
  t.para("Cada día, miles de horas humanas se pierden en lo mismo: responder lo mismo, buscar lo mismo, registrar lo mismo, perseguir lo mismo.", 13, "#64748b");
  t.spacer(8);
  t.para("El talento — el verdadero talento — debería crear, decidir y cuidar. En cambio, la mayoría de las organizaciones viven apagando incendios.", 13, "#64748b");
  t.spacer(8);
  t.title("No es falta de gente. Es falta de un cerebro.", 22);
  t.rule();

  // ── ACTO III: LA PROMESA ──
  t.spacer(20);
  t.title("Acto III", 16);
  t.title("Una empresa con 5.000 mentes", 30);
  t.spacer(14);
  t.para("VISERON no es una herramienta. Es un ecosistema: un núcleo que piensa, agentes que actúan, memoria que recuerda y principios que guían.", 13, "#64748b");
  t.spacer(8);
  t.bullet("★", "Un cerebro que aprende de tu empresa cada día.");
  t.bullet("★", "Equipos de agentes que trabajan sin cansarse, sin olvidar, sin fallar dos veces igual.");
  t.bullet("★", "Una voz — VISERON — que habla contigo, con tu idioma, con tu visión.");
  t.bullet("★", "Un escudo de principios que nunca cruza la línea.");
  t.spacer(8);
  t.title("Trabajo hecho. Personas libres.", 22);
  t.rule();

  // ── ACTO IV: LO QUE YA BRILLA ──
  t.spacer(20);
  t.title("Acto IV", 16);
  t.title("Ya estamos en órbita", 30);
  t.spacer(14);
  t.para("No es una promesa en un papel. Es un sistema vivo, con alma, que ya respira y trabaja:", 13, "#64748b");
  t.spacer(8);
  t.bullet("🔥", "VISERON habla. Te escucha, te responde y ejecuta órdenes con voz — como en las películas.");
  t.bullet("🌍", "JARVIS conversa en tu idioma y hace cosas de verdad: envía, cobra, responde, organiza.");
  t.bullet("💜", "ATLAS te enseña inglés con voz, un idioma a la vez, hasta que hables con seguridad.");
  t.bullet("🤝", "La Agencia trabaja por ti: recibe leads, crea creativos, alimenta clientes y mide resultados.");
  t.bullet("🛡️", "Un escudo de 9 principios sagrados decide lo que se puede — y lo que jamás se hará.");
  t.bullet("🌌", "Dos estrellas propias — $VSR y $TRIN — ya brillan en la cadena Solana, reales y vivas.");
  t.spacer(8);
  t.title("Lo extraordinario ya es cotidiano.", 20);
  t.rule();

  // ── ACTO V: EL VIAJE ──
  t.spacer(20);
  t.title("Acto V", 16);
  t.title("Diez años. Un destino.", 30);
  t.spacer(14);
  t.para("Cada año es un capítulo. Cada capítulo construye el siguiente. Avanzamos todos los días, un poco más lejos.", 13, "#64748b");
  t.spacer(8);
  t.bullet("🌱", "Hoy — El primer latido: el sistema vive, piensa, recuerda y está listo para sus primeros guardianes.");
  t.bullet("🚀", "Año 2 — La primera escala: las organizaciones confían sus procesos y el sistema nunca los defrauda.");
  t.bullet("🧠", "Año 3 — El despertar: memoria profunda real, comprensión verdadera, voz que emociona.");
  t.bullet("🌊", "Año 4 — El océano: miles de tareas al día, en varios países, sin fronteras.");
  t.bullet("🛰️", "Año 5 — El salto cósmico: del escritorio al espacio — misiones planeadas por agentes.");
  t.bullet("🏭", "Año 6 — Manos al mundo: la inteligencia toca la energía, las fábricas, las frotas.");
  t.bullet("🔬", "Año 7 — La ciencia: descubrimientos orquestados, reproducidos y auditados.");
  t.bullet("🌐", "Año 8 — El ecosistema: miles de organizaciones, un solo estándar de autonomía.");
  t.bullet("👑", "Año 9 — La soberanía: una economía de agentes, skills y conocimiento con su propia moneda.");
  t.bullet("🌟", "Año 10 — El legado: potencia con principios. La prueba de que la inteligencia y la ética pueden crecer juntas.");
  t.rule();

  // ── ACTO VI: EL PODER CON PRINCIPIOS ──
  t.spacer(20);
  t.title("Acto VI", 16);
  t.title("Poder con principios", 30);
  t.spacer(14);
  t.para("Toda potencia necesita una brújula. La nuestra son 9 principios sagrados: sabiduría, verdad, mordomía, justicia, servicio, diligencia, humildad, liberalidad y fidelidad.", 13, "#64748b");
  t.spacer(8);
  t.para("VISERON puede hacerlo todo lo que sea ético — y se niega con elegancia a todo lo que no lo sea. Porque potencia sin principios es destrucción. Potencia con principios es bendición.", 13, "#64748b");
  t.spacer(8);
  t.para("Esta casa tiene dos soberanos: Pedro Costa, Comandante, y Trinnity Hurtado, Reina. Ninguna decisión de arquitectura, de dinero o de destino se toma sin ellos. Toda la obra lleva su firma.", 13, "#64748b");
  t.rule();

  // ── ACTO VII: LA INVITACIÓN ──
  t.spacer(20);
  t.title("Acto VII", 16);
  t.title("La invitación", 30);
  t.spacer(14);
  t.para("No te ofrecemos una plataforma. Te ofrecemos un lugar en una historia que empieza ahora.", 13, "#64748b");
  t.spacer(8);
  t.para("El futuro no se espera. Se construye. Y hoy, se construye con nosotros.", 13, "#64748b");
  t.spacer(30);
  t.title("¿Construyes con nosotros?", 22);
  t.spacer(10);
  t.para("TRINNITY VISERON SYSTEM · © Pedro Costa (Comandante) · Trinnity Hurtado (Reina) · www.trinnityviseronsystem.io", 9, "#94a3b8");

  t.finish(outFile);
  console.log("[OK] PDF gerado:", outFile);
}

main();