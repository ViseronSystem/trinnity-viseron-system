import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTVS } from '../context/TVSContext';

export default function AgentsScreen() {
  const { agents, refresh, loading } = useTVS();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00f5ff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#00f5ff" />}
    >
      <Text style={styles.count}>{agents.length} Agentes Registrados</Text>
      {agents.map((agent) => (
        <TouchableOpacity
          key={agent.id}
          style={styles.agentCard}
          onPress={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
        >
          <View style={styles.agentHeader}>
            <View style={[styles.statusDot, { backgroundColor: agent.status === 'ACTIVE' ? '#00ff88' : '#ff4444' }]} />
            <Text style={styles.agentName}>{agent.name}</Text>
            <Ionicons name={expandedId === agent.id ? 'chevron-up' : 'chevron-down'} size={20} color="#4a4a7a" />
          </View>
          <Text style={styles.agentRole}>{agent.role}</Text>
          {expandedId === agent.id && (
            <View style={styles.expanded}>
              <Text style={styles.sectionTitle}>Capacidades</Text>
              <View style={styles.capabilities}>
                {agent.capabilities.map((cap, i) => (
                  <View key={i} style={styles.capBadge}>
                    <Text style={styles.capText}>{cap}</Text>
                  </View>
                ))}
              </View>
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
  count: { color: '#4a4a7a', fontSize: 14, marginBottom: 16 },
  agentCard: {
    backgroundColor: '#12123a', borderRadius: 12, padding: 16, marginBottom: 12,
    borderLeftWidth: 2, borderLeftColor: '#00f5ff',
  },
  agentHeader: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  agentName: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 },
  agentRole: { color: '#6a6a9a', fontSize: 13, marginTop: 4, marginLeft: 20 },
  expanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1a1a4e' },
  sectionTitle: { color: '#4a4a7a', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 },
  capabilities: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  capBadge: { backgroundColor: '#1a1a4e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  capText: { color: '#00f5ff', fontSize: 12 },
});
