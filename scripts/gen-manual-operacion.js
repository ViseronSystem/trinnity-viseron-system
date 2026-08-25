// TVS - Manual de Operação Humana (PDF) - gerado com pdfkit
// Uso: node scripts/gen-manual-operacion.js
const fs = require("fs-extra");
const path = require("path");
const PDFDocument = require("pdfkit");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data", "reports");
const OUT_FILE = path.join(OUT_DIR, "TVS_Pasos_Humanos_Operacion.pdf");
fs.ensureDirSync(OUT_DIR);

const PAGE_W = 595; // A4
const PAGE_H = 842;
const MARGIN = 45;
const MAX_Y = PAGE_H - 55;

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 45, bottom: 45, left: MARGIN, right: MARGIN },
  bufferPages: true,
});

let y = MARGIN;

function ensure(h = 60) {
  if (y + h > MAX_Y) {
    doc.addPage();
    y = MARGIN;
  }
}

function fillColor(hex) { doc.fillColor(hex); }
function text(txt, size = 10, opts = {}) {
  doc.font("Helvetica").fontSize(size).fillColor("#2a2a3a");
  const lines = doc.heightOfString(txt, { width: PAGE_W - MARGIN * 2, ...opts });
  ensure(lines);
  doc.text(txt, MARGIN, y, { width: PAGE_W - MARGIN * 2, ...opts });
  y = doc.y + 4;
}

function section(num, title) {
  ensure(50);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 30).fill("#0a0a2e");
  doc.fillColor("#00ff87").font("Helvetica-Bold").fontSize(14);
  doc.text(`${num}. ${title}`, MARGIN + 10, y + 8, { width: PAGE_W - MARGIN * 2 - 20 });
  y += 42;
}

function sub(title) {
  ensure(40);
  fillColor("#bf5af2");
  doc.font("Helvetica-Bold").fontSize(12).text(title, MARGIN, y, { width: PAGE_W - MARGIN * 2 });
  y = doc.y + 6;
}

function bullet(txt, sym = "•") {
  ensure(30);
  text(`${sym} ${txt}`, 9.5);
}

function codeBlock(cmd) {
  ensure(40);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 20).fill("#11111f");
  doc.fillColor("#00f0ff").font("Courier").fontSize(9);
  doc.text(cmd, MARGIN + 8, y + 6, { width: PAGE_W - MARGIN * 2 - 16 });
  y += 26;
}

function table(headers, rows, colWidths) {
  const tw = PAGE_W - MARGIN * 2;
  const rowH = 20;
  const lineH = 9.5;
  ensure(rows.length * rowH + 40);
  const drawRow = (cells, isHeader) => {
    let maxH = rowH;
    for (let i = 0; i < cells.length; i++) {
      const hh = doc.heightOfString(cells[i], { width: colWidths[i] - 8 });
      if (hh > maxH) maxH = hh;
    }
    ensure(maxH + 4);
    let x = MARGIN;
    for (let i = 0; i < cells.length; i++) {
      if (isHeader) doc.rect(x, y, colWidths[i], maxH).fill("#0a0a2e");
      else doc.rect(x, y, colWidths[i], maxH).fill(i % 2 ? "#f4f4fb" : "#ffffff");
      doc.rect(x, y, colWidths[i], maxH).stroke("#ccccdd");
      doc.fillColor(isHeader ? "#00ff87" : "#2a2a3a")
        .font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(lineH)
        .text(cells[i], x + 4, y + 3, { width: colWidths[i] - 8 });
      x += colWidths[i];
    }
    y += maxH;
  };
  drawRow(headers, true);
  for (const r of rows) drawRow(r, false);
  y += 10;
}

// ============ CAPA ============
doc.rect(0, 0, PAGE_W, PAGE_H).fill("#0a0a2e");
fillColor("#00ff87");
doc.font("Helvetica-Bold").fontSize(30).text("TRINNITY VISERON SYSTEM", MARGIN, 200, { align: "center", width: PAGE_W - MARGIN * 2 });
doc.font("Helvetica-Bold").fontSize(22).fillColor("#00f0ff").text("MANUAL DE OPERAÇÃO HUMANA", MARGIN, 260, { align: "center", width: PAGE_W - MARGIN * 2 });
doc.font("Helvetica").fontSize(13).fillColor("#ffffff").text("v7.0 — Todos os passos que uma pessoa precisa executar em todo o sistema", MARGIN, 310, { align: "center", width: PAGE_W - MARGIN * 2 });
doc.moveTo(MARGIN + 80, 355).lineTo(PAGE_W - MARGIN - 80, 355).strokeColor("#bf5af2").stroke();
doc.font("Helvetica").fontSize(12).fillColor("#ccccff").text("👑 Pedro Costa — Comandante Supremo\n👸 Trinnity Hurtado — Rainha Arquiteta", MARGIN, 380, { align: "center", width: PAGE_W - MARGIN * 2 });
doc.font("Helvetica").fontSize(10).fillColor("#8888bb").text(`Gerado automaticamente em ${new Date().toLocaleString("pt-BR")}`, MARGIN, 500, { align: "center", width: PAGE_W - MARGIN * 2 });
doc.addPage();

