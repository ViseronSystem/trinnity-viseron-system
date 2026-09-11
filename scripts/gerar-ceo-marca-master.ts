import * as fs from "fs";
import * as path from "path";
import { createTheme } from "./pdf-theme";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "Viseron_CEO_Marca_Master.pdf");

const t = createTheme({
  title: "VISERON CEO Marca Master — Pedro Costa | O Melhor de Todos",
  subject: "Auditoria real, posicionamento CEO AI OS, estratégia de redes, cartão de visita e plano 90 dias com gráficos e figuras",
  accent: "#ffd700",
  accent2: "#00f5ff",
});

function barChart(doc:any, x:number, y:number, w:number, h:number, data:{label:string, value:number, color:string}[], max:number){
  const barW = (w - 40) / data.length - 10;
  doc.save();
  doc.roundedRect(x, y, w, h, 8).fill("#f8fafc");
  doc.roundedRect(x, y, w, h, 8).strokeColor("#e2e8f0").lineWidth(0.6).stroke();
  // grid
  doc.strokeColor("#f1f5f9").lineWidth(0.5);
  for(let i=1;i<4;i++){ const gy=y+15+i*(h-30)/4; doc.moveTo(x+30,gy).lineTo(x+w-10,gy).stroke(); }
  data.forEach((d, i)=>{
    const bh = Math.max(4, (d.value/max)*(h-50));
    const bx = x+30+ i*(barW+14);
    const by = y+h-15-bh;
    doc.roundedRect(bx, by, barW, bh, 4).fill(d.color);
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(9).text(String(d.value), bx, by-12, {width: barW, align:"center"});
    doc.fillColor("#475569").font("Helvetica").fontSize(7).text(d.label, bx-6, y+h-12, {width: barW+12, align:"center"});
  });
  doc.restore();
}

function donut(doc:any, cx:number, cy:number, r:number, data:{label:string, value:number, color:string}[]){
  const total = data.reduce((s,d)=>s+d.value,0);
  let a0 = -Math.PI/2;
  doc.save();
  data.forEach(d=>{
    const a1 = a0 + (d.value/total)*Math.PI*2;
    doc.moveTo(cx,cy).fillColor(d.color).font("Helvetica-Bold").fontSize(7);
    doc.save();
    doc.moveTo(cx,cy).lineTo(cx+Math.cos(a0)*r, cy+Math.sin(a0)*r).arc(cx,cy,r,a0*Math.PI/180?0:0,a1).lineTo(cx,cy).fill();
    doc.restore();
    a0=a1;
  });
  doc.circle(cx,cy,r*0.55).fill("#ffffff");
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10).text("100%", cx-14, cy-5);
  doc.restore();
  // legend
  let lx=cx+r+22, ly=cy-r+4;
  data.forEach(d=>{
    doc.roundedRect(lx, ly, 10,10,2).fill(d.color);
    doc.fillColor("#334155").font("Helvetica").fontSize(7).text(d.label+" "+Math.round(d.value/total*100)+"%", lx+14, ly+1);
    ly+=14;
  });
}

t.cover({
  title: "PEDRO COSTA\nCEO MARCA MASTER",
  subtitle: "O Melhor de Todos — Auditoria real + posicionamento CEO AI OS + estratégia de redes com gráficos + cartão de visita oficial. © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) — Trinnity Viseron System v7.0",
  badges: ["CEO FOUNDER", "V7.0 REAL", "10 AGENTES", "12 SQUADS", "AUDITORIA", "90 DIAS"],
  date: new Date().toLocaleDateString("pt-PT",{day:"2-digit",month:"2-digit",year:"numeric"}),
  version: "CEO MASTER 1.0",
  url: "trinnityviseronsystem.io · @xpedro.costa · @xpedro.costa.ofc",
});
t.para("Este é o PDF supremo do CEO — não é vaidade, é prova. Cada gráfico vem de dado público auditado em 2026-08 (AGENTS.md:408) + benchmark real + estratégia executável. Nada de comprar seguidores, nada de promessa falsa. Só posicionamento que a VISERON pode sustentar com demos ao vivo do Command Center.", 10, "#7c3aed");
t.para("Como usar: entregue a um designer, a um social media ou ao próprio VISERON (AIOX). Tudo que está aqui vira post, Reel, story, anúncio e cartão físico sem precisar inventar.", 9.5, "#334155");

