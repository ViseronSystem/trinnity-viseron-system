#!/usr/bin/env node
/**
 * TVS Strix CLI — Comandos de segurança autónomos
 * Integra o Strix (AI Pentesting) no Trinnity Viseron System
 *
 * Autoria: © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)
 * Licença: Apache-2.0 (Strix) + Proprietário (TVS)
 */

import { strixBridge } from "../src/core/strix/StrixBridge";
import path from "path";

const args = process.argv.slice(2);
const command = args[0] || "status";

const VALID_COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

function log(msg: string, color: keyof typeof VALID_COLORS = "reset") {
  console.log(`${VALID_COLORS[color]}${msg}${VALID_COLORS.reset}`);
}

function header(title: string) {
  console.log("");
  log(`╔══════════════════════════════════════════════════╗`, "cyan");
  log(`║  ${title.padEnd(47)}║`, "cyan");
  log(`╚══════════════════════════════════════════════════╝`, "cyan");
  console.log("");
}

async function showStatus() {
  header("TVS STRIX — AI Pentesting Status");
  const status = await strixBridge.getStatus();

  log(`  Strix instalado:    ${status.installed ? "✅ Sim" : "❌ Não"}`, status.installed ? "green" : "red");
  log(`  Versão:             ${status.strixVersion || "N/A"}`, "dim");
  log(`  Python:             ${status.pythonAvailable ? `✅ ${status.pythonVersion}` : "❌ Não encontrado"}`, status.pythonAvailable ? "green" : "red");
  log(`  Docker:             ${status.dockerAvailable ? `✅ ${status.dockerVersion}` : "❌ Não disponível"}`, status.dockerAvailable ? "green" : "red");
  log(`  Modelo LLM:         ${status.modelConfigured ? `✅ ${process.env.STRIX_LLM || "configurado"}` : "❌ Não configurado"}`, status.modelConfigured ? "green" : "red");
  log(`  API Key:            ${status.apiKeyPresent ? "✅ Presente" : "❌ Ausente"}`, status.apiKeyPresent ? "green" : "red");
  log(`  Pronto para scan:   ${status.configured ? "✅ Sim" : "❌ Não"}`, status.configured ? "green" : "red");
  console.log("");
  log(`  Total de scans:     ${status.totalScans}`, "bold");
  log(`  Scans em execução:  ${status.runningScans}`, status.runningScans > 0 ? "yellow" : "dim");
  if (status.lastScanTime) {
    log(`  Último scan:        ${status.lastScanTime}`, "dim");
  }
  console.log("");
}