// ============ 1. BARRIDO ============
section(1, "RESULTADO DO BARRIDO AUTOMÁTICO (varredura dos squads AIOX)");
text("Uma varredura completa do sistema foi orquestrada pelos squads AIOX e supervisionada por Pedro Costa e Trinnity Hurtado. Foram encontradas e corrigidas as seguintes falhas críticas:", 10);
table(
  ["Área", "Falha encontrada", "Correção aplicada"],
  [
    ["Dashboard WebOS", "webos.js com erro de sintaxe (interface morta)", "Sintaxe corrigida — dashboard volta a funcionar"],
    ["Forge Git", "Rotas Express 5 inválidas (crash no arranque) + git push vazio", "Rotas corrigidas + git-receive-pack/upload-pack reais"],
    ["Configuração", ".env nunca era carregado (IA cloud toda em modo simulado)", "dotenv/config carregado nos servidores"],
    ["AgentSpawner", "Caminho de minds.json quebrado em modo dev", "Resolução robusta (cwd + __dirname)"],
    ["IA", "4.756 mentes usavam provider 'openai' (violava regra Ollama)", "Provider padrão agora é ollama (local)"],
    ["Scripts npm", "call:start, jarvis:start, asno:start, omniroute:start quebrados", "startServer exportado + guarda contra null"],
    ["WebAppGenerator", "Token sites gerados com sintaxe inválida + portas 3000 colidindo", "Interpolação corrigida + portas 4100+"],
    ["HyperLearning", "Inteligência explodia x6 por ciclo (valor sem sentido)", "Crescimento +5% com teto de 1.000.000"],
    ["tvstools", "Comando 'transcrever' nunca funcionava (precedência)", "Parênteses corrigidos"],
    ["Produção", "Porta 3000 fixa ignorava PORT (crash em Railway/Render)", "Agora respeita process.env.PORT"],
    ["Segurança", ".env ia para Docker/pkg/backups; senha n8n fixa", ".dockerignore criado; .env removido de pkg/backups; senha via env"],
    ["Mentes", "Missão de 5.000+ mentes não era cumprida (4.756)", "Regeneradas: 5.000 mentes (342 históricas + 4.658 sintéticas)"],
  ],
  [110, 240, 155]
);
text("Estado final verificado: build OK, lint OK, testes 10/10, arranque com 5.370 agentes totais (5.000 mentes + 246 arquetipos + 114 batallón + ~10 núcleo).", 10);

// ============ 2. PREPARAÇÃO ============
section(2, "PREPARAÇÃO INICIAL (executar UMA VEZ)");
sub("2.1 — Instalar ferramentas");
bullet("Instalar Node.js 20 LTS (https://nodejs.org) — necessário para compilar e rodar o sistema.");
bullet("Instalar Git (https://git-scm.com) e configurar: `git config --global user.name/user.email`.");
bullet("Clonar/copiar o repositório para uma pasta sem espaços, ex.: C:\\Trinnity-Viseron-System.");
sub("2.2 — Instalar dependências");
codeBlock("npm install");
codeBlock("cd mobile && npm install && cd ..");
bullet("Se não houver node_modules no projeto, este comando cria tudo que é preciso.");
sub("2.3 — Configurar variáveis de ambiente (.env)");
bullet("Copiar o modelo: `Copy-Item .env.example .env` e editar com o Bloco de Notas.");
bullet("IA LOCAL (obrigatório p/ funcionar sem custo): instalar Ollama e baixar modelos:");
codeBlock("ollama pull llama3:8b\nollama pull qwen3:9b\nollama pull deepseek-coder");
bullet("IA NUVEM (opcional, para raciocínio complexo): preencher OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, XAI_API_KEY no .env.");
bullet("Serviços opcionais: TWILIO_ACCOUNT_SID/AUTH_TOKEN (chamadas), RENDER_API_KEY (deploy), HOSTALIA_FTP_* (FTP), CLOUDFLARE_* (CDN/DNS).");
sub("2.4 — Compilar o sistema");
codeBlock("npm run build");
bullet("Gera a pasta dist/ com o sistema pronto para produção.");

