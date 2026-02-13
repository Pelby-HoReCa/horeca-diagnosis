#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/pwa/dist"

rm -rf "${OUT_DIR}"

npx expo export --platform web --output-dir "${OUT_DIR}"
echo "PWA build exported to ${OUT_DIR}"
