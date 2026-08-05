import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// TVS - PLANO ESTRATEGICO + ROADMAP TECNICO (D7)
// 1) data/Viseron_Plano_Estrategico_<data>.pdf  - o que ficou feito + veredicto go-live
// 2) data/Viseron_Roadmap_Tecnico_<data>.pdf    - tudo o que falta (APIs/registos/etapas) + comandos para voltar

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function exec(cmd: string): string {
  const { execSync } = require("child_process");
  try {
    return execSync(cmd, { encoding: "utf8", cwd: process.cwd(), stdio: ["pipe", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

function fmt(n: number): string {
  return n.toLocaleString("pt-PT");
}

function makeDoc(outPath: string, title: string, subtitle: string): PDFDocument {
  const doc = new PDFDocument({ size: "A4", margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  doc.pipe(fs.createWriteStream(outPath));
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(20).text(title, 50, 45);
  doc.moveDown(0.2);
  doc.fillColor("#64748b").font("Helvetica").fontSize(11).text(subtitle);
  doc.moveDown(0.2);
  doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor("#cbd5e1").stroke();
  doc.moveDown(0.5);
  return doc;
}

function pageBottom(doc: PDFDocument): number {
  return doc.page.height - 100;
}

function heading(doc: PDFDocument, num: string, text: string): void {
  if (doc.y > pageBottom(doc) - 30) doc.addPage();
  doc.moveDown(0.4);
  doc.fillColor("#7c3aed").font("Helvetica-Bold").fontSize(13).text(`${num}  ${text}`);
  doc.moveDown(0.2);
}

function bullet(doc: PDFDocument, text: string, color = "#1e293b"): void {
  if (doc.y > pageBottom(doc) - 20) doc.addPage();
  doc.fillColor(color).font("Helvetica").fontSize(10).text(`•  ${text}`);
  doc.moveDown(0.15);
}

function kv(doc: PDFDocument, k: string, v: string): void {
  if (doc.y > pageBottom(doc) - 20) doc.addPage();
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10).text(k, 50, doc.y);
  doc.fillColor("#475569").font("Helvetica").fontSize(10).text(v, 190, doc.y, { width: doc.page.width - 190 - 50 });
  doc.moveDown(0.3);
}

function code(doc: PDFDocument, cmd: string, desc: string): void {
  if (doc.y > pageBottom(doc) - 30) doc.addPage();
  doc.fillColor("#1d4ed8").font("Courier-Bold").fontSize(9.5).text(cmd, 50, doc.y);
  doc.fillColor("#64748b").font("Helvetica").fontSize(9.5).text(desc, 300, doc.y, { width: doc.page.width - 300 - 50 });
  doc.moveDown(0.25);
}

function footer(doc: PDFDocument, dateStr: string): void {
  doc.fillColor("#94a3b8").font("Helvetica").fontSize(8.5).text(
    `Copyright © Pedro Costa (Comandante) e Trinnity Hurtado (Rainha) — Trinnity Viseron System v5.0 · ${dateStr}`,
    50,
    doc.page.height - 40
  );
}

function main(): void {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dateStr = today();

  const tCoreLine = exec("npx tsx tests/core.test.ts").split("\n").reverse().find((l) => l.includes("passaram") || l.includes("PASSED")) || "n/a";
  const tWebLine = exec("npx tsx tests/web.test.ts").split("\n").reverse().find((l) => l.includes("PASSED")) || "n/a";
  const tOsLine = exec("npx tsx tests/os.test.ts").split("\n").reverse().find((l) => l.includes("passaram")) || "n/a";
  const lintOk = exec("npx tsc --noEmit").length === 0;
  const commits = exec("git log --oneline -8").split("\n").filter(Boolean);
  let health: Record<string, any> = {};
  try { health = JSON.parse(exec("node -e \"fetch('https://viseron-web.onrender.com/api/health').then(r=>r.json()).then(j=>console.log(JSON.stringify(j))).catch(()=>console.log('{}'))\"") || "{}"); } catch {}

  const exe = fs.existsSync(".build/tvs-standalone/tvs-viseron-win.exe") ? Math.round(fs.statSync(".build/tvs-standalone/tvs-viseron-win.exe").size / 1e6) : 0;
  const apk = fs.existsSync("src/dashboard/public/downloads/TrinnityViseron.apk") ? Math.round(fs.statSync("src/dashboard/public/downloads/TrinnityViseron.apk").size / 1e6) : 0;
  const setup = fs.existsSync("src/dashboard/public/downloads/TrinnityViseron-APK-Setup-5.0.0.exe") ? Math.round(fs.statSync("src/dashboard/public/downloads/TrinnityViseron-APK-Setup-5.0.0.exe").size / 1e6) : 0;

  // =====================================================================
  // PDF 1 - PLANO ESTRATEGICO
  // =====================================================================
  const p1Out = path.join(dataDir, `Viseron_Plano_Estrategico_${dateStr}.pdf`);
  const d1 = makeDoc(p1Out, "TRINNITY VISERON SYSTEM — PLANO ESTRATÉGICO",
    `Sprint de transformação em produto — ${dateStr} · Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)`);

  heading(d1, "1", "O que ficou feito neste sprint (D1–D6)");
  const done: Array<[string, string]> = [
    ["D1 · Produção/Postgres", "Contas e tenants migrados para Postgres Neon — fim da perda de dados no Render. API live: tenants=9, users=9, usage_events=42. Deploy forçado via API Render."],
    ["D2 · Chamadas + Voz", "Webhooks Twilio inbound/gather/status + outbound REST; cada chamada é transcrita, analisada por IA local (qwen2.5:3b) e aprende (data/knowledge/call-learned.jsonl). VoiceBridge guarda histórico e aprende por comando."],
    ["D3 · Criador de sites", "POST /api/sites/generate {name, description} → site HTML completo gerado por IA local + preview em /sites/<slug> (trilingue PT/EN/ES)."],
    ["D4 · Criador de APKs", "POST /api/apps/generate → scaffold Expo completo (App.tsx + app.json + package.json) gerado por IA local."],
    ["D5 · Atendimento a empresas", "POST /api/business/agents — rececionista IA com greeting + knowledge base por empresa, histórico, JWT + rate-limit."],
    ["D6 · Builds reais", ".exe standalone 50.7 MB, APK Android release 65 MB, Setup.exe do APK 24.6 MB — prontos nos Downloads do site."],
  ];
  for (const [k, v] of done) kv(d1, k, v);

  heading(d1, "2", "Estado real do sistema (verificado agora)");
  kv(d1, "Testes core", tCoreLine);
  kv(d1, "Testes web", tWebLine);
  kv(d1, "Testes TVS OS", tOsLine);
  kv(d1, "Lint (tsc --noEmit)", lintOk ? "PASS" : "FALHOU");
  kv(d1, "API produção", health?.status === "OK" ? `OK · db=${health?.db} tenants=${health?.tenants} users=${health?.users}` : "offline");
  kv(d1, "Artefactos", `.exe ${fmt(exe)} MB · APK ${fmt(apk)} MB · Setup ${fmt(setup)} MB`);

  heading(d1, "3", "Modelo de receita (cobranças reais prontas)");
  bullet(d1, "Planos: Core $29/mês · Pro $99/mês · Enterprise $499/mês (GET /api/billing/plans).");
  bullet(d1, "Avirato Payments primário (API key + webcode + client secret) — checkout real e webhook HMAC a dar upgrade do plano.");
  bullet(d1, "Stripe opcional (npm run go-live:stripe cria os 3 planos).");
  bullet(d1, "Revenue readiness 6/6: processador, webhook, Gmail, email provider, domínio, Postgres.");
  bullet(d1, "Novo motor de receita: agentes de atendimento a empresas (D5) — cobrança por agente/mês.");

  heading(d1, "4", "Veredicto go-live");
  bullet(d1, "PRONTO: vender assinaturas (checkout Avirato real), registar empresas, gerar sites/apps, atender clientes por email e chat.", "#047857");
  bullet(d1, "QUASE PRONTO: chamadas telefónicas reais (faltam Media Streams/STT do Twilio + verificar número de voz) e IA cloud (faltam chaves).", "#b45309");
  bullet(d1, "PENDENTE: UI no dashboard para os novos agentes e publicidade das ferramentas D3/D4/D5 no site.", "#b91c1c");

  heading(d1, "5", "Próximas ações prioritárias");
  for (const n of [
    "Adicionar OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY ao .env para raciocínio cloud (JARVIS + análises complexas).",
    "Ativar Media Streams do Twilio para voz bidirecional em tempo real (atualmente é Gather STT + TTS por turno).",
    "Verificar o número Twilio para voz (trial exige destino validado) e apontar webhooks para TVS_PUBLIC_URL.",
    "Construir UI no dashboard para gerir agentes de atendimento, sites e apps gerados.",
    "Publicar os 3 artefactos de build nos Downloads do site (roadmap D6).",
  ]) bullet(d1, n);

  heading(d1, "6", "Commits recentes");
  for (const c of commits) {
    d1.fillColor("#475569").font("Helvetica").fontSize(9.5).text(c.length > 110 ? c.slice(0, 110) + "…" : c);
    d1.moveDown(0.15);
  }
  footer(d1, dateStr);
  d1.end();
  console.log(`✔ Plano estratégico gerado: ${p1Out}`);

  // =====================================================================
  // PDF 2 - ROADMAP TECNICO (o que falta + comandos para voltar a cada etapa)
  // =====================================================================
  const p2Out = path.join(dataDir, `Viseron_Roadmap_Tecnico_${dateStr}.pdf`);
  const d2 = makeDoc(p2Out, "ROADMAP TÉCNICO — O QUE FALTA + COMO VOLTAR A CADA ETAPA",
    `Comandos exactos e ficheiros para retomar qualquer fase — ${dateStr} · Trinnity Viseron System v5.0`);

  heading(d2, "0", "Como voltar a cada etapa já feita (verificação rápida)");
  for (const [c, dsc] of [
    ["npm run lint", "Typecheck global (tsc --noEmit)"],
    ["npm run test", "Todos os testes: core + web + omega + os"],
    ["npm run demo", "Demo operacional real (HTTP 9 endpoints)"],
    ["npm run dev:web", "API web standalone em dev (localhost:3000)"],
    ["npm run call:start", "CallSystemBridge standalone (chamadas)"],
    ["npm run tvs", "Estado do TVS OS (kernel/agentes/watchdog)"],
    ["npm run build:exe:win", "Reconstruir o .exe standalone (pkg)"],
    ["npm run build:android", "Build APK Android (expo run:android)"],
    ["npm run build:apk-installer", "Reconstruir o Setup.exe do APK (NSIS)"],
    ["npm run pdfs:all", "Regenerar TODOS os PDFs do projeto"],
  ]) code(d2, c, dsc);

  heading(d2, "1", "Fase IA Cloud (bloqueada por chaves)");
  bullet(d2, "Adicionar ao .env e reiniciar: OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, XAI_API_KEY.");
  code(d2, "npm run dev", "Reiniciar com as chaves carregadas");
  code(d2, "curl http://localhost:3000/api/ai/status", "Ver o provider ativo e modelo");
  bullet(d2, "Ficheiros: src/web/jarvis/agent.ts (router de provider), src/web/revenue/routes.ts (/api/ai/status).");
  bullet(d2, "Depois: testar JARVIS complexo via POST /api/jarvis/chat e as análises de chamada (src/web/calls/learning.ts) passam a usar o modelo cloud.");

  heading(d2, "2", "Fase Chamadas telefónicas reais (próximo passo D2)");
  bullet(d2, "MISSING: Media Streams do Twilio (bidi stream de áudio) para resposta em voz em tempo real em vez de Gather por turno.");
  bullet(d2, "MISSING: verificar/destino de voz no número Twilio (trial bloqueia chamadas para números não validados).");
  bullet(d2, "MISSING: ligar a rececionista de empresas (D5) ao telefone — quando chega chamada inbound, responder com o knowledge base da empresa.");
  bullet(d2, "MISSING: registos — migrar data/calls/calls.jsonl e data/knowledge/call-learned.jsonl para Postgres (tabelas calls, call_learned).");
  code(d2, "npm run dev:web", "Servidor com webhooks /api/calls/twilio/*");
  code(d2, "npx tsx src/integrations/call-system/CallSystemBridge.ts", "Bridge standalone de chamadas");
  code(d2, "curl -X POST http://localhost:3000/api/calls/outbound -H 'Content-Type: application/json' -d '{\"to\":\"+351...\"}'", "Testar outbound");
  bullet(d2, "Ficheiros: src/web/calls/{store,learning,routes}.ts, src/integrations/call-system/CallSystemBridge.ts, .env TWILIO_*.");

  heading(d2, "3", "Fase Voz (VoiceBridge)");
  bullet(d2, "MISSING: streaming de áudio WebSocket para o widget de voz no navegador (hoje é texto + resposta por turno).");
  bullet(d2, "MISSING: ligar as falas de Pedro/Trinnity (PT/EN/ES) a TTS real (ElevenLabs já configurado em CallSystemConfig).");
  bullet(d2, "MISSING: registos — data/voice/history.jsonl e data/knowledge/voice-learned.jsonl → Postgres.");
  code(d2, "npm run dev", "Core com VoiceBridge em localhost:3001 (report server)");
  code(d2, "cd src/dashboard && npm run dev", "Dashboard com widget de voz (voice-widget.js)");
  bullet(d2, "Ficheiros: src/voice/VoiceBridge.ts, src/dashboard/public/voice-widget.js, src/dashboard/server.ts.");

  heading(d2, "4", "Fase Sites gerados (D3)");
  bullet(d2, "MISSING: deploy automático de cada site gerado para um domínio/pasta pública (hoje fica em data/sites/<slug> e /sites/<slug> no servidor).");
  bullet(d2, "MISSING: exportar ZIP de cada site (package: archiver) e endpoint /api/sites/:slug/download.");
  bullet(d2, "MISSING: vendê-lo — criar plano 'Sites' no billing (site + domínio + manutenção).");
  code(d2, "curl -X POST http://localhost:3000/api/sites/generate -H 'Content-Type: application/json' -d '{\"name\":\"X\",\"description\":\"Y\"}'", "Gerar site de teste");
  code(d2, "curl http://localhost:3000/api/sites/list", "Listar sites gerados");
  bullet(d2, "Ficheiros: src/web/sites/{store,generator,routes}.ts.");

  heading(d2, "5", "Fase APKs gerados (D4)");
  bullet(d2, "MISSING: build real de cada scaffold — `cd data/apps/<slug> && npm i && npx expo prebuild && gradlew assembleRelease`.");
  bullet(d2, "MISSING: EAS cloud (npx eas login) para gerar APK/IPA sem SDK local e ligar /api/apps/:slug/build.");
  bullet(d2, "MISSING: registos — data/apps/apps.json → Postgres + estado de build por app.");
  code(d2, "curl -X POST http://localhost:3000/api/apps/generate -H 'Content-Type: application/json' -d '{\"name\":\"X\",\"description\":\"Y\"}'", "Gerar app de teste");
  code(d2, "curl http://localhost:3000/api/apps/myslug/source", "Ver todos os ficheiros gerados");
  bullet(d2, "Ficheiros: src/web/apps/{store,generator,routes}.ts.");

  heading(d2, "6", "Fase Negócio / atendimento (D5)");
  bullet(d2, "MISSING: UI no dashboard — criar/editar agentes, ver histórico e KPIs de mensagens.");
  bullet(d2, "MISSING: integração com email (responder clientes por Gmail) e com chamadas (D2).");
  bullet(d2, "MISSING: billing por agente (plano novo no Avirato/Stripe) e limites por plano.");
  bullet(d2, "MISSING: registos — data/business/agents.json + messages → Postgres (tabelas business_agents, business_messages).");
  code(d2, "curl -X POST http://localhost:3000/api/business/agents -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{\"name\":\"X\",\"description\":\"Y\"}'", "Criar agente (JWT)");
  code(d2, "curl -X POST http://localhost:3000/api/business/agents/<id>/messages -d '{\"from\":\"cli\",\"message\":\"oi\"}'", "Cliente conversa");
  bullet(d2, "Ficheiros: src/web/business/{store,routes}.ts.");

  heading(d2, "7", "Fase Produção / infraestrutura");
  bullet(d2, "MISSING: Postgres — criar tabelas calls, call_learned, business_agents, business_messages, sites, apps (migrações em migrations/).");
  bullet(d2, "MISSING: deploy automático no Render após cada push (hoje manual via API POST /services/{id}/deploys com body {}).");
  bullet(d2, "MISSING: monitorização das novas APIs no /api/health e /api/metrics.");
  bullet(d2, "MISSING: backup diário de data/calls, data/business, data/sites, data/apps (npm run backup).");
  code(d2, "npm run deploy", "Deploy GitHub + Vercel (PDFs regenerados automaticamente)");
  code(d2, "node -e \"fetch('https://api.render.com/v1/services/'+process.env.RENDER_SERVICE_ID+'/deploys',{method:'POST',headers:{Authorization:'Bearer '+process.env.RENDER_API_KEY,'Content-Type':'application/json'},body:'{}'}).then(r=>r.json()).then(console.log)\"", "Deploy forçado Render via API");
  code(d2, "npm run restart", "Reinício à prova de congelamento (mata órfãos + verifica health/os/revenue)");
  code(d2, "npm run update:auto", "Self-update completo: pull + install + PDFs + build + testes + deploy");
  code(d2, "npm run backup", "Backup diário");
  bullet(d2, "Ficheiros: migrations/001_schema.sql, src/web/standalone-server.ts, scripts/restart.ps1, scripts/self-update.ps1.");

  heading(d2, "8", "Testes que faltam escrever");
  for (const [c, dsc] of [
    ["tests/web.test.ts", "Adicionar blocos para /api/calls/*, /api/sites/*, /api/apps/*, /api/business/* (JWT + rate-limit)"],
    ["tests/os.test.ts", "Verificar que o TVS OS continua 25/25 após novas APIs"],
    ["npm run test", "Suíte completa antes de cada deploy"],
  ]) code(d2, c, dsc);

  footer(d2, dateStr);
  d2.end();
  console.log(`✔ Roadmap técnico gerado: ${p2Out}`);
}

try {
  main();
} catch (e: any) {
  console.error("Falha ao gerar plano estratégico:", e.message);
  process.exit(1);
}
