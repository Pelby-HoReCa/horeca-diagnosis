import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { saveDiagnosisHistory, getDiagnosisHistory, DiagnosisHistory } from '../models/Diagnosis';

const router = express.Router();

// Сохранение истории диагностики
router.post('/history', authenticateToken, async (req: any, res) => {
  try {
    const { blocks, tasks, efficiency } = req.body;

    if (!blocks || !tasks || efficiency === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Необходимы данные: blocks, tasks, efficiency'
      });
    }

    const diagnosisData: Omit<DiagnosisHistory, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: req.user.userId,
      blocks,
      tasks,
      efficiency,
    };

    const savedDiagnosis = await saveDiagnosisHistory(diagnosisData);

    res.status(201).json({
      success: true,
      diagnosis: savedDiagnosis
    });
  } catch (error: any) {
    console.error('Ошибка сохранения истории диагностики:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сохранения истории диагностики'
    });
  }
});

// Получение истории диагностики пользователя
router.get('/history', authenticateToken, async (req: any, res) => {
  try {
    const history = await getDiagnosisHistory(req.user.userId);

    res.json({
      success: true,
      history
    });
  } catch (error: any) {
    console.error('Ошибка получения истории диагностики:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения истории диагностики'
    });
  }
});

// Получение конкретной диагностики по ID
router.get('/history/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const history = await getDiagnosisHistory(req.user.userId);
    const diagnosis = history.find((d: DiagnosisHistory) => d.id === id);

    if (!diagnosis) {
      return res.status(404).json({
        success: false,
        error: 'Диагностика не найдена'
      });
    }

    res.json({
      success: true,
      diagnosis
    });
  } catch (error: any) {
    console.error('Ошибка получения диагностики:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения диагностики'
    });
  }
});

export default router;

