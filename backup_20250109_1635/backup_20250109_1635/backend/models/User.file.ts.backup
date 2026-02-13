// Временная реализация с использованием файла/памяти
// В продакшене замените на реальную БД (PostgreSQL, MongoDB и т.д.)

import fs from 'fs';
import path from 'path';

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

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Инициализация директории данных
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Загрузка пользователей из файла
const loadUsers = (): UserData[] => {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error);
  }
  return [];
};

// Сохранение пользователей в файл
const saveUsers = (users: UserData[]): void => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Ошибка сохранения пользователей:', error);
    throw error;
  }
};

export const findUserByEmail = async (email: string): Promise<UserData | null> => {
  const users = loadUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
};

export const findUserById = async (id: string): Promise<UserData | null> => {
  const users = loadUsers();
  return users.find(user => user.id === id) || null;
};

export const saveUser = async (userData: Omit<UserData, 'id'>): Promise<UserData> => {
  const users = loadUsers();
  const newUser: UserData = {
    ...userData,
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
};

export const updateUser = async (id: string, updates: Partial<Omit<UserData, 'id' | 'registeredAt'>>): Promise<UserData | null> => {
  const users = loadUsers();
  const userIndex = users.findIndex(user => user.id === id);
  
  if (userIndex === -1) {
    return null;
  }
  
  users[userIndex] = {
    ...users[userIndex],
    ...updates,
  };
  
  saveUsers(users);
  return users[userIndex];
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const users = loadUsers();
  const filteredUsers = users.filter(user => user.id !== id);
  
  if (filteredUsers.length === users.length) {
    return false;
  }
  
  saveUsers(filteredUsers);
  return true;
};

// Получение всех пользователей (для админки)
export const getAllUsers = async (): Promise<UserData[]> => {
  return loadUsers();
};

// ПРИМЕЧАНИЕ: Для продакшена замените эту реализацию на реальную БД
// Пример для PostgreSQL с использованием pg:
/*
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const findUserByEmail = async (email: string): Promise<UserData | null> => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return result.rows[0] || null;
};

export const saveUser = async (userData: Omit<UserData, 'id'>): Promise<UserData> => {
  const result = await pool.query(
    `INSERT INTO users (email, password, full_name, ...) 
     VALUES ($1, $2, $3, ...) 
     RETURNING *`,
    [userData.email, userData.password, userData.fullName, ...]
  );
  return result.rows[0];
};
*/

