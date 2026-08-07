import React from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";
import { GAME_HTML } from "./game-html";

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <WebView
        originWhitelist={["*"]}
        source={{ html: GAME_HTML, baseUrl: "https://www.trinnityviseronsystem.io/" }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  webview: { flex: 1 },
});
