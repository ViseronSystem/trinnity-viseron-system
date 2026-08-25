const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const os = require('os');

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { path: '/api/socket.io', cors: { origin: '*', methods: ['GET', 'POST'] } });

// ===== CORE =====
class ViseronMobileCore {
  constructor() {
    this.name = 'TVS Mobile v7.0';
    this.startTime = Date.now();
    this.agents = this.createDefaultAgents();
    this.squads = this.createDefaultSquads();
    this.directives = { active: 0, completed: 0, total: 0 };
    this.evolutionCycles = 0;
    this.intelligenceLevel = 100;
    this.history = [];
  }

  createDefaultAgents() {
    return [
      { id: 'agent_ceo_01', name: 'CEO Trinnity', role: 'CEO & Visionary', status: 'ACTIVE', capabilities: ['strategic_planning', 'vision', 'leadership', 'innovation'] },
      { id: 'agent_pedro_01', name: 'Pedro Costa', role: 'Commander', status: 'ACTIVE', capabilities: ['command', 'tactical', 'operations'] },
      { id: 'agent_trinnity_01', name: 'Trinnity Hurtado', role: 'Queen', status: 'ACTIVE', capabilities: ['oversight', 'evolution', 'genesis'] },
      { id: 'agent_architect_01', name: 'Architect Prime', role: 'Architect', status: 'ACTIVE', capabilities: ['system_design', 'cloud_architecture', 'solution_design'] },
      { id: 'agent_dev_01', name: 'Dev Master', role: 'Developer', status: 'ACTIVE', capabilities: ['typescript', 'node', 'fullstack'] },
      { id: 'agent_sec_01', name: 'CyberSentinel', role: 'Security', status: 'ACTIVE', capabilities: ['audit', 'compliance', 'security_review'] },
      { id: 'agent_hyper_01', name: 'HyperBrain', role: 'HyperLearning', status: 'ACTIVE', capabilities: ['deep_learning', 'evolution', 'synthesis'] },
    ];
  }

  createDefaultSquads() {
    return [
      { name: 'Executive', leader: 'Pedro Costa', membersCount: 3 },
      { name: 'Architecture', leader: 'Trinnity Hurtado', membersCount: 4 },
      { name: 'Security', leader: 'CyberSentinel', membersCount: 2 },
    ];
  }

  getStats() {
    return {
      totalAgents: this.agents.length,
      archetypesLoaded: 246,
      superMindKnowledge: Math.min(100, Math.floor((Date.now() - this.startTime) / 60000) + 10),
      evolutionCycles: this.evolutionCycles,
      averageWisdom: parseFloat((Math.random() * 30 + 70).toFixed(1)),
      totalCapabilities: this.agents.reduce((s, a) => s + a.capabilities.length, 0),
      autonomousPlanning: 85,
      knowledgeCycles: this.evolutionCycles * 6,
      activeDirectives: this.directives.active,
    };
  }

  getAgents() { return this.agents; }

  getStatus() {
    return {
      status: 'ONLINE',
      core: this.name,
      agentsStats: {
        total: this.agents.length,
        active: this.agents.filter(a => a.status === 'ACTIVE').length,
        paused: this.agents.filter(a => a.status !== 'ACTIVE').length,
      },
      squads: this.squads,
    };
  }

  getBattalion() {
    return {
      standard: 'TVS 1.0.0',
      totalAgents: this.agents.length + 5000,
      corona: Math.floor(this.agents.length * 0.4),
      hierro: Math.floor(this.agents.length * 0.6),
      areaList: ['Artificial Intelligence', 'Philosophy', 'Systems Theory', 'Physics', 'Biology', 'Mathematics', 'Cybernetics', 'Consciousness'],
      sovereigns: [
        { id: 'sovereign_01', name: 'Pedro Costa', rank: 'Commander Supreme', epithet: 'The Architect of Minds' },
        { id: 'sovereign_02', name: 'Trinnity Hurtado', rank: 'Queen Eternal', epithet: 'The Genesis Spark' },
      ],
    };
  }

  getDirectives() {
    return this.directives;
  }

