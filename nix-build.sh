#!/usr/bin/env bash
set -euo pipefail

echo "=== Building iTVT with Nix ==="
cd "$(dirname "$0")"

# Enter nix shell and build
nix-shell --pure --run "
  echo '=== Nix shell ready ==='
  pnpm install --frozen-lockfile
  pnpm tauri build
  echo '=== Build complete ==='
  ls -la src-tauri/target/release/bundle/
"