// ============ 3. DIÁRIA ============
section(3, "OPERAÇÃO DIÁRIA (todos os dias)");
sub("3.1 — Ligar o sistema");
codeBlock("npm start");
bullet("OU modo desenvolvimento (recarrega sozinho ao editar código):");
codeBlock("npm run dev");
sub("3.2 — Verificar que está tudo OK");
bullet("Abrir o WebOS (interface do sistema): http://localhost:3000/dashboard.html");
bullet("Abrir o relatório PDF em tempo real: http://localhost:3001/report/pdf");
bullet("Ver o relatório completo (agentes, tokenomics, linhagens): http://localhost:3001/report/comprehensive-pdf");
bullet("Conferir o log: `Get-Content data/system.log -Tail 100`.");
bullet("Confirmar que o total de agentes é ~5.370 e que a evolução avança (+5% por ciclo).");
sub("3.3 — Comandos de voz / chat");
bullet("Usar o painel de voz no dashboard para falar com JARVIS/ASNO (requer microfone e, p/ chamadas reais, credenciais Twilio + URL pública).");

// ============ 4. SEMANAL ============
section(4, "OPERAÇÃO SEMANAL (1x por semana)");
sub("4.1 — Backup");
codeBlock("npm run backup");
bullet("Gera um .zip em backups/ com configuração, dados, memória e código.");
bullet("O .env NÃO entra no zip por segurança — guarde as chaves em um cofre separado.");
bullet("Para automatizar todo dia às 03:00, executar uma vez:");
codeBlock("npm run backup:schedule");
sub("4.2 — Verificações de qualidade");
codeBlock("npm run lint");
codeBlock("npm test");
bullet("O lint deve terminar sem erros e os testes devem mostrar 10/10 PASS.");
sub("4.3 — Revisar memória de longo prazo");
bullet("A memória cresce em database/memory/ltm.json (pode passar de 50 MB). Revisar tamanho e limpar backups antigos em database/memory/backups/ se necessário.");

// ============ 5. MENSAL ============
section(5, "MANUTENÇÃO MENSAL (1x por mês)");
bullet("Atualizar dependências com cuidado: `npm audit` e atualizar apenas o necessário.");
bullet("Limpar backups antigos (o script já apaga com mais de 30 dias) e logs grandes (data/system.log).");
bullet("Regenerar as mentes se quiser variar os agentes sintéticos: `npx tsx scripts/generateMinds.ts`.");
bullet("Revisar a pasta generated-apps/ (apps gerados por IA) e remover o que não for usar.");
bullet("Verificar os relatórios em data/reports/ (cycle_N.json, evolution_log.json) e arquivar PDFs importantes.");
bullet("Testar o build completo de ponta a ponta: `npm run init:full` (build + backup + start).");

// ============ 6. DEPLOY ============
section(6, "PUBLICAÇÃO / DEPLOY (quando for publicar)");
sub("6.1 — Publicar código no GitHub");
codeBlock("npm run deploy:github");
bullet("Confirma que o remote está certo: `git remote -v` (o correto é github.com/ViseronSystem/trinnity-viseron-system).");
bullet("Nunca commitar o .env — ele já está no .gitignore.");
sub("6.2 — Publicar o site na Vercel (site estático)");
codeBlock("npm run deploy:vercel");
bullet("Se for a primeira vez: `npx vercel login` e autorizar no navegador.");
sub("6.3 — Publicar a API/backend na Render");
codeBlock("npm run deploy:render");
bullet("Antes, configurar em .env: RENDER_API_KEY e RENDER_SERVICE_ID.");
bullet("Na Render, adicionar as variáveis de ambiente (PORT, e as chaves de IA) no painel do serviço.");
sub("6.4 — Publicar por FTP (Hostalia)");
codeBlock("npm run deploy:hostalia");
bullet("Antes, configurar em .env: HOSTALIA_FTP_HOST, HOSTALIA_FTP_USER, HOSTALIA_FTP_PASS, HOSTALIA_FTP_PATH.");
bullet("No servidor de produção, rodar `npm start` com PORT atribuída pelo provedor (o sistema respeita process.env.PORT).");

