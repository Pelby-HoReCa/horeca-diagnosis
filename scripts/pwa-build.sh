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
fi

# Add PNG icons for PWA / iOS homescreen
PNG_ICON="${ROOT_DIR}/assets/images/icon.png"
if [ -f "${PNG_ICON}" ]; then
  cp "${PNG_ICON}" "${OUT_DIR}/icon-192.png"
  cp "${PNG_ICON}" "${OUT_DIR}/icon-512.png"
  cp "${PNG_ICON}" "${OUT_DIR}/apple-touch-icon.png"
fi

# Ensure SPA fallback works on Vercel
if [ -f "${OUT_DIR}/index.html" ]; then
  cp "${OUT_DIR}/index.html" "${OUT_DIR}/404.html"
fi

node "${ROOT_DIR}/scripts/pwa-update-manifest.js" "${OUT_DIR}"

echo "PWA build exported to ${OUT_DIR}"