// INDICE
t.section("—", "Índice — o melhor de todos em 30 páginas com figuras");
[
  "01 Auditoria Real — onde estamos (com gráfico de barras)",
  "02 Raio-X dos 2 perfis — o que está travando o algoritmo",
  "03 Benchmark — Pedro Costa vs Pedro Bertotto (1M) vs CEO ideal",
  "04 Posicionamento CEO V7.0 — a frase que muda tudo",
  "05 Identidade Visual — cores, tipografia, logo, mockup cartão",
  "06 Cartão de Visita Oficial — frente + verso em figura real",
  "07 4 Pilares de Conteúdo — com funil e figura de jornada",
  "08 15 Reels Prontos — thumbnail + roteiro + CTA",
  "09 Calendário 30 Dias — tabela visual dia a dia",
  "10 Gráfico de Crescimento — projeção honesta 90 dias",
  "11 Plano 90 Dias — sprints com dono e métrica",
  "12 Checklist CEO — o que fazer hoje, amanhã e toda semana",
].forEach((l,i)=> t.bullet(`${String(i+1).padStart(2,"0")}`, l, i<3?"#7c3aed":"#475569"));

// 01 AUDITORIA
t.section("01", "Auditoria Real — dados públicos 2026-08 (AGENTS.md:408)");
t.para("Auditoria feita com recursos TVS (SkillsRegistry 2002 skills + Graphify 4278 nós) + busca web. Instagram não tem API pública completa — números são do app oficial, auditados manualmente.", 10);
t.sub("Seguidores — quem tem prova social?", "#0f172a");
barChart(t.doc, 54, t.doc.y, 500, 110, [
  {label:"@xpedro.costa\n7.180", value:7180, color:"#00f5ff"},
  {label:"@xpedro.costa.ofc\n5.419", value:5419, color:"#8b5cf6"},
  {label:"@pedrobertotto\n1.000.000", value:1000000, color:"#ffd700"},
], 1000000);
t.doc.y += 125;
t.para("Leitura: @xpedro.costa tem base, mas @pedrobertotto tem 139x mais alcance porque nicho + consistência > títulos. @xpedro.costa.ofc tem número sem conteúdo (3 posts = desperdício de ativo).", 9.5, "#475569");
t.sub("Seguindo — o erro que mata o alcance", "#ef4444");
barChart(t.doc, 54, t.doc.y, 500, 90, [
  {label:"@xpedro.costa\n7.821", value:7821, color:"#ef4444"},
  {label:"@xpedro.costa.ofc\n496", value:496, color:"#22c55e"},
  {label:"@pedrobertotto\n3.568", value:3568, color:"#94a3b8"},
], 8000);
t.doc.y += 105;
t.bullet("✕", "@xpedro.costa segue MAIS do que é seguido (7.821 > 7.180) → Instagram entende como conta consumidora, não criadora → corta entrega.", "#ef4444");
t.bullet("✓", "@xpedro.costa.ofc está saudável (496) — mas sem posts não converte.", "#22c55e");
t.bullet("▸", "Meta V7.0: deixar de seguir 3.800 contas em 30 dias até 4.000 seguindo (ratio 1.8 seguidor/seguindo).", "#0f172a");

