import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiagnosisBlock } from '../data/diagnosisBlocks';
import { Task } from './recommendationEngine';

/**
 * Получение userId текущего пользователя
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    return userId;
  } catch (error) {
    console.error('Ошибка получения userId:', error);
    return null;
  }
};

/**
 * Утилиты для работы с данными пользователя
 * Все данные привязываются к userId для изоляции между пользователями
 */

/**
 * Сохранение блоков диагностики для пользователя
 */
export const saveUserBlocks = async (userId: string, blocks: DiagnosisBlock[]): Promise<void> => {
  try {
    const key = `user_${userId}_diagnosisBlocks`;
    await AsyncStorage.setItem(key, JSON.stringify(blocks));
    console.log(`Блоки диагностики сохранены для пользователя ${userId}`);
  } catch (error) {
    console.error('Ошибка сохранения блоков диагностики:', error);
    throw error;
  }
};

/**
 * Загрузка блоков диагностики для пользователя
 */
export const loadUserBlocks = async (userId: string): Promise<DiagnosisBlock[] | null> => {
  try {
    const key = `user_${userId}_diagnosisBlocks`;
    const blocksJson = await AsyncStorage.getItem(key);
    if (blocksJson) {
      return JSON.parse(blocksJson);
    }
    return null;
  } catch (error) {
    console.error('Ошибка загрузки блоков диагностики:', error);
    return null;
  }
};

/**
 * Сохранение задач для пользователя
 */
export const saveUserTasks = async (userId: string, tasks: Task[]): Promise<void> => {
  try {
    const key = `user_${userId}_actionPlanTasks`;
    await AsyncStorage.setItem(key, JSON.stringify(tasks));
    console.log(`Задачи сохранены для пользователя ${userId}`);
  } catch (error) {
    console.error('Ошибка сохранения задач:', error);
    throw error;
  }
};

/**
 * Загрузка задач для пользователя
 */
export const loadUserTasks = async (userId: string): Promise<Task[]> => {
  try {
    const key = `user_${userId}_actionPlanTasks`;
    const tasksJson = await AsyncStorage.getItem(key);
    if (tasksJson) {
      return JSON.parse(tasksJson);
    }
    return [];
  } catch (error) {
    console.error('Ошибка загрузки задач:', error);
    return [];
  }
};

/**
 * Сохранение данных анкетирования для пользователя
 */
export const saveUserQuestionnaire = async (userId: string, data: any): Promise<void> => {
  try {
    const key = `user_${userId}_questionnaireData`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
    await AsyncStorage.setItem(`user_${userId}_questionnaireCompleted`, 'true');
    console.log(`Анкетирование сохранено для пользователя ${userId}`);
  } catch (error) {
    console.error('Ошибка сохранения анкетирования:', error);
    throw error;
  }
};

/**
 * Загрузка данных анкетирования для пользователя
 */
export const loadUserQuestionnaire = async (userId: string): Promise<any | null> => {
  try {
    const key = `user_${userId}_questionnaireData`;
    const dataJson = await AsyncStorage.getItem(key);
    if (dataJson) {
      return JSON.parse(dataJson);
    }
    return null;
  } catch (error) {
    console.error('Ошибка загрузки анкетирования:', error);
    return null;
  }
};

/**
 * Проверка, пройдено ли анкетирование для пользователя
 */
export const isUserQuestionnaireCompleted = async (userId: string): Promise<boolean> => {
  try {
    const key = `user_${userId}_questionnaireCompleted`;
    const status = await AsyncStorage.getItem(key);
    return status === 'true';
  } catch (error) {
    console.error('Ошибка проверки статуса анкетирования:', error);
    return false;
  }
};

/**
 * Сохранение данных дашборда для пользователя
 */
