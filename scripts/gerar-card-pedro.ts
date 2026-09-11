const PDFDocument = require("pdfkit");
const fs = require("fs");

const W = 700, H = 400;
const doc = new PDFDocument({ size: [W, H], margin: 0, autoFirstPage: false });
const out = fs.createWriteStream("C:\\Trinnity-Viseron-System\\data\\Viseron_Card_PedroCosta.pdf");
doc.pipe(out);

// ══════ FRENTE ══════
doc.addPage({ size: [W, H], margin: 0 });

// Fundo
doc.rect(0, 0, W, H).fill("#06061a");

// Grid sutil
doc.save();
for (let x = 0; x < W; x += 40) {
  doc.moveTo(x, 0).lineTo(x, H).lineWidth(0.3).strokeColor("#00f5ff").opacity(0.04).stroke();
}
for (let y = 0; y < H; y += 40) {
  doc.moveTo(0, y).lineTo(W, y).lineWidth(0.3).strokeColor("#00f5ff").opacity(0.04).stroke();
}
doc.restore();

// Glow lateral esquerdo
doc.save();
doc.rect(0, 0, 300, H).fill("#00f5ff").opacity(0.02);
doc.restore();

// Glow direito
doc.save();
doc.rect(400, 0, 300, H).fill("#8b5cf6").opacity(0.015);
doc.restore();

// Borda
doc.roundedRect(1, 1, W-2, H-2, 20).lineWidth(0.8).strokeColor("#00f5ff").opacity(0.15).stroke();

// Logo TVS
doc.save();
doc.roundedRect(40, 34, 56, 56, 28).fill("#00f5ff").opacity(0.15);
doc.roundedRect(42, 36, 52, 52, 26).fill("#00f5ff");
doc.font("Helvetica-Bold").fontSize(14).fillColor("#06061a").text("TVS", 44, 54, { width: 48, align: "center" });
doc.restore();

// Nome do projeto
doc.font("Helvetica-Bold").fontSize(22).fillColor("#ffffff").text("VISERON", 108, 38);
doc.font("Helvetica").fontSize(9).fillColor("#00f5ff").opacity(0.6).text("TRINNITY VISERON SYSTEM", 108, 64);
doc.opacity(1);

// Badge CEO
doc.save();
doc.roundedRect(548, 34, 112, 28, 6).fill("#ffd700");
doc.font("Helvetica-Bold").fontSize(9).fillColor("#06061a").text("CEO · FOUNDER", 548, 41, { width: 112, align: "center" });
doc.restore();

// Coroa
doc.fontSize(22).text("👑", 590, 66, { width: 40, align: "center" });

// Linha separadora
doc.moveTo(40, 105).lineTo(660, 105).lineWidth(0.5).strokeColor("#00f5ff").opacity(0.1).stroke();

// NOME
doc.font("Helvetica-Bold").fontSize(34).fillColor("#ffffff").text("PEDRO COSTA", 40, 120);

// Cargo com linha decorativa
doc.save();
doc.moveTo(40, 168).lineTo(80, 168).lineWidth(1.5).strokeColor("#00f5ff").opacity(0.5).stroke();
doc.restore();
doc.font("Helvetica-Bold").fontSize(12).fillColor("#00f5ff").opacity(0.7).text("CHIEF EXECUTIVE OFFICER & COMANDANTE", 88, 162);

// Linha secundária
doc.moveTo(40, 190).lineTo(250, 190).lineWidth(0.3).strokeColor("#8b5cf6").opacity(0.2).stroke();

// ══════ CONTATO ══════
const contactY = 210;

// Email
doc.save();
doc.roundedRect(40, contactY, 28, 28, 6).fill("#00f5ff").opacity(0.08);
doc.roundedRect(40, contactY, 28, 28, 6).lineWidth(0.4).strokeColor("#00f5ff").opacity(0.15).stroke();
doc.font("Helvetica").fontSize(12).fillColor("#00f5ff").text("@", 46, contactY + 6, { width: 16, align: "center" });
doc.restore();
doc.font("Helvetica").fontSize(8).fillColor("#00f5ff").opacity(0.5).text("EMAIL", 78, contactY + 2);
doc.font("Helvetica").fontSize(11).fillColor("#cccccc").text("pedrocosta@trinnityviseron.com", 78, contactY + 14);

