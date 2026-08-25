import * as readline from "readline";
import { ViseronCore } from "../core/ViseronCore";
import { TVSDashboardServer } from "../dashboard/server";
import { c, bold, dim, italic, underline, ruler, RESET, BOLD } from "./theme";

interface CommandHelp {
  cmd: string;
  args: string;
  desc: string;
}

const COMMANDS: CommandHelp[] = [
  { cmd: "/help", args: "", desc: "Mostra esta ajuda de comandos" },
  { cmd: "/chat", args: "<mensagem>", desc: "Conversa com a SuperInteligência (ensamble multi-modelo)" },
  { cmd: "/run", args: "<agente> <tarefa>", desc: "Executa um agente específico" },
  { cmd: "/orchestrate", args: "<título> :: <desc>", desc: "Orquestra uma tarefa multi-agente" },
  { cmd: "/code", args: "<requisito>", desc: "Gera código/aplicação via Dev Master" },
  { cmd: "/agents", args: "[filtro]", desc: "Lista os agentes do sistema" },
  { cmd: "/agent", args: "<nome/id>", desc: "Detalhe de um agente" },
  { cmd: "/spawn", args: "[n]", desc: "Gera novos agentes de mentes históricas" },
  { cmd: "/tools", args: "", desc: "Lista ferramentas disponíveis" },
  { cmd: "/tool", args: "<id> [json]", desc: "Executa uma ferramenta" },
  { cmd: "/squads", args: "", desc: "Mostra os squads de agentes" },
  { cmd: "/directives", args: "", desc: "Diretivas ativas do CommandChain" },
  { cmd: "/status", args: "", desc: "Estado geral e nível de inteligência" },
  { cmd: "/memory", args: "", desc: "Estatísticas da memória multicamada" },
  { cmd: "/search", args: "<query>", desc: "Busca na memória e base de conhecimento" },
  { cmd: "/models", args: "", desc: "Provedores de IA disponíveis" },
  { cmd: "/token", args: "", desc: "Tokens gerados pelo sistema" },
  { cmd: "/shell", args: "<comando>", desc: "Executa comando do sistema (npm, git, powershell...)" },
  { cmd: "/web", args: "", desc: "Abre o Dashboard no navegador" },
  { cmd: "/clear", args: "", desc: "Limpa o terminal" },
  { cmd: "/exit", args: "", desc: "Encerra o sistema" },
];

