import { ToolManager } from "../../core/tools/ToolManager";
import { AgentManager } from "../../core/AgentManager";
import { MemoryEngine } from "../../core/memory/MemoryEngine";
import { execSync } from "child_process";
import * as fs from "fs-extra";
import * as path from "path";

const PYTHON = process.env.TVS_PYTHON || "python";
const SCRIPTS = process.env.TVS_PYTHON_SCRIPTS || "";

function run(cmd: string): string {
  try { return execSync(cmd, { timeout: 120000, encoding: "utf-8", shell: "powershell" }).trim(); }
  catch (e: any) { return `[ERRO] ${e.message}`; }
}

export class TVSToolsIntegration {
  public name = "TVS Tools Integration";
  public tools: string[] = [];

  constructor(
    private toolManager: ToolManager,
    private agentManager: AgentManager,
    private memoryEngine: MemoryEngine,
  ) {}

  async initialize(): Promise<number> {
    console.log(`\n══════════════════════════════════════════════`);
    console.log(`   TVS TOOLS INTEGRATION — 8 GitHub Tools`);
    console.log(`══════════════════════════════════════════════\n`);

    await this.registerYtDlp();
    await this.registerOllama();
    await this.registerFooocus();
    await this.registerWhisper();
    await this.registerPlausible();
    await this.registerAppFlowy();
    await this.registerPenpot();
    await this.registerCudaCyclone();

    console.log(`\n[TVS Tools] ${this.tools.length} ferramentas registradas como comandos Viseron\n`);
    return this.tools.length;
  }

  // ===================================================================
  // 1. YT-DLP — YouTube/Video Downloader
  // ===================================================================
  private async registerYtDlp() {
    this.toolManager.createQuickTool("tvs_ytdlp", "yt-dlp — Downloader Universal", "AUTOMATION",
      "Baixa videos/audios de YouTube, Twitter, TikTok, Instagram e 1000+ sites. Comandos: baixar video, baixar audio, listar formatos, playlist",
      async (input) => {
        const url = input.url || input.link || input.video;
        const mode = input.modo || input.mode || "video";
        const quality = input.qualidade || input.quality || "best";
        const output = input.output || input.saida || "%(title)s.%(ext)s";
        const dir = input.dir || "./data/downloads";

        fs.ensureDirSync(dir);
        let cmd = `& "${SCRIPTS}\\yt-dlp.exe"`;

        if (mode === "audio" || mode === "mp3") {
          cmd += ` -x --audio-format mp3 --audio-quality 0`;
        } else if (mode === "audio-best") {
          cmd += ` -f bestaudio --extract-audio --audio-format mp3`;
        } else if (mode === "video-best") {
          cmd += ` -f bestvideo+bestaudio --merge-output-format mp4`;
        } else if (quality.startsWith("1080") || quality === "hd") {
          cmd += ` -f "bestvideo[height<=1080]+bestaudio/best[height<=1080]"`;
        } else if (quality.startsWith("4k") || quality === "2160") {
          cmd += ` -f "bestvideo[height<=2160]+bestaudio/best[height<=2160]"`;
        }

        if (input.playlist === "no" || input.playlist === false) {
          cmd += ` --no-playlist`;
        }

        if (input.legendas || input.subtitles) {
          cmd += ` --write-subs --write-auto-subs --sub-lang ${input.lang || "pt,en"}`;
        }

        cmd += ` -o "${dir}/${output}" "${url}"`;

        const result = run(cmd);
        return {
          comando: "yt-dlp",
          url, mode, quality,
          resultado: result.slice(0, 500),
          arquivos: fs.readdirSync(dir).filter(f => !f.startsWith(".")).slice(-5),
        };
      }
    );
    this.tools.push("tvs_ytdlp — YouTube/Video Downloader");
    console.log(`  [TVS] ✓ tvs_ytdlp — yt-dlp (YouTube, Twitter, TikTok, Instagram...)`);
  }