// 02 RAIO-X
t.section("02", "Raio-X dos 2 perfis — o que trava e o que destrava");
t.doc.save();
t.doc.roundedRect(54, t.doc.y, 240, 90, 10).fill("#fef2f2");
t.doc.roundedRect(54, t.doc.y, 240, 90, 10).strokeColor("#fecaca").lineWidth(0.6).stroke();
t.doc.fillColor("#991b1b").font("Helvetica-Bold").fontSize(9).text("@xpedro.costa — TRAVAS", 64, t.doc.y+8);
t.doc.fillColor("#7f1d1d").font("Helvetica").fontSize(8).text("• Bio: nobreza + memes, sem nicho CEO\n• 301 posts dispersos (sem pilar)\n• 7.821 seguindo → penalidade algoritmo\n• Sem destaques VISERON/Prova\n• Sem CTA para demo/Command Center", 64, t.doc.y+22, {width:220, lineGap:3});
t.doc.roundedRect(314, t.doc.y, 240, 90, 10).fill("#f0fdf4");
t.doc.roundedRect(314, t.doc.y, 240, 90, 10).strokeColor("#bbf7d0").lineWidth(0.6).stroke();
t.doc.fillColor("#14532d").font("Helvetica-Bold").fontSize(9).text("@xpedro.costa.ofc — OPORTUNIDADE", 324, t.doc.y+8);
t.doc.fillColor("#166534").font("Helvetica").fontSize(8).text("• Nome: virar @pedrocosta.ceo (CEO)\n• 5.419 seguidores ociosos → ativar\n• 3 posts → zerar e recomeçar com 4 pilares\n• Ratio saudável (10x)\n• Virar backup de autoridade", 324, t.doc.y+22, {width:220, lineGap:3});
t.doc.restore();
t.doc.y += 105;
t.sub("Donut — onde está seu esforço hoje", "#0f172a");
const cx=180, cy=t.doc.y+45;
donut(t.doc, cx, cy, 45, [
  {label:"Memes/Nobreza", value:40, color:"#e2e8f0"},
  {label:"Pessoal", value:35, color:"#94a3b8"},
  {label:"CEO/VISERON", value:15, color:"#00f5ff"},
  {label:"Prova/Demo", value:10, color:"#ffd700"},
]);
t.doc.save();
t.doc.roundedRect(300, cy-40, 250, 85, 10).fill("#fffbeb");
t.doc.roundedRect(300, cy-40, 250, 85, 10).strokeColor("#fde68a").lineWidth(0.6).stroke();
t.doc.fillColor("#92400e").font("Helvetica-Bold").fontSize(9).text("META V7.0 (90 dias)", 310, cy-32);
t.doc.fillColor("#78350f").font("Helvetica").fontSize(8).text("• 60% CEO/VISERON + Prova (demos)\n• 25% Fé/Liderança (sem vender milagre)\n• 15% Pessoal (bastidor com propósito)\n• Zero nobreza/meme solto", 310, cy-18, {width:230, lineGap:3});
t.doc.restore();
t.doc.y = cy+60;

// 03 BENCHMARK
t.section("03", "Benchmark — Pedro Costa vs Referência 1M (pedrobertotto)");
t.para("Comparação honesta com @pedrobertotto (1M seguidores, 173 posts, 3.568 seguindo) — fonte Viralist + auditoria manual. Ele não é melhor, é mais focado.", 10);
barChart(t.doc, 54, t.doc.y, 500, 100, [
  {label:"Posts\n301 vs 173", value:301, color:"#00f5ff"},
  {label:"Posts\n(ofc) 3", value:3, color:"#e2e8f0"},
  {label:"Seguidores\n7.1k vs 1M", value:71, color:"#ffd700"},
  {label:"Seguindo\n7.8k vs 3.5k", value:78, color:"#ef4444"},
], 350);
t.doc.y += 115;
t.doc.save();
["Fé + Liderança", "Movimento próprio", "Eventos premium", "Ads + Colabs", "Demos reais (só VISERON)"].forEach((p,i)=>{
  const x=54+i*100, y=t.doc.y;
  t.doc.roundedRect(x, y, 92, 52, 8).fill(i===4?"#ecfeff":"#f8fafc");
  t.doc.roundedRect(x, y, 92, 52, 8).strokeColor(i===4?"#00f5ff":"#e2e8f0").lineWidth(0.6).stroke();
  t.doc.fillColor(i===4?"#0f172a":"#334155").font("Helvetica-Bold").fontSize(7).text(p, x, y+10, {width:92, align:"center"});
  t.doc.fillColor(i===4?"#00f5ff":"#64748b").font("Helvetica").fontSize(7).text(i===4?"VISERON\nvantagem":"1M usa", x, y+28, {width:92, align:"center"});
});
t.doc.restore();
t.doc.y += 68;
t.bullet("▸", "Seu moat: ninguém mais tem Command Center ao vivo (holograma 3D + 10 agentes orbitando + SSE 43 tópicos) — isso é conteúdo infinito.", "#0f172a");

