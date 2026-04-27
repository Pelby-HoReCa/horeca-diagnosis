require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { randomUUID, timingSafeEqual } = require('crypto');

const app = express();
const prisma = new PrismaClient();

const DATABASE_URL = String(process.env.DATABASE_URL || '').trim();
if (!DATABASE_URL) {
  console.error('Fatal: DATABASE_URL is required.');
  process.exit(1);
}

const CORS_ORIGIN = String(process.env.CORS_ORIGIN || '*').trim();
const allowedCorsOrigins =
  !CORS_ORIGIN || CORS_ORIGIN === '*'
    ? null
    : new Set(
        CORS_ORIGIN.split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      );

const corsOptions = {
  origin: (origin, callback) => {
    if (!allowedCorsOrigins) {
      callback(null, true);
      return;
    }
    if (!origin || allowedCorsOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('cors_not_allowed'));
  },
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '20mb' }));

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || '');
const ADMIN_AUTH_ENABLED = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);
if (!ADMIN_AUTH_ENABLED) {
  console.warn('ADMIN_EMAIL or ADMIN_PASSWORD is missing. Admin API endpoints are disabled.');
}
if (ADMIN_EMAIL === 'it@pelby.ru' || ADMIN_PASSWORD === 'Sergo1289') {
  console.warn('Insecure admin credentials detected. Rotate ADMIN_EMAIL/ADMIN_PASSWORD immediately.');
}
const ADMIN_LOGIN_WINDOW_MS = Number(process.env.ADMIN_LOGIN_WINDOW_MS || 15 * 60 * 1000);
const ADMIN_LOGIN_MAX_ATTEMPTS = Number(process.env.ADMIN_LOGIN_MAX_ATTEMPTS || 30);
const adminAuthFailuresByIp = new Map();

const AI_PROVIDER = (process.env.AI_PROVIDER || 'yandex').toLowerCase();
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 30000);
const AI_MAX_HISTORY_MESSAGES = Number(process.env.AI_MAX_HISTORY_MESSAGES || 10);
const AI_MAX_INPUT_CHARS = Number(process.env.AI_MAX_INPUT_CHARS || 2000);
const AI_TEMPERATURE = Number(process.env.AI_TEMPERATURE || 0.25);
const AI_MAX_TOKENS = Number(process.env.AI_MAX_TOKENS || 500);
const AI_LOG_MAX_TEXT_CHARS = Number(process.env.AI_LOG_MAX_TEXT_CHARS || 8000);
const ADMIN_AI_CHAT_DEFAULT_LIMIT = Number(process.env.ADMIN_AI_CHAT_DEFAULT_LIMIT || 200);
const ADMIN_AI_CHAT_MAX_LIMIT = Number(process.env.ADMIN_AI_CHAT_MAX_LIMIT || 5000);
const ADMIN_PHONE_DEFAULT_LIMIT = Number(process.env.ADMIN_PHONE_DEFAULT_LIMIT || 200);
const ADMIN_PHONE_MAX_LIMIT = Number(process.env.ADMIN_PHONE_MAX_LIMIT || 5000);

const PHONE_VERIFICATION_TTL_MS = Number(process.env.PHONE_VERIFICATION_TTL_MS || 5 * 60 * 1000);
const PHONE_VERIFICATION_MAX_ATTEMPTS = Number(process.env.PHONE_VERIFICATION_MAX_ATTEMPTS || 5);
const PHONE_VERIFICATION_MAX_STARTS_PER_HOUR = Number(
  process.env.PHONE_VERIFICATION_MAX_STARTS_PER_HOUR || 10
);
const PHONE_VERIFICATION_MIN_RESTART_INTERVAL_MS = Number(
  process.env.PHONE_VERIFICATION_MIN_RESTART_INTERVAL_MS || 30 * 1000
);
const PHONE_REVIEW_BYPASS_ENABLED = String(process.env.PHONE_REVIEW_BYPASS_ENABLED || '')
  .trim()
  .toLowerCase() === 'true';
const PHONE_REVIEW_BYPASS_CODE = String(process.env.PHONE_REVIEW_BYPASS_CODE || '').trim();
const PHONE_REVIEW_BYPASS_PHONES_RAW = String(process.env.PHONE_REVIEW_BYPASS_PHONES || '').trim();

