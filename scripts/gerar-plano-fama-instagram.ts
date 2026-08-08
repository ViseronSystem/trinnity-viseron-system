import * as fs from "fs";
import * as path from "path";
import { createTheme } from "./pdf-theme";

// ═══════════════════════════════════════════════════════════════════
// PDF PLANO DE MARCA PESSOAL — Instagram de Pedro Costa (Comandante)
// Estratégia real baseada na auditoria dos 2 perfis + referência
// Pedro Bertotto (1M seguidores). Posicionamento: CEO do VISERON.
// © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)
// ═══════════════════════════════════════════════════════════════════

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "Viseron_Plano_Marca_Instagram.pdf");

const t = createTheme({
  title: "Plano de Marca Pessoal — Instagram | Personal Brand Plan — Instagram",
  subject: "Estratégia real para posicionar Pedro Costa como CEO do VISERON e crescer com autoridade (referência Pedro Bertotto) · Pedro Costa Personal Brand · Plan de Marca Personal",
});

t.cover({
  title: "PEDRO COSTA\nCEO DO VISERON",
  subtitle: "Plano de marca pessoal no Instagram — auditoria real dos 2 perfis, posicionamento CEO, 15 Reels prontos a filmar, fotos e calendário de 30 dias · Personal brand plan · Plan de marca personal",
  badges: ["Instagram", "CEO", "VISERON", "Reels", "30 dias", "Fotos", "TVS"],
  date: "08/08/2026",
  version: "1.0",
  url: "https://www.instagram.com/xpedro.costa",
});
t.para("AUTORIA & PROPRIEDADE INTELECTUAL — © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha). Todos os direitos reservados · All rights reserved · Todos los derechos reservados.", 10, "#7c3aed");
t.para("VERDADE PRÁTICA — nenhuma skill «ativa» faz alguém ficar famoso. O que fez o Pedro Bertotto chegar a 1M foi consistência + autoridade + um movimento (Crown Movement) + eventos premium + aquisição paga. Este plano replica o MÉTODO, não promete resultados: com 3 Reels/semana + 90 dias de constância, o realista é multiplicar alcance e seguidores consistentemente — o «1M-2026» depende de orçamento em ads e de o conteúdo converter.", 9.5, "#334155");

// ─── 1. AUDITORIA REAL ───
t.section("1", "Auditoria real dos perfis · Real audit · Auditoría real");
t.sub("@xpedro.costa — perfil principal", "#7c3aed");
t.bullet("▸", "7.180 seguidores · 7.821 a seguir · 301 posts. Segue MAIS contas do que é seguido → sinal de «follow for follow», o algoritmo penaliza o alcance e os seguidores não engajam.");
t.bullet("▸", "Bio atual: «Dr. Pedro Costa Comendador Empreendedor Visconde de Mauá @dogelonmars @cidadelabrasil». Mistura títulos de nobreza sem nicho claro e liga o perfil a memes (Dogelon Mars).");
t.bullet("▸", "301 posts sem consistência de tema = alcance diluído. Falta um «movimento» (uma frase que defina o que ele é e para quem).");

t.sub("@xpedro.costa.ofc — perfil UGC/Criador", "#7c3aed");
t.bullet("▸", "5.419 seguidores · 496 a seguir · SÓ 3 posts. Números grandes sem conteúdo → os seguidores não vieram dos Reels orgânicos e não vão reagir a posts futuros.");
t.bullet("▸", "Bio: «UGC Creator + IA | Málaga · Conteúdo com propósito · IA + Criatividade = Conversão · 1M-2026». Posicionamento bom para o futuro, mas o perfil está vazio.");

t.sub("Referência: @pedrobertotto — 1M seguidores", "#22c55e");
t.bullet("▸", "1.000.000 seguidores · 3.568 a seguir · 173 posts. Bio: «🔥 Jesus · Founder @crown.movement · Se torne Rei e Rainha do seu mercado · 4ª edição CROWN MOVEMENT (Islândia)».");
t.bullet("▸", "O segredo NÃO é volume de posts (173 é pouco): é (1) posicionamento claro de fé + liderança, (2) um movimento com nome próprio, (3) eventos premium pagos, (4) ads e colaborações com criadores de renome.");

t.rule();
t.sub("Diagnóstico honesto (1-10)", "#7c3aed");
t.kv("Posicionamento (nicho claro):", "2/10 — «Dr. Comendador Visconde» + memes não dizem o que ele constrói.");
t.kv("Consistência visual/temática:", "3/10 — 301 posts sem linha editorial única.");
t.kv("Saúde do algoritmo (seguir/followers):", "2/10 — 7.821 a seguir trava o alcance.");
t.kv("Autoridade (prova real de valor):", "7/10 — o VISERON é real e demonstrável (única vantagem real).");
t.kv("Movimento (comunidade):", "1/10 — não existe ainda.");
t.kv("Oportunidade real:", "8/10 — «CEO que constrói um sistema de IA de 5.000 mentes» é conteúdo que poucos no mundo podem filmar.");

