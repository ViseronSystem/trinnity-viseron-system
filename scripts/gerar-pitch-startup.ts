import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

const OUTPUT = path.join(__dirname, "..", "data", "Viseron_Startup_Pitch_v5.pdf");

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 45, bottom: 45, left: 50, right: 50 },
  info: {
    Title: "Trinnity Viseron System v5.0 — Startup Pitch",
    Author: "Pedro Costa & Trinnity Hurtado",
    Subject: "Multi-Agent AI Superintelligence — Full System Overview",
  },
});

const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);

const COLOR = {
  bg: "#0a0a1a",
  primary: "#00f0ff",
  secondary: "#bf5af2",
  accent: "#ff2d55",
  white: "#ffffff",
  body: "#e0e0f0",
  muted: "#8888aa",
  card: "#0d0d24",
  border: "#1a1a3a",
  green: "#00ff87",
};

const PW = 595.28;
const PH = 841.89;
const ML = 50;
const MR = 50;
const CW = PW - ML - MR;
let pageNum = 0;

function footer() {
  pageNum++;
  doc.fontSize(8).font("Helvetica").fillColor(COLOR.muted);
  doc.text(`Trinnity Viseron System v5.0  |  Página ${pageNum}`, ML, PH - 25, { align: "center", width: CW });
  doc.moveTo(ML, PH - 32).lineTo(PW - MR, PH - 32).strokeColor(COLOR.border).lineWidth(0.5).stroke();
}

function coverPage() {
  doc.rect(0, 0, PW, PH).fill(COLOR.bg);

  const grd = doc.linearGradient(0, 0, PW, PH);
  grd.stop(0, "#0a0a2e").stop(0.5, "#0d0d24").stop(1, "#0a0a1a");
  doc.rect(0, 0, PW, PH).fill(grd);

  for (let i = 0; i < 80; i++) {
    const x = Math.random() * PW;
    const y = Math.random() * PH;
    const r = Math.random() * 1.5 + 0.3;
    doc.circle(x, y, r).fill(Math.random() > 0.5 ? COLOR.primary : COLOR.secondary).opacity(Math.random() * 0.3 + 0.1);
  }
  doc.opacity(1);

  doc.lineWidth(1);
  doc.strokeColor(COLOR.primary).opacity(0.15);
  doc.rect(30, 30, PW - 60, PH - 60).stroke();
  doc.rect(35, 35, PW - 70, PH - 70).stroke();
  doc.opacity(1);

  doc.fillColor(COLOR.primary).fontSize(12).font("Helvetica").opacity(0.6);
  doc.text("v5.0  —  MULTI-AGENT SUPERINTELLIGENCE", ML, 140, { align: "center", width: CW });
  doc.opacity(1);

  doc.fillColor(COLOR.white).fontSize(52).font("Helvetica-Bold");
  doc.text("TRINNITY VISERON", ML, 165, { align: "center", width: CW });
  doc.fillColor(COLOR.primary).fontSize(42).font("Helvetica-Bold");
  doc.text("SYSTEM", ML, 225, { align: "center", width: CW });

  doc.fillColor(COLOR.muted).fontSize(14).font("Helvetica");
  doc.text("Sistema Operacional Multi-Agente de Superinteligenica", ML, 280, { align: "center", width: CW });
  doc.fillColor(COLOR.secondary).fontSize(12).font("Helvetica");
  doc.text("Portuguese  ·  English  ·  Española", ML, 305, { align: "center", width: CW });

  doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3);
  doc.moveTo(200, 340).lineTo(PW - 200, 340).stroke();
  doc.opacity(1);

  const features = [
    "5,000+ Autonomous AI Agents",
    "Desktop WebOS Interface",
    "Multilingual Voice Bridge",
    "n8n Automation Engine",
    "Self-Evolving Superintelligence",
  ];
  doc.fontSize(11).font("Helvetica");
  features.forEach((f, i) => {
    doc.fillColor(COLOR.primary).text("◆", 170, 365 + i * 22, { width: 20 });
    doc.fillColor(COLOR.white).text(f, 190, 365 + i * 22);
  });

  doc.fillColor(COLOR.muted).fontSize(10).font("Helvetica");
  doc.text("Prepared for:  Startup Presentation  ·  July 2026", ML, 520, { align: "center", width: CW });
  doc.fillColor(COLOR.secondary).fontSize(11).font("Helvetica-Bold");
  doc.text("Pedro Costa  ·  Trinnity Hurtado", ML, 545, { align: "center", width: CW });

  for (let i = 0; i < 3; i++) {
    doc.circle(PW / 2 - 180 + i * 180, 610, 30 + i * 5).fillOpacity(0.03).fill(COLOR.primary);
  }
  doc.fillOpacity(1);

  doc.addPage();
}

