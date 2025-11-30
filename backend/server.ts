import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import diagnosisRoutes from './routes/diagnosis';
import adminRoutes from './routes/admin';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Инициализация PostgreSQL и создание таблиц
const initDatabase = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL не установлен, используется файловое хранилище');
    return;
  }

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Проверка подключения
    await pool.query('SELECT NOW()');
    console.log('✅ Подключение к PostgreSQL установлено');

    // Создание таблиц
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const usersMigration = fs.readFileSync(
        path.join(migrationsDir, '001_create_users_table.sql'),
        'utf-8'
      );
      const diagnosisMigration = fs.readFileSync(
        path.join(migrationsDir, '002_create_diagnosis_table.sql'),
        'utf-8'
      );

      await pool.query(usersMigration);
      await pool.query(diagnosisMigration);
      console.log('✅ Таблицы созданы');
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
    console.warn('⚠️  Продолжаем с файловым хранилищем');
  }
};

// Инициализация базы данных при старте
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