// ─── 2. NOVO POSICIONAMENTO ───
t.section("2", "Novo posicionamento · New positioning · Nuevo posicionamiento");
t.sub("O CEO que constrói o VISERON — inteligência artificial com valores", "#7c3aed");
t.bullet("▸", "NÃO: «empreendedor» genérico, títulos de nobreza soltos, memes de cripto sem contexto.");
t.bullet("▸", "SIM: «Fundador do VISERON — um sistema de IA com 5.000+ mentes, governado por 9 princípios bíblicos. Construo o futuro com Deus e com código.»");
t.bullet("▸", "A ponte com o Bertotto é a FÉ + LIDERANÇA: o VISERON tem governança bíblica real (9 princípios documentados) — é a prova de que fé e tecnologia andam juntas.");
t.bullet("▸", "Diferencial impossível de copiar: demonstrações REAIS do sistema (voz do VISERON, tutor ATLAS, dashboard, tokens $VSR/$TRIN).");

t.sub("Bio nova — @xpedro.costa (principal)", "#22c55e");
t.code("Pedro Costa 🚀 CEO & Fundador do VISERON\n«Construo um sistema de IA com 5.000 mentes, governado pela Palavra.»\n🤖 Inteligência + Valores = Legado\n📲 O futuro é autónomo — com Deus no comando\n👇 Acompanha a construção em tempo real\n@trinnityviseronsystem · $VSR $TRIN", "bio oficial do perfil principal — autoridade + fé + o que ele constrói (limite 150 chars por linha; usar quebras).");
t.sub("Bio nova — @xpedro.costa.ofc (UGC/IA)", "#22c55e");
t.code("Pedro Costa 🚀 UGC Creator + IA | Málaga 🌍\nCEO do VISERON — IA com valores\n🎥 Conteúdo que converte: IA + Criatividade\n🤝 Colab via DM — marcas com propósito\n👇 1M-2026: um Reel de cada vez", "bio do perfil criador — continuidade com o tom atual, mas agora com a âncora CEO.");
t.sub("Movimento (nome da comunidade)", "#22c55e");
t.bullet("▸", "Proposta: «REI DO TEU MERCADO» (inspirado no Crown Movement do Bertotto, mas próprio): Pedro + VISERON ajudam empreendedores a dominar o mercado com IA.");
t.bullet("▸", "Hashtag própria: #ReiDoTeuMercado · #PedroCostaVISERON · #Viseron.");
t.bullet("▸", "Objetivo a 90 dias: ter um movimento com nome próprio + 1 evento/colab (online) que una fé, IA e negócios.");

// ─── 3. PILARES DE CONTEÚDO ───
t.section("3", "Pilares de conteúdo · Content pillars · Pilares de contenido");
const pilares = [
  { p: "P1 · A CONSTRUÇÃO", t: "Mostrar o VISERON a funcionar — demonstrações reais. É o diferencial impossível de copiar.", e: "Voz do VISERON a responder · dashboard ao vivo · tutoria do ATLAS · tokens a serem minted" },
  { p: "P2 · O CEO", t: "Rotina, decisões, mentalidade, luxo com propósito. Pedro como líder, não como influencer.", e: "Manhã de trabalho · reuniões · Málaga · livros · fé no trabalho" },
  { p: "P3 · FÉ + LIDERANÇA", t: "A ponte com o público do Bertotto: Deus e código juntos, os 9 princípios do VISERON.", e: "«Como a Bíblia governa o meu sistema de IA» · princípio do dia" },
  { p: "P4 · IA PARA EMPREENDEDORES", t: "Ensinar (não vender): como usar IA autónoma para dominar um mercado.", e: "Tutoriais de 30s · erros que matam negócios · o que a IA já faz sozinha" },
];
for (const p of pilares) {
  t.sub(p.p, "#22c55e");
  t.bullet("▸", p.t);
  t.bullet("•", `Exemplos: ${p.e}`, "#64748b");
}

