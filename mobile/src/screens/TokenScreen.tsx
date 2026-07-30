import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTVS } from '../context/TVSContext';

export default function TokenScreen() {
  const { connected, sendCommand } = useTVS();
  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState<string | null>(null);

  const fetchTokenInfo = async () => {
    setLoading(true);
    const result = await sendCommand('token info');
    setTokenData(result);
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      {!connected ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color="#ff4444" />
          <Text style={styles.offlineText}>Conecte ao TVS primeiro</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Ionicons name="cash" size={32} color="#ffd700" />
            <Text style={styles.headerTitle}>Tokenomics</Text>
          </View>

          <View style={styles.tokenGrid}>
            <View style={styles.tokenCard}>
              <Text style={styles.tokenSymbol}>TRIN</Text>
              <Text style={styles.tokenName}>Trinnity Token</Text>
              <Text style={styles.tokenSupply}>300M de supply</Text>
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenBadgeText}>ERC-20 / BEP-20 / Solana</Text>
              </View>
            </View>
            <View style={styles.tokenCard}>
              <Text style={[styles.tokenSymbol, { color: '#00f5ff' }]}>VSR</Text>
              <Text style={styles.tokenName}>Viseron Crown</Text>
              <Text style={styles.tokenSupply}>Moeda do Batalhão</Text>
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenBadgeText}>Proof of Mandate (PoM)</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={18} color="#00f5ff" />
            <Text style={styles.infoText}>
              $TRIN: Token de governança do ecossistema TVS. $VSR: Moeda do batalhão para prova de mandato.
            </Text>
          </View>

          <TouchableOpacity style={styles.fetchBtn} onPress={fetchTokenInfo} disabled={loading}>
            <Ionicons name="refresh" size={18} color="#0a0a2e" />
            <Text style={styles.fetchText}>Obter Info dos Tokens</Text>
          </TouchableOpacity>

          {loading && <ActivityIndicator size="large" color="#00f5ff" style={{ marginTop: 20 }} />}
          {tokenData && (
            <View style={styles.dataCard}>
              <Text style={styles.dataText}>{tokenData}</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a2e', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  offlineText: { color: '#ff4444', fontSize: 16, marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  tokenGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  tokenCard: { flex: 1, backgroundColor: '#12123a', borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a4e' },
  tokenSymbol: { color: '#ffd700', fontSize: 32, fontWeight: 'bold' },
  tokenName: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 8 },
  tokenSupply: { color: '#6a6a9a', fontSize: 12, marginTop: 4 },
  tokenBadge: { backgroundColor: '#1a1a4e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 10 },
  tokenBadgeText: { color: '#4a4a7a', fontSize: 10 },
  infoCard: { flexDirection: 'row', backgroundColor: '#12123a', borderRadius: 12, padding: 14, gap: 10, marginBottom: 16 },
  infoText: { color: '#6a6a9a', fontSize: 12, flex: 1, lineHeight: 18 },
  fetchBtn: { backgroundColor: '#00f5ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 10, gap: 8 },
  fetchText: { color: '#0a0a2e', fontSize: 14, fontWeight: 'bold' },
  dataCard: { backgroundColor: '#12123a', borderRadius: 12, padding: 16, marginTop: 16 },
  dataText: { color: '#00ff88', fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
});
