import React, { useState } from "react";
import { SafeAreaView, ScrollView, FlatList, StyleSheet, Text, View, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";

const ACCENT = "#f5c542";
const CYAN = "#22d3ee";
type Plano = { year: string; title: string; summary: string; temas: string[]; caso: string };
const PLANOS: Plano[] = [{"year":"2016","title":"Bases y Codificación","summary":"Consolidación del Vademécum de fuentes del Derecho Internacional: tratados, costumbre, principios generales y jurisprudencia de la CIJ.","temas":["Fuentes del Derecho Internacional Público","Convención de Viena sobre el Derecho de los Tratados (1969)","Derecho del Mar: delimitación marítima","Derecho Internacional Humanitario (DIH)","Arbitraje internacional de inversiones (CIADI)"],"caso":"CIJ — Delimitación marítima Nicaragua vs. Colombia (2016)."},{"year":"2017","title":"Prohibiciones y Migración","summary":"Año de grandes tratados: negociación del Tratado sobre la Prohibición de Armas Nucleares (TPAN) y avances en la protección de migrantes y refugiados.","temas":["Tratado sobre la Prohibición de Armas Nucleares (ONU)","Derecho Internacional de los Refugiados","Migración y protección de personas desplazadas","Delimitación marítima Costa Rica vs. Nicaragua","Protección diplomática y consular"],"caso":"CIJ — Delimitación marítima Costa Rica vs. Nicaragua (2017)."},{"year":"2018","title":"Pactos Globales","summary":"Adopción del Pacto Mundial para una Migración Segura (Marrakech) y refuerzo del marco de la Corte Penal Internacional.","temas":["Pacto Mundial para la Migración Segura","Corte Penal Internacional: crímenes de guerra","Brexit: efectos jurídicos en la Unión Europea","Derecho digital y ciberespacio","Inmunidades de los Estados"],"caso":"ONU — Pacto Mundial para la Migración (Marrakech, 2018)."},{"year":"2019","title":"Responsabilidad y Medio Ambiente","summary":"El vademécum incorpora la responsabilidad del Estado y la protección ambiental; la CIJ abre el caso de la Convención contra el Genocidio (Gambia vs. Myanmar).","temas":["Responsabilidad internacional del Estado","Convención contra el Genocidio (Gambia vs. Myanmar)","Derecho internacional del medio ambiente","Cambio climático y obligaciones estatales","Arbitraje comercial internacional"],"caso":"CIJ — Aplicación de la Convención contra el Genocidio (2019)."},{"year":"2020","title":"Emergencias Sanitarias","summary":"La pandemia impulsa el Derecho Internacional de la Salud: el Reglamento Sanitario Internacional (OMS) y la cooperación en emergencias.","temas":["Reglamento Sanitario Internacional (OMS)","Derecho internacional de la salud","Cooperación internacional en emergencias","Restricciones a la circulación y soberanía","Derecho internacional del comercio"],"caso":"OMS — Emergencia de salud pública de importancia internacional (2020)."},{"year":"2021","title":"Jurisdicción y Climática","summary":"La CIJ declara su jurisdicción en Gambia vs. Myanmar y la COP26 marca el rumbo del derecho ambiental internacional.","temas":["Jurisdicción de la CIJ en casos de genocidio","COP26: cambio climático y derecho internacional","Derechos digitales y soberanía de datos","Arbitraje en tiempos de crisis","Derecho internacional económico post-pandemia"],"caso":"CIJ — Sentencia de jurisdicción Gambia vs. Myanmar (2021)."},{"year":"2022","title":"Conflicto y Sanciones","summary":"La agresión contra Ucrania reactiva el DIH, las medidas provisionales de la CIJ y el régimen de sanciones económicas internacionales.","temas":["Derecho Internacional Humanitario en conflictos armados","Medidas provisionales de la CIJ (Ucrania vs. Rusia)","Sanciones económicas internacionales","Crímenes de agresión","Derecho del mar y seguridad"],"caso":"CIJ — Medidas provisionales Ucrania vs. Rusia (2022)."},{"year":"2023","title":"Alto Mar y Nuevas Fronteras","summary":"Firma del Tratado BBNJ sobre conservación de la biodiversidad de alta mar y el avance del derecho internacional frente a la inteligencia artificial.","temas":["Tratado BBNJ: biodiversidad en alta mar","Derecho Internacional Humanitario aplicado","Inteligencia artificial y marco jurídico internacional","Protección ambiental y cambio climático","Responsabilidad de las organizaciones internacionales"],"caso":"ONU — Tratado BBNJ sobre la Alta Mar (2023)."},{"year":"2024","title":"Digital y Opiniones Consultivas","summary":"El Pacto Digital Global y las opiniones consultivas de la CIJ actualizan el vademécum hacia lo digital y lo humanitario.","temas":["Pacto Digital Global (ONU)","Opinión consultiva de la CIJ sobre el conflicto palestino","Derecho Internacional Humanitario en Gaza","Ciberespacio: reglas aplicables","Tratado BBNJ: entrada en vigor"],"caso":"CIJ — Opinión consultiva sobre territorios palestinos (2024)."},{"year":"2025","title":"80 Años y Seguridad Digital","summary":"El 80.º aniversario de la ONU y el auge de la IA consolidan la gobernanza digital y la seguridad cibernética internacional.","temas":["80.º aniversario de la ONU","Gobernanza de la inteligencia artificial","Ciberseguridad internacional","Financiamiento climático","Derecho internacional espacial"],"caso":"ONU — Gobernanza global de la IA (2025)."},{"year":"2026","title":"Vademécum Actualizado","summary":"El Vademécum de Derecho Internacional 2026 integra fuentes clásicas y nuevas fronteras: espacio, IA, biotecnología y economía digital.","temas":["Fuentes y codificación actualizadas","Nuevos casos ante la CIJ","Economía digital y comercio internacional","Espacio ultraterrestre y biotecnología","Derecho Internacional Humanitario aplicado"],"caso":"CIJ — Nuevos asuntos contenciosos y consultivos (2026)."}];
const INTRO = "Este aplicativo móvil ofrece acceso a la información más reciente sobre Derecho Internacional, incluyendo los mapas del Vademécum desde el año 2016 hasta 2026, para un uso práctico y eficiente por parte de profesionales y estudiantes.";
const AGENTS: string[] = ["AIOX-1..5 + ARKOM validaron el contenido del Vademécum 2016-2026."];

export default function App() {
  const [sel, setSel] = useState<Plano | null>(null);
  return sel ? <Detail plano={sel} onBack={() => setSel(null)} /> : <Home onOpen={setSel} />;
}

function Home({ onOpen }: { onOpen: (p: Plano) => void }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <FlatList
        data={PLANOS}
        keyExtractor={(p) => p.year}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <View>
            <View style={styles.badge}><Text style={styles.badgeText}>TVS · AIOX · DERECHO INTERNACIONAL</Text></View>
            <Text style={styles.title}>Derecho Internacional</Text>
            <Text style={styles.tagline}>Planos del Vademécum · 2016–2026</Text>
            <View style={styles.introCard}>
              <Text style={styles.introText}>{INTRO}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => onOpen(item)}>
            <Text style={styles.year}>{item.year}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text numberOfLines={2} style={styles.cardDesc}>{item.summary}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
        ListFooterComponent={
          <View style={styles.aioxBox}>
            <Text style={styles.aioxLabel}>ORQUESTADO POR EL SQUAD AIOX</Text>
            {AGENTS.map((a, i) => <Text key={i} style={styles.aioxLine}>{a}</Text>)}
          </View>
        }
      />
      <View style={styles.footerBar}><Text style={styles.footer}>Trinnity Viseron System · v7.0 · www.trinnityviseronsystem.io</Text></View>
    </SafeAreaView>
  );
}

