#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/../frontend" && pwd)"
BUILD_TYPE="${1:-debug}"

echo "=== Step 1: npm ci ==="
cd "$APP_DIR"
npm ci

echo "=== Step 2: next build (static export) ==="
npm run build

echo "=== Step 3: cap sync ==="
npx cap sync

echo "=== Step 4: Build APK ($BUILD_TYPE) ==="
cd android
./gradlew "assemble${BUILD_TYPE^}" --no-daemon

echo "=== APK generated ==="
ls -lh "$APP_DIR/android/app/build/outputs/apk/$BUILD_TYPE/app-$BUILD_TYPE.apk"
