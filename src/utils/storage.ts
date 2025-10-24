import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SurveyResult {
  id: string;
  blockId: string;
  blockTitle: string;
  answers: Record<string, string>;
  timestamp: number;
  score: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  category: string;
  completed: boolean;
}

export const saveSurveyResult = async (result: SurveyResult): Promise<void> => {
  try {
    const existingResults = await getSurveyHistory();
    const updatedResults = [...existingResults, result];
    await AsyncStorage.setItem('surveyHistory', JSON.stringify(updatedResults));
  } catch (error) {
    console.error('Ошибка сохранения результата опроса:', error);
  }
};

export const getSurveyHistory = async (): Promise<SurveyResult[]> => {
  try {
    const results = await AsyncStorage.getItem('surveyHistory');
    return results ? JSON.parse(results) : [];
  } catch (error) {
    console.error('Ошибка загрузки истории опросов:', error);
    return [];
  }
};

export const saveTask = async (task: Task): Promise<void> => {
  try {
    const existingTasks = await getTasks();
    const updatedTasks = [...existingTasks, task];
    await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
  } catch (error) {
    console.error('Ошибка сохранения задачи:', error);
  }
};

export const getTasks = async (): Promise<Task[]> => {
  try {
    const tasks = await AsyncStorage.getItem('tasks');
    return tasks ? JSON.parse(tasks) : [];
  } catch (error) {
    console.error('Ошибка загрузки задач:', error);
    return [];
  }
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  try {
    const tasks = await getTasks();
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    );
    await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
  } catch (error) {
    console.error('Ошибка обновления задачи:', error);
  }
};