// Web
doc.save();
doc.roundedRect(40, contactY + 40, 28, 28, 6).fill("#00f5ff").opacity(0.08);
doc.roundedRect(40, contactY + 40, 28, 28, 6).lineWidth(0.4).strokeColor("#00f5ff").opacity(0.15).stroke();
doc.font("Helvetica").fontSize(12).fillColor("#00f5ff").text("W", 46, contactY + 46, { width: 16, align: "center" });
doc.restore();
doc.font("Helvetica").fontSize(8).fillColor("#00f5ff").opacity(0.5).text("WEB", 78, contactY + 42);
doc.font("Helvetica").fontSize(11).fillColor("#cccccc").text("trinnityviseronsystem.io", 78, contactY + 54);

// Localização
doc.save();
doc.roundedRect(40, contactY + 80, 28, 28, 6).fill("#00f5ff").opacity(0.08);
doc.roundedRect(40, contactY + 80, 28, 28, 6).lineWidth(0.4).strokeColor("#00f5ff").opacity(0.15).stroke();
doc.font("Helvetica").fontSize(12).fillColor("#00f5ff").text("M", 46, contactY + 86, { width: 16, align: "center" });
doc.restore();
doc.font("Helvetica").fontSize(8).fillColor("#00f5ff").opacity(0.5).text("UBICACIÓN", 78, contactY + 82);
doc.font("Helvetica").fontSize(11).fillColor("#cccccc").text("Madrid, España", 78, contactY + 94);

// Platform
doc.save();
doc.roundedRect(320, contactY, 28, 28, 6).fill("#8b5cf6").opacity(0.08);
doc.roundedRect(320, contactY, 28, 28, 6).lineWidth(0.4).strokeColor("#8b5cf6").opacity(0.15).stroke();
doc.font("Helvetica").fontSize(12).fillColor("#8b5cf6").text("P", 326, contactY + 6, { width: 16, align: "center" });
doc.restore();
doc.font("Helvetica").fontSize(8).fillColor("#8b5cf6").opacity(0.5).text("PLATAFORMA", 358, contactY + 2);
doc.font("Helvetica").fontSize(11).fillColor("#cccccc").text("AI · Blockchain · Multi-Agent", 358, contactY + 14);

// ══════ STATS ══════
const statsX = 480;
const statsY = 215;

// 10 (V7.0 REAL)
doc.font("Helvetica-Bold").fontSize(22).fillColor("#00f5ff").text("10", statsX, statsY);
doc.font("Helvetica").fontSize(8).fillColor("#666688").text("AGENTES V7.0", statsX, statsY + 24);

// Divisor
doc.moveTo(statsX + 80, statsY + 5).lineTo(statsX + 80, statsY + 30).lineWidth(0.5).strokeColor("#00f5ff").opacity(0.15).stroke();

// 9
doc.font("Helvetica-Bold").fontSize(22).fillColor("#00f5ff").text("9", statsX + 95, statsY);
doc.font("Helvetica").fontSize(8).fillColor("#666688").text("PRINCIPIOS", statsX + 95, statsY + 24);

// Divisor
doc.moveTo(statsX + 155, statsY + 5).lineTo(statsX + 155, statsY + 30).lineWidth(0.5).strokeColor("#00f5ff").opacity(0.15).stroke();

// 3
doc.font("Helvetica-Bold").fontSize(22).fillColor("#00f5ff").text("3", statsX + 170, statsY);
doc.font("Helvetica").fontSize(8).fillColor("#666688").text("REDES", statsX + 170, statsY + 24);

// Linha inferior
doc.moveTo(0, H - 3).lineTo(W, H - 3).lineWidth(2);
const grad = doc.linearGradient(0, H - 3, W, H - 3);
grad.stop(0, "#00f5ff00");
grad.stop(0.3, "#00f5ff");
grad.stop(0.7, "#8b5cf6");
grad.stop(1, "#8b5cf600");
doc.stroke(grad);

