import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

const OUTPUT = path.resolve("data/reports/manual-comandos-viseron.pdf");

// ==========================================================================
// Comandos npm são lidos DINAMICAMENTE de package.json — comandos novos
// aparecem automaticamente no PDF a cada regeneração.
// ==========================================================================
const pkgScripts: Record<string, string> = require("../package.json").scripts || {};

const descMap: Record<string, string> = {
  "start": "Executar sistema compilado (dist)",
  "start:exe": "Executar executável standalone Windows",
  "dev": "Modo desenvolvimento com hot reload",
  "build": "Compilar TypeScript para dist/",
  "test": "Rodar testes core + web (50)",
  "test:core": "Rodar testes do núcleo",
  "test:web": "Rodar testes da camada web (auth/billing/onboarding/email)",
  "test:hyper": "Rodar testes hyperbrain",
  "demo": "Demo operacional real (HTTP 9 endpoints)",
  "demo:email": "Demo dos 3+ fluxos de email (verify/reset/invoice/agent)",
  "lint": "Verificar TypeScript (tsc --noEmit)",
  "deploy": "Deploy completo (build + PDFs + backup)",
  "deploy:github": "Deploy GitHub",
  "deploy:render": "Deploy Render via API",
  "deploy:hostalia": "Deploy landing page via FTP Hostalia",
  "deploy:vercel": "Deploy Vercel",
  "deploy:domain": "Configurar domínio www.trinnityviseronsystem.io no .env",
  "deploy:domain:check": "Validar DNS/HTTPS do domínio novo",
  "update:auto": "Self-update: pull + install + PDFs + build + testes + deploy",
  "docs:100": "Gerar data/Viseron_100_Melhorias_Integracao.pdf",
  "report:update": "Gerar relatório de update PDF",
  "gmail:setup": "Setup Gmail API (OAuth consent → refresh token)",
  "backup": "Executar backup diário",
  "backup:schedule": "Agendar backup automático (Task Scheduler)",
  "skills:install": "Instalar/atualizar coleções de skills (autónomo)",
  "skills": "Skills CLI (list, search, info)",
  "skills:list": "Listar skills instaladas",
  "skills:search": "Pesquisar skills",
  "skills:info": "Ver info de uma skill",
  "init": "Build + backup + start",
  "init:full": "Inicialização completa do sistema",
  "mobile:start": "Iniciar app mobile Expo",
  "mobile:android": "Executar app Android",
  "mobile:ios": "Executar app iOS",
  "build:android": "Gerar APK Android",
  "build:ios": "Gerar IPA iOS",
  "build:all": "Gerar APK + IPA",
  "build:eas-android": "Build Android via EAS",
  "build:eas-ios": "Build iOS via EAS",
  "pitch": "Gerar pitch de investidores",
  "pitch:startup": "Gerar pitch startup (3 idiomas)",
  "pitch:v6": "Gerar pitch v6",
  "roadmap": "Gerar roadmap milionário",
  "pdfs:all": "Regenerar TODOS os PDFs (manuais, pitches, roadmap, 100 melhorias)",
  "launch": "Script de lançamento de mercado",
  "setup": "Instalar todas as dependências",
  "dev:web": "Servidor web em modo desenvolvimento",
  "start:web": "Executar servidor web compilado",
};

function buildScriptList(): Array<[string, string]> {
  const known: Array<[string, string]> = [];
  const rest: Array<[string, string]> = [];
  for (const [name, cmd] of Object.entries(pkgScripts)) {
    const entry: [string, string] = descMap[name]
      ? [`npm run ${name}`, descMap[name]]
      : [`npm run ${name}`, cmd.replace(/powershell -ExecutionPolicy Bypass -File /i, "").replace(/^tsx /, "")];
    if (descMap[name]) known.push(entry);
    else rest.push(entry);
  }
  return [...known, ...rest];
}

const tvsBuiltIn = buildScriptList();