  // ===================================================================
  // 2. OLLAMA — LLM Local
  // ===================================================================
  private async registerOllama() {
    this.toolManager.createQuickTool("tvs_ollama", "Ollama — LLM Local", "REST_API",
      "Gerencia modelos de IA local: listar, puxar, remover, chat, embedding, executar modelos. Comandos: listar modelos, puxar modelo, chat, embedding, remover",
      async (input) => {
        const action = input.acao || input.action || "list";
        const model = input.modelo || input.model || "llama3.2";
        const prompt = input.prompt || input.pergunta || "";

        if (action === "list" || action === "listar") {
          const result = run("ollama list 2>&1");
          return { comando: "ollama list", resultado: result };
        }

        if (action === "pull" || action === "puxar" || action === "baixar") {
          const result = run(`ollama pull ${model} 2>&1`);
          return { comando: `ollama pull ${model}`, resultado: result };
        }

        if (action === "rm" || action === "remover" || action === "delete") {
          const result = run(`ollama rm ${model} 2>&1`);
          return { comando: `ollama rm ${model}`, resultado: result };
        }

        if (action === "chat" || action === "perguntar") {
          const result = run(`ollama run ${model} "${prompt}" 2>&1`);
          return { comando: `ollama run ${model}`, prompt, resultado: result };
        }

        if (action === "embed" || action === "embedding") {
          const result = run(`ollama run ${model} --embed "${prompt}" 2>&1`);
          return { comando: `ollama embed ${model}`, resultado: result };
        }

        const result = run("ollama list 2>&1");
        return { comando: "ollama list", resultado: result };
      }
    );
    this.tools.push("tvs_ollama — IA Local (LLaMA, Qwen, Mistral...)");
    console.log(`  [TVS] ✓ tvs_ollama — Ollama (LLaMA, Qwen, Mistral, DeepSeek...)`);
  }

  // ===================================================================
  // 3. FOOOCUS — Imagem AI
  // ===================================================================
  private async registerFooocus() {
    this.toolManager.createQuickTool("tvs_fooocus", "Fooocus — Gerador de Imagens AI", "AUTOMATION",
      "Gera imagens com IA estilo Midjourney. Comandos: gerar imagem, listar estilos, status servidor. Requer: git clone + python entrada_fooocus.py",
      async (input) => {
        const action = input.acao || input.action || "generate";
        const prompt = input.prompt || input.descricao || "";

        if (action === "generate" || action === "gerar") {
          const negPrompt = input.negativo || input.negative || "";
          const style = input.estilo || input.style || "default";
          const steps = input.passos || input.steps || 30;
          const w = input.largura || input.width || 1024;
          const h = input.altura || input.height || 1024;

          const fooocusDir = path.resolve("../Fooocus");
          if (!fs.existsSync(fooocusDir)) {
            return {
              comando: "fooocus",
              erro: "Fooocus nao encontrado. Clone primeiro: git clone https://github.com/lllyasviel/Fooocus.git ../Fooocus && cd ../Fooocus && pip install -r requirements.txt",
              instrucoes: [
                "git clone https://github.com/lllyasviel/Fooocus.git",
                "pip install -r requirements.txt",
                "python entry_with_update.py",
              ],
            };
          }

          const cmd = `& "${PYTHON}" "${fooocusDir}/entry_with_update.py" --preset default --prompt "${prompt}" --negative "${negPrompt}" --style ${style} --steps ${steps} --width ${w} --height ${h} 2>&1`;
          const result = run(cmd);

          return {
            comando: "fooocus generate",
            prompt, estilo: style, passos: steps,
            resultado: result.slice(0, 500),
            dica: "Para interface web: cd ../Fooocus && python entry_with_update.py (abre em http://localhost:7865)",
          };
        }

        if (action === "status" || action === "server") {
          return {
            comando: "fooocus status",
            instrucao: "Rode: cd ../Fooocus && python entry_with_update.py",
            url: "http://localhost:7865",
          };
        }

        return {
          comando: "fooocus",
          ajuda: "Use action=generate com prompt, estilo, passos, largura, altura",
          exemplos: ["prompt='gato astronauta no espaco' estilo='fantasy'"],
        };
      }
    );
    this.tools.push("tvs_fooocus — Geracao de Imagens AI (Midjourney-style)");
    console.log(`  [TVS] ✓ tvs_fooocus — Fooocus (Geracao de imagens AI)`);
  }

