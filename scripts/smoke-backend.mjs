#!/usr/bin/env node

const baseUrlRaw = process.env.API_BASE_URL || process.env.EXPO_PUBLIC_API_URL || '';
const adminEmail = process.env.ADMIN_EMAIL || '';
const adminPassword = process.env.ADMIN_PASSWORD || '';

if (!baseUrlRaw) {
  console.error('Missing API base URL. Set API_BASE_URL or EXPO_PUBLIC_API_URL.');
  process.exit(1);
}

const baseUrl = baseUrlRaw.replace(/\/+$/, '');
const userId = `smoke_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const authHeader =
  adminEmail && adminPassword
    ? `Basic ${Buffer.from(`${adminEmail}:${adminPassword}`).toString('base64')}`
    : '';

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_error) {
    json = { raw: text };
  }
  return { response, json };
};

const run = async () => {
  console.log(`[smoke] API: ${baseUrl}`);
  console.log(`[smoke] userId: ${userId}`);

  const health = await fetchJson(`${baseUrl}/health`);
  assert(health.response.ok, '/health failed');
  assert(health.json?.ok === true, '/health returned not ok');
  console.log('[smoke] /health OK');

  const healthDb = await fetchJson(`${baseUrl}/health/db`);
  assert(healthDb.response.ok, '/health/db failed');
  assert(healthDb.json?.ok === true, '/health/db returned not ok');
  console.log('[smoke] /health/db OK');

  const payload = {
    userId,
    data: {
      smoke: true,
      ts: new Date().toISOString(),
      nested: { foo: 'bar', n: 1 },
    },
  };

  const push = await fetchJson(`${baseUrl}/sync/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  assert(push.response.ok, '/sync/push failed');
  assert(push.json?.ok === true, '/sync/push returned not ok');
  console.log('[smoke] /sync/push OK');

  const pull = await fetchJson(`${baseUrl}/sync/pull/${encodeURIComponent(userId)}`);
  assert(pull.response.ok, '/sync/pull failed');
  assert(pull.json?.ok === true, '/sync/pull returned not ok');
  assert(pull.json?.data?.smoke === true, '/sync/pull payload mismatch');
  console.log('[smoke] /sync/pull OK');

  if (authHeader) {
    const adminUsers = await fetchJson(`${baseUrl}/admin/users`, {
      headers: { Authorization: authHeader },
    });
    assert(adminUsers.response.ok, '/admin/users failed');
    assert(
      Array.isArray(adminUsers.json?.users) &&
        adminUsers.json.users.some((item) => item?.userId === userId),
      '/admin/users does not contain smoke user'
    );
    console.log('[smoke] /admin/users OK');

    const adminUser = await fetchJson(
      `${baseUrl}/admin/user/${encodeURIComponent(userId)}?includeAi=0`,
      {
        headers: { Authorization: authHeader },
      }
    );
    assert(adminUser.response.ok, '/admin/user/:id failed');
    assert(adminUser.json?.ok === true, '/admin/user/:id returned not ok');
    console.log('[smoke] /admin/user/:id OK');
  } else {
    console.log('[smoke] admin checks skipped (ADMIN_EMAIL/ADMIN_PASSWORD are not set)');
  }

  console.log('[smoke] SUCCESS');
};

run().catch((error) => {
  console.error('[smoke] FAILED:', error instanceof Error ? error.message : error);
  process.exit(1);
});