const tools = [
  {
    id: "tvs_ytdlp", name: "yt-dlp — Downloader Universal", repo: "github.com/yt-dlp/yt-dlp",
    desc: "Baixa videos/audios de YouTube, Twitter, TikTok, Instagram, Twitch, Facebook e 1000+ sites.",
    install: "pip install yt-dlp",
    cmds: [
      ["tvs_ytdlp url='https://youtube.com/watch?v=...' modo=video qualidade=best", "Baixar video na melhor qualidade"],
      ["tvs_ytdlp url='...' modo=audio", "Baixar apenas audio (MP3)"],
      ["tvs_ytdlp url='...' modo=video qualidade=4k", "Baixar video em 4K"],
      ["tvs_ytdlp url='...' modo=video playlist=no", "Baixar apenas um video (nao playlist)"],
      ["tvs_ytdlp url='...' legendas=true lang='pt,en'", "Baixar com legendas"],
      ["tvs_ytdlp url='...' dir='./meus-videos'", "Salvar em diretorio especifico"],
    ],
  },
  {
    id: "tvs_ollama", name: "Ollama — IA Local", repo: "github.com/ollama/ollama",
    desc: "Executa modelos de linguagem localmente: LLaMA, Qwen, Mistral, DeepSeek, Phi, Gemma.",
    install: "ja instalado (ollama v0.32.5)",
    cmds: [
      ["tvs_ollama acao=listar", "Listar modelos disponiveis localmente"],
      ["tvs_ollama acao=puxar modelo='llama3.2'", "Baixar modelo LLaMA 3.2"],
      ["tvs_ollama acao=chat modelo='llama3.2' prompt='O que e IA?'", "Perguntar ao modelo local"],
      ["tvs_ollama acao=embed modelo='llama3.2' prompt='texto'", "Gerar embedding de texto"],
      ["tvs_ollama acao=remover modelo='modelo-antigo'", "Remover modelo baixado"],
      ["ollama run deepseek-r1:7b", "Comando direto: rodar DeepSeek R1"],
    ],
  },
  {
    id: "tvs_fooocus", name: "Fooocus — Gerador de Imagens AI", repo: "github.com/lllyasviel/Fooocus",
    desc: "Gera imagens fotorrealistas com IA, estilo Midjourney, sem necessidade de engenharia de prompt.",
    install: "git clone https://github.com/lllyasviel/Fooocus.git && pip install -r requirements.txt",
    cmds: [
      ["tvs_fooocus acao=gerar prompt='gato astronauta' estilo=fantasy", "Gerar imagem com descricao"],
      ["tvs_fooocus acao=gerar prompt='...' negativo='borrado, feio'", "Gerar com prompt negativo"],
      ["tvs_fooocus acao=gerar prompt='...' passos=50 largura=1920 altura=1080", "Imagem HD com mais qualidade"],
      ["tvs_fooocus acao=status", "Verificar status do servidor Fooocus"],
      ["cd ../Fooocus && python entry_with_update.py", "Iniciar interface web (porta 7865)"],
    ],
  },
  {
    id: "tvs_whisper", name: "Whisper — Audio para Texto", repo: "github.com/openai/whisper",
    desc: "Transcreve audio/video para texto com IA. Suporta 99+ idiomas. Modelos: tiny, base, small, medium, large, turbo.",
    install: "pip install openai-whisper",
    cmds: [
      ["tvs_whisper acao=transcrever arquivo='audio.mp3' modelo=medium", "Transcrever audio em portugues"],
      ["tvs_whisper acao=transcrever arquivo='video.mp4' modelo=large idioma=en", "Transcrever video em ingles"],
      ["tvs_whisper acao=transcrever arquivo='aula.wav' modelo=turbo formato=vtt", "Transcrever e gerar legendas VTT"],
      ["tvs_whisper acao=listar", "Listar modelos disponiveis com descricao"],
      ["python -m whisper audio.mp3 --model base --language pt", "Comando direto Python"],
    ],
  },
  {
    id: "tvs_plausible", name: "Plausible — Web Analytics", repo: "github.com/plausible/community-edition",
    desc: "Analytics web leve, open-source, respeitador de privacidade. Alternativa ao Google Analytics.",
    install: "git clone https://github.com/plausible/community-edition.git && docker-compose up -d",
    cmds: [
      ["tvs_plausible acao=deploy", "Instrucoes para deploy com Docker"],
      ["tvs_plausible acao=status", "Verificar status do servidor Plausible"],
      ["tvs_plausible acao=stats site='meusite.com' chave='API_KEY'", "Obter estatisticas do site"],
      ["git clone https://github.com/plausible/community-edition.git", "Clonar repositorio"],
      ["docker-compose up -d", "Iniciar com Docker (porta 8000)"],
    ],
  },
  {
    id: "tvs_appflowy", name: "AppFlowy — Workspace AI", repo: "github.com/AppFlowy-IO/AppFlowy",
    desc: "Workspace colaborativo open-source com IA integrada. Alternativa ao Notion e Monday.com.",
    install: "git clone https://github.com/AppFlowy-IO/AppFlowy.git && docker-compose up -d",
    cmds: [
      ["tvs_appflowy acao=deploy", "Instrucoes para deploy Docker"],
      ["tvs_appflowy acao=status", "Verificar containers AppFlowy rodando"],
      ["git clone https://github.com/AppFlowy-IO/AppFlowy.git", "Clonar repositorio"],
      ["docker-compose up -d", "Iniciar servicos AppFlowy"],
    ],
  },
  {
    id: "tvs_penpot", name: "Penpot — Design + MCP", repo: "github.com/penpot/penpot-mcp",
    desc: "Ferramenta de design open-source com protocolo MCP. Alternativa ao Figma com integracao AI.",
    install: "git clone https://github.com/penpot/penpot.git && git clone https://github.com/penpot/penpot-mcp.git",
    cmds: [
      ["tvs_penpot acao=deploy", "Instrucoes para deploy Penpot + MCP"],
      ["tvs_penpot acao=mcp", "Configuracao do servidor MCP Penpot"],
      ["tvs_penpot acao=exportar projeto='ID'", "Exportar design para SVG/PNG/HTML"],
      ["git clone https://github.com/penpot/penpot.git", "Clonar repositorio principal"],
      ["git clone https://github.com/penpot/penpot-mcp.git", "Clonar repositorio MCP"],
    ],
  },
  {
    id: "tvs_cudacyclone", name: "CUDACyclone — GPU Bitcoin Puzzle Solver", repo: "github.com/Dookoo2/CUDACyclone",
    desc: "Solver de 'Satoshi puzzles' (busca de chave privada em intervalo) com aceleracao CUDA em GPU NVIDIA. Baseado em VanitySearch/Bitcrack. 6.5Gkeys/s (RTX 4090). Requer NVIDIA GPU + CUDA toolkit (Linux/WSL2).",
    install: "git clone https://github.com/Dookoo2/CUDACyclone.git && make (com CUDA toolkit instalado)",
    cmds: [
      ["tvs_cudacyclone acao=status", "Verificar binario, requisitos e instalacao"],
      ["tvs_cudacyclone acao=build", "Clonar e compilar com make (GPU NVIDIA + CUDA)"],
      ["tvs_cudacyclone acao=run range='2000000000:3FFFFFFFFF' address='1HBtApAFA9B2YZw3G2YKSMCtb3dVnjuNe2' grid='512,256'", "Buscar chave privada no intervalo"],
      ["tvs_cudacyclone acao=run range='...' target-hash160='...' grid='128,128' slices='16'", "Buscar por hash160 (sem precisar de endereco)"],
      ["tvs_cudacyclone acao=benchmark", "Velocidades por GPU (RTX 4060/4090/5090/3070)"],
      ["./CUDACyclone --range 2000000000:3FFFFFFFFF --address 1HBtApAFA9B2YZw3G2YKSMCtb3dVnjuNe2 --grid 512,256", "Comando direto (RTX 4060 ~1238 Mkeys/s)"],
      ["./CUDACyclone --range 200000000000:3fffffffffff --address 1F3JRMWudBaj48EhwcHDdpeuy2jwACNxjP --grid 128,128 --slices 16", "Tune otimizado RTX 4090 (~6.1 Gkeys/s)"],
    ],
  },
];

