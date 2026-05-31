#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/mac/Over Drive OS.app"
DMG="$ROOT/Over Drive OS-1.0.0.dmg"
STAGING="$ROOT/.dmg-staging"

if [[ ! -d "$APP" ]]; then
  echo "Missing packaged app at: $APP" >&2
  echo "Run: npm run electron:pack" >&2
  exit 1
fi

rm -rf "$STAGING"
mkdir -p "$STAGING"
cp -R "$APP" "$STAGING/"
ln -s /Applications "$STAGING/Applications"

rm -f "$DMG"
hdiutil create \
  -volname "Over Drive OS" \
  -srcfolder "$STAGING" \
  -ov \
  -format UDZO \
  "$DMG"

rm -rf "$STAGING"
echo "Created $DMG"
