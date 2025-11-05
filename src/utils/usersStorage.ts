import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  agreePersonalData: boolean;
  agreeMarketing: boolean;
  registeredAt: string;
}

const USERS_STORAGE_KEY = 'registeredUsers';

/**
 * Сохранение нового пользователя
 */
export const saveUser = async (userData: Omit<UserData, 'id' | 'registeredAt'>): Promise<UserData> => {
  try {
    // Получаем существующих пользователей
    const existingUsers = await getUsers();
    
    // Создаем нового пользователя
    const newUser: UserData = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      registeredAt: new Date().toISOString(),
    };
    
    // Добавляем нового пользователя
    const updatedUsers = [...existingUsers, newUser];
    
    // Сохраняем в AsyncStorage
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    
    console.log('Пользователь сохранен:', newUser.id);
    return newUser;
  } catch (error) {
    console.error('Ошибка сохранения пользователя:', error);
    throw error;
  }
};

/**
 * Получение всех зарегистрированных пользователей
 */
export const getUsers = async (): Promise<UserData[]> => {
  try {
    const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    if (usersJson) {
      return JSON.parse(usersJson);
    }
    return [];
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    return [];
  }
};

/**
 * Поиск пользователя по email или username
 */
export const findUserByEmail = async (email: string): Promise<UserData | null> => {
  try {
    const users = await getUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  } catch (error) {
    console.error('Ошибка поиска пользователя:', error);
    return null;
  }
};

export const findUserByUsername = async (username: string): Promise<UserData | null> => {
  try {
    const users = await getUsers();
    return users.find(user => user.username.toLowerCase() === username.toLowerCase()) || null;
  } catch (error) {
    console.error('Ошибка поиска пользователя:', error);
    return null;
  }
};

/**
 * Очистка всех пользователей (для тестирования)
 */
export const clearAllUsers = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USERS_STORAGE_KEY);
    console.log('Все пользователи удалены');
  } catch (error) {
    console.error('Ошибка очистки пользователей:', error);
  }
};

