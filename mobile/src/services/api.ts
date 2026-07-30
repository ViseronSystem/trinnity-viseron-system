import { io, Socket } from 'socket.io-client';

export interface TVSStats {
  totalAgents: number;
  archetypesLoaded: number;
  superMindKnowledge: number;
  evolutionCycles: number;
  averageWisdom: number;
  totalCapabilities: number;
  autonomousPlanning: number;
  knowledgeCycles: number;
  activeDirectives: number;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  capabilities: string[];
}

export interface SynthesisResult {
  text: string;
  confidence: number;
  wisdomScore: number;
  sources?: string[];
}

export interface Squad {
  name: string;
  leader: string;
  membersCount: number;
}

export interface BattalionInfo {
  standard: string;
  totalAgents: number;
  corona: number;
  hierro: number;
  areaList: string[];
  sovereigns: Array<{ id: string; name: string; rank: string; epithet: string }>;
}

export interface DirectiveInfo {
  active: number;
  completed: number;
  total: number;
}

export interface StatusInfo {
  status: string;
  core: string;
  agentsStats: { total: number; active: number; paused: number };
  squads: Squad[];
}

export interface TokenInfo {
  token: string;
  symbol: string;
  totalSupply: number;
  tokenomics: {
    name: string;
    description: string;
    totalSupply: number;
  };
}

export interface VoiceCommandResult {
  success: boolean;
  response: string;
  action?: string;
}

export interface HealthCheck {
  status: string;
  timestamp: number;
}

const DEFAULT_SERVER = 'http://192.168.1.100:3000';

function getServerUrl(): string {
  if (typeof globalThis !== 'undefined' && (globalThis as any).__TVS_SERVER_URL) {
    return (globalThis as any).__TVS_SERVER_URL;
  }
  return DEFAULT_SERVER;
}

export function setServerUrl(url: string) {
  (globalThis as any).__TVS_SERVER_URL = url;
}

export class TVSApiClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  get baseUrl(): string {
    return getServerUrl();
  }

  connectSocket(): Socket {
    if (this.socket?.connected) return this.socket;
    this.socket = io(this.baseUrl, {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    this.socket.on('connect', () => console.log('[Socket] Conectado ao TVS'));
    this.socket.on('disconnect', () => console.log('[Socket] Desconectado'));
    for (const [event, handlers] of this.listeners) {
      for (const handler of handlers) {
        this.socket.on(event, handler);
      }
    }
    return this.socket;
  }

  disconnectSocket() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, handler: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event: string, handler: (data: any) => void) {
    this.listeners.get(event)?.delete(handler);
    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  private async fetchJson<T>(path: string, options?: RequestInit): Promise<T | null> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options?.headers },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async health(): Promise<boolean> {
    const result = await this.fetchJson<HealthCheck>('/api/health');
    return result?.status === 'OK';
  }

  async getStats(): Promise<TVSStats | null> {
    return this.fetchJson<TVSStats>('/api/stats');
  }

  async getAgents(): Promise<Agent[]> {
    const agents = await this.fetchJson<Agent[]>('/api/agents');
    return agents || [];
  }

  async synthesize(prompt: string): Promise<SynthesisResult | null> {
    return this.fetchJson<SynthesisResult>('/api/synthesize', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  async getStatus(): Promise<StatusInfo | null> {
    return this.fetchJson<StatusInfo>('/api/status');
  }

  async getBattalion(): Promise<BattalionInfo | null> {
    return this.fetchJson<BattalionInfo>('/api/battalion');
  }

  async getDirectives(): Promise<DirectiveInfo | null> {
    return this.fetchJson<DirectiveInfo>('/api/directives');
  }

  async issueDirective(directive: any): Promise<any> {
    return this.fetchJson('/api/directive', {
      method: 'POST',
      body: JSON.stringify(directive),
    });
  }

  async voiceCommand(text: string, speaker?: string): Promise<VoiceCommandResult | null> {
    return this.fetchJson<VoiceCommandResult>('/api/voice/command', {
      method: 'POST',
      body: JSON.stringify({ text, speaker }),
    });
  }

  async getVoiceHistory(): Promise<any[]> {
    const result = await this.fetchJson<any[]>('/api/voice/history');
    return result || [];
  }

  async getWorkflows(): Promise<any[]> {
    const result = await this.fetchJson<any>('/api/workflows');
    return result?.workflows || [];
  }

  async runWorkflow(workflowId: string, data?: any): Promise<any> {
    return this.fetchJson('/api/workflows/run', {
      method: 'POST',
      body: JSON.stringify({ workflowId, data }),
    });
  }
}

export const tvsApi = new TVSApiClient();
