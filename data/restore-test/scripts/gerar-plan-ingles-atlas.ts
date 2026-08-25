import * as fs from "fs";
import * as path from "path";
import { createTheme } from "./pdf-theme";

// ═══════════════════════════════════════════════════════════════════
// PDF PLANO DE INGLÊS — ATLAS · o tutor de inglês com voz do TVS
// Plano imersivo de 7 dias + regras de fluência real + guia de voz.
// Trilingue (PT/ES/EN). © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)
// ═══════════════════════════════════════════════════════════════════

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "Viseron_Plano_Ingles_ATLAS.pdf");

const t = createTheme({
  title: "Plano de Inglês — ATLAS | English Plan — ATLAS | Plan de Inglés — ATLAS",
  subject: "7 dias imersivos para falar inglês com o tutor ATLAS (voz) · 7 immersive days with the ATLAS tutor (voice) · 7 días inmersivos con el tutor ATLAS (voz)",
});

t.cover({
  title: "PLANO DE INGLÊS\nATLAS · 7 DIAS",
  subtitle: "Aprende a falar inglês de verdade, com voz, pelo tutor ATLAS do TVS · Learn to really speak English, with voice, with the ATLAS tutor · Aprende a hablar inglés de verdad, con voz, con el tutor ATLAS — ES/PT → EN",
  badges: ["ATLAS", "Voz", "7 dias", "Imersão", "Negócios", "Fluência", "TVS"],
  date: "08/08/2026",
  version: "1.0",
  url: "http://localhost:32123/atlas",
});
t.para("AUTORIA & PROPRIEDADE INTELECTUAL — © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha). Todos os direitos reservados · All rights reserved · Todos los derechos reservados.", 10, "#7c3aed");
t.para("VERDADE PRÁTICA — ninguém fica FLUENTE em 1 semana; mas em 7 dias imersivos consegues passar de «não consigo falar» para «consigo manter uma conversa de negócios». Fluência real = 6–12 meses de prática diária. O ATLAS está aqui para os dois: o salto de 7 dias AGORA e a rotina diária até à fluência.", 9.5, "#334155");

// ─── 1. COMO USAR O ATLAS ───
t.section("1", "Como usar o ATLAS · How to use ATLAS · Cómo usar ATLAS");
t.code("npm start  (web server na porta 32123)", "abre a plataforma — o ATLAS vive em http://localhost:32123/atlas");
t.bullet("▸", "Fala com o ATLAS por voz (mic do navegador) ou por texto — ele responde com voz grave e lição na hora.");
t.bullet("▸", "Explica sempre em português/espanhol, mas ENSINA inglês: frase + tradução + fonética simples + «repeat after me».");
t.bullet("▸", "Modos automáticos: lição (lesson), conversa (chat), prática (practice), correção (correct), pronúncia (pronounce).");
t.bullet("▸", "API: GET /api/tutor/status · GET /api/tutor/plan · POST /api/tutor/chat { message, lang, mode }");

// ─── 2. O MÉTODO (VERDADEIRO) ───
t.section("2", "O método real · The real method · El método real");
t.sub("Imersão + falar todos os dias + correção imediata", "#22c55e");
t.bullet("▸", "Comprehensible input: ouvir inglês que entendes 80% — vídeos, músicas, séries, o próprio ATLAS.");
t.bullet("▸", "Falar em voz alta todos os dias (mínimo 15 min) — a voz é o músculo que treina.");
t.bullet("▸", "Correção imediata: o ATLAS corrige cada erro na hora, mostrando a versão certa e o porquê.");
t.bullet("▸", "Vocabulário de NEGÓCIOS primeiro (é o que gera receita): reuniões, vendas, preços, emails.");
t.bullet("▸", "Fonética simples: cada palavra nova com guia de pronúncia (ex. business → BÍZ-ness).");

// ─── 3. PLANO DE 7 DIAS ───
t.section("3", "Plano de 7 dias · 7-day plan · Plan de 7 días");
const dias = [
  { d: "Dia 1", t: "Apresentações", f: "hi, I'm, nice to meet you, where are you from, what do you do?", v: "hello · nice to meet you · my name is · how are you · I am from · what do you do?" },
  { d: "Dia 2", t: "Negócios básicos", f: "meetings, pricing, proposals", v: "meeting · proposal · budget · deadline · I agree · let's discuss · price" },
  { d: "Dia 3", t: "Vendas", f: "apresentar o produto, fechar, preços", v: "our product · features · benefits · special offer · subscribe · discount · invoice" },
  { d: "Dia 4", t: "Tecnologia & IA", f: "sistema, app, agente, autónomo", v: "system · application · artificial intelligence · autonomous · agent · model · database" },
  { d: "Dia 5", t: "Email profissional", f: "greeting, body, closing", v: "dear · I would like to · please find attached · best regards · looking forward · thank you" },
  { d: "Dia 6", t: "Conversação livre", f: "hobbies, futuro, sonhos, viagens", v: "I think · I believe · in the future · my dream · because · that's amazing" },
  { d: "Dia 7", t: "Revisão + mini exame", f: "repasar tudo + conversa avaliada", v: "review · let's practice · your progress · keep going · well done" },
];
for (const di of dias) {
  t.sub(`${di.d} — ${di.t}`, "#22c55e");
  t.bullet("▸", `Foco: ${di.f}`);
  t.bullet("•", `Vocabulário: ${di.v}`, "#64748b");
}

// ─── 4. FRASES-CHAVE PARA NEGÓCIOS ───
t.section("4", "Frases-chave de negócios · Key business phrases · Frases clave de negocios");
t.bullets([
  "▸ Let's schedule a meeting for tomorrow. (Vamos marcar uma reunião para amanhã.)",
  "▸ Our product saves you time and money. (O nosso produto poupa-te tempo e dinheiro.)",
  "▸ Please find attached the proposal. (Em anexo a proposta.)",
  "▸ What's your budget for this project? (Qual é o teu orçamento para este projeto?)",
  "▸ I'd like to discuss the price. (Gostaria de discutir o preço.)",
  "▸ We can offer you a special discount. (Podemos oferecer-te um desconto especial.)",
  "▸ Looking forward to your reply. (A aguardar a tua resposta.)",
  "▸ Can you send me the invoice, please? (Podes enviar-me a fatura, por favor?)",
]);

// ─── 5. ROTINA DIÁRIA PARA FLUÊNCIA ───
t.section("5", "Rotina diária para a fluência · Daily routine to fluency · Rutina diaria para la fluidez");
t.bullet("▸", "Manhã: 10 min a ouvir inglês (podcast/vídeo de negócios).");
t.bullet("▸", "Tarde: 15 min com o ATLAS — conversa/lição com voz.");
t.bullet("▸", "Noite: 5 frases novas em voz alta + correção pelo ATLAS.");
t.bullet("▸", "Domingo: mini exame com o ATLAS e revisão da semana.");
t.bullet("▸", "Meta realista: conversa de negócios fluida em 3 meses; fluência natural em 6–12 meses com constância.");

t.spacer(1);
t.para("© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) · ATLAS — o tutor de inglês do Trinnity Viseron System", 9, "#7c3aed", { align: "center" });
t.para(`Gerado pelo Squad AIOX · ${new Date().toLocaleDateString("pt-PT")}`, 8.5, "#64748b", { align: "center" });

const pages = t.page();
t.finish(OUT);
setTimeout(() => {
  const size = fs.statSync(OUT).size;
  console.log(`✅ Viseron_Plano_Ingles_ATLAS.pdf gerado — ${(size / 1024).toFixed(1)} KB · ${pages} páginas`);
}, 800);
