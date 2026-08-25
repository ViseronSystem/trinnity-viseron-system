import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { deflateSync } from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function crc32(buf) {
  let crc = 0xffffffff;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function makePNG(width, height, pixels) {
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = y * (stride + 1) + 1 + x * 4;
      raw[dst] = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
    }
  }
  const deflated = deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  function ck(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const tb = Buffer.from(type, "ascii");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([tb, data])));
    return Buffer.concat([len, tb, data, crc]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([sig, ck("IHDR", ihdr), ck("IDAT", deflated), ck("IEND", Buffer.alloc(0))]);
}

function makeIconPixels(size) {
  const pixels = new Uint8Array(size * size * 4);
  const cx = size / 2, cy = size / 2, r = size * 0.44;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const t = Math.min(dist / (size * 0.5), 1);
      pixels[i] = Math.round(10 + t * 5);
      pixels[i+1] = Math.round(10 + t * 15);
      pixels[i+2] = Math.round(46 + t * 5);
      pixels[i+3] = 255;
    }
  }

  // Draw "TVS" text
  const letters = {
    T: [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
    V: [[1,0,1],[1,0,1],[1,0,1],[0,1,0],[0,1,0]],
    S: [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  };

  const scale = Math.max(2, Math.floor(size / 36));
  const spacing = Math.floor(scale * 3.5);
  const totalW = 3 * spacing + 6 * scale;
  const startX = Math.floor((size - totalW) / 2);
  const startY = Math.floor((size - 5 * scale) / 2);

  let ox = startX;
  for (const ch of ["T", "V", "S"]) {
    const grid = letters[ch];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        if (!grid[row][col]) continue;
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = ox + col * scale + sx;
            const py = startY + row * scale + sy;
            if (px >= 0 && px < size && py >= 0 && py < size) {
              const idx = (py * size + px) * 4;
              const isEdge = (row === 0 || row === 4 || col === 0 || col === 2);
              if (isEdge) {
                pixels[idx] = 0; pixels[idx+1] = 200; pixels[idx+2] = 255; pixels[idx+3] = 200;
              } else {
                pixels[idx] = 0; pixels[idx+1] = 255; pixels[idx+2] = 136; pixels[idx+3] = 255;
              }
            }
          }
        }
      }
    }
    ox += 3 * scale + spacing;
  }

  return pixels;
}

console.log("Generating icons...");

const size = 256;
const pixels = makeIconPixels(size);
const png = makePNG(size, size, pixels);

// Write PNGs
for (const dir of [join(ROOT, "electron", "assets"), join(ROOT, "mobile", "assets")]) {
  writeFileSync(join(dir, "icon.png"), png);
  console.log(`  Wrote ${join(dir, "icon.png")} (${png.length} bytes)`);
}

// Convert to ICO for Electron
try {
  const { default: pngToIco } = await import("png-to-ico");
  const icoBuf = await pngToIco(png);
  writeFileSync(join(ROOT, "electron", "assets", "icon.ico"), icoBuf);
  console.log(`  Wrote icon.ico (${icoBuf.length} bytes)`);
} catch (e) {
  console.log("  ICO conversion failed:", e.message);
}
