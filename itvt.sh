#!/usr/bin/env nix-shell
#!nix-shell -i bash -p nixpkgs.nixGLIntel

# iTVT — one-file launcher for NixOS
# Place this file anywhere, make it executable, and run it.
# It will automatically set up GStreamer, nixGL and launch the app.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BINARY="${SCRIPT_DIR}/desktop-app"

# If the binary is not next to this script, try the expected directory from a build
if [ ! -f "$BINARY" ]; then
  BINARY="${SCRIPT_DIR}/usr/bin/desktop-app"
fi

if [ ! -f "$BINARY" ]; then
  echo "Error: desktop-app binary not found next to this script."
  echo "Place this launcher in the same directory as the extracted .deb or AppDir."
  exit 1
fi

# Get GStreamer plugin paths from nixpkgs
GST_LIB_PATH=""
for pkg in gst_all_1.gstreamer gst_all_1.gst-plugins-base gst_all_1.gst-plugins-good gst_all_1.gst-plugins-bad gst_all_1.gst-plugins-ugly gst_all_1.gst-libav; do
  path="$(nix eval --impure "nixpkgs#$pkg" --raw 2>/dev/null || true)"
  if [ -n "$path" ] && [ -d "$path/lib/gstreamer-1.0" ]; then
    GST_LIB_PATH="${GST_LIB_PATH:+$GST_LIB_PATH:}$path/lib/gstreamer-1.0"
  fi
done

export GST_PLUGIN_SYSTEM_PATH="$GST_LIB_PATH"
export GST_PLUGIN_PATH="$GST_LIB_PATH"
export GST_REGISTRY_REUSE_PLUGIN_SCANNER="no"
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export WEBKIT_DISABLE_DMABUF_RENDERER=1
export WEBKIT_USE_GL=software

exec nixGLIntel "$BINARY"
