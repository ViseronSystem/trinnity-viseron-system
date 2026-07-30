import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTVS } from '../context/TVSContext';
import { tvsApi } from '../services/api';

function StatCard({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string | number; color: string }) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { connected, stats, refresh, loading } = useTVS();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00f5ff" />
        <Text style={styles.loadingText}>Conectando ao TVS...</Text>
      </View>
    );
  }

  if (!connected) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={64} color="#ff4444" />
        <Text style={styles.offlineText}>TVS Server Offline</Text>
        <Text style={styles.offlineSubtext}>Certifique-se que o TVS está rodando em localhost:3000</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cards = [
    { icon: 'people' as const, label: 'Agentes Totais', value: stats?.totalAgents ?? 0, color: '#00f5ff' },
    { icon: 'git-branch' as const, label: 'Evoluções', value: stats?.evolutionCycles ?? 0, color: '#00ff88' },
    { icon: 'bulb' as const, label: 'Sabedoria Média', value: `${(stats?.averageWisdom ?? 0).toFixed(1)}%`, color: '#ffd700' },
    { icon: 'flash' as const, label: 'Nível Inteligência', value: `${stats?.superMindKnowledge ?? 0}%`, color: '#ff6b6b' },
    { icon: 'layers' as const, label: 'Arquetipos', value: stats?.archetypesLoaded ?? 0, color: '#a855f7' },
    { icon: 'flag' as const, label: 'Directivas Ativas', value: stats?.activeDirectives ?? 0, color: '#f97316' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#00f5ff" />}
    >
      <View style={styles.header}>
        <Ionicons name="checkmark-circle" size={20} color="#00ff88" />
        <Text style={styles.headerText}>TVS Online</Text>
      </View>

      <View style={styles.grid}>
        {cards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </View>

      <TouchableOpacity style={styles.synthesizeButton} onPress={() => tvsApi.synthesize('system status')}>
        <Ionicons name="sparkles" size={20} color="#0a0a2e" />
        <Text style={styles.synthesizeText}>Sintetizar Inteligência</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a2e', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a2e', justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { color: '#00f5ff', marginTop: 16, fontSize: 16 },
  offlineText: { color: '#ff4444', fontSize: 24, fontWeight: 'bold', marginTop: 16 },
  offlineSubtext: { color: '#6a6a9a', textAlign: 'center', marginTop: 8, fontSize: 14 },
  retryButton: { marginTop: 24, backgroundColor: '#1a1a4e', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#00f5ff', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerText: { color: '#00ff88', fontSize: 16, marginLeft: 8, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%', backgroundColor: '#12123a', borderRadius: 12, padding: 16,
    borderLeftWidth: 3, marginBottom: 12,
  },
  cardValue: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 8 },
  cardLabel: { color: '#6a6a9a', fontSize: 12, marginTop: 4, textTransform: 'uppercase' },
  synthesizeButton: {
    backgroundColor: '#00f5ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, borderRadius: 12, marginTop: 20, gap: 8,
  },
  synthesizeText: { color: '#0a0a2e', fontSize: 16, fontWeight: 'bold' },
});