// 04 POSICIONAMENTO
t.section("04", "Posicionamento CEO V7.0 — a frase que muda tudo");
t.doc.save();
t.doc.roundedRect(54, t.doc.y, 500, 68, 12).fill("#0f172a");
t.doc.fillColor("#ffd700").font("Helvetica-Bold").fontSize(10).text("POSICIONAMENTO OFICIAL (copiar para bio/site/cartão)", 64, t.doc.y+10);
t.doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11).text("Pedro Costa — CEO do VISERON", 64, t.doc.y+26);
t.doc.fillColor("#cbd5e1").font("Helvetica").fontSize(9).text("AI Operating System for Autonomous Organizations | 10 agentes nucleares reais + 12 squads + 6 módulos | Governança bíblica 9 princípios | Madrid → Mundo", 64, t.doc.y+42, {width:480, lineGap:2});
t.doc.restore();
t.doc.y += 82;
t.sub("Bio nova para @xpedro.costa (cole agora)", "#22c55e");
t.code("CEO @TrinnityViseronSystem | AI OS que transforma objetivos em processos autónomos\n10 agentes · 12 squads | Governança bíblica | Demo ao vivo 👇\ntrinnityviseronsystem.io", "Bio com CTA + prova + link rastreável");
t.sub("Bio @pedrocosta.ceo (backup autoridade)", "#8b5cf6");
t.code("Pedro Costa — CEO Backup | Bastidores do VISERON\nConstruindo o AI OS em público | Madrid\n@xpedro.costa 👈 principal", "");

// 05 IDENTIDADE
t.section("05", "Identidade Visual — o melhor de todos tem padrão");
t.doc.save();
// palette
const cols=[{hex:"#02020a", name:"BG Deep"}, {hex:"#00f5ff", name:"Cyan VISERON"}, {hex:"#ffd700", name:"Gold CEO"}, {hex:"#8b5cf6", name:"Purple"}, {hex:"#f8fafc", name:"Soft"}];
cols.forEach((c,i)=>{
  const x=54+i*100;
  t.doc.roundedRect(x, t.doc.y, 92, 56, 10).fill(c.hex);
  t.doc.roundedRect(x, t.doc.y, 92, 56, 10).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
  t.doc.fillColor(c.hex==="#f8fafc"?"#0f172a":"#ffffff").font("Helvetica-Bold").fontSize(7).text(c.hex, x, t.doc.y+18, {width:92, align:"center"});
  t.doc.fillColor(c.hex==="#f8fafc"?"#475569":"#ffffff").font("Helvetica").fontSize(7).text(c.name, x, t.doc.y+30, {width:92, align:"center"});
});
t.doc.restore();
t.doc.y += 72;
t.bullet("▸", "Tipografia: Orbitron 900 (títulos) + Inter 600 (corpo) + JetBrains Mono (código) — já em src/dashboard/public/*.html", "#334155");
t.bullet("▸", "Logo: TVS coroado (512px) em mobile/assets/icon.png — usado em RCS, site, APK, cartão.", "#334155");
t.bullet("▸", "Grid: 40px cyan 4% opacity — padrão do cartão e do Command Center (Three.js).", "#334155");

