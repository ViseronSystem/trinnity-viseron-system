import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTVS } from '../context/TVSContext';

function StatCard({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string | number; color: string }) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }: any) {
  const { connected, stats, status, battalion, directives, loading, refresh } = useTVS();
  const [tab, setTab] = useState<'stats' | 'battalion' | 'squads'>('stats');

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
        <Text style={styles.offlineHint}>Verifique se o servidor TVS está ligado e se o IP está correto.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Ionicons name="refresh" size={18} color="#00f5ff" />
          <Text style={styles.retryText}> Tentar novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation?.navigate?.('Settings')}>
          <Ionicons name="settings" size={18} color="#ffd700" />
          <Text style={styles.settingsText}> Configurar Servidor</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statsCards = [
    { icon: 'people' as const, label: 'Agentes', value: stats?.totalAgents ?? 0, color: '#00f5ff' },
    { icon: 'git-branch' as const, label: 'Evoluções', value: stats?.evolutionCycles ?? 0, color: '#00ff88' },
    { icon: 'bulb' as const, label: 'Sabedoria', value: `${(stats?.averageWisdom ?? 0).toFixed(1)}%`, color: '#ffd700' },
    { icon: 'flash' as const, label: 'Inteligência', value: `${stats?.superMindKnowledge ?? 0}%`, color: '#ff6b6b' },
    { icon: 'layers' as const, label: 'Arquetipos', value: stats?.archetypesLoaded ?? 0, color: '#a855f7' },
    { icon: 'flag' as const, label: 'Directivas', value: stats?.activeDirectives ?? 0, color: '#f97316' },
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#00f5ff" />}>
      <View style={styles.tabs}>
        {['stats', 'battalion', 'squads'].map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t as any)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'stats' && (
        <>
          <View style={styles.headerRow}>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: '#00ff88' }]} />
              <Text style={styles.statusText}>Online</Text>
            </View>
            <Text style={styles.coreName}>{status?.core || 'TVS v7.0'}</Text>
          </View>
          <View style={styles.grid}>
            {statsCards.map((card, i) => (<StatCard key={i} {...card} />))}
          </View>
          <TouchableOpacity style={styles.synthButton} onPress={() => navigation?.navigate?.('Terminal')}>
            <Ionicons name="terminal" size={18} color="#0a0a2e" />
            <Text style={styles.synthText}>Abrir Terminal</Text>
          </TouchableOpacity>
        </>
      )}

      {tab === 'battalion' && battalion && (
        <>
          <View style={styles.battalionHeader}>
            <Text style={styles.battalionTitle}>Batallão {battalion.standard}</Text>
            <Text style={styles.battalionCount}>{battalion.totalAgents} agentes</Text>
          </View>
          <View style={styles.lineageRow}>
            <View style={[styles.lineageCard, { borderLeftColor: '#ffd700' }]}>
              <Ionicons name="trophy" size={24} color="#ffd700" />
              <Text style={styles.lineageValue}>{battalion.corona}</Text>
              <Text style={styles.lineageLabel}>Corona</Text>
            </View>
            <View style={[styles.lineageCard, { borderLeftColor: '#a0a0a0' }]}>
              <Ionicons name="shield" size={24} color="#a0a0a0" />
              <Text style={styles.lineageValue}>{battalion.hierro}</Text>
              <Text style={styles.lineageLabel}>Hierro</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Soberanos</Text>
          {battalion.sovereigns.map((s, i) => (
            <View key={i} style={styles.sovereignCard}>
              <Ionicons name="person" size={18} color="#ffd700" />
              <View style={styles.sovereignInfo}>
                <Text style={styles.sovereignName}>{s.name}</Text>
                <Text style={styles.sovereignRank}>{s.rank} — {s.epithet}</Text>
              </View>
            </View>
          ))}
          <Text style={styles.sectionTitle}>Áreas ({battalion.areaList.length})</Text>
          <View style={styles.areaRow}>
            {battalion.areaList.map((a, i) => (
              <View key={i} style={styles.areaBadge}><Text style={styles.areaText}>{a}</Text></View>
            ))}
          </View>
        </>
      )}

      {tab === 'squads' && status && (
        <>
          <Text style={styles.sectionTitle}>Squads ({status.squads.length})</Text>
          {status.squads.map((squad, i) => (
            <View key={i} style={styles.squadCard}>
              <View style={styles.squadHeader}>
                <Ionicons name="people" size={20} color="#00f5ff" />
                <Text style={styles.squadName}>{squad.name}</Text>
              </View>
              <Text style={styles.squadLeader}>Líder: {squad.leader}</Text>
              <Text style={styles.squadMembers}>{squad.membersCount} membros</Text>
            </View>
          ))}
          {directives && (
            <View style={styles.directiveRow}>
              <View style={styles.directiveCard}>
                <Text style={styles.directiveValue}>{directives.active}</Text>
                <Text style={styles.directiveLabel}>Directivas Activas</Text>
              </View>
              <View style={styles.directiveCard}>
                <Text style={[styles.directiveValue, { color: '#00ff88' }]}>{directives.completed}</Text>
                <Text style={styles.directiveLabel}>Completadas</Text>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a2e', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a2e', justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { color: '#00f5ff', marginTop: 16, fontSize: 16 },
  offlineText: { color: '#ff4444', fontSize: 24, fontWeight: 'bold', marginTop: 16 },
  offlineHint: { color: '#6a6a9a', fontSize: 13, marginTop: 8, textAlign: 'center' },
  retryButton: { marginTop: 24, backgroundColor: '#1a1a4e', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  retryText: { color: '#00f5ff', fontSize: 16 },
  settingsButton: { marginTop: 12, backgroundColor: '#12123a', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  settingsText: { color: '#ffd700', fontSize: 16 },
  tabs: { flexDirection: 'row', backgroundColor: '#12123a', borderRadius: 10, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#1a1a5e' },
  tabText: { color: '#4a4a7a', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#00f5ff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12123a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { color: '#00ff88', fontSize: 12, fontWeight: '600' },
  coreName: { color: '#4a4a7a', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '47%', backgroundColor: '#12123a', borderRadius: 12, padding: 14, borderLeftWidth: 3, marginBottom: 10 },
  cardValue: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: 6 },
  cardLabel: { color: '#6a6a9a', fontSize: 11, marginTop: 2, textTransform: 'uppercase' },
  synthButton: { backgroundColor: '#00f5ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, marginTop: 8, gap: 8 },
  synthText: { color: '#0a0a2e', fontSize: 15, fontWeight: 'bold' },
  battalionHeader: { marginBottom: 16 },
  battalionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  battalionCount: { color: '#4a4a7a', fontSize: 14, marginTop: 4 },
  lineageRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  lineageCard: { flex: 1, backgroundColor: '#12123a', borderRadius: 12, padding: 16, borderLeftWidth: 3 },
  lineageValue: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  lineageLabel: { color: '#6a6a9a', fontSize: 11, textTransform: 'uppercase', marginTop: 2 },
  sectionTitle: { color: '#4a4a7a', fontSize: 12, textTransform: 'uppercase', marginBottom: 10, marginTop: 8 },
  sovereignCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12123a', borderRadius: 10, padding: 12, marginBottom: 8, gap: 10 },
  sovereignInfo: { flex: 1 },
  sovereignName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sovereignRank: { color: '#6a6a9a', fontSize: 12, marginTop: 2 },
  areaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  areaBadge: { backgroundColor: '#1a1a4e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  areaText: { color: '#a855f7', fontSize: 12 },
  squadCard: { backgroundColor: '#12123a', borderRadius: 12, padding: 14, marginBottom: 10 },
  squadHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  squadName: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  squadLeader: { color: '#6a6a9a', fontSize: 13, marginTop: 6 },
  squadMembers: { color: '#00f5ff', fontSize: 12, marginTop: 2 },
  directiveRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  directiveCard: { flex: 1, backgroundColor: '#12123a', borderRadius: 12, padding: 14, alignItems: 'center' },
  directiveValue: { color: '#f97316', fontSize: 28, fontWeight: 'bold' },
  directiveLabel: { color: '#6a6a9a', fontSize: 11, marginTop: 4, textTransform: 'uppercase' },
});
