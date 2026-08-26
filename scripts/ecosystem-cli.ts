#!/usr/bin/env node
/**
 * TVS Ecosystem CLI — Gestão do ecossistema de 9+1 repositórios integrados
 * 
 * Todos os repositórios integrados com autoría de Pedro Costa & Trinnity Hurtado.
 * Monitoramento: Pedro (Comandante), Trinnity (Rainha), Squads AIOX.
 *
 * Comandos: status, detail, monitor, logs, help
 */

import { ecosystemManager } from "../src/core/ecosystem/EcosystemManager";

const args = process.argv.slice(2);
const command = args[0] || "status";

const C = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

function log(msg: string, color: keyof typeof C = "reset") {
  console.log(`${C[color]}${msg}${C.reset}`);
}

function header(title: string) {
  console.log("");
  log(`╔══════════════════════════════════════════════════════════════╗`, "cyan");
  log(`║  ${title.padEnd(60)}║`, "cyan");
  log(`╚══════════════════════════════════════════════════════════════╝`, "cyan");
  console.log("");
}

async function showStatus() {
  header("TVS ECOSYSTEM — 9 Repos Integrados + Strix");
  const status = ecosystemManager.getStatus();

  log(`  Módulos totais:     ${status.totalModules}`, "bold");
  log(`  Instalados:         ${status.installed}`, "green");
  log(`  Disponíveis:        ${status.available}`, "cyan");
  log(`  Parciais:           ${status.partial}`, "yellow");
  log(`  Em falta:           ${status.missing}`, "red");
  console.log("");
  log(`  Monitoramento:`, "bold");
  log(`    Pedro (Comandante):  ${status.monitoring.pedroActive ? "✅ Ativo" : "❌ Inativo"}`, "green");
  log(`    Trinnity (Rainha):   ${status.monitoring.trinnityActive ? "✅ Ativo" : "❌ Inativo"}`, "green");
  log(`    Squads AIOX:         ${status.monitoring.squadsActive ? "✅ Ativo" : "❌ Inativo"}`, "green");
  log(`    Operações totais:    ${status.monitoring.totalOperations}`, "dim");
  console.log("");
  log(`  Autoria:`, "bold");
  log(`    ${status.authorship.owner}`, "dim");
  log(`    ${status.authorship.copyright}`, "dim");
  console.log("");
  log(`  Módulos:`, "bold");
  status.modules.forEach((m) => {
    const icon = m.status === "installed" ? "✅" : m.status === "available" ? "🟡" : "❌";
    log(`    ${icon} ${m.id.padEnd(22)} ${m.name}`, m.status === "installed" ? "green" : m.status === "available" ? "yellow" : "red");
    log(`       ${m.description.substring(0, 70)}`, "dim");
  });
  console.log("");
}

async function showDetail(moduleId: string) {
  if (!moduleId) {
    log("  ❌ Especifica o ID do módulo: npm run eco:detail -- <module-id>", "red");
    log("  IDs disponíveis: camofox-browser, vibe-trading, claude-ads, ai-ads-claude, hyperframes, fincept-terminal, opengen, open-generative-ai", "dim");
    return;
  }

  const detail = ecosystemManager.getModuleDetail(moduleId);
  if (!detail) {
    log(`  ❌ Módulo '${moduleId}' não encontrado`, "red");
    return;
  }

  header(`TVS ECOSYSTEM — ${detail.name}`);
  log(`  ID:          ${detail.id}`, "bold");
  log(`  Descrição:   ${detail.description}`, "cyan");
  log(`  Repo:        ${detail.repo}`, "dim");
  log(`  Linguagem:   ${detail.language}`, "dim");
  log(`  Estado:      ${detail.status}`, detail.status === "installed" ? "green" : "yellow");
  log(`  Integração:  ${detail.tvsIntegration}`, "dim");
  console.log("");
  log(`  Capacidades:`, "bold");
  detail.capabilities.forEach((c) => log(`    • ${c}`, "cyan"));
  console.log("");
  log(`  Operações:   ${detail.totalOperations}`, "bold");
  log(`  Taxa sucesso: ${detail.successRate}`, "bold");
  if (detail.recentOperations.length > 0) {
    console.log("");
    log(`  Últimas operações:`, "bold");
    detail.recentOperations.slice(-5).forEach((op) => {
      const icon = op.result === "success" ? "✅" : "❌";
      log(`    ${icon} [${op.user}] ${op.action} — ${op.details.substring(0, 60)}`, "dim");
    });
  }
  console.log("");
}

