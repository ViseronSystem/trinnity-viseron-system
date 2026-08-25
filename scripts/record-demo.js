const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEMO_PATH = path.join(__dirname, '..', 'data', 'hackathon', 'demo.html');
const FRAMES_DIR = path.join(__dirname, '..', 'data', 'hackathon', 'frames');
const OUTPUT = path.join(__dirname, '..', 'data', 'hackathon', 'tvs-hackathon-demo.mp4');
const FPS = 30;
const DURATION = 32; // seconds
const WIDTH = 1920;
const HEIGHT = 1080;

(async () => {
  console.log('Starting TVS demo recording...');
  
  // Clean/create frames dir
  if (fs.existsSync(FRAMES_DIR)) fs.rmSync(FRAMES_DIR, { recursive: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: [`--window-size=${WIDTH},${HEIGHT}`, '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });
  
  // Load demo page
  await page.goto(`file:///${DEMO_PATH.replace(/\\/g, '/')}`, { waitUntil: 'load' });
  console.log('Demo loaded, recording frames...');
  
  const totalFrames = FPS * DURATION;
  const startTime = Date.now();
  
  for (let i = 0; i < totalFrames; i++) {
    const frameNum = String(i).padStart(5, '0');
    await page.screenshot({
      path: path.join(FRAMES_DIR, `frame_${frameNum}.png`),
      type: 'png'
    });
    
    if (i % FPS === 0) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      console.log(`Frame ${i}/${totalFrames} (${elapsed}s elapsed)`);
    }
    
    // Wait for next frame
    await new Promise(r => setTimeout(r, 1000 / FPS));
  }
  
  await browser.close();
  console.log(`Captured ${totalFrames} frames. Encoding video...`);
  
  // Encode with ffmpeg
  const ffmpegCmd = `ffmpeg -y -framerate ${FPS} -i "${path.join(FRAMES_DIR, 'frame_%05d.png')}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 18 -s ${WIDTH}x${HEIGHT} "${OUTPUT}"`;
  
  console.log('Running:', ffmpegCmd);
  execSync(ffmpegCmd, { stdio: 'inherit' });
  
  // Cleanup frames
  fs.rmSync(FRAMES_DIR, { recursive: true });
  
  const stats = fs.statSync(OUTPUT);
  console.log(`\nVideo created: ${OUTPUT}`);
  console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
  console.log('Ready for Devpost submission!');
})();
