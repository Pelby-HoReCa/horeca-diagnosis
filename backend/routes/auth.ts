import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, saveUser, UserData } from '../models/User';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      position,
      phone,
      socialLink,
      projectName,
      outletsCount,
      workFormat,
      city,
      address,
      projectLink,
    } = req.body;

    // Валидация
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email и пароль обязательны'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Пароль должен содержать минимум 6 символов'
      });
    }

    // Проверка существующего пользователя
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь с таким email уже зарегистрирован'
      });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const newUser = await saveUser({
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
      position,
      phone,
      socialLink,
      projectName,
      outletsCount,
      workFormat,
      city,
      address,
      projectLink,
      registeredAt: new Date().toISOString(),
    });

    // Создание JWT токена
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Возврат данных (без пароля)
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка регистрации. Попробуйте снова.'
    });
  }
});

// Авторизация
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Валидация
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email и пароль обязательны'
      });
    }

    // Поиск пользователя
    const user = await findUserByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь с таким email не найден'
      });
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Неверный пароль'
      });
    }

    // Создание JWT токена
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Возврат данных (без пароля)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка авторизации. Попробуйте снова.'
    });
  }
});

// Проверка токена
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Токен не предоставлен'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await findUserByEmail(decoded.email);

    if (!user) {
      return res.status(401).json({
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
    res.status(401).json({
      success: false,
      error: 'Недействительный токен'
    });
  }
});

export default router;

