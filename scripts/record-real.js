const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const BASE = path.join(__dirname, '..', 'data', 'hackathon');
const FRAMES = path.join(BASE, 'frames-real');
const FFMPEG = 'C:\\Users\\Administrator\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';
const FPS = 30;
const W = 1920, H = 1080;

// Each scene: { url, wait, duration(s), caption }
const SCENES = [
  { url: 'http://localhost:32123/', wait: 4000, dur: 5, cap: 'Trinnity Viseron System v7.0 — Sistema Operativo de IA Autónoma' },
  { url: 'http://localhost:32123/api/health', wait: 3000, dur: 4, cap: 'API Health Check — Sistema operacional, Postgres conectado, facturación Avirato' },
  { url: 'http://localhost:32123/api/status', wait: 3000, dur: 5, cap: 'System of Truth — 5992 tareas ejecutadas, 374 tests pasando, TypeScript limpio' },
  { url: 'http://localhost:32123/api/viseron/status', wait: 3000, dur: 5, cap: 'VISERON — Superinteligencia activa, gobernanza bíblica con 9 principios' },
  { url: 'http://localhost:32123/api/omega/tasks', wait: 3000, dur: 4, cap: 'OMEGA Kernel — 5884 tareas verificadas, pipeline de ejecución E2E' },
  { url: 'http://localhost:32123/api/ai/status', wait: 3000, dur: 4, cap: 'IA Router — Gemini 3.6 Flash, Ollama local, OpenAI, Claude, Grok' },
  { url: 'http://localhost:32123/api/tutor/status', wait: 3000, dur: 4, cap: 'ATLAS — Tutor de inglés personalizado con voz y plan de 7 días' },
  { url: 'http://localhost:32123/api/rcs/status', wait: 3000, dur: 4, cap: 'RCS — Canal de mensajería de marca con Twilio' },
  { url: 'http://localhost:32123/api/agency/status', wait: 3000, dur: 4, cap: 'Agency OS — 4 agentes de IA para marketing digital' },
  { url: 'http://localhost:32123/api/composio/status', wait: 3000, dur: 4, cap: 'Composio — Integración con 19 apps externas (Gmail, Slack, GitHub...)' },
  { url: 'http://localhost:32123/api/viseron/governance', wait: 3000, dur: 5, cap: 'Gobernanza Bíblica — 9 principios éticos como código ejecutable' },
  { url: 'http://localhost:32123/', wait: 4000, dur: 5, cap: 'Trinnity Viseron System — Construido por Pedro Costa y Trinnity Hurtado' },
];

async function main() {
  if (fs.existsSync(FRAMES)) fs.rmSync(FRAMES, { recursive: true });
  fs.mkdirSync(FRAMES, { recursive: true });

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  // Dark background for JSON pages
  await page.evaluateOnNewDocument(() => {
    document.documentElement.style.background = '#0a0e14';
    document.body.style.background = '#0a0e14';
    document.body.style.color = '#e6edf3';
    document.body.style.fontFamily = "'Cascadia Code', 'Fira Code', 'Consolas', monospace";
    document.body.style.padding = '40px';
    document.body.style.fontSize = '16px';
    document.body.style.lineHeight = '1.8';
    // Style JSON output
    const style = document.createElement('style');
    style.textContent = `pre{white-space:pre-wrap;word-break:break-all;color:#7ee787;font-size:15px;margin:0}`;
    document.head.appendChild(style);
  });

  let frameIdx = 0;
  const totalFramesPerScene = (s) => FPS * s.dur;

  console.log(`Recording ${SCENES.length} scenes...`);

  for (const scene of SCENES) {
    console.log(`\nScene: ${scene.cap}`);
    console.log(`  URL: ${scene.url}`);

    try {
      await page.goto(scene.url, { waitUntil: 'networkidle0', timeout: 10000 });
    } catch {
      try { await page.goto(scene.url, { waitUntil: 'load', timeout: 8000 }); } catch {}
    }
    await new Promise(r => setTimeout(r, scene.wait));

    // Add caption overlay
    await page.evaluate((caption) => {
      const existing = document.getElementById('tvs-caption');
      if (existing) existing.remove();
      const div = document.createElement('div');
      div.id = 'tvs-caption';
      div.style.cssText = 'position:fixed;bottom:40px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#00f5d4;padding:12px 28px;border-radius:8px;font-size:15px;font-family:Inter,system-ui,sans-serif;z-index:9999;white-space:nowrap;border:1px solid rgba(0,245,212,0.3);backdrop-filter:blur(10px);letter-spacing:0.5px;';
      div.textContent = caption;
      document.body.appendChild(div);
    }, scene.cap);

    // Add TVS watermark
    await page.evaluate(() => {
      if (document.getElementById('tvs-watermark')) return;
      const wm = document.createElement('div');
      wm.id = 'tvs-watermark';
      wm.style.cssText = 'position:fixed;top:20px;right:30px;color:rgba(0,245,212,0.4);font-size:13px;font-family:Inter,system-ui,sans-serif;z-index:9999;letter-spacing:2px;';
      wm.textContent = 'TRINNITY VISERON SYSTEM v7.0';
      document.body.appendChild(wm);
    });

    const frames = totalFramesPerScene(scene);
    for (let i = 0; i < frames; i++) {
      const fname = path.join(FRAMES, `f_${String(frameIdx).padStart(6, '0')}.png`);
      await page.screenshot({ path: fname, type: 'png' });
      frameIdx++;
    }
    console.log(`  Captured ${frames} frames`);
  }

  await browser.close();
  console.log(`\nTotal frames: ${frameIdx}`);
  console.log(`Encoding video...`);

  execSync(`"${FFMPEG}" -y -framerate ${FPS} -i "${path.join(FRAMES, 'f_%06d.png')}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 20 -s ${W}x${H} "${path.join(BASE, 'tvs-real-video.mp4')}"`, { stdio: 'inherit' });

  const size = (fs.statSync(path.join(BASE, 'tvs-real-video.mp4')).size / 1024 / 1024).toFixed(1);
  console.log(`\nVideo: tvs-real-video.mp4 (${size}MB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