const ALIASES: Record<string, string> = {
  "/h": "/help", "/?": "/help",
  "/a": "/agents", "/ag": "/agents",
  "/t": "/tools",
  "/s": "/status",
  "/m": "/memory",
  "/p": "/models",
  "/q": "/exit", "/quit": "/exit", "/salir": "/exit", "/sair": "/exit",
  "/cls": "/clear",
  "/c": "/chat", "/ask": "/chat",
  "/sh": "/shell", "/bash": "/shell", "/exec": "/shell",
};

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export class TVSTerminal {
  private rl: readline.Interface;
  private tvs: ViseronCore;
  private dashboard: TVSDashboardServer | null;
  private busy = false;
  private ctrlCPresses = 0;
  private lastCtrlCTime = 0;
  private spinnerTimer: ReturnType<typeof setInterval> | null = null;
  private spinnerLabel = "";
  private sessionId = `terminal_${Date.now()}`;

  constructor(tvs: ViseronCore, dashboard?: TVSDashboardServer) {
    this.tvs = tvs;
    this.dashboard = dashboard || null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: !!process.stdin.isTTY,
      prompt: this.promptString(),
      historySize: 200,
      removeHistoryDuplicates: true,
    });
    this.rl.on("line", (line) => this.onLine(line));
    this.rl.on("SIGINT", () => this.onCtrlC());
    process.on("SIGINT", () => this.onCtrlC());
    (global as any).__TVS_TERMINAL_ACTIVE = true;
  }

  private promptString(): string {
    return c.brightCyan(`${bold("TVS")} ${dim("›")} `);
  }

  start(): void {
    this.printBanner();
    this.help(true);
    this.note(`Terminal de comando ativo. Digite uma mensagem ou use /help.`);
    this.prompt();
  }

  // ============================== BANNER ==============================

  private printBanner(): void {
    const w = 62;
    const line = (s: string) => `│ ${s.padEnd(w - 4)} │`;
    console.log("");
    console.log(c.brightCyan(ruler("═", w)));
    console.log(c.brightCyan(ruler("█", w)));
    console.log(c.brightCyan(line(` ${bold("TRINNITY VISERON SYSTEM v5.0")}`)));
    console.log(c.brightCyan(line(` ${bold(c.brightWhite("MULTI-AGENT AI OPERATING SYSTEM"))}`)));
    console.log(c.brightCyan(line(` ${c.brightYellow("Modo Terminal · como OpenCode / Ollama / Antigravity")}`)));
    console.log(c.brightCyan(ruler("█", w)));
    console.log(c.brightCyan(ruler("═", w)));
    console.log(c.brightCyan(line(` 👑 ${c.brightYellow("Pedro Costa")}     - Supreme Commander`)));
    console.log(c.brightCyan(line(` 👸 ${c.brightMagenta("Trinnity Hurtado")} - Queen & Chief Architect`)));
    const stats = this.tvs.agentManager.getStats();
    console.log(c.brightCyan(line(` 🤖 ${stats.total} agentes ativos  ·  ${this.tvs.archetypes.length} arquetipos  ·  SuperMind 500 anos`)));
    console.log(c.brightCyan(ruler("═", w)));
    console.log("");
  }

  private help(compact = false): void {
    const w = 64;
    if (!compact) {
      console.log(c.brightCyan(bold("╔" + ruler("═", w - 2) + "╗")));
      console.log(c.brightCyan(bold(`║ ${c.brightWhite(bold("TVS TERMINAL - COMANDOS DISPONÍVEIS")).padEnd(w - 4)} ║`)));
      console.log(c.brightCyan(bold("╚" + ruler("═", w - 2) + "╝")));
    }
    console.log("");
    for (const { cmd, args, desc } of COMMANDS) {
      const left = ` ${c.brightGreen(cmd)} ${c.brightYellow(args)}`;
      const padLen = Math.max(4, w - 2 - left.length);
      console.log(`${left.padEnd(w - 2)}${dim(desc)}`);
    }
    console.log("");
    console.log(dim("  Dica: digite uma mensagem direta para o sistema executar uma tarefa multi-agente."));
    console.log(dim("  Ex.: \"crie um site para meu token\" ou \"analise e melhore este projeto\"."));
    console.log(dim("  Para rodar comandos do sistema direto daqui: !npm run backup  ou  /shell git status"));
    console.log("");
  }

  // ============================== PROMPT / INPUT ==============================

  private prompt(): void {
    if (this.busy) return;
    this.ctrlCPresses = 0;
    this.rl.setPrompt(this.promptString());
    this.rl.prompt();
  }

  private onLine(line: string): void {
    if (this.busy) return;
    const trimmed = line.trim();
    if (!trimmed) {
      this.prompt();
      return;
    }
    void this.handle(trimmed);
  }

  private async handle(raw: string): Promise<void> {
    this.busy = true;
    try {
      if (raw.startsWith("!") && raw.length > 1) {
        await this.cmdShell(raw.slice(1).trim());
      } else if (raw.startsWith("/")) {
        await this.dispatch(raw);
      } else {
        await this.generic(raw);
      }
    } catch (err: any) {
      this.error(err?.message || String(err));
    } finally {
      this.busy = false;
      this.prompt();
    }
  }

  // ============================== DISPATCH ==============================

  private async dispatch(raw: string): Promise<void> {
    const parts = raw.split(/\s+/);
    let cmd = parts[0].toLowerCase();
    const rest = raw.slice(cmd.length).trim();

    if (ALIASES[cmd]) cmd = ALIASES[cmd];

    switch (cmd) {
      case "/help": this.help(false); return;
      case "/chat": return this.cmdChat(rest);
      case "/run": return this.cmdRun(rest);
      case "/orchestrate": return this.cmdOrchestrate(rest);
      case "/code": return this.cmdCode(rest);
      case "/agents": return this.cmdAgents(rest);
      case "/agent": return this.cmdAgent(rest);
      case "/spawn": return this.cmdSpawn(rest);
      case "/tools": return this.cmdTools();
      case "/tool": return this.cmdTool(rest);
      case "/squads": return this.cmdSquads();
      case "/directives": return this.cmdDirectives();
      case "/status": return this.cmdStatus();
      case "/memory": return this.cmdMemory();
      case "/search": return this.cmdSearch(rest);
      case "/models": return this.cmdModels();
      case "/token": return this.cmdToken();
      case "/web": return this.cmdWeb();
      case "/shell": return this.cmdShell(rest);
      case "/clear": this.clearScreen(); return;
      case "/exit": await this.shutdown("comando /exit"); return;
      default:
        this.warn(`Comando desconhecido: ${cmd}. Use /help para ver os comandos.`);
    }
  }

  // ============================== COMMANDS ==============================

  private async cmdChat(message: string): Promise<void> {
    if (!message) {
      this.warn("Uso: /chat <mensagem>");
      return;
    }
    this.section("SUPER-INTELLIGENCE ENSEMBLE");
    this.log(c.cyan(`  consultando ${bold("8 provedores")} + SuperMind + agentes...`));
    this.startSpinner("sintetizando superinteligência");

    const domains = this.inferDomains(message);
    const agentIds = ["agent_pedro_commander", "agent_trinnity_queen"];
    const timeout = this.withTimeout(
      this.tvs.superIntelligence.synthesize({
        prompt: message,
        domains,
        agents: agentIds,
        strategy: "ensemble",
      }),
      60000,
      "Síntese demorou demais (60s) - usando conhecimento local"
    );

    const result = await timeout;
    this.stopSpinner();

    this.log("");
    this.result("SÍNTESE SUPER-INTELIGENTE", result.text);
    this.log(`  ${dim("Confiança:")} ${c.brightYellow(`${result.confidence.toFixed(0)}%`)}   ${dim("Fontes IA:")} ${result.sources.length}   ${dim("Domínios:")} ${result.synthetizedDomains.length}   ${dim("Agentes:")} ${result.agentContributions.length}`);
    this.tvs.memoryEngine.addShortTerm(this.sessionId, "user", message, { via: "chat" });
  }

  private async cmdRun(rest: string): Promise<void> {
    const parts = rest.split(/\s+/);
    if (parts.length < 2) {
      this.warn("Uso: /run <agente> <tarefa>");
      return;
    }
    const agentName = parts[0];
    const task = parts.slice(1).join(" ");
    this.section(`AGENT RUN :: ${agentName}`);
    this.startSpinner(`executando agente ${agentName}...`);
    const timeout = this.withTimeout(
      this.tvs.agentManager.run(agentName, task),
      45000,
      `Agente ${agentName} demorou demais (45s)`
    );
    try {
      const result = await timeout;
      this.stopSpinner();
      if (result.success) {
        this.result(`RESPOSTA DE ${result.agentName}`, result.output, "green");
        this.log(`  ${dim(`executado em ${result.executionTimeMs}ms`)}`);
      } else {
        this.error(result.error || "Falha na execução do agente");
      }
    } catch (err: any) {
      this.stopSpinner();
      this.error(err?.message || String(err));
    }
  }

  private async cmdOrchestrate(rest: string): Promise<void> {
    if (!rest) {
      this.warn("Uso: /orchestrate <título> :: <descrição>");
      return;
    }
    const sep = rest.indexOf("::");
    const title = sep >= 0 ? rest.slice(0, sep).trim() : rest.slice(0, 80).trim();
    const description = sep >= 0 ? rest.slice(sep + 2).trim() : rest;
    this.section(`ORQUESTRAÇÃO MULTI-AGENTE :: ${title}`);
    this.log(c.cyan(`  decompondo tarefa e delegando aos agentes especialistas...`));
    this.log("");
    const report = await this.tvs.orchestrator.orchestrate(title, description);
    this.log("");
    this.result("RESULTADO DA ORQUESTRAÇÃO", report.overallOutput || "Tarefa concluída sem saída textual.", "green");
    this.log(`  ${dim("subtarefas:")} ${report.subtaskResults.length}   ${dim("duração:")} ${report.durationMs}ms`);
  }

  private async cmdCode(rest: string): Promise<void> {
    if (!rest) {
      this.warn("Uso: /code <requisito>");
      return;
    }
    this.section("DEV MASTER - GERAÇÃO DE CÓDIGO");
    this.startSpinner("Dev Master gerando código...");
    const timeout = this.withTimeout(
      this.tvs.agentManager.run("Dev Master", rest),
      45000,
      "Dev Master demorou demais (45s)"
    );
    try {
      const result = await timeout;
      this.stopSpinner();
      if (result.success) {
        this.result("CÓDIGO GERADO", result.output, "brightCyan");
      } else {
        this.error(result.error || "Falha na geração de código");
      }
    } catch (err: any) {
      this.stopSpinner();
      this.error(err?.message || String(err));
    }
  }

  private cmdAgents(filter: string): void {
    const all = this.tvs.agentManager.list();
    const term = filter.toLowerCase();
    const agents = term
      ? all.filter(a => a.name.toLowerCase().includes(term) || a.role.toLowerCase().includes(term) || a.id.toLowerCase().includes(term))
      : all;
    this.section(`AGENTES DO SISTEMA (${agents.length}/${all.length})`);
    const stats = this.tvs.agentManager.getStats();
    this.log(`  ${c.brightGreen(`${stats.active} ativos`)} · ${c.brightYellow(`${stats.paused} pausados`)} · ${c.brightRed(`${stats.error} erro`)}`);
    this.log("");
    const sorted = [...agents].sort((a, b) => a.name.localeCompare(b.name));
    const maxName = Math.max(6, ...sorted.slice(0, 100).map(a => a.name.length));
    for (const agent of sorted.slice(0, 60)) {
      const statusColor = agent.status === "ACTIVE" ? c.brightGreen : agent.status === "PAUSED" ? c.brightYellow : c.brightRed;
      const cap = (agent.capabilities || []).slice(0, 3).join(", ");
      console.log(`  ${c.cyan(agent.id.padEnd(28))} ${statusColor(agent.status.padEnd(8))} ${c.brightWhite(agent.name.padEnd(maxName))} ${dim(agent.role)}`);
      console.log(`  ${dim("    capabilities: " + cap)}`);
    }
    if (sorted.length > 60) this.log(`  ${dim(`... e mais ${sorted.length - 60} agentes (use /agents <filtro>)`)}`);
  }

  private cmdAgent(nameOrId: string): void {
    if (!nameOrId) {
      this.warn("Uso: /agent <nome ou id>");
      return;
    }
    const agent = this.tvs.agentManager.getAgent(nameOrId);
    if (!agent) {
      this.warn(`Agente '${nameOrId}' não encontrado.`);
      return;
    }
    this.section(`AGENTE :: ${agent.name}`);
    console.log(`  ${dim("id:")}          ${c.cyan(agent.id)}`);
    console.log(`  ${dim("nome:")}        ${c.brightWhite(agent.name)}`);
    console.log(`  ${dim("role:")}        ${c.brightYellow(agent.role)}`);
    console.log(`  ${dim("status:")}      ${agent.status === "ACTIVE" ? c.brightGreen(agent.status) : c.brightRed(agent.status)}`);
    console.log(`  ${dim("descrição:")}   ${agent.description || "-"}`);
    console.log(`  ${dim("capacidades:")} ${(agent.capabilities || []).join(", ")}`);
  }

  private async cmdSpawn(rest: string): Promise<void> {
    let n = 10;
    if (rest) {
      const parsed = parseInt(rest.split(/\s+/)[0], 10);
      if (!isNaN(parsed) && parsed > 0) n = Math.min(parsed, 100);
    }
    this.section(`AGENT SPAWNER :: ${n} novas mentes`);
    this.startSpinner(`spawning ${n} agentes de mentes históricas/futuristas...`);
    try {
      const timeout = this.withTimeout(
        (async () => {
          const spawned = this.tvs.agentSpawner.spawnBatch(n);
          return spawned.length;
        })(),
        30000,
        "Spawn demorou demais (30s)"
      );
      const spawned = await timeout;
      this.stopSpinner();
      this.log(`  ${c.brightGreen(`✓ ${spawned} agentes gerados`)}  →  total: ${this.tvs.agentManager.list().length} agentes`);
    } catch (err: any) {
      this.stopSpinner();
      this.error(err?.message || String(err));
    }
  }

  private cmdTools(): void {
    const tools = this.tvs.toolManager.listTools();
    this.section(`FERRAMENTAS (${tools.length})`);
    for (const tool of tools) {
      const enabled = tool.enabled ? c.brightGreen("ON ") : c.brightRed("OFF");
      const typeColor = tool.type === "MCP" ? c.brightMagenta : tool.type === "N8N" ? c.brightBlue : c.brightCyan;
      console.log(`  ${enabled} ${c.cyan(tool.id.padEnd(24))} ${typeColor(tool.type.padEnd(10))} ${c.brightWhite(tool.name)}`);
      console.log(`  ${dim("    " + tool.description)}`);
    }
  }

  private async cmdTool(rest: string): Promise<void> {
    const parts = rest.split(/\s+/);
    if (parts.length < 1) {
      this.warn("Uso: /tool <id> [argsJSON]");
      return;
    }
    const id = parts[0];
    let input: Record<string, any> = {};
    const restRaw = rest.slice(id.length).trim();
    if (restRaw) {
      try {
        input = JSON.parse(restRaw);
      } catch {
        input = { value: restRaw };
      }
    }
    this.section(`FERRAMENTA :: ${id}`);
    this.startSpinner(`executando ferramenta ${id}...`);
    const result = await this.tvs.toolManager.executeTool(id, input);
    this.stopSpinner();
    if (result.success) {
      this.result(`RESULTADO DE ${result.toolName}`, typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2), "green");
      this.log(`  ${dim(`executado em ${result.executionTimeMs}ms`)}`);
    } else {
      this.error(result.error || `Ferramenta '${id}' falhou.`);
    }
  }

  private cmdSquads(): void {
    const squads = this.tvs.squadManager.getSquads();
    this.section(`SQUADS (${squads.length})`);
    for (const squad of squads) {
      console.log(`  ${c.brightCyan(bold(squad.name))} ${dim(squad.id)}`);
      console.log(`  ${dim("  líder:")}     ${c.brightYellow(squad.leader.name)} ${dim(`(${squad.leader.role})`)}`);
      console.log(`  ${dim("  membros:")}   ${squad.members.map(m => m.name).join(", ")}`);
      console.log(`  ${dim("  permissões:")} ${squad.permissions.join(", ")}`);
      console.log(`  ${dim("  descrição:")} ${squad.description}`);
      console.log("");
    }
  }

  private cmdDirectives(): void {
    const active = this.tvs.commandChain.getActiveDirectives();
    const status = this.tvs.commandChain.getStatus();
    this.section(`COMMAND CHAIN`);
    console.log(`  👑 ${c.brightYellow(status.pedro)}`);
    console.log(`  👸 ${c.brightMagenta(status.trinnity)}`);
    console.log(`  ${dim("diretivas ativas:")} ${active.length}   ${dim("concluídas:")} ${status.completedDirectives}`);
    console.log("");
    for (const d of active.slice(0, 20)) {
      const typeColor = d.type === "strategic" ? c.brightYellow : d.type === "tactical" ? c.brightCyan : c.brightGreen;
      console.log(`  ${typeColor(`[${d.type.toUpperCase()}]`)} ${c.brightWhite(bold(d.title))}`);
      console.log(`  ${dim("    " + d.description.slice(0, 120))}`);
    }
    if (active.length === 0) this.log("  Sem diretivas ativas no momento.");
  }

  private cycleStatus(intervalMin: number, lastRun: number | undefined): string {
    if (!lastRun) return c.brightYellow("aguardando 1º ciclo");
    const elapsedMin = (Date.now() - lastRun) / 60000;
    if (elapsedMin > intervalMin * 1.6) return c.brightYellow(`atrasado (${elapsedMin.toFixed(0)}min)`);
    return c.brightGreen(`ok (últ. ${elapsedMin.toFixed(0)}min)`);
  }

  private cmdStatus(): void {
    const info = this.tvs.getIntelligenceLevel();
    const bridgeStats = this.tvs.aiBridge.getStats();
    const agentStats = this.tvs.agentManager.getStats();
    const uptime = Math.floor((Date.now() - (global as any).__TVS_START_TIME) / 1000);

    const hyper = this.tvs.hyperLearningEngine.getStats();
    const evolution = this.tvs.autoEvolutionEngine.getStats();
    const plannerCycles = this.tvs.autonomousPlanner.getCycleCount();
    const plannerTasks = this.tvs.autonomousPlanner.getTasks();
    const memory = this.tvs.memoryEngine.getStats();

    const cyc = (name: string, icon: string, intervalMin: number, lastRun: number | undefined, extra: string) =>
      console.log(`  ${c.brightCyan(icon)} ${c.brightWhite(bold(name.padEnd(16)))} ${this.cycleStatus(intervalMin, lastRun)}  ${dim(extra)}`);

    this.section("ESTADO DO SISTEMA");
    console.log(`  ${c.brightYellow(bold("TRINNITY VISERON SYSTEM v5.0"))}   ${c.brightGreen("● ONLINE")}`);
    console.log("");
    console.log(`  ${c.brightCyan("🧠")} ${c.brightWhite(bold("Nível de Inteligência:"))} ${c.brightGreen(hyper.intelligenceLevel.toFixed(0))}%  ${dim(`(×${hyper.multiplier.toFixed(1)} acima de uma IA isolada)`)}`);
    console.log(`  ${c.brightCyan("🤖")} ${c.brightWhite(bold("Agentes:"))} ${agentStats.total} total  (${agentStats.active} ativos / ${agentStats.paused} pausados / ${agentStats.error} erro)`);
    console.log(`  ${c.brightCyan("📡")} ${c.brightWhite(bold("Provedores IA:"))} ${bridgeStats.providersAvailable}  ·  ${bridgeStats.totalRequests} requisições  ·  ${bridgeStats.successRate.toFixed(0)}% sucesso`);
    console.log(`  ${c.brightCyan("⏱️ ")} ${c.brightWhite(bold("Uptime:"))} ${this.formatUptime(uptime)}`);
    console.log("");

    this.subSection("CICLOS AUTÔNOMOS (agentes fazem sozinhos)");
    cyc("HyperLearning", "📈", 30, this.lastHyperRun, `ciclo ${hyper.cycleCount} · inteligência ×1.05 por ciclo`);
    cyc("AutoEvolution", "🧬", 60, this.lastEvolutionRun, `${evolution.totalCycles} ciclos · sabedoria média ${evolution.averageWisdom.toFixed(1)} · ${evolution.totalCapabilities} capacidades`);
    cyc("AutoLearning", "📚", 30, this.lastLearningRun, `${info.knowledgeCycles} ciclos · consolida STM→LTM + insights`);
    cyc("AutoPilot", "🤖", 30, this.lastPlannerRun, `${plannerCycles} ciclos · autonomia ${info.autonomousPlanning.toFixed(0)}% · ${plannerTasks.filter(t => t.status === "COMPLETED").length} tarefas executadas`);
    console.log("");

    this.subSection("MEMÓRIA E CONHECIMENTO");
    console.log(`  ${c.brightCyan("💾")} ${c.brightWhite(bold("LTM:"))} ${memory.longTerm.totalItems} itens   ${c.brightCyan("🧠")} ${c.brightWhite(bold("STM:"))} ${memory.shortTerm.totalItems}   ${c.brightCyan("📖")} ${c.brightWhite(bold("KB:"))} ${memory.knowledge.totalDocuments} docs   ${c.brightCyan("🧲")} ${c.brightWhite(bold("Vetores:"))} ${memory.vector.totalVectors} (${memory.vector.provider})`);
    console.log(`  ${c.brightCyan("🗄️ ")} ${c.brightWhite(bold("Backups LTM:"))} ${memory.longTerm.backupCount}   ${c.brightCyan("🔄")} ${c.brightWhite(bold("Consolidação:"))} ${memory.consolidation.totalPromoted} itens promovidos`);
    console.log("");

    this.subSection("SERVIDORES E INTEGRAÇÕES (auto-start com watchdog)");
    console.log(`  ${c.brightGreen("●")} Dashboard        http://localhost:${parseInt(process.env.PORT || "3000", 10)}`);
    console.log(`  ${c.brightGreen("●")} ReportServer PDF http://localhost:${this.tvs.reportServer.getPort()}/report/pdf`);
    console.log(`  ${c.brightGreen("●")} OmniRoute        porta 20128  (290+ providers)`);
    console.log(`  ${c.brightGreen("●")} OpenJarvis       AI Stanford local`);
    console.log(`  ${c.brightGreen("●")} n8n              porta 5678  (workflows)`);
    console.log(`  ${c.brightGreen("●")} Call System      Twilio + IA por voz`);
    console.log(`  ${c.brightGreen("●")} ASNO             WhatsApp + Home Assistant`);
    console.log(`  ${c.brightGreen("●")} AutoBackup       diário 03:00 (Task Scheduler)`);
    console.log("");
    console.log(`  ${dim("Dica: /directives para as diretivas Pedro/Trinnity · /memory para detalhes · /agents para lista completa")}`);
  }

  private subSection(title: string): void {
    console.log(`  ${c.brightWhite(bold("── " + title))}`);
  }

  private get lastHyperRun(): number | undefined { return (global as any).__TVS_LAST_HYPER; }
  private get lastEvolutionRun(): number | undefined { return (global as any).__TVS_LAST_EVOLUTION; }
  private get lastLearningRun(): number | undefined { return (global as any).__TVS_LAST_LEARNING; }
  private get lastPlannerRun(): number | undefined { return (global as any).__TVS_LAST_PLANNER; }

  private cmdMemory(): void {
    const stats = this.tvs.memoryEngine.getStats();
    this.section("MEMÓRIA MULTICAMADA");
    console.log(`  ${c.brightCyan("SHORT-TERM")}`);
    console.log(`    ${dim("sessões:")} ${stats.shortTerm.totalSessions}   ${dim("itens:")} ${stats.shortTerm.totalItems}   ${dim("uso:")} ${(stats.shortTerm.memoryUsageBytes / 1024).toFixed(1)} KB`);
    console.log(`  ${c.brightGreen("LONG-TERM")}`);
    console.log(`    ${dim("itens:")} ${stats.longTerm.totalItems}   ${dim("tags:")} ${stats.longTerm.totalTags}   ${dim("backups:")} ${stats.longTerm.backupCount}`);
    console.log(`  ${c.brightYellow("KNOWLEDGE BASE")}`);
    console.log(`    ${dim("documentos:")} ${stats.knowledge.totalDocuments}   ${dim("categorias:")} ${stats.knowledge.totalCategories}`);
    console.log(`  ${c.brightMagenta("VECTORES")}`);
    console.log(`    ${dim("vetores:")} ${stats.vector.totalVectors}   ${dim("provedor:")} ${stats.vector.provider}`);
    console.log(`  ${c.brightBlue("CONSOLIDAÇÃO")}`);
    console.log(`    ${dim("última:")} ${stats.consolidation.lastRun ? new Date(stats.consolidation.lastRun).toISOString() : "nunca"}   ${dim("promovidos:")} ${stats.consolidation.totalPromoted}`);
  }

  private cmdSearch(query: string): void {
    if (!query) {
      this.warn("Uso: /search <query>");
      return;
    }
    this.section(`BUSCA NA MEMÓRIA :: ${query}`);
    const ltm = this.tvs.memoryEngine.searchLongTerm(query).slice(0, 5);
    const kb = this.tvs.memoryEngine.searchKnowledge(query).slice(0, 5);
    if (ltm.length === 0 && kb.length === 0) {
      this.log(`  ${dim("Nenhum resultado encontrado.")}`);
      return;
    }
    if (ltm.length > 0) {
      console.log(`  ${c.brightGreen("LONG-TERM MEMORY")}`);
      for (const item of ltm) {
        console.log(`    ${c.cyan(item.key)}`);
        console.log(`    ${dim("    " + JSON.stringify(item.value).slice(0, 140))}`);
      }
    }
    if (kb.length > 0) {
      console.log(`  ${c.brightYellow("KNOWLEDGE BASE")}`);
      for (const doc of kb) {
        console.log(`    ${c.brightWhite(doc.title)} ${dim(`(${doc.category})`)}`);
        console.log(`    ${dim("    " + doc.content.slice(0, 140))}`);
      }
    }
  }

  private cmdModels(): void {
    const providers = this.tvs.aiBridge.getAvailableProviders();
    this.section(`PROVEDORES DE IA (${providers.length})`);
    for (const p of providers) {
      const models = (p.models || []).map(m => m.id).slice(0, 5).join(", ");
      console.log(`  ${p.isLocal ? c.brightGreen("LOCAL ") : c.brightBlue("CLOUD ")} ${c.brightWhite(p.name.padEnd(20))} ${dim(models || "")}`);
    }
    if (providers.length === 0) this.log("  Nenhum provedor configurado. Use Ollama local ou defina API keys no .env");
  }

  private cmdToken(): void {
    const deployments = this.tvs.tokenEngine.getDeployments();
    this.section("TOKENS DO SISTEMA");
    console.log(`  ${c.brightYellow("$TRIN")} Trinnity Token   ·  ${c.brightYellow("$VSR")} Viseron Crown`);
    console.log("");
    if (deployments.length === 0) {
      this.log(`  ${dim("Nenhum deployment registrado ainda. Use /chat para pedir um token ao sistema.")}`);
      return;
    }
    for (const dep of deployments) {
      console.log(`  ${c.brightYellow(bold(dep.token.symbol))} ${c.brightWhite(dep.token.name)}`);
      console.log(`    ${dim("rede:")} ${dep.network}   ${dim("supply:")} ${dep.token.totalSupply.toLocaleString()}   ${dim("status:")} ${c.cyan(dep.status)}`);
      console.log(`    ${dim("contrato:")} ${dep.contractAddress}`);
    }
  }

  private cmdWeb(): void {
    const port = parseInt(process.env.PORT || "3000", 10);
    this.log(c.cyan(`  abrindo dashboard em http://localhost:${port} ...`));
    const url = `http://localhost:${port}`;
    const cmd = process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;
    try {
      require("child_process").exec(cmd);
    } catch (err: any) {
      this.warn(`Não foi possível abrir o navegador: ${err?.message}`);
    }
  }

  private async cmdShell(command: string): Promise<void> {
    if (!command) {
      this.warn("Uso: /shell <comando>  (ou !comando)");
      return;
    }
    this.section("SHELL");
    this.log(c.brightWhite(`  $ ${command}`));
    this.log("");
    try {
      const { exec } = require("child_process") as typeof import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      const cwd = (global as any).__TVS_ROOT || process.cwd();
      const { stdout, stderr } = await this.withTimeout(
        execAsync(command, { cwd, timeout: 120000, maxBuffer: 50 * 1024 * 1024 }),
        125000,
        "Comando demorou demais (120s)"
      );
      if (stdout) process.stdout.write(stdout.endsWith("\n") ? stdout : stdout + "\n");
      if (stderr) this.warn(stderr);
    } catch (err: any) {
      const detail = err?.stderr || err?.stdout || err?.message;
      this.error(String(detail || err).slice(0, 2000));
    }
  }

  // ============================== GENERIC (fazer tudo) ==============================

  private async generic(input: string): Promise<void> {
    this.section("COMANDO SUPREMO → ORQUESTRAÇÃO MULTI-AGENTE");
    this.log(c.cyan(`  Pedro: delegando tarefa aos agentes especialistas...`));
    this.log(c.cyan(`  Trinnity: analisando arquitetura da missão...`));
    this.log("");
    const title = input.slice(0, 80);
    const report = await this.tvs.orchestrator.orchestrate(title, input);
    this.log("");
    if (report.subtaskResults.length === 0) {
      this.warn("  Nenhum agente respondeu à tarefa. Tente /chat para uma resposta da superinteligência.");
      return;
    }
    const success = report.subtaskResults.filter(r => r.success).length;
    const failed = report.subtaskResults.length - success;
    this.log(`  ${c.brightGreen(`✓ ${success} subtarefas concluídas`)} ${failed > 0 ? c.brightRed(`✗ ${failed} com erro`) : ""}  ·  ${dim(`${report.durationMs}ms`)}`);
    this.tvs.memoryEngine.addShortTerm(this.sessionId, "user", input, { via: "generic" });
  }

  // ============================== HELPERS ==============================

  private inferDomains(message: string): string[] {
    const t = message.toLowerCase();
    const domains: string[] = [];
    const map: Array<[string[], string]> = [
      [["codigo", "código", "code", "programar", "app", "software"], "Computer Science"],
      [["filosof", "meaning", "consciencia", "consciência", "mind"], "Philosophy"],
      [["fisica", "physics", "quantic", "quantum", "universo"], "Physics"],
      [["biologia", "biology", "vida", "evolução"], "Biology"],
      [["sistema", "systems", "arquitetura", "architecture", "design"], "Systems Theory"],
      [["financ", "token", "crypto", "cripto", "econom"], "Economics"],
      [["guerra", "militar", "estrategi", "estratégia", "war"], "Strategy"],
      [["ia", "inteligencia", "inteligência", "ai ", "machine learning"], "Artificial Intelligence"],
    ];
    for (const [keys, domain] of map) {
      if (keys.some(k => t.includes(k))) domains.push(domain);
    }
    if (domains.length === 0) domains.push("Artificial Intelligence", "Systems Theory");
    return domains.slice(0, 4);
  }

  private formatUptime(sec: number): string {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${d > 0 ? d + "d " : ""}${h > 0 ? h + "h " : ""}${m > 0 ? m + "m " : ""}${s}s`;
  }

  private withTimeout<T>(promise: Promise<T>, ms: number, fallbackMsg: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(fallbackMsg));
      }, ms);
      promise.then(
        (val) => { clearTimeout(timer); resolve(val); },
        (err) => { clearTimeout(timer); reject(err); }
      );
    });
  }

  // ============================== SPINNER ==============================

  private startSpinner(label: string): void {
    this.spinnerLabel = label;
    if (!process.stdout.isTTY) {
      this.log(c.cyan(`  ${label}...`));
      return;
    }
    let i = 0;
    process.stdout.write(`\r${c.cyan(` ${SPINNER_FRAMES[0]} ${label}`)}`);
    this.spinnerTimer = setInterval(() => {
      i++;
      process.stdout.write(`\r${c.cyan(` ${SPINNER_FRAMES[i % SPINNER_FRAMES.length]} ${label}`)}`);
    }, 90);
  }

  private stopSpinner(): void {
    if (this.spinnerTimer) {
      clearInterval(this.spinnerTimer);
      this.spinnerTimer = null;
      process.stdout.write(`\r${" ".repeat(this.spinnerLabel.length + 4)}\r`);
    }
  }

  // ============================== OUTPUT ==============================

  private section(title: string): void {
    console.log("");
    console.log(c.brightCyan(`${ruler("═", 4)} ${bold(title.toUpperCase())} ${ruler("═", 4)}`));
  }

  private result(title: string, content: string, color: "green" | "brightCyan" = "brightCyan"): void {
    const top = c.brightWhite(`${ruler("┌", 1)}─ ${bold(title)} `);
    const line = `${ruler("─", 6)}`;
    console.log("");
    console.log(`${top}${c.brightWhite(line)}`);
    const text = content || "(sem conteúdo)";
    const lines = text.split("\n");
    for (const l of lines) {
      console.log(`  ${color === "green" ? c.brightGreen(l) : c.brightCyan(l)}`);
    }
    console.log(`${c.brightWhite(ruler("└", 1) + line)}`);
    console.log("");
  }

  private note(msg: string): void {
    console.log(`${dim("  · ")} ${dim(msg)}`);
  }

  private log(msg: string): void {
    console.log(msg);
  }

  private warn(msg: string): void {
    console.log(`  ${c.brightYellow(bold("! "))} ${c.brightYellow(msg)}`);
  }

  private error(msg: string): void {
    console.log(`  ${c.brightRed(bold("✖ "))} ${c.brightRed(msg)}`);
  }

  private clearScreen(): void {
    process.stdout.write("\x1b[2J\x1b[H");
    this.printBanner();
    this.prompt();
  }

  // ============================== CTRL+C / SHUTDOWN ==============================

  private onCtrlC(): void {
    if (this.busy) return;
    const now = Date.now();
    if (now - this.lastCtrlCTime > 2000) {
      this.ctrlCPresses = 0;
    }
    this.lastCtrlCTime = now;
    this.ctrlCPresses++;
    if (this.ctrlCPresses >= 2) {
      void this.shutdown("Ctrl+C (dobre confirmação)");
      return;
    }
    console.log("");
    this.note(`${c.brightYellow("Pressione Ctrl+C novamente")} para sair, ou digite ${c.brightGreen("/exit")}.`);
    this.prompt();
  }

  public async shutdown(reason: string): Promise<void> {
    if ((global as any).__TVS_SHUTTING_DOWN) return;
    (global as any).__TVS_SHUTTING_DOWN = true;
    this.stopSpinner();
    console.log("");
    console.log(c.brightCyan(`${ruler("═", 4)} ${bold("ENCERRANDO TVS")} ${ruler("═", 4)}`));
    this.note(`Motivo: ${reason}`);
    try {
      this.tvs.memoryEngine.flush();
      this.note("Memória persistida com sucesso.");
    } catch {
      this.note("Falha ao persistir memória.");
    }
    try {
      this.rl.close();
    } catch {}
    (global as any).__TVS_TERMINAL_ACTIVE = false;
    process.exit(0);
  }
}
