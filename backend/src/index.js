require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'it@pelby.ru';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Sergo1289';
const { randomUUID } = require('crypto');

const AI_PROVIDER = (process.env.AI_PROVIDER || 'yandex').toLowerCase();
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 30000);
const AI_MAX_HISTORY_MESSAGES = Number(process.env.AI_MAX_HISTORY_MESSAGES || 10);
const AI_MAX_INPUT_CHARS = Number(process.env.AI_MAX_INPUT_CHARS || 2000);
const AI_TEMPERATURE = Number(process.env.AI_TEMPERATURE || 0.25);
const AI_MAX_TOKENS = Number(process.env.AI_MAX_TOKENS || 500);

const fetchWithTimeout = async (url, options = {}, timeoutMs = AI_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const normalizeChatHistory = (history) => {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      text: typeof item.text === 'string' ? item.text.trim() : '',
    }))
    .filter((item) => item.text.length > 0)
    .slice(-AI_MAX_HISTORY_MESSAGES);
};

const buildSystemPrompt = (userContext) => {
  const profile = userContext && typeof userContext === 'object' ? userContext.profile : null;
  const restaurants =
    userContext &&
    typeof userContext === 'object' &&
    Array.isArray(userContext.restaurants)
      ? userContext.restaurants
      : [];

  const businessContext = [];
  if (profile && typeof profile === 'object') {
    if (typeof profile.fullName === 'string' && profile.fullName.trim()) {
      businessContext.push(`Имя пользователя: ${profile.fullName.trim()}`);
    }
    if (typeof profile.projectName === 'string' && profile.projectName.trim()) {
      businessContext.push(`Основной проект: ${profile.projectName.trim()}`);
    }
    if (typeof profile.city === 'string' && profile.city.trim()) {
      businessContext.push(`Город: ${profile.city.trim()}`);
    }
  }

  if (restaurants.length > 0) {
    const names = restaurants
      .map((item) => (item && typeof item.name === 'string' ? item.name.trim() : ''))
      .filter(Boolean)
      .slice(0, 5);
    if (names.length) {
      businessContext.push(`Заведения: ${names.join(', ')}`);
    }
  }

  const contextText = businessContext.length
    ? `\nКонтекст пользователя:\n- ${businessContext.join('\n- ')}`
    : '';

  return (
    'Ты AI-ассистент Pelby для ресторанного бизнеса (HoReCa). ' +
    'Отвечай на русском, кратко и по делу. ' +
    'Давай практичные рекомендации с конкретными шагами и метриками. ' +
    'Если данных недостаточно, сначала задай 1-3 уточняющих вопроса. ' +
    'Не выдумывай факты и не обещай недоступные данные.' +
    contextText
  );
};

const parseResponseJson = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (_error) {
    return { raw: text };
  }
};

const getProviderCandidates = () => {
  if (AI_PROVIDER === 'auto') return ['yandex', 'gigachat'];
  if (AI_PROVIDER === 'yandex') return ['yandex', 'gigachat'];
  if (AI_PROVIDER === 'gigachat') return ['gigachat', 'yandex'];
  return ['yandex', 'gigachat'];
};

const isProviderConfigured = (provider) => {
  if (provider === 'yandex') {
    return Boolean(process.env.YANDEX_API_KEY && process.env.YANDEX_FOLDER_ID);
  }
  if (provider === 'gigachat') {
    return Boolean(
      process.env.GIGACHAT_ACCESS_TOKEN ||
        (process.env.GIGACHAT_CLIENT_ID && process.env.GIGACHAT_CLIENT_SECRET)
    );
  }
  return false;
};