async function runScan(target: string, mode: string = "quick") {
  header(`TVS STRIX — Executar Scan (${mode})`);

  if (!target) {
    log("  ❌ Especifica um alvo: npm run strix:scan -- <target>", "red");
    log("  Exemplos:", "dim");
    log("    npm run strix:scan -- https://example.com", "dim");
    log("    npm run strix:scan -- ./src", "dim");
    log("    npm run strix:scan -- https://github.com/org/repo", "dim");
    return;
  }

  const targetType = target.startsWith("http")
    ? "url"
    : target.startsWith("https://github.com")
      ? "github"
      : "local_code";

  log(`  Alvo:    ${target}`, "bold");
  log(`  Modo:    ${mode}`, "cyan");
  log(`  Tipo:    ${targetType}`, "cyan");
  console.log("");

  const config = {
    targets: [
      {
        value: target.startsWith(".") ? path.resolve(target) : target,
        type: targetType as any,
        original: target,
      },
    ],
    scanMode: mode as "quick" | "standard" | "deep",
    scanName: `tvs-${Date.now()}`,
    instruction: `Autonomous scan by Trinnity Viseron System. Target: ${target}. Focus on real vulnerabilities with proof-of-concept validation.`,
    maxBudgetUsd: mode === "quick" ? 5 : mode === "standard" ? 20 : 50,
  };

  try {
    strixBridge.on("scan:output", ({ chunk }) => {
      process.stdout.write(chunk);
    });

    strixBridge.on("scan:error", ({ chunk }) => {
      process.stderr.write(chunk);
    });

    const result = await strixBridge.runScan(config);

    console.log("");
    log(`  Scan ID:     ${result.scanId}`, "bold");
    log(`  Estado:      ${result.status}`, result.status === "completed" ? "green" : "red");
    log(`  Duração:     ${result.duration ? `${(result.duration / 1000).toFixed(1)}s` : "N/A"}`, "dim");

    if (result.totalVulnerabilities > 0) {
      console.log("");
      log(`  ⚠️  ${result.totalVulnerabilities} vulnerabilidade(s) encontrada(s):`, "yellow");
      log(`     Críticas: ${result.severityBreakdown.critical}`, "red");
      log(`     Altas:    ${result.severityBreakdown.high}`, "yellow");
      log(`     Médias:   ${result.severityBreakdown.medium}`, "cyan");
      log(`     Baixas:   ${result.severityBreakdown.low}`, "dim");
      log(`     Info:     ${result.severityBreakdown.info}`, "dim");

      console.log("");
      log("  Top findings:", "bold");
      result.vulnerabilities.slice(0, 5).forEach((v, i) => {
        log(`    ${i + 1}. [${v.severity.toUpperCase()}] ${v.title}`, v.severity === "critical" ? "red" : v.severity === "high" ? "yellow" : "dim");
      });
    } else {
      log("  ✅ Nenhuma vulnerabilidade encontrada", "green");
    }

    console.log("");
    log(`  Resultado guardado em: data/strix/${result.scanId}.json`, "dim");
  } catch (err: any) {
    log(`  ❌ Erro: ${err.message}`, "red");
  }
}

async function listHistory() {
  header("TVS STRIX — Histórico de Scans");
  const history = strixBridge.listRunDirs();

  if (history.length === 0) {
    log("  Nenhum scan registrado.", "dim");
    return;
  }

  log(`  Total: ${history.length} scans\n`, "bold");

  history.slice(-10).forEach((h, i) => {
    const status = h.status === "completed" ? "✅" : "❌";
    log(`  ${status} ${h.scanId}`, "bold");
    log(`     Alvo:     ${h.target}`, "dim");
    log(`     Modo:     ${h.scanMode || "N/A"}`, "dim");
    log(`     Início:   ${h.startTime}`, "dim");
    log(`     Vulns:    ${h.vulnerabilities}`, h.vulnerabilities > 0 ? "yellow" : "green");
    log(`     Custo:    $${h.costUsd.toFixed(4)}`, "dim");
    if (i < history.length - 1) console.log("");
  });
}

async function showHelp() {
  header("TVS STRIX — Comandos Disponíveis");

  const cmds = [
    ["status", "Estado do Strix e configuração"],
    ["scan <target> [mode]", "Executar scan de segurança (quick|standard|deep)"],
    ["history", "Histórico de scans executados"],
    ["running", "Scans em execução agora"],
    ["selftest", "Auto-teste do TVS com Strix"],
    ["help", "Mostrar esta ajuda"],
  ];

  cmds.forEach(([cmd, desc]) => {
    log(`  strix:${cmd.padEnd(25)} ${desc}`, "cyan");
  });

  console.log("");
  log("  Variáveis de ambiente necessárias:", "bold");
  log("    STRIX_LLM        Modelo (ex: openai/gpt-5.4)", "dim");
  log("    LLM_API_KEY      Chave da API do LLM", "dim");
  console.log("");
  log("  Autoria: © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)", "dim");
  console.log("");
}

async function main() {
  switch (command) {
    case "status":
      await showStatus();
      break;
    case "scan":
      await runScan(args[1] || "", args[2] || "quick");
      break;
    case "history":
      await listHistory();
      break;
    case "running":
      const running = strixBridge.getRunningScans();
      header("TVS STRIX — Scans em Execução");
      if (running.length === 0) {
        log("  Nenhum scan em execução.", "dim");
      } else {
        running.forEach((id) => log(`  🔄 ${id}`, "yellow"));
      }
      break;
    case "selftest":
      await runScan("./src", "quick");
      break;
    case "help":
    default:
      await showHelp();
      break;
  }
}

main().catch(console.error);
