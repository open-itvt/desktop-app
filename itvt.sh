#!/usr/bin/env bash

# iTVT — one‑file launcher dla NixOS
# Umieść ten plik obok binarki (np. po bash scripts/nix-build.sh) i uruchom:
#   chmod +x itvt.sh && ./itvt.sh
# Jeśli binarki nie ma obok, skrypt sam zbuduje aplikację.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BINARY="$SCRIPT_DIR/desktop-app"

if [ ! -f "$BINARY" ]; then
  BINARY="$SCRIPT_DIR/usr/bin/desktop-app"
fi

if [ ! -f "$BINARY" ]; then
  echo "=== Buduję iTVT z kodu źródłowego ==="
  SRC_DIR="$SCRIPT_DIR"
  # Jeśli skrypt jest na zewnątrz, sprawdź sąsiedni katalog
  [ -f "$SRC_DIR/src-tauri/Cargo.toml" ] || SRC_DIR="$(pwd)"
  cd "$SRC_DIR"
  pnpm install --frozen-lockfile
  pnpm tauri build --bundles deb,rpm
  BINARY="src-tauri/target/release/desktop-app"
  echo "=== Zbudowano: $BINARY ==="
fi

# GStreamer — znajdź pluginy w systemowym profilu NixOS
GST_DIRS=""
for d in /run/current-system/sw/lib/gstreamer-1.0 \
         /nix/var/nix/profiles/default/lib/gstreamer-1.0 \
         ~/.nix-profile/lib/gstreamer-1.0; do
  [ -d "$d" ] && GST_DIRS="${GST_DIRS:+$GST_DIRS:}$d"
done

export GST_PLUGIN_SYSTEM_PATH="$GST_DIRS"
export GST_PLUGIN_PATH="$GST_DIRS"
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export WEBKIT_DISABLE_DMABUF_RENDERER=1
export WEBKIT_USE_GL=software

exec nix run --impure github:nix-community/nixGL -- "$BINARY"
