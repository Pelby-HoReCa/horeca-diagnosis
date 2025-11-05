import AsyncStorage from '@react-native-async-storage/async-storage';

// Базовый URL API (будет настроен позже)
const API_BASE_URL = 'https://api.pelby.ru'; // TODO: Заменить на реальный URL

export interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  restaurantName?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Авторизация пользователя
 * TODO: Заменить на реальный API вызов
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    // TODO: Реальный API вызов
    // const response = await fetch(`${API_BASE_URL}/auth/login`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ email, password }),
    // });
    // const data = await response.json();

    // Пока используем mock-авторизацию
    await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация задержки сети
    
    const mockUser: User = {
      id: 'user_' + Date.now(),
      email: email,
      createdAt: new Date().toISOString(),
    };

    const mockToken = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Сохраняем в AsyncStorage
    await AsyncStorage.setItem('authToken', mockToken);
    await AsyncStorage.setItem('userEmail', email);
    await AsyncStorage.setItem('isAuthenticated', 'true');
    await AsyncStorage.setItem('userId', mockUser.id);

    return {
      success: true,
      token: mockToken,
      user: mockUser,
    };
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    return {
      success: false,
      error: 'Ошибка подключения к серверу',
    };
  }
};

/**
 * Регистрация нового пользователя
 * TODO: Заменить на реальный API вызов
 */
export const register = async (
  email: string,
  password: string,
  fullName?: string
): Promise<AuthResponse> => {
  try {
    // TODO: Реальный API вызов
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: 'user_' + Date.now(),
      email: email,
      fullName: fullName,
      createdAt: new Date().toISOString(),
    };

    const mockToken = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    await AsyncStorage.setItem('authToken', mockToken);
    await AsyncStorage.setItem('userEmail', email);
    await AsyncStorage.setItem('isAuthenticated', 'true');
    await AsyncStorage.setItem('userId', mockUser.id);

    return {
      success: true,
      token: mockToken,
      user: mockUser,
    };
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    return {
      success: false,
      error: 'Ошибка подключения к серверу',
    };
  }
};

/**
 * Восстановление пароля
 * TODO: Заменить на реальный API вызов
 */
export const resetPassword = async (email: string): Promise<PasswordResetResponse> => {
  try {
    // TODO: Реальный API вызов
    // const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ email }),
    // });
    // const data = await response.json();

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock: всегда успешно
    return {
      success: true,
      message: 'Инструкции по восстановлению пароля отправлены на ваш email',
    };
  } catch (error) {
    console.error('Ошибка восстановления пароля:', error);
    return {
      success: false,
      error: 'Ошибка подключения к серверу',
    };
  }
};

/**
 * Получение данных пользователя
 * TODO: Заменить на реальный API вызов
 */
export const getUserData = async (): Promise<User | null> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return null;

    // TODO: Реальный API вызов
    // const response = await fetch(`${API_BASE_URL}/user/profile`, {
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //   },
    // });
    // const data = await response.json();

    const email = await AsyncStorage.getItem('userEmail');
    const userId = await AsyncStorage.getItem('userId');

    if (!email || !userId) return null;

    return {
      id: userId,
      email: email,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error);
    return null;
  }
};

/**
 * Сохранение истории диагностики на сервер
 * TODO: Заменить на реальный API вызов
 */
export const saveDiagnosisHistory = async (data: any): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return false;

    // TODO: Реальный API вызов
    // const response = await fetch(`${API_BASE_URL}/diagnosis/history`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${token}`,
    //   },
    //   body: JSON.stringify(data),
    // });

    // Пока сохраняем локально
    const existingHistory = await AsyncStorage.getItem('userDiagnosisHistory');
    const history = existingHistory ? JSON.parse(existingHistory) : [];
    history.push({
      ...data,
      timestamp: new Date().toISOString(),
    });
    await AsyncStorage.setItem('userDiagnosisHistory', JSON.stringify(history));

    return true;
  } catch (error) {
    console.error('Ошибка сохранения истории:', error);
    return false;
  }
};

/**
 * Получение истории диагностики пользователя
 * TODO: Заменить на реальный API вызов
 */
export const getDiagnosisHistory = async (): Promise<any[]> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return [];

    // TODO: Реальный API вызов
    // const response = await fetch(`${API_BASE_URL}/diagnosis/history`, {
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //   },
    // });
    // const data = await response.json();

    // Пока получаем из локального хранилища
    const history = await AsyncStorage.getItem('userDiagnosisHistory');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Ошибка получения истории:', error);
    return [];
  }
};

/**
 * Выход из аккаунта
 */
export const logout = async (): Promise<void> => {
  try {
    // TODO: Реальный API вызов для инвалидации токена
    console.log('Начало выхода из аккаунта...');
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('isAuthenticated');
    await AsyncStorage.removeItem('userEmail');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userAvatar'); // Также удаляем аватар
    console.log('Выход из аккаунта выполнен успешно');
  } catch (error) {
    console.error('Ошибка выхода:', error);
    throw error;
  }
};

