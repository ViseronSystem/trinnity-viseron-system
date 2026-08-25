#!/usr/bin/env node
// Viseron Cosmos — Gera os logos oficiais dos tokens (VSR · TRIN) em PNG 512×512.
// © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SIZE = 512;

// ── PNG encoder puro (RGB8) ──────────────────────────────────────────
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(rgba, w, h) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Matemática ───────────────────────────────────────────────────────
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (d) => clamp(0.5 - d, 0, 1); // d em px (negativo = dentro)
function inPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function lerp(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * clamp(t, 0, 1)));
}
function mix(c1, c2, t) {
  const a = lerp(c1, c2, t);
  return `rgba(${a[0]},${a[1]},${a[2]},1)`;
}

// ── Render (canvas software simples) ─────────────────────────────────
function canvas(bg1, bg2) {
  const px = Buffer.alloc(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cx = SIZE / 2, cy = SIZE / 2;
      const d = Math.hypot(x - cx, y - cy);
      const t = clamp((y + (x - SIZE / 2) * 0.6) / SIZE, 0, 1);
      const col = lerp(bg1, bg2, t);
      const a = smooth((d - SIZE * 0.5) * 1.2); // círculo de fundo
      const i = (y * SIZE + x) * 4;
      px[i] = Math.round(col[0] * a + 0);
      px[i + 1] = Math.round(col[1] * a + 0);
      px[i + 2] = Math.round(col[2] * a + 0);
      px[i + 3] = Math.round(a * 255);
    }
  }
  return px;
}
function disc(px, cx, cy, r, color) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const a = smooth(Math.hypot(x - cx, y - cy) - r);
      if (a <= 0) continue;
      const i = (y * SIZE + x) * 4;
      const src = color[0] * a, g = color[1] * a, b = color[2] * a, aa = 255 * a;
      px[i] = Math.round(px[i] * (1 - a) + src);
      px[i + 1] = Math.round(px[i + 1] * (1 - a) + g);
      px[i + 2] = Math.round(px[i + 2] * (1 - a) + b);
      px[i + 3] = Math.round(px[i + 3] * (1 - a) + aa);
    }
  }
}
function poly(px, pts, color) {
  const minX = Math.max(0, Math.floor(Math.min(...pts.map((p) => p[0])) - 2));
  const maxX = Math.min(SIZE - 1, Math.ceil(Math.max(...pts.map((p) => p[0])) + 2));
  const minY = Math.max(0, Math.floor(Math.min(...pts.map((p) => p[1])) - 2));
  const maxY = Math.min(SIZE - 1, Math.ceil(Math.max(...pts.map((p) => p[1])) + 2));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (!inPoly(x + 0.5, y + 0.5, pts)) continue;
      const i = (y * SIZE + x) * 4;
      px[i] = color[0];
      px[i + 1] = color[1];
      px[i + 2] = color[2];
      px[i + 3] = 255;
    }
  }
}
function ring(px, cx, cy, rIn, rOut, color) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const a = smooth(d - rIn) * smooth(rOut - d);
      if (a <= 0) continue;
      const i = (y * SIZE + x) * 4;
      px[i] = Math.round(px[i] * (1 - a) + color[0] * a);
      px[i + 1] = Math.round(px[i + 1] * (1 - a) + color[1] * a);
      px[i + 2] = Math.round(px[i + 2] * (1 - a) + color[2] * a);
      px[i + 3] = 255;
    }
  }
}
function stars(px, color, n) {
  let seed = 42;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let s = 0; s < n; s++) {
    const sx = SIZE * (0.08 + rnd() * 0.84);
    const sy = SIZE * (0.08 + rnd() * 0.84);
    const r = 1 + rnd() * 2.2;
    const cx = Math.max(sx - 1.2, 0);
    const cy = Math.max(sy - 1.2, 0);
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const ix = Math.floor(cx + x), iy = Math.floor(cy + y);
        if (ix < 0 || ix >= SIZE || iy < 0 || iy >= SIZE) continue;
        const a = smooth(Math.hypot(ix + 0.5 - sx, iy + 0.5 - sy) - r);
        if (a <= 0) continue;
        const i = (iy * SIZE + ix) * 4;
        px[i] = Math.round(px[i] * (1 - a) + color[0] * a);
        px[i + 1] = Math.round(px[i + 1] * (1 - a) + color[1] * a);
        px[i + 2] = Math.round(px[i + 2] * (1 - a) + color[2] * a);
      }
    }
  }
}

