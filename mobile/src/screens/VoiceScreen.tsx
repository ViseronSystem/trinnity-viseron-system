import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTVS } from '../context/TVSContext';
import { tvsApi } from '../services/api';

interface VoiceMsg {
  text: string;
  response: string;
  ts: Date;
}

export default function VoiceScreen() {
  const { connected } = useTVS();
  const [messages, setMessages] = useState<VoiceMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    tvsApi.on('voice:response', (data: any) => {
      if (data?.response) {
        setMessages(prev => [...prev, {
          text: data.text || data.command || '[Comando de voz]',
          response: data.response,
          ts: new Date(),
        }]);
      }
    });
    return () => { tvsApi.off('voice:response', () => {}); };
  }, []);

  const sendVoice = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      const result = await tvsApi.voiceCommand(text, 'mobile');
      if (result) {
        setMessages(prev => [...prev, { text, response: result.response, ts: new Date() }]);
      } else {
        const synth = await tvsApi.synthesize(text);
        if (synth) {
          setMessages(prev => [...prev, { text, response: synth.text.slice(0, 500), ts: new Date() }]);
        }
      }
    } catch {
      setMessages(prev => [...prev, { text, response: '[Erro de conexão]', ts: new Date() }]);
    }
    setSending(false);
  };

  return (
    <View style={styles.container}>
      {!connected ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color="#ff4444" />
          <Text style={styles.offlineText}>Conecte ao TVS</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Ionicons name="mic" size={20} color="#00f5ff" />
            <Text style={styles.headerText}>Comando de Voz / Texto</Text>
          </View>

          <ScrollView ref={scrollRef} style={styles.chat}>
            {messages.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="chatbubbles-outline" size={40} color="#1a1a4e" />
                <Text style={styles.emptyText}>Comande o TVS por texto</Text>
                <Text style={styles.emptySubtext}>Digite abaixo para falar com os agentes</Text>
              </View>
            )}
            {messages.map((msg, i) => (
              <View key={i}>
                <View style={styles.myMsg}>
                  <Text style={styles.myText}>{msg.text}</Text>
                </View>
                <View style={styles.theirMsg}>
                  <Text style={styles.theirText}>{msg.response}</Text>
                </View>
              </View>
            ))}
            {sending && <ActivityIndicator size="small" color="#00f5ff" style={{ margin: 12 }} />}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Digite ou fale com os agentes..."
              placeholderTextColor="#4a4a7a"
              onSubmitEditing={sendVoice}
              returnKeyType="send"
              editable={!sending}
            />
            <TouchableOpacity style={[styles.sendBtn, sending && { opacity: 0.5 }]} onPress={sendVoice} disabled={sending}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#0a0a2e" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  offlineText: { color: '#ff4444', fontSize: 16, marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a4e', gap: 8 },
  headerText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  chat: { flex: 1, padding: 12 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#4a4a7a', fontSize: 16, marginTop: 12 },
  emptySubtext: { color: '#2a2a5a', fontSize: 13, marginTop: 4 },
  myMsg: { alignSelf: 'flex-end', backgroundColor: '#1a1a5e', borderRadius: 12, borderBottomRightRadius: 4, padding: 10, marginBottom: 4, maxWidth: '80%' },
  myText: { color: '#00f5ff', fontSize: 13 },
  theirMsg: { alignSelf: 'flex-start', backgroundColor: '#12123a', borderRadius: 12, borderBottomLeftRadius: 4, padding: 10, marginBottom: 12, maxWidth: '85%', borderWidth: 1, borderColor: '#1a1a4e' },
  theirText: { color: '#00ff88', fontSize: 13, lineHeight: 18 },
  inputBar: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#1a1a4e', backgroundColor: '#0d0d35', gap: 8 },
  input: { flex: 1, backgroundColor: '#12123a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14 },
  sendBtn: { backgroundColor: '#00f5ff', width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});