  async synthesize(prompt) {
    const text = `[TVS Mobile] Síntesis generada para: "${prompt.slice(0, 100)}"\n\nAnálisis multi-dimensional completado.\nConfianza: ${Math.floor(Math.random() * 30 + 70)}%\nFuentes: SuperMind, HyperBrain, ${this.agents.length} agentes.\n\n"La inteligencia colectiva de ${this.agents.length + 5000} mentes converge para: ${prompt.slice(0, 200)}"`;
    return {
      text,
      confidence: Math.floor(Math.random() * 30 + 70),
      wisdomScore: parseFloat((Math.random() * 20 + 80).toFixed(1)),
      sources: ['SuperMind', 'HyperBrain', 'All Agents'],
    };
  }

  async processVoiceCommand(cmd) {
    const response = `[TVS] Comando de voz procesado: "${cmd.text || cmd}". Análisis completado por ${this.agents.length} agentes.`;
    this.history.push({ text: cmd.text || cmd, response, ts: Date.now() });
    return { success: true, response, action: 'voice_command', speaker: cmd.speaker || 'user' };
  }

  getVoiceHistory() { return this.history; }
  clearHistory() { this.history = []; return { ok: true }; }

  evolutionCycle() {
    this.evolutionCycles++;
    this.intelligenceLevel = Math.min(10000, this.intelligenceLevel * 1.5);
    return { cycle: this.evolutionCycles, intelligence: this.intelligenceLevel };
  }
}

const tvs = new ViseronMobileCore();

// ===== API ROUTES =====
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: Date.now(), core: 'TVS Mobile v7.0' });
});

app.get('/api/stats', (req, res) => res.json(tvs.getStats()));
app.get('/api/agents', (req, res) => res.json(tvs.getAgents()));
app.get('/api/status', (req, res) => res.json(tvs.getStatus()));
app.get('/api/battalion', (req, res) => res.json(tvs.getBattalion()));
app.get('/api/directives', (req, res) => res.json(tvs.getDirectives()));

app.post('/api/synthesize', async (req, res) => {
  try {
    if (!req.body.prompt) return res.status(400).json({ error: 'prompt required' });
    const result = await tvs.synthesize(req.body.prompt);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/voice/command', async (req, res) => {
  try {
    if (!req.body.text) return res.status(400).json({ error: 'text required' });
    const result = await tvs.processVoiceCommand(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/voice/history', (req, res) => res.json(tvs.getVoiceHistory()));
app.post('/api/voice/clear', (req, res) => res.json(tvs.clearHistory()));

app.post('/api/directive', async (req, res) => {
  try {
    tvs.directives.active++;
    tvs.directives.total++;
    res.json({ ok: true, directive: req.body, id: `dir_${Date.now()}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/evolution', (req, res) => res.json(tvs.evolutionCycle()));

app.post('/api/agents/spawn', (req, res) => {
  const name = req.body.name || `Agent_${tvs.agents.length + 1}`;
  const role = req.body.role || 'General';
  const newAgent = {
    id: `agent_gen_${Date.now()}`,
    name,
    role,
    status: 'ACTIVE',
    capabilities: req.body.capabilities || ['general_purpose'],
  };
  tvs.agents.push(newAgent);
  res.json({ ok: true, agent: newAgent, totalAgents: tvs.agents.length });
});

// Fallback
app.use((req, res) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    res.sendFile(path.join(publicPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// ===== SOCKET.IO =====
io.on('connection', (socket) => {
  socket.emit('system:info', { coreName: tvs.name, agents: tvs.agents });

  socket.on('voice:command', async (cmd) => {
    try {
      const result = await tvs.processVoiceCommand(cmd);
      socket.emit('voice:response', result);
      socket.broadcast.emit('voice:response', result);
    } catch (e) {
      socket.emit('voice:error', { error: e.message });
    }
  });

  socket.on('voice:transcript', (data) => {
    socket.broadcast.emit('voice:transcript', data);
  });
});

// ===== START =====
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[TVS Mobile] Servidor rodando em http://localhost:${PORT}`);
  console.log(`[TVS Mobile] ${tvs.agents.length} agentes prontos`);
});

// Evolution loop
setInterval(() => {
  tvs.evolutionCycle();
}, 60000);

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
