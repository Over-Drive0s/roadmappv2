#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SOURCE="${ICON_SOURCE:-$ROOT/build/icon-source.png}"
ICONSET="$ROOT/build/icon.iconset"
OUTPUT="$ROOT/build/icon.icns"

if [[ ! -f "$SOURCE" ]]; then
  FALLBACK="$ROOT/public/over-drive-logo.png"
  if [[ -f "$ROOT/build/icon-source.jpg" ]]; then
    sips -s format png "$ROOT/build/icon-source.jpg" --out "$SOURCE" >/dev/null
  elif [[ -f "$FALLBACK" ]]; then
    cp "$FALLBACK" "$SOURCE"
  else
    echo "Missing icon source. Place build/icon-source.png first." >&2
    exit 1
  fi
fi

mkdir -p "$ICONSET"
MASTER="$ROOT/build/icon-1024.png"
PUBLIC_ICON="$ROOT/public/app-icon.png"

# Pad to a square canvas so the mark stays centered at all icon sizes.
sips -s format png --padToHeightWidth 1024 1024 "$SOURCE" --padColor FFFFFF --out "$MASTER" >/dev/null
sips -s format png -z 512 512 "$MASTER" --out "$PUBLIC_ICON" >/dev/null

for size in 16 32 128 256 512; do
  sips -s format png -z "$size" "$size" "$MASTER" --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
  double=$((size * 2))
  sips -s format png -z "$double" "$double" "$MASTER" --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done

iconutil -c icns "$ICONSET" -o "$OUTPUT"
echo "Generated $OUTPUT"