const apiEndpoints = [
  ["GET /api/health", "Health + db + billing + email + contagens"],
  ["GET /api/metrics", "Métricas de uso"],
  ["GET /api/system/status", "Status do servidor standalone"],
  ["POST /api/waitlist", "Registar email na waitlist"],
  ["GET /pitch/:file", "Baixar PDFs de pitch"],
  ["POST /api/auth/register", "Registo multi-tenant (org → tenant + owner + JWT)"],
  ["POST /api/auth/login", "Login JWT (rate-limited)"],
  ["GET /api/auth/me", "Perfil autenticado"],
  ["PATCH /api/auth/profile", "Atualizar nome/perfil/role"],
  ["GET /api/auth/users", "Listar membros (owner/admin)"],
  ["POST /api/auth/logout", "Terminar sessão"],
  ["GET /api/billing/plans", "Planos Core $29 / Pro $99 / Enterprise $499"],
  ["POST /api/billing/checkout", "Criar sessão de checkout"],
  ["POST /api/billing/webhook", "Webhook de pagamento → upgrade do plano"],
  ["GET /api/billing/subscription", "Estado da subscrição/trial"],
  ["GET /api/onboarding/templates", "5 templates (conteúdo, atendimento, código, Squad AIOX, Arkom)"],
  ["POST /api/onboarding/apply", "Materializar agentes no workspace do tenant"],
  ["GET /api/email/status", "Provider de email ativo + estado Gmail"],
  ["POST /api/email/test", "Enviar email de teste"],
  ["POST /api/email/verify/send", "Enviar código de verificação"],
  ["POST /api/email/verify/confirm", "Confirmar código de verificação"],
  ["GET /api/email/verified", "Estado de verificação do email"],
  ["POST /api/email/reset/send", "Enviar código de reposição de password"],
  ["POST /api/email/reset/confirm", "Confirmar código + nova password"],
  ["GET /api/blog/posts", "Listar posts do blog"],
  ["POST /api/content/generate", "Gerar post de conteúdo"],
  ["POST /api/content/trigger", "Disparar geração de conteúdo"],
  ["GET /api/content/schedule", "Estado do agendamento de conteúdo"],
];

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 40, bottom: 40, left: 45, right: 45 },
  info: {
    Title: "Manual de Comandos - Trinnity Viseron System",
    Author: "TVS v5.0 - Tools Integration",
    Subject: "Comandos Viseron + 8 GitHub Tools",
  },
});

