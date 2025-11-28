// Временная реализация с использованием файла/памяти
// В продакшене замените на реальную БД

import fs from 'fs';
import path from 'path';

export interface DiagnosisHistory {
  id: string;
  userId: string;
  blocks: any[];
  tasks: any[];
  efficiency: number;
  createdAt: string;
  updatedAt?: string;
}

const DATA_DIR = path.join(__dirname, '../data');
const DIAGNOSIS_FILE = path.join(DATA_DIR, 'diagnosis.json');

// Инициализация директории данных
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Загрузка истории диагностики из файла
const loadDiagnosis = (): DiagnosisHistory[] => {
  try {
    if (fs.existsSync(DIAGNOSIS_FILE)) {
      const data = fs.readFileSync(DIAGNOSIS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Ошибка загрузки истории диагностики:', error);
  }
  return [];
};

// Сохранение истории диагностики в файл
const saveDiagnosis = (diagnosis: DiagnosisHistory[]): void => {
  try {
    fs.writeFileSync(DIAGNOSIS_FILE, JSON.stringify(diagnosis, null, 2));
  } catch (error) {
    console.error('Ошибка сохранения истории диагностики:', error);
    throw error;
  }
};

export const saveDiagnosisHistory = async (
  data: Omit<DiagnosisHistory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DiagnosisHistory> => {
  const allDiagnosis = loadDiagnosis();
  const newDiagnosis: DiagnosisHistory = {
    ...data,
    id: `diagnosis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  allDiagnosis.push(newDiagnosis);
  saveDiagnosis(allDiagnosis);
  
  return newDiagnosis;
};

export const getDiagnosisHistory = async (userId: string): Promise<DiagnosisHistory[]> => {
  const allDiagnosis = loadDiagnosis();
  return allDiagnosis.filter(d => d.userId === userId);
};

// Получение всех диагностик (для админки)
export const getAllDiagnosis = async (): Promise<DiagnosisHistory[]> => {
  return loadDiagnosis();
};

// ПРИМЕЧАНИЕ: Для продакшена замените на реальную БД
// Пример для PostgreSQL:
/*
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const saveDiagnosisHistory = async (data: Omit<DiagnosisHistory, 'id' | 'createdAt'>): Promise<DiagnosisHistory> => {
  const result = await pool.query(
    `INSERT INTO diagnosis_history (user_id, blocks, tasks, efficiency) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [data.userId, JSON.stringify(data.blocks), JSON.stringify(data.tasks), data.efficiency]
  );
  return result.rows[0];
};

export const getDiagnosisHistory = async (userId: string): Promise<DiagnosisHistory[]> => {
  const result = await pool.query(
    'SELECT * FROM diagnosis_history WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};
*/

