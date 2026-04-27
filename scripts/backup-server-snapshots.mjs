#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrlRaw = process.env.API_BASE_URL || process.env.EXPO_PUBLIC_API_URL || '';
const adminEmail = process.env.ADMIN_EMAIL || '';
const adminPassword = process.env.ADMIN_PASSWORD || '';
const outputRootArg = process.argv[2];

if (!baseUrlRaw) {
  console.error('Missing API base URL. Set API_BASE_URL or EXPO_PUBLIC_API_URL.');
  process.exit(1);
}

if (!adminEmail || !adminPassword) {
  console.error('Missing admin credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD.');
  process.exit(1);
}

const baseUrl = baseUrlRaw.replace(/\/+$/, '');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputRoot = outputRootArg || path.join('.backups', 'server-json');
const outputDir = path.join(outputRoot, `snapshot_${timestamp}`);

const sanitizeFilePart = (value) =>
  String(value || '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120) || 'unknown';

const authHeader = `Basic ${Buffer.from(`${adminEmail}:${adminPassword}`).toString('base64')}`;

const fetchJson = async (url) => {
  const res = await fetch(url, {
    headers: {
      Authorization: authHeader,
    },
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (_error) {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}: ${JSON.stringify(json)}`);
  }

  return json;
};

const writeJson = async (filePath, data) => {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const main = async () => {
  await fs.mkdir(outputDir, { recursive: true });

  const usersIndex = await fetchJson(`${baseUrl}/admin/users`);
  const users = Array.isArray(usersIndex?.users) ? usersIndex.users : [];

  await writeJson(path.join(outputDir, 'users-index.json'), usersIndex);

  const results = [];
  for (const user of users) {
    const userId = String(user?.userId || '');
    if (!userId) continue;

    const payload = await fetchJson(
      `${baseUrl}/admin/user/${encodeURIComponent(userId)}?aiLimit=5000&includeAi=1`
    );

    const fileName = `user_${sanitizeFilePart(userId)}.json`;
    await writeJson(path.join(outputDir, fileName), payload);
    results.push({ userId, file: fileName });
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    apiBaseUrl: baseUrl,
    usersCount: users.length,
    files: results,
  };
  await writeJson(path.join(outputDir, 'manifest.json'), manifest);

  console.log(`Backup completed: ${outputDir}`);
  console.log(`Users exported: ${users.length}`);
};

main().catch((error) => {
  console.error('Backup failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