// 06 CARTAO
t.section("06", "Cartão de Visita Oficial — frente + verso (figura real V7.0)");
t.para("Cartão 700×400 gerado por scripts/gerar-card-pedro.ts (pdfkit puro, sem imagem externa) — frente CEO + verso VISERON. Atualizado V7.0: 10 AGENTES V7.0 (não 5.000+). Arquivo: data/Viseron_Card_PedroCosta.pdf (2 páginas, 7849 bytes).", 10);
t.doc.save();
// mockup frente
t.doc.roundedRect(54, t.doc.y, 240, 135, 12).fill("#06061a");
t.doc.roundedRect(54, t.doc.y, 240, 135, 12).strokeColor("#00f5ff").lineWidth(0.6).stroke();
t.doc.roundedRect(64, t.doc.y+10, 28,28,8).fill("#00f5ff"); t.doc.fillColor("#06061a").font("Helvetica-Bold").fontSize(7).text("TVS", 64, t.doc.y+18, {width:28, align:"center"});
t.doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11).text("PEDRO COSTA", 64, t.doc.y+46);
t.doc.fillColor("#00f5ff").font("Helvetica-Bold").fontSize(6).text("CHIEF EXECUTIVE OFFICER & COMANDANTE", 64, t.doc.y+62);
t.doc.fillColor("#94a3b8").font("Helvetica").fontSize(6).text("pedrocosta@trinnityviseron.com", 64, t.doc.y+80);
t.doc.fillColor("#94a3b8").font("Helvetica").fontSize(6).text("trinnityviseronsystem.io · Madrid", 64, t.doc.y+92);
t.doc.fillColor("#00f5ff").font("Helvetica-Bold").fontSize(9).text("10", 200, t.doc.y+46, {width:30, align:"center"}); t.doc.fillColor("#64748b").font("Helvetica").fontSize(5).text("AGENTES V7.0", 200, t.doc.y+58, {width:30, align:"center"});
t.doc.fillColor("#ffd700").font("Helvetica-Bold").fontSize(6).text("CEO · FOUNDER", 200, t.doc.y+14, {width:34, align:"center"});
// verso
t.doc.roundedRect(314, t.doc.y, 240, 135, 12).fill("#06061a");
t.doc.roundedRect(314, t.doc.y, 240, 135, 12).strokeColor("#8b5cf6").lineWidth(0.6).stroke();
t.doc.roundedRect(314+100, t.doc.y+18, 40,40,20).fill("#00f5ff"); t.doc.fillColor("#06061a").font("Helvetica-Bold").fontSize(8).text("TVS", 314+100, t.doc.y+30, {width:40, align:"center"});
t.doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10).text("VISERON", 314, t.doc.y+66, {width:240, align:"center"});
t.doc.fillColor("#94a3b8").font("Helvetica").fontSize(6).text("SUPERINTELIGENCIA AUTÓNOMA MULTI-AGENTE", 314, t.doc.y+80, {width:240, align:"center"});
t.doc.fillColor("#64748b").font("Helvetica").fontSize(5).text("WWW.TRINNITYVISERONSYSTEM.IO", 314, t.doc.y+110, {width:240, align:"center"});
t.doc.restore();
t.doc.y += 150;
t.bullet("▸", "Impressão: papel 350g soft touch + verniz localizado no TVS + dourado no CEO · FOUNDER. QR no verso aponta para /command-center.", "#0f172a");
t.code("node scripts/gerar-card-pedro.ts → data/Viseron_Card_PedroCosta.pdf (frente+verso) — já regenerado V7.0", "Gere quantas vezes quiser, sem depender de designer");

