import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import { DEFAULT_BLOCKS, DiagnosisBlock } from '../data/diagnosisBlocks';
import questionsData from '../data/questions.json';
import { generateTasksFromAnswers, Task } from '../utils/recommendationEngine';
import {
  getCurrentUserId,
  getSelectedVenueId,
  getVenueScopedKey,
  loadUserBlocks,
  loadUserTasks,
  saveUserBlocks,
  saveUserTasks,
} from '../utils/userDataStorage';
import { palette, radii, spacing, typography } from '../styles/theme';

interface Question {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    value: string;
    correct?: boolean;
    recommendation?: {
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      category: string;
    };
  }>;
}

interface BlockQuestionsScreenProps {
  route: any;
  navigation: any;
}

// Загружаем вопросы из JSON файла
const questions: Record<string, Question[]> = {};
questionsData.forEach((block: any) => {
  questions[block.id] = block.questions;
});

export default function BlockQuestionsScreen({ 
  route, 
  navigation 
}: BlockQuestionsScreenProps) {
  const { blockId, blockTitle } = route.params;
  const routeVenueId = route?.params?.venueId ?? null;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const blockQuestions = questions[blockId] || [];
  const currentQuestion = blockQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === blockQuestions.length - 1;
  const allQuestionsAnswered = Object.keys(answers).length === blockQuestions.length;

  // Сбрасываем состояние при изменении blockId
  React.useEffect(() => {
    console.log('Блок изменился, сбрасываем состояние. Новый blockId:', blockId);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowCompletionModal(false);
  }, [blockId]);

  const handleAnswerSelect = async (questionId: string, answerValue: string) => {
    const newAnswers = {
      ...answers,
      [questionId]: answerValue
    };
    setAnswers(newAnswers);
    
    // Проверяем, является ли это последним вопросом
    const currentQuestionIndex = blockQuestions.findIndex(q => q.id === questionId);
    const isLastQuestion = currentQuestionIndex === blockQuestions.length - 1;
    
    if (isLastQuestion) {
      // Если это последний вопрос, генерируем задачи и отмечаем блок как завершенный
      console.log('=== ПОСЛЕДНИЙ ВОПРОС ОТВЕЧЕН ===');
      console.log('Блок ID:', blockId);
      console.log('Все ответы блока:', newAnswers);
      
      // Генерируем задачи на основе всех ответов блока
      // Передаем также вопросы для определения правильности ответов
      const generatedTasks = generateTasksFromAnswers(blockId, newAnswers, blockQuestions, blockTitle);
      console.log('Сгенерированные задачи для блока:', generatedTasks);
      
      // Сохраняем задачи
      await saveTasksToStorage(generatedTasks);
      console.log('Задачи сохранены в хранилище:', generatedTasks.length);
      
      // ПРИНУДИТЕЛЬНАЯ ПРОВЕРКА СОХРАНЕНИЯ
      console.log('=== ПРИНУДИТЕЛЬНАЯ ПРОВЕРКА СОХРАНЕНИЯ ===');
      
      const userId = await getCurrentUserId();
      const venueId = await resolveVenueId(userId);
      const verifyBlocksKey = getVenueScopedKey('diagnosisBlocks', userId, venueId);
      const verifyTasksKey = getVenueScopedKey('actionPlanTasks', userId, venueId);

      // Проверяем блоки
      const verifyBlocks = await AsyncStorage.getItem(verifyBlocksKey);
      const verifyBlocksParsed = JSON.parse(verifyBlocks || '[]');
      console.log('Блоки в хранилище:', verifyBlocksParsed.map((b: any) => ({ id: b.id, completed: b.completed })));
      
      // Проверяем задачи
      const verifyTasks = await AsyncStorage.getItem(verifyTasksKey);
      const verifyTasksParsed = JSON.parse(verifyTasks || '[]');
      console.log('Задачи в хранилище:', verifyTasksParsed.length, 'задач');
      console.log('Задачи:', verifyTasksParsed.map((t: any) => ({ id: t.id, title: t.title, blockId: t.blockId })));
      
      console.log('=== КОНЕЦ ПРИНУДИТЕЛЬНОЙ ПРОВЕРКИ ===');
      
      // Отмечаем блок как завершенный с ответами
      await markBlockAsCompleted(blockId, newAnswers);
      console.log('Блок отмечен как завершенный');
      
      console.log('=== КОНЕЦ ОБРАБОТКИ ПОСЛЕДНЕГО ВОПРОСА ===');
    }
  };

  const saveTasksToStorage = async (tasks: Task[]) => {
    try {
      console.log('=== СОХРАНЕНИЕ ЗАДАЧ ===');
      console.log('Получено задач для сохранения:', tasks.length);
      console.log('Задачи:', tasks.map(t => ({ id: t.id, title: t.title, blockId: t.blockId })));
      
      const userId = await getCurrentUserId();
      const venueId = await resolveVenueId(userId);
      const tasksKey = getVenueScopedKey('actionPlanTasks', userId, venueId);

      const existingTasks = await AsyncStorage.getItem(tasksKey);
      const existingTasksArray = existingTasks ? JSON.parse(existingTasks) : [];
      console.log('Существующие задачи в хранилище:', existingTasksArray.length);
      
      const newTasks = [...existingTasksArray, ...tasks];
      console.log('Общее количество задач после добавления:', newTasks.length);
      
      await AsyncStorage.setItem(tasksKey, JSON.stringify(newTasks));
      console.log('Задачи успешно сохранены в AsyncStorage');
      
      // Проверяем сохранение
      const verifyTasks = await AsyncStorage.getItem(tasksKey);
      const verifyParsed = JSON.parse(verifyTasks || '[]');
      console.log('Проверка сохранения - задач в хранилище:', verifyParsed.length);
      console.log('=== КОНЕЦ СОХРАНЕНИЯ ===');

      // Сохраняем задачи также в персональном хранилище пользователя
      if (userId) {
        try {
          const userTasks = await loadUserTasks(userId);
          const updatedUserTasks = [...userTasks, ...tasks];
          await saveUserTasks(userId, updatedUserTasks as Task[]);
          console.log(`Задачи сохранены для пользователя ${userId}:`, updatedUserTasks.length);
        } catch (userError) {
          console.error('Ошибка сохранения задач пользователя:', userError);
        }
      }
    } catch (error) {
      console.error('Ошибка сохранения задач:', error);
    }
  };

  const handleNextQuestion = async () => {
    if (isLastQuestion) {
      // Блок уже отмечен как завершенный в handleAnswerSelect
      // Просто показываем модальное окно с выбором
      console.log('Показываем модальное окно завершения блока');
      setShowCompletionModal(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const getOptionScore = (option: any): number => {
    if (!option) return 0;
    if (option.correct === true) return 1;
    const priority = option.recommendation?.priority;
    if (priority === 'low') return 1;
    if (priority === 'medium') return 0.5;
    if (priority === 'high') return 0;
    return 0;
  };

  const calculateBlockEfficiency = (blockId: string, answers: Record<string, string>): number => {
    const blockQuestions = questions[blockId] || [];
    if (blockQuestions.length === 0) return 0;
    
    // Считаем эффективность по весам: зелёный=1, жёлтый=0.5, красный=0
    let scoreSum = 0;
    blockQuestions.forEach((question) => {
      const answerValue = answers[question.id];
      if (answerValue) {
        // Находим выбранный вариант ответа
        const selectedOption = question.options.find(opt => opt.value === answerValue);
        if (selectedOption) {
          scoreSum += getOptionScore(selectedOption);
        }
      }
    });
    
    // Эффективность = (сумма баллов / общее количество) * 100
    const efficiency = Math.round((scoreSum / blockQuestions.length) * 100);
    
    return efficiency;
  };

  const resolveVenueId = async (userId: string | null) => {
    if (routeVenueId) return routeVenueId;
    return await getSelectedVenueId(userId);
  };

  const markBlockAsCompleted = async (blockId: string, blockAnswers: Record<string, string>) => {
    try {
      console.log('Отмечаем блок как завершенный:', blockId);
      
      // Вычисляем эффективность блока
      const efficiency = calculateBlockEfficiency(blockId, blockAnswers);
      console.log('Эффективность блока:', efficiency + '%');
      
      const userId = await getCurrentUserId();
      const venueId = await resolveVenueId(userId);
      const blocksKey = getVenueScopedKey('diagnosisBlocks', userId, venueId);

      let storedBlocks = await AsyncStorage.getItem(blocksKey);
      let blocks: any[] = [];
      
      if (storedBlocks) {
        blocks = JSON.parse(storedBlocks);
        console.log('Текущие блоки до обновления:', blocks.length);
        console.log('Статус блоков:', blocks.map((b: any) => ({ id: b.id, completed: b.completed, efficiency: b.efficiency })));
      } else {
        console.log('Блоки не найдены в хранилище, инициализируем все блоки...');
        blocks = [];
      }

      // Нормализуем блоки под актуальные DEFAULT_BLOCKS
      const normalizedBlocks = DEFAULT_BLOCKS.map((defaultBlock) => {
        const found = blocks.find((b: any) => b.id === defaultBlock.id);
        if (found) {
          return {
            ...defaultBlock,
            ...found,
            title: defaultBlock.title,
            description: defaultBlock.description,
          };
        }
        return {
          ...defaultBlock,
          completed: false,
          efficiency: undefined,
        } as any;
      });
      
      // Обновляем конкретный блок, сохраняя все остальные
      const updatedBlocks = normalizedBlocks.map((block: any) => {
        if (block.id === blockId) {
          console.log('Обновляем блок:', blockId);
          return { 
            ...block, 
            completed: true,
            completedAt: new Date().toLocaleDateString('ru-RU'),
            efficiency: efficiency,
            answers: blockAnswers
          };
        }
        return block; // Сохраняем остальные блоки как есть, включая уже завершенные
      });
      
      console.log('Обновленные блоки после изменения:', updatedBlocks.length);
      console.log('Статус всех блоков:', updatedBlocks.map((b: any) => ({ id: b.id, completed: b.completed, efficiency: b.efficiency })));
      
      // Сохраняем все блоки
      await AsyncStorage.setItem(blocksKey, JSON.stringify(updatedBlocks));
      console.log('Блок успешно отмечен как завершенный и сохранен:', blockId);

      // Синхронизируем данные блока с персональным хранилищем пользователя
      if (userId) {
        try {
          await saveUserBlocks(userId, updatedBlocks as any, venueId);
          console.log(`Блоки сохранены для пользователя ${userId}`);
        } catch (userError) {
          console.error('Ошибка сохранения блоков пользователя:', userError);
        }
      }
      
      // Проверяем, что данные действительно сохранились
      const verifyBlocks = await AsyncStorage.getItem(blocksKey);
      const verifyParsed = JSON.parse(verifyBlocks || '[]');
      console.log('Проверка сохранения - блоков в хранилище:', verifyParsed.length);
      console.log('Все блоки:', verifyParsed.map((b: any) => ({ id: b.id, completed: b.completed, efficiency: b.efficiency })));
      
      // Дополнительная проверка: убеждаемся, что задачи тоже есть
      const verifyTasksKey = getVenueScopedKey('actionPlanTasks', userId, venueId);
      const verifyTasks = await AsyncStorage.getItem(verifyTasksKey);
      const verifyTasksParsed = JSON.parse(verifyTasks || '[]');
      console.log('Проверка задач при завершении блока:', verifyTasksParsed.length, 'задач в хранилище');
    } catch (error) {
      console.error('Ошибка обновления статуса блока:', error);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const findNextUncompletedBlock = async (currentBlockId: string): Promise<DiagnosisBlock | null> => {
    try {
      console.log('=== ПОИСК СЛЕДУЮЩЕГО НЕПРОЙДЕННОГО БЛОКА ===');
      console.log('Текущий blockId:', currentBlockId);
      
      // Загружаем блоки из хранилища
      const userId = await getCurrentUserId();
      let storedBlocks: DiagnosisBlock[] = [];
      
      if (userId) {
        storedBlocks = await loadUserBlocks(userId) || [];
        console.log('Загружены блоки пользователя:', storedBlocks.length);
      } else {
        const venueId = await resolveVenueId(userId);
        const blocksKey = getVenueScopedKey('diagnosisBlocks', userId, venueId);
        const blocksJson = await AsyncStorage.getItem(blocksKey);
        if (blocksJson) {
          storedBlocks = JSON.parse(blocksJson);
          console.log('Загружены глобальные блоки:', storedBlocks.length);
        }
      }

      // Объединяем DEFAULT_BLOCKS с сохраненными данными
      const allBlocks = DEFAULT_BLOCKS.map(defaultBlock => {
        const foundBlock = storedBlocks.find(b => b.id === defaultBlock.id);
        if (foundBlock) {
          return {
            ...defaultBlock,
            ...foundBlock,
            title: defaultBlock.title,
            description: defaultBlock.description,
          };
        }
        return defaultBlock;
      });

      console.log('Всего блоков:', allBlocks.length);
      console.log('Статус блоков:', allBlocks.map(b => ({ id: b.id, title: b.title, completed: b.completed })));

      // Находим индекс текущего блока
      const currentIndex = allBlocks.findIndex(b => b.id === currentBlockId);
      console.log('Индекс текущего блока:', currentIndex);
      
      if (currentIndex === -1) {
        // Если текущий блок не найден, возвращаем первый непройденный
        console.log('Текущий блок не найден, ищем первый непройденный');
        const firstUncompleted = allBlocks.find(b => !b.completed);
        if (firstUncompleted) {
          console.log('Найден первый непройденный блок:', firstUncompleted.id, firstUncompleted.title);
        }
        return firstUncompleted || null;
      }

      // Ищем следующий непройденный блок после текущего
      console.log('Ищем следующий непройденный блок после индекса', currentIndex);
      for (let i = currentIndex + 1; i < allBlocks.length; i++) {
        if (!allBlocks[i].completed) {
          console.log('Найден следующий непройденный блок:', allBlocks[i].id, allBlocks[i].title);
          return allBlocks[i];
        }
      }

      // Если после текущего блока все пройдены, ищем с начала
      console.log('После текущего блока все пройдены, ищем с начала');
      for (let i = 0; i < currentIndex; i++) {
        if (!allBlocks[i].completed) {
          console.log('Найден непройденный блок с начала:', allBlocks[i].id, allBlocks[i].title);
          return allBlocks[i];
        }
      }

      // Все блоки пройдены
      console.log('Все блоки пройдены');
      return null;
    } catch (error) {
      console.error('Ошибка поиска следующего блока:', error);
      return null;
    }
  };

  return (
    <View style={styles.container}>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    backgroundColor: palette.background,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray200,
  },
  blockTitle: {
    ...typography.heading2,
    color: palette.primaryBlue,
    marginBottom: spacing.xs,
  },
  progress: {
    fontSize: 14,
    color: palette.primaryOrange,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primaryBlue,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  optionButton: {
    backgroundColor: palette.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.gray200,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedOption: {
    borderColor: palette.primaryOrange,
    backgroundColor: '#FFF4E6',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.primaryBlue,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
    borderColor: palette.primaryOrange,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.primaryOrange,
  },
  optionText: {
    fontSize: 14,
    color: palette.primaryBlue,
    flex: 1,
  },
  selectedOptionText: {
    color: palette.primaryOrange,
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.gray200,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    minWidth: 110,
  },
  backButton: {
    backgroundColor: palette.white,
    borderWidth: 2,
    borderColor: palette.primaryBlue,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.primaryBlue,
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: palette.primaryOrange,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: palette.gray400,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.white,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: palette.error,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: palette.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: typography.heading3.fontSize,
    fontWeight: 'bold',
    color: palette.primaryBlue,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: typography.body.fontSize,
    color: palette.gray600,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  continueButton: {
    backgroundColor: palette.primaryBlue,
  },
  resultsButton: {
    backgroundColor: palette.primaryOrange,
  },
  continueButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: palette.white,
    textAlign: 'center',
  },
  resultsButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: palette.white,
    textAlign: 'center',
  },
});