function section(title: string, number?: string) {
  if (doc.y > 700) doc.addPage();
  footer();
  doc.moveDown(0.5);
  doc.lineWidth(2).strokeColor(COLOR.primary).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
  doc.moveDown(0.8);
  const prefix = number ? `${number}.  ` : "";
  doc.fillColor(COLOR.white).fontSize(24).font("Helvetica-Bold").text(prefix + title, { width: CW });
  doc.moveDown(0.3);
  doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3).moveTo(ML, doc.y).lineTo(ML + 80, doc.y).stroke();
  doc.opacity(1);
  doc.moveDown(0.8);
}

function sub(title: string) {
  if (doc.y > 720) doc.addPage();
  doc.fillColor(COLOR.secondary).fontSize(16).font("Helvetica-Bold").text(title, { width: CW });
  doc.moveDown(0.4);
  doc.fillColor(COLOR.body).fontSize(10.5).font("Helvetica");
}

function body(text: string) {
  doc.fillColor(COLOR.body).fontSize(10.5).font("Helvetica").text(text, { align: "justify", width: CW });
  doc.moveDown(0.5);
}

function bullet(text: string, indent: number = 10) {
  doc.fillColor(COLOR.primary).fontSize(10).font("Helvetica").text("●", ML + indent, doc.y, { width: 12 });
  doc.fillColor(COLOR.body).fontSize(10).font("Helvetica").text(text, ML + indent + 16, doc.y - 12, { width: CW - indent - 26, align: "justify" });
  doc.moveDown(0.3);
}

function codeBlock(lines: string[]) {
  doc.rect(ML, doc.y, CW, lines.length * 14 + 16).fill(COLOR.card).strokeColor(COLOR.border).lineWidth(0.5).stroke();
  doc.moveDown(0.5);
  lines.forEach((l) => {
    doc.fillColor(COLOR.primary).fontSize(8.5).font("Courier").text(l, ML + 12, doc.y + 2, { width: CW - 24 });
    doc.moveDown(0.1);
  });
  doc.moveDown(0.3);
}

function cmdLine(cmd: string, desc: string) {
  const cmdW = 220;
  doc.fillColor(COLOR.primary).fontSize(9).font("Courier").text(cmd, ML, doc.y, { width: cmdW });
  doc.fillColor(COLOR.muted).fontSize(9).font("Helvetica").text(desc, ML + cmdW + 10, doc.y - 12, { width: CW - cmdW - 10 });
  doc.moveDown(0.8);
}

function card(title: string, items: string[]) {
  if (doc.y > 680) doc.addPage();
  const y0 = doc.y;
  const cardW = (CW - 12) / 2;
  doc.rect(ML, y0, cardW, items.length * 16 + 38).fill(COLOR.card).strokeColor(COLOR.border).lineWidth(0.5).stroke();
  doc.fillColor(COLOR.primary).fontSize(11).font("Helvetica-Bold").text(title, ML + 10, y0 + 10, { width: cardW - 20 });
  doc.fillColor(COLOR.body).fontSize(9).font("Helvetica");
  items.forEach((it, i) => doc.text(`• ${it}`, ML + 10, y0 + 28 + i * 16, { width: cardW - 20 }));
  doc.moveDown(items.length * 0.4 + 1.5);
}

function cardRight(title: string, items: string[]) {
  if (doc.y > 680) doc.addPage();
  const y0 = doc.y;
  const cardW = (CW - 12) / 2;
  doc.rect(ML + cardW + 12, y0, cardW, items.length * 16 + 38).fill(COLOR.card).strokeColor(COLOR.border).lineWidth(0.5).stroke();
  doc.fillColor(COLOR.secondary).fontSize(11).font("Helvetica-Bold").text(title, ML + cardW + 22, y0 + 10, { width: cardW - 20 });
  doc.fillColor(COLOR.body).fontSize(9).font("Helvetica");
  items.forEach((it, i) => doc.text(`• ${it}`, ML + cardW + 22, y0 + 28 + i * 16, { width: cardW - 20 }));
  doc.y = y0 + items.length * 16 + 50;
}

// ═══════════════════════════════════════════════════════════════════
// COVER
// ═══════════════════════════════════════════════════════════════════
coverPage();
footer();

