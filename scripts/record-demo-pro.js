const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE = path.join(__dirname, '..', 'data', 'hackathon');
const FRAMES_DIR = path.join(BASE, 'frames');
const DEMO_URL = 'file:///' + path.join(BASE, 'demo-pro.html').replace(/\\/g, '/');
const OUTPUT = path.join(BASE, 'tvs-hackathon-demo.mp4');
const FFMPEG = 'C:\\Users\\Administrator\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';

const FPS = 30;
const DURATION = 46; // seconds (45s content + 1s buffer)
const TOTAL_FRAMES = FPS * DURATION;
const WIDTH = 1920;
const HEIGHT = 1080;

async function record() {
  if (fs.existsSync(FRAMES_DIR)) fs.rmSync(FRAMES_DIR, { recursive: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--font-render-hinting=none']
  });

  const page = await browser.newPage();
  console.log('Loading demo...');
  await page.goto(DEMO_URL, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 500));

  console.log(`Recording ${TOTAL_FRAMES} frames (${DURATION}s at ${FPS}fps)...`);
  const startTime = Date.now();

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const framePath = path.join(FRAMES_DIR, `frame_${String(i).padStart(5, '0')}.png`);
    await page.screenshot({ path: framePath, type: 'png' });
    if (i % (FPS * 2) === 0 || i === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Frame ${i}/${TOTAL_FRAMES} (${elapsed}s elapsed)`);
    }
  }

  await browser.close();
  console.log(`Captured ${TOTAL_FRAMES} frames. Encoding...`);

  execSync(`"${FFMPEG}" -y -framerate ${FPS} -i "${path.join(FRAMES_DIR, 'frame_%05d.png')}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 18 -s ${WIDTH}x${HEIGHT} "${OUTPUT}"`, { stdio: 'inherit' });

  const size = (fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(1);
  console.log(`\nVideo: ${OUTPUT} (${size}MB)`);
}

record().catch(e => { console.error(e); process.exit(1); });