// ─── 4. 15 REELS PRONTOS A FILMAR ───
t.section("4", "15 Reels prontos a filmar · 15 ready-to-film Reels · 15 Reels listos para grabar");
const reels: Array<{ n: string; h: string; s: string }> = [
  { n: "R1", h: "CONSTRUÍ UM SISTEMA COM 5.000 MENTES (sem prometer o impossível)", s: "Cenário: ecrã com dashboard do VISERON. Fala direto à câmara. Cenas: código a correr, painel de agentes, voz do VISERON a responder. Call to action: «Se queres ver o que isto faz, segue e ativa o sino.»" },
  { n: "R2", h: "O MEU SISTEMA DE IA TEM 9 PRINCÍPIOS BÍBLICOS", s: "Enquanto mostra a rota /api/viseron/governance, explica cada princípio em 5s. Hook: «A maioria da IA é criada sem ética. A minha nasceu com a Bíblia.»" },
  { n: "R3", h: "O TUTOR QUE ME ENSINA INGLÊS POR VOZ (ATLAS)", s: "Mostra /atlas a funcionar: fala, o ATLAS responde com voz. Hook: «Treinei um tutor de inglês com voz. Não é App Store — é meu.»" },
  { n: "R4", h: "A MINHA MANHÃ COMO CEO DE UMA STARTUP DE IA", s: "Rotina real: café, Málaga, ecrãs, reunião. Fast cuts. Mensagem: «Autoridade constrói-se todos os dias.»" },
  { n: "R5", h: "O QUE O VISERON JÁ FAZ SOZINHO", s: "Lista rápida: responde clientes, cria sites, gera apps, envia RCS, aprende sozinho. Cada item = clip de 2s do sistema a fazê-lo." },
  { n: "R6", h: "REI DO TEU MERCADO — COM IA, NÃO COM FAKE", s: "Declaração de posicionamento. Hook: «O Pedro Bertotto tem um movimento. Eu tenho um sistema. Tu podes ter ambos.»" },
  { n: "R7", h: "O ERRO QUE MATA 90% DOS NEGÓCIOS", s: "Educação + autoridade. Hook forte + explicação em 20s. Call: «Manda DM com a tua dúvida de negócio.»" },
  { n: "R8", h: "CRIEI UM SITE COM INTELIGÊNCIA ARTIFICIAL EM 10 SEGUNDOS", s: "Demo real: POST /api/sites/generate a gerar um site. Hook: «Enquanto dormes, o VISERON constrói.»" },
  { n: "R9", h: "OS MEUS TOKENS SÃO REAIS — VÊ A BLOCKCHAIN", s: "Mostra o mint do $VSR/$TRIN na Solana. Hook: «Muita gente fala de cripto. Eu cunhei os meus próprios tokens.»" },
  { n: "R10", h: "PORQUE SIGO DEUS E FAÇO IA AO MESMO TEMPO", s: "Pessoal e emocional. O que a governança bíblica significa na prática. Este Reel tem o maior potencial de viralizar no público do Bertotto." },
  { n: "R11", h: "IA VAI TIRAR TEU EMPREGO? A RESPOSTA REAL", s: "Contrarian + útil. Resposta honesta + o que fazer. Autoridade técnica + valor para o público empreendedor." },
  { n: "R12", h: "COLOQUEI 5.000 AGENTES A TRABALHAR POR MIM", s: "Narrativa de impacto. Mostra o painel de agentes a processar tarefas. Hook: «Enquanto tu dormes, eles trabalham.»" },
  { n: "R13", h: "MÁLAGA — ONDE CONSTRUO O FUTURO", s: "Lifestyle premium com propósito: escritório, praia, código. Mostra que sucesso + fé + trabalho são compatíveis." },
  { n: "R14", h: "COMO FALAR COM A TUA IA (A DEMO QUE TODOS FILMARIAM)", s: "Conversa real com o VISERON por voz, com wake word. Esta é a demo mais fácil de filmar e a mais impressionante." },
  { n: "R15", h: "EM 2026, CONSTRUO UM SISTEMA DE IA COM 5.000+ MENTES", s: "Declaração de visão + convite: «Segue e acompanha a construção em tempo real. Vais ver o futuro antes de todos.»" },
];
for (const r of reels) {
  t.sub(`${r.n} — ${r.h}`, "#7c3aed");
  t.bullet("▸", r.s);
}

// ─── 5. FOTOS A PRODUZIR ───
t.section("5", "Fotos a produzir · Photos to produce · Fotos a producir");
const fotos = [
  { n: "F1", t: "Retrato de autoridade", s: "Studio: luz dura lateral, fundo escuro, fato ou camisa. Pedro de frente, braços cruzados, olhar firme. Publicar como foto de perfil." },
  { n: "F2", t: "No ecrã", s: "Pedro de costas com o dashboard do VISERON acesos no ecrã gigante, tons neon (azul/ciano). Transmite «estou a construir»." },
  { n: "F3", t: "Código + fé", s: "Bíblia aberta em cima da secretária ao lado do portátil com código. A imagem que resume o posicionamento." },
  { n: "F4", t: "Málaga lifestyle", s: "Terrace/office em Málaga ao entardecer, copo de café, caderno. Sucesso com propósito." },
  { n: "F5", t: "Produto real", s: "Photo do sistema: dashboard, tokens $VSR/$TRIN, PDFs gerados pelo VISERON espalhados na mesa." },
];
for (const f of fotos) {
  t.sub(`${f.n} — ${f.t}`, "#22c55e");
  t.bullet("▸", f.s);
}

