import AsyncStorage from '@react-native-async-storage/async-storage';

// Базовый URL API - используйте переменную окружения или укажите ваш URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Флаг для переключения между локальным и серверным режимом
const USE_SERVER_API = process.env.EXPO_PUBLIC_USE_SERVER_API === 'true' || false;

// Вспомогательная функция для API запросов
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = await AsyncStorage.getItem('authToken');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
};

export interface User {
  id: string;
  email: string;
  fullName?: string;
  position?: string;
  phone?: string;
  socialLink?: string;
  projectName?: string;
  outletsCount?: string;
  workFormat?: string;
  city?: string;
  address?: string;
  projectLink?: string;
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
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    if (USE_SERVER_API) {
      // Серверный режим
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success && response.token && response.user) {
        // Сохраняем данные авторизации
        await AsyncStorage.setItem('authToken', response.token);
        await AsyncStorage.setItem('userEmail', response.user.email);
        await AsyncStorage.setItem('isAuthenticated', 'true');
        await AsyncStorage.setItem('userId', response.user.id);
      }

      return response;
    } else {
      // Локальный режим (fallback)
      const { findUserByEmail } = await import('./usersStorage');
      const { migrateUserData } = await import('./userDataStorage');
      
      const user = await findUserByEmail(email);
      
      if (!user) {
        return {
          success: false,
          error: 'Пользователь с таким email не найден',
        };
      }

      if (user.password !== password) {
        return {
          success: false,
          error: 'Неверный пароль',
        };
      }

      const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('isAuthenticated', 'true');
      await AsyncStorage.setItem('userId', user.id);

      await migrateUserData(user.id);

      const userData: User = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        position: user.position,
        phone: user.phone,
        socialLink: user.socialLink,
        projectName: user.projectName,
        outletsCount: user.outletsCount,
        workFormat: user.workFormat,
        city: user.city,
        address: user.address,
        projectLink: user.projectLink,
        restaurantName: user.projectName,
        createdAt: user.registeredAt,
      };

      return {
        success: true,
        token: token,
        user: userData,
      };
    }
  } catch (error: any) {
    console.error('Ошибка авторизации:', error);
    return {
      success: false,
      error: error.message || 'Ошибка авторизации. Попробуйте снова.',
    };
  }
};

/**
 * Регистрация нового пользователя
 */
export const register = async (
  email: string,
  password: string,
  additionalData?: {
    fullName?: string;
    position?: string;
    phone?: string;
    socialLink?: string;
    agreePersonalData?: boolean;
    agreePrivacy?: boolean;
    projectName?: string;
    outletsCount?: string;
    workFormat?: string;
    city?: string;
    address?: string;
    projectLink?: string;
  }
): Promise<AuthResponse> => {
  try {
    if (USE_SERVER_API) {
      // Серверный режим
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          ...additionalData,
        }),
      });

      if (response.success && response.token && response.user) {
        await AsyncStorage.setItem('authToken', response.token);
        await AsyncStorage.setItem('userEmail', response.user.email);
        await AsyncStorage.setItem('isAuthenticated', 'true');
        await AsyncStorage.setItem('userId', response.user.id);
      }

      return response;
    } else {
      // Локальный режим (fallback)
      const { findUserByEmail, saveUser } = await import('./usersStorage');
      const { migrateUserData } = await import('./userDataStorage');
      
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        return {
          success: false,
          error: 'Пользователь с таким email уже зарегистрирован',
        };
      }

      const newUser = await saveUser({
        email,
        password,
        ...(additionalData || {}),
      });

      const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('isAuthenticated', 'true');
      await AsyncStorage.setItem('userId', newUser.id);

      await migrateUserData(newUser.id);

      const userData: User = {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        position: newUser.position,
        phone: newUser.phone,
        socialLink: newUser.socialLink,
        projectName: newUser.projectName,
        outletsCount: newUser.outletsCount,
        workFormat: newUser.workFormat,
        city: newUser.city,
        address: newUser.address,
        projectLink: newUser.projectLink,
        restaurantName: newUser.projectName,
        createdAt: newUser.registeredAt,
      };

      return {
        success: true,
        token: token,
        user: userData,
      };
    }
  } catch (error: any) {
    console.error('Ошибка регистрации:', error);
    return {
      success: false,
      error: error.message || 'Ошибка регистрации. Попробуйте снова.',
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
 */
export const getUserData = async (): Promise<User | null> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return null;

    if (USE_SERVER_API) {
      // Серверный режим
      const response = await apiRequest('/api/users/me');
      if (response.success && response.user) {
        return response.user;
      }
      return null;
    } else {
      // Локальный режим (fallback)
      const email = await AsyncStorage.getItem('userEmail');
      const userId = await AsyncStorage.getItem('userId');

      if (!email || !userId) return null;

      const { findUserByEmail } = await import('./usersStorage');
      const userData = await findUserByEmail(email);

      if (!userData) return null;

      return {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        position: userData.position,
        phone: userData.phone,
        socialLink: userData.socialLink,
        projectName: userData.projectName,
        outletsCount: userData.outletsCount,
        workFormat: userData.workFormat,
        city: userData.city,
        address: userData.address,
        projectLink: userData.projectLink,
        restaurantName: userData.projectName,
        createdAt: userData.registeredAt,
      };
    }
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error);
    return null;
  }
};