// ══════ VERSO ══════
doc.addPage({ size: [W, H], margin: 0 });

doc.rect(0, 0, W, H).fill("#06061a");

// Grid
doc.save();
for (let x = 0; x < W; x += 40) {
  doc.moveTo(x, 0).lineTo(x, H).lineWidth(0.3).strokeColor("#00f5ff").opacity(0.04).stroke();
}
for (let y = 0; y < H; y += 40) {
  doc.moveTo(0, y).lineTo(W, y).lineWidth(0.3).strokeColor("#00f5ff").opacity(0.04).stroke();
}
doc.restore();

// Borda
doc.roundedRect(1, 1, W-2, H-2, 20).lineWidth(0.8).strokeColor("#00f5ff").opacity(0.15).stroke();

// Logo central
doc.save();
doc.roundedRect(W/2 - 40, 60, 80, 80, 40).fill("#00f5ff").opacity(0.1);
doc.roundedRect(W/2 - 36, 64, 72, 72, 36).fill("#8b5cf6").opacity(0.1);
doc.roundedRect(W/2 - 32, 68, 64, 64, 32).fill("#00f5ff");
doc.font("Helvetica-Bold").fontSize(16).fillColor("#06061a").text("TVS", W/2 - 32, 90, { width: 64, align: "center" });
doc.restore();

// Título
doc.font("Helvetica-Bold").fontSize(28).fillColor("#ffffff").text("VISERON", 0, 155, { width: W, align: "center" });
doc.font("Helvetica").fontSize(11).fillColor("#00f5ff").opacity(0.5).text("SUPERINTELIGENCIA AUTÓNOMA MULTI-AGENTE", 0, 188, { width: W, align: "center" });

// Descripción
doc.font("Helvetica").fontSize(11).fillColor("#999999").text(
  "Sistema operativo de inteligencia artificial para organizaciones autónomas.\nConvierte objetivos en procesos autónomos verificables con seguridad,\ntransparencia y gobernanza bíblica.",
  80, 220, { width: W - 160, align: "center", lineGap: 4 }
);

// Pilares
const pillars = [
  { icon: "10", label: "Agentes V7.0" },
  { icon: "$VSR", label: "Tokens" },
  { icon: "9", label: "Principios" },
  { icon: "E2E", label: "Ejecución" },
  { icon: "RCS", label: "Comunicación" }
];

const pillarStartX = 100;
const pillarGap = 110;

pillars.forEach((p, i) => {
  const px = pillarStartX + i * pillarGap;
  doc.save();
  doc.roundedRect(px, 300, 44, 44, 10).fill("#00f5ff").opacity(0.06);
  doc.roundedRect(px, 300, 44, 44, 10).lineWidth(0.4).strokeColor("#00f5ff").opacity(0.12).stroke();
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#00f5ff").text(p.icon, px, 312, { width: 44, align: "center" });
  doc.restore();
  doc.font("Helvetica").fontSize(7).fillColor("#666688").text(p.label.toUpperCase(), px - 5, 350, { width: 54, align: "center" });
});

// Linha decorativa
doc.moveTo(W/2 - 100, 370).lineTo(W/2 + 100, 370).lineWidth(0.5);
const grad2 = doc.linearGradient(W/2 - 100, 370, W/2 + 100, 370);
grad2.stop(0, "#00f5ff00");
grad2.stop(0.5, "#00f5ff33");
grad2.stop(1, "#8b5cf600");
doc.stroke(grad2);

// Footer
doc.font("Helvetica-Bold").fontSize(9).fillColor("#00f5ff").opacity(0.4).text("WWW.TRINNITYVISERONSYSTEM.IO", 0, 378, { width: W, align: "center" });
doc.font("Helvetica").fontSize(8).fillColor("#444466").text("Pedro Costa · Comandante & CEO · © 2026", 0, 390, { width: W, align: "center" });

// Linha inferior
doc.moveTo(0, H - 3).lineTo(W, H - 3).lineWidth(2);
doc.stroke(grad);

doc.end();
out.on("finish", () => {
  console.log("PDF gerado: data/Viseron_Card_PedroCosta.pdf (2 páginas: frente + verso)");
});
