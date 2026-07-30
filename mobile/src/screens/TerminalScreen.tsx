import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tvsApi } from '../services/api';

interface LogEntry {
  type: 'system' | 'command' | 'response' | 'error';
  text: string;
  timestamp: Date;
}

export default function TerminalScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([
    { type: 'system', text: 'TVS Mobile Terminal v5.0', timestamp: new Date() },
    { type: 'system', text: 'Conecte ao servidor TVS para comandar agentes', timestamp: new Date() },
  ]);
  const [command, setCommand] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [logs]);

  const executeCommand = async () => {
    if (!command.trim()) return;

    const cmd = command.trim();
    setLogs(prev => [...prev, { type: 'command', text: `$ ${cmd}`, timestamp: new Date() }]);
    setCommand('');

    try {
      const result = await tvsApi.synthesize(cmd);
      if (result) {
        setLogs(prev => [...prev, {
          type: 'response',
          text: `Confiança: ${result.confidence}% | Wisdom: ${result.wisdomScore}/100\n${result.text.slice(0, 500)}`,
          timestamp: new Date(),
        }]);
      } else {
        setLogs(prev => [...prev, { type: 'error', text: 'Falha ao comunicar com TVS', timestamp: new Date() }]);
      }
    } catch {
      setLogs(prev => [...prev, { type: 'error', text: 'Erro de conexão', timestamp: new Date() }]);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} style={styles.terminal}>
        {logs.map((log, i) => (
          <View key={i} style={styles.logLine}>
            <Text style={[
              styles.logText,
              log.type === 'command' && styles.commandText,
              log.type === 'response' && styles.responseText,
              log.type === 'error' && styles.errorText,
            ]}>
              {log.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={command}
          onChangeText={setCommand}
          placeholder="Comande os agentes..."
          placeholderTextColor="#4a4a7a"
          onSubmitEditing={executeCommand}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={executeCommand}>
          <Ionicons name="send" size={20} color="#0a0a2e" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a2e' },
  terminal: { flex: 1, padding: 12 },
  logLine: { marginBottom: 4 },
  logText: { color: '#6a6a9a', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13 },
  commandText: { color: '#00f5ff', fontWeight: 'bold' },
  responseText: { color: '#00ff88' },
  errorText: { color: '#ff4444' },
  inputBar: {
    flexDirection: 'row', padding: 12, borderTopWidth: 1,
    borderTopColor: '#1a1a4e', backgroundColor: '#0d0d35',
  },
  input: {
    flex: 1, backgroundColor: '#12123a', borderRadius: 8, padding: 12,
    color: '#fff', fontSize: 14, marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#00f5ff', width: 44, height: 44, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
});
