import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTVS } from '../context/TVSContext';

export default function SettingsScreen() {
  const { serverUrl, setServer, connected } = useTVS();
  const [urlInput, setUrlInput] = useState(serverUrl);
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    const url = urlInput.trim();
    if (!url) {
      Alert.alert('Erro', 'Digite uma URL válida');
      return;
    }
    let normalized = url;
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'http://' + normalized;
    }
    normalized = normalized.replace(/\/+$/, '');
    setTesting(true);
    try {
      const res = await fetch(`${normalized}/api/health`);
      if (res.ok) {
        setServer(normalized);
        Alert.alert('Conectado', `TVS encontrado em ${normalized}`);
      } else {
        Alert.alert('Atenção', `Servidor respondeu com status ${res.status}`);
      }
    } catch {
      Alert.alert('Erro', `Não foi possível conectar em ${normalized}. Verifique o IP e se o TVS está rodando.`);
    }
    setTesting(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Conexão com Servidor TVS</Text>
      <Text style={styles.description}>
        Configure o endereço do servidor TVS. Use o IP da máquina onde o TVS está rodando.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>URL do Servidor</Text>
        <TextInput
          style={styles.input}
          value={urlInput}
          onChangeText={setUrlInput}
          placeholder="http://192.168.1.100:3000"
          placeholderTextColor="#4a4a7a"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </View>

      <TouchableOpacity style={[styles.saveBtn, testing && { opacity: 0.5 }]} onPress={handleSave} disabled={testing}>
        <Ionicons name={testing ? 'sync' : 'checkmark-circle'} size={20} color="#0a0a2e" />
        <Text style={styles.saveText}>{testing ? 'Testando...' : 'Conectar'}</Text>
      </TouchableOpacity>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Status da Conexão</Text>
        <View style={styles.statusRow}>
          <View style={[styles.connDot, { backgroundColor: connected ? '#00ff88' : '#ff4444' }]} />
          <Text style={styles.statusValue}>{connected ? 'Online' : 'Offline'}</Text>
        </View>
        <Text style={styles.serverUrl}>{serverUrl}</Text>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#00f5ff" />
        <Text style={styles.infoText}>
          No Android, use o IP da máquina (ex: 192.168.1.100). No iOS simulator, pode usar localhost.
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Sobre</Text>
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>Trinnity Viseron System</Text>
        <Text style={styles.aboutVersion}>v7.0.0 Mobile</Text>
        <Text style={styles.aboutDesc}>Multi-Agent AI Operating System</Text>
        <Text style={styles.aboutDesc}>5000+ mentes | 246+ arquetipos | SuperInteligência</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a2e', padding: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  description: { color: '#6a6a9a', fontSize: 13, marginBottom: 16, lineHeight: 20 },
  inputGroup: { marginBottom: 16 },
  label: { color: '#4a4a7a', fontSize: 12, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: '#12123a', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#1a1a4e' },
  saveBtn: { backgroundColor: '#00f5ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 10, gap: 8, marginBottom: 20 },
  saveText: { color: '#0a0a2e', fontSize: 16, fontWeight: 'bold' },
  statusCard: { backgroundColor: '#12123a', borderRadius: 12, padding: 16, marginBottom: 16 },
  statusLabel: { color: '#4a4a7a', fontSize: 11, textTransform: 'uppercase', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  connDot: { width: 10, height: 10, borderRadius: 5 },
  statusValue: { color: '#fff', fontSize: 16, fontWeight: '600' },
  serverUrl: { color: '#6a6a9a', fontSize: 12, marginTop: 6, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#12123a', borderRadius: 12, padding: 14, gap: 10, marginBottom: 8 },
  infoText: { color: '#6a6a9a', fontSize: 12, flex: 1, lineHeight: 18 },
  aboutCard: { backgroundColor: '#12123a', borderRadius: 12, padding: 16, alignItems: 'center' },
  aboutTitle: { color: '#00f5ff', fontSize: 16, fontWeight: 'bold' },
  aboutVersion: { color: '#4a4a7a', fontSize: 13, marginTop: 4 },
  aboutDesc: { color: '#6a6a9a', fontSize: 12, marginTop: 4 },
});