export const saveUserDashboardData = async (userId: string, data: {
  allBlocksCompleted?: string;
  previousResult?: string;
  currentResult?: string;
}): Promise<void> => {
  try {
    if (data.allBlocksCompleted !== undefined) {
      await AsyncStorage.setItem(`user_${userId}_dashboardAllBlocksCompleted`, data.allBlocksCompleted);
    }
    if (data.previousResult !== undefined) {
      await AsyncStorage.setItem(`user_${userId}_dashboardPreviousResult`, data.previousResult);
    }
    if (data.currentResult !== undefined) {
      await AsyncStorage.setItem(`user_${userId}_dashboardCurrentResult`, data.currentResult);
    }
    console.log(`Данные дашборда сохранены для пользователя ${userId}`);
  } catch (error) {
    console.error('Ошибка сохранения данных дашборда:', error);
    throw error;
  }
};

/**
 * Загрузка данных дашборда для пользователя
 */
export const loadUserDashboardData = async (userId: string): Promise<{
  allBlocksCompleted: string | null;
  previousResult: string | null;
  currentResult: string | null;
}> => {
  try {
    const allBlocksCompleted = await AsyncStorage.getItem(`user_${userId}_dashboardAllBlocksCompleted`);
    const previousResult = await AsyncStorage.getItem(`user_${userId}_dashboardPreviousResult`);
    const currentResult = await AsyncStorage.getItem(`user_${userId}_dashboardCurrentResult`);
    
    return {
      allBlocksCompleted,
      previousResult,
      currentResult,
    };
  } catch (error) {
    console.error('Ошибка загрузки данных дашборда:', error);
    return {
      allBlocksCompleted: null,
      previousResult: null,
      currentResult: null,
    };
  }
};

/**
 * Копирование данных из глобальных ключей в пользовательские (миграция)
 */
export const migrateUserData = async (userId: string): Promise<void> => {
  try {
    // Копируем блоки диагностики
    const globalBlocks = await AsyncStorage.getItem('diagnosisBlocks');
    if (globalBlocks) {
      await saveUserBlocks(userId, JSON.parse(globalBlocks));
    }

    // Копируем задачи
    const globalTasks = await AsyncStorage.getItem('actionPlanTasks');
    if (globalTasks) {
      await saveUserTasks(userId, JSON.parse(globalTasks));
    }

    // Копируем данные анкетирования
    const globalQuestionnaire = await AsyncStorage.getItem('questionnaireData');
    if (globalQuestionnaire) {
      await saveUserQuestionnaire(userId, JSON.parse(globalQuestionnaire));
    }

    // Копируем данные дашборда
    const allBlocksCompleted = await AsyncStorage.getItem('dashboardAllBlocksCompleted');
    const previousResult = await AsyncStorage.getItem('dashboardPreviousResult');
    const currentResult = await AsyncStorage.getItem('dashboardCurrentResult');
    
    if (allBlocksCompleted || previousResult || currentResult) {
      await saveUserDashboardData(userId, {
        allBlocksCompleted: allBlocksCompleted || undefined,
        previousResult: previousResult || undefined,
        currentResult: currentResult || undefined,
      });
    }

    console.log(`Данные мигрированы для пользователя ${userId}`);
  } catch (error) {
    console.error('Ошибка миграции данных:', error);
  }
};

/**
 * Очистка всех данных пользователя
 */
export const clearUserData = async (userId: string): Promise<void> => {
  try {
    const keys = [
      `user_${userId}_diagnosisBlocks`,
      `user_${userId}_actionPlanTasks`,
      `user_${userId}_questionnaireData`,
      `user_${userId}_questionnaireCompleted`,
      `user_${userId}_dashboardAllBlocksCompleted`,
      `user_${userId}_dashboardPreviousResult`,
      `user_${userId}_dashboardCurrentResult`,
    ];

    await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
    console.log(`Все данные пользователя ${userId} удалены`);
  } catch (error) {
    console.error('Ошибка очистки данных пользователя:', error);
    throw error;
  }
};

