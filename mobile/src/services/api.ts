const TVS_SERVER_URL = 'http://localhost:3000';

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
}

export class TVSApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = TVS_SERVER_URL) {
    this.baseUrl = baseUrl;
  }

  async getStats(): Promise<TVSStats | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/stats`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async getAgents(): Promise<Agent[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/agents`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  async synthesize(prompt: string): Promise<SynthesisResult | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const tvsApi = new TVSApiClient();
