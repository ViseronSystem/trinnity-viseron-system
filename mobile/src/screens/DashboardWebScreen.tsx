import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTVS } from '../context/TVSContext';

export default function DashboardWebScreen() {
  const { serverUrl, connected, localServer } = useTVS();

  if (!connected) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00f5ff" />
        <Text style={styles.loadingText}>
          {localServer ? 'Iniciando servidor TVS local...' : 'Conectando ao servidor...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: '#00ff88' }]} />
        <Text style={styles.headerText}>
          {localServer ? 'Servidor Local' : serverUrl}
        </Text>
      </View>
      <WebView
        source={{ uri: serverUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#00f5ff" />
          </View>
        )}
        onError={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a2e' },
  center: { flex: 1, backgroundColor: '#0a0a2e', justifyContent: 'center', alignItems: 'center', padding: 32 },
  loading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a2e' },
  loadingText: { color: '#00f5ff', fontSize: 16, marginTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#0d0d35', borderBottomWidth: 1, borderBottomColor: '#1a1a4e', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  headerText: { color: '#6a6a9a', fontSize: 12, flex: 1 },
  webview: { flex: 1, backgroundColor: '#050510' },
});