const SMSRU_API_ID = process.env.SMSRU_API_ID || '';
const SMSRU_SMS_ENDPOINT = process.env.SMSRU_SMS_ENDPOINT || 'https://sms.ru/sms/send';
const SMSRU_CALLCHECK_ADD_ENDPOINT =
  process.env.SMSRU_CALLCHECK_ADD_ENDPOINT || 'https://sms.ru/callcheck/add';
const SMSRU_CALLCHECK_STATUS_ENDPOINT =
  process.env.SMSRU_CALLCHECK_STATUS_ENDPOINT || 'https://sms.ru/callcheck/status';
const SMSRU_CODE_TEMPLATE = process.env.SMSRU_CODE_TEMPLATE || 'Код Pelby: {code}';
const SMSRU_FROM = (process.env.SMSRU_FROM || '').trim();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const TRANSIENT_PRISMA_ERROR_CODES = new Set(['P1001', 'P1002', 'P1017', 'P2024']);

const isTransientPrismaError = (error) => {
  if (!error || typeof error !== 'object') return false;
  const code = typeof error.code === 'string' ? error.code : '';
  if (TRANSIENT_PRISMA_ERROR_CODES.has(code)) return true;

  const text = [error.message, error.name, error.stack, String(error)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    text.includes('server has closed the connection') ||
    text.includes('terminating connection') ||
    text.includes('connection reset') ||
    text.includes('connection timeout') ||
    text.includes('timed out') ||
    text.includes('can\'t reach database server')
  );
};

const withPrismaRetry = async (operationName, operation, attempts = 2) => {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const transient = isTransientPrismaError(error);
      const canRetry = transient && attempt < attempts;
      if (!canRetry) {
        throw error;
      }

      console.warn(
        `${operationName} transient db error (attempt ${attempt}/${attempts}), reconnecting...`
      );
      try {
        await prisma.$disconnect();
      } catch (_disconnectError) {}
      try {
        await prisma.$connect();
      } catch (_connectError) {}
      await sleep(250 * attempt);
    }
  }

  throw lastError;
};

const safeCompare = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8');
  const rightBuffer = Buffer.from(String(right || ''), 'utf8');
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
};

const getRequestIp = (req) => {
  const forwardedRaw = req.headers['x-forwarded-for'];
  const forwarded = Array.isArray(forwardedRaw) ? forwardedRaw[0] : forwardedRaw;
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const pruneAdminAuthFailures = () => {
  const now = Date.now();
  for (const [ip, state] of adminAuthFailuresByIp.entries()) {
    const expired = now - state.firstFailureAt > ADMIN_LOGIN_WINDOW_MS;
    if (expired) {
      adminAuthFailuresByIp.delete(ip);
    }
  }
};

const isAdminIpRateLimited = (ip) => {
  pruneAdminAuthFailures();
  const state = adminAuthFailuresByIp.get(ip);
  if (!state) return false;
  return state.count >= ADMIN_LOGIN_MAX_ATTEMPTS;
};

const markAdminAuthFailure = (ip) => {
  if (!ip) return;
  pruneAdminAuthFailures();
  const now = Date.now();
  const current = adminAuthFailuresByIp.get(ip);
  if (!current) {
    adminAuthFailuresByIp.set(ip, { count: 1, firstFailureAt: now });
    return;
  }
  const sameWindow = now - current.firstFailureAt <= ADMIN_LOGIN_WINDOW_MS;
  if (!sameWindow) {
    adminAuthFailuresByIp.set(ip, { count: 1, firstFailureAt: now });
    return;
  }
  adminAuthFailuresByIp.set(ip, {
    count: current.count + 1,
    firstFailureAt: current.firstFailureAt,
  });
};

const clearAdminAuthFailures = (ip) => {
  if (!ip) return;
  adminAuthFailuresByIp.delete(ip);
};

const createPhoneVerificationId = () => randomUUID();

const normalizeRuPhone = (rawValue) => {
  const digits = String(rawValue || '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `7${digits}`;
  }
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return `7${digits.slice(1)}`;
  }
  return null;
};

const PHONE_REVIEW_BYPASS_PHONES = new Set(
  PHONE_REVIEW_BYPASS_PHONES_RAW
    .split(',')
    .map((value) => normalizeRuPhone(value))
    .filter(Boolean)
);

const isPhoneReviewBypassEnabledForPhone = (normalizedPhone) =>
  Boolean(
    PHONE_REVIEW_BYPASS_ENABLED &&
      PHONE_REVIEW_BYPASS_CODE &&
      normalizedPhone &&
      PHONE_REVIEW_BYPASS_PHONES.has(normalizedPhone)
  );

