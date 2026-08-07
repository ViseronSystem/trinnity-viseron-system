import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

const ACCENT = "#a78bfa";
const TITLE = "Medita Zen";
const TAGLINE = "Medita Zen - Calm Your Mind";
const FEATURES = ["Guided Sessions in Portuguese","Customizable Meditation Plans","Progress Tracking and Insights"];

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.badge}><Text style={styles.badgeText}>TVS AI Powered</Text></View>
        <Text style={styles.title}>{TITLE}</Text>
        <Text style={styles.tagline}>{TAGLINE}</Text>
        <View style={styles.feats}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.cardNum}>0{i + 1}</Text>
              <Text style={styles.cardText}>{f}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.footer}>Gerado pelo Trinnity Viseron System</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#05060f" },
  container: { padding: 24, alignItems: "center" },
  badge: { borderWidth: 1, borderColor: ACCENT + "66", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginTop: 12 },
  badgeText: { color: ACCENT, fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  title: { color: "#fff", fontSize: 32, fontWeight: "800", textAlign: "center", marginTop: 22 },
  tagline: { color: "#94a3b8", fontSize: 16, textAlign: "center", marginTop: 12, lineHeight: 24 },
  feats: { width: "100%", marginTop: 34, gap: 12 },
  card: { backgroundColor: "#0a0c1a", borderWidth: 1, borderColor: "#ffffff14", borderRadius: 16, padding: 18 },
  cardNum: { color: ACCENT, fontWeight: "800", fontSize: 12, letterSpacing: 1, marginBottom: 8 },
  cardText: { color: "#cbd5e1", fontSize: 15 },
  footer: { color: "#475569", fontSize: 12, marginTop: 34 },
});