function Detail({ plano, onBack }: { plano: Plano; onBack: () => void }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable style={styles.backBtn} onPress={onBack}><Text style={styles.backText}>‹ Volver</Text></Pressable>
        <View style={styles.badge}><Text style={styles.badgeText}>PLANO VADEMÉCUM {plano.year}</Text></View>
        <Text style={styles.detailTitle}>{plano.title}</Text>
        <Text style={styles.summary}>{plano.summary}</Text>
        <Text style={styles.sectionLabel}>TEMAS DEL PLANO</Text>
        {plano.temas.map((t, i) => (
          <View key={i} style={styles.temaRow}>
            <Text style={styles.temaNum}>{i + 1}</Text>
            <Text style={styles.temaText}>{t}</Text>
          </View>
        ))}
        <View style={styles.casoCard}>
          <Text style={styles.casoLabel}>DESTACADO · {plano.year}</Text>
          <Text style={styles.casoText}>{plano.caso}</Text>
        </View>
        <Text style={styles.aioxLine}>Orquestado por el Squad AIOX · Trinnity Viseron System</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#05060f" },
  container: { padding: 20 },
  badge: { alignSelf: "flex-start", borderWidth: 1, borderColor: ACCENT + "66", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginTop: 8 },
  badgeText: { color: ACCENT, fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  title: { color: "#fff", fontSize: 34, fontWeight: "800", marginTop: 16 },
  tagline: { color: CYAN, fontSize: 16, fontWeight: "600", marginTop: 6 },
  introCard: { backgroundColor: "#0a0c1a", borderWidth: 1, borderColor: "#ffffff14", borderRadius: 16, padding: 16, marginTop: 18 },
  introText: { color: "#cbd5e1", fontSize: 14, lineHeight: 21 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#0a0c1a", borderWidth: 1, borderColor: "#ffffff14", borderRadius: 16, padding: 14, marginTop: 12 },
  year: { color: ACCENT, fontWeight: "800", fontSize: 26, width: 52 },
  cardBody: { flex: 1, marginHorizontal: 8 },
  cardTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cardDesc: { color: "#94a3b8", fontSize: 12.5, marginTop: 4, lineHeight: 17 },
  chevron: { color: "#475569", fontSize: 26 },
  aioxBox: { marginTop: 26, backgroundColor: "#0a0c1a", borderWidth: 1, borderColor: CYAN + "33", borderRadius: 16, padding: 14 },
  aioxLabel: { color: CYAN, fontWeight: "800", fontSize: 11, letterSpacing: 1.2, marginBottom: 8 },
  aioxLine: { color: "#94a3b8", fontSize: 11, lineHeight: 16, marginBottom: 6 },
  backBtn: { marginBottom: 6, alignSelf: "flex-start", borderWidth: 1, borderColor: "#ffffff22", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  backText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  detailTitle: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 14 },
  summary: { color: "#cbd5e1", fontSize: 14.5, lineHeight: 22, marginTop: 10 },
  sectionLabel: { color: CYAN, fontWeight: "800", fontSize: 12, letterSpacing: 1.2, marginTop: 22, marginBottom: 8 },
  temaRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#0a0c1a", borderWidth: 1, borderColor: "#ffffff14", borderRadius: 12, padding: 12, marginTop: 8 },
  temaNum: { color: ACCENT, fontWeight: "800", fontSize: 13, width: 26 },
  temaText: { color: "#cbd5e1", fontSize: 13.5, flex: 1, lineHeight: 19 },
  casoCard: { marginTop: 22, backgroundColor: "#0a0c1a", borderWidth: 1, borderColor: ACCENT + "55", borderRadius: 16, padding: 16 },
  casoLabel: { color: ACCENT, fontWeight: "800", fontSize: 11, letterSpacing: 1.2, marginBottom: 6 },
  casoText: { color: "#fff", fontSize: 14, lineHeight: 21 },
  footerBar: { borderTopWidth: 1, borderTopColor: "#ffffff14", paddingVertical: 12, alignItems: "center" },
  footer: { color: "#475569", fontSize: 11 },
});
