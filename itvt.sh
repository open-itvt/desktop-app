#!/usr/bin/env nix-shell
#!nix-shell -i bash -p nixpkgs.nixGL

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

# Ścieżki do pluginów GStreamera z nixpkgs
GST_LIB=""
for p in gst_all_1.gstreamer gst_all_1.gst-plugins-base gst_all_1.gst-plugins-good \
         gst_all_1.gst-plugins-bad gst_all_1.gst-plugins-ugly gst_all_1.gst-libav; do
  d="$(nix eval --impure "nixpkgs#$p" --raw 2>/dev/null || true)"
  [ -n "$d" ] && [ -d "$d/lib/gstreamer-1.0" ] && GST_LIB="${GST_LIB:+$GST_LIB:}$d/lib/gstreamer-1.0"
done

export GST_PLUGIN_SYSTEM_PATH="$GST_LIB"
export GST_PLUGIN_PATH="$GST_LIB"
export GST_REGISTRY_REUSE_PLUGIN_SCANNER="no"
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export WEBKIT_DISABLE_DMABUF_RENDERER=1
export WEBKIT_USE_GL=software

exec nixGL "$BINARY"
