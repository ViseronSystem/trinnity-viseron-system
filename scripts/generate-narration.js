const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '..', 'data', 'hackathon', 'audio');
const OUTPUT_AUDIO = path.join(__dirname, '..', 'data', 'hackathon', 'narration.mp3');

// Narration script - each line is a section with timing
const SCRIPT = [
  { start: 0, text: "Welcome to the Trinnity Viseron System. A multi-agent AI operating system built for the All Things Agentic Hackathon." },
  { start: 4, text: "Enterprise agent frameworks today force a choice. Deploy individual agents with no shared infrastructure, or build custom orchestration from scratch. Neither option works." },
  { start: 8, text: "TVS solves this with the OMEGA Kernel. A custom runtime with event bus, task queue, permissions, and verification. Ten autonomous agents coordinate through wildcard topic routing." },
  { start: 13, text: "Ten agents, each with distinct roles. CEO for strategy, CTO for architecture, Developer for code, Finance for analysis, and six more. Each runs on an autonomous cycle every eighty-six seconds." },
  { start: 18, text: "Tasks flow through a nine-state pipeline. Created, planning, queued, running, verifying, completed. Every task is verified before promotion. The EventBus fires events in real time." },
  { start: 23, text: "Four-layer memory that survives restarts. Short-term memory for sessions, long-term memory with persistent storage, knowledge base with search, and vector embeddings for semantic retrieval." },
  { start: 27, text: "Nine ethical principles enforced as code. Wisdom, truth, stewardship, justice, service, diligence, humility, generosity, and faithfulness. The system cannot lie, leak data, or commit fraud." },
  { start: 30, text: "The VAEC evolution pipeline ensures safe promotion. Implement, test, sync, build, verify, promote. Any failure triggers automatic rollback." },
  { start: 33, text: "Trinnity Viseron System. AI Operating System for Autonomous Organizations. Built by Pedro Costa and Trinnity Hurtado." }
];

if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

// Generate each segment using edge-tts
async function generateAudio() {
  console.log('Generating narration audio...');
  
  const segments = [];
  
  for (let i = 0; i < SCRIPT.length; i++) {
    const seg = SCRIPT[i];
    const outFile = path.join(AUDIO_DIR, `seg_${String(i).padStart(2, '0')}.mp3`);
    const txtFile = path.join(AUDIO_DIR, `seg_${String(i).padStart(2, '0')}.txt`);
    
    fs.writeFileSync(txtFile, seg.text);
    
    console.log(`  Segment ${i + 1}/${SCRIPT.length}: "${seg.text.substring(0, 50)}..."`);
    
    try {
      execSync(`npx edge-tts --voice "en-US-GuyNeural" --rate="-5%" --file "${txtFile}" --write-media "${outFile}"`, {
        timeout: 30000,
        stdio: 'pipe'
      });
      segments.push({ file: outFile, start: seg.start });
    } catch (e) {
      console.error(`  Failed segment ${i}: ${e.message.substring(0, 100)}`);
    }
  }
  
  // Get durations of each segment
  console.log('Measuring segment durations...');
  const segInfo = segments.map(s => {
    try {
      const probe = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${s.file}"`, { encoding: 'utf-8' });
      const duration = parseFloat(probe.trim());
      return { ...s, duration };
    } catch {
      return { ...s, duration: 3 };
    }
  });
  
  // Build ffmpeg filter for padding and concatenation
  console.log('Building audio timeline...');
  
  // Create silence padded segments
  const paddedFiles = [];
  for (let i = 0; i < segInfo.length; i++) {
    const seg = segInfo[i];
    const paddedFile = path.join(AUDIO_DIR, `padded_${String(i).padStart(2, '0')}.mp3`);
    
    // Calculate silence needed before this segment
    let silenceBefore = 0;
    if (i === 0) {
      silenceBefore = seg.start; // Initial delay
    } else {
      silenceBefore = seg.start - segInfo[i-1].start - segInfo[i-1].duration;
      if (silenceBefore < 0) silenceBefore = 0;
    }
    
    try {
      // Add silence before the segment
      const filter = `anullsrc=r=44100:cl=mono,atrim=duration=${silenceBefore}[silence];[0:a][silence]concat=n=2:v=0:a=1`;
      execSync(`ffmpeg -y -i "${seg.file}" -f lavfi -i anullsrc=r=44100:cl=mono -filter_complex "[1:a]atrim=duration=${silenceBefore}[silence];[0:a][silence]concat=n=2:v=0:a=1[out]" -map "[out]" "${paddedFile}"`, {
        timeout: 10000,
        stdio: 'pipe'
      });
      paddedFiles.push(paddedFile);
    } catch (e) {
      console.error(`  Failed padding segment ${i}: ${e.message.substring(0, 100)}`);
      paddedFiles.push(seg.file);
    }
  }
  
  // Create concat list
  const concatList = path.join(AUDIO_DIR, 'concat.txt');
  paddedFiles.forEach(f => {
    fs.appendFileSync(concatList, `file '${f.replace(/\\/g, '/')}'\n`);
  });
  
  // Concatenate all segments
  console.log('Concatenating audio...');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c:a libmp3lame -b:a 192k "${OUTPUT_AUDIO}"`, {
    timeout: 30000,
    stdio: 'pipe'
  });
  
  // Get final duration
  const finalDuration = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${OUTPUT_AUDIO}"`, { encoding: 'utf-8' });
  console.log(`\nNarration created: ${OUTPUT_AUDIO}`);
  console.log(`Duration: ${parseFloat(finalDuration.trim()).toFixed(1)}s`);
  
  // Cleanup temp files
  fs.readdirSync(AUDIO_DIR).forEach(f => {
    if (f !== 'narration.mp3') fs.unlinkSync(path.join(AUDIO_DIR, f));
  });
  
  return OUTPUT_AUDIO;
}

generateAudio().catch(e => {
  console.error('Audio generation failed:', e.message);
  process.exit(1);
});
