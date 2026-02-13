import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';
import { getCurrentUserId } from './userDataStorage';

export const pushLocalDataToServer = async (): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const keys = await AsyncStorage.getAllKeys();
    if (!keys.length) return false;

    const entries = await AsyncStorage.multiGet(keys);
    const data: Record<string, string | null> = {};
    entries.forEach(([key, value]) => {
      data[key] = value ?? null;
    });

    const res = await fetch(`${API_BASE_URL}/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, data }),
    });

    if (!res.ok) return false;
    return true;
  } catch (error) {
    console.error('pushLocalDataToServer error', error);
    return false;
  }
};

export const pullServerDataToLocal = async (force = false): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    if (!force) {
      const existingKeys = await AsyncStorage.getAllKeys();
      if (existingKeys.length > 0) {
        return false;
      }
    }

    const res = await fetch(`${API_BASE_URL}/sync/pull/${userId}`);
    if (!res.ok) return false;
    const payload = await res.json();
    if (!payload?.data) return false;

    const entries = Object.entries(payload.data).map(([key, value]) => [key, value]);
    if (entries.length > 0) {
      await AsyncStorage.multiSet(entries as [string, string][]);
    }
    return true;
  } catch (error) {
    console.error('pullServerDataToLocal error', error);
    return false;
  }
};
