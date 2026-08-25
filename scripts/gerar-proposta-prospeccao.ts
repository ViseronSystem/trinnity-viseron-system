import path from "path";
import { createTheme } from "./pdf-theme";

// TVS — PROPOSTA COMERCIAL · Prospeção B2B para Clínicas
// Saída: data/Viseron_Proposta_Prospeccao_Clinicas.pdf

function main() {
  const outFile = path.resolve("data", "Viseron_Proposta_Prospeccao_Clinicas.pdf");
  const t = createTheme({
    title: "Proposta — Prospeção B2B para Clínicas",
    subject: "Pipeline de captação: TVS + contas externas · Trilingue ES/PT/EN",
  });

  t.cover({
    title: "PROPOSTA COMERCIAL\nPROSPECÇÃO B2B · CLÍNICAS",
    subtitle: "O pipeline dos seus fluxos (Apollo + Meta + WhatsApp), construído sobre o motor de IA do TVS\nSubstitui n8n + Claude · Mantém as suas contas Apollo / Meta / Instantly",
    badges: ["Fase 1 já construída", "Entrega em 5-10 dias", "Oferta por módulos", "ES · PT · EN"],
    date: new Date().toLocaleDateString("es-ES").toUpperCase(),
    version: "1.0",
    url: "www.trinnityviseronsystem.io",
  });

  // ── 1. ENTENDEMOS O SEU FLUXO ──
  t.section("1", "O que os seus dois PDFs pedem", "E o que cada parte exige.");
  t.sub("Fluxo A — Prospeção automatizada (outbound)");
  t.bullet("▸", "Apollo/Clay extrai clínicas → n8n limpa e valida → Claude personaliza → Instantly/Lemlist envia → webhook captura respostas → Sheets/CRM regista → alerta WhatsApp.");
  t.sub("Fluxo B — Híbrido (inbound + outbound)");
  t.bullet("▸", "Meta Ads envia mensagens para WhatsApp + email frio com CTA para WhatsApp → n8n centraliza → Claude classifica (caliente/informativo) → resposta automática → cierre manual no WhatsApp.");
  t.rule();

  // ── 2. O QUE O TVS SUBSTITUI ──
  t.section("2", "O TVS substitui metade do stack", "n8n + Claude desaparecem do seu custo fixo.");
  const replaced: Array<[string, string, string]> = [
    ["n8n (orquestração)", "TVS Orchestrator + TaskQueue + ToolManager (webhooks, REST, MCP)", "Já implementado"],
    ["Claude (personalização)", "Cadeia de IA: Claude → Gemini → Grok → Ollama local (nunca fica sem resposta)", "Já implementado"],
    ["Envio de email", "Gmail real (OAuth) + SMTP/Resend/SendGrid", "Já implementado"],
    ["Registo em Sheets/CRM", "Composio (Google Sheets, Gmail, Slack) + store próprio", "Via Composio"],
    ["Classificação de intenção", "Regras + IA local (caliente / informativo)", "Já implementado"],
    ["Resposta automática inicial", "Motor de resposta do TVS (email + WhatsApp quando ligado)", "Já implementado"],
    ["Alertas", "Audit + Slack/WhatsApp via bridges (liga-se quando as contas existirem)", "Já implementado"],
    ["Warm-up de domínio", "O TVS respeita o período de warm-up (bloqueia envios até ao dia X)", "Já implementado"],
    ["Lista de supressão (LGPD)", "Nunca voltar a contactar quem pediu para parar", "Já implementado"],
  ];
  for (const [pdf, tvs, st] of replaced) t.kv(pdf, `${tvs} · ${st}`);

  // ── 3. O QUE O CLIENTE FORNECE ──
  t.section("3", "O que o cliente fornece (contas externas)", "O TVS não cria contas — mas liga-se a elas e orquestra-as.");
  t.bullet("▸", "Apollo.io ou Clay (€49-99/mês) — a lista de clínicas é do cliente; o TVS recebe CSV ou API/webhook.");
  t.bullet("▸", "Instantly.ai ou Lemlist (€37/mês) — infraestrutura de cold email com warm-up; o TVS também pode enviar pelo Gmail do cliente em modo controlado.");
  t.bullet("▸", "Meta Business Manager + orçamento de ads — para o Canal A (inbound); o TVS regista métricas e gera criativos.");
  t.bullet("▸", "WhatsApp Business API (Meta Cloud API ou Twilio) — verificação de número + templates; o TVS centraliza e responde.");
  t.bullet("▸", "Domínio de email dedicado para outreach (nunca o domínio principal).");

  // ── 4. ENTREGAS ──
  t.section("4", "Entregas do TVS (Fase 1 — já construída)", "Pronta a demonstrar hoje.");
  t.bullet("▸", "Pipeline E2E: importar leads (CSV/JSON) → limpar/validar emails → personalizar com IA → enviar com limite diário e warm-up → capturar respostas → classificar → registar → alertar.");
  t.bullet("▸", "API completa: /api/prospection/* (campanhas, leads, personalizar, enviar, webhook de respostas, supressão, audit).");
  t.bullet("▸", "Painel de estado: filas, enviados hoje, respostas, interessados, supressões — tudo auditável.");
  t.bullet("▸", "Fase 2 (opcional): ligação Meta Ads, WhatsApp Business, Slack e Sheets via Composio — quando as contas do cliente estiverem prontas.");
  t.bullet("▸", "Fase 3 (opcional): landing page + site de soluções gerado por IA (o TVS gera sites e APKs completos).");

  // ── 5. INVESTIMENTO ──
  t.section("5", "Investimento", "Comparação com o stack original.");
  const costs: Array<[string, string, string]> = [
    ["Apollo.io / Clay", "€49-99/mês", "Cliente (mantém)"],
    ["Instantly.ai / Lemlist", "€37/mês", "Cliente (mantém)"],
    ["n8n (self-hosted)", "€5-20/mês", "ELIMINADO — o TVS substitui"],
    ["Claude API", "€10-20/mês", "ELIMINADO — cadeia TVS (pode continuar a usar Claude, sem custo adicional)"],
    ["Implementação TVS (Fase 1)", "a negociar", "Uma vez, inclui configuração + demo + formação"],
    ["Manutenção TVS", "a negociar", "Atualizações, monitorização e novas fases"],
  ];
  for (const [k, v, note] of costs) t.kv(k, `${v} · ${note}`);

  // ── 6. PRÓXIMOS PASSOS ──
  t.section("6", "Próximos passos", "Para arrancar em 5 dias.");
  t.bullet("☑", "1. Demo ao vivo do pipeline (dados de exemplo de clínicas).");
  t.bullet("☑", "2. Entrega das credenciais: domínio de email + Apollo + Gmail (ou Instantly).");
  t.bullet("☑", "3. Configuração: campanha, limites diários, warm-up, assinatura, supressão.");
  t.bullet("☑", "4. Fase 2 quando as contas Meta/WhatsApp estiverem aprovadas.");
  t.rule();
  t.spacer(8);
  t.title("Nota de conformidade", 13);
  t.para("O TVS opera com listas próprias/consentidas, com lista de supressão, identificação do remetente e auditoria total — em linha com o RGPD/LGPD. Envio em massa sem consentimento não é suportado por princípio.", 10, "#64748b");
  t.spacer(6);
  t.para("TRINNITY VISERON SYSTEM · © Pedro Costa (Comandante) · Trinnity Hurtado (Reina) · www.trinnityviseronsystem.io", 9, "#94a3b8");

  t.finish(outFile);
  console.log("[OK] PDF gerado:", outFile);
}

main();