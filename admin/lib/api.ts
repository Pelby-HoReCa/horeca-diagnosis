const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://horeca-backend-6zl1.onrender.com';

export interface AdminUser {
  id: string;
  email: string;
  fullName?: string;
  position?: string;
  phone?: string;
  registeredAt: string;
}

export interface Diagnosis {
  id: string;
  userId: string;
  blocks: any[];
  tasks: any[];
  efficiency: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Stats {
  totalUsers: number;
  totalDiagnosis: number;
  avgEfficiency: number;
  blockStats: Record<string, { count: number; avgEfficiency: number }>;
}

// Получение токена из localStorage
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken');
};

// Сохранение токена в localStorage
export const saveToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('adminToken', token);
};

// Удаление токена
export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('adminToken');
};

// Базовый запрос к API
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Авторизация админа
export const adminLogin = async (email: string, password: string) => {
  const response = await apiRequest<{ success: boolean; token: string; admin: any }>(
    '/api/admin/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
  );

  if (response.success && response.token) {
    saveToken(response.token);
  }

  return response;
};

// Проверка токена
export const verifyAdmin = async () => {
  return apiRequest<{ success: boolean; admin: any }>('/api/admin/verify');
};

// Получение всех пользователей
export const getAllUsers = async (): Promise<{ success: boolean; users: AdminUser[]; total: number }> => {
  return apiRequest('/api/admin/users');
};

// Получение всех диагностик
export const getAllDiagnosis = async (): Promise<{ success: boolean; diagnosis: Diagnosis[]; total: number }> => {
  return apiRequest('/api/admin/diagnosis');
};

// Получение диагностик пользователя
export const getUserDiagnosis = async (userId: string): Promise<{ success: boolean; diagnosis: Diagnosis[]; total: number }> => {
  return apiRequest(`/api/admin/diagnosis/user/${userId}`);
};

// Получение статистики
export const getStats = async (): Promise<{ success: boolean; stats: Stats }> => {
  return apiRequest('/api/admin/stats');
};

