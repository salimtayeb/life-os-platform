# ============================================================
# Stage 1 : Build Next.js + export statique + cap sync
# ============================================================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./

RUN apt-get update && apt-get install -y --no-install-recommends jq && rm -rf /var/lib/apt/lists/* \
    && jq 'del(.devDependencies["lightningcss-win32-x64-msvc"])' package.json > package.json.tmp \
    && mv package.json.tmp package.json

RUN npm ci

COPY frontend/tsconfig.json frontend/next.config.ts frontend/postcss.config.mjs frontend/next-env.d.ts ./
COPY frontend/src/ ./src/
COPY frontend/capacitor.config.ts ./
COPY frontend/android/ ./android/

RUN npm run build
RUN npx cap sync

# ============================================================
# Stage 2 : Android SDK + build APK (Java 17, SDK 34)
# ============================================================
FROM eclipse-temurin:21-jdk-jammy AS android-builder

ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH
ENV GRADLE_USER_HOME=/gradle-cache

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget unzip && rm -rf /var/lib/apt/lists/*

RUN wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip \
    -O cmdline-tools.zip \
    && mkdir -p $ANDROID_SDK_ROOT/cmdline-tools \
    && unzip -q cmdline-tools.zip -d $ANDROID_SDK_ROOT/cmdline-tools \
    && mv $ANDROID_SDK_ROOT/cmdline-tools/cmdline-tools $ANDROID_SDK_ROOT/cmdline-tools/latest \
    && rm cmdline-tools.zip

RUN yes | sdkmanager --licenses > /dev/null 2>&1 \
    && sdkmanager \
        "platforms;android-36" \
        "build-tools;36.0.0" \
        "platform-tools" \
    > /dev/null 2>&1

COPY --from=builder /app/android /app/android
COPY --from=builder /app/node_modules/@capacitor /app/node_modules/@capacitor

WORKDIR /app/android

RUN --mount=type=cache,target=/gradle-cache \
    ./gradlew assembleDebug --no-daemon

# ============================================================
# Stage 3 : Image finale (juste l'APK)
# ============================================================
FROM busybox:1.36 AS artifact
COPY --from=android-builder /app/android/app/build/outputs/apk/debug/app-debug.apk /app-debug.apk
