#!/usr/bin/env bash
# android-build.sh — compila APK no Linux (JDK 17 + Android SDK).
# Requer o passo 7 do server-setup.sh (ou ANDROID_HOME exportado).
#   ./android-build.sh                 -> APK da app principal (mobile/)
#   ./android-build.sh <slug>          -> APK de uma app gerada (mobile/apps/<slug>)
#   OUTPUT_APK=/caminho/out.apk ./android-build.sh [slug]
set -euo pipefail
export ANDROID_HOME="${ANDROID_HOME:-/opt/android-sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SLUG="${1:-}"
APP_DIR="$ROOT/mobile"
if [[ -n "$SLUG" ]]; then
  APP_DIR="$ROOT/mobile/apps/$SLUG"
  if [[ ! -d "$APP_DIR" ]]; then echo "App '$SLUG' não encontrada em mobile/apps/$SLUG"; exit 1; fi
fi

if [[ ! -d "$ROOT/mobile/android" && -z "$SLUG" ]]; then
  echo "→ prebuild (gera android/) ..."
  (cd "$ROOT/mobile" && npx expo prebuild --platform android --no-install)
fi
if [[ -n "$SLUG" && ! -d "$APP_DIR/android" ]]; then
  echo "→ prebuild da app '$SLUG' ..."
  (cd "$APP_DIR" && npx expo prebuild --platform android --no-install)
fi

echo "→ gradlew assembleRelease ..."
cd "$APP_DIR/android"
./gradlew assembleRelease --no-daemon -q

APK="$(find app/build/outputs/apk -name "*.apk" 2>/dev/null | head -1)"
if [[ -z "$APK" ]]; then echo "ERRO: APK não produzido"; exit 1; fi
OUT="${OUTPUT_APK:-$ROOT/data/apps/$SLUG.apk}"
if [[ -n "$SLUG" ]]; then mkdir -p "$ROOT/data/apps"; else OUT="$ROOT/data/apps/tvs.apk"; fi
cp -f "$APK" "$OUT"
echo "✓ APK: $OUT ($(du -h "$OUT" | cut -f1))"
