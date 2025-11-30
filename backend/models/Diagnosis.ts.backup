// Пример реализации модели Diagnosis для PostgreSQL
// Замените файловое хранилище на эту реализацию при переходе на PostgreSQL

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface DiagnosisHistory {
  id: string;
  userId: string;
  blocks: any[];
  tasks: any[];
  efficiency: number;
  createdAt: string;
  updatedAt?: string;
}

export const saveDiagnosisHistory = async (
  data: Omit<DiagnosisHistory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DiagnosisHistory> => {
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
    blocks: row.blocks,
    tasks: row.tasks,
    efficiency: parseFloat(row.efficiency),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
  };
};

export const getDiagnosisHistory = async (userId: string): Promise<DiagnosisHistory[]> => {
  const result = await pool.query(
    'SELECT * FROM diagnosis_history WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    blocks: row.blocks,
    tasks: row.tasks,
    efficiency: parseFloat(row.efficiency),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
  }));
};

