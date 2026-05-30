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
CROP="$ROOT/build/icon-crop.png"
MASTER="$ROOT/build/icon-1024.png"

# Use the O mark only so the icon stays readable at small sizes.
sips -c 560 560 "$SOURCE" --cropOffset 20 232 --out "$CROP" >/dev/null
sips -z 1024 1024 "$CROP" --out "$MASTER" >/dev/null

for size in 16 32 128 256 512; do
  sips -z "$size" "$size" "$MASTER" --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
  double=$((size * 2))
  sips -z "$double" "$double" "$MASTER" --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done

iconutil -c icns "$ICONSET" -o "$OUTPUT"
echo "Generated $OUTPUT"
