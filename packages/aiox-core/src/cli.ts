#!/usr/bin/env node
/**
 * AIOX-Core CLI - Trinnity Viseron System Hyper-Brain
 * Entrypoint del CLI para npx aiox-core init / install
 */
import { program } from "commander";
import { runInit } from "./commands/init";
import { runInstall } from "./commands/install";
import { runStatus } from "./commands/status";
import { printBanner } from "./utils/banner";

printBanner();

program
  .name("aiox-core")
  .description("AIOX-Core CLI — Trinnity Viseron System Hyper-Brain Multi-Agent Platform")
  .version("1.0.0");

program
  .command("init <project-name>")
  .description("Inicializar un nuevo proyecto con la arquitectura Hyper-Brain de AIOX")
  .option("-t, --template <type>", "Plantilla: minimal | full | enterprise", "full")
  .option("--no-git", "Omitir inicialización de git")
  .option("--no-docker", "Omitir generación de archivos Docker")
  .action((projectName: string, options: Record<string, any>) => {
    runInit(projectName, options);
  });

program
  .command("install")
  .description("Instalar los módulos AIOX-Core en un proyecto existente")
  .option("-m, --modules <modules...>", "Módulos a instalar: orchestrator agentmanager modelrouter memory tools squads learning dashboard mcp")
  .option("--all", "Instalar todos los módulos del CORE Hyper-Brain")
  .action((options: Record<string, any>) => {
    runInstall(options);
  });

program
  .command("status")
  .description("Verificar el estado del sistema AIOX instalado en el proyecto")
  .action(() => {
    runStatus();
  });

program.parse(process.argv);
