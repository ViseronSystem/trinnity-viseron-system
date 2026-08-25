import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTVS } from '../context/TVSContext';

interface Log {
  type: 'system' | 'command' | 'response' | 'error' | 'info';
  text: string;
  ts: Date;
}

const BUILTIN_COMMANDS: Record<string, string> = {
  help: 'Comandos: help, stats, agents, status, battalion, directives, clear, synth <text>',
  stats: 'Requisitando estatísticas do TVS...',
  agents: 'Listando agentes do sistema...',
  status: 'Requisitando status completo...',
  battalion: 'Requisitando dados do batalhão...',
  directives: 'Requisitando directivas ativas...',
  clear: '',
};

export default function TerminalScreen() {
  const { connected, sendCommand, refresh, stats, agents, status, battalion, directives } = useTVS();
  const [logs, setLogs] = useState<Log[]>([
    { type: 'system', text: 'TVS Mobile Terminal v7.0', ts: new Date() },
    { type: 'system', text: 'Digite help para comandos disponíveis', ts: new Date() },
  ]);
  const [command, setCommand] = useState('');
  const [executing, setExecuting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [logs]);

  const addLog = (type: Log['type'], text: string) => {
    setLogs(prev => [...prev, { type, text, ts: new Date() }]);
  };

  const executeCommand = async () => {
    if (!command.trim() || executing) return;
    const cmd = command.trim();
    addLog('command', `$ ${cmd}`);
    setCommand('');
    setExecuting(true);

    try {
      const lower = cmd.toLowerCase();

      if (lower === 'clear') {
        setLogs([{ type: 'system', text: 'Terminal limpo', ts: new Date() }]);
        setExecuting(false);
        return;
      }

      if (lower === 'help') {
        addLog('info', BUILTIN_COMMANDS.help);
        setExecuting(false);
        return;
      }

      if (lower === 'stats' && stats) {
        addLog('response', `Total Agentes: ${stats.totalAgents}\nEvoluções: ${stats.evolutionCycles}\nSabedoria Média: ${stats.averageWisdom.toFixed(1)}%\nInteligência: ${stats.superMindKnowledge}%\nArquetipos: ${stats.archetypesLoaded}\nDirectivas Ativas: ${stats.activeDirectives}`);
        setExecuting(false);
        return;
      }

      if (lower === 'agents') {
        const list = agents.slice(0, 30).map(a => `  ${a.status === 'ACTIVE' ? '●' : '○'} ${a.name} (${a.role})`).join('\n');
        addLog('response', `${agents.length} agentes no sistema:\n${list}`);
        setExecuting(false);
        return;
      }

      if (lower === 'status' && status) {
        addLog('response', `Core: ${status.core}\nStatus: ${status.status}\nAgentes: ${status.agentsStats.total} (${status.agentsStats.active} ativos, ${status.agentsStats.paused} pausados)\nSquads: ${status.squads.length}`);
        setExecuting(false);
        return;
      }

      if (lower === 'battalion' && battalion) {
        addLog('response', `Batalhão ${battalion.standard}\nTotal: ${battalion.totalAgents} agentes\nCorona: ${battalion.corona} | Hierro: ${battalion.hierro}\nÁreas: ${battalion.areaList.join(', ')}\nSoberanos: ${battalion.sovereigns.map(s => s.name).join(', ')}`);
        setExecuting(false);
        return;
      }

      if (lower === 'directives' && directives) {
        addLog('response', `Directivas: ${directives.active} ativas, ${directives.completed} completadas, ${directives.total} total`);
        setExecuting(false);
        return;
      }

      if (lower.startsWith('synth ') || lower.startsWith('synthesize ')) {
        const prompt = cmd.replace(/^(synth|synthesize)\s+/i, '');
        addLog('info', `Sintetizando: "${prompt.slice(0, 80)}..."`);
        const result = await sendCommand(prompt);
        if (result) {
          addLog('response', result);
        } else {
          addLog('error', 'Falha na síntese');
        }
        setExecuting(false);
        return;
      }

      const result = await sendCommand(cmd);
      if (result) {
        addLog('response', result);
      } else {
        addLog('error', 'Comando não reconhecido. Use help.');
      }
    } catch (e: any) {
      addLog('error', `Erro: ${e.message}`);
    }
    setExecuting(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={[styles.connDot, { backgroundColor: connected ? '#00ff88' : '#ff4444' }]} />
        <Text style={styles.headerText}>{connected ? 'TVS Online' : 'Desconectado'}</Text>
        <TouchableOpacity onPress={refresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={16} color="#4a4a7a" />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} style={styles.terminal} contentContainerStyle={{ paddingBottom: 8 }}>
        {logs.map((log, i) => (
          <View key={i} style={styles.logLine}>
            <Text style={[
              styles.logText,
              log.type === 'command' && styles.cmdText,
              log.type === 'response' && styles.respText,
              log.type === 'error' && styles.errText,
              log.type === 'info' && styles.infoText,
            ]}>
              {log.text}
            </Text>
          </View>
        ))}
        {executing && (
          <View style={styles.logLine}>
            <ActivityIndicator size="small" color="#00f5ff" />
          </View>
        )}
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
          editable={!executing}
        />
        <TouchableOpacity style={[styles.sendBtn, executing && { opacity: 0.5 }]} onPress={executeCommand} disabled={executing}>
          <Ionicons name="send" size={18} color="#0a0a2e" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a2e' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a4e', backgroundColor: '#0d0d35' },
  connDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  headerText: { color: '#6a6a9a', fontSize: 12, flex: 1 },
  refreshBtn: { padding: 4 },
  terminal: { flex: 1, padding: 10 },
  logLine: { marginBottom: 3 },
  logText: { color: '#6a6a9a', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12 },
  cmdText: { color: '#00f5ff', fontWeight: 'bold' },
  respText: { color: '#00ff88' },
  errText: { color: '#ff4444' },
  infoText: { color: '#ffd700' },
  inputBar: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#1a1a4e', backgroundColor: '#0d0d35', gap: 8 },
  input: { flex: 1, backgroundColor: '#12123a', borderRadius: 8, padding: 10, color: '#fff', fontSize: 13 },
  sendBtn: { backgroundColor: '#00f5ff', width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});