if (PHONE_REVIEW_BYPASS_ENABLED) {
  if (!PHONE_REVIEW_BYPASS_CODE || PHONE_REVIEW_BYPASS_PHONES.size === 0) {
    console.warn(
      'PHONE_REVIEW_BYPASS_ENABLED is set but PHONE_REVIEW_BYPASS_CODE/PHONE_REVIEW_BYPASS_PHONES are incomplete.'
    );
  } else {
    console.warn(
      `PHONE_REVIEW_BYPASS_ENABLED is active for ${PHONE_REVIEW_BYPASS_PHONES.size} phone(s). Disable after App Review.`
    );
  }
}

const maskPhone = (normalizedPhone) => {
  if (!normalizedPhone || normalizedPhone.length !== 11) return normalizedPhone || '';
  return `+7 (${normalizedPhone.slice(1, 4)}) ${normalizedPhone.slice(4, 7)}-${normalizedPhone.slice(
    7,
    9
  )}-${normalizedPhone.slice(9, 11)}`;
};

const prunePhoneVerificationState = async () => {
  await prisma.$executeRawUnsafe(`
    DELETE FROM "PhoneVerificationSession"
    WHERE ("expiresAt" < NOW() - INTERVAL '1 hour')
       OR ("consumedAt" IS NOT NULL AND "consumedAt" < NOW() - INTERVAL '24 hour');
  `);
};

const getPhoneVerificationRate = async (phone) => {
  const [countRow] = await prisma.$queryRawUnsafe(
    `
      SELECT COUNT(*)::int AS count
      FROM "PhoneVerificationSession"
      WHERE "phone" = $1
        AND "createdAt" > NOW() - INTERVAL '1 hour';
    `,
    phone
  );

  const [lastRow] = await prisma.$queryRawUnsafe(
    `
      SELECT MAX("createdAt") AS "lastStartedAt"
      FROM "PhoneVerificationSession"
      WHERE "phone" = $1;
    `,
    phone
  );

  return {
    count: Number(countRow?.count || 0),
    lastStartedAt: lastRow?.lastStartedAt ? new Date(lastRow.lastStartedAt) : null,
  };
};

const createPhoneVerificationSession = async (session) => {
  const [row] = await prisma.$queryRawUnsafe(
    `
      INSERT INTO "PhoneVerificationSession" (
        "id", "phone", "method", "code", "callcheckId", "callPhone",
        "attemptsLeft", "expiresAt", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *;
    `,
    session.id,
    session.phone,
    session.method,
    session.code || null,
    session.callcheckId || null,
    session.callPhone || null,
    session.attemptsLeft,
    session.expiresAt
  );
  return row || null;
};

const getPhoneVerificationSession = async (verificationId) => {
  const [row] = await prisma.$queryRawUnsafe(
    `
      SELECT *
      FROM "PhoneVerificationSession"
      WHERE "id" = $1
      LIMIT 1;
    `,
    verificationId
  );
  return row || null;
};

const consumePhoneVerificationSession = async (verificationId, verified) => {
  const [row] = await prisma.$queryRawUnsafe(
    `
      UPDATE "PhoneVerificationSession"
      SET "consumedAt" = NOW(),
          "verifiedAt" = CASE WHEN $2::boolean THEN NOW() ELSE "verifiedAt" END,
          "updatedAt" = NOW()
      WHERE "id" = $1
      RETURNING *;
    `,
    verificationId,
    Boolean(verified)
  );
  return row || null;
};

const decrementPhoneVerificationAttempts = async (verificationId) => {
  const [row] = await prisma.$queryRawUnsafe(
    `
      UPDATE "PhoneVerificationSession"
      SET "attemptsLeft" = GREATEST("attemptsLeft" - 1, 0),
          "updatedAt" = NOW()
      WHERE "id" = $1
      RETURNING *;
    `,
    verificationId
  );
  return row || null;
};

const buildSmsRuUrl = (baseUrl, params) => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

const trimText = (value, maxChars = AI_LOG_MAX_TEXT_CHARS) => {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (!text) return '';
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
};

const normalizeNullableString = (value, maxChars = 256) => {
  const text = trimText(value, maxChars);
  return text || null;
};

const toJsonString = (value, fallback) => {
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return JSON.stringify(fallback);
  }
};

const parseAdminLimit = (rawValue, fallback, maxLimit) => {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.trunc(parsed), maxLimit);
};

