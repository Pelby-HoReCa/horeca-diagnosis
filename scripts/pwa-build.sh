#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/pwa/dist"

rm -rf "${OUT_DIR}"

npx expo export --platform web --output-dir "${OUT_DIR}"

# Add custom PWA icon (iPad_Mini_Spotlight_40_2x)
ICON_SRC="${ROOT_DIR}/assets/images/iPad_Mini_Spotlight_40_2x.svg"
if [ -f "${ICON_SRC}" ]; then
  cp "${ICON_SRC}" "${OUT_DIR}/pwa-icon.svg"
  node "${ROOT_DIR}/scripts/pwa-update-manifest.js" "${OUT_DIR}"
fi

echo "PWA build exported to ${OUT_DIR}"