// ─── 6. CALENDÁRIO 30 DIAS ───
t.section("6", "Calendário de 30 dias · 30-day calendar · Calendario de 30 días");
t.sub("3 Reels/semana + 3 stories/dia. Semana 1-2: 2 Reels de construção + 1 de fé. Semana 3-4: 2 de construção + 1 de IA para empreendedores.", "#7c3aed");
const cal: Array<{ s: string; r: string; e: string }> = [
  { s: "Semana 1", r: "R1 · R2 · R3", e: "Fotos F1+F2 · anunciar o movimento «Rei do Teu Mercado» · responder a todas as DMs" },
  { s: "Semana 2", r: "R4 · R5 · R6", e: "F3 · primeiro story com voz do VISERON · colab com 1 criador de fé/tecnologia" },
  { s: "Semana 3", r: "R7 · R8 · R9", e: "F4 · live no Instagram (mostrar o sistema ao vivo) · perguntar «o que queres ver?»" },
  { s: "Semana 4", r: "R10 · R11 · R12", e: "F5 · lançar série fixa «Princípio do Dia» · revisão de métricas" },
];
for (const c of cal) {
  t.sub(c.s, "#22c55e");
  t.bullet("▸", `Reels: ${c.r}`);
  t.bullet("•", c.e, "#64748b");
}

// ─── 7. REGRAS DE OURO DO CRESCIMENTO ───
t.section("7", "Regras de ouro · Golden rules · Reglas de oro");
t.bullet("▸", "Parar de seguir em massa: reduzir os «a seguir» abaixo de 2.000 (deixar de seguir contas inativas/random) — destrava o alcance.");
t.bullet("▸", "Consistência > quantidade: 3 Reels/semana durante 90 dias vale mais que 30 posts em 1 semana.");
t.bullet("▸", "Autoridade real: TODA a semana publicar 1 demo real do VISERON (voz, tutor, site, tokens).");
t.bullet("▸", "Interação diária: 30 min/dia a responder DMs e comentários nos primeiros 30 min após cada post.");
t.bullet("▸", "Colabs estratégicos: 2-3 colabs/mês com criadores de fé + tecnologia + negócios (o público do Bertotto).");
t.bullet("▸", "Movimento: usar sempre a hashtag #ReiDoTeuMercado e mencionar o «movimento» em cada bio atualizada.");
t.bullet("▸", "Quando houver orçamento: impulsionar os Reels R10 (fé+IA) e R1 (5.000 mentes) para públicos de fé/tecnologia em PT e ES.");
t.bullet("▸", "1M-2026 é alcançável SÓ com ads + colabs de grandes criadores — o plano orgânico realista é 50k-150k seguidores consistentes em 12 meses com este ritmo.");

// ─── 8. KPIs REALISTAS ───
t.section("8", "KPIs realistas a 90 dias · Realistic 90-day KPIs · KPIs realistas a 90 días");
t.kv("Alcance semanal:", "começar em ~5-10k e dobrar a cada 30 dias se a retenção dos Reels > 60%");
t.kv("Seguidores (orgânico):", "+3k a +8k nos primeiros 90 dias com constância (realista, sem ads)");
t.kv("Seguidores (com ads):", "+20k a +50k com €300-500/mês em impulsionamento");
t.kv("DMs/colabs recebidas:", "meta de 5-10 por semana a partir do mês 2");
t.kv("Movimento:", "500-2.000 pessoas a usar #ReiDoTeuMercado até ao dia 90");
t.kv("Regra de honra:", "nunca comprar seguidores, nunca prometer «ficar rico em 1 semana» — autoridade real ou nada");

t.spacer(1);
t.para("© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) · VISERON — a superinteligência com valores", 9, "#7c3aed", { align: "center" });
t.para(`Gerado pelo Squad AIOX · ${new Date().toLocaleDateString("pt-PT")}`, 8.5, "#64748b", { align: "center" });

const pages = t.page();
t.finish(OUT);
setTimeout(() => {
  const size = fs.statSync(OUT).size;
  console.log(`✅ Viseron_Plano_Marca_Instagram.pdf gerado — ${(size / 1024).toFixed(1)} KB · ${pages} páginas`);
}, 800);