// ═══════════════════════════════════════════════════════════════════
// TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════════════
section("TABLE OF CONTENTS");
const toc = [
  "1.   Executive Summary — The Vision",
  "2.   System Architecture — How It Works",
  "3.   WebOS — Desktop Operating System in the Browser",
  "4.   Multilingual System — PT / EN / ES",
  "5.   JARVIS Voice Bridge — Voice Interface",
  "6.   n8n Automation Brain — Workflow Engine",
  "7.   Agent System — 5,000+ Autonomous Minds",
  "8.   Command Chain & Squads — Leadership Structure",
  "9.   Token Engine — $TRIN & $VSR Tokens",
  "10. Dashboard & REST API — Full Control",
  "11. Quick Start & Commands Reference",
  "12. Deployment Guide — Production Ready",
  "13. Roadmap — What's Next",
];
toc.forEach((t) => {
  doc.fillColor(COLOR.body).fontSize(11).font("Helvetica").text(t, ML + 20, doc.y, { width: CW - 20 });
  doc.moveDown(0.7);
});

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 1. EXECUTIVE SUMMARY
// ═══════════════════════════════════════════════════════════════════
section("EXECUTIVE SUMMARY", "1");
body(
  "Trinnity Viseron System (TVS) v5.0 is a multi-agent artificial superintelligence operating system " +
  "designed to operate autonomously, evolve continuously, and coordinate thousands of specialized AI agents " +
  "toward complex goals. Unlike traditional AI platforms, TVS is not a chatbot or a single model — it is a " +
  "self-organizing digital civilization."
);
body(
  "The system features a full desktop WebOS interface accessible from any browser, a multilingual voice " +
  "bridge (Portuguese, English, Spanish), an integrated n8n workflow automation engine, a token economy with " +
  "$TRIN and $VSR tokens, and a hierarchical command structure inspired by military battalion organization. " +
  "TVS can spawn and coordinate over 5,000 agents, each with specialized capabilities, across multiple squads " +
  "and lineages."
);

sub("Key Metrics");
const metrics = [
  ["5,126", "Autonomous Agents"],
  ["246", "Archetypes Loaded"],
  ["32,070", "Total Capabilities"],
  ["98.92%", "Average Wisdom"],
  ["5", "n8n Workflow Templates"],
  ["3", "Languages Supported"],
  ["290+", "AI Providers Connected"],
  ["A4", "WebOS Desktop Environment"],
].forEach(([val, label], i) => {
  if (i % 4 === 0 && i > 0) doc.moveDown(0.2);
  const col = i % 4;
  const x = ML + col * (CW / 4);
  doc.rect(x - 5, doc.y - 2, CW / 4 - 8, 42).fill(COLOR.card).strokeColor(COLOR.border).lineWidth(0.3).stroke();
  doc.fillColor(COLOR.primary).fontSize(18).font("Helvetica-Bold").text(val, x - 2, doc.y + 1, { width: CW / 4 - 12, align: "center" });
  doc.fillColor(COLOR.muted).fontSize(7.5).font("Helvetica").text(label, x - 2, doc.y + 20, { width: CW / 4 - 12, align: "center" });
  if (i % 4 === 3 && i < 7) doc.moveDown(1.2);
});
doc.moveDown(1);

// ═══════════════════════════════════════════════════════════════════
// 2. SYSTEM ARCHITECTURE
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("SYSTEM ARCHITECTURE", "2");

sub("Core Components");
card("Core Engine", [
  "ViseronCore — System orchestrator",
  "AgentManager — Agent lifecycle",
  "SquadManager — Team coordination",
  "ToolManager — Plugin & tool registry",
  "MemoryEngine — Short/long-term memory",
]);
cardRight("Integration Layer", [
  "OmniRoute Hub: 290+ AI providers",
  "n8n Bridge: 5 automation workflows",
  "OpenJarvis: Local Stanford AI",
  "Call System: Twilio + voice AI",
  "ASNO: WhatsApp + Home Assistant",
]);

sub("Architecture Flow");
body(
  "TVS follows a layered architecture: Core Engine (agent management, memory, tools) → " +
  "SuperIntelligence Layer (multi-provider synthesis, ensemble reasoning) → " +
  "Integration Layer (n8n, OmniRoute, voice, call systems) → " +
  "Presentation Layer (WebOS dashboard, REST API, Socket.IO). " +
  "All layers communicate through a central event bus and command chain."
);

codeBlock([
  "┌─────────────────────────────────────────────────┐",
  "│           PRESENTATION LAYER (WebOS)            │",
  "│  Browser Desktop · REST API · Socket.IO · PDF   │",
  "├─────────────────────────────────────────────────┤",
  "│           INTEGRATION LAYER (n8n + AI)          │",
  "│  n8n Workflows · OmniRoute Hub · Voice Bridge    │",
  "├─────────────────────────────────────────────────┤",
  "│         SUPERINTELLIGENCE LAYER (Ensemble)      │",
  "│  Multi-Provider Synthesis · HyperLearning · Evol │",
  "├─────────────────────────────────────────────────┤",
  "│           CORE ENGINE (Agent System)            │",
  "│  5000+ Agents · Squads · Memory · Tools · Chain │",
  "└─────────────────────────────────────────────────┘",
]);