// ============ 7. BACKUP ============
section(7, "BACKUP E RECUPERAÇÃO");
sub("7.1 — Fazer backup");
codeBlock("npm run backup");
bullet("Backups ficam em backups/YYYY-MM-DD_HHMMSS.zip (retidos 30 dias).");
sub("7.2 — Recuperar de um backup");
bullet("Descompactar o zip em uma pasta limpa.");
bullet("Restaurar manualmente o .env (não está no zip por segurança).");
bullet("Rodar `npm install` e `npm run build`, depois `npm start`.");
sub("7.3 — Agendar backup automático");
codeBlock("npm run backup:schedule");
bullet("Cria a tarefa 'TVS-DailyBackup' no Agendador do Windows (03:00).");

// ============ 8. MOBILE ============
section(8, "APP MÓVEL (Android APK / iOS IPA)");
sub("8.1 — Preparar o ambiente");
bullet("Android: instalar Android Studio + SDK 34 e criar um emulador (ou conectar um aparelho com depuração USB).");
bullet("iOS: só funciona em macOS com Xcode instalado.");
sub("8.2 — Desenvolvimento com Expo");
codeBlock("npm run mobile:start");
sub("8.3 — Gerar o APK Android");
codeBlock("npm run build:android");
bullet("Para gerar APK final para a Play Store, é preciso conta EAS: `cd mobile && npx eas login` e `npx eas build --platform android`.");
sub("8.4 — Gerar o IPA iOS (macOS)");
codeBlock("npm run build:ios");
sub("8.5 — Configurar o servidor no app");
bullet("O app conecta ao servidor padrão definido em mobile/app.json → extra.tvsServerUrl (ex.: http://192.168.1.10:3000 para a rede local).");
bullet("Dentro do app, a tela de Configurações permite trocar o IP do servidor sem recompilar.");

// ============ 9. IA ============
section(9, "IA LOCAL E NUVEM");
sub("9.1 — Local (padrão, sem custo)");
bullet("Todas as 5.000 mentes usam o modelo local via Ollama (provider 'ollama').");
bullet("Verificar se o Ollama está rodando: `ollama list` e `ollama serve`.");
bullet("Escolher outro modelo local: editar config/tvs.config.json → models.local ou preencher OLLAMA_HOST no .env.");
sub("9.2 — Nuvem (raciocínio complexo)");
bullet("Preencher as chaves em .env e reiniciar o sistema. O ModelRouter usa nuvem quando a tarefa é complexa e local quando é privada/rápida.");
sub("9.3 — OmniRoute (gateway com 290+ provedores, opcional)");
codeBlock("npm run omniroute:start");
bullet("Requer o pacote global: `npm install -g omniroute` (ou rode `npm run omniroute:install`).");

// ============ 10. SERVIÇOS ============
section(10, "SERVIÇOS EXTERNOS OPCIONAIS");
sub("10.1 — Chamadas telefônicas (Twilio)");
bullet("Preencher TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_PHONE_NUMBER no .env.");
bullet("Para o streaming de voz funcionar, expor o sistema com URL pública (ex.: ngrok) e definir PUBLIC_HOSTNAME no .env.");
bullet("Instalar a dependência: `npm install twilio`.");
sub("10.2 — Automação n8n");
bullet("O sistema tenta iniciar n8n na porta 5678. Instalar n8n: `npm install -g n8n` ou via docker-compose.");
sub("10.3 — Banco vetorial Qdrant (memória semântica)");
bullet("Sem Qdrant, a memória usa fallback em RAM (funciona, mas não persiste embeddings). Para ativar: `docker run -d -p 6333:6333 qdrant/qdrant`.");
sub("10.4 — Home Assistant (casa inteligente)");
bullet("Preencher HOME_ASSISTANT_URL e HOME_ASSISTANT_TOKEN no .env. Dispositivos são controlados por entidades do tipo 'domain.entity_id' (ex.: light.sala).");
sub("10.5 — Sistema de chamadas / JARVIS / ASNO avulsos");
codeBlock("npm run call:start");
codeBlock("npm run jarvis:start");
codeBlock("npm run asno:start");

