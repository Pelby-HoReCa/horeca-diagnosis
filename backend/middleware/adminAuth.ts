import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'Sergo1289';

export interface AdminRequest extends Request {
  admin?: {
    userId: string;
    email: string;
  };
}

export const authenticateAdmin = async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Токен авторизации не предоставлен'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Проверяем, что токен содержит роль админа и правильный email
    if (decoded.role !== 'admin' || decoded.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'Доступ запрещен. Требуются права администратора'
      });
    }

    req.admin = {
      userId: decoded.userId || 'admin',
      email: decoded.email
    };

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Недействительный токен'
    });
  }
};