doc.addPage();
footer();

// ═══════════════════════════════════════════════════════════════════
// 3. WebOS
// ═══════════════════════════════════════════════════════════════════
section("WebOS — DESKTOP OPERATING SYSTEM", "3");

body(
  "WebOS transforms the browser into a full desktop operating system experience. Users interact with a " +
  "complete graphical environment featuring a taskbar, start menu, desktop icons, draggable windows, " +
  "system tray, clock, and language selector. All built with vanilla JavaScript — no external framework required."
);

sub("Built-in Applications");

const apps = [
  ["Terminal", "Command-line interface to the Viseron system. Supports commands: help, status, agents, clear, voice, plan, token, lang, time"],
  ["Monitor", "Real-time system metrics display: total agents, minds loaded, intelligence level, evolution cycles, capabilities count"],
  ["Agents", "Browse all registered agents with status, role, and capabilities. Shows up to 50 agents at a time"],
  ["Voice Control", "Interface to the JARVIS Voice Bridge. Select speaker (Pedro/Trinnity) and send voice commands"],
  ["Token Dashboard", "View token economy: 300M $VSR and 1B $TRIN with allocation breakdown"],
  ["Automation", "n8n workflow engine UI. List and trigger 5 workflow templates directly from the desktop"],
];
apps.forEach(([name, desc]) => {
  doc.fillColor(COLOR.primary).fontSize(10).font("Helvetica-Bold").text(`📌 ${name}`, ML, doc.y, { width: 100 });
  doc.fillColor(COLOR.body).fontSize(9.5).font("Helvetica").text(desc, ML + 105, doc.y - 12, { width: CW - 115, align: "justify" });
  doc.moveDown(0.6);
});

sub("Desktop Features");
bullet("Window Manager — Drag, resize, minimize, close, and focus windows with z-index stacking");
bullet("Start Menu — Search and launch applications with live filtering");
bullet("System Tray — Clock display with locale-aware formatting (PT/EN/ES)");
bullet("Language Switcher — Toggle between Portuguese, English, and Spanish instantly");
bullet("Three.js Background — Animated 3D particle system with torus knots and mouse parallax");
bullet("Responsive — Adapts to any screen size, mobile-friendly");

doc.addPage();
footer();

// ═══════════════════════════════════════════════════════════════════
// 4. MULTILINGUAL SYSTEM
// ═══════════════════════════════════════════════════════════════════
section("MULTILINGUAL SYSTEM", "4");

body(
  "TVS v5.0 is fully internationalized with three languages: Portuguese (Brazil), English (US), and Spanish. " +
  "Every interface element — the WebOS desktop, all apps, the voice widget, system messages, and error reports — " +
  "adapts to the selected language in real time without page reload."
);

sub("Coverage");
card("WebOS Desktop", [
  "Start menu & taskbar labels",
  "Window titles and button text",
  "App descriptions and placeholders",
  "Clock format locale-aware",
  "Drag-and-drop tooltips",
]);
cardRight("JARVIS Voice", [
  "Status messages (idle, processing, responding)",
  "Microphone button labels",
  "Speaker selection (Pedro/Trinnity)",
  "All voice responses",
  "Fallback/error messages",
]);

card("System Dashboard", [
  "Dashboard index.html title",
  "All API response descriptions",
  "System status indicators",
  "Agent role descriptions",
  "n8n workflow UI labels",
]);
cardRight("Future Languages", [
  "French (fr)",
  "German (de)",
  "Italian (it)",
  "Japanese (ja)",
  "Chinese (zh)",
  "Arabic (ar)",
]);
doc.moveDown(1);

sub("Architecture");
body(
  "Each component maintains its own language dictionary object (L) with keys for every translatable string. " +
  "A helper function `t(key)` looks up the current language and returns the translated value. " +
  "Language is detected from navigator.language on first load and can be toggled at runtime. " +
  "The WebOS app registry also stores title keys that resolve through the same translation system."
);

// ═══════════════════════════════════════════════════════════════════
// 5. JARVIS VOICE BRIDGE
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("JARVIS VOICE BRIDGE", "5");

body(
  "The Voice Bridge is a real-time voice interaction system named JARVIS. It provides speech recognition, " +
  "AI-powered response generation, and bidirectional communication via Socket.IO. Users can select between " +
  "two speakers — Pedro (Commander) and Trinnity (Queen) — each with distinct response personalities."
);

