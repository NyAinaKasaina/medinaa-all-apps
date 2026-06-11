#!/usr/bin/env bash
# Build a signed release APK and deposit it in mobile/releases/
#
# Usage:
#   ./scripts/build-release.sh                   # arm64-v8a (default)
#   ./scripts/build-release.sh --arch arm64-v8a
#   ./scripts/build-release.sh --arch armeabi-v7a
#   ./scripts/build-release.sh --arch "arm64-v8a,armeabi-v7a"  # fat APK
#
# The output file is named:
#   releases/medinaa-v<version>-<arch>-<YYYYMMDD>.apk

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$MOBILE_DIR/android"
RELEASES_DIR="$MOBILE_DIR/releases"

# --- defaults ---
ARCH="arm64-v8a"

# --- parse args ---
while [[ $# -gt 0 ]]; do
  case $1 in
    --arch) ARCH="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# --- version from app.json ---
VERSION=$(node -e "console.log(require('$MOBILE_DIR/app.json').expo.version)")
DATE=$(date +%Y%m%d)

# Sanitize arch for filename (replace commas with +)
ARCH_LABEL="${ARCH//,/+}"

OUTPUT_NAME="medinaa-v${VERSION}-${ARCH_LABEL}-${DATE}.apk"
OUTPUT_PATH="$RELEASES_DIR/$OUTPUT_NAME"

echo "╔══════════════════════════════════════════╗"
echo "║  Medinaa — Release APK Build             ║"
echo "╚══════════════════════════════════════════╝"
echo "  Version  : $VERSION"
echo "  Arch     : $ARCH"
echo "  Output   : releases/$OUTPUT_NAME"
echo ""

# --- build ---
cd "$ANDROID_DIR"
./gradlew assembleRelease \
  -PreactNativeArchitectures="$ARCH" \
  --no-daemon \
  --quiet \
  --console=plain

# --- locate and copy APK ---
SRC_APK="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"

if [[ ! -f "$SRC_APK" ]]; then
  echo "ERROR: APK not found at expected path: $SRC_APK"
  exit 1
fi

cp "$SRC_APK" "$OUTPUT_PATH"

SIZE=$(du -sh "$OUTPUT_PATH" | cut -f1)

echo ""
echo "✓ BUILD SUCCESSFUL"
echo "  File : $OUTPUT_PATH"
echo "  Size : $SIZE"
