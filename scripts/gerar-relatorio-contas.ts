import "dotenv/config";
import fs from "fs";
import path from "path";
import { ComposioBridge } from "../src/core/composio/ComposioBridge";
import { createTheme } from "./pdf-theme";

// TVS — RELATÓRIO DE CONTAS LIGADAS (Composio)
// Lista o estado real das apps ligadas ao TVS via Composio (ativas/pendentes),
// grava um snapshot JSON (para o JARVIS gerir e organizar) e gera:
//   data/Viseron_Contas_Conectadas.pdf
// Uso: npm run contas:pdf

const APP_PURPOSE: Record<string, string> = {
  gmail: "Email profissional: prospeção, atendimento, faturas, campanhas",
  googlecalendar: "Agenda: reuniões, demos, eventos e lembretes",
  googledrive: "Ficheiros: armazenamento, partilha e backup de documentos",
  googlesheets: "Métricas: relatórios, KPIs e controlo financeiro em folhas",
  googledocs: "Documentos: contratos, manuais e propostas",
  slack: "Equipa: alertas, canais e automação de comunicação",
  github: "Código: repositórios, deploys, issues e PRs",
  notion: "Conhecimento: wikis, bases de dados, roadmap e planeamento",
  linear: "Produto: issues, sprints e planeamento de features",
  hubspot: "CRM: contactos, pipeline de vendas e marketing",
  asana: "Projetos: tarefas e gestão de projetos",
  trello: "Kanban: quadros visuais de tarefas",
  discord: "Comunidade: servidores e canais da comunidade",
  telegram: "Mensagens diretas: alertas e comandos (adiada por decisão)",
  whatsapp: "Clientes: atendimento e campanhas no WhatsApp (adiada por decisão)",
  zoom: "Reuniões: vídeo-chamadas e webinars",
  calendly: "Agendamento: link para marcar demos e reuniões",
  jira: "Ágil: issues e boards de desenvolvimento",
  figma: "Design: protótipos e mockups de UI",
  dropbox: "Ficheiros: cloud storage e partilha",
};

const DEFERRED = ["telegram", "whatsapp"];

function main() {
  const outFile = path.resolve("data", "Viseron_Contas_Conectadas.pdf");
  const snapshotFile = path.resolve("data", "tvs-os", "composio-accounts.json");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.mkdirSync(path.dirname(snapshotFile), { recursive: true });

  const bridge = new ComposioBridge();

  Promise.resolve()
    .then(async () => {
      if (!bridge.configured) {
        return { active: [], pending: ComposioBridge.DEFAULT_APPS, live: false };
      }
      await bridge.connect();
      const conns = await bridge.listConnections(ComposioBridge.DEFAULT_APPS);
      return { ...conns, live: true };
    })
    .then((conns) => {
      const timestamp = new Date().toLocaleString("pt-PT");
      const snapshot = {
        generatedAt: new Date().toISOString(),
        generatedAtPt: timestamp,
        apps: ComposioBridge.DEFAULT_APPS.map((slug) => ({
          slug,
          name: slug,
          status: conns.active.includes(slug) ? "active" : DEFERRED.includes(slug) ? "deferred" : conns.live ? "pending" : "unknown",
          purpose: APP_PURPOSE[slug] || "",
        })),
        summary: { active: conns.active.length, pending: conns.pending.length },
      };
      fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2), "utf8");

      const t = createTheme({ title: "Contas Conectadas — Composio", subject: "TVS v5.0 — Gestão de contas ligadas" });
      t.cover({
        title: "CONTAS CONECTADAS",
        subtitle: `${conns.active.length} ATIVAS · ${conns.pending.length} PENDENTES · 20 APPS — dados reais via Composio (${conns.live ? "live" : "offline — liga o .env"}). O Viseron (JARVIS) gere e organiza estas contas por ti.`,
        badges: ["Composio", "20 Apps", "Gestão de Contas"],
        date: timestamp,
        version: "5.0",
      });

      // Resumo
      t.section("1", "Resumo");
      t.para(`Apps ligadas ao TVS: ${conns.active.length} ativas · ${conns.pending.length} a aguardar autorização OAuth. Telegram e WhatsApp ficaram fora por decisão (a gerir depois via Viseron).`);
      t.kv("Snapshot de gestão", snapshotFile);

      // Apps e estado real
      t.section("2", "Apps e estado real");
      for (const app of snapshot.apps) {
        const statusLabel = app.status === "active" ? "ATIVA" : app.status === "deferred" ? "ADIADA" : "PENDENTE";
        t.kv(app.slug, `${statusLabel} — ${app.purpose}`);
      }

      // O que o Viseron faz com elas
      t.section("3", "O que o Viseron faz com elas");
      const capabilities = [
        "Estado em tempo real: 'Estado do composio' (GET /api/composio/status).",
        "Ligar novas contas: 'liga o gmail e o slack' (links OAuth gerados pelo JARVIS).",
        "Executar ações reais: 'publica no slack que lançámos a 5.1' — pesquisa, resolve e executa a ferramenta.",
        "Canais ativos para autonomia: Gmail (email/prospeção), Calendário (demos), Slack/Discord (alertas), Notion/Drive/Docs (conteúdo), GitHub (código).",
        "Este PDF é regenerável a qualquer momento: npm run contas:pdf.",
      ];
      for (const c of capabilities) t.bullet("▸", c);

      t.finish(outFile);
      console.log(`✔ Viseron_Contas_Conectadas.pdf gerado (${conns.active.length} ativas) + snapshot ${snapshotFile}`);
    })
    .catch((e: any) => {
      console.error(`✖ Falha a gerar relatório: ${e.message}`);
      process.exit(1);
    });
}

main();
