import { askLocalAI } from "../calls/learning";
import { AppMeta, AppScaffoldStore, GeneratedApp, slugifyApp } from "./store";

const ACCENTS = ["#22d3ee", "#a78bfa", "#34d399", "#f472b6", "#fbbf24", "#fb7185"];

function pickAccent(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

interface AppContent {
  tagline: string;
  features: string[];
}

function fallbackContent(name: string): AppContent {
  return {
    tagline: `${name} — a inteligência no teu bolso.`,
    features: ["Interface simples e moderna", "Feito com React Native / Expo", "Pronto para publicar"],
  };
}

async function aiContent(name: string, description: string): Promise<AppContent> {
  const prompt = `Design a mobile app called "${name}". Description: ${description.slice(0, 800)}

Return STRICT JSON only with keys: tagline (short, max 10 words), features (exactly 3 strings, each max 7 words). Write everything in English.`;

  const raw = await askLocalAI(prompt, "You output only valid JSON, nothing else.");
  if (raw) {
    try {
      const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || "{}");
      if (typeof parsed.tagline === "string" && parsed.tagline.trim()) {
        return {
          tagline: String(parsed.tagline).slice(0, 120),
          features: Array.isArray(parsed.features) && parsed.features.length >= 3 ? parsed.features.map(String).slice(0, 3) : fallbackContent(name).features,
        };
      }
    } catch {}
  }
  return fallbackContent(name);
}

function scaffoldFiles(meta: AppMeta, content: AppContent): Record<string, string> {
  const featureCards = content.features
    .map((f) => `        <View key={${JSON.stringify(f)}} style={styles.card}><Text style={styles.cardText}>{${JSON.stringify(f)}}</Text></View>`)
    .join("\n");

  const AppTsx = `import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

const ACCENT = ${JSON.stringify(meta.accent)};
const TITLE = ${JSON.stringify(meta.name)};
const TAGLINE = ${JSON.stringify(content.tagline)};
const FEATURES = ${JSON.stringify(content.features)};

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
`;

  return {
    "app.json": JSON.stringify(
      {
        expo: {
          name: meta.name,
          slug: meta.slug,
          version: "1.0.0",
          orientation: "portrait",
          icon: "./assets/icon.png",
          userInterfaceStyle: "dark",
          splash: { backgroundColor: "#05060f" },
          ios: { supportsTablet: true, bundleIdentifier: `com.tvs.app.${meta.slug}` },
          android: { package: `com.tvs.app.${meta.slug}`, edgeToEdgeEnabled: true },
        },
      },
      null,
      2
    ),
    "App.tsx": AppTsx,
    "index.ts": `import { registerRootComponent } from "expo";
import App from "./App";
registerRootComponent(App);
`,
    "package.json": JSON.stringify(
      {
        name: meta.slug,
        version: "1.0.0",
        main: "index.ts",
        scripts: {
          start: "expo start",
          android: "expo run:android",
          web: "expo start --web",
          "build:apk": "eas build --platform android --profile preview",
        },
        dependencies: {
          "expo": "~52.0.0",
          "expo-status-bar": "~2.0.0",
          "react": "18.3.1",
          "react-native": "0.76.9",
        },
        devDependencies: {
          "@babel/core": "^7.25.0",
          "@types/react": "~18.3.0",
          "typescript": "^5.3.0",
        },
        private: true,
      },
      null,
      2
    ),
    "tsconfig.json": JSON.stringify(
      { extends: "expo/tsconfig.base", compilerOptions: { strict: true } },
      null,
      2
    ),
  };
}

export async function createApp(store: AppScaffoldStore, name: string, description: string, lang: "pt" | "en" | "es" = "pt"): Promise<GeneratedApp> {
  const content = await aiContent(name, description);
  const meta: AppMeta = {
    slug: slugifyApp(name),
    name: name.trim().slice(0, 60),
    description: description.trim().slice(0, 1200),
    tagline: content.tagline,
    features: content.features,
    accent: pickAccent(name),
    lang,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const files = scaffoldFiles(meta, content);
  store.writeApp(meta.slug, files);
  store.save({ meta, files });
  return { meta, files };
}
