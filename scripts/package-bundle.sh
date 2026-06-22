#!/usr/bin/env bash
# Pakuje binarkę desktop-app w jeden plik .sh (self-extracting archive)
# Użycie: bash scripts/package-bundle.sh [ścieżka-do-binarki]
# Wynik: iTVT-2.0.0-x86_64-linux.AppBundle.sh (jeden plik do dystrybucji)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BINARY="${1:-$PROJECT_DIR/src-tauri/target/release/desktop-app}"

if [ ! -f "$BINARY" ]; then
  echo "Błąd: binarka nie znaleziona w $BINARY"
  echo "Najpierw zbuduj: cd $PROJECT_DIR && bash scripts/nix-build.sh"
  exit 1
fi

VERSION="$("$BINARY" --version 2>/dev/null || echo "2.0.0")"
ARCH="$(uname -m)"
OUTPUT="$PROJECT_DIR/iTVT-${VERSION}-${ARCH}-linux.AppBundle.sh"

# Oblicz rozmiar przed kompresją
RAW_SIZE=$(stat -c%s "$BINARY")
echo "=== Pakuję binarkę (${RAW_SIZE} bajtów) ==="

# Kompresuj z gzip
B64_DATA=$(gzip -c "$BINARY" | base64 -w 72)
B64_SIZE=$(echo "$B64_DATA" | wc -c)

echo "=== Tworzę $OUTPUT ==="

cat > "$OUTPUT" << 'BUNDLE_HEADER'
#!/usr/bin/env nix-shell
#!nix-shell -i bash -p nixpkgs.nixGL
# iTVT AppBundle — self-extracting, one-file launcher for NixOS
# Wyodrębnij: bash thisfile.sh --extract /ścieżka
set -euo pipefail

BOUNDARY="__ITVT_ARCHIVE__"
SCRIPT_DIR="$(cd "$(dirname "$0"}" && pwd)"
TMP_DIR=""
EXTRACT_ONLY=0

if [ "${1:-}" = "--extract" ]; then
  EXTRACT_ONLY=1
  TMP_DIR="${2:-/tmp/itvt-extract}"
else
  TMP_DIR="$(mktemp -d)"
  trap 'rm -rf "$TMP_DIR"' EXIT
fi

echo "=== iTVT AppBundle ==="
# Wyodrębnij archiwum
ARCHIVE_LINE=$(grep -n "^$BOUNDARY$" "$0" | tail -1 | cut -d: -f1)
ARCHIVE_LINE=$((ARCHIVE_LINE + 1))
tail -n +$ARCHIVE_LINE "$0" | base64 -d | gzip -d > "$TMP_DIR/desktop-app" 2>/dev/null || {
  echo "Błąd wyodrębniania archiwum"
  exit 1
}
chmod +x "$TMP_DIR/desktop-app"

if [ $EXTRACT_ONLY -eq 1 ]; then
  echo "=== Wyodrębniono do: $TMP_DIR/desktop-app ==="
  exit 0
fi

# Środowisko GStreamer
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

exec nixGL "$TMP_DIR/desktop-app"
BUNDLE_HEADER

# Wstaw archiwum
echo "$BOUNDARY" >> "$OUTPUT"
gzip -c "$BINARY" | base64 -w 72 >> "$OUTPUT"
echo "" >> "$OUTPUT"

chmod +x "$OUTPUT"
echo "=== Gotowe: $OUTPUT ==="
echo "    Uruchom: ./$(basename "$OUTPUT")"
echo "    Wyodrębnij: ./$(basename "$OUTPUT") --extract /ścieżka"