/**
 * Сохранение истории диагностики на сервер
 */
export const saveDiagnosisHistory = async (data: any): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return false;

    if (USE_SERVER_API) {
      // Серверный режим
      const response = await apiRequest('/api/diagnosis/history', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.success || false;
    } else {
      // Локальный режим (fallback)
      const existingHistory = await AsyncStorage.getItem('userDiagnosisHistory');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      history.push({
        ...data,
        timestamp: new Date().toISOString(),
      });
      await AsyncStorage.setItem('userDiagnosisHistory', JSON.stringify(history));
      return true;
    }
  } catch (error) {
    console.error('Ошибка сохранения истории:', error);
    return false;
  }
};

/**
 * Получение истории диагностики пользователя
 */
export const getDiagnosisHistory = async (): Promise<any[]> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return [];

    if (USE_SERVER_API) {
      // Серверный режим
      const response = await apiRequest('/api/diagnosis/history');
      return response.success ? response.history || [] : [];
    } else {
      // Локальный режим (fallback)
      const history = await AsyncStorage.getItem('userDiagnosisHistory');
      return history ? JSON.parse(history) : [];
    }
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

/**
 * Обновление данных пользователя
 */
export const updateUserData = async (updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> => {
  try {
    if (USE_SERVER_API) {
      // Серверный режим
      const userDataUpdates: any = { ...updates };
      if (updates.restaurantName) {
        userDataUpdates.projectName = updates.restaurantName;
      }

      const response = await apiRequest('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(userDataUpdates),
      });

      return response.success ? response.user : null;
    } else {
      // Локальный режим (fallback)
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        throw new Error('Пользователь не найден');
      }

      const { updateUser } = await import('./usersStorage');
      
      const userDataUpdates: any = { ...updates };
      if (updates.restaurantName) {
        userDataUpdates.projectName = updates.restaurantName;
      }
      
      const updatedUser = await updateUser(userId, userDataUpdates);
      
      if (!updatedUser) {
        throw new Error('Не удалось обновить данные пользователя');
      }

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        position: updatedUser.position,
        phone: updatedUser.phone,
        socialLink: updatedUser.socialLink,
        projectName: updatedUser.projectName,
        outletsCount: updatedUser.outletsCount,
        workFormat: updatedUser.workFormat,
        city: updatedUser.city,
        address: updatedUser.address,
        projectLink: updatedUser.projectLink,
        restaurantName: updatedUser.projectName,
        createdAt: updatedUser.registeredAt,
      };
    }
  } catch (error) {
    console.error('Ошибка обновления данных пользователя:', error);
    throw error;
  }
};

/**
 * Удаление аккаунта
 */
export const deleteAccount = async (): Promise<boolean> => {
  try {
    if (USE_SERVER_API) {
      // Серверный режим
      const response = await apiRequest('/api/users/me', {
        method: 'DELETE',
      });

      if (response.success) {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('isAuthenticated');
        await AsyncStorage.removeItem('userEmail');
        await AsyncStorage.removeItem('userId');
        await AsyncStorage.removeItem('userAvatar');
      }

      return response.success || false;
    } else {
      // Локальный режим (fallback)
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        throw new Error('Пользователь не найден');
      }

      const { deleteUser } = await import('./usersStorage');
      const { clearUserData } = await import('./userDataStorage');
      
      await clearUserData(userId);
      const deleted = await deleteUser(userId);
      
      if (!deleted) {
        throw new Error('Не удалось удалить пользователя');
      }

      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('isAuthenticated');
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('userAvatar');
      
      return true;
    }
  } catch (error) {
    console.error('Ошибка удаления аккаунта:', error);
    throw error;
  }
};

