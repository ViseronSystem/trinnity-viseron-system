import "dotenv/config";
import { ComposioBridge } from "../src/core/composio/ComposioBridge";
import { ToolManager } from "../src/core/tools/ToolManager";

/**
 * Viseron Composio CLI v1.0
 * Estado e ligação ao Composio (consumo MCP de ferramentas externas).
 *   npm run composio:status      -> estado da ligação
 *   npm run composio:connect     -> liga e regista ferramentas no ToolManager
 *   npm run composio:connect-apps -> gera links OAuth para ligar as apps principais
 *   npm run composio:list-apps   -> lista apps ativas / a aguardar autorização
 */
const command = process.argv[2] || "status";

async function main(): Promise<void> {
  const bridge = new ComposioBridge();
  const status = bridge.getStatus();
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║  COMPOSIO — Consumo MCP (Trinnity Viseron)   ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`Endpoint: ${status.endpoint}`);
  console.log(`API key:  ${status.configured ? "configurada ✓" : "AUSENTE (define COMPOSIO_API_KEY no .env)"}`);
  console.log(`Ligado:   ${status.connected ? "sim ✓" : "não"}`);
  console.log(`Ferramentas: ${status.tools}`);
  if (status.lastError) console.log(`Último erro: ${status.lastError}`);

  if (command === "connect") {
    if (!bridge.configured) {
      console.error("\n[Composio] Aborta: COMPOSIO_API_KEY não definida no .env");
      process.exit(1);
    }
    console.log("\n[Composio] A ligar...");
    const ok = await bridge.connect();
    if (!ok) {
      console.error(`[Composio] Falha: ${bridge.getStatus().lastError}`);
      process.exit(1);
    }
    const manager = new ToolManager();
    const n = bridge.registerTools(manager);
    console.log(`[Composio] Ligado ✓ — ${n} ferramentas registadas no ToolManager:`);
    for (const t of manager.listTools()) {
      console.log(`  - composio_${t.name}`);
    }
    const after = bridge.getStatus();
    console.log(`\n[Composio] Estado final: ligado=${after.connected} ferramentas=${after.tools}`);
  }

  if (command === "connect-apps") {
    if (!bridge.configured) {
      console.error("\n[Composio] Aborta: COMPOSIO_API_KEY não definida no .env");
      process.exit(1);
    }
    const apps = process.argv.slice(3).filter((a) => a.length > 0);
    const targets = apps.length ? apps : ComposioBridge.DEFAULT_APPS;
    console.log(`\n[Composio] A gerar links OAuth para ${targets.length} apps (expira em 10 min)...`);
    await bridge.connect();
    const result = await bridge.connectApps(targets);
    console.log("");
    for (const l of result.links) {
      console.log(`  [Ligar ${l.slug}] ${l.url}`);
    }
    if (result.alreadyActive.length) {
      console.log(`\nJá ligadas (sem link novo): ${result.alreadyActive.join(", ")}`);
    }
    if (result.links.length === 0) {
      console.log("Sem novos links para gerar (todas já ativas?).");
    }
    console.log("\nDepois de autorizar no browser, corre: npm run composio:list-apps");
  }

  if (command === "list-apps") {
    if (!bridge.configured) {
      console.error("\n[Composio] Aborta: COMPOSIO_API_KEY não definida no .env");
      process.exit(1);
    }
    await bridge.connect();
    const conns = await bridge.listConnections(ComposioBridge.DEFAULT_APPS);
    console.log(`\nApps ativas (${conns.active.length}): ${conns.active.length ? conns.active.join(", ") : "nenhuma"}`);
    console.log(`A aguardar autorização (${conns.pending.length}): ${conns.pending.length ? conns.pending.join(", ") : "nenhuma"}`);
  }
}

main().catch((e) => {
  console.error("[Composio] Erro:", e.message || e);
  process.exit(1);
});
