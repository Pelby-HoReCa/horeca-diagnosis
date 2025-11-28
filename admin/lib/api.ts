// Получаем API URL - в Next.js переменные NEXT_PUBLIC_* доступны в браузере
const API_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://horeca-backend-6zl1.onrender.com')
  : (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://horeca-backend-6zl1.onrender.com');

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

  const url = `${API_URL}${endpoint}`;
  console.log('Запрос к API:', url, { method: options.method || 'GET', headers });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('Статус ответа:', response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP error! status: ${response.status}` };
      }
      console.error('Ошибка API:', errorData);
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Данные ответа:', data);
    return data;
  } catch (error: any) {
    console.error('Ошибка fetch:', error);
    if (error.message) {
      throw error;
    }
    throw new Error(`Ошибка подключения к серверу: ${error.message || 'Неизвестная ошибка'}`);
  }
};

// Авторизация админа
export const adminLogin = async (login: string, password: string) => {
  try {
    console.log('API_URL:', API_URL);
    console.log('Отправка запроса на:', `${API_URL}/api/admin/login`);
    
    const response = await apiRequest<{ success: boolean; token?: string; admin?: any; error?: string }>(
      '/api/admin/login',
      {
        method: 'POST',
        body: JSON.stringify({ email: login, password }), // Бэкенд ожидает email, но это логин
      }
    );

    console.log('Ответ от сервера:', response);

    if (response.success && response.token) {
      saveToken(response.token);
      console.log('Токен сохранен');
    }

    return response;
  } catch (error: any) {
    console.error('Ошибка в adminLogin:', error);
    throw error;
  }
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

