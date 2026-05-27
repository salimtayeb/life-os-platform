#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_TYPE="${1:-debug}"

echo "=== Building APK via Docker ==="
cd "$PROJECT_DIR"

echo "=== Step 1: Build Docker image ==="
docker compose -f docker/docker-compose.yml build

echo "=== Step 2: Extract APK ==="
CONTAINER_ID=$(docker create docker-android-builder)
docker cp "$CONTAINER_ID":/app-debug.apk generated/app-"$BUILD_TYPE".apk
docker rm "$CONTAINER_ID"

echo "=== APK generated ==="
ls -lh generated/app-"$BUILD_TYPE".apk