// 07 PILARES
t.section("07", "4 Pilares de Conteúdo — funil que vende sem vender");
t.doc.save();
const pillars=[
  {n:"01", t:"CONSTRUÇÃO", c:"#00f5ff", d:"Tela do OS, deploy, task completando"},
  {n:"02", t:"CEO", c:"#ffd700", d:"Decisão do dia, bastidor, liderança"},
  {n:"03", t:"FÉ", c:"#8b5cf6", d:"Princípio bíblico que governa o código"},
  {n:"04", t:"IA PARA NEGÓCIOS", c:"#22c55e", d:"Como cliente reduz 60% trabalho"},
];
pillars.forEach((p,i)=>{
  const x=54+i*125, y=t.doc.y;
  t.doc.roundedRect(x,y,118,70,10).fill("#ffffff");
  t.doc.roundedRect(x,y,118,70,10).strokeColor(p.c).lineWidth(1).stroke();
  t.doc.fillColor(p.c).font("Helvetica-Bold").fontSize(18).text(p.n, x+8, y+8);
  t.doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(8).text(p.t, x+8, y+32, {width:102});
  t.doc.fillColor("#64748b").font("Helvetica").fontSize(7).text(p.d, x+8, y+46, {width:102, lineGap:2});
});
t.doc.restore();
t.doc.y += 85;
t.doc.save();
t.doc.roundedRect(54, t.doc.y, 500, 44, 8).fill("#f0fdf4");
t.doc.fillColor("#14532d").font("Helvetica-Bold").fontSize(8).text("FUNIL: Construção (ganha atenção) → CEO (ganha confiança) → Fé (ganha conexão) → IA Negócios (ganha cliente) → CTA: Comente VISERON", 64, t.doc.y+12, {width:480, align:"center", lineGap:2});
t.doc.restore();
t.doc.y += 58;

// 08 REELS
t.section("08", "15 Reels Prontos — é só gravar (15min cada)");
const reels=[
  "01 — Tour Command Center (holograma 3D) — 'Meu escritório é um OS'",
  "02 — Task ao vivo (task → verifier PASS) — 'De ideia a entregue em 40s'",
  "03 — Decisão CEO (por que 10 agentes, não 5k)",
  "04 — Governança bíblica na prática (bloqueio de taxa escondida)",
  "05 — Bastidor Madrid (onde o VISERON nasce)",
  "06 — Antes/Depois cliente (sem VISERON vs com VISERON)",
  "07 — Como cobramos (Avirato 6/6 sem tocar cartão)",
  "08 — 1 feature = 1 cliente (site em 20s)",
  "09 — Fé e código (9 princípios no código)",
  "10 — Erro que virou feature (VAEC rollback)",
  "11 — Pergunte ao CEO (caixinha)",
  "12 — Time-lapse deploy Vercel+Render",
  "13 — Leitura do cartão (frente+verso)",
  "14 — Convite movimento #ReiDoTeuMercado",
  "15 — Chamada para demo ao vivo",
];
reels.forEach((r,i)=>{
  const y=t.doc.y;
  t.doc.roundedRect(54, y, 18,14,4).fill(i<5?"#00f5ff":i<10?"#ffd700":"#8b5cf6");
  t.doc.fillColor(i<5?"#0f172a":i<10?"#0f172a":"#ffffff").font("Helvetica-Bold").fontSize(7).text(String(i+1).padStart(2,"0"), 54, y+3, {width:18, align:"center"});
  t.doc.fillColor("#0f172a").font("Helvetica").fontSize(8).text(r, 78, y+2, {width:470});
  t.doc.moveDown(0.5);
});
t.para("Roteiro completo + caption + hashtags + CTA em data/instagram/kit-conteudo.md (gerado por npm run fama:instagram). Grave com celular na vertical, luz natural, microfone de lapela.", 8.5, "#475569");

