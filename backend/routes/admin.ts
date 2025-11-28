import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail } from '../models/User';
import { authenticateAdmin } from '../middleware/adminAuth';
import { getAllUsers } from '../models/User';
import { getAllDiagnosis } from '../models/Diagnosis';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'Sergo1289';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1289'; // В продакшене использовать хеш

// Авторизация админа
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email и пароль обязательны'
      });
    }

    // Проверяем, что это админ
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'Доступ запрещен'
      });
    }

    // Проверяем пароль
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Неверный email или пароль'
      });
    }

    // Создаем токен
    const token = jwt.sign(
      {
        userId: 'admin',
        email: email,
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        email: email,
        role: 'admin'
      }
    });
  } catch (error: any) {
    console.error('Ошибка авторизации админа:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка авторизации'
    });
  }
});

// Проверка токена админа
router.get('/verify', authenticateAdmin, async (req: any, res) => {
  res.json({
    success: true,
    admin: req.admin
  });
});

// Получение всех пользователей
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    
    // Убираем пароли из ответа
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    res.json({
      success: true,
      users: usersWithoutPasswords,
      total: usersWithoutPasswords.length
    });
  } catch (error: any) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения пользователей'
    });
  }
});

// Получение всех диагностик
router.get('/diagnosis', authenticateAdmin, async (req, res) => {
  try {
    const diagnosis = await getAllDiagnosis();

    res.json({
      success: true,
      diagnosis,
      total: diagnosis.length
    });
  } catch (error: any) {
    console.error('Ошибка получения диагностик:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения диагностик'
    });
  }
});

// Получение диагностик конкретного пользователя
router.get('/diagnosis/user/:userId', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { getDiagnosisHistory } = await import('../models/Diagnosis');
    const diagnosis = await getDiagnosisHistory(userId);

    res.json({
      success: true,
      diagnosis,
      total: diagnosis.length
    });
  } catch (error: any) {
    console.error('Ошибка получения диагностик пользователя:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения диагностик пользователя'
    });
  }
});

// Получение статистики
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    const diagnosis = await getAllDiagnosis();

    const totalUsers = users.length;
    const totalDiagnosis = diagnosis.length;
    
    // Средняя эффективность
    const avgEfficiency = diagnosis.length > 0
      ? diagnosis.reduce((sum, d) => sum + (d.efficiency || 0), 0) / diagnosis.length
      : 0;

    // Статистика по блокам
    const blockStats: Record<string, { count: number; avgEfficiency: number }> = {};
    diagnosis.forEach(d => {
      if (d.blocks && Array.isArray(d.blocks)) {
        d.blocks.forEach((block: any) => {
          if (block.completed && block.efficiency !== undefined) {
            if (!blockStats[block.id]) {
              blockStats[block.id] = { count: 0, avgEfficiency: 0, totalEfficiency: 0 };
            }
            blockStats[block.id].count++;
            blockStats[block.id].totalEfficiency = (blockStats[block.id].totalEfficiency || 0) + block.efficiency;
          }
        });
      }
    });

    // Вычисляем среднюю эффективность для каждого блока
    Object.keys(blockStats).forEach(blockId => {
      const stat = blockStats[blockId] as any;
      stat.avgEfficiency = stat.count > 0 ? stat.totalEfficiency / stat.count : 0;
      delete stat.totalEfficiency;
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalDiagnosis,
        avgEfficiency: Math.round(avgEfficiency * 100) / 100,
        blockStats
      }
    });
  } catch (error: any) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения статистики'
    });
  }
});

export default router;

