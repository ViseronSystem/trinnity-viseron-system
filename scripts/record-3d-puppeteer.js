const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const BASE = path.join(__dirname, '..', 'data', 'hackathon');
const FRAMES = path.join(BASE, 'frames3d');
const DEMO = 'file:///' + path.join(BASE, 'demo-3d.html').replace(/\\/g, '/');
const OUTPUT = path.join(BASE, 'tvs-demo-3d.mp4');
const FFMPEG = 'C:\\Users\\Administrator\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';

const FPS = 30;
const DURATION = 50;
const TOTAL = FPS * DURATION;

async function main() {
  if (fs.existsSync(FRAMES)) fs.rmSync(FRAMES, { recursive: true });
  fs.mkdirSync(FRAMES, { recursive: true });

  console.log('Launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--font-render-hinting=none']
  });

  const page = await browser.newPage();
  console.log('Loading 3D demo...');
  await page.goto(DEMO, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000)); // wait for Three.js init

  console.log(`Recording ${TOTAL} frames (${DURATION}s at ${FPS}fps)...`);
  const t0 = Date.now();

  for (let i = 0; i < TOTAL; i++) {
    await page.screenshot({ path: path.join(FRAMES, `f_${String(i).padStart(5,'0')}.png`), type: 'png' });
    if (i % (FPS*3) === 0 || i === TOTAL-1) {
      console.log(`  Frame ${i}/${TOTAL} (${((Date.now()-t0)/1000).toFixed(1)}s)`);
    }
  }

  await browser.close();
  console.log('Encoding video...');

  execSync(`"${FFMPEG}" -y -framerate ${FPS} -i "${path.join(FRAMES, 'f_%05d.png')}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 18 -s 1920x1080 "${OUTPUT}"`, { stdio: 'inherit' });

  const size = (fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(1);
  console.log(`\nVideo: ${OUTPUT} (${size}MB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