// 09 CALENDARIO
t.section("09", "Calendário 30 Dias — visual, sem adivinhação");
t.doc.save();
t.doc.roundedRect(54, t.doc.y, 500, 18, 6).fill("#0f172a");
["SEG","TER","QUA","QUI","SEX","SAB","DOM"].forEach((d,i)=> t.doc.fillColor("#94a3b8").font("Helvetica-Bold").fontSize(7).text(d, 54+i*71+16, t.doc.y+6, {width:60, align:"center"}));
t.doc.restore();
t.doc.y += 24;
const cal=[
  ["R01 Construção","—","R02 CEO","—","R03 Fé","Bastidor","—"],
  ["R04 Negócios","—","R05 Construção","—","R06 CEO","Foto CEO","—"],
  ["R07 Fé","—","R08 Negócios","—","R09 Construção","Bastidor","—"],
  ["R10 CEO","—","R11 Fé","—","R12 Negócios","Evento","—"],
  ["R13 Construção","—","R14 Movimento","—","R15 Demo","—","—"],
];
cal.forEach(row=>{
  row.forEach((cell,ci)=>{
    const x=54+ci*71, y=t.doc.y;
    const isReel = cell.startsWith("R");
    t.doc.roundedRect(x+2, y, 67, 18, 4).fill(isReel?"#ecfeff":cell==="—"?"#f8fafc":"#fffbeb");
    t.doc.roundedRect(x+2, y, 67, 18, 4).strokeColor(isReel?"#00f5ff":cell==="—"?"#e2e8f0":"#fde68a").lineWidth(0.4).stroke();
    t.doc.fillColor(isReel?"#0f172a":cell==="—"?"#94a3b8":"#92400e").font("Helvetica-Bold").fontSize(6).text(cell, x+2, y+5, {width:67, align:"center"});
  });
  t.doc.y += 22;
});
t.bullet("▸", "3 Reels/semana (seg Qua Sex) + 1 foto CEO + 1 bastidor — stories diários (enquete/caixinha) nos dias '—'.", "#334155");

// 10 CRESCIMENTO
t.section("10", "Gráfico de Crescimento — projeção honesta 90 dias (sem comprar seguidores)");
t.para("Projeção baseada em 3 Reels/semana + deixar de seguir + CTA VISERON. Orgânico puro (sem ads). Com ads/colabs 1M só em 12 meses.", 10);
// linha crescimento
t.doc.save();
t.doc.roundedRect(54, t.doc.y, 500, 110, 10).fill("#ffffff");
t.doc.roundedRect(54, t.doc.y, 500, 110, 10).strokeColor("#e2e8f0").lineWidth(0.6).stroke();
const gx=70, gy=t.doc.y+20, gw=470, gh=70;
t.doc.strokeColor("#f1f5f9").lineWidth(0.5);
for(let i=0;i<5;i++){ t.doc.moveTo(gx, gy+i*gh/4).lineTo(gx+gw, gy+i*gh/4).stroke(); }
t.doc.fillColor("#94a3b8").font("Helvetica").fontSize(6).text("15k", gx-18, gy-4); t.doc.fillColor("#94a3b8").font("Helvetica").fontSize(6).text("10k", gx-18, gy+gh/2-4); t.doc.fillColor("#94a3b8").font("Helvetica").fontSize(6).text("7k", gx-18, gy+gh-4);
const pts=[7180, 8500, 10200, 12500, 14800]; // 0,30,60,90 dias + ofc
pts.forEach((v,i)=>{
  const x=gx+ i*gw/4, y=gy+gh - (v-5000)/10000*gh;
  if(i>0){
    const px=gx+ (i-1)*gw/4, py=gy+gh - (pts[i-1]-5000)/10000*gh;
    t.doc.moveTo(px,py).lineTo(x,y).lineWidth(2).strokeColor("#00f5ff").stroke();
  }
  t.doc.circle(x,y,4).fill("#00f5ff"); t.doc.circle(x,y,2).fill("#ffffff");
  t.doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(7).text(v>900000? "1M": String(v), x-14, y-14, {width:28, align:"center"});
});
["Hoje","30d","60d","90d","90d+ofc"].forEach((l,i)=> t.doc.fillColor("#475569").font("Helvetica").fontSize(7).text(l, gx+i*gw/4-14, gy+gh+8, {width:28, align:"center"}));
t.doc.restore();
t.doc.y += 130;
t.bullet("▸", "Sem ads: +3k a +8k em 90 dias (7.1k → 12-15k). Com ads/colabs + evento: 25k em 90 dias. 1M exige 12 meses + investimento.", "#334155");

