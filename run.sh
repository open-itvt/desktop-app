#!/usr/bin/env bash
# Run iTVT with Nix-provided GStreamer and other deps
# Usage: bash run.sh [path-to-binary]
set -euo pipefail

BINARY="${1:-./usr/bin/desktop-app}"

# Find GStreamer plugins from Nix store
GST_LIB_PATH=""
for pkg in gst_all_1.gstreamer gst_all_1.gst-plugins-base gst_all_1.gst-plugins-good gst_all_1.gst-plugins-bad gst_all_1.gst-plugins-ugly gst_all_1.gst-libav; do
  path=$(nix eval --impure "nixpkgs#$pkg" --raw 2>/dev/null || true)
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

# Also link required libs via nixGL
exec nix run --impure github:nix-community/nixGL -- "$BINARY"