  // ===================================================================
  // 4. WHISPER — Audio para Texto
  // ===================================================================
  private async registerWhisper() {
    this.toolManager.createQuickTool("tvs_whisper", "Whisper — Audio para Texto", "AUTOMATION",
      "Transcreve audio/video para texto usando IA. Comandos: transcrever audio, transcrever video, listar modelos, transcrever diretorio",
      async (input) => {
        const action = input.acao || input.action || "transcribe";
        const file = input.arquivo || input.file || input.audio || input.video || "";
        const model = input.modelo || input.model || "base";
        const lang = input.idioma || input.language || "pt";
        const dir = input.dir || "./data/transcriptions";

        if (action === "list" || action === "listar") {
          return {
            comando: "whisper models",
            modelos: ["tiny (32x rapido)", "base (16x rapido)", "small (6x)", "medium (2x)", "large (preciso)", "turbo (rapido+preciso)"],
            instalacao: `pip install openai-whisper`,
          };
        }

        if (!file && (action === "transcribe" || action === "transcrever")) {
          return {
            comando: "whisper transcribe",
            erro: "Informe o arquivo de audio/video",
            exemplos: ["file='audio.mp3'", "file='video.mp4' modelo='medium' idioma='pt'"],
          };
        }

        if (!file) {
          return { comando: "whisper", erro: "Informe arquivo de audio ou video" };
        }

        const audioFile = file;
        fs.ensureDirSync(dir);

        let whisperCmd = `& "${PYTHON}" -m whisper "${audioFile}" --model ${model} --language ${lang} --output_dir "${dir}"`;

        if (input.formato || input.format) {
          whisperCmd += ` --output_format ${input.formato}`;
        }

        const result = run(whisperCmd);
        const outputFiles = fs.readdirSync(dir).filter(f => f.includes(path.basename(audioFile, path.extname(audioFile))));

        return {
          comando: "whisper transcribe",
          arquivo: audioFile, modelo: model, idioma: lang,
          resultado: result.slice(0, 500),
          transcricao: outputFiles.filter(f => f.endsWith(".txt") || f.endsWith(".vtt") || f.endsWith(".srt")),
        };
      }
    );
    this.tools.push("tvs_whisper — Transcricao Audio/Video com IA");
    console.log(`  [TVS] ✓ tvs_whisper — Whisper (Audio para Texto)`);
  }

  // ===================================================================
  // 5. PLAUSIBLE — Web Analytics
  // ===================================================================
  private async registerPlausible() {
    this.toolManager.createQuickTool("tvs_plausible", "Plausible — Web Analytics", "REST_API",
      "Analytics web leve, open-source, privado. Comandos: status, stats, criar site, listar sites, configurar deploy docker",
      async (input) => {
        const action = input.acao || input.action || "status";

        const plausibleDir = path.resolve("../plausible");
        const hasDocker = fs.existsSync(path.join(plausibleDir, "docker-compose.yml")) || fs.existsSync(path.join(plausibleDir, "docker-compose.yaml"));

        if (action === "status" || action === "deploy") {
          if (hasDocker) {
            const result = run(`cd "${plausibleDir}" && docker-compose ps 2>&1`);
            return {
              comando: "plausible status",
              resultado: result,
              url: "http://localhost:8000",
            };
          }
          return {
            comando: "plausible deploy",
            instrucao: "Clone e configure: git clone https://github.com/plausible/community-edition.git ../plausible",
            passos: [
              "git clone https://github.com/plausible/community-edition.git",
              "cd community-edition",
              "cp plausible/conf/env.example plausible/conf/env",
              "Editar env com SECRET_KEY, admin email/senha",
              "docker-compose up -d",
            ],
            url: "http://localhost:8000",
          };
        }

        if (action === "stats" || action === "estatisticas") {
          const site = input.site || input.dominio || "example.com";
          const apiKey = input.api_key || input.chave || "";
          if (!apiKey) {
            return {
              comando: "plausible stats",
              erro: "Informe a API key do Plausible",
              instrucao: "Vá em Settings > API Keys no seu dashboard Plausible",
            };
          }
          return {
            comando: "plausible stats",
            site,
            api: `https://plausible.io/api/v1/stats/aggregate?site_id=${site}&period=7d&metrics=visitors,pageviews,bounce_rate,visit_duration`,
          };
        }

        return {
          comando: "plausible",
          ajuda: "Use: action=status, action=stats, action=deploy",
          docs: "https://plausible.io/docs",
        };
      }
    );
    this.tools.push("tvs_plausible — Web Analytics Open-Source");
    console.log(`  [TVS] ✓ tvs_plausible — Plausible (Web Analytics)`);
  }