const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);

// ==================== CAPA ====================
doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0a0a2e");
doc.fill("#ffffff");
doc.fontSize(40).font("Helvetica-Bold").text("MANUAL DE", { align: "center" });
doc.fontSize(44).text("COMANDOS", { align: "center" });
doc.moveDown(1);
doc.fontSize(18).font("Helvetica").text("Trinnity Viseron System v5.0", { align: "center" });
doc.moveDown(0.5);
doc.fontSize(12).fillColor("#aaaaaa").text("Comandos Viseron + 8 GitHub Tools Integradas", { align: "center" });
doc.moveDown(0.3);
doc.fontSize(11).text("yt-dlp | Ollama | Fooocus | Whisper | Plausible | AppFlowy | Penpot | CUDACyclone", { align: "center" });
doc.moveDown(2);
doc.fontSize(10).fillColor("#888888").text("Gerado: " + new Date().toLocaleString("pt-BR"), { align: "center" });
doc.text("Trinnity Hurtado — Reina (Coroa)  |  Pedro Costa — Capitan (Hierro)", { align: "center" });
doc.addPage();

// ==================== SUMARIO ====================
doc.fillColor("#0a0a2e").fontSize(22).font("Helvetica-Bold").text("SUMARIO", { underline: true });
doc.moveDown(1);
doc.fillColor("#333333").fontSize(11).font("Helvetica");
const toc = [
  "1. Comandos Viseron (npm + CLI + API) — lido de package.json",
  "2. tvs_ytdlp — YouTube/Video Downloader",
  "3. tvs_ollama — IA Local (LLaMA, Qwen, Mistral...)",
  "4. tvs_fooocus — Gerador de Imagens AI",
  "5. tvs_whisper — Audio para Texto",
  "6. tvs_plausible — Web Analytics",
  "7. tvs_appflowy — Workspace AI",
  "8. tvs_penpot — Design Tool + MCP",
  "9. tvs_cudacyclone — GPU Bitcoin Puzzle Solver (CUDA)",
  "10. API TVS Completa (auth/billing/onboarding/email)",
  "11. Como emitir comandos via Diretivas",
];
toc.forEach((t, i) => {
  doc.fillColor(i % 2 === 0 ? "#333" : "#555").fontSize(10).text("  " + t);
  doc.moveDown(0.2);
});
doc.addPage();

