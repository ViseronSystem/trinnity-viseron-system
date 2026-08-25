(function () {
  if (window.__webosLoaded) return;
  window.__webosLoaded = true;

  const L = {
    pt: { start: 'Sistema', terminal: 'Terminal', monitor: 'Monitor', agents: 'Agentes', voice: 'Voz', token: 'Token', files: 'Arquivos', settings: 'Config', apps: 'Aplicativos', logout: 'Sair', cpu: 'CPU', mem: 'MEM', agents_count: 'Agentes', minds: 'Mentes', running: 'Online', lang_pt: 'Português', lang_en: 'English', lang_es: 'Español', speaker_pedro: 'Pedro', speaker_trinnity: 'Trinnity', start_placeholder: 'Digite um comando ou pesquise...', welcome: 'Bem-vindo ao Trinnity Viseron OS', welcome_desc: 'Sistema Operacional Multi-Agente de Superinteligência' },
    en: { start: 'System', terminal: 'Terminal', monitor: 'Monitor', agents: 'Agents', voice: 'Voice', token: 'Token', files: 'Files', settings: 'Settings', apps: 'Apps', logout: 'Exit', cpu: 'CPU', mem: 'MEM', agents_count: 'Agents', minds: 'Minds', running: 'Online', lang_pt: 'Português', lang_en: 'English', lang_es: 'Español', speaker_pedro: 'Pedro', speaker_trinnity: 'Trinnity', start_placeholder: 'Type a command or search...', welcome: 'Welcome to Trinnity Viseron OS', welcome_desc: 'Multi-Agent Superintelligence Operating System' },
    es: { start: 'Sistema', terminal: 'Terminal', monitor: 'Monitor', agents: 'Agentes', voice: 'Voz', token: 'Token', files: 'Archivos', settings: 'Config', apps: 'Apps', logout: 'Salir', cpu: 'CPU', mem: 'MEM', agents_count: 'Agentes', minds: 'Mentes', running: 'En Línea', lang_pt: 'Português', lang_en: 'English', lang_es: 'Español', speaker_pedro: 'Pedro', speaker_trinnity: 'Trinnity', start_placeholder: 'Escriba un comando o busque...', welcome: 'Bienvenido a Trinnity Viseron OS', welcome_desc: 'Sistema Operativo Multi-Agente de Superinteligencia' }
  };

  let lang = (navigator.language || 'en').startsWith('pt') ? 'pt' : (navigator.language || 'en').startsWith('es') ? 'es' : 'en';
  let currentSpeaker = 'pedro';
  let windows = {};
  let zIndex = 100;
  let winIdCounter = 0;
  let socket = null;
  let agentsCache = [];
  let statsCache = {};

  function t(s) { const d = L[lang] || L.en; return d[s] || s; }

  function fetchJSON(url) { return fetch(url).then(r => r.json()).catch(() => ({})); }

  function getApiBase() { return window.__webosApiBase || window.location.origin; }

  async function refreshStats() {
    statsCache = await fetchJSON(getApiBase() + '/api/stats');
    agentsCache = await fetchJSON(getApiBase() + '/api/agents');
    document.querySelectorAll('.os-stat-value').forEach(el => {
      const k = el.dataset.stat;
      if (k && statsCache[k] !== undefined) el.textContent = typeof statsCache[k] === 'number' ? statsCache[k].toLocaleString() : statsCache[k];
    });
    document.querySelectorAll('.os-agent-count').forEach(el => { el.textContent = (agentsCache.length || statsCache.totalAgents || 386) + ' ' + t('agents_count'); });
  }

  function createWindow(id, opts) {
    if (windows[id]) { focusWindow(id); return; }
    const win = document.createElement('div');
    win.className = 'os-window tvs-enter';
    win.id = 'win-' + id;
    win.style.width = (opts.w || 600) + 'px';
    win.style.height = (opts.h || 400) + 'px';
    win.style.left = (80 + Math.random() * 160) + 'px';
    win.style.top = (40 + Math.random() * 80) + 'px';
    win.style.zIndex = ++zIndex;
    win.dataset.minimized = 'false';
    win.innerHTML = `
      <div class="os-win-header">
        <span class="os-win-icon">${opts.icon || '⬜'}</span>
        <span class="os-win-title">${opts.title || id}</span>
        <div class="os-win-actions">
          <button class="os-win-btn os-win-min" onclick="window.__webosMinimize('${id}')">─</button>
          <button class="os-win-btn os-win-max" onclick="window.__webosToggleMax('${id}')">□</button>
          <button class="os-win-btn os-win-close" onclick="window.__webosClose('${id}')">✕</button>
        </div>
      </div>
      <div class="os-win-body" id="win-body-${id}"></div>
    `;
    document.getElementById('os-desktop').appendChild(win);
    windows[id] = { el: win, opts, body: document.getElementById('win-body-' + id) };
    makeDraggable(win, id);
    win.addEventListener('mousedown', () => focusWindow(id));
    if (opts.content) opts.content(windows[id].body);
    addTaskbarItem(id, opts);
    return windows[id];
  }

  function addTaskbarItem(id, opts) {
    const existing = document.getElementById('os-task-' + id);
    if (existing) return;
    const item = document.createElement('button');
    item.className = 'os-task-item';
    item.id = 'os-task-' + id;
    item.innerHTML = opts.icon + ' ' + opts.title;
    item.onclick = () => {
      const w = windows[id];
      if (!w) return;
      if (w.el.dataset.minimized === 'true') { w.el.dataset.minimized = 'false'; w.el.style.display = 'flex'; focusWindow(id); }
      else if (w.el.style.display === 'none') { w.el.style.display = 'flex'; focusWindow(id); }
      else { w.el.dataset.minimized = 'true'; w.el.style.display = 'none'; }
    };
    document.getElementById('os-taskbar-apps').appendChild(item);
  }

  function focusWindow(id) {
    const w = windows[id];
    if (!w) return;
    w.el.style.zIndex = ++zIndex;
    document.querySelectorAll('.os-window').forEach(e => e.classList.remove('os-window-focused'));
    w.el.classList.add('os-window-focused');
    document.querySelectorAll('.os-task-item').forEach(e => e.classList.remove('active'));
    const ti = document.getElementById('os-task-' + id);
    if (ti) ti.classList.add('active');
  }

  function makeDraggable(el, id) {
    const header = el.querySelector('.os-win-header');
    let isDown = false, ox, oy;
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.os-win-actions')) return;
      isDown = true; ox = e.clientX - el.offsetLeft; oy = e.clientY - el.offsetTop;
      el.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      el.style.left = Math.max(0, e.clientX - ox) + 'px';
      el.style.top = Math.max(0, e.clientY - oy) + 'px';
    });
    document.addEventListener('mouseup', () => { isDown = false; if (el) el.style.cursor = ''; });
  }

  window.__webosMinimize = function(id) {
    const w = windows[id];
    if (!w) return;
    w.el.dataset.minimized = 'true';
    w.el.style.display = 'none';
  };
  window.__webosToggleMax = function(id) {
    const w = windows[id];
    if (!w) return;
    if (w.el.dataset.maximized === 'true') {
      w.el.style.width = w._w + 'px'; w.el.style.height = w._h + 'px';
      w.el.style.left = w._x + 'px'; w.el.style.top = w._y + 'px';
      w.el.dataset.maximized = 'false';
    } else {
      w._w = w.el.offsetWidth; w._h = w.el.offsetHeight;
      w._x = w.el.offsetLeft; w._y = w.el.offsetTop;
      w.el.style.width = 'calc(100vw - 20px)';
      w.el.style.height = 'calc(100vh - 80px)';
      w.el.style.left = '0px'; w.el.style.top = '0px';
      w.el.dataset.maximized = 'true';
    }
  };
  window.__webosClose = function(id) {
    const w = windows[id];
    if (!w) return;
    w.el.remove();
    const ti = document.getElementById('os-task-' + id);
    if (ti) ti.remove();
    delete windows[id];
  };
  window.__webosSetLang = function(l) { lang = l; document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n)); };
  window.__webosSetSpeaker = function(s) { currentSpeaker = s; };

  function buildOS() {
    if (document.getElementById('os-root')) return;

    const os = document.createElement('div');
    os.id = 'os-root';
    os.innerHTML = `
      <style>
        #os-root { position:fixed; inset:0; z-index:100000; display:flex; flex-direction:column; font-family:'Inter','Space Grotesk',sans-serif; color:#e4e4f0; user-select:none; }
        #os-desktop { flex:1; position:relative; overflow:hidden; background:var(--os-bg,#050510); }
        #os-desktop canvas { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
        .os-desktop-icons { position:absolute; top:20px; left:20px; display:flex; flex-direction:column; gap:16px; z-index:10; }
        .os-desktop-icon { display:flex; flex-direction:column; align-items:center; gap:4px; width:72px; padding:8px; border-radius:8px; cursor:pointer; background:rgba(255,255,255,0.02); border:1px solid transparent; transition:all 0.2s; text-align:center; }
        .os-desktop-icon:hover { background:rgba(0,240,255,0.08); border-color:rgba(0,240,255,0.15); }
        .os-desktop-icon .icon { font-size:28px; line-height:1; }
        .os-desktop-icon .label { font-size:10px; color:rgba(255,255,255,0.6); line-height:1.2; word-break:break-word; }
        .os-window { position:absolute; background:rgba(10,10,26,0.96); backdrop-filter:blur(30px); border:1px solid rgba(0,240,255,0.12); border-radius:10px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 10px 60px rgba(0,0,0,0.7); min-width:300px; min-height:200px; animation:os-win-appear 0.2s ease; }
        @keyframes os-win-appear { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        .os-window-focused { border-color:rgba(0,240,255,0.25); box-shadow:0 10px 80px rgba(0,0,0,0.9),0 0 30px rgba(0,240,255,0.05); }
        .os-win-header { display:flex; align-items:center; gap:8px; padding:8px 12px; background:rgba(0,0,0,0.3); border-bottom:1px solid rgba(255,255,255,0.04); cursor:grab; flex-shrink:0; }
        .os-win-icon { font-size:14px; }
        .os-win-title { flex:1; font-size:12px; font-weight:600; color:rgba(255,255,255,0.7); }
        .os-win-actions { display:flex; gap:4px; }
        .os-win-btn { width:22px; height:22px; border:none; border-radius:4px; background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.4); font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
        .os-win-btn:hover { background:rgba(255,255,255,0.1); color:#fff; }
        .os-win-close:hover { background:#ff2d55; color:#fff; }
        .os-win-body { flex:1; overflow:auto; padding:12px; font-size:13px; }
        .os-taskbar { height:44px; background:rgba(5,5,16,0.95); backdrop-filter:blur(20px); border-top:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; padding:0 8px; gap:4px; flex-shrink:0; }
        .os-start-btn { padding:6px 14px; border-radius:6px; background:rgba(0,240,255,0.08); border:1px solid rgba(0,240,255,0.12); color:var(--neon,#00f0ff); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:6px; white-space:nowrap; }
        .os-start-btn:hover { background:rgba(0,240,255,0.15); }
        .os-taskbar-apps { flex:1; display:flex; gap:2px; overflow-x:auto; padding:0 8px; }
        .os-taskbar-apps::-webkit-scrollbar { height:2px; }
        .os-taskbar-apps::-webkit-scrollbar-thumb { background:rgba(0,240,255,0.3); border-radius:2px; }
        .os-task-item { padding:4px 10px; border-radius:4px; background:transparent; border:none; color:rgba(255,255,255,0.5); font-size:11px; cursor:pointer; transition:all 0.15s; white-space:nowrap; display:flex; align-items:center; gap:4px; }
        .os-task-item:hover { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.7); }
        .os-task-item.active { background:rgba(0,240,255,0.1); color:var(--neon,#00f0ff); }
        .os-taskbar-right { display:flex; align-items:center; gap:6px; }
        .os-tray-btn { background:none; border:none; color:rgba(255,255,255,0.4); font-size:13px; cursor:pointer; padding:4px 6px; border-radius:4px; transition:all 0.15s; line-height:1; }
        .os-tray-btn:hover { background:rgba(255,255,255,0.05); color:#fff; }
        .os-clock { font-size:11px; color:rgba(255,255,255,0.5); padding:0 8px; min-width:70px; text-align:center; font-variant-numeric:tabular-nums; }
        .os-stat-value { font-weight:700; color:var(--neon,#00f0ff); }
        .os-start-menu { position:absolute; bottom:48px; left:8px; width:320px; max-height:400px; background:rgba(10,10,26,0.98); backdrop-filter:blur(30px); border:1px solid rgba(0,240,255,0.12); border-radius:12px; overflow:hidden; display:none; z-index:9999; flex-direction:column; animation:os-slide 0.2s ease; }
        @keyframes os-slide { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .os-start-menu.open { display:flex; }
        .os-start-search { padding:12px; border-bottom:1px solid rgba(255,255,255,0.04); }
        .os-start-search input { width:100%; padding:8px 12px; border-radius:6px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); color:#fff; font-size:13px; outline:none; }
        .os-start-search input:focus { border-color:rgba(0,240,255,0.2); }
        .os-start-apps { flex:1; overflow-y:auto; padding:8px; display:grid; grid-template-columns:1fr 1fr; gap:4px; }
        .os-start-app { display:flex; align-items:center; gap:8px; padding:8px; border-radius:6px; cursor:pointer; transition:all 0.15s; border:none; background:transparent; color:rgba(255,255,255,0.6); font-size:12px; text-align:left; }
        .os-start-app:hover { background:rgba(0,240,255,0.06); color:#fff; }
        .os-start-app .icon { font-size:18px; }
        .os-start-footer { display:flex; padding:8px 12px; border-top:1px solid rgba(255,255,255,0.04); gap:8px; }
        .os-start-footer select { flex:1; padding:4px 8px; border-radius:4px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); color:rgba(255,255,255,0.6); font-size:10px; outline:none; cursor:pointer; }
        .os-start-footer select option { background:#0a0a1a; color:#fff; }
        .os-welcome { position:absolute; bottom:60px; right:20px; text-align:right; z-index:5; }
        .os-welcome h1 { font-size:32px; font-weight:900; background:linear-gradient(90deg,#00f0ff,#bf5af2); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .os-welcome p { color:rgba(255,255,255,0.3); font-size:13px; margin-top:4px; }
        .terminal-line { font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--neon,#00f0ff); margin:1px 0; }
        .terminal-prompt { color:rgba(255,255,255,0.3); }
        .term-input-row { display:flex; align-items:center; gap:4px; margin-top:8px; }
        .term-input-row input { flex:1; background:transparent; border:none; color:var(--neon,#00f0ff); font-family:'JetBrains Mono',monospace; font-size:12px; outline:none; }
        .agent-card { display:flex; align-items:center; gap:10px; padding:6px 8px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:6px; margin:3px 0; }
        .agent-card .name { font-size:12px; font-weight:600; }
        .agent-card .role { font-size:10px; color:rgba(255,255,255,0.4); }
        .agent-card .status-dot { width:6px; height:6px; border-radius:50%; background:#00ff87; flex-shrink:0; }
        .os-win-body.monitor-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .monitor-card { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:8px; padding:12px; }
        .monitor-card .val { font-size:20px; font-weight:700; color:var(--neon,#00f0ff); }
        .monitor-card .lbl { font-size:10px; color:rgba(255,255,255,0.3); margin-top:2px; }
        @media (max-width:600px) { .os-window { left:10px !important; width:calc(100vw - 20px) !important; } .os-desktop-icons { gap:8px; } .os-desktop-icon { width:60px; } .os-start-menu { width:calc(100vw - 20px); left:10px; } }
      </style>
      <div id="os-desktop">
        <canvas id="os-three-bg"></canvas>
        <div class="os-desktop-icons" id="os-desktop-icons"></div>
        <div class="os-welcome" id="os-welcome">
          <h1>Trinnity Viseron OS</h1>
          <p id="os-welcome-desc" data-i18n="welcome_desc">Multi-Agent Superintelligence Operating System</p>
        </div>
      </div>
      <div class="os-taskbar">
        <button class="os-start-btn" id="os-start-btn"><span>◈</span> <span data-i18n="start">Sistema</span></button>
        <div class="os-taskbar-apps" id="os-taskbar-apps"></div>
        <div class="os-taskbar-right">
          <button class="os-tray-btn" onclick="window.__voiceWidgetSetSpeaker('pedro');window.__webosSetSpeaker('pedro')" title="Pedro">⚔️</button>
          <button class="os-tray-btn" onclick="window.__voiceWidgetSetSpeaker('trinnity');window.__webosSetSpeaker('trinnity')" title="Trinnity">👑</button>
          <button class="os-tray-btn" onclick="if(window.__voiceWidgetToggle)window.__voiceWidgetToggle()" title="Voice">🎤</button>
          <button class="os-tray-btn" onclick="if(window.__webosPrevLang)window.__webosPrevLang()" id="os-lang-btn">${lang.toUpperCase()}</button>
          <div class="os-clock" id="os-clock"></div>
        </div>
      </div>
      <div class="os-start-menu" id="os-start-menu">
        <div class="os-start-search"><input id="os-start-input" data-i18n-placeholder="start_placeholder" placeholder="Digite um comando ou pesquise..." oninput="window.__webosStartSearch(this.value)"></div>
        <div class="os-start-apps" id="os-start-apps"></div>
        <div class="os-start-footer">
          <select id="os-lang-select" onchange="window.__webosSetLang(this.value);lang=this.value;document.getElementById('os-lang-btn').textContent=this.value.toUpperCase()">
            <option value="pt">🇧🇷 Português</option>
            <option value="en">🇺🇸 English</option>
            <option value="es">🇪🇸 Español</option>
          </select>
        </div>
      </div>
    `;
    document.body.appendChild(os);
    if (window.__tvsHideShell) window.__tvsHideShell(); // lazy loading (Issue #5): shell -> OS real

    initThree();
    initClock();
    populateDesktop();
    populateStartMenu();
    setupStartMenu();

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.os-start-btn') && !e.target.closest('.os-start-menu')) {
        document.getElementById('os-start-menu').classList.remove('open');
      }
    });

    document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
    const ph = document.getElementById('os-start-input');
    if (ph) ph.placeholder = t('start_placeholder');

    if (typeof io !== 'undefined') {
      try {
        socket = io(getApiBase(), { path: '/api/socket.io' });
        socket.on('system:info', (data) => { if (data.agents) agentsCache = data.agents; });
      } catch (e) {}
    }
    refreshStats();
    setInterval(refreshStats, 10000);
  }

  function initThree() {
    const c = document.getElementById('os-three-bg');
    if (!c || typeof THREE === 'undefined') return;
    if (c.dataset.threeInit === '1') return; // evita duplicar o renderer quando o THREE carrega lazy
    c.dataset.threeInit = '1';
    try {      const s = new THREE.Scene();
      const a = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true });
      r.setSize(window.innerWidth, window.innerHeight);
      r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const g = new THREE.Group(); s.add(g);
      const shapes = [
        { geo: new THREE.TorusKnotGeometry(1.2, 0.3, 128, 16), color: 0x00f0ff, x: -2.5, y: 0.5, z: -3, s: 0.6, opacity: 0.12 },
        { geo: new THREE.IcosahedronGeometry(1, 0), color: 0xbf5af2, x: 2.8, y: -0.8, z: -4, s: 0.5, opacity: 0.08 },
        { geo: new THREE.TorusGeometry(1, 0.2, 32, 64), color: 0x00f0ff, x: 0, y: 1.5, z: -5, s: 0.7, opacity: 0.06 }
      ];
      shapes.forEach(sh => {
        const m = new THREE.Mesh(sh.geo, new THREE.MeshBasicMaterial({ color: sh.color, wireframe: true, transparent: true, opacity: sh.opacity }));
        m.position.set(sh.x, sh.y, sh.z); m.scale.set(sh.s, sh.s, sh.s); g.add(m);
      });
      const pGeo = new THREE.BufferGeometry();
      const pos = new Float32Array(800 * 3);
      for (let i = 0; i < 800 * 3; i++) pos[i] = (Math.random() - 0.5) * 20;
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const ps = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.02, transparent: true, opacity: 0.3 }));
      ps.position.z = -5; g.add(ps);
      a.position.z = 5;
      let mx = 0, my = 0;
      document.addEventListener('mousemove', e => { mx = (e.clientX / window.innerWidth - 0.5) * 2; my = (e.clientY / window.innerHeight - 0.5) * 2; });
      function an() { requestAnimationFrame(an); g.children.forEach((ch, i) => { if (i < shapes.length) { ch.rotation.x += 0.002 + i * 0.001; ch.rotation.y += 0.004 - i * 0.001; } }); g.rotation.x += (my * 0.02 - g.rotation.x) * 0.02; g.rotation.y += (mx * 0.02 - g.rotation.y) * 0.02; r.render(s, a); }
      an();
      window.addEventListener('resize', () => { a.aspect = window.innerWidth / window.innerHeight; a.updateProjectionMatrix(); r.setSize(window.innerWidth, window.innerHeight); });
    } catch (e) { console.log('Three.js error:', e); }
  }

  function initClock() {
    function update() { const d = new Date(); document.getElementById('os-clock').textContent = d.toLocaleTimeString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' }); }
    update(); setInterval(update, 10000);
  }

  const apps = [
    { id: 'terminal', icon: '⬛', titleKey: 'terminal', handler: (body) => { body.style.background = '#0a0a0e'; body.style.fontFamily = "'JetBrains Mono',monospace"; body.style.fontSize = '12px'; body.style.color = '#00f0ff'; body.innerHTML = '<div class=\'terminal-line\'>Trinnity Viseron OS Terminal v7.0</div><div class=\'terminal-line\'>Type <span style=\'color:#fff\'>help</span> for commands.</div><div id=\'term-output\'></div><div class=\'term-input-row\'><span class=\'terminal-prompt\'>$</span><input id=\'term-input\' autofocus></div>'; const out = document.getElementById('term-output'); const inp = document.getElementById('term-input'); inp.addEventListener('keydown', async (e) => { if (e.key !== 'Enter' || !inp.value) return; const cmd = inp.value; inp.value = ''; out.innerHTML += '<div class=\'terminal-line\'><span class=\'terminal-prompt\'>$</span> ' + cmd + '</div>'; const lower = cmd.toLowerCase(); if (lower === 'help' || lower === '?') { out.innerHTML += '<div class=\'terminal-line\'>help, status, agents, clear, voice, plan, token, lang, time</div>'; } else if (lower === 'clear') { out.innerHTML = ''; } else if (lower === 'status' || lower === 'stats') { const s = statsCache; out.innerHTML += '<div class=\'terminal-line\'>Agents: ' + (s.totalAgents || 'N/A') + ' | Minds: ' + (s.archetypesLoaded || 'N/A') + ' | Int: ' + (s.superMindKnowledge || 'N/A') + '</div>'; } else if (lower === 'agents' || lower === 'agent') { out.innerHTML += '<div class=\'terminal-line\'>' + (agentsCache.length || 0) + ' agents registered</div>'; } else if (cmd.startsWith('say ')) { const txt = cmd.slice(4); if (window.__voiceWidgetSendCommand) window.__voiceWidgetSendCommand(txt, currentSpeaker); out.innerHTML += '<div class=\'terminal-line\'>Voice: ' + txt + '</div>'; } else { out.innerHTML += '<div class=\'terminal-line\'>Unknown: ' + cmd + '</div>'; } out.scrollTop = out.scrollHeight; }); setTimeout(() => inp.focus(), 100); } },
    { id: 'monitor', icon: '📊', titleKey: 'monitor', handler: (body) => { body.className = 'os-win-body monitor-grid'; body.innerHTML = '<div class=\'monitor-card\'><div class=\'val\' data-stat=\'totalAgents\'>—</div><div class=\'lbl\' data-i18n=\'agents_count\'>Agentes</div></div><div class=\'monitor-card\'><div class=\'val\' data-stat=\'archetypesLoaded\'>—</div><div class=\'lbl\'>Minds</div></div><div class=\'monitor-card\'><div class=\'val\' data-stat=\'superMindKnowledge\'>—</div><div class=\'lbl\'>Inteligência</div></div><div class=\'monitor-card\'><div class=\'val\' data-stat=\'evolutionCycles\'>—</div><div class=\'lbl\'>Evoluções</div></div>'; refreshStats(); } },
    { id: 'agents', icon: '🤖', titleKey: 'agents', handler: (body) => { body.innerHTML = '<div style="margin-bottom:8px;font-size:11px;color:rgba(255,255,255,0.4)" id="agent-count">' + (agentsCache.length || 0) + ' agents</div><div id="agent-list"></div>'; function render() { const list = document.getElementById('agent-list'); if (!list) return; list.innerHTML = ''; const ags = agentsCache.slice(0, 50); ags.forEach(a => { list.innerHTML += '<div class=\'agent-card\'><div class=\'status-dot\'></div><div><div class=\'name\'>' + a.name + '</div><div class=\'role\'>' + (a.role || a.id || '') + '</div></div></div>'; }); } render(); setTimeout(render, 500); } },
    { id: 'voice', icon: '🎤', titleKey: 'voice', handler: (body) => { body.innerHTML = '<div style="text-align:center;padding:20px"><div style="font-size:40px;margin-bottom:12px">🎤</div><p style="font-size:14px;font-weight:600;margin-bottom:4px">JARVIS Voice</p><p style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:12px" data-i18n="welcome_desc">Voice commands. Select speaker in taskbar.</p><div style="display:flex;gap:8px;justify-content:center"><button onclick="if(window.__voiceWidgetToggle)window.__voiceWidgetToggle()" style="padding:8px 20px;border-radius:6px;background:rgba(0,240,255,0.1);border:1px solid rgba(0,240,255,0.2);color:#00f0ff;cursor:pointer;font-size:12px">Open Voice Panel</button></div></div>'; } },
    { id: 'token', icon: '💰', titleKey: 'token', handler: (body) => { body.innerHTML = '<div style="padding:10px"><div style="font-size:28px;font-weight:700;color:#00f0ff;margin-bottom:4px">300M $VSR</div><div style="font-size:20px;color:#bf5af2;margin-bottom:16px">1B $TRIN</div><div style="font-size:11px;color:rgba(255,255,255,0.4);line-height:1.6">Trinnity: 90M (30%)<br>Pedro: 75M (25%)<br>Legion: 90M (30%)<br>Reserve: 45M (15%)</div></div>'; } },
    { id: 'code', icon: '⌨️', titleKey: 'CODE', handler: (body) => {
      body.style.background = '#0a0a0e';
      body.innerHTML = `<div style="display:flex;flex-direction:column;height:100%">
        <div style="display:flex;gap:8px;padding:8px;border-bottom:1px solid rgba(255,255,255,0.06)">
          <button class="code-tab" data-tab="console" style="padding:6px 12px;border-radius:6px;border:1px solid rgba(0,240,255,0.2);background:rgba(0,240,255,0.1);color:#00f0ff;font-size:11px;cursor:pointer;font-weight:600">▷ Console</button>
          <button class="code-tab" data-tab="create" style="padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer">＋ Criar VISERON</button>
          <button class="code-tab" data-tab="agents" style="padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer">🤖 Agentes</button>
          <button class="code-tab" data-tab="apps" style="padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer">📚 Apps LLM</button>
        </div>
        <div id="code-console" style="flex:1;overflow-y:auto;font-family:'JetBrains Mono',monospace;font-size:12px;color:#00f0ff;padding:10px;line-height:1.6"></div>
        <div id="code-create" style="flex:1;display:none;overflow-y:auto;padding:10px"></div>
        <div id="code-agents" style="flex:1;display:none;overflow-y:auto;padding:10px"></div>
        <div id="code-apps" style="flex:1;display:none;overflow-y:auto;padding:10px"></div>
        <div style="display:flex;gap:6px;padding:8px;border-top:1px solid rgba(255,255,255,0.06)">
          <input id="code-input" placeholder="Comando... (help)" style="flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:8px 10px;color:#00f0ff;font-family:'JetBrains Mono',monospace;font-size:12px;outline:none">
          <button id="code-run" style="padding:6px 14px;border-radius:6px;background:rgba(0,240,255,0.12);border:1px solid rgba(0,240,255,0.25);color:#00f0ff;font-size:12px;cursor:pointer;font-weight:700">RUN</button>
        </div>
      </div>`;
      const consoleEl = document.getElementById('code-console');
      const createEl = document.getElementById('code-create');
      const agentsEl = document.getElementById('code-agents');
      const appsEl = document.getElementById('code-apps');
      const input = document.getElementById('code-input');
      const base = getApiBase();
      const tabs = body.querySelectorAll('.code-tab');
      const log = (html) => { if (consoleEl) { consoleEl.innerHTML += html + '<br>'; consoleEl.scrollTop = consoleEl.scrollHeight; } };
      const clear = () => { if (consoleEl) consoleEl.innerHTML = ''; };
      tabs.forEach(tab => tab.onclick = () => {
        tabs.forEach(t => { t.style.background = 'transparent'; t.style.color = 'rgba(255,255,255,0.5)'; });
        tab.style.background = 'rgba(0,240,255,0.1)'; tab.style.color = '#00f0ff';
        consoleEl.style.display = tab.dataset.tab === 'console' ? 'block' : 'none';
        createEl.style.display = tab.dataset.tab === 'create' ? 'block' : 'none';
        agentsEl.style.display = tab.dataset.tab === 'agents' ? 'block' : 'none';
        appsEl.style.display = tab.dataset.tab === 'apps' ? 'block' : 'none';
        if (tab.dataset.tab === 'agents') renderAgents();
        if (tab.dataset.tab === 'apps') renderApps();
      });
      const renderAgents = async () => {
        if (!agentsEl) return;
        agentsEl.innerHTML = skeletonAgents();
        try {
          const r = await fetch(base + '/api/code/agents');
          const d = await r.json();
          if (!d.agents || !d.agents.length) { agentsEl.innerHTML = '<div class="tvs-empty"><div class="tvs-empty-icon">🤖</div><div class="tvs-empty-title">Nenhum agente</div><div class="tvs-empty-hint">Ainda não há agentes registados.</div></div>'; return; }
          agentsEl.innerHTML = d.agents.map(a => `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:6px;margin:3px 0">
            <span style="width:6px;height:6px;border-radius:50%;background:${a.status === 'ACTIVE' ? '#00ff87' : '#ff2d55'}"></span>
            <div style="flex:1"><div style="font-size:12px;font-weight:600;color:#e4e4f0">${a.name}</div><div style="font-size:10px;color:rgba(255,255,255,0.4)">${a.role}</div></div>
            <button data-run="${a.id}" style="padding:4px 10px;border-radius:4px;background:rgba(0,240,255,0.1);border:1px solid rgba(0,240,255,0.2);color:#00f0ff;font-size:10px;cursor:pointer">▶ Executar</button>
          </div>`).join('');
          agentsEl.querySelectorAll('[data-run]').forEach(btn => btn.onclick = () => {
            const id = btn.dataset.run;
            tabs.forEach(t => { t.style.background = 'transparent'; t.style.color = 'rgba(255,255,255,0.5)'; });
            consoleEl.style.display = 'block'; createEl.style.display = 'none'; agentsEl.style.display = 'none';
            input.value = 'run ' + id + ' Análise o estado atual do sistema VISERON e gere um relatório conciso.';
            input.focus();
          });
        } catch (e) { agentsEl.innerHTML = '<div style="color:#ff2d55;font-size:12px">Erro a carregar agentes</div>'; }
      };
      const renderApps = async () => {
        if (!appsEl) return;
        const apps = [
          { id: 'deep-research', icon: '🔎', name: 'Deep Research', desc: 'Investigação profunda com relatório final e fontes.' },
          { id: 'rag-local', icon: '📚', name: 'Local RAG', desc: 'Pergunta aos teus documentos com IA 100% local.' },
          { id: 'mixture-of-agents', icon: '⚗️', name: 'Mixture of Agents', desc: 'Vários modelos respondem, o agregador escolhe a melhor.' },
          { id: 'multi-agent-team', icon: '👥', name: 'Multi-Agent Team', desc: 'Equipa de especialistas que planifica e executa projetos.' },
          { id: 'self-evolving', icon: '🧬', name: 'Self-Evolving', desc: 'O agente reescreve os próprios prompts para melhorar.' },
          { id: 'always-on-briefing', icon: '📡', name: 'Always-On Briefing', desc: 'Vigia fontes e envia brief diário por email.' },
          { id: 'voice-rag', icon: '🎙️', name: 'Voice RAG', desc: 'Pergunta aos documentos falando.' },
          { id: 'generative-ui', icon: '🖼️', name: 'Generative UI', desc: 'Gera interfaces interativas por linguagem natural.' },
        ];
        let html = '<div style="color:rgba(255,255,255,0.4);font-size:11px;margin-bottom:8px">Catálogo de Apps LLM (inspirado em awesome-llm-apps). Cria uma mente com o blueprint e executa-a:</div>';
        apps.forEach(a => {
          html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:6px;margin:3px 0">
            <span style="font-size:16px">${a.icon}</span>
            <div style="flex:1"><div style="font-size:12px;font-weight:600;color:#e4e4f0">${a.name}</div><div style="font-size:10px;color:rgba(255,255,255,0.4)">${a.desc}</div></div>
            <button data-app="${a.id}" data-name="${a.name}" data-desc="${a.desc}" style="padding:4px 10px;border-radius:4px;background:rgba(0,240,255,0.1);border:1px solid rgba(0,240,255,0.2);color:#00f0ff;font-size:10px;cursor:pointer">⚡ Criar</button>
          </div>`;
        });
        html += '<div id="code-app-msg" style="margin-top:8px;font-size:11px;color:rgba(255,255,255,0.4)"></div>';
        appsEl.innerHTML = html;
        appsEl.querySelectorAll('[data-app]').forEach(btn => btn.onclick = async () => {
          const msg = document.getElementById('code-app-msg');
          msg.style.color = 'rgba(255,255,255,0.4)';
          msg.textContent = 'A criar mente ' + btn.dataset.name + '...';
          try {
            const r = await fetch(base + '/api/code/create-agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: btn.dataset.name, role: btn.dataset.desc, capabilities: btn.dataset.app.replace(/-/g, '_') + ', llm_app, ai_agent', systemPrompt: 'Eres ' + btn.dataset.name + ', un agente LLM especializado en ' + btn.dataset.desc + '. Inspirado en awesome-llm-apps, operando dentro de Trinnity Viseron System bajo el mando de Pedro (tvs_creator) y Trinnity (tvs_architect). Analiza cada tarea con rigor y entrega resultados prácticos y accionables. Responde en español.' }) });
            const d = await r.json();
            if (d.ok) {
              msg.style.color = '#00ff87';
              msg.textContent = '✓ Mente criada: ' + d.agent.name + ' (' + d.agent.id + ')';
              tabs.forEach(t => { t.style.background = 'transparent'; t.style.color = 'rgba(255,255,255,0.5)'; });
              consoleEl.style.display = 'block'; createEl.style.display = 'none'; agentsEl.style.display = 'none'; appsEl.style.display = 'none';
              input.value = 'run ' + d.agent.id + ' Demonstra as tuas capacidades com um exemplo prático.';
              input.focus();
            } else {
              msg.style.color = '#ff2d55';
              msg.textContent = '✗ ' + (d.error || 'erro');
            }
          } catch (e) { msg.style.color = '#ff2d55'; msg.textContent = '✗ Erro de ligação'; }
        });
      };
      const renderCreate = async () => {
        if (!createEl) return;
        let html = '<div style="color:rgba(255,255,255,0.4);font-size:11px;margin-bottom:8px">Criar uma nova mente VISERON. Escolhe um blueprint ou configura à mão:</div>';
        try {
          const r = await fetch(base + '/api/code/blueprints');
          const d = await r.json();
          const bps = d.blueprints || [];
          html += '<select id="code-bp" style="width:100%;padding:8px;border-radius:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e4e4f0;font-size:12px;margin-bottom:10px;outline:none">';
          html += '<option value="">— Blueprint (opcional) —</option>';
          bps.forEach(b => { html += '<option value="' + b.blueprint + '">' + b.name + ' — ' + b.role + '</option>'; });
          html += '</select>';
        } catch (e) {}
        html += '<input id="code-name" placeholder="Nome (ex: NovaMente)" style="width:100%;padding:8px;border-radius:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e4e4f0;font-size:12px;margin-bottom:8px;outline:none">';
        html += '<input id="code-role" placeholder="Rol (ex: Engenheiro de IA)" style="width:100%;padding:8px;border-radius:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e4e4f0;font-size:12px;margin-bottom:8px;outline:none">';
        html += '<input id="code-caps" placeholder="Capacidades (vírgulas)" style="width:100%;padding:8px;border-radius:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e4e4f0;font-size:12px;margin-bottom:8px;outline:none">';
        html += '<textarea id="code-prompt" placeholder="System prompt (personalidade/missão)" rows="4" style="width:100%;padding:8px;border-radius:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e4e4f0;font-size:12px;margin-bottom:10px;outline:none;resize:vertical;font-family:inherit"></textarea>';
        html += '<button id="code-create-btn" style="width:100%;padding:9px;border-radius:6px;background:rgba(191,90,242,0.15);border:1px solid rgba(191,90,242,0.3);color:#bf5af2;font-size:13px;cursor:pointer;font-weight:700">⚡ Criar Mente VISERON</button>';
        html += '<div id="code-create-msg" style="margin-top:8px;font-size:11px;color:rgba(255,255,255,0.4)"></div>';
        createEl.innerHTML = html;
        document.getElementById('code-create-btn').onclick = async () => {
          const msg = document.getElementById('code-create-msg');
          msg.textContent = 'A criar...';
          const bp = document.getElementById('code-bp').value;
          const body2 = bp ? { blueprint: bp } : {
            name: document.getElementById('code-name').value.trim(),
            role: document.getElementById('code-role').value.trim(),
            capabilities: document.getElementById('code-caps').value.trim(),
            systemPrompt: document.getElementById('code-prompt').value.trim(),
          };
          try {
            const r = await fetch(base + '/api/code/create-agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body2) });
            const d = await r.json();
            if (d.ok) { msg.style.color = '#00ff87'; msg.textContent = '✓ Mente criada: ' + d.agent.name + ' (' + d.agent.role + ') — id: ' + d.agent.id; input.value = 'run ' + d.agent.id + ' Apresenta-te e descreve a tua missão.'; }
            else { msg.style.color = '#ff2d55'; msg.textContent = '✗ ' + (d.error || 'erro'); }
          } catch (e) { msg.style.color = '#ff2d55'; msg.textContent = '✗ Erro de ligação'; }
        };
      };
      const execCommand = async (cmd) => {
        log('<span style="color:rgba(255,255,255,0.3)">$ ' + cmd.replace(/</g,'&lt;') + '</span>');
        const lower = cmd.toLowerCase().trim();
        const parts = cmd.trim().split(/\s+/);
        if (lower === 'help' || lower === '?') {
          log('Comandos: <span style="color:#fff">status · agents · blueprints · create &lt;nome&gt;|&lt;rol&gt; · run &lt;agentId&gt; &lt;tarefa&gt; · clear</span>');
        } else if (lower === 'clear') { clear(); }
        else if (lower === 'status') {
          try { const r = await fetch(base + '/api/code/system'); const d = await r.json(); log('Core: ' + d.core + ' v' + d.version + ' — <span style="color:#00ff87">' + d.status + '</span>'); log('Agentes: ' + d.agents.total + ' (ativos: ' + d.agents.active + ') · Squads: ' + (d.squads||[]).length + ' · Blueprints: ' + d.blueprintsCount); if (d.intelligence) log('Inteligência: ' + JSON.stringify(d.intelligence)); }
          catch (e) { log('<span style="color:#ff2d55">ERRO</span>'); }
        }
        else if (lower === 'agents') {
          try { const r = await fetch(base + '/api/code/agents'); const d = await r.json(); log('Agentes registados (' + d.total + '):'); (d.agents||[]).forEach(a => log('  · ' + a.id + ' <span style="color:#fff">' + a.name + '</span> — ' + a.role + ' [' + a.status + ']')); }
          catch (e) { log('<span style="color:#ff2d55">ERRO</span>'); }
        }
        else if (lower === 'blueprints') {
          try { const r = await fetch(base + '/api/code/blueprints'); const d = await r.json(); log('Blueprints (' + d.total + '):'); (d.blueprints||[]).forEach(b => log('  · ' + b.blueprint + ' — <span style="color:#fff">' + b.name + '</span> (' + b.role + ')')); }
          catch (e) { log('<span style="color:#ff2d55">ERRO</span>'); }
        }
        else if (parts[0].toLowerCase() === 'create' && parts.length >= 3) {
          const name = parts[1]; const role = parts.slice(2).join(' ');
          try { const r = await fetch(base + '/api/code/create-agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, role }) }); const d = await r.json(); if (d.ok) log('<span style="color:#00ff87">✓ Mente criada:</span> ' + d.agent.name + ' (' + d.agent.role + ') — ' + d.agent.id); else log('<span style="color:#ff2d55">✗ ' + (d.error||'erro') + '</span>'); }
          catch (e) { log('<span style="color:#ff2d55">ERRO</span>'); }
        }
        else if (parts[0].toLowerCase() === 'run' && parts.length >= 2) {
          const agentId = parts[1]; const task = parts.slice(2).join(' ') || 'Analisa o estado do sistema e sugere melhorias.';
          log('▶ A executar ' + agentId + '...');
          try { const r = await fetch(base + '/api/code/run-agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId, task }) }); const d = await r.json(); if (d.ok && d.result) log('<span style="color:#bf5af2">[' + d.result.agentName + ']</span> ' + d.result.output + (d.result.executionTimeMs ? ' <span style="color:rgba(255,255,255,0.3)">(' + d.result.executionTimeMs + 'ms)</span>' : '')); else log('<span style="color:#ff2d55">✗ ' + (d.error || 'falhou') + '</span>'); }
          catch (e) { log('<span style="color:#ff2d55">✗ Erro de ligação</span>'); }
        }
        else if (lower === 'create') { log('Uso: <span style="color:#fff">create &lt;Nome&gt; &lt;Rol&gt;</span> — ex: create NovaMente Engenheiro'); }
        else { log('<span style="color:#ff2d55">Comando desconhecido.</span> Usa <span style="color:#fff">help</span>'); }
      };
      const runBtn = document.getElementById('code-run');
      runBtn.onclick = () => { const v = input.value.trim(); if (v) { execCommand(v); input.value = ''; } };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { runBtn.click(); } });
      renderCreate();
      log('Trinnity VISERON CODE Platform v7.0 — <span style="color:#fff">help</span> para comandos.');
      log('Cria mentes VISERON, executa agentes e opera o sistema em tempo real.');
      input.focus();
    } },
    { id: 'automation', icon: '⚙️', titleKey: 'Automation', handler: (body) => {
      body.style.background = '#0a0a0e';
      let html = '<div class="wf-header" style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:11px;color:rgba(255,255,255,0.4);display:flex;justify-content:space-between;align-items:center"><span>n8n Workflow Engine</span><span id="wf-status" style="color:#00ff87">● Local</span></div><div id="wf-list" style="padding:6px;overflow-y:auto;flex:1">Loading...</div>';
      body.innerHTML = html;
      async function loadWorkflows() {
        const list = document.getElementById('wf-list');
        if (!list) return;
        list.innerHTML = skeletonTable();
        try {
          const base = getApiBase();
          const res = await fetch(base + '/api/workflows').catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            renderWorkflows(list, data.workflows || []);
          } else {
            renderFallbackWorkflows(list);
          }
        } catch (e) {
          renderFallbackWorkflows(list);
        }
      }
      function renderWorkflows(list, wfs) {
        list.innerHTML = '';
        wfs.forEach(w => {
          const card = document.createElement('div');
          card.style.cssText = 'margin:4px;padding:8px 10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;font-size:11px;cursor:pointer;transition:all 0.2s';
          card.innerHTML = '<div style="font-weight:600;color:#e4e4f0;margin-bottom:2px">' + w.name + '</div><div style="color:rgba(255,255,255,0.4);margin-bottom:4px">' + (w.description || '') + '</div><div style="display:flex;gap:4px">' + (w.triggers || []).map(t => '<span style="padding:1px 6px;background:rgba(0,240,255,0.08);border-radius:4px;font-size:10px;color:#00f0ff">' + t + '</span>').join('') + '</div><div style="margin-top:6px"><button class="wf-run-btn" style="padding:4px 12px;border-radius:4px;background:rgba(0,240,255,0.1);border:1px solid rgba(0,240,255,0.2);color:#00f0ff;cursor:pointer;font-size:10px">▶ Run</button><span class="wf-result" style="margin-left:8px;font-size:10px;color:rgba(255,255,255,0.3)"></span></div>';
          card.onmouseenter = () => card.style.background = 'rgba(255,255,255,0.06)';
          card.onmouseleave = () => card.style.background = 'rgba(255,255,255,0.03)';
          card.querySelector('.wf-run-btn').onclick = async (ev) => {
            ev.stopPropagation();
            const btn = ev.target;
            const resSpan = card.querySelector('.wf-result');
            btn.textContent = '⏳';
            btn.disabled = true;
            try {
              const base = getApiBase();
              const r = await fetch(base + '/api/workflows/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workflowId: w.id, data: { trigger: 'manual' } }) });
              const d = await r.json();
              resSpan.textContent = d.success ? '✓ ' + (d.executionTime || 0) + 'ms' : '✗ ' + (d.error || '');
            } catch (e) { resSpan.textContent = '✗ error'; }
            btn.textContent = '▶ Run';
            btn.disabled = false;
          };
          list.appendChild(card);
        });
      }
      function renderFallbackWorkflows(list) {
        const fallback = [
          { id: 'wf_agent_spawn', name: 'Spawn Agent', description: 'Spawn agent on demand via webhook', triggers: ['voice:command', 'api:request'] },
          { id: 'wf_voice_processor', name: 'Voice Processor', description: 'Route voice commands through AI', triggers: ['voice:command'] },
          { id: 'wf_report_generator', name: 'Report Generator', description: 'Generate PDF reports', triggers: ['schedule', 'api:request'] },
          { id: 'wf_auto_evolve', name: 'Auto-Evolution', description: 'Trigger evolution cycles based on metrics', triggers: ['schedule', 'metric:threshold'] }
        ];
        renderWorkflows(list, fallback);
      }
      loadWorkflows();
    } }
  ];

  function populateDesktop() {
    const container = document.getElementById('os-desktop-icons');
    apps.forEach(a => {
      const el = document.createElement('div');
      el.className = 'os-desktop-icon';
      el.innerHTML = '<div class="icon">' + a.icon + '</div><div class="label">' + t(a.titleKey) + '</div>';
      el.onclick = () => createWindow(a.id, { title: t(a.titleKey), icon: a.icon, w: 520, h: 380, content: a.handler });
      container.appendChild(el);
    });
  }

  function populateStartMenu() {
    const grid = document.getElementById('os-start-apps');
    apps.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'os-start-app';
      btn.innerHTML = '<span class="icon">' + a.icon + '</span><span>' + t(a.titleKey) + '</span>';
      btn.onclick = () => { document.getElementById('os-start-menu').classList.remove('open'); createWindow(a.id, { title: t(a.titleKey), icon: a.icon, w: 520, h: 380, content: a.handler }); };
      grid.appendChild(btn);
    });
  }

  function setupStartMenu() {
    document.getElementById('os-start-btn').onclick = () => {
      document.getElementById('os-start-menu').classList.toggle('open');
      setTimeout(() => document.getElementById('os-start-input').focus(), 100);
    };
  }

  window.__webosStartSearch = function(v) {
    const items = document.querySelectorAll('.os-start-app');
    items.forEach(el => { el.style.display = el.textContent.toLowerCase().includes(v.toLowerCase()) ? 'flex' : 'none'; });
  };

  window.__webosPrevLang = function() {
    const langs = ['pt', 'en', 'es'];
    const idx = langs.indexOf(lang);
    const next = langs[(idx + 1) % langs.length];
    document.getElementById('os-lang-select').value = next;
    window.__webosSetLang(next);
    lang = next;
    document.getElementById('os-lang-btn').textContent = next.toUpperCase();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildOS);
  else buildOS();

  // Re-inicializa o background 3D quando o THREE carrega lazy (Issue #5).
  window.__tvsWebosThreeReady = function () { if (typeof initThree === 'function') initThree(); };
})();

/* ── Skeleton helpers (Issue #4) ──────────────────────────── */
function skeletonAgents() {
  let h = '';
  for (let i = 0; i < 6; i++) {
    h += '<div class="tvs-skeleton-agent"><div class="tvs-skeleton tvs-skeleton-avatar"></div><div style="flex:1"><div class="tvs-skeleton tvs-skeleton-text" style="width:40%"></div><div class="tvs-skeleton tvs-skeleton-text-sm"></div></div></div>';
  }
  return h;
}
function skeletonTable() {
  let h = '<div class="tvs-skeleton-table">';
  h += '<div class="tvs-skeleton-table-row tvs-skeleton-table-header"><div class="tvs-skeleton tvs-skeleton-text"></div><div class="tvs-skeleton tvs-skeleton-text"></div><div class="tvs-skeleton tvs-skeleton-text"></div><div class="tvs-skeleton tvs-skeleton-text"></div></div>';
  for (let i = 0; i < 5; i++) {
    h += '<div class="tvs-skeleton-table-row"><div class="tvs-skeleton tvs-skeleton-text"></div><div class="tvs-skeleton tvs-skeleton-text"></div><div class="tvs-skeleton tvs-skeleton-text"></div><div class="tvs-skeleton tvs-skeleton-text-sm"></div></div>';
  }
  return h + '</div>';
}
function skeletonDashboard() {
  let h = '<div class="tvs-skeleton-dashboard">';
  for (let i = 0; i < 4; i++) {
    h += '<div class="tvs-skeleton tvs-skeleton-stat"><div class="tvs-skeleton tvs-skeleton-text-xl"></div><div class="tvs-skeleton tvs-skeleton-text-sm"></div></div>';
  }
  h += '</div><div class="tvs-skeleton tvs-skeleton-chart tvs-mt-4"></div>';
  return h;
}
window.__tvsSkeleton = { agents: skeletonAgents, table: skeletonTable, dashboard: skeletonDashboard };
