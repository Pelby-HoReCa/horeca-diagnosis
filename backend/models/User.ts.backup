// Пример реализации модели User для PostgreSQL
// Замените файловое хранилище на эту реализацию при переходе на PostgreSQL

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface UserData {
  id: string;
  email: string;
  password: string;
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
  registeredAt: string;
}

export const findUserByEmail = async (email: string): Promise<UserData | null> => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    fullName: row.full_name,
    position: row.position,
    phone: row.phone,
    socialLink: row.social_link,
    projectName: row.project_name,
    outletsCount: row.outlets_count,
    workFormat: row.work_format,
    city: row.city,
    address: row.address,
    projectLink: row.project_link,
    registeredAt: row.registered_at.toISOString(),
  };
};

export const findUserById = async (id: string): Promise<UserData | null> => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    fullName: row.full_name,
    position: row.position,
    phone: row.phone,
    socialLink: row.social_link,
    projectName: row.project_name,
    outletsCount: row.outlets_count,
    workFormat: row.work_format,
    city: row.city,
    address: row.address,
    projectLink: row.project_link,
    registeredAt: row.registered_at.toISOString(),
  };
};

export const saveUser = async (userData: Omit<UserData, 'id' | 'registeredAt'>): Promise<UserData> => {
  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const result = await pool.query(
    `INSERT INTO users (
      id, email, password, full_name, position, phone, social_link,
      project_name, outlets_count, work_format, city, address, project_link
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      id,
      userData.email.toLowerCase(),
      userData.password,
      userData.fullName || null,
      userData.position || null,
      userData.phone || null,
      userData.socialLink || null,
      userData.projectName || null,
      userData.outletsCount || null,
      userData.workFormat || null,
      userData.city || null,
      userData.address || null,
      userData.projectLink || null,
    ]
  );
  
  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    fullName: row.full_name,
    position: row.position,
    phone: row.phone,
    socialLink: row.social_link,
    projectName: row.project_name,
    outletsCount: row.outlets_count,
    workFormat: row.work_format,
    city: row.city,
    address: row.address,
    projectLink: row.project_link,
    registeredAt: row.registered_at.toISOString(),
  };
};

export const updateUser = async (
  id: string,
  updates: Partial<Omit<UserData, 'id' | 'registeredAt'>>
): Promise<UserData | null> => {
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.email !== undefined) {
    updateFields.push(`email = $${paramIndex++}`);
    values.push(updates.email.toLowerCase());
  }
  if (updates.password !== undefined) {
    updateFields.push(`password = $${paramIndex++}`);
    values.push(updates.password);
  }
  if (updates.fullName !== undefined) {
    updateFields.push(`full_name = $${paramIndex++}`);
    values.push(updates.fullName);
  }
  if (updates.position !== undefined) {
    updateFields.push(`position = $${paramIndex++}`);
    values.push(updates.position);
  }
  if (updates.phone !== undefined) {
    updateFields.push(`phone = $${paramIndex++}`);
    values.push(updates.phone);
  }
  if (updates.socialLink !== undefined) {
    updateFields.push(`social_link = $${paramIndex++}`);
    values.push(updates.socialLink);
  }
  if (updates.projectName !== undefined) {
    updateFields.push(`project_name = $${paramIndex++}`);
    values.push(updates.projectName);
  }
  if (updates.outletsCount !== undefined) {
    updateFields.push(`outlets_count = $${paramIndex++}`);
    values.push(updates.outletsCount);
  }
  if (updates.workFormat !== undefined) {
    updateFields.push(`work_format = $${paramIndex++}`);
    values.push(updates.workFormat);
  }
  if (updates.city !== undefined) {
    updateFields.push(`city = $${paramIndex++}`);
    values.push(updates.city);
  }
  if (updates.address !== undefined) {
    updateFields.push(`address = $${paramIndex++}`);
    values.push(updates.address);
  }
  if (updates.projectLink !== undefined) {
    updateFields.push(`project_link = $${paramIndex++}`);
    values.push(updates.projectLink);
  }

  if (updateFields.length === 0) {
    return await findUserById(id);
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await pool.query(
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    fullName: row.full_name,
    position: row.position,
    phone: row.phone,
    socialLink: row.social_link,
    projectName: row.project_name,
    outletsCount: row.outlets_count,
    workFormat: row.work_format,
    city: row.city,
    address: row.address,
    projectLink: row.project_link,
    registeredAt: row.registered_at.toISOString(),
  };
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return result.rowCount !== null && result.rowCount > 0;
};