// ==================== 1. COMANDOS BASE ====================
doc.fillColor("#0a0a2e").fontSize(22).font("Helvetica-Bold").text("1. COMANDOS VISERON", { underline: true });
doc.moveDown(0.5);
doc.fillColor("#333333").fontSize(11).font("Helvetica");
doc.text("Comandos npm para operar o Trinnity Viseron System (lidos automaticamente de package.json — novos comandos aparecem aqui a cada regeneração):", { align: "justify" });
doc.moveDown(0.5);

tvsBuiltIn.forEach(([cmd, desc]) => {
  if (doc.y > 700) doc.addPage();
  doc.font("Courier").fontSize(7.5).fillColor("#0a0a2e").text("  " + cmd);
  doc.font("Helvetica").fontSize(8).fillColor("#555").text("    " + desc);
  doc.fillColor("#333");
  doc.moveDown(0.15);
});

doc.moveDown(1);

// ==================== 2-8. FERRAMENTAS ====================
tools.forEach((tool, idx) => {
  if (doc.y > 650) doc.addPage();
  else doc.moveDown(0.5);

  doc.fillColor("#0a0a2e").fontSize(18).font("Helvetica-Bold").text(`${idx + 2}. ${tool.name}`);
  doc.moveDown(0.3);

  doc.fillColor("#666").fontSize(8).font("Helvetica").text("    Repositorio: " + tool.repo);
  doc.fillColor("#333").fontSize(10).font("Helvetica").text("    " + tool.desc);
  doc.moveDown(0.3);
  doc.fillColor("#888").fontSize(8).font("Helvetica").text("    Instalacao: " + tool.install);
  doc.moveDown(0.5);

  doc.fillColor("#0a0a2e").fontSize(10).font("Helvetica-Bold").text("    Comandos Viseron:");
  doc.moveDown(0.2);

  tool.cmds.forEach(([cmd, desc]) => {
    doc.font("Courier").fontSize(7).fillColor("#0a0a2e").text("      " + cmd);
    doc.font("Helvetica").fontSize(8).fillColor("#555").text("        → " + desc);
    doc.fillColor("#333");
    doc.moveDown(0.1);
  });

  doc.moveDown(0.5);
});

doc.addPage();

// ==================== 10. API TVS ====================
doc.fillColor("#0a0a2e").fontSize(22).font("Helvetica-Bold").text("10. API TVS COMPLETA", { underline: true });
doc.moveDown(0.5);
doc.fillColor("#333").fontSize(11).font("Helvetica");
doc.text("Endpoints REST para controlar o TVS remotamente:", { align: "justify" });
doc.moveDown(0.5);

