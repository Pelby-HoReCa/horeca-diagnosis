import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { findUserById, updateUser, deleteUser } from '../models/User';

const router = express.Router();

// Получение данных текущего пользователя
router.get('/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('Ошибка получения данных пользователя:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения данных пользователя'
    });
  }
});

// Обновление данных пользователя
router.put('/me', authenticateToken, async (req: any, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Не позволяем обновлять пароль через этот endpoint
    delete updates.id;
    delete updates.registeredAt;

    const updatedUser = await updateUser(req.user.userId, updates);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('Ошибка обновления данных пользователя:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка обновления данных пользователя'
    });
  }
});

// Удаление аккаунта
router.delete('/me', authenticateToken, async (req: any, res) => {
  try {
    const deleted = await deleteUser(req.user.userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    res.json({
      success: true,
      message: 'Аккаунт успешно удален'
    });
  } catch (error: any) {
    console.error('Ошибка удаления аккаунта:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка удаления аккаунта'
    });
  }
});

export default router;

