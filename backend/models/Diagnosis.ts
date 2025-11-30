// Реализация модели Diagnosis для PostgreSQL
// Автоматически использует PostgreSQL если DATABASE_URL установлен

import { Pool } from 'pg';

const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

export interface DiagnosisHistory {
  id: string;
  userId: string;
  blocks: any[];
  tasks: any[];
  efficiency: number;
  createdAt: string;
  updatedAt?: string;
}

// Fallback на файловое хранилище если PostgreSQL не настроен
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../data');
const DIAGNOSIS_FILE = path.join(DATA_DIR, 'diagnosis.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

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
  if (pool) {
    // PostgreSQL
    const id = `diagnosis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await pool.query(
      `INSERT INTO diagnosis_history (id, user_id, blocks, tasks, efficiency)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        id,
        data.userId,
        JSON.stringify(data.blocks),
        JSON.stringify(data.tasks),
        data.efficiency,
      ]
    );
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      blocks: typeof row.blocks === 'string' ? JSON.parse(row.blocks) : row.blocks,
      tasks: typeof row.tasks === 'string' ? JSON.parse(row.tasks) : row.tasks,
      efficiency: parseFloat(row.efficiency),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
    };
  } else {
    // Файловое хранилище (fallback)
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
  }
};

export const getDiagnosisHistory = async (userId: string): Promise<DiagnosisHistory[]> => {
  if (pool) {
    // PostgreSQL
    const result = await pool.query(
      'SELECT * FROM diagnosis_history WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      blocks: typeof row.blocks === 'string' ? JSON.parse(row.blocks) : row.blocks,
      tasks: typeof row.tasks === 'string' ? JSON.parse(row.tasks) : row.tasks,
      efficiency: parseFloat(row.efficiency),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
    }));
  } else {
    // Файловое хранилище (fallback)
    const allDiagnosis = loadDiagnosis();
    return allDiagnosis.filter(d => d.userId === userId);
  }
};

export const getAllDiagnosis = async (): Promise<DiagnosisHistory[]> => {
  if (pool) {
    // PostgreSQL
    const result = await pool.query('SELECT * FROM diagnosis_history ORDER BY created_at DESC');
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      blocks: typeof row.blocks === 'string' ? JSON.parse(row.blocks) : row.blocks,
      tasks: typeof row.tasks === 'string' ? JSON.parse(row.tasks) : row.tasks,
      efficiency: parseFloat(row.efficiency),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
    }));
  } else {
    // Файловое хранилище (fallback)
    return loadDiagnosis();
  }
};

export const deleteDiagnosis = async (id: string): Promise<boolean> => {
  if (pool) {
    // PostgreSQL
    const result = await pool.query('DELETE FROM diagnosis_history WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  } else {
    // Файловое хранилище (fallback)
    const allDiagnosis = loadDiagnosis();
    const filtered = allDiagnosis.filter(d => d.id !== id);
    if (filtered.length < allDiagnosis.length) {
      saveDiagnosis(filtered);
      return true;
    }
    return false;
  }
};
