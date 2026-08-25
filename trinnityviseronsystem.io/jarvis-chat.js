(function () {
  if (window.__jarvisChatLoaded) return;
  window.__jarvisChatLoaded = true;

  var CONFIG = {
    apiBase: (window.__jarvisApiBase) || 'http://194.62.96.26:32123',
    title: 'JARVIS',
    subtitle: 'Cerebro del TVS v7.0.0 · IA local Ollama conectada',
    placeholder: 'Preguntame sobre el sistema, los tokens, los planes...',
  };
  if (window.__jarvisConfig) Object.assign(CONFIG, window.__jarvisConfig);
  var usaNube = false;
  function responderConCerebro(texto){
    fetch(CONFIG.apiBase + '/api/viseron/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message: texto})
    }).then(function(r){ return r.json(); })
    .then(function(j){
      if (j && j.text) {
        usaNube = true;
        var extra = '';
        if (j.provider && j.model) extra = '<div style="font-size:.62rem;color:#8a90ab;margin-top:4px">cerebro: '+j.provider+' · '+j.model+' · supervisado por AIOX</div>';
        msg(j.text + extra, 'jar');
      } else { msg(pensar(texto), 'jar'); }
    })
    .catch(function(){ msg(pensar(texto), 'jar'); });
  }

  /* ================= CEREBRO TVS v7.0.0 (README + sistema real) ================= */
  var CEREBRO = [
    {k:['hola','buenas','saludos','hey','oi','ola','hello','hi'],r:'Hola, comandante. Soy JARVIS, cerebro de ejecucion del TVS. Preguntame por <b>agentes</b>, <b>tokens</b>, <b>planes</b>, <b>misiones</b>, <b>arquitectura</b>, <b>auditoria</b> o <b>roadmap</b>.'},
    {k:['quien eres','jarvis','que eres','eres jarvis'],r:'Soy <b>JARVIS</b> (916 lineas), el cerebro conversacional del TVS: <b>23 intents</b>, ejecuto herramientas reales, memoria persistente y supervision de AIOX. El <b>VISERON</b> (246 lineas) es el alma del sistema (persona Stark + gobernanza biblica) y delega en mi la ejecucion.'},
    {k:['quien manda','quienes son','pedro','trinnity','fundador','dueño','autor','comandante','reina','jefe','ceo'],r:'La autoridad maxima: <b>Pedro Costa (Comandante Supremo)</b> y <b>Trinnity Hurtado (Chief Evolution Officer / Reina)</b>. Ellos firman cada go-live, cada decision final y cada mision. Nadie despliega sin su aprobacion.'},
    {k:['que es tvs','que es el proyecto','viseron system','trinnity viseron','sobre el proyecto','defineme'],r:'<b>TVS v7.0.0 (CONTROLLED-PILOT)</b> es una infraestructura de inteligencia autonoma, evolutiva y auditable: coordina agentes especializados, memoria persistente, conocimiento estructurado, herramientas, integraciones empresariales y modelos de IA en una sola arquitectura. Opera 24/7. Piensa, planea, investiga, programa, ejecuta, audita, aprende, corrige, crea y automatiza empresas.'},
    {k:['mision','objetivo','5000','mentes','estrellas','superinteligencia'],r:'La mision: construir una <b>superinteligencia artificial multi-agente con 5000+ mentes</b> y llevar el batallon a las estrellas. Cada agente cumple su mision, cada mision recompensa en TRIN.'},
    {k:['version','release','v7','7.0'],r:'Version actual: <b>v7.0.0 CONTROLLED-PILOT</b>. Arquitectura: Primary Node + infraestructura portatil. Runtime: multi-agente · multi-modelo · multi-tool · multi-interfaz.'},
    {k:['realidad','vision','reality','probado','evidencia'],r:'El proyecto sigue el <b>Reality Principle</b>: secciones [REALITY: PROVEN] solo con capacidades verificadas por auditorias independientes; [REALITY: VISION] es el objetivo declarado. Nada se reclama como operativo sin evidencia. Ejemplos PROVEN: aprendizaje continuo 22/24 REAL (0 MOCKED), ejecucion paralela 2x (80 tareas/seg, 97% exito), recovery 10/10, core tests 20/20.'},
    {k:['agente','squad','escuadra','nucleares','omega'],r:'Capas de inteligencia: <b>JARVIS</b> (cerebro, 23 intents), <b>VISERON</b> (alma/gobernanza), <b>OMEGA Platform</b> (kernel con <b>10 agentes nucleares</b>: CEO, CTO, Finance, Sales, Research, Developer, DevOps, Security, Support, Vision - con dispatch por API), <b>ATLAS</b> (tutor de ingles con voz), <b>12 squads AIOX</b> (architect, dev, qa, devops, data-engineer, analyst, pm, po, sm, ux, squad-creator, aiox-master) y <b>5 squads reales</b> con 15 dominios y 15 slots de miembros.'},
    {k:['skill','skills','capacidad','colecciones'],r:'<b>21.000+ skills indexadas en 10 colecciones</b> (vendored). 16 skills de workflow activas: aiox-commit, apply-qa-fixes, architect-first, checklist-runner, close-story, coderabbit-review, develop-story, full-sdc, mcp-builder, review-story, skill-creator, synapse, tech-search, validate-story-draft, wave-execute y graphify. Sincronizadas a 7 IDEs: Claude, Codex, Gemini, Cursor, Copilot, Kimi y Antigravity.'},
    {k:['memoria','recuerda','ltm','aprende','aprendizaje','record'],r:'Memoria en 4 capas (MemoryEngine v3.0 Hyper-Brain): <b>STM</b> (200 items/sesion, TTL 30 min), <b>LTM</b> (JSON persistente, 20.000 registros, 12,8 MB, full-text index), <b>Knowledge</b> (Graphify) y <b>Experience</b> (patrones aprendidos). El aprendizaje continuo esta auditado: 22/24 REAL.'},
    {k:['graphify','grafo','conocimiento','nodo','entidades'],r:'<b>Graphify</b> es la inteligencia de conocimiento: <b>4.278 nodos, 8.275 aristas, 282 comunidades</b> sobre el codebase completo. Modo AST-only (cero coste de API). Comandos: graphify query, path, explain, update. Integrado al OMEGA como Architecture Intelligence.'},
    {k:['rag','graphrag','recuperacion','retrieval'],r:'Pipeline de conocimiento: <b>RAG hibrido</b> (vector + keyword) y <b>GraphRAG</b> con recorrido BFS sobre 1.407 entidades. Busqueda semantica + estructural para respuestas con contexto.'},
    {k:['modelo','ollama','openai','gemini','deepseek','llm','ia local','grok','mistral','anthropic'],r:'Cognicion multi-modelo con <b>OmniRoute</b>: <b>LOCAL</b> (Ollama: Qwen 7b/3b, Llama, Mistral) + <b>CLOUD</b> (OpenAI, Anthropic, Gemini, DeepSeek, Grok) + <b>PRIVADO</b> (fine-tuned internos). El ruteo elige por calidad, coste, latencia, contexto, privacidad y requisitos del cliente. El sistema nunca queda preso de un solo proveedor.'},
    {k:['telemetria','jsonl','registro','log','sha'],r:'Telemetria cognitiva real: cada operacion se registra en <b>JSONL con archivo SHA-256</b>. El ViseronAgent.supervise() guarda speaker, lang, intent, provider, modelo, ok, acciones, mensaje y respuesta.'},
    {k:['rapido','velocidad','paralelo','rendimiento','performance','80'],r:'Ejecucion paralela: <b>2x speedup</b>, <b>80 tareas/segundo</b>, <b>97% de exito</b>. El Command Center muestra KPIs en tiempo real via SSE.'},
    {k:['pipeline','estado','tarea','task','9 estados','ejecucion'],r:'Cada tarea pasa por un pipeline E2E de <b>9 estados</b>: CREATED → PLANNING → QUEUED → RUNNING → VERIFYING → COMPLETED (o FAILED → RECOVERING → retry, o CANCELLED). El TaskVerifier decide PASS / FAIL / RETRY / HUMAN y todo queda en el KnowledgeGraph y la LTM.'},
    {k:['command center','sse','tiempo real','dashboard','kpi'],r:'El <b>Command Center</b> opera con <b>SSE: 43 topicos</b> de eventos en tiempo real (Tasks, Tools, Memory, Kernel), 6 KPI cards (System Status, Active Agents, Tasks, Events, Knowledge Graph, Minds Online), tabla interactiva de los 10 agentes nucleares con dispatch inline, gobernanza biblica y supervision AIOX con okRate.'},
    {k:['gobernanza','etica','principio','biblica','checks'],r:'Gobernanza biblica: <b>9 principios</b> (sabedoria, verdad, mayordomia, justicia, servicio, diligencia, humildad, liberalidad, fidelidad), <b>4 blockedKinds</b> (fraude, hidden_fee, data_leak, seed_exposure) y <b>7 checks eticos</b> obligatorios por operacion.'},
    {k:['auditoria','audit','prueba','test','verde','calidad','qa'],r:'Auditoria 17/08/2026: <b>VERDE</b>. Manifiestos validos (12 agentes / 199 workers / 215 tareas), QA del TVS OS <b>13/13</b>, juegos <b>4/4</b>, Jarvis <b>4/4</b>, core tests <b>20/20</b>, recovery <b>10/10</b>, aprendizaje <b>22/24 REAL (0 MOCKED)</b>, sync de IDEs <b>137 archivos, 0 drift</b>, n8n health 200 OK.'},
    {k:['limitacion','limite','problema','pendiente','falta','no funciona','error'],r:'Limitaciones conocidas (publicadas con honestidad): OpenAI/ElevenLabs sin keys configuradas, skills 21K indexadas pero no ejecutables aun, arquitectura single-process, LTM con tope de 20K entradas, concurrencia segura de 4 tareas, y Docker pendiente de virtualizacion anidada en UpCloud. Todo esta en el roadmap de evolucion.'},
    {k:['escala','escalar','crecer','500 agentes','distribuida'],r:'Modelo de escala proyectado: <b>10 agentes</b> sin cuello de botella → <b>20</b> (brecha de evidencia) → <b>50</b> (contienda de memoria) → <b>100</b> (tope LTM) → <b>500+</b> (requiere cola distribuida). Cada salto se audita antes de anunciarse.'},
    {k:['token','vsr','trin','cripto','crypto','moneda','supply'],r:'<b>VSR (Viseron Crown):</b> 300.000.000 de supply, gobernanza/utility, ERC20Votes (1 VSR = 1 voto), staking genera TRIN, burn 1% + security fee 1% por tx, max wallet 3%. Distribucion: staking 25%, comunidad 20%, liquidez 20%, marketing 15%, equipo 10%, desarrollo 10%. <b>TRIN (Trinnity):</b> 420.690.000, memecoin interplanetaria estilo Dogelon ELON, burn 2% por tx, max tx 0,5% anti-bot, bloqueo pre-lanzamiento. Redes: ETH · BSC · Solana.'},
    {k:['dex','listar','liquidez','pool','precio','cotizar','uniswap','pancake','raydium'],r:'Salida a DEX (fase Genesis): contratos <b>LISTOS</b>. Plan: deploy mainnet (BSC recomendado por gas), liquidity pools en <b>Uniswap (ETH) + PancakeSwap (BSC) + Raydium (Solana)</b>, lock de liquidez, indexacion CoinGecko/CMC y CEXs (MEXC, Bitget, Gate) previa auditoria Hacken. El precio tras DEX lo crea la liquidez inicial + la demanda.'},
    {k:['staking','stake','gobernanza','voto','pom','mandato'],r:'<b>Prueba de Mandato (PoM)</b>: los agentes AIOX prueban su mandato con VSR. Staking de VSR genera recompensas TRIN. Gobernanza ERC20Votes delegable: la comunidad vota con su VSR.'},
    {k:['roadmap','fase','futuro','siguiente','ruta'],r:'Roadmap: <b>Fase 1 Genesis</b> (deploy contratos + liquidity pools + lock + sitio + Telegram) → <b>Fase 2 Ascension</b> (staking y gobernanza en vivo, metaverso jugable, airdrops) → <b>Fase 3 Exchange</b> (CoinGecko/CMC, CEXs regionales, auditoria Hacken/SolidityScan) → <b>Fase 4 Cosmos Mainnet</b> (bridge ETH-BSC-Solana, L2 propio Rufus-style, apps TVS integradas).'},
    {k:['plan','precio','comprar','cuesta','suscripcion','pago','starter','pro','enterprise'],r:'Planes del TVS OS: <b>STARTER 199€/mes</b> (terminal, 50 misiones, juegos, explorador, actualizaciones) · <b>PRO 499€/mes</b> (+squads, monitor, soporte prioritario, beta) · <b>ENTERPRISE 1.999€/mes</b> (+panel cripto, API/webhooks, equipos, SLA 99,9%). Extras: Skill Pack Pro 99€, Squad Extra 299€, Soporte 24/7 49€, Auditoria AIOX 199€. Compra dentro del TVS OS.'},
    {k:['como comprar','entrar','acceso','login','registro','cadastro','visor'],r:'Para entrar: pulsa <b>ENTRAR AL TVS OS</b> en la portada (o ve a /visor/), crea tu cuenta en CADASTRO, compra un plan en la tienda y el sistema operativo completo se desbloquea segun tu plan. Login maestro (demo): maestro@tvs.vision / cosmos.'},
    {k:['mision','misiones','trin ganar','recompensa','m50','cosmica'],r:'<b>50 misiones</b> en 6 categorias: Genesis, Exploracion, Construccion, Cosmos, Comunidad y Cripto. Recompensas de 10 a 1.000 TRIN. La M50 "Mente Cosmica" da 1.000 TRIN. El progreso se guarda en tu nave.'},
    {k:['juego','juegos','jugar','miner','runner','quiz','record'],r:'3 juegos: <b>Asteroid Miner</b> (captura TRIN, esquiva bombas, niveles progresivos), <b>Cosmos Runner</b> (esquiva escombros a velocidad warp), <b>Quiz del Batallon</b> (10 preguntas; 7+ aciertos = Mente del Batallon). Records guardados localmente.'},
    {k:['tvs os','escritorio','terminal','comando','ventana','consola'],r:'El <b>TVS OS v7.0.0</b> es la consola web real: boot con modulos del sistema, escritorio con 12 ventanas, terminal con comandos (help, status, whoami, agentes, skills, arbol, tokens, roadmap, tienda, comprar, auditoria, firma...), misiones, tienda, panel admin y areas por plan. Se desbloquea al comprar el Viseron.'},
    {k:['servidor','server','n8n','upcloud','infraestructura','donde corre','wsl'],r:'Infraestructura real: servidor <b>UpCloud 194.62.96.26</b> (Windows Server 2025, 232 GB libres) con <b>n8n v2.34.6</b> (autoarranque, puerto 5678, workflows migrados), <b>Ollama</b> (Qwen 7b/3b), WSL 2.7.11, Vercel en produccion, GitHub publico y backup diario automatico a las 04:00.'},
    {k:['backup','respaldo','restaurar','rollback','copia'],r:'Sistema de respaldo: <b>golden backup</b> de 13 carpetas con SHA256, <b>backup diario automatico 04:00</b>, rollback por ZIP o por tag de git (deploy-anterior-...), historial completo en GitHub y copias locales. Nada se pierde.'},
    {k:['seguridad','contraseña','password','p0','clave','vulnerable'],r:'Estado de seguridad: auditoria <b>VERDE con 2 P0 pendientes de vuestras manos</b>: (1) rotar la contraseña del servidor UpCloud, (2) crear el usuario propietario de n8n en :5678. Los .env, wallets y seeds JAMAS van a git ni al chat.'},
    {k:['cosmos','metaverso','telegram','comunidad'],r:'El <b>Viseron Cosmos</b> tiene sitio propio (cosmos.html + metaverso), imagenes VSR/TRIN, y Telegram (t.me/ViseronCosmos). La comunidad es requisito para la indexacion en CoinGecko/CMC.'},
    {k:['descarga','pdf','documento','informe','report'],r:'Documentos disponibles: <b>Viseron Pipeline Receita (PDF)</b> y <b>Viseron Relatorio de Estado (PDF)</b> en la seccion Descargas del TVS OS, mas el README completo en GitHub.'},
    {k:['ayuda','help','soporte','contacto','no entiendo'],r:'Estoy para eso. Temas que domino: <b>agentes y squads</b>, <b>skills</b>, <b>memoria y Graphify</b>, <b>modelos</b>, <b>telemetria y pipeline</b>, <b>gobernanza</b>, <b>auditoria</b>, <b>tokens VSR/TRIN</b>, <b>DEX</b>, <b>planes y precios</b>, <b>misiones y juegos</b>, <b>TVS OS</b>, <b>servidor</b>, <b>backups</b> y <b>roadmap</b>. Pregunta con libertad.'},
    {k:['gracias','obrigado','thank','genial','perfecto','top','excelente'],r:'A tu servicio, comandante. El batallon sigue avanzando hacia las estrellas. &#128640;'},
    {k:['adios','hasta luego','chau','bye','sair'],r:'Hasta pronto. JARVIS queda de guardia 24/7 en el TVS OS.'}
  ];
  var FALLBACK = 'No tengo esa respuesta exacta en mi base local (v7.0.0), pero pregunta por: <b>agentes</b>, <b>squads</b>, <b>skills</b>, <b>memoria/Graphify</b>, <b>modelos</b>, <b>pipeline</b>, <b>gobernanza</b>, <b>auditoria</b>, <b>tokens VSR/TRIN</b>, <b>DEX</b>, <b>planes</b>, <b>misiones</b>, <b>juegos</b>, <b>TVS OS</b>, <b>servidor</b>, <b>backups</b> o <b>roadmap</b>.';

  function pensar(msg) {
    var m = msg.toLowerCase();
    var palabras = m.split(/[^a-z0-9ñáéíóú]+/).filter(function(w){ return w.length > 2; });
    var mejor = null, mejorScore = 0;
    CEREBRO.forEach(function (intent) {
      var score = 0;
      intent.k.forEach(function (kw) {
        if (m.indexOf(kw) >= 0) score += kw.length > 6 ? 3 : 2;
        else {
          var partes = kw.split(/\s+/);
          partes.forEach(function(p){ if (p.length > 3 && palabras.indexOf(p) >= 0) score += 1; });
        }
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
        <button>agentes</button><button>tokens</button><button>planes</button><button>auditoria</button><button>roadmap</button><button>dex</button>\
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
    setTimeout(function () { responderConCerebro(texto); }, 450);
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
    if (!msgs.children.length) msg('Sistema TVS v7.0.0 en linea. Preguntame lo que quieras del proyecto: <b>agentes, tokens, planes, auditoria, DEX, roadmap...</b>', 'jar');
  }, 800);
})();