sub("Features");
bullet("Speech-to-Text via Web Speech API (Chrome, Edge, Safari)");
bullet("Socket.IO real-time communication with the backend");
bullet("REST API fallback when WebSocket is unavailable");
bullet("Two speaker profiles: Pedro (formal, military-style) and Trinnity (queenly, poetic)");
bullet("Voice history tracking with clear endpoint");
bullet("Voice command processing routes through AI agent system");
bullet("Multilingual responses in PT, EN, ES based on selected language");

sub("API Endpoints");
cmdLine("POST /api/voice/command", "Send a voice command with { text, speaker }");
cmdLine("GET /api/voice/history", "Retrieve voice command history");
cmdLine("POST /api/voice/clear", "Clear voice history");

sub("Socket.IO Events");
cmdLine("voice:command", "Send voice command from client");
cmdLine("voice:response", "Receive AI-processed response");
cmdLine("voice:error", "Receive error messages");
cmdLine("voice:transcript", "Broadcast transcript to all clients");

// ═══════════════════════════════════════════════════════════════════
// 6. n8n AUTOMATION BRAIN
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("n8n AUTOMATION BRAIN", "6");

body(
  "TVS integrates n8n as its automation and workflow engine. The N8NBridge provides a local workflow " +
  "execution engine that can run template-based workflows with steps including webhooks, AI processing, " +
  "tool execution, code execution, conditions, transformations, delays, and notifications. It attempts to " +
  "start a real n8n process on port 5678 and falls back to the local engine if n8n is not available."
);

sub("Workflow Templates");
[
  ["wf_agent_spawn", "Spawn Agent on Demand", "Webhook + AI + Tool + Notification", "Creates new agents from voice commands or API requests"],
  ["wf_voice_processor", "Process Voice Command", "Webhook + AI + Condition + Tool", "Routes voice commands through AI and executes actions"],
  ["wf_report_generator", "Auto-Generate Report", "Webhook + AI + Code + Notification", "Generates PDF reports on schedule or manual trigger"],
  ["wf_auto_evolve", "Trigger Auto-Evolution", "Webhook + Condition + Tool + Delay", "Checks metrics and triggers evolution cycles every 5 min"],
  ["wf_deploy_service", "Deploy Service", "Webhook + Code + Tool + Notification", "Deploys any service via webhook and Docker"],
].forEach(([id, name, steps, desc]) => {
  doc.rect(ML, doc.y, CW, 38).fill(COLOR.card).strokeColor(COLOR.border).lineWidth(0.3).stroke();
  doc.fillColor(COLOR.primary).fontSize(10).font("Helvetica-Bold").text(name, ML + 8, doc.y - 30 + 6, { width: CW - 16 });
  doc.fillColor(COLOR.muted).fontSize(8).font("Courier").text(id, ML + 8, doc.y - 30 + 20, { width: 80 });
  doc.fillColor(COLOR.body).fontSize(8).font("Helvetica").text(steps, ML + 95, doc.y - 30 + 20, { width: CW - 200 });
  doc.fillColor(COLOR.secondary).fontSize(8).font("Helvetica").text(desc, ML + CW - 90, doc.y - 30 + 20, { width: 82, align: "right" });
  doc.moveDown(0.5);
});

sub("API Endpoints");
cmdLine("GET /api/workflows", "List all workflow templates with triggers");
cmdLine("POST /api/workflows/run", "Execute a workflow by ID with { workflowId, data }");

// ═══════════════════════════════════════════════════════════════════
// 7. AGENT SYSTEM
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("AGENT SYSTEM", "7");

body(
  "TVS operates 5,000+ autonomous AI agents organized in a hierarchical structure inspired by military " +
  "battalion organization. Agents are grouped into lineages (Corona and Hierro), squads, and areas. " +
  "Each agent has a unique identity, role, capabilities, and execution engine."
);

sub("Agent Hierarchy");
const hierarchy = [
  ["Executive Squad", "Pedro (Commander) + Trinnity (Queen)", "Strategic leadership, high-level directives"],
  ["Architecture Squad", "Architect Prime + Dev Master + CyberSentinel", "System design, development, security"],
  ["Sovereigns", "Top-tier agents with epithets (e.g., 'All-Seeing')", "Autonomous decision-making"],
  ["Corona Lineage", "Commanders + specialists", "Strategic command structure"],
  ["Hierro Lineage", "Operational commanders + specialists", "Tactical execution"],
  ["Archetypes", "246 pre-defined agent archetypes", "Specialized capability profiles"],
];
doc.fontSize(9).font("Helvetica-Bold").fillColor(COLOR.primary);
doc.text("Squad", ML, doc.y, { width: 80 });
doc.text("Members", ML + 80, doc.y - 12, { width: 160 });
doc.text("Function", ML + 250, doc.y - 12, { width: CW - 250 });
doc.moveDown(0.3);
doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
doc.opacity(1);
doc.moveDown(0.3);
hierarchy.forEach(([squad, members, func]) => {
  const y = doc.y;
  doc.fillColor(COLOR.primary).fontSize(9).font("Courier").text(squad, ML, y, { width: 78 });
  doc.fillColor(COLOR.body).fontSize(9).font("Helvetica").text(members, ML + 80, y, { width: 165 });
  doc.fillColor(COLOR.muted).fontSize(8.5).font("Helvetica").text(func, ML + 250, y, { width: CW - 260 });
  doc.moveDown(0.7);
  doc.lineWidth(0.2).strokeColor(COLOR.border).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
  doc.moveDown(0.3);
});