async function showMonitor() {
  header("TVS ECOSYSTEM — Dashboard de Monitoramento");
  const dash = ecosystemManager.getMonitoringDashboard();

  log(`  Operações totais:     ${dash.operations.total}`, "bold");
  log(`  Últimas 24h:          ${dash.operations.last24h}`, "cyan");
  console.log("");

  log(`  Por utilizador:`, "bold");
  Object.entries(dash.operations.byUser).forEach(([user, count]) => {
    log(`    ${user.padEnd(12)} ${count}`, "dim");
  });
  console.log("");

  log(`  Por resultado:`, "bold");
  Object.entries(dash.operations.byResult).forEach(([result, count]) => {
    const icon = result === "success" ? "✅" : "❌";
    log(`    ${icon} ${result.padEnd(12)} ${count}`, result === "success" ? "green" : "red");
  });
  console.log("");

  log(`  Governança:`, "bold");
  log(`    Total:       ${dash.governance.totalOperations}`, "dim");
  log(`    Aprovadas:   ${dash.governance.approved}`, "green");
  log(`    Rejeitadas:  ${dash.governance.rejected}`, "red");
  log(`    Taxa:        ${dash.governance.approvalRate}`, "bold");
  console.log("");

  if (dash.alerts.length > 0) {
    log(`  ⚠️  Alertas:`, "yellow");
    dash.alerts.forEach((a) => log(`    • ${a}`, "yellow"));
    console.log("");
  }
}

async function showLogs() {
  header("TVS ECOSYSTEM — Logs de Operações");
  const moduleId = args[1];
  const logs = ecosystemManager.getLogs({
    moduleId: moduleId || undefined,
    limit: 20,
  });

  if (logs.length === 0) {
    log("  Nenhuma operação registada.", "dim");
    return;
  }

  logs.forEach((l) => {
    const icon = l.result === "success" ? "✅" : "❌";
    log(`  ${icon} ${l.timestamp}`, "dim");
    log(`     Módulo:  ${l.moduleId}`, "bold");
    log(`     Ação:    ${l.action}`, "cyan");
    log(`     User:    ${l.user}`, "dim");
    log(`     Detalhe: ${l.details.substring(0, 80)}`, "dim");
    log(`     Gov:     ${l.governanceApproved ? "✅ Aprovado" : "❌ Rejeitado"}`, l.governanceApproved ? "green" : "red");
    console.log("");
  });
}

async function showHelp() {
  header("TVS Ecosystem — Comandos Disponíveis");
  const cmds = [
    ["status", "Visão geral de todos os 9 módulos integrados"],
    ["detail <id>", "Detalhe de um módulo específico"],
    ["monitor", "Dashboard de monitoramento Pedro/Trinnity/Squads"],
    ["logs [module-id]", "Logs de operações (últimas 20)"],
    ["help", "Mostrar esta ajuda"],
  ];
  cmds.forEach(([cmd, desc]) => {
    log(`  ecosystem:${cmd.padEnd(28)} ${desc}`, "cyan");
  });
  console.log("");
  log("  IDs de módulos:", "bold");
  log("    camofox-browser, vibe-trading, claude-ads, ai-ads-claude,", "dim");
  log("    hyperframes, fincept-terminal, opengen, open-generative-ai", "dim");
  console.log("");
  log("  Autoria: © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)", "dim");
  console.log("");
}

async function main() {
  switch (command) {
    case "status":
      await showStatus();
      break;
    case "detail":
      await showDetail(args[1] || "");
      break;
    case "monitor":
      await showMonitor();
      break;
    case "logs":
      await showLogs();
      break;
    case "help":
    default:
      await showHelp();
      break;
  }
}

main().catch(console.error);
