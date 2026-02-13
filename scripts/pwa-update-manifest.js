const fs = require('fs');
const path = require('path');

const outDir = process.argv[2];
if (!outDir) {
  process.exit(0);
}

const candidates = [
  'manifest.json',
  'manifest.webmanifest',
  'expo-manifest.json',
];

const iconEntry = {
  src: './pwa-icon.svg',
  sizes: '40x40',
  type: 'image/svg+xml',
  purpose: 'any',
};

for (const file of candidates) {
  const full = path.join(outDir, file);
  if (!fs.existsSync(full)) continue;
  try {
    const raw = fs.readFileSync(full, 'utf8');
    const data = JSON.parse(raw);
    const existing = Array.isArray(data.icons) ? data.icons : [];
    const withoutDup = existing.filter((i) => i.src !== iconEntry.src);
    data.icons = [iconEntry, ...withoutDup];
    fs.writeFileSync(full, JSON.stringify(data, null, 2));
  } catch (err) {
    // ignore
  }
}