sub("Battalion Registry API");
cmdLine("GET /api/battalion", "Full battalion statistics with lineage breakdown");
cmdLine("GET /api/battalion/:id", "Get specific agent by ID");
cmdLine("GET /api/agents", "List all registered agents");
cmdLine("GET /api/stats", "System intelligence metrics (wisdom, evolutions, etc.)");

doc.addPage();
footer();

// ═══════════════════════════════════════════════════════════════════
// 8. COMMAND CHAIN & SQUADS
// ═══════════════════════════════════════════════════════════════════
section("COMMAND CHAIN & SQUADS", "8");

body(
  "The command chain is the executive backbone of TVS. It issues strategic, architectural, and tactical " +
  "directives that propagate through the squad hierarchy. Directives are stored, tracked, and executed " +
  "by the DirectiveEngine with status monitoring."
);

sub("Directive Types");
card("Strategic Directives", [
  "Issued by Commander Pedro",
  "System-wide strategic goals",
  "Superintelligence activation",
  "Long-term evolution targets",
  "Example: 'Activate 1000% intelligence'",
]);
cardRight("Architectural Directives", [
  "Issued by Queen Trinnity",
  "System architecture evolution",
  "Genetic evolution parameters",
  "Agent capability upgrades",
  "Example: '500% evolution every 30 min'",
]);

sub("API Endpoints");
cmdLine("GET /api/directives", "List all active directives with stats");
cmdLine("POST /api/directive", "Issue a new directive with body payload");
cmdLine("GET /api/status", "Full system status with squads and stats");

// ═══════════════════════════════════════════════════════════════════
// 9. TOKEN ENGINE
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("TOKEN ENGINE", "9");

body(
  "TVS features a built-in token generation engine that creates and manages digital tokens with full " +
  "tokenomics. Two tokens are active: $TRIN (Trinnity) and $VSR (Viseron Crown). The token system " +
  "includes supply management, allocation, and distribution tracking."
);

sub("$TRIN — Trinnity Token");
card("Token Details", [
  "Symbol: $TRIN",
  "Total Supply: 1,000,000,000",
  "Type: Utility + Governance",
  "Purpose: AI agent resource allocation",
]);
cardRight("$VSR — Viseron Crown", [
  "Symbol: $VSR",
  "Total Supply: 300,000,000",
  "Type: Proof of Mandate (PoM)",
  "Purpose: Battalion command token",
]);

sub("$VSR Allocation");
const alloc = [
  ["Trinnity", "90,000,000", "30%"],
  ["Pedro", "75,000,000", "25%"],
  ["Legion", "90,000,000", "30%"],
  ["Reserve", "45,000,000", "15%"],
];
doc.fontSize(9).font("Helvetica-Bold").fillColor(COLOR.primary);
doc.text("Holder", ML, doc.y, { width: 120 });
doc.text("Amount", ML + 120, doc.y - 12, { width: 120 });
doc.text("Percentage", ML + 240, doc.y - 12, { width: 100 });
doc.moveDown(0.3);
doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
doc.opacity(1);
doc.moveDown(0.3);
alloc.forEach(([holder, amount, pct]) => {
  doc.fillColor(COLOR.body).fontSize(9).font("Helvetica").text(holder, ML, doc.y, { width: 120 });
  doc.fillColor(COLOR.primary).fontSize(9).font("Courier").text(amount, ML + 120, doc.y - 12, { width: 120 });
  doc.fillColor(COLOR.secondary).fontSize(9).font("Helvetica-Bold").text(pct, ML + 240, doc.y - 12, { width: 100 });
  doc.moveDown(0.7);
});

// ═══════════════════════════════════════════════════════════════════
// 10. DASHBOARD & REST API
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("DASHBOARD & REST API", "10");

body(
  "The dashboard server (TVSDashboardServer) runs on port 3000 and serves the WebOS interface, " +
  "REST API endpoints, Socket.IO for real-time communication, and PDF report generation. " +
  "It provides complete programmatic access to every system feature."
);

