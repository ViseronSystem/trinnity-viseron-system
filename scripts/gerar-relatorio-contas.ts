import "dotenv/config";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { ComposioBridge } from "../src/core/composio/ComposioBridge";

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

      const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
      doc.pipe(fs.createWriteStream(outFile));

      const W = doc.page.width;
      const PH = doc.page.height;
      const drawFooter = () => {
        doc.page.margins.bottom = 8;
        doc.fontSize(8).fillColor("#888888").text(`TVS v5.0 · Contas Ligadas · ${timestamp} · p.${doc.bufferedPageRange().count + 1}`, 50, PH - 28, { width: W - 100 });
        doc.page.margins.bottom = 50;
      };
      const heading = (t: string) => {
        doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(18).text(t, 50, doc.y);
        doc.fillColor("#22d3ee").rect(50, doc.y + 2, 28, 2).fill();
        doc.moveDown();
      };

      // Capa
      doc.fillColor("#0f172a").rect(0, 0, W, PH).fill();
      doc.fillColor("#22d3ee").font("Helvetica-Bold").fontSize(11).text("TRINNITY VISERON SYSTEM · GESTÃO DE CONTAS", W / 2, 150, { align: "center", width: W - 100 });
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(30).text("CONTAS CONECTADAS", W / 2, 190, { align: "center", width: W - 100 });
      doc.fillColor("#22c55e").font("Helvetica-Bold").fontSize(16).text(`${conns.active.length} ATIVAS · ${conns.pending.length} PENDENTES · 20 APPS`, W / 2, 265, { align: "center", width: W - 100 });
      doc.fillColor("#94a3b8").font("Helvetica").fontSize(12).text(`${timestamp} · dados reais via Composio (${conns.live ? "live" : "offline — liga o .env"})`, W / 2, 305, { align: "center", width: W - 100 });
      doc.fillColor("#22d3ee").fontSize(11).text("O Viseron (JARVIS) gere e organiza estas contas por ti", W / 2, 345, { align: "center", width: W - 100 });
      doc.fillColor("#64748b").fontSize(9).text("Trinnity Hurtado — Rainha  |  Pedro Costa — Comandante", W / 2, 380, { align: "center", width: W - 100 });
      doc.addPage();
      drawFooter();

      // Resumo
      heading("Resumo");
      doc.fillColor("#334155").font("Helvetica").fontSize(11);
      doc.text(`Apps ligadas ao TVS: ${conns.active.length} ativas · ${conns.pending.length} a aguardar autorização OAuth. Telegram e WhatsApp ficaram fora por decisão (a gerir depois via Viseron).`);
      doc.moveDown(0.5);
      doc.text(`Snapshot de gestão: ${snapshotFile}`, 50, doc.y, { link: `file:///${snapshotFile.replace(/\\/g, "/")}`, underline: true, color: "#2563eb" });
      doc.moveDown(1.5);

      // Tabela de apps
      heading("Apps e estado real");
      doc.fontSize(10);
      const colSlug = 50;
      const colStatus = 195;
      const colPurpose = 280;
      const colW = W - 50 - colSlug;
      doc.fillColor("#0f172a").font("Helvetica-Bold");
      doc.text("APP", colSlug, doc.y, { width: 130 });
      doc.text("ESTADO", colStatus, doc.y, { width: 75 });
      doc.text("O QUE O VISERON FAZ", colPurpose, doc.y, { width: colW - colPurpose + 50 });
      doc.moveDown(0.4);

      for (const app of snapshot.apps) {
        const statusColor = app.status === "active" ? "#16a34a" : app.status === "deferred" ? "#64748b" : "#ca8a04";
        const statusLabel = app.status === "active" ? "ATIVA" : app.status === "deferred" ? "ADIADA" : "PENDENTE";
        const y = doc.y;
        if (y > PH - 70) { doc.addPage(); drawFooter(); }
        doc.fillColor("#0f172a").font("Helvetica-Bold").text(app.slug, colSlug, y, { width: 130 });
        doc.fillColor(statusColor).font("Helvetica-Bold").text(statusLabel, colStatus, y, { width: 75 });
        doc.fillColor("#334155").font("Helvetica").text(app.purpose, colPurpose, y, { width: colW - colPurpose + 50 });
        doc.moveDown(0.5);
        doc.strokeColor("#e2e8f0").moveTo(50, doc.y).lineTo(W - 50, doc.y).stroke();
        doc.moveDown(0.3);
      }

      doc.moveDown(1.2);
      heading("O que o Viseron faz com elas");
      doc.fillColor("#334155").font("Helvetica").fontSize(11);
      const capabilities = [
        "Estado em tempo real: 'Estado do composio' (GET /api/composio/status).",
        "Ligar novas contas: 'liga o gmail e o slack' (links OAuth gerados pelo JARVIS).",
        "Executar ações reais: 'publica no slack que lançámos a 5.1' — pesquisa, resolve e executa a ferramenta.",
        "Canais ativos para autonomia: Gmail (email/prospeção), Calendário (demos), Slack/Discord (alertas), Notion/Drive/Docs (conteúdo), GitHub (código).",
        "Este PDF é regenerável a qualquer momento: npm run contas:pdf.",
      ];
      for (const c of capabilities) doc.text(`• ${c}`, 60, doc.y, { width: W - 110 });
      doc.moveDown(1.5);
      drawFooter();
      doc.end();
      console.log(`✔ Viseron_Contas_Conectadas.pdf gerado (${conns.active.length} ativas) + snapshot ${snapshotFile}`);
    })
    .catch((e: any) => {
      console.error(`✖ Falha a gerar relatório: ${e.message}`);
      process.exit(1);
    });
}

main();