const callYandexProvider = async ({ messages, userContext }) => {
  const apiKey = process.env.YANDEX_API_KEY;
  const folderId = process.env.YANDEX_FOLDER_ID;
  if (!apiKey || !folderId) {
    throw new Error('yandex_not_configured');
  }

  const modelUri = process.env.YANDEX_MODEL_URI || `gpt://${folderId}/yandexgpt/latest`;
  const payload = {
    modelUri,
    completionOptions: {
      stream: false,
      temperature: Number.isFinite(AI_TEMPERATURE) ? AI_TEMPERATURE : 0.25,
      maxTokens: String(Number.isFinite(AI_MAX_TOKENS) ? AI_MAX_TOKENS : 500),
    },
    messages: [
      { role: 'system', text: buildSystemPrompt(userContext) },
      ...messages.map((message) => ({
        role: message.role,
        text: message.text,
      })),
    ],
  };

  const response = await fetchWithTimeout(
    'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
    {
      method: 'POST',
      headers: {
        Authorization: `Api-Key ${apiKey}`,
        'x-folder-id': folderId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorBody = await parseResponseJson(response);
    throw new Error(`yandex_error_${response.status}:${JSON.stringify(errorBody)}`);
  }

  const data = await response.json();
  const text =
    data?.result?.alternatives?.[0]?.message?.text ||
    data?.result?.alternatives?.[0]?.text ||
    '';

  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('yandex_empty_response');
  }

  return text.trim();
};

let gigachatTokenCache = {
  token: null,
  expiresAt: 0,
};

const getGigaChatAccessToken = async () => {
  if (process.env.GIGACHAT_ACCESS_TOKEN) {
    return process.env.GIGACHAT_ACCESS_TOKEN;
  }

  const now = Date.now();
  if (gigachatTokenCache.token && gigachatTokenCache.expiresAt - 30000 > now) {
    return gigachatTokenCache.token;
  }

  const clientId = process.env.GIGACHAT_CLIENT_ID;
  const clientSecret = process.env.GIGACHAT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('gigachat_not_configured');
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetchWithTimeout('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      RqUID: randomUUID(),
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: 'scope=GIGACHAT_API_PERS',
  });

  if (!response.ok) {
    const errorBody = await parseResponseJson(response);
    throw new Error(`gigachat_auth_${response.status}:${JSON.stringify(errorBody)}`);
  }

  const data = await response.json();
  const token = typeof data?.access_token === 'string' ? data.access_token : null;
  if (!token) {
    throw new Error('gigachat_auth_empty_token');
  }

  const expiresAt =
    typeof data?.expires_at === 'number' ? Number(data.expires_at) : Date.now() + 25 * 60 * 1000;

  gigachatTokenCache = { token, expiresAt };
  return token;
};

const callGigaChatProvider = async ({ messages, userContext }) => {
  const token = await getGigaChatAccessToken();
  const payload = {
    model: process.env.GIGACHAT_MODEL || 'GigaChat-2-Pro',
    temperature: Number.isFinite(AI_TEMPERATURE) ? AI_TEMPERATURE : 0.25,
    max_tokens: Number.isFinite(AI_MAX_TOKENS) ? AI_MAX_TOKENS : 500,
    messages: [
      { role: 'system', content: buildSystemPrompt(userContext) },
      ...messages.map((message) => ({
        role: message.role,
        content: message.text,
      })),
    ],
  };

  const response = await fetchWithTimeout('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await parseResponseJson(response);
    throw new Error(`gigachat_error_${response.status}:${JSON.stringify(errorBody)}`);
  }

  const data = await response.json();
  const text =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.message?.text ||
    '';

  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('gigachat_empty_response');
  }

  return text.trim();
};