  // ===================================================================
  // 6. APPFLOWY — Workspace/Notion Alternative
  // ===================================================================
  private async registerAppFlowy() {
    this.toolManager.createQuickTool("tvs_appflowy", "AppFlowy — Workspace AI", "AUTOMATION",
      "Alternativa open-source ao Notion com AI integrada. Comandos: status, deploy docker, criar app, configurar",
      async (input) => {
        const action = input.acao || input.action || "status";

        const appflowyDir = path.resolve("../AppFlowy");

        if (action === "deploy" || action === "docker") {
          return {
            comando: "appflowy deploy",
            instrucao: "Siga os passos para rodar AppFlowy com Docker:",
            passos: [
              "git clone https://github.com/AppFlowy-IO/AppFlowy.git",
              "cd AppFlowy",
              "docker-compose -f docker-compose.yml up -d",
              "ou para desenvolvimento:",
              "cd frontend && flutter run -d chrome",
            ],
            docs: "https://github.com/AppFlowy-IO/AppFlowy",
          };
        }

        if (action === "status") {
          const result = run(`docker ps --filter "name=appflowy" --format "{{.Names}} {{.Status}}" 2>&1`);
          return {
            comando: "appflowy status",
            containers: result || "Nenhum container AppFlowy rodando",
            comando_deploy: "tvs_appflowy acao=deploy",
          };
        }

        return {
          comando: "appflowy",
          ajuda: "Use: action=deploy, action=status",
          repositorio: "https://github.com/AppFlowy-IO/AppFlowy",
        };
      }
    );
    this.tools.push("tvs_appflowy — Workspace Colaborativo (alternativa Notion)");
    console.log(`  [TVS] ✓ tvs_appflowy — AppFlowy (Workspace AI)`);
  }

  // ===================================================================
  // 7. PENPOT — Design Tool + MCP
  // ===================================================================
  private async registerPenpot() {
    this.toolManager.createQuickTool("tvs_penpot", "Penpot — Design Tool + MCP", "MCP",
      "Ferramenta de design open-source com integracao MCP. Comandos: status, deploy docker, mcp config, exportar design, criar projeto",
      async (input) => {
        const action = input.acao || input.action || "status";

        if (action === "deploy" || action === "docker") {
          return {
            comando: "penpot deploy",
            passos: [
              "Clone repositorios:",
              "git clone https://github.com/penpot/penpot.git ../penpot",
              "git clone https://github.com/penpot/penpot-mcp.git ../penpot-mcp",
              "Deploy Penpot principal:",
              "cd ../penpot && docker-compose up -d",
              "Configurar MCP:",
              "cd ../penpot-mcp && npm install && npm run build",
              "Adicionar MCP ao TVS: configurar conexao com Penpot API",
            ],
            urls: {
              penpot: "http://localhost:9001",
              mcp_docs: "https://github.com/penpot/penpot-mcp",
            },
          };
        }

        if (action === "mcp" || action === "mcp-config") {
          return {
            comando: "penpot mcp",
            configuracao: {
              mcp_server: "penpot-mcp",
              tipo: "MCP Tool",
              integracao_com_tvs: "TVS pode chamar Penpot MCP para criar designs automaticamente",
              comandos: [
                "Listar projetos Penpot",
                "Criar novo design a partir de prompt AI",
                "Exportar design para HTML/CSS",
                "Sincronizar com TVS WebAppGenerator",
              ],
            },
          };
        }

        if (action === "export" || action === "exportar") {
          const projectId = input.projeto || input.project || "";
          return {
            comando: "penpot export",
            projeto: projectId || "todos",
            formatos: ["svg", "png", "pdf", "html"],
            instrucao: projectId
              ? `Exportar projeto ${projectId} via API Penpot`
              : "Listar projetos primeiro para obter o ID",
          };
        }

        return {
          comando: "penpot",
          ajuda: "Use: action=deploy, action=mcp, action=export, action=status",
          repositorios: {
            principal: "https://github.com/penpot/penpot",
            mcp: "https://github.com/penpot/penpot-mcp",
          },
        };
      }
    );
    this.tools.push("tvs_penpot — Design Tool Open-Source + MCP");
    console.log(`  [TVS] ✓ tvs_penpot — Penpot (Design + MCP)`);
  }