doc.font("Helvetica-Bold").fontSize(9).fillColor("#0a0a2e");
doc.text("  Endpoint".padEnd(40) + "Descricao");
doc.fillColor("#ccc").rect(45, doc.y - 2, doc.page.width - 90, 1).fill();
doc.fillColor("#333");
doc.moveDown(0.3);

doc.font("Courier").fontSize(8);
apiEndpoints.forEach(([ep, desc]) => {
  if (doc.y > 700) doc.addPage();
  doc.text("  " + ep.padEnd(38) + desc);
});

doc.moveDown(1.5);

// ==================== 11. DIRETIVAS ====================
doc.fillColor("#0a0a2e").fontSize(22).font("Helvetica-Bold").text("11. COMO EMITIR COMANDOS VIA DIRETIVAS", { underline: true });
doc.moveDown(0.5);
doc.fillColor("#333").fontSize(11).font("Helvetica");
doc.text("Toda ferramenta no TVS e acessivel via diretivas. O fluxo e:", { align: "justify" });
doc.moveDown(0.5);

const steps = [
  "1. Agente decide qual ferramenta usar baseado na missao",
  "2. Agente chama toolManager.executeTool('tvs_ytdlp', { url: '...' })",
  "3. ToolManager executa o comando real no sistema",
  "4. Resultado retorna ao agente com sucesso/erro + dados",
  "5. Agente consolida resposta e retorna ao usuario",
];

steps.forEach((s) => {
  doc.font("Helvetica").fontSize(9).fillColor("#333").text("  " + s);
  doc.moveDown(0.15);
});

doc.moveDown(1);
doc.fillColor("#0a0a2e").fontSize(14).font("Helvetica-Bold").text("Exemplo de Diretiva:");
doc.moveDown(0.3);
doc.font("Courier").fontSize(8).fillColor("#333");
doc.text('  POST /api/directive');
doc.text('  {');
doc.text('    "id": "directive_yt_001",');
doc.text('    "objective": "Baixar video do YouTube sobre IA",');
doc.text('    "squad": ["agent_mind_343_elon_musk"],');
doc.text('    "ratifiedBy": "trinnity-hurtado",');
doc.text('    "commandedBy": "pedro-costa",');
doc.text('    "budget": "100 VSR"');
doc.text('  }');

doc.moveDown(1);
doc.fillColor("#0a0a2e").fontSize(14).font("Helvetica-Bold").text("Exemplo de Chat Direto:");
doc.moveDown(0.3);
doc.font("Courier").fontSize(8).fillColor("#333");
doc.text('  Agente: "Elon, baixa o ultimo video do Neuralink"');
doc.text('  Elon: "tvs_ytdlp url=https://youtube.com/... modo=video"');
doc.text('  Resultado: Video baixado em ./data/downloads/');

doc.moveDown(2);

// ==================== RODAPE ====================
doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill("#0a0a2e");
doc.fillColor("#888888").fontSize(8).font("Helvetica");
doc.text("Trinnity Viseron System v5.0 — Manual de Comandos", 45, doc.page.height - 30, { align: "center" });
doc.text("8 GitHub Tools | Comandos Viseron Proprios | API REST | Mentes Bilionarias", 45, doc.page.height - 18, { align: "center" });

doc.end();

stream.on("finish", () => {
  const size = fs.statSync(OUTPUT).size;
  console.log(`\n  PDF gerado com sucesso!`);
  console.log(`  Arquivo: ${OUTPUT}`);
  console.log(`  Tamanho: ${(size / 1024).toFixed(1)} KB`);
  console.log(`  Paginas: ~${Math.ceil(size / 1200)}`);
});

stream.on("error", (err) => console.error("Erro:", err));
