#!/bin/bash
# TVS v5.0 Cross-Platform Build Script (Linux/macOS)
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/mobile"
TARGET="${1:-all}"

echo "╔══════════════════════════════════════════════╗"
echo "║  TVS v5.0 - Cross-Platform Build System     ║"
echo "╚══════════════════════════════════════════════╝"

build_core() {
  echo -e "\n[1/3] Building TVS Core (TypeScript)..."
  cd "$ROOT"
  npm run build
  echo "[OK] Core built to dist/"
}

build_android() {
  echo -e "\n[2/3] Building Android APK..."
  cd "$MOBILE"
  npm install
  npx expo run:android
  echo "[OK] APK generated"
}

build_ios() {
  echo -e "\n[3/3] Building iOS IPA..."
  cd "$MOBILE"
  npm install
  npx expo run:ios
  echo "[OK] IPA generated"
}

build_eas_android() {
  echo -e "\n[2/3] Building Android APK via EAS..."
  cd "$MOBILE"
  npm install
  npx eas build --platform android --profile preview
  echo "[OK] APK submitted to EAS"
}

build_eas_ios() {
  echo -e "\n[3/3] Building iOS IPA via EAS..."
  cd "$MOBILE"
  npm install
  npx eas build --platform ios --profile production
  echo "[OK] IPA submitted to EAS"
}

build_core

case "${TARGET,,}" in
  android) build_android ;;
  ios) build_ios ;;
  eas-android) build_eas_android ;;
  eas-ios) build_eas_ios ;;
  all)
    build_android
    build_ios
    ;;
  eas)
    build_eas_android
    build_eas_ios
    ;;
  *)
    echo "Unknown target: $TARGET"
    echo "Valid: all, android, ios, eas, eas-android, eas-ios"
    exit 1
    ;;
esac

echo -e "\n✅ All builds completed successfully!"
