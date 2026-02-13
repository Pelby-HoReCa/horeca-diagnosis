import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { SvgXml } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedPressable from '../components/AnimatedPressable';
import { palette, spacing } from '../styles/theme';
import { DEFAULT_BLOCKS } from '../data/diagnosisBlocks';
import questionsData from '../data/questions.json';
import { getCurrentUserId, getSelectedVenueId, getVenueScopedKey } from '../utils/userDataStorage';

interface DiagnosisQuestionsScreenProps {
  selectedBlocks?: string[];
  currentBlockId?: string; // ID текущего блока для вопросов (переименован в initialBlockId внутри)
  onBack?: () => void;
  onSkip?: () => void;
  onBlockComplete?: (blockId: string) => void;
}

// Загружаем вопросы из JSON файла
const questions: Record<string, any[]> = {};
questionsData.forEach((block: any) => {
  questions[block.id] = block.questions;
});

export default function DiagnosisQuestionsScreen({ 
  selectedBlocks, 
  currentBlockId: initialBlockId,
  onBack,
  onSkip,
  onBlockComplete
}: DiagnosisQuestionsScreenProps) {
  const [persistedSelectedBlocks, setPersistedSelectedBlocks] = useState<string[] | null>(null);

  // Если блоки не переданы, пробуем восстановить из сохраненных
  const blocksToProcess = selectedBlocks && selectedBlocks.length > 0
    ? selectedBlocks
    : persistedSelectedBlocks && persistedSelectedBlocks.length > 0
      ? persistedSelectedBlocks
      : DEFAULT_BLOCKS.map(block => block.id);

  // Определяем начальный индекс блока
  const initialBlockIndex = initialBlockId 
    ? blocksToProcess.findIndex(id => id === initialBlockId)
    : 0;
  const [currentBlockIndex, setCurrentBlockIndex] = useState(initialBlockIndex >= 0 ? initialBlockIndex : 0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [progressBarSvg, setProgressBarSvg] = useState<string>('');
  const [radioActiveSvg, setRadioActiveSvg] = useState<string>('');
  const [radioInactiveSvg, setRadioInactiveSvg] = useState<string>('');
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [backArrowSvg, setBackArrowSvg] = useState<string>('');
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
  const [answersLoadedForBlock, setAnswersLoadedForBlock] = useState<string | null>(null);
  const autoPositionedBlockRef = useRef<string | null>(null);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);

  const currentBlockId = blocksToProcess[currentBlockIndex];
  
  // Находим информацию о текущем блоке
  const currentBlock = DEFAULT_BLOCKS.find(block => block.id === currentBlockId);
  
  // Получаем вопросы для текущего блока
  const currentBlockQuestions = questions[currentBlockId] || [];
  const totalQuestions = currentBlockQuestions.length;
  
  // Вычисляем прогресс (количество отвеченных вопросов в текущем блоке)
  const answeredCountInBlock = currentBlockQuestions.filter(q => {
    const questionKey = `${currentBlockId}_${q.id}`;
    return savedAnswers[questionKey];
  }).length;
  const progress = totalQuestions > 0 ? answeredCountInBlock / totalQuestions : 0;

  // Загружаем SVG прогресс бара и переключатели
  useEffect(() => {
    const loadProgressBar = async () => {
      try {
        const progressBarAsset = Asset.fromModule(require('../../assets/images/progress-bar-diagnosis.svg'));
        await progressBarAsset.downloadAsync();
        if (progressBarAsset.localUri) {
          const response = await fetch(progressBarAsset.localUri);
          const fileContent = await response.text();
          setProgressBarSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG прогресс бара:', error);
      }
    };

    const loadRadioIcons = async () => {
      try {
        const inactiveAsset = Asset.fromModule(require('../../assets/images/radio-inactive-icon.svg'));
        await inactiveAsset.downloadAsync();
        if (inactiveAsset.localUri) {
          const response = await fetch(inactiveAsset.localUri);
          const fileContent = await response.text();
          setRadioInactiveSvg(fileContent);
        }

        const activeAsset = Asset.fromModule(require('../../assets/images/radio-active-icon.svg'));
        await activeAsset.downloadAsync();
        if (activeAsset.localUri) {
          const response = await fetch(activeAsset.localUri);
          const fileContent = await response.text();
          setRadioActiveSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконок радио:', error);
      }
    };

    const loadBackArrow = async () => {
      try {
        const backArrowAsset = Asset.fromModule(require('../../assets/images/back-arrow-button.svg'));
        await backArrowAsset.downloadAsync();
        if (backArrowAsset.localUri) {
          const response = await fetch(backArrowAsset.localUri);
          const fileContent = await response.text();
          setBackArrowSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG стрелочки назад:', error);
      }
    };

    loadProgressBar();
    loadRadioIcons();
    loadBackArrow();
  }, []);

  // Загружаем сохраненные ответы при загрузке экрана
  useEffect(() => {
    setAnswersLoadedForBlock(null);
    const loadSavedAnswers = async () => {
      try {
        const userId = await getCurrentUserId();
        const venueId = await getSelectedVenueId(userId);
        if (!venueId) {
          setAnswersLoadedForBlock(currentBlockId || null);
          return;
        }
        const saved = await AsyncStorage.getItem(
          getVenueScopedKey(`diagnosis_answers_${currentBlockId}`, userId, venueId)
        );
        if (saved) {
          const parsed = JSON.parse(saved);
          setSavedAnswers(parsed);
          // Обновляем множество отвеченных вопросов
          const answered = new Set(Object.keys(parsed));
          setAnsweredQuestions(answered);
        }
        setAnswersLoadedForBlock(currentBlockId || null);
      } catch (error) {
        console.error('Ошибка загрузки сохраненных ответов:', error);
        setAnswersLoadedForBlock(currentBlockId || null);
      }
    };
    loadSavedAnswers();
  }, [currentBlockId]);

  useEffect(() => {
    if (!currentBlockId || currentBlockQuestions.length === 0) {
      return;
    }
    if (autoPositionedBlockRef.current === currentBlockId) {
      return;
    }
    if (answersLoadedForBlock !== currentBlockId) {
      return;
    }
    const firstUnansweredIndex = currentBlockQuestions.findIndex(
      (question) => !savedAnswers[`${currentBlockId}_${question.id}`]
    );
    if (firstUnansweredIndex >= 0) {
      setCurrentQuestionIndex(firstUnansweredIndex);
    }
    autoPositionedBlockRef.current = currentBlockId;
  }, [currentBlockId, currentBlockQuestions, savedAnswers, answersLoadedForBlock]);

  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const userId = await getCurrentUserId();
        const venueId = await getSelectedVenueId(userId);
        if (!venueId) {
          setHasRestoredProgress(true);
          return;
        }
        const selectedKey = getVenueScopedKey('diagnosis_selected_blocks', userId, venueId);
        const progressKey = getVenueScopedKey('diagnosis_progress', userId, venueId);

        const selectedRaw = await AsyncStorage.getItem(selectedKey);
        if (selectedRaw) {
          const parsedSelected = JSON.parse(selectedRaw);
          if (Array.isArray(parsedSelected) && parsedSelected.length > 0) {
            setPersistedSelectedBlocks(parsedSelected);
          }
        }

        if (initialBlockId) {
          setHasRestoredProgress(true);
          return;
        }

        const progressRaw = await AsyncStorage.getItem(progressKey);
        if (progressRaw) {
          const parsed = JSON.parse(progressRaw);
          const savedBlocks = Array.isArray(parsed.selectedBlocks) ? parsed.selectedBlocks : null;
          if (savedBlocks && savedBlocks.length > 0) {
            setPersistedSelectedBlocks(savedBlocks);
          }
          if (typeof parsed.blockIndex === 'number' && typeof parsed.questionIndex === 'number') {
            setCurrentBlockIndex(parsed.blockIndex);
            setCurrentQuestionIndex(parsed.questionIndex);
          }
        }
      } catch (error) {
        console.error('Ошибка восстановления состояния диагностики:', error);
      } finally {
        setHasRestoredProgress(true);
      }
    };

    loadPersistedState();
  }, [initialBlockId]);

  useEffect(() => {
    if (!hasRestoredProgress) {
      return;
    }
    const persistProgress = async () => {
      try {
        const userId = await getCurrentUserId();
        const venueId = await getSelectedVenueId(userId);
        if (!venueId) {
          return;
        }
        const progressKey = getVenueScopedKey('diagnosis_progress', userId, venueId);
        const payload = JSON.stringify({
          blockIndex: currentBlockIndex,
          questionIndex: currentQuestionIndex,
          blockId: currentBlockId,
          selectedBlocks: blocksToProcess,
        });
        await AsyncStorage.setItem(progressKey, payload);
      } catch (error) {
        console.error('Ошибка сохранения прогресса диагностики:', error);
      }
    };
    persistProgress();
  }, [currentBlockIndex, currentQuestionIndex, currentBlockId, blocksToProcess, hasRestoredProgress]);

  // Сбрасываем индекс вопроса при смене блока
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswerId(null);
  }, [currentBlockId]);

  // Загружаем сохраненный ответ для текущего вопроса
  useEffect(() => {
    if (currentQuestion) {
      const questionKey = `${currentBlockId}_${currentQuestion.id}`;
      const savedAnswer = savedAnswers[questionKey];
      if (savedAnswer) {
        setSelectedAnswerId(savedAnswer);
      } else {
        setSelectedAnswerId(null);
      }
    }
  }, [currentQuestionIndex, currentQuestion, savedAnswers, currentBlockId]);

  // Получаем текущий вопрос
  const currentQuestion = currentBlockQuestions[currentQuestionIndex];
  
  // Создаем варианты ответа (пока тестовые - несколько правильных и неправильных)
  const getAnswerOptions = () => {
    if (!currentQuestion) return [];
    
    // Если у вопроса есть варианты ответа из JSON, используем их
    if (currentQuestion.options && currentQuestion.options.length > 0) {
      return currentQuestion.options;
    }
    
    // Иначе создаем тестовые варианты
    return [
      { id: 'opt1', text: 'Правильный вариант ответа 1', correct: true },
      { id: 'opt2', text: 'Правильный вариант ответа 2', correct: true },
      { id: 'opt3', text: 'Неправильный вариант ответа 1', correct: false },
      { id: 'opt4', text: 'Неправильный вариант ответа 2', correct: false },
    ];
  };

  const answerOptions = getAnswerOptions();

  // Сохранение ответа
  const saveAnswer = async (questionId: string, answerId: string) => {
    try {
      const questionKey = `${currentBlockId}_${questionId}`;
      const updatedAnswers = {
        ...savedAnswers,
        [questionKey]: answerId,
      };
      setSavedAnswers(updatedAnswers);
      const userId = await getCurrentUserId();
      const venueId = await getSelectedVenueId(userId);
      if (!venueId) {
        return;
      }
      await AsyncStorage.setItem(
        getVenueScopedKey(`diagnosis_answers_${currentBlockId}`, userId, venueId),
        JSON.stringify(updatedAnswers)
      );
      
      // Обновляем множество отвеченных вопросов
      const answered = new Set(Object.keys(updatedAnswers));
      setAnsweredQuestions(answered);
    } catch (error) {
      console.error('Ошибка сохранения ответа:', error);
    }
  };

  // Переход к следующему вопросу
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Если это последний вопрос блока, переходим на экран результатов блока
      if (onBlockComplete) {
        onBlockComplete(currentBlockId);
      } else {
        // Если обработчик не передан, используем старую логику
        if (currentBlockIndex < blocksToProcess.length - 1) {
          setCurrentBlockIndex(prev => prev + 1);
          setCurrentQuestionIndex(0);
        } else {
          // Все блоки пройдены - переходим на главный экран
          if (onSkip) {
            onSkip();
          }
        }
      }
    }
  };

  // Переход к предыдущему вопросу
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      // Если это первый вопрос блока, переходим к предыдущему блоку
      if (currentBlockIndex > 0) {
        setCurrentBlockIndex(prev => prev - 1);
        const prevBlockQuestions = questions[blocksToProcess[currentBlockIndex - 1]] || [];
        setCurrentQuestionIndex(prevBlockQuestions.length - 1);
      } else {
        // Это первый вопрос первого блока - возвращаемся назад
        if (onBack) {
          onBack();
        }
      }
    }
  };

  // Обработка нажатия "Продолжить"
  const handleContinue = () => {
    if (!selectedAnswerId || !currentQuestion) return;
    
    // Сохраняем ответ (если еще не сохранен)
    if (!savedAnswers[`${currentBlockId}_${currentQuestion.id}`]) {
      saveAnswer(currentQuestion.id, selectedAnswerId);
    }
    
    // Проверяем, является ли это последним вопросом блока
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
    
    if (isLastQuestion && onBlockComplete) {
      // Если это последний вопрос, переходим на экран результатов блока
      onBlockComplete(currentBlockId);
    } else {
      // Переходим к следующему вопросу
      handleNextQuestion();
    }
  };

  // Обработка нажатия "Пропустить"
  const handleSkip = () => {
    // Проверяем, является ли это последним вопросом блока
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
    
    if (isLastQuestion && onBlockComplete) {
      // Если это последний вопрос, переходим на экран результатов блока
      onBlockComplete(currentBlockId);
    } else {
      // Переходим к следующему вопросу без сохранения ответа
      handleNextQuestion();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header: Back button and Skip button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Пропустить</Text>
        </TouchableOpacity>
      </View>

      {/* Block title and question progress */}
      {currentBlock && (
        <View style={styles.blockHeaderContainer}>
          <View style={styles.blockHeader}>
            <Text style={styles.blockTitle}>{currentBlock.title}</Text>
            <Text style={styles.questionProgress}>
              {currentQuestionIndex + 1}/{totalQuestions}
            </Text>
          </View>
          
          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${progress * 100}%` }
                ]} 
              />
            </View>
          </View>
          
          {/* Gray divider line */}
          <View style={styles.divider} />
        </View>
      )}

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question */}
        {currentBlockQuestions.length > 0 && currentBlockQuestions[currentQuestionIndex] && (
          <Text style={styles.questionText}>
            {currentBlockQuestions[currentQuestionIndex].question}
          </Text>
        )}

        {/* Answer options */}
        {answerOptions.length > 0 && (
          <View style={styles.optionsContainer}>
            {answerOptions.map((option) => {
              const isSelected = selectedAnswerId === option.id;
              return (
                <AnimatedPressable
                  key={option.id}
                  style={[styles.optionContainer, isSelected && styles.optionContainerSelected]}
                  onPress={() => {
                    setSelectedAnswerId(option.id);
                    // Сохраняем ответ сразу при выборе
                    if (currentQuestion) {
                      saveAnswer(currentQuestion.id, option.id);
                    }
                  }}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option.text}
                  </Text>
                  <TouchableOpacity
                    style={styles.radioButton}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedAnswerId(option.id);
                      // Сохраняем ответ сразу при выборе
                      if (currentQuestion) {
                        saveAnswer(currentQuestion.id, option.id);
                      }
                    }}
                  >
                    {isSelected && radioActiveSvg ? (
                      <SvgXml xml={radioActiveSvg} width={20} height={20} />
                    ) : radioInactiveSvg ? (
                      <SvgXml xml={radioInactiveSvg} width={20} height={20} />
                    ) : (
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    )}
                  </TouchableOpacity>
                </AnimatedPressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom navigation: Back arrow and Continue button */}
      <View style={styles.bottomNavigation}>
        {backArrowSvg ? (
          <TouchableOpacity 
            style={styles.backArrowButton}
            activeOpacity={0.7}
            onPress={handlePreviousQuestion}
          >
            <SvgXml xml={backArrowSvg} width={60} height={60} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backArrowButton} />
        )}
        
        <View style={styles.continueButtonWrapper}>
          <AnimatedPressable
            style={[
              styles.continueButton,
              !selectedAnswerId && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!selectedAnswerId}
          >
            <Text style={[
              styles.continueButtonText,
              !selectedAnswerId && styles.continueButtonTextDisabled
            ]}>Продолжить</Text>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: spacing.md,
    paddingBottom: 120, // Отступ снизу для кнопки и стрелочки
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl - 10,
    position: 'relative',
  },
  backButton: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
    zIndex: 3,
  },
  skipButton: {
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: 0,
    height: 'auto',
    marginLeft: 'auto', // Выравнивание справа
    zIndex: 2,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#191BDF',
    fontFamily: 'Manrope-Medium',
    letterSpacing: 0.5,
  },
  blockHeaderContainer: {
    marginBottom: 0,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(10, 13, 20, 0.8)',
    fontFamily: 'Manrope-SemiBold',
    flex: 1,
  },
  questionProgress: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(10, 13, 20, 0.8)',
    fontFamily: 'Manrope-SemiBold',
    marginLeft: spacing.sm,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#E2E4E9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#375DFB',
    borderRadius: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E4E9',
    marginTop: 28,
    width: '100%',
  },
  questionText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0A0D14',
    fontFamily: 'Manrope-ExtraBold',
    lineHeight: 28,
    textAlign: 'left',
    marginTop: 22,
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollContent: {
    paddingBottom: 140,
  },
  optionsContainer: {
    marginTop: 28,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.lg - 5,
    justifyContent: 'space-between',
  },
  optionContainerSelected: {
    borderColor: '#191BDF',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#3C4159',
    fontFamily: 'Manrope-Medium',
    padding: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  optionTextSelected: {
    color: '#0A0D14',
  },
  radioButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2E4E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: palette.accentBlue,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.accentBlue,
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 57,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrowButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  continueButtonWrapper: {
    flex: 1,
    marginLeft: 20,
    marginRight: 0,
  },
  continueButton: {
    backgroundColor: '#191BDF',
    height: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: Platform.select({
      ios: 'Manrope',
      android: 'Manrope',
      web: "'Manrope', sans-serif",
      default: 'Manrope',
    }),
    color: palette.white,
    textAlign: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#E2E4E9',
    opacity: 0.6,
  },
  continueButtonTextDisabled: {
    color: '#868C98',
  },
});