// ============ 11. DIAGRAMA ============
section(11, "DIAGRAMA DE OPERAÇÃO");
text("Fluxo de comando e operação do Trinnity Viseron System v7.0:", 10);
ensure(80);
const drawBox = (x, w, h, color, label, subLabel, textColor = "#ffffff") => {
  doc.rect(x, y, w, h).fill(color).stroke("#ffffff");
  doc.fillColor(textColor).font("Helvetica-Bold").fontSize(8.5).text(label, x + 4, y + h / 2 - 8, { width: w - 8, align: "center" });
  if (subLabel) doc.fillColor("#d0d0e8").font("Helvetica").fontSize(7).text(subLabel, x + 4, y + h / 2 + 2, { width: w - 8, align: "center" });
};
const drawArrow = (x1, y1, x2, y2, color = "#00f0ff") => {
  doc.moveTo(x1, y1).lineTo(x2, y2).strokeColor(color).lineWidth(1.5).stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  doc.moveTo(x2, y2);
  doc.lineTo(x2 - 8 * Math.cos(ang - 0.4), y2 - 8 * Math.sin(ang - 0.4));
  doc.lineTo(x2 - 8 * Math.cos(ang + 0.4), y2 - 8 * Math.sin(ang + 0.4));
  doc.lineTo(x2, y2).fill(color);
  doc.lineWidth(1);
};

const cx = PAGE_W / 2;
const boxW = 120;

// Linha 1: Soberanos
drawBox(cx - 130, 120, 26, "#00ff87", "👑 PEDRO COSTA", "Supreme Commander");
drawBox(cx + 10, 120, 26, "#ff00ff", "👸 TRINNITY HURTADO", "Queen Architect");
y += 34;
// Linha 2: Squads AIOX
const sqY = y;
drawBox(cx - boxW / 2, 120, 30, "#0a0a2e", "AIOX CORE SQUAD", "Orquestração");
drawArrow(cx - 70, y - 34 + 26, cx - 70, y, "#00ff87");
drawArrow(cx + 70, y - 34 + 26, cx + 70, y, "#ff00ff");
y += 38;
// Linha 3: Núcleo
drawBox(cx - 220, 110, 30, "#1a1a3a", "SuperMind + SuperIntelligence", "Conhecimento");
drawBox(cx - 70, 110, 30, "#1a1a3a", "Orchestrator + Squads", "5.000 mentes");
drawBox(cx + 80, 110, 30, "#1a1a3a", "Memory + Evolution", "LTM / Aprendizado");
drawArrow(cx - 60, y - 30, cx - 60, y - 4, "#00f0ff");
drawArrow(cx, y - 30, cx, y - 4, "#00f0ff");
drawArrow(cx + 60, y - 30, cx + 60, y - 4, "#00f0ff");
y += 38;
// Linha 4: IA
drawBox(cx - 180, 100, 28, "#0d3a2a", "🖥️ Ollama LOCAL", "llama3 / qwen3 (padrão)");
drawBox(cx - 40, 100, 28, "#2a1a3a", "☁️ Cloud", "OpenAI/Claude/Gemini/Grok");
drawBox(cx + 90, 100, 28, "#1a2a3a", "🌐 OmniRoute", "290+ providers (opcional)");
y += 36;
// Linha 5: Interfaces
const intY = y;
drawBox(cx - 260, 95, 26, "#3a0a1a", "📊 WebOS Dashboard", ":3000/dashboard.html");
drawBox(cx - 130, 95, 26, "#3a0a1a", "📄 PDF Reports", ":3001/report/pdf");
drawBox(cx, 95, 26, "#3a0a1a", "📱 Mobile APK/IPA", "Expo");
drawBox(cx + 130, 95, 26, "#3a0a1a", "🎤 Voz / JARVIS", "Chat + chamadas");
drawArrow(cx - 180, intY - 28, cx - 200, intY - 4, "#bf5af2");
drawArrow(cx - 40, intY - 28, cx - 90, intY - 4, "#bf5af2");
drawArrow(cx + 90, intY - 28, cx + 20, intY - 4, "#bf5af2");
drawArrow(cx + 180, intY - 28, cx + 140, intY - 4, "#bf5af2");
y += 34;
// Linha 6: Deploy/Backup
drawBox(cx - 220, 110, 26, "#000000", "📦 GitHub / Render / Vercel", "Produção");
drawBox(cx - 70, 110, 26, "#000000", "🛟 Backups diários", "backups/ + agendador");
drawBox(cx + 80, 110, 26, "#000000", "🔑 .env (secrets)", "Só manual / cofre");
y += 40;