const ensureSchema = async () => {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserData" (
        "userId" text PRIMARY KEY,
        "data" jsonb NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "UserData_updatedAt_idx" ON "UserData" ("updatedAt" DESC);`
    );
  } catch (error) {
    console.error('ensureSchema error', error);
  }
};

const requireAdmin = (req, res, next) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="admin"');
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  const base64 = auth.replace('Basic ', '');
  const decoded = Buffer.from(base64, 'base64').toString('utf8');
  const [email, password] = decoded.split(':');
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    res.set('WWW-Authenticate', 'Basic realm="admin"');
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  return next();
};

app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.post('/ai/chat', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const history = normalizeChatHistory(body.history);
    const userContext = body.userContext && typeof body.userContext === 'object' ? body.userContext : {};

    if (!message) {
      return res.status(400).json({ ok: false, error: 'message_is_required' });
    }

    if (message.length > AI_MAX_INPUT_CHARS) {
      return res.status(400).json({
        ok: false,
        error: 'message_too_long',
        limit: AI_MAX_INPUT_CHARS,
      });
    }

    const messages = [...history, { role: 'user', text: message }];
    const providerCandidates = getProviderCandidates().filter(isProviderConfigured);

    if (providerCandidates.length === 0) {
      return res.status(503).json({
        ok: false,
        error: 'ai_provider_not_configured',
      });
    }

    const providerErrors = [];
    for (const provider of providerCandidates) {
      try {
        const reply =
          provider === 'yandex'
            ? await callYandexProvider({ messages, userContext })
            : await callGigaChatProvider({ messages, userContext });

        return res.json({
          ok: true,
          provider,
          reply,
        });
      } catch (error) {
        providerErrors.push({
          provider,
          reason: error instanceof Error ? error.message : 'unknown_error',
        });
      }
    }

    return res.status(502).json({
      ok: false,
      error: 'ai_upstream_error',
      details: providerErrors,
    });
  } catch (error) {
    console.error('ai/chat error', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// Push local snapshot to server
app.post('/sync/push', async (req, res) => {
  try {
    const { userId, data } = req.body || {};
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ ok: false, error: 'userId is required' });
    }
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ ok: false, error: 'data is required' });
    }

    const record = await prisma.userData.upsert({
      where: { userId },
      update: { data },
      create: { userId, data },
    });

    return res.json({ ok: true, updatedAt: record.updatedAt });
  } catch (error) {
    console.error('sync/push error', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// Mark account as deleted while keeping server snapshot for admin analytics/history
app.post('/sync/delete-account', async (req, res) => {
  try {
    const { userId, meta } = req.body || {};
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ ok: false, error: 'userId is required' });
    }

    const nowIso = new Date().toISOString();
    const existing = await prisma.userData.findUnique({ where: { userId } });
    const existingData =
      existing?.data && typeof existing.data === 'object' && !Array.isArray(existing.data)
        ? existing.data
        : {};

    const previousMeta =
      existingData.__accountMeta &&
      typeof existingData.__accountMeta === 'object' &&
      !Array.isArray(existingData.__accountMeta)
        ? existingData.__accountMeta
        : {};

    const nextData = {
      ...existingData,
      __accountMeta: {
        ...previousMeta,
        deleted: true,
        deletedAt: nowIso,
        lastKnown: {
          ...(previousMeta.lastKnown || {}),
          ...(meta && typeof meta === 'object' ? meta : {}),
        },
      },
    };

    const record = await prisma.userData.upsert({
      where: { userId },
      update: { data: nextData },
      create: { userId, data: nextData },
    });

    return res.json({ ok: true, updatedAt: record.updatedAt, deletedAt: nowIso });
  } catch (error) {
    console.error('sync/delete-account error', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// Pull latest snapshot by userId
app.get('/sync/pull/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const record = await prisma.userData.findUnique({ where: { userId } });
    if (!record) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }
    return res.json({ ok: true, data: record.data, updatedAt: record.updatedAt });
  } catch (error) {
    console.error('sync/pull error', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// Admin endpoints
app.get('/admin/users', requireAdmin, async (_req, res) => {
  try {
    const users = await prisma.userData.findMany({
      select: { userId: true, createdAt: true, updatedAt: true, data: true },
      orderBy: { updatedAt: 'desc' },
    });
    const normalized = users.map((item) => {
      const snapshot =
        item?.data && typeof item.data === 'object' && !Array.isArray(item.data) ? item.data : {};
      const accountMeta =
        snapshot.__accountMeta &&
        typeof snapshot.__accountMeta === 'object' &&
        !Array.isArray(snapshot.__accountMeta)
          ? snapshot.__accountMeta
          : {};

      return {
        userId: item.userId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        isDeleted: Boolean(accountMeta.deleted),
        deletedAt: accountMeta.deletedAt || null,
      };
    });
    return res.json({ ok: true, users: normalized });
  } catch (error) {
    console.error('admin/users error', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

app.get('/admin/user/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const record = await prisma.userData.findUnique({ where: { userId } });
    if (!record) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }
    return res.json({ ok: true, userId: record.userId, data: record.data, updatedAt: record.updatedAt });
  } catch (error) {
    console.error('admin/user error', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

const port = process.env.PORT || 4000;
ensureSchema().finally(() => {
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
});