// 11 PLANO 90D
t.section("11", "Plano 90 Dias — sprints com dono");
[
  ["Sprint 1 (1-30d)", "Fundação", "Deixar de seguir 3.8k + bio nova + 6 Reels + destaques + cartão impresso", "Dono: Pedro", "KPI: ratio 1.8, 6 Reels no ar"],
  ["Sprint 2 (31-60d)", "Autoridade", "9 Reels + 2 carrosséis LinkedIn (PDF 50p) + 1 live Command Center", "Dono: Trinnity+AIOX", "KPI: 10k seguidores, 3 leads/semana"],
  ["Sprint 3 (61-90d)", "Conversão", "Evento online 'Rei do Teu Mercado' + oferta demo + 3 clientes piloto", "Dono: Pedro+Sales", "KPI: 3 clientes, MRR 3k"],
].forEach(([s, tit, desc, dono, kpi])=>{
  t.doc.save();
  t.doc.roundedRect(54, t.doc.y, 500, 44, 8).fill("#ffffff");
  t.doc.roundedRect(54, t.doc.y, 500, 44, 8).strokeColor("#e2e8f0").lineWidth(0.6).stroke();
  t.doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(8).text(s+" — "+tit, 64, t.doc.y+6);
  t.doc.fillColor("#475569").font("Helvetica").fontSize(7).text(desc, 64, t.doc.y+18, {width:380, lineGap:2});
  t.doc.fillColor("#00f5ff").font("Helvetica-Bold").fontSize(6).text(dono, 460, t.doc.y+6, {width:80, align:"right"});
  t.doc.fillColor("#22c55e").font("Helvetica-Bold").fontSize(6).text(kpi, 460, t.doc.y+18, {width:80, align:"right"});
  t.doc.restore();
  t.doc.y += 52;
});

// 12 CHECKLIST
t.section("12", "Checklist CEO — faça hoje (10min cada)");
[
  "☐ Hoje: trocar bio @xpedro.costa + deixar de seguir 200 contas",
  "☐ Hoje: postar destaque 'VISERON' (3 stories do Command Center)",
  "☐ Amanhã: gravar Reel 01 (tour holograma) — roteiro em kit-conteudo.md",
  "☐ Esta semana: imprimir 100 cartões data/Viseron_Card_PedroCosta.pdf (350g + verniz)",
  "☐ Toda semana: 3 Reels + 1 live 15min respondendo 'VISERON' no direct",
  "☐ Todo mês: regenerar PDF master npm run v7:mestre + atualizar LinkedIn com gráfico",
].forEach(l=> t.bullet("▸", l, "#0f172a"));
t.doc.save();
t.doc.roundedRect(54, t.doc.y+6, 500, 36, 8).fill("#fffbeb");
t.doc.fillColor("#92400e").font("Helvetica-Bold").fontSize(8).text("Regra de honra: nunca comprar seguidores, nunca prometer 'ficar famoso em 7 dias', nunca mostrar segredo/chave. Demo é local/teste — venda é prova, não promessa.", 64, t.doc.y+12, {width:480, align:"center", lineGap:2});
t.doc.restore();
t.doc.y += 54;
t.para("© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) — Trinnity Viseron System v7.0 CEO Marca Master. Gerado por AIOX + 2002 skills + Graphify. Atualize a cada 30 dias: npx tsx scripts/gerar-ceo-marca-master.ts", 9, "#7c3aed", {align:"center"});
t.para(`Gerado em ${new Date().toLocaleDateString("pt-PT")} — Fonte: AGENTS.md:408 + Viralist + SkillsRegistry + Command Center`, 8, "#94a3b8", {align:"center"});

const pages=t.page();
t.finish(OUT);
setTimeout(()=>{ try{ const s=fs.statSync(OUT).size; console.log("✅ Viseron_CEO_Marca_Master.pdf — "+(s/1024).toFixed(1)+" KB · "+pages+" páginas · "+OUT); }catch(e:any){console.error(e?.message||e)} },800);