// ============ 12. CODE PLATFORM ============
section(12, "PLATAFORMA CODE — OPERAR E CRIAR VISERON");
text("A CODE Platform transforma o sistema numa consola de operação real: criar mentes VISERON, executar agentes com IA local e monitorizar o AIOX. Tudo a partir do navegador.", 9.5);
ensure(40);
sub("12.1 — Aceder à plataforma CODE");
bullet("Abrir o WebOS: http://localhost:3000/dashboard.html e clicar no ícone ⌨️ CODE.");
bullet("A app tem 4 separadores: Console (comandos), Criar VISERON (blueprints), Agentes e Apps LLM.");
sub("12.2 — Comandos do console");
codeBlock("help                    # lista de comandos");
codeBlock("status                  # estado do sistema em tempo real");
codeBlock("agents                  # lista todas as mentes registadas");
codeBlock("blueprints              # 7 blueprints prontos (BizAnalyst, DataMind, etc.)");
codeBlock("create NovaMente Rol    # cria uma mente VISERON nova");
codeBlock("run <id> <tarefa>       # executa um agente com IA local (Ollama)");
sub("12.3 — Apps LLM (catálogo awesome-llm-apps)");
bullet("O separador Apps LLM oferece 8 aplicações prontas inspiradas no repositório awesome-llm-apps: Deep Research, Local RAG, Mixture of Agents, Multi-Agent Team, Self-Evolving, Always-On Briefing, Voice RAG e Generative UI.");
bullet("Cada app cria uma mente especializada que pode ser executada de imediato com um clique.");
bullet("As skills ficam em skills/vendor/awesome-llm-apps/ e podem ser consultadas em GET /api/skills.");
sub("12.4 — Autoria e donos do sistema");
bullet("Pedro Costa — Comandante Supremo & Criador (clearance tvs_creator, autoridade absoluta).");
bullet("Trinnity Hurtado — Rainha & Arquiteta Chefe (clearance tvs_architect, soberania técnica).");
bullet("Todos os squads executivos e de arquitetura são liderados por eles; a autoria fica registada em data/Viseron_Autoria_e_Propriedade.md.");
sub("12.5 — Monitorização AIOX");
bullet("GET /api/code/aiox mostra o nível de conhecimento AIOX, o estado do cérebro de Pedro/Trinnity e as métricas de memória.");
bullet("O AutoLearningEngine corre um ciclo de aprendizagem a cada 30 min e atualiza automaticamente o conhecimento do sistema.");
bullet("Para auditoria completa com squads AIOX-1..5: npm run audit:arkom.");

// ============ 13. COMANDOS ============
section(13, "TABELA DE COMANDOS RÁPIDOS");table(
  ["O que fazer", "Comando"],
  [
    ["Iniciar o sistema", "npm start"],
    ["Modo desenvolvimento (hot reload)", "npm run dev"],
    ["Compilar", "npm run build"],
    ["Testes", "npm test"],
    ["Verificação TypeScript", "npm run lint"],
    ["Backup manual", "npm run backup"],
    ["Agendar backup diário 03:00", "npm run backup:schedule"],
    ["Publicar (tudo)", "npm run deploy"],
    ["Publicar GitHub", "npm run deploy:github"],
    ["Publicar Vercel", "npm run deploy:vercel"],
    ["Publicar Render", "npm run deploy:render"],
    ["Publicar Hostalia (FTP)", "npm run deploy:hostalia"],
    ["APK Android", "npm run build:android"],
    ["IPA iOS (macOS)", "npm run build:ios"],
    ["App Expo em desenvolvimento", "npm run mobile:start"],
    ["Inicialização completa", "npm run init:full"],
    ["Sistema de chamadas (Twilio)", "npm run call:start"],
    ["OpenJarvis (IA local Stanford)", "npm run jarvis:start"],
    ["ASNO (WhatsApp + casa inteligente)", "npm run asno:start"],
    ["OmniRoute (gateway 290+ provedores)", "npm run omniroute:start"],
    ["Gerar as 5.000 mentes", "npx tsx scripts/generateMinds.ts"],
    ["Ver relatório PDF", "http://localhost:3001/report/pdf"],
    ["Ver WebOS", "http://localhost:3000/dashboard.html"],
    ["Plataforma CODE (criar/operar VISERON)", "http://localhost:3000/dashboard.html → ⌨️ CODE"],
    ["Estado AIOX (monitorização)", "GET /api/code/aiox"],
    ["Instalar skills (catálogos)", "npm run skills:install"],
    ["Auditoria ARKOM/AIOX", "npm run audit:arkom"],
  ],
  [280, 225]
);

doc.end();
const stream = fs.createWriteStream(OUT_FILE);
doc.pipe(stream);
stream.on("finish", () => {
  const size = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
  console.log(`PDF gerado: ${OUT_FILE} (${size} KB)`);
});
