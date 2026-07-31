import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { tvsApi, TVSStats, Agent, StatusInfo, BattalionInfo, DirectiveInfo, setServerUrl } from '../services/api';

interface TVSContextType {
  connected: boolean;
  stats: TVSStats | null;
  agents: Agent[];
  status: StatusInfo | null;
  battalion: BattalionInfo | null;
  directives: DirectiveInfo | null;
  loading: boolean;
  error: string | null;
  serverUrl: string;
  setServer: (url: string) => void;
  refresh: () => Promise<void>;
  executeTask: (agentId: string, task: string) => Promise<string | null>;
  sendCommand: (text: string) => Promise<string | null>;
}

const TVSContext = createContext<TVSContextType>({
  connected: false, stats: null, agents: [], status: null,
  battalion: null, directives: null, loading: true, error: null,
  serverUrl: 'http://localhost:3000',
  setServer: () => {}, refresh: async () => {},
  executeTask: async () => null, sendCommand: async () => null,
});

export function TVSProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState<TVSStats | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [battalion, setBattalion] = useState<BattalionInfo | null>(null);
  const [directives, setDirectives] = useState<DirectiveInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverUrl, setServerUrlState] = useState(tvsApi.baseUrl);

  const fetchAll = useCallback(async () => {
    const health = await tvsApi.health();
    setConnected(health);
    if (health) {
      const [s, a, st, b, d] = await Promise.all([
        tvsApi.getStats(),
        tvsApi.getAgents(),
        tvsApi.getStatus(),
        tvsApi.getBattalion(),
        tvsApi.getDirectives(),
      ]);
      setStats(s);
      setAgents(a);
      setStatus(st);
      setBattalion(b);
      setDirectives(d);
      setError(null);
    } else {
      setError('Servidor TVS não encontrado');
    }
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchAll();
  }, [fetchAll]);

  const setServer = useCallback((url: string) => {
    const normalized = url.replace(/\/+$/, '');
    setServerUrl(normalized);
    setServerUrlState(normalized);
    tvsApi.disconnectSocket();
    setLoading(true);
    fetchAll();
  }, [fetchAll]);

  const executeTask = useCallback(async (agentId: string, task: string): Promise<string | null> => {
    const result = await tvsApi.synthesize(`Agent ${agentId}: ${task}`);
    return result?.text || null;
  }, []);

  const sendCommand = useCallback(async (text: string): Promise<string | null> => {
    try {
      const result = await tvsApi.synthesize(text);
      if (result) {
        return `[Confiança: ${result.confidence}%] ${result.text.slice(0, 1000)}`;
      }
      const voiceResult = await tvsApi.voiceCommand(text);
      if (voiceResult) {
        return voiceResult.response;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const socket = tvsApi.connectSocket();
    socket.on('system:info', (data: any) => {
      if (data?.agents) setAgents(data.agents);
      if (data?.coreName) setConnected(true);
    });
    socket.on('voice:response', (data: any) => {
      if (data?.response) {
        console.log('[Voice Response]', data.response);
      }
    });
    const interval = setInterval(() => {
      tvsApi.health().then(h => {
        if (h && !connected) {
          fetchAll();
        }
        setConnected(h);
      });
    }, 10000);
    return () => {
      clearInterval(interval);
      tvsApi.disconnectSocket();
    };
  }, []);

  return (
    <TVSContext.Provider value={{
      connected, stats, agents, status, battalion, directives,
      loading, error, serverUrl, setServer, refresh, executeTask, sendCommand,
    }}>
      {children}
    </TVSContext.Provider>
  );
}

export function useTVS() {
  return useContext(TVSContext);
}
