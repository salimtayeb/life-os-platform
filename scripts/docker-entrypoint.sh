#!/usr/bin/env bash
set -euo pipefail

export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-/opt/android-sdk}"
export PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"

BUILD_TYPE="${1:-debug}"

echo "=== docker-entrypoint: Building APK ($BUILD_TYPE) ==="

cd /app/android
./gradlew "assemble${BUILD_TYPE^}" --no-daemon

echo "=== APK built ==="
ls -lh /app/android/app/build/outputs/apk/$BUILD_TYPE/app-$BUILD_TYPE.apk

exec "$@"
