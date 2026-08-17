(function () {
  if (window.__jarvisChatLoaded) return;
  window.__jarvisChatLoaded = true;

  var CONFIG = {
    apiBase: (window.__jarvisApiBase) || null,
    title: 'JARVIS',
    subtitle: 'Cerebro del TVS · conocimiento real del proyecto',
    placeholder: 'Preguntame sobre el sistema, los tokens, los planes...',
  };
  if (window.__jarvisConfig) Object.assign(CONFIG, window.__jarvisConfig);

  /* ============ CEREBRO TVS (conocimiento del proyecto) ============ */
  var CEREBRO = [
    {k:['hola','buenas','saludos','hey','oi','ola'],r:'Hola, comandante. Soy JARVIS, el cerebro de ejecucion del TVS. Tengo 23 intents y conocimiento del sistema. Preguntame por <b>agentes</b>, <b>tokens</b>, <b>planes</b>, <b>misiones</b> o <b>status</b>.'},
    {k:['quien eres','jarvis','que eres'],r:'Soy <b>JARVIS</b>, el cerebro conversacional del Trinnity Viseron System: 23 intents, ejecuta herramientas reales, memoria persistente y supervisado por AIOX. Respondo desde el conocimiento real del proyecto.'},
    {k:['quien manda','quienes son','pedro','trinnity','fundador','dueño','autor','comandante','reina'],r:'La autoridad maxima del TVS: <b>Pedro Costa (Comandante Supremo)</b> y <b>Trinnity Hurtado (Chief Evolution Officer / Reina)</b>. Ellos firman cada go-live, cada decision final y cada mision.'},
    {k:['que es tvs','que es el proyecto','viseron system','trinnity viseron'],r:'<b>TVS</b> es una infraestructura de inteligencia artificial autonoma, evolutiva y auditable: coordina agentes especializados, memoria persistente, conocimiento estructurado, herramientas, integraciones y modelos de IA en una sola arquitectura. Opera 24/7.'},
    {k:['agente','squad','escuadra','aiox'],r:'<b>12 squads AIOX activas:</b> Architect, Dev, QA, DevOps, Data Engineer, Analyst, PM, PO, SM, UX Design Expert, Squad Creator y AIOX Master. Mas los nucleos: <b>JARVIS</b> (cerebro), <b>VISERON</b> (alma/gobernanza), <b>OMEGA</b> (kernel con 10 agentes nucleares: CEO, CTO, Finance, Sales, Research, Developer, DevOps, Security, Support, Vision) y <b>ATLAS</b> (tutor de ingles con voz).'},
    {k:['skill','skills','capacidad'],r:'El TVS indexa <b>21.000+ skills en 10 colecciones</b>, con 16 skills de workflow activas (full-sdc, wave-execute, architect-first, apply-qa-fixes, skill-creator...) sincronizadas a 7 IDEs: Claude, Codex, Gemini, Cursor, Copilot, Kimi y Antigravity.'},
    {k:['memoria','recuerda','ltm','aprende','aprendizaje'],r:'Memoria en 4 capas: <b>STM</b> (200 items/sesion), <b>LTM</b> (20.000 registros persistentes, 13,6 MB), <b>Knowledge</b> (Graphify: 4.278 nodos, 8.275 aristas, 282 comunidades) y <b>Experience</b>. El aprendizaje continuo esta auditado: 22/24 REAL, 0 MOCKED.'},
    {k:['modelo','ollama','openai','gemini','deepseek','llm','ia local'],r:'Cognicion multi-modelo: <b>LOCAL</b> (Ollama con Qwen 7b/3b, Llama, Mistral) + <b>CLOUD</b> (OpenAI, Anthropic, Gemini, DeepSeek, Grok) + <b>PRIVADO</b> (fine-tuned). El router OmniRoute elige por calidad, coste, latencia y privacidad.'},
    {k:['token','vsr','trin','cripto','crypto','moneda'],r:'<b>VSR (Viseron Crown):</b> 300M, gobernanza PoM, staking genera TRIN, burn 1% + seguridad 1%. <b>TRIN (Trinnity):</b> 420,69M, moneda de viaje, burn 2% por tx, anti-bot 0,5%. Redes: ETH · BSC · Solana. Contratos listos; salida a DEX en fase Genesis.'},
    {k:['dex','listar','liquidez','pool','precio','cotizar'],r:'Estado de salida a DEX: contratos <b>LISTOS</b> (ViseronCrown, Trinnity, Governance, Staking). Siguientes pasos: deploy en mainnet (BSC recomendado), liquidity pool en PancakeSwap/Uniswap/Raydium, lock de liquidez y luego indexacion en CoinGecko/CMC (fase 3).'},
    {k:['plan','precio','comprar','cuesta','suscripcion','pago'],r:'Planes: <b>TVS Starter 199€/mes</b> (terminal, misiones, juegos, explorador) · <b>TVS PRO 499€/mes</b> (+squads, monitor, soporte) · <b>TVS Enterprise 1.999€/mes</b> (+cripto, API, SLA). Extras: Skill Pack 99€, Squad 299€, Soporte 49€, Auditoria 199€. Compra en el <b>TVS OS</b> (boton ENTRAR).'},
    {k:['mision','misiones','trin ganar','recompensa'],r:'Hay <b>50 misiones</b> en el TVS OS repartidas en Genesis, Exploracion, Construccion, Cosmos, Comunidad y Cripto. Cada una da <b>TRIN</b> (de 10 a 1.000). La M50 "Mente Cosmica" da 1.000 TRIN.'},
    {k:['juego','juegos','jugar','miner','runner','quiz'],r:'3 juegos del cosmos: <b>Asteroid Miner</b> (captura TRIN, esquiva bombas), <b>Cosmos Runner</b> (esquiva escombros a velocidad warp) y <b>Quiz del Batallon</b> (10 preguntas del universo TVS). Records guardados en tu nave.'},
    {k:['roadmap','fase','futuro','siguiente'],r:'Roadmap: <b>Fase 1 Genesis</b> (deploy + liquidity pools + lock) &rarr; <b>Fase 2 Ascension</b> (staking, metaverso, airdrops) &rarr; <b>Fase 3 Exchange</b> (CoinGecko/CMC, CEXs, auditoria Hacken) &rarr; <b>Fase 4 Cosmos Mainnet</b> (bridge, L2 propio).'},
    {k:['auditoria','audit','prueba','test','verde','calidad'],r:'Auditoria 17/08/2026: <b>VERDE</b>. Manifests validos (12/199/215), QA del TVS OS 13/13, juegos 4/4, core tests 20/20, recovery 10/10, ejecucion paralela 2x (80 tareas/seg, 97% exito).'},
    {k:['servidor','server','n8n','upcloud','infraestructura','donde corre'],r:'Infraestructura real: servidor <b>UpCloud 194.62.96.26</b> (Windows Server 2025, 232 GB libres) con <b>n8n v2.34.6</b> (automatizaciones 24/7, puerto 5678), <b>Ollama</b> local, WSL 2.7.11, Vercel en produccion y GitHub publico (ViseronSystem).'},
    {k:['comando','terminal','tvs os','os','escritorio'],r:'El <b>TVS OS</b> (visor) es la consola web real: terminal con comandos (help, status, agentes, arbol, tokens, comprar), 12 ventanas, misiones, tienda y areas por plan. Se desbloquea al comprar el Viseron. Login maestro demo: maestro@tvs.vision / cosmos.'},
    {k:['gobernanza','etica','principio','seguridad'],r:'Gobernanza con <b>9 principios</b> (sabedoria, verdad, mayordomia, justicia, servicio, diligencia, humildad, liberalidad, fidelidad), 4 blockedKinds (fraude, hidden_fee, data_leak, seed_exposure) y 7 checks eticos por operacion.'},
    {k:['gracias','obrigado','thank','genial','perfecto'],r:'A tu servicio, comandante. El batallon sigue avanzando. &#128640;'},
    {k:['adios','hasta luego','chau','bye'],r:'Hasta pronto. JARVIS queda de guardia 24/7.'},
  ];
  var FALLBACK = 'No tengo esa respuesta exacta en mi base local, pero pregunta por: <b>agentes</b>, <b>tokens VSR/TRIN</b>, <b>planes y precios</b>, <b>misiones</b>, <b>juegos</b>, <b>roadmap</b>, <b>auditoria</b>, <b>servidor</b> o <b>comandos del TVS OS</b>.';

  function pensar(msg) {
    var m = msg.toLowerCase();
    var mejor = null, mejorScore = 0;
    CEREBRO.forEach(function (intent) {
      var score = 0;
      intent.k.forEach(function (kw) {
        if (m.indexOf(kw) >= 0) score += kw.length > 5 ? 2 : 1;
      });
      if (score > mejorScore) { mejorScore = score; mejor = intent; }
    });
    return mejorScore > 0 ? mejor.r : FALLBACK;
  }

  /* ============ UI ============ */
  var root = document.createElement('div');
  root.id = 'jarvis-chat-root';
  root.innerHTML = '\
    <style>\
      #jarvis-chat-root{font-family:"Inter","Segoe UI",sans-serif;}\
      .jchat-fab{position:fixed;left:20px;bottom:20px;width:56px;height:56px;border-radius:50%;border:1px solid rgba(0,240,255,.4);background:rgba(5,5,16,.95);color:#00f0ff;cursor:pointer;z-index:2147483646;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 8px 30px rgba(0,0,0,.6),0 0 20px rgba(0,240,255,.2);transition:transform .2s;}\
      .jchat-fab:hover{transform:scale(1.08);}\
      .jchat-fab .jchat-dot{position:absolute;top:-2px;right:-2px;width:14px;height:14px;border-radius:50%;background:#00ff87;border:2px solid #050510;animation:jchat-pulse 2s infinite;}\
      @keyframes jchat-pulse{0%,100%{opacity:1}50%{opacity:.3}}\
      .jchat-panel{display:none;position:fixed;left:20px;bottom:88px;width:380px;max-width:calc(100vw - 40px);height:520px;max-height:calc(100vh - 120px);border-radius:16px;border:1px solid rgba(0,240,255,.2);background:rgba(8,8,22,.97);backdrop-filter:blur(20px);z-index:2147483646;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.7),0 0 40px rgba(0,240,255,.08);}\
      .jchat-panel.open{display:flex;}\
      .jchat-header{padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:10px;background:rgba(0,240,255,.04);}\
      .jchat-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#00f0ff,#bf5af2);display:flex;align-items:center;justify-content:center;font-size:16px;color:#050510;font-weight:800;}\
      .jchat-name{font-size:14px;font-weight:700;color:#e4e4f0;}\
      .jchat-sub{font-size:11px;color:rgba(228,228,240,.5);}\
      .jchat-close{margin-left:auto;background:none;border:none;color:rgba(228,228,240,.6);cursor:pointer;font-size:18px;}\
      .jchat-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;}\
      .jchat-msg{max-width:85%;padding:10px 13px;border-radius:14px;font-size:13px;line-height:1.55;}\
      .jchat-msg.user{align-self:flex-end;background:linear-gradient(135deg,#00c8e8,#7a4be0);color:#fff;border-bottom-right-radius:4px;}\
      .jchat-msg.jar{align-self:flex-start;background:rgba(255,255,255,.07);color:#e4e4f0;border-bottom-left-radius:4px;}\
      .jchat-msg b{color:#00f0ff;}\
      .jchat-sugs{display:flex;gap:6px;flex-wrap:wrap;padding:0 12px 10px;}\
      .jchat-sugs button{background:rgba(0,240,255,.07);border:1px solid rgba(0,240,255,.2);color:#00f0ff;border-radius:99px;padding:5px 11px;font-size:11px;cursor:pointer;}\
      .jchat-sugs button:hover{background:rgba(0,240,255,.18);}\
      .jchat-in{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.06);}\
      .jchat-in input{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(0,240,255,.18);border-radius:99px;padding:10px 16px;color:#e4e4f0;font-size:13px;outline:none;}\
      .jchat-in button{background:linear-gradient(90deg,#00f0ff,#bf5af2);border:none;color:#050510;font-weight:800;border-radius:99px;padding:0 18px;cursor:pointer;}\
    </style>\
    <div class="jchat-fab" id="jchat-fab">&#129302;<span class="jchat-dot"></span></div>\
    <div class="jchat-panel" id="jchat-panel">\
      <div class="jchat-header"><div class="jchat-avatar">J</div><div><div class="jchat-name">' + CONFIG.title + '</div><div class="jchat-sub">' + CONFIG.subtitle + '</div></div><button class="jchat-close" id="jchat-close">&#10005;</button></div>\
      <div class="jchat-msgs" id="jchat-msgs"></div>\
      <div class="jchat-sugs" id="jchat-sugs">\
        <button>agentes</button><button>tokens</button><button>planes</button><button>misiones</button><button>auditoria</button><button>roadmap</button>\
      </div>\
      <div class="jchat-in"><input id="jchat-input" placeholder="' + CONFIG.placeholder + '"><button id="jchat-send">ENVIAR</button></div>\
    </div>';
  document.body.appendChild(root);

  var msgs = document.getElementById('jchat-msgs');
  function msg(texto, quien) {
    var d = document.createElement('div');
    d.className = 'jchat-msg ' + quien;
    d.innerHTML = texto;
    msgs.appendChild(d);
    msgs.scrollTop = 9e9;
  }
  function responder(texto) {
    msg(texto, 'user');
    setTimeout(function () { msg(pensar(texto), 'jar'); }, 450);
  }
  document.getElementById('jchat-fab').onclick = function () { document.getElementById('jchat-panel').classList.toggle('open'); };
  document.getElementById('jchat-close').onclick = function () { document.getElementById('jchat-panel').classList.remove('open'); };
  document.getElementById('jchat-send').onclick = function () {
    var i = document.getElementById('jchat-input');
    if (i.value.trim()) { responder(i.value.trim()); i.value = ''; }
  };
  document.getElementById('jchat-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') document.getElementById('jchat-send').click(); });
  document.querySelectorAll('#jchat-sugs button').forEach(function (b) {
    b.onclick = function () { responder(b.textContent); };
  });
  setTimeout(function () {
    if (!msgs.children.length) msg('Sistema TVS en linea. Preguntame lo que quieras del proyecto. <b>Agentes, tokens, planes, misiones, auditoria...</b>', 'jar');
  }, 800);
})();
