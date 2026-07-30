(function () {
  if (window.__voiceWidgetLoaded) return;
  window.__voiceWidgetLoaded = true;

  const CONFIG = {
    backendUrl: 'http://localhost:3000',
    socketUrl: 'http://localhost:3000',
    speakerName: 'Visitante'
  };

  if (window.__voiceConfig) Object.assign(CONFIG, window.__voiceConfig);

  let recognition = null;
  let isListening = false;
  let isSpeaking = false;
  let socket = null;
  let currentSpeaker = 'pedro';

  function log(msg) { if (window.voiceLog) window.voiceLog(msg); }

  function getVoices() {
    return new Promise((resolve) => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) { resolve(v); return; }
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
      setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500);
    });
  }

  function findVoice(voices, name, lang) {
    return voices.find(v => v.name.includes(name) && v.lang.startsWith(lang || 'pt'))
      || voices.find(v => v.lang.startsWith(lang || 'pt'))
      || voices.find(v => v.name.includes(name))
      || voices[0];
  }

  async function speak(text, voiceType) {
    return new Promise(async (resolve) => {
      if (isSpeaking) { window.speechSynthesis.cancel(); }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9 + Math.random() * 0.1;
      utterance.pitch = voiceType === 'pedro' ? 0.7 + Math.random() * 0.1 : 1.2 + Math.random() * 0.1;
      utterance.volume = 1;
      const voices = await getVoices();
      if (voiceType === 'pedro') {
        utterance.voice = findVoice(voices, 'David', 'en') || findVoice(voices, 'Microsoft', 'pt');
      } else {
        utterance.voice = findVoice(voices, 'Zira', 'en') || findVoice(voices, 'Maria', 'pt') || findVoice(voices, 'Microsoft', 'pt');
      }
      isSpeaking = true;
      utterance.onend = () => { isSpeaking = false; resolve(); };
      utterance.onerror = () => { isSpeaking = false; resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }

  function startListening() {
    if (isListening) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { log('Speech recognition nao suportado'); return; }
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const finalText = transcript.trim();
          if (finalText) {
            log('Voce: ' + finalText);
            sendCommand(finalText, currentSpeaker);
          }
        }
      }
      const interim = document.getElementById('voice-interim');
      if (interim) interim.textContent = transcript;
    };

    recognition.onerror = (event) => {
      log('Erro: ' + event.error);
      isListening = false;
      updateMicButton(false);
    };

    recognition.onend = () => {
      isListening = false;
      updateMicButton(false);
    };

    try {
      recognition.start();
      isListening = true;
      updateMicButton(true);
      log('Microfone ativo...');
    } catch (e) {
      log('Erro ao iniciar microfone');
    }
  }

  function stopListening() {
    if (recognition && isListening) {
      try { recognition.stop(); } catch (e) {}
      isListening = false;
      updateMicButton(false);
    }
  }

  function toggleListening() {
    if (isListening) { stopListening(); } else { startListening(); }
  }

  function updateMicButton(active) {
    const btn = document.getElementById('voice-mic-btn');
    if (!btn) return;
    btn.className = active
      ? 'voice-mic-btn voice-listening'
      : 'voice-mic-btn';
    const icon = btn.querySelector('.voice-mic-icon');
    if (icon) icon.textContent = active ? '■' : '🎤';
    const label = btn.querySelector('.voice-mic-label');
    if (label) label.textContent = active ? 'Ouvindo...' : 'Falar';
  }

  function setSpeaker(person) {
    currentSpeaker = person;
    const btnPedro = document.getElementById('voice-speaker-pedro');
    const btnTrinnity = document.getElementById('voice-speaker-trinnity');
    if (btnPedro) btnPedro.className = person === 'pedro' ? 'voice-speaker-btn active' : 'voice-speaker-btn';
    if (btnTrinnity) btnTrinnity.className = person === 'trinnity' ? 'voice-speaker-btn active' : 'voice-speaker-btn';
  }

  async function sendCommand(text, speaker) {
    const transcriptBox = document.getElementById('voice-transcripts');
    if (transcriptBox) {
      const line = document.createElement('div');
      line.className = 'voice-line voice-user';
      line.innerHTML = `<span class="voice-speaker-tag ${speaker}">${speaker === 'pedro' ? '⚔️ Pedro' : '👑 Trinnity'}</span> ${text}`;
      transcriptBox.appendChild(line);
      transcriptBox.scrollTop = transcriptBox.scrollHeight;
    }
    if (speaker === 'pedro') {
      document.getElementById('voice-status').textContent = 'Pedro: processando...';
    } else {
      document.getElementById('voice-status').textContent = 'Trinnity: processando...';
    }

    if (socket && socket.connected) {
      socket.emit('voice:command', { text, speaker, timestamp: Date.now() });
    } else {
      try {
        const resp = await fetch(CONFIG.backendUrl + '/api/voice/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, speaker, timestamp: Date.now() })
        });
        const data = await resp.json();
        handleResponse(data);
      } catch (err) {
        handleLocalResponse(text, speaker);
      }
    }
  }

  function handleResponse(data) {
    if (!data || !data.text) return;
    const transcriptBox = document.getElementById('voice-transcripts');
    if (transcriptBox) {
      const line = document.createElement('div');
      line.className = 'voice-line voice-system';
      line.innerHTML = `<span class="voice-speaker-tag ${data.voice}">${data.voice === 'pedro' ? '⚔️ Pedro' : '👑 Trinnity'}</span> ${data.text}`;
      transcriptBox.appendChild(line);
      transcriptBox.scrollTop = transcriptBox.scrollHeight;
    }
    document.getElementById('voice-status').textContent = data.voice === 'pedro' ? 'Pedro: respondendo...' : 'Trinnity: respondendo...';
    speak(data.text, data.voice).then(() => {
      document.getElementById('voice-status').textContent = 'Aguardando comando...';
    });
  }

  async function handleLocalResponse(text, speaker) {
    const lower = text.toLowerCase();
    let response = 'Comando recebido.';
    let voice = speaker === 'pedro' ? 'trinnity' : 'pedro';
    if (lower.includes('olá') || lower.includes('oi') || lower.includes('hey') || lower.includes('jarvis')) {
      response = speaker === 'pedro' ? 'Comandante Pedro. Sistemas online.' : 'Rainha Trinnity. Pronta para servir.';
    } else if (lower.includes('status') || lower.includes('estado')) {
      response = 'Sistema Viseron operacional. Todos os módulos ativos.';
    } else if (lower.includes('obrigado') || lower.includes('obrigada') || lower.includes('valeu')) {
      response = speaker === 'pedro' ? 'Sempre às ordens, Comandante.' : 'Disponha, Rainha Trinnity.';
    } else if (lower.includes('hora') || lower.includes('que horas')) {
      response = 'Agora sao ' + new Date().toLocaleTimeString('pt-BR');
    } else if (lower.includes('tudo bem') || lower.includes('como está')) {
      response = 'Todos os sistemas operacionais dentro dos parâmetros esperados.';
    } else if (lower.includes('plano') || lower.includes('100k')) {
      response = 'O plano 100k esta disponivel. 14 mentes bilionarias ativadas. Relatorio em PDF gerado.';
    }
    handleResponse({ text: response, voice });
  }

  function createWidget() {
    if (document.getElementById('voice-widget-root')) return;
    const root = document.createElement('div');
    root.id = 'voice-widget-root';
    root.innerHTML = `
      <style>
        #voice-widget-root { position:fixed; bottom:20px; right:20px; z-index:2147483647; font-family:'Inter','Space Grotesk',sans-serif; }
        .voice-fab { width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg,#00f0ff,#bf5af2); border:none; cursor:pointer; box-shadow:0 4px 20px rgba(0,240,255,0.4); display:flex; align-items:center; justify-content:center; transition:all 0.3s; position:relative; animation:voice-pulse 3s infinite; }
        .voice-fab:hover { transform:scale(1.1); box-shadow:0 8px 40px rgba(0,240,255,0.6); }
        .voice-fab svg { width:24px; height:24px; filter:drop-shadow(0 0 4px rgba(0,0,0,0.3)); }
        @keyframes voice-pulse { 0%{box-shadow:0 4px 20px rgba(0,240,255,0.4)} 50%{box-shadow:0 4px 40px rgba(0,240,255,0.7)} 100%{box-shadow:0 4px 20px rgba(0,240,255,0.4)} }
        .voice-panel { display:none; position:fixed; bottom:90px; right:20px; width:380px; max-width:calc(100vw - 40px); max-height:70vh; background:rgba(5,5,16,0.95); backdrop-filter:blur(30px); border:1px solid rgba(0,240,255,0.2); border-radius:16px; overflow:hidden; box-shadow:0 20px 80px rgba(0,0,0,0.8); flex-direction:column; animation:voice-slide 0.3s ease; }
        @keyframes voice-slide { from{opacity:0;transform:translateY(20px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        .voice-panel.open { display:flex; }
        .voice-header { padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center; }
        .voice-header h3 { color:#00f0ff; font-size:14px; font-weight:700; margin:0; letter-spacing:0.05em; }
        .voice-status { font-size:11px; color:rgba(255,255,255,0.4); margin-top:2px; }
        .voice-close { background:none; border:none; color:rgba(255,255,255,0.3); cursor:pointer; font-size:18px; padding:0 4px; transition:color 0.2s; }
        .voice-close:hover { color:#fff; }
        .voice-speakers { display:flex; gap:8px; padding:12px 20px; border-bottom:1px solid rgba(255,255,255,0.04); }
        .voice-speaker-btn { flex:1; padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.5); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; text-align:center; }
        .voice-speaker-btn.active { border-color:rgba(0,240,255,0.3); background:rgba(0,240,255,0.1); color:#00f0ff; }
        .voice-speaker-btn.pedro.active { border-color:rgba(0,240,255,0.4); background:rgba(0,240,255,0.12); color:#00f0ff; }
        .voice-speaker-btn.trinnity.active { border-color:rgba(191,90,242,0.4); background:rgba(191,90,242,0.12); color:#bf5af2; }
        .voice-transcripts { flex:1; overflow-y:auto; padding:12px 20px; max-height:300px; min-height:120px; }
        .voice-transcripts::-webkit-scrollbar { width:3px; }
        .voice-transcripts::-webkit-scrollbar-track { background:transparent; }
        .voice-transcripts::-webkit-scrollbar-thumb { background:rgba(0,240,255,0.3); border-radius:3px; }
        .voice-line { padding:6px 8px; margin-bottom:6px; border-radius:8px; font-size:13px; line-height:1.4; animation:voice-fade 0.3s ease; }
        @keyframes voice-fade { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        .voice-user { background:rgba(0,240,255,0.06); border-left:2px solid rgba(0,240,255,0.3); }
        .voice-system { background:rgba(191,90,242,0.06); border-left:2px solid rgba(191,90,242,0.3); }
        .voice-speaker-tag { font-size:10px; font-weight:700; opacity:0.7; margin-right:6px; }
        .voice-speaker-tag.pedro { color:#00f0ff; }
        .voice-speaker-tag.trinnity { color:#bf5af2; }
        .voice-footer { padding:12px 20px; border-top:1px solid rgba(255,255,255,0.06); display:flex; gap:10px; align-items:center; }
        .voice-mic-btn { width:40px; height:40px; border-radius:50%; background:rgba(0,240,255,0.1); border:1px solid rgba(0,240,255,0.2); cursor:pointer; display:flex; align-items:center; justify-content:center; flex-direction:column; transition:all 0.3s; flex-shrink:0; }
        .voice-mic-btn:hover { background:rgba(0,240,255,0.2); transform:scale(1.05); }
        .voice-mic-btn.voice-listening { background:rgba(255,45,85,0.2); border-color:#ff2d55; animation:voice-mic-pulse 1.2s infinite; }
        @keyframes voice-mic-pulse { 0%{box-shadow:0 0 0 0 rgba(255,45,85,0.4)} 50%{box-shadow:0 0 0 8px rgba(255,45,85,0)} 100%{box-shadow:0 0 0 0 rgba(255,45,85,0)} }
        .voice-mic-icon { font-size:16px; line-height:1; }
        .voice-mic-label { font-size:8px; color:rgba(255,255,255,0.5); margin-top:1px; }
        .voice-interim { flex:1; font-size:12px; color:rgba(255,255,255,0.3); padding:4px 8px; border-radius:6px; background:rgba(255,255,255,0.03); min-height:20px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .voice-visualizer { display:flex; align-items:center; gap:2px; padding:0 4px; }
        .voice-bar { width:3px; background:linear-gradient(to top,#00f0ff,#bf5af2); border-radius:1.5px; transition:height 0.15s; }
        @media (max-width:480px) { .voice-panel { right:10px; width:calc(100vw - 20px); bottom:80px; } .voice-fab { width:48px; height:48px; } .voice-fab svg { width:20px; height:20px; } }
      </style>
      <button class="voice-fab" id="voice-fab-btn" title="JARVIS Voz">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
      </button>
      <div class="voice-panel" id="voice-panel">
        <div class="voice-header">
          <div>
            <h3>JARVIS Voice</h3>
            <div class="voice-status" id="voice-status">Aguardando comando...</div>
          </div>
          <button class="voice-close" id="voice-close-btn">✕</button>
        </div>
        <div class="voice-speakers">
          <button class="voice-speaker-btn pedro active" id="voice-speaker-pedro" onclick="window.__voiceWidgetSetSpeaker('pedro')">⚔️ Pedro</button>
          <button class="voice-speaker-btn trinnity" id="voice-speaker-trinnity" onclick="window.__voiceWidgetSetSpeaker('trinnity')">👑 Trinnity</button>
        </div>
        <div class="voice-transcripts" id="voice-transcripts">
          <div class="voice-line voice-system"><span class="voice-speaker-tag trinnity">👑 Trinnity</span> JARVIS Voice ativo. Selecione quem está falando e clique no microfone.</div>
        </div>
        <div class="voice-footer">
          <button class="voice-mic-btn" id="voice-mic-btn">
            <span class="voice-mic-icon">🎤</span>
            <span class="voice-mic-label">Falar</span>
          </button>
          <div class="voice-interim" id="voice-interim"></div>
          <div class="voice-visualizer" id="voice-visualizer"></div>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    document.getElementById('voice-fab-btn').onclick = () => {
      const panel = document.getElementById('voice-panel');
      panel.classList.toggle('open');
    };
    document.getElementById('voice-close-btn').onclick = () => {
      document.getElementById('voice-panel').classList.remove('open');
      stopListening();
    };
    document.getElementById('voice-mic-btn').onclick = toggleListening;

    for (let i = 0; i < 5; i++) {
      const bar = document.createElement('div');
      bar.className = 'voice-bar';
      bar.style.height = '4px';
      document.getElementById('voice-visualizer').appendChild(bar);
    }
    setInterval(() => {
      const bars = document.querySelectorAll('.voice-bar');
      bars.forEach(b => {
        b.style.height = isListening ? (2 + Math.random() * 18) + 'px' : '4px';
      });
    }, 150);
  }

  window.__voiceWidgetSetSpeaker = setSpeaker;
  window.__voiceWidgetSendCommand = sendCommand;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

  if (typeof io !== 'undefined') {
    try {
      socket = io(CONFIG.socketUrl, { path: '/api/socket.io' });
      socket.on('connect', () => log('VoiceBridge conectado via Socket.IO'));
      socket.on('voice:response', handleResponse);
      socket.on('voice:error', (err) => log('Erro: ' + err.error));
    } catch (e) {
      log('Socket.IO nao disponivel, usando REST');
    }
  } else {
    log('Socket.IO nao carregado, usando REST fallback');
  }
})();
