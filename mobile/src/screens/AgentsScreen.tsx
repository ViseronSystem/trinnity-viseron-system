import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTVS } from '../context/TVSContext';

export default function AgentsScreen() {
  const { agents, status, loading, refresh, executeTask } = useTVS();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [taskInput, setTaskInput] = useState('');
  const [taskAgentId, setTaskAgentId] = useState<string | null>(null);
  const [taskResult, setTaskResult] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  const filtered = useMemo(() => {
    let list = agents;
    if (filter === 'active') list = list.filter(a => a.status === 'ACTIVE');
    if (filter === 'paused') list = list.filter(a => a.status !== 'ACTIVE');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.capabilities.some(c => c.toLowerCase().includes(q))
      );
    }
    return list;
  }, [agents, filter, search]);

  const handleExecute = async (agentId: string) => {
    if (!taskInput.trim()) return;
    setExecuting(true);
    setTaskAgentId(agentId);
    const result = await executeTask(agentId, taskInput);
    setTaskResult(result);
    setExecuting(false);
    if (result) {
      Alert.alert('Resultado', result.slice(0, 300));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00f5ff" />
      </View>
    );
  }

  const agentCount = status?.agentsStats;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#00f5ff" />}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}><Text style={styles.statValue}>{agentCount?.total ?? agents.length}</Text><Text style={styles.statLabel}>Total</Text></View>
        <View style={styles.statItem}><Text style={[styles.statValue, { color: '#00ff88' }]}>{agentCount?.active ?? 0}</Text><Text style={styles.statLabel}>Ativos</Text></View>
        <View style={styles.statItem}><Text style={[styles.statValue, { color: '#f97316' }]}>{agentCount?.paused ?? 0}</Text><Text style={styles.statLabel}>Pausados</Text></View>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#4a4a7a" />
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Buscar agentes..." placeholderTextColor="#4a4a7a" />
      </View>

      <View style={styles.filterRow}>
        {(['all', 'active', 'paused'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.count}>{filtered.length} agentes encontrados</Text>

      {filtered.map((agent) => (
        <TouchableOpacity key={agent.id} style={styles.agentCard} onPress={() => setExpandedId(expandedId === agent.id ? null : agent.id)} activeOpacity={0.7}>
          <View style={styles.agentHeader}>
            <View style={[styles.statusDot, { backgroundColor: agent.status === 'ACTIVE' ? '#00ff88' : '#ff4444' }]} />
            <Text style={styles.agentName}>{agent.name}</Text>
            <Ionicons name={expandedId === agent.id ? 'chevron-up' : 'chevron-down'} size={18} color="#4a4a7a" />
          </View>
          <Text style={styles.agentRole}>{agent.role}</Text>

          {expandedId === agent.id && (
            <View style={styles.expanded}>
              <Text style={styles.sectionTitle}>Capacidades ({agent.capabilities.length})</Text>
              <View style={styles.capRow}>
                {agent.capabilities.map((cap, i) => (
                  <View key={i} style={styles.capBadge}><Text style={styles.capText}>{cap}</Text></View>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Executar Tarefa</Text>
              <View style={styles.taskRow}>
                <TextInput style={styles.taskInput} value={taskInput} onChangeText={setTaskInput} placeholder="Descreva a tarefa..." placeholderTextColor="#4a4a7a" />
                <TouchableOpacity style={[styles.taskBtn, executing && { opacity: 0.5 }]} onPress={() => handleExecute(agent.id)} disabled={executing}>
                  {executing && taskAgentId === agent.id ? (
                    <ActivityIndicator size="small" color="#0a0a2e" />
                  ) : (
                    <Ionicons name="play" size={18} color="#0a0a2e" />
                  )}
                </TouchableOpacity>
              </View>
              {taskResult && taskAgentId === agent.id && (
                <Text style={styles.taskResult}>{taskResult.slice(0, 200)}</Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a2e', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a2e', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statItem: { flex: 1, backgroundColor: '#12123a', borderRadius: 10, padding: 12, alignItems: 'center' },
  statValue: { color: '#00f5ff', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#4a4a7a', fontSize: 11, textTransform: 'uppercase', marginTop: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12123a', borderRadius: 10, paddingHorizontal: 12, marginBottom: 12, gap: 8 },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 10, fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#12123a' },
  filterActive: { backgroundColor: '#1a1a5e' },
  filterText: { color: '#4a4a7a', fontSize: 13 },
  filterTextActive: { color: '#00f5ff' },
  count: { color: '#4a4a7a', fontSize: 13, marginBottom: 12 },
  agentCard: { backgroundColor: '#12123a', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 2, borderLeftColor: '#00f5ff' },
  agentHeader: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  agentName: { color: '#fff', fontSize: 15, fontWeight: 'bold', flex: 1 },
  agentRole: { color: '#6a6a9a', fontSize: 12, marginTop: 4, marginLeft: 18 },
  expanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1a1a4e' },
  sectionTitle: { color: '#4a4a7a', fontSize: 11, textTransform: 'uppercase', marginBottom: 6 },
  capRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  capBadge: { backgroundColor: '#1a1a4e', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  capText: { color: '#00f5ff', fontSize: 11 },
  taskRow: { flexDirection: 'row', gap: 8 },
  taskInput: { flex: 1, backgroundColor: '#0d0d35', borderRadius: 8, padding: 10, color: '#fff', fontSize: 13, borderWidth: 1, borderColor: '#1a1a4e' },
  taskBtn: { backgroundColor: '#00f5ff', width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  taskResult: { color: '#00ff88', fontSize: 12, marginTop: 8, backgroundColor: '#0d0d35', padding: 8, borderRadius: 6 },
});