// ── VSR — coroa dourada sobre disco violeta ──────────────────────────
function renderVSR() {
  const px = canvas([124, 58, 237], [46, 16, 101]); // violeta #7c3aed → #2e1065
  stars(px, [255, 255, 255], 40);

  const cx = SIZE / 2, cy = SIZE / 2;
  const gold = [255, 201, 61]; // #ffc93d
  const goldDark = [214, 158, 46];
  const goldLight = [255, 236, 160];

  // anel dourado exterior
  ring(px, cx, cy, SIZE * 0.34, SIZE * 0.345, gold);

  // base da coroa (banda)
  const band = SIZE * 0.085;
  poly(px, [
    [cx - SIZE * 0.21, cy + SIZE * 0.20],
    [cx + SIZE * 0.21, cy + SIZE * 0.20],
    [cx + SIZE * 0.21, cy + SIZE * 0.12],
    [cx - SIZE * 0.21, cy + SIZE * 0.12],
  ], goldDark);

  // pontas da coroa
  const spikeH = SIZE * 0.13;
  for (const dx of [-0.18, 0, 0.18]) {
    const bx = cx + dx * SIZE;
    poly(px, [
      [bx - SIZE * 0.05, cy + SIZE * 0.12],
      [bx + SIZE * 0.05, cy + SIZE * 0.12],
      [bx + SIZE * 0.02, cy - spikeH],
      [bx, cy - spikeH - SIZE * 0.03],
      [bx - SIZE * 0.02, cy - spikeH],
    ], gold);
  }

  // bolinhas douradas nas pontas
  for (const dx of [-0.18, 0, 0.18]) {
    disc(px, cx + dx * SIZE, cy - spikeH - SIZE * 0.04, SIZE * 0.028, goldLight);
  }
  // gemas na banda
  for (const dx of [-0.10, 0, 0.10]) {
    disc(px, cx + dx * SIZE, cy + SIZE * 0.16, SIZE * 0.018, [190, 24, 93]);
  }

  return px;
}

// ── TRIN — planeta rosa com anel (moeda de viagem) ───────────────────
function renderTRIN() {
  const px = canvas([244, 63, 94], [88, 28, 135]); // rosa #f43f5e → púrpura #581c87
  stars(px, [255, 255, 255], 50);

  const cx = SIZE / 2, cy = SIZE * 0.52;
  const planet = [255, 150, 165];
  const planetDark = [225, 29, 72];
  const ringC = [255, 209, 102];

  // planeta (corpo)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (x - cx) / SIZE, dy = (y - cy) / SIZE;
      const d = Math.hypot(dx * SIZE, dy * SIZE);
      const r = SIZE * 0.21;
      const a = smooth(d - r);
      if (a <= 0) continue;
      const i = (y * SIZE + x) * 4;
      const shade = 1 - (dy * 0.45 + 0.1);
      const col = lerp(planetDark, planet, shade);
      px[i] = Math.round(px[i] * (1 - a) + col[0] * a);
      px[i + 1] = Math.round(px[i + 1] * (1 - a) + col[1] * a);
      px[i + 2] = Math.round(px[i + 2] * (1 - a) + col[2] * a);
      px[i + 3] = 255;
    }
  }

  // anel (elipse)
  const rxOut = SIZE * 0.30, ryOut = SIZE * 0.11;
  const rxIn = SIZE * 0.235, ryIn = SIZE * 0.082;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const nx = x - cx, ny = y - cy;
      const a = smooth(Math.hypot(nx / rxOut, ny / ryOut) - 1) *
                smooth(1 - Math.hypot(nx / rxIn, ny / ryIn));
      if (a <= 0) continue;
      const i = (y * SIZE + x) * 4;
      px[i] = Math.round(px[i] * (1 - a) + ringC[0] * a);
      px[i + 1] = Math.round(px[i + 1] * (1 - a) + ringC[1] * a);
      px[i + 2] = Math.round(px[i + 2] * (1 - a) + ringC[2] * a);
      px[i + 3] = 255;
    }
  }

  // órbita pequena (lua) — ponto branco
  disc(px, cx - SIZE * 0.26, cy - SIZE * 0.20, SIZE * 0.018, [255, 255, 255]);

  return px;
}

// ── Gravar ───────────────────────────────────────────────────────────
const targets = [
  path.join(ROOT, "src", "dashboard", "public", "cosmos", "img", "vsr.png"),
  path.join(ROOT, "trinnityviseronsystem.io", "cosmos", "img", "vsr.png"),
  path.join(ROOT, "src", "dashboard", "public", "cosmos", "img", "trin.png"),
  path.join(ROOT, "trinnityviseronsystem.io", "cosmos", "img", "trin.png"),
];

const vsr = encodePNG(renderVSR(), SIZE, SIZE);
const trin = encodePNG(renderTRIN(), SIZE, SIZE);

for (const [i, t] of targets.entries()) {
  fs.mkdirSync(path.dirname(t), { recursive: true });
  fs.writeFileSync(t, i < 2 ? vsr : trin);
  console.log(`✅ Logo gerado: ${path.relative(ROOT, t)} (${(i < 2 ? vsr : trin).length} bytes)`);
}
console.log("\n© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) — logos oficiais $VSR/$TRIN");
