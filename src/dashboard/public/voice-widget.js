(function () {
  if (window.__voiceWidgetLoaded) return;
  window.__voiceWidgetLoaded = true;

  const CONFIG = {
    backendUrl: 'http://localhost:3000',
    socketUrl: 'http://localhost:3000'
  };
  if (window.__voiceConfig) Object.assign(CONFIG, window.__voiceConfig);

  const L = {
    pt: {
      title: 'JARVIS Voz', statusIdle: 'Aguardando comando...', statusProcessing: (s) => s === 'pedro' ? 'Pedro: processando...' : 'Trinnity: processando...',
      statusResponding: (s) => s === 'pedro' ? 'Pedro: respondendo...' : 'Trinnity: respondendo...',
      micOn: 'Ouvindo...', micOff: 'Falar', pedro: 'Pedro', trinnity: 'Trinnity',
      welcome: 'JARVIS Voice ativo. Selecione o idioma, quem está falando e clique no microfone.',
      listenError: 'Reconhecimento de voz não suportado', micError: 'Erro ao iniciar microfone',
      connOk: 'Conectado via Socket.IO', connFail: 'Usando REST fallback',
      localHelloP: 'Comandante Pedro. Sistemas online.', localHelloT: 'Rainha Trinnity. Pronta para servir.',
      localStatus: 'Sistema Viseron operacional. Todos os módulos ativos.',
      localThanksP: 'Sempre às ordens, Comandante.', localThanksT: 'Disponha, Rainha Trinnity.',
      localTime: (t, d) => `Agora são ${t} do dia ${d}.`,
      localPlan: 'O plano 100k disponível. 14 mentes bilionárias ativadas. Relatório PDF gerado.',
      localFallback: 'Comando recebido.'
    },
    en: {
      title: 'JARVIS Voice', statusIdle: 'Awaiting command...', statusProcessing: (s) => s === 'pedro' ? 'Pedro: processing...' : 'Trinnity: processing...',
      statusResponding: (s) => s === 'pedro' ? 'Pedro: responding...' : 'Trinnity: responding...',
      micOn: 'Listening...', micOff: 'Speak', pedro: 'Pedro', trinnity: 'Trinnity',
      welcome: 'JARVIS Voice active. Select language, who is speaking and click the microphone.',
      listenError: 'Speech recognition not supported', micError: 'Error starting microphone',
      connOk: 'Connected via Socket.IO', connFail: 'Using REST fallback',
      localHelloP: 'Commander Pedro. Systems online.', localHelloT: 'Queen Trinnity. Ready to serve.',
      localStatus: 'Viseron system operational. All modules active.',
      localThanksP: 'Always at your service, Commander.', localThanksT: 'At your service, Queen Trinnity.',
      localTime: (t, d) => `It is ${t} on ${d}.`,
      localPlan: '100k plan available. 14 billionaire minds activated. PDF report generated.',
      localFallback: 'Command received.'
    },
    es: {
      title: 'JARVIS Voz', statusIdle: 'Esperando comando...', statusProcessing: (s) => s === 'pedro' ? 'Pedro: procesando...' : 'Trinnity: procesando...',
      statusResponding: (s) => s === 'pedro' ? 'Pedro: respondiendo...' : 'Trinnity: respondiendo...',
      micOn: 'Escuchando...', micOff: 'Hablar', pedro: 'Pedro', trinnity: 'Trinnity',
      welcome: 'JARVIS Voice activo. Seleccione idioma, quién habla y haga clic en el micrófono.',
      listenError: 'Reconocimiento de voz no soportado', micError: 'Error al iniciar micrófono',
      connOk: 'Conectado vía Socket.IO', connFail: 'Usando REST fallback',
      localHelloP: 'Comandante Pedro. Sistemas en línea.', localHelloT: 'Reina Trinnity. Lista para servir.',
      localStatus: 'Sistema Viseron operativo. Todos los módulos activos.',
      localThanksP: 'Siempre a sus órdenes, Comandante.', localThanksT: 'A su servicio, Reina Trinnity.',
      localTime: (t, d) => `Son las ${t} del ${d}.`,
      localPlan: 'Plan 100k disponible. 14 mentes millonarias activadas. Informe PDF generado.',
      localFallback: 'Comando recibido.'
    }
  };

  let lang = (navigator.language || 'pt-BR').startsWith('es') ? 'es' : (navigator.language || 'pt-BR').startsWith('pt') ? 'pt' : 'en';
  let recognition = null, isListening = false, isSpeaking = false, socket = null, currentSpeaker = 'pedro';

  function tr(s, ...args) {
    const val = L[lang] ? L[lang][s] : L.pt[s];
    return typeof val === 'function' ? val(...args) : val || s;
  }

  function log(msg) { if (window.voiceLog) window.voiceLog(msg); }

  function getVoices() {
    return new Promise((resolve) => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) { resolve(v); return; }
      window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
      setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500);
    });
  }

  function findVoice(voices, name, langCode) {
    return voices.find(v => v.name.includes(name) && v.lang.startsWith(langCode))
      || voices.find(v => v.lang.startsWith(langCode))
      || voices.find(v => v.name.includes(name))
      || voices[0];
  }

  async function speak(text, voiceType) {
    return new Promise(async (resolve) => {
      if (isSpeaking) { window.speechSynthesis.cancel(); }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US';
      utterance.rate = 0.85 + Math.random() * 0.1;
      utterance.pitch = voiceType === 'pedro' ? 0.65 + Math.random() * 0.1 : 1.2 + Math.random() * 0.15;
      utterance.volume = 1;
      const voices = await getVoices();
      const lc = lang === 'pt' ? 'pt' : lang === 'es' ? 'es' : 'en';
      if (voiceType === 'pedro') {
        utterance.voice = findVoice(voices, 'David', lc) || findVoice(voices, 'Microsoft', lc) || voices.find(v => v.lang.startsWith(lc));
      } else {
        utterance.voice = findVoice(voices, 'Zira', lc) || findVoice(voices, 'Maria', lc) || findVoice(voices, 'Microsoft', lc) || voices.find(v => v.lang.startsWith(lc));
      }
      isSpeaking = true;
      utterance.onend = () => { isSpeaking = false; resolve(); };
      utterance.onerror = () => { isSpeaking = false; resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }

  function startListening() {
    if (isListening) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { log(tr('listenError')); return; }
    recognition = new SR();
    recognition.lang = lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const t = transcript.trim();
          if (t) { log(t); sendCommand(t, currentSpeaker); }
        }
      }
      const el = document.getElementById('voice-interim');
      if (el) el.textContent = transcript;
    };
    recognition.onerror = (e) => { log(e.error); isListening = false; updateMic(false); };
    recognition.onend = () => { isListening = false; updateMic(false); };
    try { recognition.start(); isListening = true; updateMic(true); } catch (e) { log(tr('micError')); }
  }

  function stopListening() {
    if (recognition && isListening) { try { recognition.stop(); } catch (e) {} isListening = false; updateMic(false); }
  }

  function toggleListening() { isListening ? stopListening() : startListening(); }

  function updateMic(active) {
    const btn = document.getElementById('voice-mic-btn');
    if (!btn) return;
    btn.className = active ? 'voice-mic-btn voice-listening' : 'voice-mic-btn';
    const icon = btn.querySelector('.voice-mic-icon');
    if (icon) icon.textContent = active ? '■' : '🎤';
    const label = btn.querySelector('.voice-mic-label');
    if (label) label.textContent = active ? tr('micOn') : tr('micOff');
  }

  function setSpeaker(person) {
    currentSpeaker = person;
    const bp = document.getElementById('voice-speaker-pedro');
    const bt = document.getElementById('voice-speaker-trinnity');
    if (bp) bp.className = person === 'pedro' ? 'voice-speaker-btn active' : 'voice-speaker-btn';
    if (bt) bt.className = person === 'trinnity' ? 'voice-speaker-btn active' : 'voice-speaker-btn';
  }

  function setLanguage(l) {
    lang = l;
    const bpt = document.getElementById('voice-lang-pt');
    const ben = document.getElementById('voice-lang-en');
    const bes = document.getElementById('voice-lang-es');
    if (bpt) bpt.className = l === 'pt' ? 'voice-lang-btn active' : 'voice-lang-btn';
    if (ben) ben.className = l === 'en' ? 'voice-lang-btn active' : 'voice-lang-btn';
    if (bes) bes.className = l === 'es' ? 'voice-lang-btn active' : 'voice-lang-btn';
    const title = document.getElementById('voice-title');
    if (title) title.textContent = tr('title');
    const status = document.getElementById('voice-status');
    if (status && status.dataset.idle === 'true') status.textContent = tr('statusIdle');
    const label = document.querySelector('.voice-mic-label');
    if (label && !isListening) label.textContent = tr('micOff');
  }

  async function sendCommand(text, speaker) {
    const box = document.getElementById('voice-transcripts');
    if (box) {
      const line = document.createElement('div');
      line.className = 'voice-line voice-user';
      line.innerHTML = `<span class="voice-speaker-tag ${speaker}">${speaker === 'pedro' ? '⚔️ ' + tr('pedro') : '👑 ' + tr('trinnity')}</span> ${text}`;
      box.appendChild(line);
      box.scrollTop = box.scrollHeight;
    }
    const status = document.getElementById('voice-status');
    if (status) { status.textContent = tr('statusProcessing', speaker); status.dataset.idle = 'false'; }

    if (socket && socket.connected) {
      socket.emit('voice:command', { text, speaker, lang, timestamp: Date.now() });
    } else {
      try {
        const resp = await fetch(CONFIG.backendUrl + '/api/voice/command', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, speaker, lang, timestamp: Date.now() })
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
    const box = document.getElementById('voice-transcripts');
    if (box) {
      const line = document.createElement('div');
      line.className = 'voice-line voice-system';
      line.innerHTML = `<span class="voice-speaker-tag ${data.voice}">${data.voice === 'pedro' ? '⚔️ ' + tr('pedro') : '👑 ' + tr('trinnity')}</span> ${data.text}`;
      box.appendChild(line);
      box.scrollTop = box.scrollHeight;
    }
    const status = document.getElementById('voice-status');
    if (status) { status.textContent = tr('statusResponding', data.voice); status.dataset.idle = 'false'; }
    speak(data.text, data.voice).then(() => {
      if (status) { status.textContent = tr('statusIdle'); status.dataset.idle = 'true'; }
    });
  }

  async function handleLocalResponse(text, speaker) {
    const lower = text.toLowerCase();
    let response = tr('localFallback');
    let voice = speaker === 'pedro' ? 'trinnity' : 'pedro';
    if (lower.includes('olá') || lower.includes('oi') || lower.includes('hey') || lower.includes('jarvis') || lower.includes('hello') || lower.includes('hola') || lower.includes('hi')) {
      response = speaker === 'pedro' ? tr('localHelloP') : tr('localHelloT');
    } else if (lower.includes('status') || lower.includes('estado') || lower.includes('system') || lower.includes('online')) {
      response = tr('localStatus');
    } else if (lower.includes('obrigado') || lower.includes('obrigada') || lower.includes('valeu') || lower.includes('thanks') || lower.includes('gracias')) {
      response = speaker === 'pedro' ? tr('localThanksP') : tr('localThanksT');
    } else if (lower.includes('hora') || lower.includes('time') || lower.includes('hora')) {
      const now = new Date();
      const lc = lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US';
      response = tr('localTime', now.toLocaleTimeString(lc), now.toLocaleDateString(lc));
    } else if (lower.includes('plano') || lower.includes('100k') || lower.includes('plan')) {
      response = tr('localPlan');
    }
    handleResponse({ text: response, voice, lang });
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
        .voice-panel { display:none; position:fixed; bottom:90px; right:20px; width:400px; max-width:calc(100vw - 40px); max-height:75vh; background:rgba(5,5,16,0.96); backdrop-filter:blur(30px); border:1px solid rgba(0,240,255,0.2); border-radius:16px; overflow:hidden; box-shadow:0 20px 80px rgba(0,0,0,0.8); flex-direction:column; animation:voice-slide 0.3s ease; }
        @keyframes voice-slide { from{opacity:0;transform:translateY(20px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        .voice-panel.open { display:flex; }
        .voice-header { padding:14px 18px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center; }
        .voice-header h3 { color:#00f0ff; font-size:13px; font-weight:700; margin:0; letter-spacing:0.05em; }
        .voice-status { font-size:10px; color:rgba(255,255,255,0.4); margin-top:1px; }
        .voice-close { background:none; border:none; color:rgba(255,255,255,0.3); cursor:pointer; font-size:16px; padding:0 4px; transition:color 0.2s; }
        .voice-close:hover { color:#fff; }
        .voice-langs { display:flex; gap:4px; padding:8px 18px; border-bottom:1px solid rgba(255,255,255,0.04); }
        .voice-lang-btn { flex:1; padding:4px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); color:rgba(255,255,255,0.4); font-size:10px; font-weight:600; cursor:pointer; transition:all 0.2s; text-align:center; text-transform:uppercase; }
        .voice-lang-btn.active { border-color:rgba(0,240,255,0.3); background:rgba(0,240,255,0.1); color:#00f0ff; }
        .voice-lang-btn:hover { border-color:rgba(0,240,255,0.15); color:rgba(255,255,255,0.6); }
        .voice-speakers { display:flex; gap:8px; padding:10px 18px; border-bottom:1px solid rgba(255,255,255,0.04); }
        .voice-speaker-btn { flex:1; padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.5); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; text-align:center; }
        .voice-speaker-btn.pedro.active { border-color:rgba(0,240,255,0.4); background:rgba(0,240,255,0.12); color:#00f0ff; }
        .voice-speaker-btn.trinnity.active { border-color:rgba(191,90,242,0.4); background:rgba(191,90,242,0.12); color:#bf5af2; }
        .voice-transcripts { flex:1; overflow-y:auto; padding:10px 18px; max-height:280px; min-height:100px; }
        .voice-transcripts::-webkit-scrollbar { width:3px; }
        .voice-transcripts::-webkit-scrollbar-track { background:transparent; }
        .voice-transcripts::-webkit-scrollbar-thumb { background:rgba(0,240,255,0.3); border-radius:3px; }
        .voice-line { padding:6px 8px; margin-bottom:5px; border-radius:8px; font-size:12px; line-height:1.4; animation:voice-fade 0.3s ease; }
        @keyframes voice-fade { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        .voice-user { background:rgba(0,240,255,0.06); border-left:2px solid rgba(0,240,255,0.3); }
        .voice-system { background:rgba(191,90,242,0.06); border-left:2px solid rgba(191,90,242,0.3); }
        .voice-speaker-tag { font-size:10px; font-weight:700; opacity:0.7; margin-right:6px; }
        .voice-speaker-tag.pedro { color:#00f0ff; }
        .voice-speaker-tag.trinnity { color:#bf5af2; }
        .voice-footer { padding:10px 18px; border-top:1px solid rgba(255,255,255,0.06); display:flex; gap:10px; align-items:center; }
        .voice-mic-btn { width:40px; height:40px; border-radius:50%; background:rgba(0,240,255,0.1); border:1px solid rgba(0,240,255,0.2); cursor:pointer; display:flex; align-items:center; justify-content:center; flex-direction:column; transition:all 0.3s; flex-shrink:0; }
        .voice-mic-btn:hover { background:rgba(0,240,255,0.2); transform:scale(1.05); }
        .voice-mic-btn.voice-listening { background:rgba(255,45,85,0.2); border-color:#ff2d55; animation:voice-mic-pulse 1.2s infinite; }
        @keyframes voice-mic-pulse { 0%{box-shadow:0 0 0 0 rgba(255,45,85,0.4)} 50%{box-shadow:0 0 0 8px rgba(255,45,85,0)} 100%{box-shadow:0 0 0 0 rgba(255,45,85,0)} }
        .voice-mic-icon { font-size:16px; line-height:1; }
        .voice-mic-label { font-size:8px; color:rgba(255,255,255,0.5); margin-top:1px; }
        .voice-interim { flex:1; font-size:11px; color:rgba(255,255,255,0.25); padding:4px 8px; border-radius:6px; background:rgba(255,255,255,0.03); min-height:18px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .voice-visualizer { display:flex; align-items:center; gap:2px; padding:0 4px; }
        .voice-bar { width:3px; background:linear-gradient(to top,#00f0ff,#bf5af2); border-radius:1.5px; transition:height 0.15s; }
        @media (max-width:480px) { .voice-panel { right:10px; width:calc(100vw - 20px); bottom:80px; } .voice-fab { width:48px; height:48px; } .voice-fab svg { width:20px; height:20px; } }
      </style>
      <button class="voice-fab" id="voice-fab-btn" title="JARVIS Voice">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
      </button>
      <div class="voice-panel" id="voice-panel">
        <div class="voice-header">
          <div>
            <h3 id="voice-title">JARVIS Voice</h3>
            <div class="voice-status" id="voice-status" data-idle="true">Aguardando comando...</div>
          </div>
          <button class="voice-close" id="voice-close-btn">✕</button>
        </div>
        <div class="voice-langs" id="voice-langs">
          <button class="voice-lang-btn active" id="voice-lang-pt" onclick="window.__voiceWidgetSetLang('pt')">🇧🇷 PT</button>
          <button class="voice-lang-btn" id="voice-lang-en" onclick="window.__voiceWidgetSetLang('en')">🇺🇸 EN</button>
          <button class="voice-lang-btn" id="voice-lang-es" onclick="window.__voiceWidgetSetLang('es')">🇪🇸 ES</button>
        </div>
        <div class="voice-speakers">
          <button class="voice-speaker-btn pedro active" id="voice-speaker-pedro" onclick="window.__voiceWidgetSetSpeaker('pedro')">⚔️ Pedro</button>
          <button class="voice-speaker-btn trinnity" id="voice-speaker-trinnity" onclick="window.__voiceWidgetSetSpeaker('trinnity')">👑 Trinnity</button>
        </div>
        <div class="voice-transcripts" id="voice-transcripts">
          <div class="voice-line voice-system"><span class="voice-speaker-tag trinnity">👑 Trinnity</span> JARVIS Voice ativo. Selecione o idioma, quem está falando e clique no microfone.</div>
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

    document.getElementById('voice-fab-btn').onclick = () => document.getElementById('voice-panel').classList.toggle('open');
    document.getElementById('voice-close-btn').onclick = () => { document.getElementById('voice-panel').classList.remove('open'); stopListening(); };
    document.getElementById('voice-mic-btn').onclick = toggleListening;
    for (let i = 0; i < 5; i++) {
      const bar = document.createElement('div');
      bar.className = 'voice-bar'; bar.style.height = '4px';
      document.getElementById('voice-visualizer').appendChild(bar);
    }
    setInterval(() => {
      document.querySelectorAll('.voice-bar').forEach(b => { b.style.height = isListening ? (2 + Math.random() * 18) + 'px' : '4px'; });
    }, 150);

    setLanguage(lang);
  }

  window.__voiceWidgetSetSpeaker = setSpeaker;
  window.__voiceWidgetSetLang = setLanguage;
  window.__voiceWidgetSendCommand = sendCommand;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createWidget);
  else createWidget();

  if (typeof io !== 'undefined') {
    try {
      socket = io(CONFIG.socketUrl, { path: '/api/socket.io' });
      socket.on('connect', () => log(tr('connOk')));
      socket.on('voice:response', handleResponse);
      socket.on('voice:error', (err) => log('Error: ' + err.error));
    } catch (e) { log(tr('connFail')); }
  } else { log(tr('connFail')); }
})();
