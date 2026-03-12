import { API_BASE_URL } from './config';
import { getUserData } from './api';
import { getCurrentUserId, getSelectedVenueId, loadUserQuestionnaire } from './userDataStorage';

export type AiHistoryItem = {
  role: 'user' | 'assistant';
  text: string;
};

type AskAiResult = {
  reply: string;
  provider: string;
};

const normalizeHistory = (history: AiHistoryItem[]): AiHistoryItem[] => {
  return history
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant'))
    .map((item) => ({
      role: item.role,
      text: item.text.trim(),
    }))
    .filter((item) => item.text.length > 0)
    .slice(-10);
};

const buildUserContext = async () => {
  const userId = await getCurrentUserId();
  const user = await getUserData();
  const selectedVenueId = await getSelectedVenueId(userId);
  const questionnaire = userId ? await loadUserQuestionnaire(userId) : null;

  const restaurants = Array.isArray(questionnaire?.restaurants)
    ? questionnaire.restaurants
        .map((item: any) => ({
          id: typeof item?.id === 'string' ? item.id : null,
          name: typeof item?.name === 'string' ? item.name : null,
          address: typeof item?.address === 'string' ? item.address : null,
        }))
        .filter((item: any) => item.name)
        .slice(0, 5)
    : [];

  return {
    userId,
    selectedVenueId,
    profile: {
      fullName: user?.fullName || null,
      email: user?.email || null,
      phone: user?.phone || null,
      projectName: user?.projectName || user?.restaurantName || null,
      city: user?.city || null,
      address: user?.address || null,
    },
    restaurants,
  };
};

export const askAiAssistant = async (
  message: string,
  history: AiHistoryItem[]
): Promise<AskAiResult> => {
  const payload = {
    message: message.trim(),
    history: normalizeHistory(history),
    userContext: await buildUserContext(),
  };

  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const serverError =
      typeof data?.error === 'string' && data.error ? data.error : `http_${response.status}`;
    throw new Error(serverError);
  }

  if (!data?.ok || typeof data?.reply !== 'string' || !data.reply.trim()) {
    throw new Error('empty_reply');
  }

  return {
    reply: data.reply.trim(),
    provider: typeof data?.provider === 'string' ? data.provider : 'unknown',
  };
};