  // ===================================================================
  // 8. CUDACYCLONE — GPU Bitcoin Puzzle Solver (CUDA)
  // ===================================================================
  private async registerCudaCyclone() {
    this.toolManager.createQuickTool("tvs_cudacyclone", "CUDACyclone — GPU Puzzle Solver", "AUTOMATION",
      "Solver de 'Satoshi puzzles' (busca de chave privada em intervalo) com aceleracao CUDA em GPU NVIDIA. Baseado em VanitySearch/Bitcrack. Comandos: status, build, run, benchmark. Requer NVIDIA GPU + CUDA toolkit (Linux/WSL2)",
      async (input) => {
        const action = input.acao || input.action || "help";
        const binary = path.resolve("../CUDACyclone/CUDACyclone");
        const hasBinary = fs.existsSync(binary);

        if (action === "status" || action === "info") {
          return {
            comando: "cudacyclone status",
            binario: binary,
            compilado: hasBinary,
            requisitos: [
              "GPU NVIDIA com suporte CUDA (compute 7.5+)",
              "CUDA toolkit instalado (apt install cuda-toolkit)",
              "Linux ou Windows via WSL2",
            ],
            instalacao: "git clone https://github.com/Dookoo2/CUDACyclone.git ../CUDACyclone && cd ../CUDACyclone && make",
            docs: "https://github.com/Dookoo2/CUDACyclone",
          };
        }

        if (action === "build" || action === "instalar") {
          const cmd = `git clone https://github.com/Dookoo2/CUDACyclone.git ../CUDACyclone 2>&1 && cd ../CUDACyclone && make 2>&1`;
          const result = run(cmd);
          return { comando: "cudacyclone build", resultado: result.slice(0, 500), binario: binary };
        }

        if (action === "run" || action === "buscar" || action === "bruteforce") {
          if (!hasBinary) {
            return {
              comando: "cudacyclone run",
              erro: "Binario nao encontrado. Compile primeiro (action=build) numa maquina com NVIDIA GPU + CUDA.",
              instrucoes: [
                "git clone https://github.com/Dookoo2/CUDACyclone.git ../CUDACyclone",
                "cd ../CUDACyclone && make",
                `./CUDACyclone --range ${input.range || "2000000000:3FFFFFFFFF"} --address ${input.address || input.bitcoin_address || "1HBtApAFA9B2YZw3G2YKSMCtb3dVnjuNe2"} --grid ${input.grid || "512,256"}`,
              ],
            };
          }
          const range = input.range || "2000000000:3FFFFFFFFF";
          const address = input.address || input.hash160 || "1HBtApAFA9B2YZw3G2YKSMCtb3dVnjuNe2";
          const grid = input.grid || "512,256";
          const slices = input.slices || "";
          const target = input.address ? `--address ${address}` : `--target-hash160 ${address}`;
          const slicesArg = slices ? ` --slices ${slices}` : "";
          const timeout = Math.min(parseInt(input.timeout || "600", 10), 3600);
          const cmd = `${binary} --range ${range} ${target} --grid ${grid}${slicesArg} 2>&1`;
          const result = run(cmd.length > 400 ? cmd.slice(0, 400) : cmd);
          return {
            comando: "cudacyclone run",
            range, grid,
            resultado: result.slice(0, 500),
            dica: "Tune recomendado RTX 4090: --grid 128,128 --slices 16",
          };
        }

        if (action === "benchmark" || action === "bench") {
          return {
            comando: "cudacyclone benchmark",
            velocidades: {
              "RTX 4060": "1238 Mkeys/s (--grid 512,512)",
              "RTX 4090": "6214 Mkeys/s (--grid 128,1024)",
              "RTX 5090": "8408 Mkeys/s (--grid 128,256)",
              "RTX 3070 mobile": "1150 Mkeys/s (--grid 256,256)",
            },
          };
        }

        return {
          comando: "cudacyclone",
          ajuda: "Use: action=status, action=build, action=run, action=benchmark",
          exemplo: "action=run range='2000000000:3FFFFFFFFF' address='1HBtApAFA9B2YZw3G2YKSMCtb3dVnjuNe2' grid='512,256'",
          repositorio: "https://github.com/Dookoo2/CUDACyclone",
        };
      }
    );
    this.tools.push("tvs_cudacyclone — GPU Bitcoin Puzzle Solver (CUDA)");
    console.log(`  [TVS] ✓ tvs_cudacyclone — CUDACyclone (GPU Bitcoin puzzle solver)`);
  }

  getStats() {
    return {
      totalTools: this.tools.length,
      tools: this.tools,
    };
  }
}
