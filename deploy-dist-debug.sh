#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 \"commit message\""
  exit 1
fi

MSG="$1"
THIS_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$THIS_DIR/dist"
TARGET_REPO="https://github.com/open-itvt/desktop-app-debug-dist.git"
TMP_DIR=$(mktemp -d)

trap 'rm -rf "$TMP_DIR"' EXIT

echo "=== Cloning target repo (shallow, depth=1) ==="
git clone --depth 1 "$TARGET_REPO" "$TMP_DIR/repo" 2>/dev/null || {
  echo "=== Repo not found — initializing fresh ==="
  mkdir -p "$TMP_DIR/repo"
  cd "$TMP_DIR/repo"
  git init
  git checkout -b main 2>/dev/null || true
}

cd "$TMP_DIR/repo"

git config user.name "Klubuntu"
source "$THIS_DIR/.env" 2>/dev/null || true
git config user.email "${GIT_USER_EMAIL:-49614906+Klubuntu@users.noreply.github.com}"

echo "=== Removing remote assets/ ==="
rm -rf assets/ 2>/dev/null || true

echo "=== Copying local dist/ contents ==="
cp -r "$DIST_DIR"/. .

echo "$(date -Iseconds) — $MSG" > .deploy-version

echo "=== Committing ==="
git add -A
git commit -m "$MSG" 2>/dev/null || git commit --allow-empty -m "$MSG"

echo "=== Force pushing ==="
source "$THIS_DIR/.env" 2>/dev/null || true
REPO_WITH_TOKEN="https://Klubuntu:${GITHUB_TOKEN:-}@github.com/open-itvt/desktop-app-debug-dist.git"
git push "$REPO_WITH_TOKEN" HEAD:main --force 2>/dev/null || {
  echo "=== Push failed — repo may not exist. Create it first:"
  echo "   https://github.com/new?owner=open-itvt&name=desktop-app-debug-dist"
  exit 1
}

echo "=== Done — desktop-app-debug.itvt.xyz ==="