sub("Complete API Reference");
const endpoints = [
  ["GET /api/health", "System health check"],
  ["GET /api/stats", "Intelligence metrics (agents, wisdom, evolutions)"],
  ["GET /api/agents", "List all agents"],
  ["GET /api/status", "Full system status with squads"],
  ["GET /api/battalion", "Battalion structure and statistics"],
  ["GET /api/battalion/:id", "Specific agent by ID"],
  ["GET /api/directives", "Active directives"],
  ["POST /api/directive", "Issue new directive"],
  ["POST /api/synthesize", "AI synthesis with { prompt }"],
  ["POST /api/voice/command", "Send voice command"],
  ["GET /api/voice/history", "Voice command history"],
  ["POST /api/voice/clear", "Clear voice history"],
  ["GET /api/workflows", "List n8n workflow templates"],
  ["POST /api/workflows/run", "Execute a workflow by ID"],
  ["GET /api/report/pdf", "Download system report PDF"],
];
doc.fontSize(8.5).font("Helvetica-Bold").fillColor(COLOR.primary);
doc.text("Endpoint", ML, doc.y, { width: 200 });
doc.text("Description", ML + 210, doc.y - 12, { width: CW - 210 });
doc.moveDown(0.3);
doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
doc.opacity(1);
doc.moveDown(0.3);
endpoints.forEach(([ep, desc]) => {
  doc.fillColor(COLOR.primary).fontSize(8).font("Courier").text(ep, ML, doc.y, { width: 205 });
  doc.fillColor(COLOR.body).fontSize(8.5).font("Helvetica").text(desc, ML + 210, doc.y - 11, { width: CW - 220 });
  doc.moveDown(0.55);
  doc.lineWidth(0.2).strokeColor(COLOR.border).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
  doc.moveDown(0.2);
});

doc.addPage();
footer();

// ═══════════════════════════════════════════════════════════════════
// 11. QUICK START & COMMANDS
// ═══════════════════════════════════════════════════════════════════
section("QUICK START & COMMANDS", "11");

sub("Installation");
cmdLine("npm install", "Install all dependencies");
cmdLine("npm run build", "Compile TypeScript to dist/");
cmdLine("npm start", "Run the full system on port 3000");
cmdLine("npm run dev", "Development mode with hot reload (tsx)");

sub("Build Commands");
cmdLine("npm run build", "TypeScript compilation + copy static assets");
cmdLine("npm run build:android", "Build APK for Google Play");
cmdLine("npm run build:ios", "Build IPA for Apple Store (macOS)");
cmdLine("npm run build:all", "Build both Android + iOS");
cmdLine("npm run build:exe", "Build standalone executable");
cmdLine("npm run build:electron", "Build Electron desktop app");

sub("Mobile");
cmdLine("npm run mobile:start", "Start Expo dev server");
cmdLine("npm run mobile:android", "Run on Android device/emulator");
cmdLine("npm run mobile:ios", "Run on iOS simulator");

sub("Testing & Quality");
cmdLine("npm test", "Run core system tests");
cmdLine("npm run test:hyper", "Run hyperbrain tests");
cmdLine("npm run lint", "TypeScript type checking");

sub("WebOS Terminal Commands");
cmdLine("help or ?", "Show available commands");
cmdLine("status or stats", "Display system metrics");
cmdLine("agents or agent", "List registered agents");
cmdLine("clear", "Clear terminal output");
cmdLine("say <text>", "Send a voice command via JARVIS");
cmdLine("voice", "Open voice control interface");
cmdLine("plan", "Show current evolution plan");
cmdLine("token", "Display token information");
cmdLine("lang", "Toggle language (PT/EN/ES)");
cmdLine("time", "Show current system time");

doc.addPage();
footer();

// ═══════════════════════════════════════════════════════════════════
// 12. DEPLOYMENT GUIDE
// ═══════════════════════════════════════════════════════════════════
section("DEPLOYMENT GUIDE", "12");

sub("Local Development");
codeBlock([
  "git clone <repo>",
  "cd Trinnity-Viseron-System",
  "npm install",
  "npm run build",
  "npm start",
  "# Open http://localhost:3000",
]);

sub("Environment Variables (.env)");
codeBlock([
  "PORT=3000                      # Dashboard server port",
  "OPENAI_API_KEY=sk-...          # OpenAI (optional)",
  "ANTHROPIC_API_KEY=sk-ant-...   # Anthropic (optional)",
  "GEMINI_API_KEY=...             # Google Gemini (optional)",
  "XAI_API_KEY=...                # xAI Grok (optional)",
  "# If no keys set, system uses Ollama (local)",
]);