const extractAiLogContext = (userContext) => {
  const safeContext =
    userContext && typeof userContext === 'object' && !Array.isArray(userContext)
      ? userContext
      : {};

  return {
    userId: normalizeNullableString(safeContext.userId, 128),
    selectedVenueId: normalizeNullableString(safeContext.selectedVenueId, 128),
    safeContext,
  };
};

const persistAiChatMessage = async ({
  userId,
  selectedVenueId,
  message,
  history,
  userContext,
  provider,
  reply,
  status,
  error,
  providerErrors,
}) => {
  const normalizedHistory = Array.isArray(history)
    ? history
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          role: item.role === 'assistant' ? 'assistant' : 'user',
          text: trimText(item.text, AI_LOG_MAX_TEXT_CHARS),
        }))
        .filter((item) => item.text.length > 0)
        .slice(-AI_MAX_HISTORY_MESSAGES)
    : [];

  try {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "AiChatMessage" (
          "id",
          "userId",
          "selectedVenueId",
          "requestMessage",
          "requestHistory",
          "userContext",
          "provider",
          "reply",
          "status",
          "error",
          "providerErrors",
          "createdAt"
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5::jsonb,
          $6::jsonb,
          $7,
          $8,
          $9,
          $10,
          $11::jsonb,
          NOW()
        );
      `,
      randomUUID(),
      normalizeNullableString(userId, 128),
      normalizeNullableString(selectedVenueId, 128),
      trimText(message, AI_LOG_MAX_TEXT_CHARS),
      toJsonString(normalizedHistory, []),
      toJsonString(userContext, {}),
      normalizeNullableString(provider, 64),
      normalizeNullableString(reply, 20000),
      status === 'success' ? 'success' : 'error',
      normalizeNullableString(error, 2000),
      toJsonString(Array.isArray(providerErrors) ? providerErrors.slice(0, 10) : [], [])
    );
  } catch (logError) {
    console.error('persistAiChatMessage error', logError);
  }
};

const sendSmsRuCode = async ({ phone, code }) => {
  const message = SMSRU_CODE_TEMPLATE.replace('{code}', code);
  const url = buildSmsRuUrl(SMSRU_SMS_ENDPOINT, {
    api_id: SMSRU_API_ID,
    to: phone,
    msg: message,
    from: SMSRU_FROM || undefined,
    json: 1,
  });

  const response = await fetchWithTimeout(url, { method: 'GET' }, 15000);
  const body = await parseResponseJson(response);

  if (!response.ok) {
    throw new Error(`smsru_sms_http_${response.status}:${JSON.stringify(body)}`);
  }

  const smsStatus = body?.sms?.[phone];
  const isOk = body?.status === 'OK' && smsStatus?.status === 'OK';
  if (!isOk) {
    const smsStatusCode = Number(smsStatus?.status_code || 0);
    const error = new Error(`smsru_sms_failed:${JSON.stringify(body)}`);
    if (smsStatusCode === 221) {
      error.code = 'sms_sender_not_approved';
    } else if (smsStatusCode === 201) {
      error.code = 'sms_balance_insufficient';
    } else {
      error.code = 'sms_provider_error';
    }
    throw error;
  }
};

const startSmsRuCallcheck = async ({ phone }) => {
  const url = buildSmsRuUrl(SMSRU_CALLCHECK_ADD_ENDPOINT, {
    api_id: SMSRU_API_ID,
    phone,
    json: 1,
  });
  const response = await fetchWithTimeout(url, { method: 'GET' }, 15000);
  const body = await parseResponseJson(response);

  if (!response.ok) {
    throw new Error(`smsru_callcheck_http_${response.status}:${JSON.stringify(body)}`);
  }

  if (body?.status !== 'OK' || !body?.check_id) {
    throw new Error(`smsru_callcheck_start_failed:${JSON.stringify(body)}`);
  }

  return {
    checkId: String(body.check_id),
    callPhone: typeof body.call_phone === 'string' ? body.call_phone : '',
  };
};

const getSmsRuCallcheckStatus = async ({ checkId }) => {
  const url = buildSmsRuUrl(SMSRU_CALLCHECK_STATUS_ENDPOINT, {
    api_id: SMSRU_API_ID,
    check_id: checkId,
    json: 1,
  });
  const response = await fetchWithTimeout(url, { method: 'GET' }, 15000);
  const body = await parseResponseJson(response);

  if (!response.ok) {
    throw new Error(`smsru_callcheck_status_http_${response.status}:${JSON.stringify(body)}`);
  }

  if (body?.status !== 'OK') {
    throw new Error(`smsru_callcheck_status_failed:${JSON.stringify(body)}`);
  }

  return Number(body.check_status || 0);
};

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
    await withPrismaRetry(
      'ensureSchema',
      async () => {
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
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "PhoneVerificationSession" (
            "id" text PRIMARY KEY,
            "phone" text NOT NULL,
            "method" text NOT NULL,
            "code" text,
            "callcheckId" text,
            "callPhone" text,
            "attemptsLeft" integer NOT NULL DEFAULT 5,
            "expiresAt" timestamptz NOT NULL,
            "verifiedAt" timestamptz,
            "consumedAt" timestamptz,
            "createdAt" timestamptz NOT NULL DEFAULT now(),
            "updatedAt" timestamptz NOT NULL DEFAULT now()
          );
        `);
        await prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS "PhoneVerificationSession_phone_createdAt_idx"
           ON "PhoneVerificationSession" ("phone", "createdAt" DESC);`
        );
        await prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS "PhoneVerificationSession_expiresAt_idx"
           ON "PhoneVerificationSession" ("expiresAt" DESC);`
        );
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "AiChatMessage" (
            "id" text PRIMARY KEY,
            "userId" text,
            "selectedVenueId" text,
            "requestMessage" text NOT NULL,
            "requestHistory" jsonb NOT NULL DEFAULT '[]'::jsonb,
            "userContext" jsonb NOT NULL DEFAULT '{}'::jsonb,
            "provider" text,
            "reply" text,
            "status" text NOT NULL,
            "error" text,
            "providerErrors" jsonb NOT NULL DEFAULT '[]'::jsonb,
            "createdAt" timestamptz NOT NULL DEFAULT now()
          );
        `);
        await prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS "AiChatMessage_createdAt_idx"
           ON "AiChatMessage" ("createdAt" DESC);`
        );
        await prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS "AiChatMessage_userId_createdAt_idx"
           ON "AiChatMessage" ("userId", "createdAt" DESC);`
        );
      },
      3
    );
  } catch (error) {
    console.error('ensureSchema error', error);
  }
};

const requireAdmin = (req, res, next) => {
  if (!ADMIN_AUTH_ENABLED) {
    return res.status(503).json({ ok: false, error: 'admin_not_configured' });
  }

  const ip = getRequestIp(req);
  if (isAdminIpRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'too_many_admin_auth_attempts' });
  }

  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Basic ')) {
    markAdminAuthFailure(ip);
    res.set('WWW-Authenticate', 'Basic realm="admin"');
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  const base64 = auth.replace('Basic ', '');
  let decoded = '';
  try {
    decoded = Buffer.from(base64, 'base64').toString('utf8');
  } catch (_error) {
    markAdminAuthFailure(ip);
    res.set('WWW-Authenticate', 'Basic realm="admin"');
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex < 0) {
    markAdminAuthFailure(ip);
    res.set('WWW-Authenticate', 'Basic realm="admin"');
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  const email = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);
  const isValid = safeCompare(email, ADMIN_EMAIL) && safeCompare(password, ADMIN_PASSWORD);
  if (!isValid) {
    markAdminAuthFailure(ip);
    res.set('WWW-Authenticate', 'Basic realm="admin"');
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  clearAdminAuthFailures(ip);
  return next();
};

app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/health/db', async (_req, res) => {
  try {
    await withPrismaRetry('health/db', async () => prisma.$queryRawUnsafe('SELECT 1 AS ok;'), 2);
    return res.json({ ok: true, db: 'up', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('health/db error', error);
    return res.status(503).json({ ok: false, db: 'down', error: 'database_unavailable' });
  }
});

app.post('/auth/phone/start', async (req, res) => {
  try {
    await prunePhoneVerificationState();

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const method = body?.method === 'call' ? 'call' : 'sms';
    const normalizedPhone = normalizeRuPhone(body?.phone);

    if (!normalizedPhone) {
      return res.status(400).json({ ok: false, error: 'invalid_phone' });
    }

    const isReviewBypass = isPhoneReviewBypassEnabledForPhone(normalizedPhone);

    if (!isReviewBypass && !SMSRU_API_ID) {
      return res.status(503).json({ ok: false, error: 'phone_provider_not_configured' });
    }

    if (!isReviewBypass && method === 'sms' && !SMSRU_FROM) {
      return res.status(503).json({ ok: false, error: 'sms_sender_not_configured' });
    }

    const rate = await getPhoneVerificationRate(normalizedPhone);
    if (rate.count >= PHONE_VERIFICATION_MAX_STARTS_PER_HOUR) {
      const retryInSec = rate.lastStartedAt
        ? Math.max(1, Math.ceil((rate.lastStartedAt.getTime() + 60 * 60 * 1000 - Date.now()) / 1000))
        : 3600;
      return res.status(429).json({
        ok: false,
        error: 'verification_rate_limit_exceeded',
        retryInSec,
      });
    }

    if (
      rate.lastStartedAt &&
      Date.now() - rate.lastStartedAt.getTime() < PHONE_VERIFICATION_MIN_RESTART_INTERVAL_MS
    ) {
      return res.status(429).json({
        ok: false,
        error: 'verification_too_many_requests',
        retryInSec: Math.ceil(
          (PHONE_VERIFICATION_MIN_RESTART_INTERVAL_MS - (Date.now() - rate.lastStartedAt.getTime())) /
            1000
        ),
      });
    }

    const verificationId = createPhoneVerificationId();
    const expiresAt = new Date(Date.now() + PHONE_VERIFICATION_TTL_MS);
    const session = {
      id: verificationId,
      phone: normalizedPhone,
      method,
      attemptsLeft: PHONE_VERIFICATION_MAX_ATTEMPTS,
      expiresAt,
      createdAt: Date.now(),
      verified: false,
      code: '',
      callcheckId: '',
      callPhone: '',
    };

    if (isReviewBypass) {
      session.code = PHONE_REVIEW_BYPASS_CODE;
    } else if (method === 'sms') {
      const code = String(Math.floor(1000 + Math.random() * 9000));
      await sendSmsRuCode({ phone: normalizedPhone, code });
      session.code = code;
    } else {
      const callcheck = await startSmsRuCallcheck({ phone: normalizedPhone });
      session.callcheckId = callcheck.checkId;
      session.callPhone = callcheck.callPhone;
    }

    await createPhoneVerificationSession(session);

    return res.json({
      ok: true,
      verificationId,
      method,
      maskedPhone: maskPhone(normalizedPhone),
      expiresInSec: Math.max(1, Math.floor((expiresAt - Date.now()) / 1000)),
      callPhone: session.callPhone || undefined,
    });
  } catch (error) {
    console.error('auth/phone/start error', error);
    if (error?.code === 'sms_sender_not_approved') {
      return res.status(400).json({ ok: false, error: 'sms_sender_not_approved' });
    }
    if (error?.code === 'sms_balance_insufficient') {
      return res.status(502).json({ ok: false, error: 'sms_provider_error' });
    }
    if (error?.code === 'sms_provider_error') {
      return res.status(502).json({ ok: false, error: 'sms_provider_error' });
    }
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

app.post('/auth/phone/check', async (req, res) => {
  try {
    await prunePhoneVerificationState();

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const verificationId =
      typeof body?.verificationId === 'string' ? body.verificationId.trim() : '';
    const code = typeof body?.code === 'string' ? body.code.trim() : '';

    if (!verificationId) {
      return res.status(400).json({ ok: false, error: 'verification_id_required' });
    }

    const session = await getPhoneVerificationSession(verificationId);
    if (!session) {
      return res.status(404).json({ ok: false, error: 'verification_not_found' });
    }

    if (session.consumedAt) {
      return res.status(409).json({ ok: false, error: 'verification_already_consumed' });
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      await consumePhoneVerificationSession(verificationId, false);
      return res.status(410).json({ ok: false, error: 'verification_expired' });
    }

    if (session.method === 'sms') {
      if (!code) {
        return res.status(400).json({ ok: false, error: 'code_required' });
      }
      if (Number(session.attemptsLeft || 0) <= 0) {
        await consumePhoneVerificationSession(verificationId, false);
        return res.status(429).json({ ok: false, error: 'verification_attempts_exceeded' });
      }

      if (code !== session.code) {
        const updatedSession = await decrementPhoneVerificationAttempts(verificationId);
        const attemptsLeft = Number(updatedSession?.attemptsLeft || 0);
        if (attemptsLeft <= 0) {
          await consumePhoneVerificationSession(verificationId, false);
        }
        return res.status(400).json({
          ok: false,
          error: 'invalid_code',
          attemptsLeft,
        });
      }

      await consumePhoneVerificationSession(verificationId, true);
      return res.json({
        ok: true,
        verified: true,
        phone: session.phone,
      });
    }

    if (!session.callcheckId) {
      return res.status(500).json({ ok: false, error: 'callcheck_not_initialized' });
    }

    const checkStatus = await getSmsRuCallcheckStatus({ checkId: session.callcheckId });
    const isVerified = checkStatus === 401;
    if (!isVerified) {
      return res.status(202).json({
        ok: true,
        verified: false,
        checkStatus,
      });
    }

    await consumePhoneVerificationSession(verificationId, true);
    return res.json({
      ok: true,
      verified: true,
      phone: session.phone,
    });
  } catch (error) {
    console.error('auth/phone/check error', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

app.post('/ai/chat', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const history = normalizeChatHistory(body.history);
    const userContext = body.userContext && typeof body.userContext === 'object' ? body.userContext : {};
    const aiLogContext = extractAiLogContext(userContext);

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
      await persistAiChatMessage({
        userId: aiLogContext.userId,
        selectedVenueId: aiLogContext.selectedVenueId,
        message,
        history,
        userContext: aiLogContext.safeContext,
        provider: null,
        reply: null,
        status: 'error',
        error: 'ai_provider_not_configured',
        providerErrors: [],
      });
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

        await persistAiChatMessage({
          userId: aiLogContext.userId,
          selectedVenueId: aiLogContext.selectedVenueId,
          message,
          history,
          userContext: aiLogContext.safeContext,
          provider,
          reply,
          status: 'success',
          error: null,
          providerErrors: [],
        });

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

    await persistAiChatMessage({
      userId: aiLogContext.userId,
      selectedVenueId: aiLogContext.selectedVenueId,
      message,
      history,
      userContext: aiLogContext.safeContext,
      provider: null,
      reply: null,
      status: 'error',
      error: 'ai_upstream_error',
      providerErrors,
    });

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

    const record = await withPrismaRetry('sync/push', async () =>
      prisma.userData.upsert({
        where: { userId },
        update: { data },
        create: { userId, data },
      })
    );

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
    const existing = await withPrismaRetry('sync/delete-account:findUnique', async () =>
      prisma.userData.findUnique({ where: { userId } })
    );
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

    const record = await withPrismaRetry('sync/delete-account:upsert', async () =>
      prisma.userData.upsert({
        where: { userId },
        update: { data: nextData },
        create: { userId, data: nextData },
      })
    );

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
    const record = await withPrismaRetry('sync/pull', async () =>
      prisma.userData.findUnique({ where: { userId } })
    );
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
    const { aiStatsRows, users } = await withPrismaRetry('admin/users', async () => {
      const aiStatsRows = await prisma.$queryRawUnsafe(`
        SELECT
          "userId",
          COUNT(*)::int AS "aiMessagesCount",
          MAX("createdAt") AS "lastAiMessageAt"
        FROM "AiChatMessage"
        WHERE "userId" IS NOT NULL
        GROUP BY "userId";
      `);
      const users = await prisma.userData.findMany({
        select: { userId: true, createdAt: true, updatedAt: true, data: true },
        orderBy: { updatedAt: 'desc' },
      });

      return { aiStatsRows, users };
    });

    const aiStatsByUserId = new Map(
      (Array.isArray(aiStatsRows) ? aiStatsRows : []).map((row) => [
        String(row.userId),
        {
          aiMessagesCount: Number(row.aiMessagesCount || 0),
          lastAiMessageAt: row.lastAiMessageAt || null,
        },
      ])
    );

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
        aiMessagesCount: aiStatsByUserId.get(item.userId)?.aiMessagesCount || 0,
        lastAiMessageAt: aiStatsByUserId.get(item.userId)?.lastAiMessageAt || null,
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
    const aiLimit = parseAdminLimit(
      req.query?.aiLimit,
      ADMIN_AI_CHAT_DEFAULT_LIMIT,
      ADMIN_AI_CHAT_MAX_LIMIT
    );
    const includeAi = String(req.query?.includeAi ?? '1') !== '0';

    const record = await withPrismaRetry('admin/user:record', async () =>
      prisma.userData.findUnique({ where: { userId } })
    );
    if (!record) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }

    const [aiCountRow] = await withPrismaRetry('admin/user:ai-count', async () =>
      prisma.$queryRawUnsafe(
        `
          SELECT COUNT(*)::int AS "count"
          FROM "AiChatMessage"
          WHERE "userId" = $1;
        `,
        userId
      )
    );
    const aiTotalCount = Number(aiCountRow?.count || 0);

    const aiChats = includeAi
      ? await withPrismaRetry('admin/user:ai-list', async () =>
          prisma.$queryRawUnsafe(
            `
              SELECT
                "id",
                "userId",
                "selectedVenueId",
                "provider",
                "requestMessage",
                "requestHistory",
                "userContext",
                "reply",
                "status",
                "error",
                "providerErrors",
                "createdAt"
              FROM "AiChatMessage"
              WHERE "userId" = $1
              ORDER BY "createdAt" DESC
              LIMIT $2::int;
            `,
            userId,
            aiLimit
          )
        )
      : [];

    return res.json({
      ok: true,
      userId: record.userId,
      data: record.data,
      updatedAt: record.updatedAt,
      aiTotalCount,
      aiLimit,
      aiChats,
    });
  } catch (error) {
    console.error('admin/user error', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

app.get('/admin/ai/chats', requireAdmin, async (req, res) => {
  try {
    const requestedUserId =
      typeof req.query?.userId === 'string' ? req.query.userId.trim() : '';
    const userId = requestedUserId || null;
    const limit = parseAdminLimit(
      req.query?.limit,
      ADMIN_AI_CHAT_DEFAULT_LIMIT,
      ADMIN_AI_CHAT_MAX_LIMIT
    );

    const rows = await withPrismaRetry('admin/ai/chats', async () =>
      userId
        ? prisma.$queryRawUnsafe(
            `
              SELECT
                "id",
                "userId",
                "selectedVenueId",
                "provider",
                "requestMessage",
                "requestHistory",
                "userContext",
                "reply",
                "status",
                "error",
                "providerErrors",
                "createdAt"
              FROM "AiChatMessage"
              WHERE "userId" = $1
              ORDER BY "createdAt" DESC
              LIMIT $2::int;
            `,
            userId,
            limit
          )
        : prisma.$queryRawUnsafe(
            `
              SELECT
                "id",
                "userId",
                "selectedVenueId",
                "provider",
                "requestMessage",
                "requestHistory",
                "userContext",
                "reply",
                "status",
                "error",
                "providerErrors",
                "createdAt"
              FROM "AiChatMessage"
              ORDER BY "createdAt" DESC
              LIMIT $1::int;
            `,
            limit
          )
    );

    return res.json({
      ok: true,
      userId,
      limit,
      chats: Array.isArray(rows) ? rows : [],
    });
  } catch (error) {
    console.error('admin/ai/chats error', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

app.get('/admin/phone-verifications', requireAdmin, async (req, res) => {
  try {
    const requestedPhone = typeof req.query?.phone === 'string' ? req.query.phone : '';
    const normalizedPhone = requestedPhone ? normalizeRuPhone(requestedPhone) : null;
    const limit = parseAdminLimit(req.query?.limit, ADMIN_PHONE_DEFAULT_LIMIT, ADMIN_PHONE_MAX_LIMIT);

    const rows = await withPrismaRetry('admin/phone-verifications', async () =>
      normalizedPhone
        ? prisma.$queryRawUnsafe(
            `
              SELECT
                "id",
                "phone",
                "method",
                "callcheckId",
                "callPhone",
                "attemptsLeft",
                "expiresAt",
                "verifiedAt",
                "consumedAt",
                "createdAt",
                "updatedAt"
              FROM "PhoneVerificationSession"
              WHERE "phone" = $1
              ORDER BY "createdAt" DESC
              LIMIT $2::int;
            `,
            normalizedPhone,
            limit
          )
        : prisma.$queryRawUnsafe(
            `
              SELECT
                "id",
                "phone",
                "method",
                "callcheckId",
                "callPhone",
                "attemptsLeft",
                "expiresAt",
                "verifiedAt",
                "consumedAt",
                "createdAt",
                "updatedAt"
              FROM "PhoneVerificationSession"
              ORDER BY "createdAt" DESC
              LIMIT $1::int;
            `,
            limit
          )
    );

    return res.json({
      ok: true,
      phone: normalizedPhone,
      limit,
      sessions: Array.isArray(rows) ? rows : [],
    });
  } catch (error) {
    console.error('admin/phone-verifications error', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

const port = process.env.PORT || 4000;
ensureSchema().finally(() => {
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
});
