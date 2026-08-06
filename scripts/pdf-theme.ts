import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export interface CoverOptions {
  title: string;
  subtitle: string;
  badges?: string[];
  date?: string;
  url?: string;
  version?: string;
  brand?: string;
}

export interface ThemeOptions {
  accent?: string;
  accent2?: string;
  ink?: string;
  muted?: string;
  soft?: string;
  background?: string;
  title?: string;
  subject?: string;
}

export interface Theme {
  doc: PDFKit.PDFDocument;
  cover(opts: CoverOptions): void;
  title(text: string, size?: number): void;
  section(n: string, title: string, tagline?: string): void;
  sub(text: string, color?: string): void;
  para(text: string, size?: number, color?: string, opts?: { align?: string }): void;
  bullet(icon: string, text: string, color?: string): void;
  bullets(items: Array<{ icon?: string; text: string; color?: string }>): void;
  kv(k: string, v: string): void;
  code(cmd: string, desc?: string, note?: string): void;
  chip(text: string, color?: string): void;
  rule(): void;
  spacer(n?: number): void;
  ensure(h: number): void;
  page(): number;
  finish(outPath: string): void;
}

export function createTheme(o: ThemeOptions = {}): Theme {
  const accent = o.accent ?? "#22d3ee";
  const accent2 = o.accent2 ?? "#e879f9";
  const ink = o.ink ?? "#0f172a";
  const muted = o.muted ?? "#64748b";
  const soft = o.soft ?? "#f8fafc";
  const background = o.background ?? "#ffffff";

  const doc = new PDFDocument({
    size: "A4",
    margin: 54,
    bufferPages: true,
    info: {
      Title: o.title ?? "Trinnity Viseron System",
      Author: "TVS v5.0 · Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)",
      Subject: o.subject ?? "Trinnity Viseron System — Multi-Agent AI Superintelligence",
      Producer: "TVS PDF Engine",
      Creator: "TVS PDF Engine",
    },
  });

  const W = doc.page.width;
  const PH = doc.page.height;
  const BOTTOM_SAFE = 52;

  let pageNo = 1;
  let isCoverPage = true;
  let inInterior = false;

  const drawInterior = () => {
    if (inInterior) return;
    inInterior = true;
    doc.save();
    const mb = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.rect(0, 0, W, 3).fill("#e2e8f0");
    doc.fillColor(accent).rect(0, 0, 96, 3).fill();
    doc.fillColor(accent2).rect(96, 0, 16, 3).fill();
    doc.fillColor("#94a3b8").font("Helvetica").fontSize(7.5).text(
      "TRINNITY VISERON SYSTEM · TVS v5.0 · www.trinnityviseronsystem.io",
      54, PH - 26, { width: W - 108, align: "left", lineBreak: false }
    );
    doc.fillColor("#94a3b8").font("Helvetica").fontSize(7.5).text(
      `p. ${pageNo - 1}`,
      54, PH - 26, { width: W - 108, align: "right", lineBreak: false }
    );
    doc.page.margins.bottom = mb;
    doc.y = 54;
    doc.restore();
    inInterior = false;
  };

  doc.on("pageAdded", () => {
    pageNo++;
    if (isCoverPage) {
      isCoverPage = false;
      return;
    }
    drawInterior();
  });

  const cover = (opts: CoverOptions) => {
    isCoverPage = true;
    pageNo = 1;
    doc.rect(0, 0, W, PH).fill(background);
    doc.rect(0, 0, W, PH).fill("#020617");

    // grid lines (futuristic)
    doc.save();
    doc.strokeColor("rgba(34,211,238,0.07)").lineWidth(1);
    for (let gx = 0; gx <= W; gx += 60) {
      doc.moveTo(gx, 0).lineTo(gx - PH, PH).stroke();
    }
    for (let gy = 0; gy <= PH; gy += 60) {
      doc.moveTo(0, gy).lineTo(W, gy - 40).stroke();
    }
    doc.restore();

    // top neon band
    const band = doc.linearGradient(0, 0, W, 0);
    band.stop(0, accent).stop(0.5, accent2).stop(1, accent);
    doc.rect(0, 0, W, 8).fill(band);
    doc.rect(0, PH - 8, W, 8).fill(band);

    // brand
    doc.fillColor(accent).font("Helvetica-Bold").fontSize(10)
      .text(opts.brand ?? "TRINNITY VISERON SYSTEM · TVS v5.0", W / 2, 90, { align: "center", width: W - 120 });

    // title (multi-line, sized to fit)
    const lines = opts.title.split("\n");
    const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
    const titleSize = longest > 46 ? 22 : longest > 34 ? 26 : longest > 24 ? 30 : 36;
    const ty = 150;
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(titleSize);
    doc.text(opts.title, W / 2, ty, { align: "center", width: W - 140, lineGap: 8 });
    const titleEnd = doc.y;

    // neon divider
    const div = doc.linearGradient(W / 2 - 110, 0, W / 2 + 110, 0);
    div.stop(0, accent).stop(0.5, accent2).stop(1, accent);
    doc.save();
    doc.rect(W / 2 - 110, titleEnd + 18, 220, 3).fill(div);
    doc.restore();

    // subtitle
    doc.fillColor("#cbd5e1").font("Helvetica").fontSize(13)
      .text(opts.subtitle, W / 2, titleEnd + 36, { align: "center", width: W - 160, lineGap: 4 });
    const subEnd = doc.y;

    // badges (chips, wrap in rows)
    let bx = 54;
    let by = subEnd + 34;
    const rowH = 22;
    if (opts.badges && opts.badges.length) {
      doc.font("Helvetica").fontSize(8.5);
      for (const b of opts.badges) {
        const bw = doc.widthOfString(b) + 20;
        if (bx + bw > W - 54) { bx = 54; by += rowH + 6; }
        doc.save();
        doc.roundedRect(bx, by, bw, rowH - 8, (rowH - 8) / 2).strokeColor("rgba(34,211,238,0.5)").lineWidth(0.8).stroke();
        doc.fillColor("#22d3ee").text(b, bx, by + 3, { width: bw, align: "center", lineBreak: false });
        doc.restore();
        bx += bw + 8;
      }
      by += rowH + 6;
    }

    // footer block on cover
    const fy = PH - 120;
    doc.save();
    doc.roundedRect(W / 2 - 150, fy - 10, 300, 54, 10).strokeColor("rgba(148,163,184,0.25)").lineWidth(0.8).stroke();
    doc.restore();
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10)
      .text(opts.date ? `DATA · ${opts.date}` : new Date().toLocaleDateString("pt-PT").toUpperCase(), W / 2, fy, { align: "center", width: W - 120 });
    doc.fillColor("#94a3b8").font("Helvetica").fontSize(9)
      .text(opts.url ?? "www.trinnityviseronsystem.io", W / 2, fy + 16, { align: "center", width: W - 120 });
    doc.fillColor("#64748b").font("Helvetica").fontSize(8)
      .text(opts.version ? `TVS v${opts.version}` : "TVS v5.0 · Pedro Costa & Trinnity Hurtado", W / 2, fy + 32, { align: "center", width: W - 120 });

    doc.addPage();
  };

  const ensure = (h: number) => {
    if (doc.y + h > PH - BOTTOM_SAFE) doc.addPage();
  };

  const title = (text: string, size = 20) => {
    ensure(60);
    doc.fillColor(ink).font("Helvetica-Bold").fontSize(size).text(text, 54, doc.y, { width: W - 108 });
    doc.fillColor(accent).rect(54, doc.y + 3, 46, 2.5).fill();
    doc.moveDown(1.1);
  };

  const section = (n: string, text: string, tagline?: string) => {
    ensure(74);
    const y0 = doc.y;
    doc.save();
    doc.roundedRect(54, y0, 26, 26, 6).fill(ink);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(12)
      .text(n, 54, y0 + 7, { width: 26, align: "center", lineBreak: false });
    doc.fillColor(ink).font("Helvetica-Bold").fontSize(16.5)
      .text(text, 92, y0 + 5, { width: W - 146, lineBreak: false });
    doc.fillColor(accent).rect(92, y0 + 28, 46, 2).fill();
    doc.fillColor(accent2).rect(138, y0 + 28, 12, 2).fill();
    doc.restore();
    doc.moveDown(1.6);
    if (tagline) para(tagline, 10.5, muted);
  };

  const sub = (text: string, color = ink) => {
    ensure(30);
    doc.fillColor(color).font("Helvetica-Bold").fontSize(12.5).text(text, 54, doc.y, { width: W - 108 });
    doc.moveDown(0.5);
  };

  const para = (text: string, size = 10.5, color = ink, opts?: { align?: string }) => {
    ensure(30);
    doc.fillColor(color).font("Helvetica").fontSize(size)
      .text(text, 54, doc.y, { width: W - 108, lineGap: 3, align: opts?.align as any });
    doc.moveDown(0.35);
  };

  const bullet = (icon: string, text: string, color = ink) => {
    ensure(26);
    const y0 = doc.y;
    doc.fillColor(accent).font("Helvetica-Bold").fontSize(10.5).text(icon, 54, y0, { lineBreak: false });
    doc.fillColor(color).font("Helvetica").fontSize(10.5).text(text, 70, y0, { width: W - 124, lineGap: 3 });
    doc.moveDown(0.4);
  };

  const bullets = (items: Array<{ icon?: string; text: string; color?: string }>) => {
    for (const it of items) bullet(it.icon ?? "▸", it.text, it.color ?? ink);
  };

  const kv = (k: string, v: string) => {
    ensure(24);
    doc.fillColor(ink).font("Helvetica-Bold").fontSize(10).text(k, 54, doc.y, { lineBreak: false });
    doc.fillColor(muted).font("Helvetica").fontSize(10)
      .text("  " + v, 54 + doc.widthOfString(k), doc.y - 0, { width: W - 108 - doc.widthOfString(k) });
    doc.moveDown(0.5);
  };

  const code = (cmd: string, desc?: string, note?: string) => {
    const h = 46 + (desc ? 18 : 0) + (note ? 14 : 0);
    ensure(h);
    const y0 = doc.y;
    const cw = W - 108;
    doc.save();
    doc.roundedRect(54, y0, cw, h - 8, 6).fill("#0f172a");
    doc.fillColor(accent).font("Helvetica-Bold").fontSize(9.5)
      .text(cmd, 64, y0 + 8, { width: cw - 20, lineBreak: false });
    if (desc) {
      doc.fillColor("#cbd5e1").font("Helvetica").fontSize(8.5)
        .text(desc, 64, y0 + 24, { width: cw - 20 });
    }
    if (note) {
      doc.fillColor("#94a3b8").font("Helvetica-Oblique").fontSize(8)
        .text(note, 64, y0 + 24 + (desc ? 14 : 0), { width: cw - 20 });
    }
    doc.restore();
    doc.y = y0 + h;
  };

  const chip = (text: string, color = accent) => {
    const cw = doc.widthOfString(text) + 18;
    const y0 = doc.y;
    doc.save();
    doc.roundedRect(54, y0, cw, 18, 9).fill("#f1f5f9");
    doc.fillColor(color).font("Helvetica-Bold").fontSize(8.5)
      .text(text, 54, y0 + 5, { width: cw, align: "center", lineBreak: false });
    doc.restore();
    doc.y = y0 + 22;
  };

  const rule = () => {
    ensure(20);
    doc.save();
    doc.fillColor("#e2e8f0").rect(54, doc.y, W - 108, 1).fill();
    doc.restore();
    doc.moveDown(1);
  };

  const spacer = (n = 1) => doc.moveDown(n);

  const page = () => pageNo - (isCoverPage ? 1 : 0);

  const finish = (outPath: string) => {
    const abs = path.resolve(outPath);
    if (!fs.existsSync(path.dirname(abs))) fs.mkdirSync(path.dirname(abs), { recursive: true });
    doc.pipe(fs.createWriteStream(abs));
    doc.end();
  };

  return { doc, cover, title, section, sub, para, bullet, bullets, kv, code, chip, rule, spacer, ensure, page, finish };
}

export function wordWrap(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length <= max) cur = (cur + " " + w).trim();
    else { if (cur) out.push(cur); cur = w; }
  }
  if (cur) out.push(cur);
  return out;
}
