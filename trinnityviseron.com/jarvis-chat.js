(function () {
  if (window.__jarvisChatLoaded) return;
  window.__jarvisChatLoaded = true;

  var CONFIG = {
    apiBase: (window.__jarvisApiBase) || window.location.origin,
    title: 'JARVIS',
    subtitle: 'Assistente Trinnity Viseron',
    placeholder: 'Pergunta-me o que quiseres...',
  };
  if (window.__jarvisConfig) Object.assign(CONFIG, window.__jarvisConfig);

  var root = document.createElement('div');
  root.id = 'jarvis-chat-root';
  root.innerHTML = '\
    <style>\
      #jarvis-chat-root{font-family:"Inter","Segoe UI",sans-serif;}\
      .jchat-fab{position:fixed;left:20px;bottom:20px;width:56px;height:56px;border-radius:50%;border:1px solid rgba(0,240,255,0.4);background:rgba(5,5,16,0.95);color:#00f0ff;cursor:pointer;z-index:2147483646;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 8px 30px rgba(0,0,0,0.6),0 0 20px rgba(0,240,255,0.2);transition:transform .2s;}\
      .jchat-fab:hover{transform:scale(1.08);}\
      .jchat-fab .jchat-dot{position:absolute;top:-2px;right:-2px;width:14px;height:14px;border-radius:50%;background:#00ff87;border:2px solid #050510;animation:jchat-pulse 2s infinite;}\
      @keyframes jchat-pulse{0%,100%{opacity:1}50%{opacity:.3}}\
      .jchat-panel{display:none;position:fixed;left:20px;bottom:88px;width:380px;max-width:calc(100vw - 40px);height:520px;max-height:calc(100vh - 120px);border-radius:16px;border:1px solid rgba(0,240,255,0.2);background:rgba(8,8,22,0.97);backdrop-filter:blur(20px);z-index:2147483646;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.7),0 0 40px rgba(0,240,255,0.08);}\
      .jchat-panel.open{display:flex;}\
      .jchat-header{padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:10px;background:rgba(0,240,255,0.04);}\
      .jchat-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#00f0ff,#bf5af2);display:flex;align-items:center;justify-content:center;font-size:16px;color:#050510;font-weight:800;}\
      .jchat-name{font-size:14px;font-weight:700;color:#e4e4f0;}\
      .jchat-sub{font-size:11px;color:rgba(228,228,240,0.5);}\
      .jchat-close{margin-left:auto;background:none;border:none;color:rgba(228,228,240,0.5);font-size:18px;cursor:pointer;}\
      .jchat-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;}\
      .jchat-b{max-width:85%;padding:9px 12px;border-radius:12px;font-size:13px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word;}\
      .jchat-user{align-self:flex-end;background:rgba(0,240,255,0.12);border:1px solid rgba(0,240,255,0.2);color:#e4f9ff;}\
      .jchat-ai{align-self:flex-start;background:rgba(191,90,242,0.08);border:1px solid rgba(191,90,242,0.2);color:#e4e4f0;}\
      .jchat-ai .jchat-tag{display:block;font-size:10px;color:rgba(0,240,255,0.6);margin-bottom:3px;}\
      .jchat-typing{align-self:flex-start;color:rgba(228,228,240,0.4);font-size:12px;font-style:italic;padding:4px 6px;}\
      .jchat-input{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);}\
      .jchat-input input{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 12px;color:#e4e4f0;font-size:13px;outline:none;}\
      .jchat-input input:focus{border-color:rgba(0,240,255,0.4);}\
      .jchat-input button{background:rgba(0,240,255,0.15);border:1px solid rgba(0,240,255,0.3);color:#00f0ff;border-radius:10px;padding:0 16px;font-weight:700;cursor:pointer;}\
      .jchat-input button:hover{background:rgba(0,240,255,0.25);}\
      .jchat-welcome{padding:4px 8px 0;font-size:12px;color:rgba(228,228,240,0.6);}\
      @media (max-width:480px){.jchat-panel{left:10px;width:calc(100vw - 20px);bottom:80px;}.jchat-fab{left:10px;bottom:10px;}}\
    </style>\
    <button class="jchat-fab" id="jchatFab" title="Falar com JARVIS" aria-label="Abrir chat JARVIS">⚡<span class="jchat-dot"></span></button>\
    <div class="jchat-panel" id="jchatPanel">\
      <div class="jchat-header">\
        <div class="jchat-avatar">J</div>\
        <div><div class="jchat-name">' + CONFIG.title + '</div><div class="jchat-sub">' + CONFIG.subtitle + '</div></div>\
        <button class="jchat-close" id="jchatClose">✕</button>\
      </div>\
      <div class="jchat-welcome">Sou o JARVIS do Viseron. Posso mostrar o estado do sistema, planos, blog, mensageria E2E e criar o teu checkout.</div>\
      <div class="jchat-msgs" id="jchatMsgs"></div>\
      <div class="jchat-input">\
        <input id="jchatInput" placeholder="' + CONFIG.placeholder + '" autocomplete="off" />\
        <button id="jchatSend">➤</button>\
      </div>\
    </div>';

  document.body.appendChild(root);

  var fab = document.getElementById('jchatFab');
  var panel = document.getElementById('jchatPanel');
  var msgs = document.getElementById('jchatMsgs');
  var input = document.getElementById('jchatInput');
  var sendBtn = document.getElementById('jchatSend');
  var closeBtn = document.getElementById('jchatClose');

  var sessionId = localStorage.getItem('jarvis-session') || '';

  function open() { panel.classList.add('open'); input.focus(); }
  function close() { panel.classList.remove('open'); }
  fab.addEventListener('click', function () { panel.classList.contains('open') ? close() : open(); });
  closeBtn.addEventListener('click', close);

  function addMsg(text, who) {
    var el = document.createElement('div');
    el.className = 'jchat-b ' + (who === 'user' ? 'jchat-user' : 'jchat-ai');
    if (who === 'ai') {
      var tag = document.createElement('span');
      tag.className = 'jchat-tag';
      tag.textContent = 'JARVIS · Viseron';
      el.appendChild(tag);
    }
    el.appendChild(document.createTextNode(text));
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function send() {
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMsg(text, 'user');
    var typing = document.createElement('div');
    typing.className = 'jchat-typing';
    typing.textContent = 'JARVIS a pensar…';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    sendBtn.disabled = true;
    try {
      var res = await fetch(CONFIG.apiBase + '/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId, message: text }),
      });
      var data = await res.json();
      if (data.sessionId) { sessionId = data.sessionId; localStorage.setItem('jarvis-session', sessionId); }
      typing.remove();
      addMsg(data.reply || 'Não consegui processar. Tenta de novo.', 'ai');
    } catch (e) {
      typing.remove();
      addMsg('Não consegui ligar ao JARVIS. Verifica se a API está online.', 'ai');
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
})();