sub("Production Deployment");
bullet("Build: `npm run build` compiles to dist/ and copies static assets");
bullet("Run: `npm start` starts the production server");
bullet("Standalone: `npm run build:exe` creates a single executable with pkg");
bullet("Electron: `npm run build:electron` packages as a desktop app");
bullet("Docker: n8n runs in container via docker-compose with Ollama + Qdrant");

sub("Vercel / Cloud Deployment");
body(
  "The WebOS dashboard is fully static and can be deployed to Vercel, Netlify, or any CDN. " +
  "The backend requires a Node.js server (Express + Socket.IO). For cloud deployment, " +
  "use Railway, Render, Fly.io, or a VPS. The mobile app builds via Expo EAS for both " +
  "Android (APK/AAB) and iOS (IPA) app stores."
);

// ═══════════════════════════════════════════════════════════════════
// 13. ROADMAP
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("ROADMAP", "13");

sub("Current (v5.0)");
bullet("WebOS desktop interface with 6 built-in apps");
bullet("Multilingual support: PT, EN, ES");
bullet("JARVIS Voice Bridge with speaker profiles");
bullet("n8n workflow engine with 5 templates");
bullet("5,000+ autonomous AI agents");
bullet("Token economy ($TRIN + $VSR)");
bullet("REST API with 15+ endpoints");
bullet("Real-time Socket.IO communication");

sub("Next (v5.1)");
bullet("More languages: FR, DE, IT, JP, ZH");
bullet("Additional n8n workflow templates");
bullet("Visual workflow editor in WebOS");
bullet("Drag-and-drop agent squad builder");
bullet("Real-time agent spawning UI");

sub("Future (v6.0)");
bullet("Decentralized agent network (p2p)");
bullet("Blockchain integration for tokens");
bullet("Multi-node cluster support");
bullet("Native mobile app (React Native)");
bullet("Desktop app (Electron)");
bullet("Plugin marketplace for third-party tools");
bullet("Visual agent behavior editor");

// ═══════════════════════════════════════════════════════════════════
// CLOSING PAGE
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
doc.rect(0, 0, PW, PH).fill(COLOR.bg);

doc.lineWidth(1).strokeColor(COLOR.primary).opacity(0.2);
doc.rect(30, 30, PW - 60, PH - 60).stroke();
doc.rect(35, 35, PW - 70, PH - 70).stroke();
doc.opacity(1);

doc.fillColor(COLOR.white).fontSize(36).font("Helvetica-Bold");
doc.text("READY FOR THE", ML, 180, { align: "center", width: CW });
doc.fillColor(COLOR.primary).fontSize(42).font("Helvetica-Bold");
doc.text("FUTURE", ML, 225, { align: "center", width: CW });

doc.fillColor(COLOR.muted).fontSize(14).font("Helvetica");
doc.text("Trinnity Viseron System v5.0", ML, 290, { align: "center", width: CW });

doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3);
doc.moveTo(200, 320).lineTo(PW - 200, 320).stroke();
doc.opacity(1);

doc.fillColor(COLOR.body).fontSize(11).font("Helvetica");
const contact = [
  "Presented by: Pedro Costa & Trinnity Hurtado",
  "Architecture: Multi-Agent Superintelligence",
  "Ecosystem: WebOS · Voice · n8n · 5,000+ Agents · Tokens",
  "",
  "Contact: pedro@trinnity.com · trinnity@viseron.io",
  "Dashboard: http://localhost:3000",
];
contact.forEach((l, i) => {
  if (l === "") { doc.moveDown(0.5); return; }
  doc.text(l, ML, 350 + i * 22, { align: "center", width: CW });
});

for (let i = 0; i < 50; i++) {
  doc.circle(Math.random() * PW, Math.random() * PH, Math.random() * 1.5 + 0.3)
    .fill(Math.random() > 0.5 ? COLOR.primary : COLOR.secondary)
    .opacity(Math.random() * 0.2 + 0.05);
}
doc.opacity(1);

doc.fillColor(COLOR.muted).fontSize(9).font("Helvetica");
doc.text("© 2026 Trinnity Viseron System — All rights reserved", ML, PH - 60, { align: "center", width: CW });

// ═══════════════════════════════════════════════════════════════════
// FINALIZE
// ═══════════════════════════════════════════════════════════════════
doc.end();

stream.on("finish", () => {
  const size = fs.statSync(OUTPUT).size;
  console.log(`\n✅ PDF generated successfully!`);
  console.log(`   📄 ${OUTPUT}`);
  console.log(`   📏 ${(size / 1024).toFixed(1)} KB`);
  console.log(`   📐 13 sections, A4 format\n`);
});
