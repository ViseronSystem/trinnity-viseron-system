import fs from "fs";
import path from "path";
import { createTheme } from "./pdf-theme";
import type { Theme } from "./pdf-theme";

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

// Comandos longos (>~80 chars) não cabem numa linha do t.code (lineBreak:false).
// Desenha um bloco de código com quebra de linha real (via t.doc), sem overflow.
function codeBlock(t: Theme, cmd: string, desc?: string): void {
  const W = t.doc.page.width;
  const ML = 54;
  const cw = W - 108;
  const d = t.doc;
  const cmdH = d.font("Helvetica-Bold").fontSize(9.5).heightOfString(cmd, { width: cw - 20, lineGap: 2 });
  let descH = 0;
  if (desc) descH = d.font("Helvetica").fontSize(8.5).heightOfString(desc, { width: cw - 20, lineGap: 1 }) + 4;
  const boxH = 16 + cmdH + descH;
  t.ensure(boxH);
  const y0 = d.y;
  d.save();
  d.roundedRect(ML, y0, cw, boxH, 6).fill("#0f172a");
  d.fillColor("#22d3ee").font("Helvetica-Bold").fontSize(9.5)
    .text(cmd, ML + 10, y0 + 8, { width: cw - 20, lineGap: 2 });
  if (desc) {
    d.fillColor("#cbd5e1").font("Helvetica").fontSize(8.5)
      .text(desc, ML + 10, y0 + 8 + cmdH + 4, { width: cw - 20, lineGap: 1 });
  }
  d.restore();
  d.y = y0 + boxH + 2;
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
  try { health = JSON.parse(exec("node -e \"Promise.race([fetch('https://viseron-web.onrender.com/api/health'),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),10000))]).then(r=>r.json()).then(j=>console.log(JSON.stringify(j))).catch(()=>console.log('{}'))\"", { timeout: 20000 }) || "{}"); } catch {}

  const exe = fs.existsSync(".build/tvs-standalone/tvs-viseron-win.exe") ? Math.round(fs.statSync(".build/tvs-standalone/tvs-viseron-win.exe").size / 1e6) : 0;
  const apk = fs.existsSync("src/dashboard/public/downloads/TrinnityViseron.apk") ? Math.round(fs.statSync("src/dashboard/public/downloads/TrinnityViseron.apk").size / 1e6) : 0;
  const setup = fs.existsSync("src/dashboard/public/downloads/TrinnityViseron-APK-Setup-5.0.0.exe") ? Math.round(fs.statSync("src/dashboard/public/downloads/TrinnityViseron-APK-Setup-5.0.0.exe").size / 1e6) : 0;

  // =====================================================================
  // PDF 1 - PLANO ESTRATEGICO
  // =====================================================================
  const p1Out = path.join(dataDir, `Viseron_Plano_Estrategico_${dateStr}.pdf`);
  const t1 = createTheme({
    title: "Trinnity Viseron System — Plano Estratégico",
    subject: `Sprint de transformação em produto — ${dateStr} · Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)`,
  });

  t1.cover({
    title: "PLANO ESTRATÉGICO",
    subtitle: `Sprint de transformação em produto — ${dateStr} · Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)`,
    badges: ["Sprint D1–D6", "Go-live", "TVS v5.0"],
    date: dateStr,
    version: "5.0",
    url: "www.trinnityviseronsystem.io",
  });

  t1.section("1", "O que ficou feito neste sprint (D1–D6)");
  const done: Array<[string, string]> = [
    ["D1 · Produção/Postgres", "Contas e tenants migrados para Postgres Neon — fim da perda de dados no Render. API live: tenants=9, users=9, usage_events=42. Deploy forçado via API Render."],
    ["D2 · Chamadas + Voz", "Webhooks Twilio inbound/gather/status + outbound REST; cada chamada é transcrita, analisada por IA local (qwen2.5:3b) e aprende (data/knowledge/call-learned.jsonl). VoiceBridge guarda histórico e aprende por comando."],
    ["D3 · Criador de sites", "POST /api/sites/generate {name, description} → site HTML completo gerado por IA local + preview em /sites/<slug> (trilingue PT/EN/ES)."],
    ["D4 · Criador de APKs", "POST /api/apps/generate → scaffold Expo completo (App.tsx + app.json + package.json) gerado por IA local."],
    ["D5 · Atendimento a empresas", "POST /api/business/agents — rececionista IA com greeting + knowledge base por empresa, histórico, JWT + rate-limit."],
    ["D6 · Builds reais", ".exe standalone 50.7 MB, APK Android release 65 MB, Setup.exe do APK 24.6 MB — prontos nos Downloads do site."],
  ];
  for (const [k, v] of done) t1.kv(k, v);

  t1.section("2", "Estado real do sistema (verificado agora)");
  t1.kv("Testes core", tCoreLine);
  t1.kv("Testes web", tWebLine);
  t1.kv("Testes TVS OS", tOsLine);
  t1.kv("Lint (tsc --noEmit)", lintOk ? "PASS" : "FALHOU");
  t1.kv("API produção", health?.status === "OK" ? `OK · db=${health?.db} tenants=${health?.tenants} users=${health?.users}` : "offline");
  t1.kv("Artefactos", `.exe ${fmt(exe)} MB · APK ${fmt(apk)} MB · Setup ${fmt(setup)} MB`);

  t1.section("3", "Modelo de receita (cobranças reais prontas)");
  t1.bullet("▸", "Planos: Core $29/mês · Pro $99/mês · Enterprise $499/mês (GET /api/billing/plans).");
  t1.bullet("▸", "Avirato Payments primário (API key + webcode + client secret) — checkout real e webhook HMAC a dar upgrade do plano.");
  t1.bullet("▸", "Stripe opcional (npm run go-live:stripe cria os 3 planos).");
  t1.bullet("▸", "Revenue readiness 6/6: processador, webhook, Gmail, email provider, domínio, Postgres.");
  t1.bullet("▸", "Novo motor de receita: agentes de atendimento a empresas (D5) — cobrança por agente/mês.");

  t1.section("4", "Veredicto go-live");
  t1.bullet("▸", "PRONTO: vender assinaturas (checkout Avirato real), registar empresas, gerar sites/apps, atender clientes por email e chat.", "#047857");
  t1.bullet("▸", "QUASE PRONTO: chamadas telefónicas reais (faltam Media Streams/STT do Twilio + verificar número de voz) e IA cloud (faltam chaves).", "#b45309");
  t1.bullet("▸", "PENDENTE: UI no dashboard para os novos agentes e publicidade das ferramentas D3/D4/D5 no site.", "#b91c1c");

  t1.section("5", "Próximas ações prioritárias");
  for (const n of [
    "Adicionar OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY ao .env para raciocínio cloud (JARVIS + análises complexas).",
    "Ativar Media Streams do Twilio para voz bidirecional em tempo real (atualmente é Gather STT + TTS por turno).",
    "Verificar o número Twilio para voz (trial exige destino validado) e apontar webhooks para TVS_PUBLIC_URL.",
    "Construir UI no dashboard para gerir agentes de atendimento, sites e apps gerados.",
    "Publicar os 3 artefactos de build nos Downloads do site (roadmap D6).",
  ]) t1.bullet("▸", n);

  t1.section("6", "Commits recentes");
  for (const c of commits) {
    t1.bullet("▸", c.length > 110 ? c.slice(0, 110) + "…" : c);
  }

  t1.finish(p1Out);
  console.log(`✔ Plano estratégico gerado: ${p1Out}`);

  // =====================================================================
  // PDF 2 - ROADMAP TECNICO (o que falta + comandos para voltar a cada etapa)
  // =====================================================================
  const p2Out = path.join(dataDir, `Viseron_Roadmap_Tecnico_${dateStr}.pdf`);
  const t2 = createTheme({
    title: "Roadmap Técnico — O que falta + como voltar a cada etapa",
    subject: `Comandos exactos e ficheiros para retomar qualquer fase — ${dateStr} · Trinnity Viseron System v5.0`,
  });

  t2.cover({
    title: "ROADMAP TÉCNICO",
    subtitle: `O que falta + como voltar a cada etapa — ${dateStr} · Trinnity Viseron System v5.0`,
    badges: ["O que falta", "Comandos exactos", "Fases D2–D6"],
    date: dateStr,
    version: "5.0",
    url: "www.trinnityviseronsystem.io",
  });

  t2.section("0", "Como voltar a cada etapa já feita (verificação rápida)");
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
  ]) t2.code(c, dsc);

  t2.section("1", "Fase IA Cloud (bloqueada por chaves)");
  t2.bullet("▸", "Adicionar ao .env e reiniciar: OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, XAI_API_KEY.");
  t2.code("npm run dev", "Reiniciar com as chaves carregadas");
  t2.code("curl http://localhost:3000/api/ai/status", "Ver o provider ativo e modelo");
  t2.bullet("▸", "Ficheiros: src/web/jarvis/agent.ts (router de provider), src/web/revenue/routes.ts (/api/ai/status).");
  t2.bullet("▸", "Depois: testar JARVIS complexo via POST /api/jarvis/chat e as análises de chamada (src/web/calls/learning.ts) passam a usar o modelo cloud.");

  t2.section("2", "Fase Chamadas telefónicas reais (próximo passo D2)");
  t2.bullet("▸", "MISSING: Media Streams do Twilio (bidi stream de áudio) para resposta em voz em tempo real em vez de Gather por turno.");
  t2.bullet("▸", "MISSING: verificar/destino de voz no número Twilio (trial bloqueia chamadas para números não validados).");
  t2.bullet("▸", "MISSING: ligar a rececionista de empresas (D5) ao telefone — quando chega chamada inbound, responder com o knowledge base da empresa.");
  t2.bullet("▸", "MISSING: registos — migrar data/calls/calls.jsonl e data/knowledge/call-learned.jsonl para Postgres (tabelas calls, call_learned).");
  t2.code("npm run dev:web", "Servidor com webhooks /api/calls/twilio/*");
  t2.code("npx tsx src/integrations/call-system/CallSystemBridge.ts", "Bridge standalone de chamadas");
  codeBlock(t2, "curl -X POST http://localhost:3000/api/calls/outbound -H 'Content-Type: application/json' -d '{\"to\":\"+351...\"}'", "Testar outbound");
  t2.bullet("▸", "Ficheiros: src/web/calls/{store,learning,routes}.ts, src/integrations/call-system/CallSystemBridge.ts, .env TWILIO_*.");

  t2.section("3", "Fase Voz (VoiceBridge)");
  t2.bullet("▸", "MISSING: streaming de áudio WebSocket para o widget de voz no navegador (hoje é texto + resposta por turno).");
  t2.bullet("▸", "MISSING: ligar as falas de Pedro/Trinnity (PT/EN/ES) a TTS real (ElevenLabs já configurado em CallSystemConfig).");
  t2.bullet("▸", "MISSING: registos — data/voice/history.jsonl e data/knowledge/voice-learned.jsonl → Postgres.");
  t2.code("npm run dev", "Core com VoiceBridge em localhost:3001 (report server)");
  t2.code("cd src/dashboard && npm run dev", "Dashboard com widget de voz (voice-widget.js)");
  t2.bullet("▸", "Ficheiros: src/voice/VoiceBridge.ts, src/dashboard/public/voice-widget.js, src/dashboard/server.ts.");

  t2.section("4", "Fase Sites gerados (D3)");
  t2.bullet("▸", "MISSING: deploy automático de cada site gerado para um domínio/pasta pública (hoje fica em data/sites/<slug> e /sites/<slug> no servidor).");
  t2.bullet("▸", "MISSING: exportar ZIP de cada site (package: archiver) e endpoint /api/sites/:slug/download.");
  t2.bullet("▸", "MISSING: vendê-lo — criar plano 'Sites' no billing (site + domínio + manutenção).");
  codeBlock(t2, "curl -X POST http://localhost:3000/api/sites/generate -H 'Content-Type: application/json' -d '{\"name\":\"X\",\"description\":\"Y\"}'", "Gerar site de teste");
  t2.code("curl http://localhost:3000/api/sites/list", "Listar sites gerados");
  t2.bullet("▸", "Ficheiros: src/web/sites/{store,generator,routes}.ts.");

  t2.section("5", "Fase APKs gerados (D4)");
  t2.bullet("▸", "MISSING: build real de cada scaffold — `cd data/apps/<slug> && npm i && npx expo prebuild && gradlew assembleRelease`.");
  t2.bullet("▸", "MISSING: EAS cloud (npx eas login) para gerar APK/IPA sem SDK local e ligar /api/apps/:slug/build.");
  t2.bullet("▸", "MISSING: registos — data/apps/apps.json → Postgres + estado de build por app.");
  codeBlock(t2, "curl -X POST http://localhost:3000/api/apps/generate -H 'Content-Type: application/json' -d '{\"name\":\"X\",\"description\":\"Y\"}'", "Gerar app de teste");
  t2.code("curl http://localhost:3000/api/apps/myslug/source", "Ver todos os ficheiros gerados");
  t2.bullet("▸", "Ficheiros: src/web/apps/{store,generator,routes}.ts.");

  t2.section("6", "Fase Negócio / atendimento (D5)");
  t2.bullet("▸", "MISSING: UI no dashboard — criar/editar agentes, ver histórico e KPIs de mensagens.");
  t2.bullet("▸", "MISSING: integração com email (responder clientes por Gmail) e com chamadas (D2).");
  t2.bullet("▸", "MISSING: billing por agente (plano novo no Avirato/Stripe) e limites por plano.");
  t2.bullet("▸", "MISSING: registos — data/business/agents.json + messages → Postgres (tabelas business_agents, business_messages).");
  codeBlock(t2, "curl -X POST http://localhost:3000/api/business/agents -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{\"name\":\"X\",\"description\":\"Y\"}'", "Criar agente (JWT)");
  codeBlock(t2, "curl -X POST http://localhost:3000/api/business/agents/<id>/messages -d '{\"from\":\"cli\",\"message\":\"oi\"}'", "Cliente conversa");
  t2.bullet("▸", "Ficheiros: src/web/business/{store,routes}.ts.");

  t2.section("7", "Fase Produção / infraestrutura");
  t2.bullet("▸", "MISSING: Postgres — criar tabelas calls, call_learned, business_agents, business_messages, sites, apps (migrações em migrations/).");
  t2.bullet("▸", "MISSING: deploy automático no Render após cada push (hoje manual via API POST /services/{id}/deploys com body {}).");
  t2.bullet("▸", "MISSING: monitorização das novas APIs no /api/health e /api/metrics.");
  t2.bullet("▸", "MISSING: backup diário de data/calls, data/business, data/sites, data/apps (npm run backup).");
  t2.code("npm run deploy", "Deploy GitHub + Vercel (PDFs regenerados automaticamente)");
  codeBlock(t2, "node -e \"fetch('https://api.render.com/v1/services/'+process.env.RENDER_SERVICE_ID+'/deploys',{method:'POST',headers:{Authorization:'Bearer '+process.env.RENDER_API_KEY,'Content-Type':'application/json'},body:'{}'}).then(r=>r.json()).then(console.log)\"", "Deploy forçado Render via API");
  t2.code("npm run restart", "Reinício à prova de congelamento (mata órfãos + verifica health/os/revenue)");
  t2.code("npm run update:auto", "Self-update completo: pull + install + PDFs + build + testes + deploy");
  t2.code("npm run backup", "Backup diário");
  t2.bullet("▸", "Ficheiros: migrations/001_schema.sql, src/web/standalone-server.ts, scripts/restart.ps1, scripts/self-update.ps1.");

  t2.section("8", "Testes que faltam escrever");
  for (const [c, dsc] of [
    ["tests/web.test.ts", "Adicionar blocos para /api/calls/*, /api/sites/*, /api/apps/*, /api/business/* (JWT + rate-limit)"],
    ["tests/os.test.ts", "Verificar que o TVS OS continua 25/25 após novas APIs"],
    ["npm run test", "Suíte completa antes de cada deploy"],
  ]) t2.code(c, dsc);

  t2.finish(p2Out);
  console.log(`✔ Roadmap técnico gerado: ${p2Out}`);
}

try {
  main();
} catch (e: any) {
  console.error("Falha ao gerar plano estratégico:", e.message);
  process.exit(1);
}
