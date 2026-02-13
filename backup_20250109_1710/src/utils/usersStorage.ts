import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserData {
  id: string;
  // Данные о себе (шаг 1 регистрации)
  fullName?: string;
  position?: string;
  phone?: string;
  email: string;
  socialLink?: string;
  agreePersonalData?: boolean;
  agreePrivacy?: boolean;
  // Данные о бизнесе (шаг 2 регистрации)
  projectName?: string;
  outletsCount?: string;
  workFormat?: string;
  city?: string;
  address?: string;
  projectLink?: string;
  projectLogoUri?: string;
  // Данные для входа (шаг 3 регистрации)
  password: string; // Храним пароль локально (в реальном приложении - только хеш)
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


/**
 * Обновление данных пользователя
 */
export const updateUser = async (userId: string, updates: Partial<Omit<UserData, 'id' | 'registeredAt'>>): Promise<UserData | null> => {
  try {
    const users = await getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return null;
    }
    
    // Обновляем данные пользователя
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
    };
    
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    console.log('Данные пользователя обновлены:', userId);
    return users[userIndex];
  } catch (error) {
    console.error('Ошибка обновления пользователя:', error);
    throw error;
  }
};

/**
 * Удаление пользователя по ID
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const users = await getUsers();
    const filteredUsers = users.filter(user => user.id !== userId);
    
    if (filteredUsers.length === users.length) {
      // Пользователь не найден
      return false;
    }
    
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filteredUsers));
    console.log('Пользователь удален:', userId);
    return true;
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    throw error;
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

/**
 * Инициализация предустановленного пользователя
 */
export const initializeDefaultUser = async (): Promise<void> => {
  try {
    const existingUser = await findUserByEmail('Daykwon@yandex.ru');
    if (!existingUser) {
      const defaultUser = await saveUser({
        email: 'Daykwon@yandex.ru',
        password: 'Sergo1289',
      });
      console.log('Предустановленный пользователь создан:', defaultUser.id);
    } else {
      console.log('Предустановленный пользователь уже существует');
    }
  } catch (error) {
    console.error('Ошибка инициализации предустановленного пользователя:', error);
  }
};
