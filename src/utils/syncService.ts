import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';
import { getCurrentUserId } from './userDataStorage';

const SYNC_LAST_HASH_KEY = 'sync_last_snapshot_hash_v1';
const SYNC_LAST_SUCCESS_AT_KEY = 'sync_last_success_at_v1';
const SYNC_META_KEYS = new Set([
  SYNC_LAST_HASH_KEY,
  SYNC_LAST_SUCCESS_AT_KEY,
  'serverSyncCompleted_v1',
]);
const SYNC_REQUEST_TIMEOUT_MS = 15000;
const SYNC_RETRY_COUNT = 1;
const NETWORK_ERROR_LOG_THROTTLE_MS = 60000;
const SYNC_NETWORK_BACKOFF_MS = 120000;
let lastNetworkSyncErrorLogAt = 0;
let syncNetworkBackoffUntil = 0;

interface LocalSnapshot {
  entries: [string, string | null][];
  hash: string;
}

const getErrorText = (error: unknown): string => {
  const errorAny = error as { name?: string; message?: string };
  return [
    errorAny?.name,
    errorAny?.message,
    (errorAny as { code?: string })?.code,
    (errorAny as { stack?: string })?.stack,
    String(error || ''),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const isNetworkRequestError = (error: unknown): boolean => {
  const errorText = getErrorText(error);
  const hasNetworkPattern =
    errorText.includes('network request failed') ||
    errorText.includes('failed to fetch') ||
    errorText.includes('request failed') ||
    errorText.includes('aborted') ||
    errorText.includes('aborterror') ||
    errorText.includes('timed out') ||
    errorText.includes('timeout') ||
    errorText.includes('xmlhttprequest');
  const looksLikeFetchTypeError =
    errorText.includes('typeerror') &&
    (errorText.includes('fetch.umd.js') || errorText.includes('whatwg-fetch'));

  return (
    hasNetworkPattern ||
    looksLikeFetchTypeError
  );
};

const isNetworkBackoffActive = () => Date.now() < syncNetworkBackoffUntil;

const activateNetworkBackoff = () => {
  syncNetworkBackoffUntil = Date.now() + SYNC_NETWORK_BACKOFF_MS;
};

const clearNetworkBackoff = () => {
  syncNetworkBackoffUntil = 0;
};

const logSyncNetworkWarning = (scope: 'push' | 'pull', error: unknown) => {
  const now = Date.now();
  if (now - lastNetworkSyncErrorLogAt < NETWORK_ERROR_LOG_THROTTLE_MS) {
    return;
  }
  lastNetworkSyncErrorLogAt = now;
  const message =
    (error as { message?: string })?.message ||
    String(error || 'network_error');
  const label = scope === 'push' ? 'pushLocalDataToServer' : 'pullServerDataToLocal';
  console.warn(`${label} network issue`, message);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithTimeoutAndRetry = async (
  url: string,
  options: RequestInit = {},
  retryCount = SYNC_RETRY_COUNT
): Promise<Response> => {
  let attempt = 0;
  while (true) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SYNC_REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.status >= 500 && attempt < retryCount) {
        attempt += 1;
        await wait(350 * attempt);
        continue;
      }
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (isNetworkRequestError(error) && attempt < retryCount) {
        attempt += 1;
        await wait(350 * attempt);
        continue;
      }
      throw error;
    }
  }
};

const hashString = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16);
};

const buildLocalSnapshot = async (): Promise<LocalSnapshot | null> => {
  const allKeys = await AsyncStorage.getAllKeys();
  const keys = allKeys.filter((key) => !SYNC_META_KEYS.has(key)).sort();
  if (!keys.length) {
    return null;
  }

  const rawEntries = await AsyncStorage.multiGet(keys);
  const entries = rawEntries.sort((a, b) => a[0].localeCompare(b[0]));
  const signature = entries.map(([key, value]) => `${key}:${value ?? ''}`).join('|');

  return {
    entries,
    hash: hashString(signature),
  };
};

const markSnapshotSynced = async (hash: string) => {
  await AsyncStorage.multiSet([
    [SYNC_LAST_HASH_KEY, hash],
    [SYNC_LAST_SUCCESS_AT_KEY, new Date().toISOString()],
  ]);
};

type ServerSnapshotState = 'exists' | 'missing' | 'unknown';

const checkServerSnapshotState = async (userId: string): Promise<ServerSnapshotState> => {
  try {
    const res = await fetchWithTimeoutAndRetry(
      `${API_BASE_URL}/sync/pull/${encodeURIComponent(userId)}`
    );
    if (res.status === 404) {
      return 'missing';
    }
    if (res.ok) {
      return 'exists';
    }
    return 'unknown';
  } catch (error) {
    if (isNetworkRequestError(error)) {
      activateNetworkBackoff();
      logSyncNetworkWarning('pull', error);
      return 'unknown';
    }
    console.error('checkServerSnapshotState error', error);
    return 'unknown';
  }
};

export const pushLocalDataToServer = async (force = false): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    if (isNetworkBackoffActive()) return false;

    const snapshot = await buildLocalSnapshot();
    if (!snapshot) return false;

    if (!force) {
      const previousHash = await AsyncStorage.getItem(SYNC_LAST_HASH_KEY);
      if (previousHash && previousHash === snapshot.hash) {
        return true;
      }
    }

    const data: Record<string, string | null> = {};
    snapshot.entries.forEach(([key, value]) => {
      data[key] = value ?? null;
    });

    const res = await fetchWithTimeoutAndRetry(`${API_BASE_URL}/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, data }),
    });

    if (!res.ok) return false;
    await markSnapshotSynced(snapshot.hash);
    clearNetworkBackoff();
    return true;
  } catch (error) {
    if (isNetworkRequestError(error)) {
      activateNetworkBackoff();
      logSyncNetworkWarning('push', error);
      return false;
    }
    console.error('pushLocalDataToServer error', error);
    return false;
  }
};

export const ensureServerSnapshotForCurrentUser = async (): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    if (isNetworkBackoffActive()) return false;

    const localSnapshot = await buildLocalSnapshot();
    if (!localSnapshot) return false;

    const serverState = await checkServerSnapshotState(userId);
    if (serverState !== 'missing') {
      return false;
    }

    return await pushLocalDataToServer(true);
  } catch (error) {
    console.error('ensureServerSnapshotForCurrentUser error', error);
    return false;
  }
};

export const pullServerDataToLocal = async (force = false): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    if (isNetworkBackoffActive()) return false;

    if (!force) {
      const existingKeys = await AsyncStorage.getAllKeys();
      if (existingKeys.length > 0) {
        return false;
      }
    }

    const res = await fetchWithTimeoutAndRetry(`${API_BASE_URL}/sync/pull/${userId}`);
    if (!res.ok) return false;
    const payload = await res.json();
    if (!payload?.data) return false;

    const entries = Object.entries(payload.data).map(([key, value]) => [key, value]);
    if (entries.length > 0) {
      await AsyncStorage.multiSet(entries as [string, string][]);
      const snapshot = await buildLocalSnapshot();
      if (snapshot) {
        await markSnapshotSynced(snapshot.hash);
      }
    }
    clearNetworkBackoff();
    return true;
  } catch (error) {
    if (isNetworkRequestError(error)) {
      activateNetworkBackoff();
      logSyncNetworkWarning('pull', error);
      return false;
    }
    console.error('pullServerDataToLocal error', error);
    return false;
  }
};
