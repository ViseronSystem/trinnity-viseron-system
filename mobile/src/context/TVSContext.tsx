import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { tvsApi, TVSStats, Agent } from '../services/api';

interface TVSContextType {
  connected: boolean;
  stats: TVSStats | null;
  agents: Agent[];
  refresh: () => Promise<void>;
  loading: boolean;
}

const TVSContext = createContext<TVSContextType>({
  connected: false,
  stats: null,
  agents: [],
  refresh: async () => {},
  loading: true,
});

export function TVSProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState<TVSStats | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const health = await tvsApi.health();
    setConnected(health);
    if (health) {
      const [s, a] = await Promise.all([tvsApi.getStats(), tvsApi.getAgents()]);
      setStats(s);
      setAgents(a);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TVSContext.Provider value={{ connected, stats, agents, refresh, loading }}>
      {children}
    </TVSContext.Provider>
  );
}

export function useTVS() {
  return useContext(TVSContext);
}
