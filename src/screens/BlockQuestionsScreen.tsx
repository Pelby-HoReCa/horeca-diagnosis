import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { generateTasksFromAnswers, Task } from '../utils/recommendationEngine';

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  gray: '#F0F0F0',
  white: '#FFFFFF',
  darkGray: '#666666',
};

interface Question {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    value: string;
  }>;
}

interface BlockQuestionsScreenProps {
  blockId: string;
  blockTitle: string;
  onComplete: () => void;
  onContinue: () => void;
}

const questions: Record<string, Question[]> = {
  economy: [
    {
      id: 'q1',
      question: 'Как вы оцениваете финансовую эффективность вашего бизнеса?',
      options: [
        { id: 'opt1', text: 'Отлично', value: 'excellent' },
        { id: 'opt2', text: 'Хорошо', value: 'good' },
        { id: 'opt3', text: 'Удовлетворительно', value: 'satisfactory' },
        { id: 'opt4', text: 'Плохо', value: 'poor' }
      ]
    },
    {
      id: 'q2',
      question: 'Есть ли у вас система учета расходов?',
      options: [
        { id: 'opt1', text: 'Да, полностью автоматизирована', value: 'automated' },
        { id: 'opt2', text: 'Частично', value: 'partial' },
        { id: 'opt3', text: 'Нет', value: 'no' }
      ]
    },
    {
      id: 'q3',
      question: 'Как часто вы анализируете финансовые показатели?',
      options: [
        { id: 'opt1', text: 'Ежедневно', value: 'daily' },
        { id: 'opt2', text: 'Еженедельно', value: 'weekly' },
        { id: 'opt3', text: 'Ежемесячно', value: 'monthly' },
        { id: 'opt4', text: 'Редко', value: 'rarely' }
      ]
    }
  ],
  production: [
    {
      id: 'q1',
      question: 'Как вы оцениваете качество ваших продуктов?',
      options: [
        { id: 'opt1', text: 'Отлично', value: 'excellent' },
        { id: 'opt2', text: 'Хорошо', value: 'good' },
        { id: 'opt3', text: 'Удовлетворительно', value: 'satisfactory' },
        { id: 'opt4', text: 'Плохо', value: 'poor' }
      ]
    },
    {
      id: 'q2',
      question: 'Есть ли стандартизированные рецепты?',
      options: [
        { id: 'opt1', text: 'Да, для всех блюд', value: 'all' },
        { id: 'opt2', text: 'Частично', value: 'partial' },
        { id: 'opt3', text: 'Нет', value: 'no' }
      ]
    },
    {
      id: 'q3',
      question: 'Как вы контролируете качество сырья?',
      options: [
        { id: 'opt1', text: 'Строгий контроль', value: 'strict' },
        { id: 'opt2', text: 'Базовый контроль', value: 'basic' },
        { id: 'opt3', text: 'Минимальный контроль', value: 'minimal' }
      ]
    }
  ],
  team: [
    {
      id: 'q1',
      question: 'Как вы оцениваете мотивацию сотрудников?',
      options: [
        { id: 'opt1', text: 'Высокая', value: 'high' },
        { id: 'opt2', text: 'Средняя', value: 'medium' },
        { id: 'opt3', text: 'Низкая', value: 'low' }
      ]
    },
    {
      id: 'q2',
      question: 'Проводите ли вы обучение персонала?',
      options: [
        { id: 'opt1', text: 'Регулярно', value: 'regular' },
        { id: 'opt2', text: 'Иногда', value: 'sometimes' },
        { id: 'opt3', text: 'Редко', value: 'rarely' }
      ]
    },
    {
      id: 'q3',
      question: 'Есть ли система поощрений?',
      options: [
        { id: 'opt1', text: 'Да, развитая система', value: 'developed' },
        { id: 'opt2', text: 'Базовые поощрения', value: 'basic' },
        { id: 'opt3', text: 'Нет', value: 'no' }
      ]
    }
  ],
  delivery: [
    {
      id: 'q1',
      question: 'Как вы оцениваете качество доставки?',
      options: [
        { id: 'opt1', text: 'Отлично', value: 'excellent' },
        { id: 'opt2', text: 'Хорошо', value: 'good' },
        { id: 'opt3', text: 'Удовлетворительно', value: 'satisfactory' },
        { id: 'opt4', text: 'Плохо', value: 'poor' }
      ]
    },
    {
      id: 'q2',
      question: 'Есть ли проблемы с логистикой?',
      options: [
        { id: 'opt1', text: 'Нет проблем', value: 'no_problems' },
        { id: 'opt2', text: 'Есть небольшие проблемы', value: 'minor_issues' },
        { id: 'opt3', text: 'Серьезные проблемы', value: 'major_issues' }
      ]
    },
    {
      id: 'q3',
      question: 'Как быстро вы доставляете заказы?',
      options: [
        { id: 'opt1', text: 'Очень быстро', value: 'very_fast' },
        { id: 'opt2', text: 'В пределах нормы', value: 'normal' },
        { id: 'opt3', text: 'Медленно', value: 'slow' }
      ]
    }
  ],
  service: [
    {
      id: 'q1',
      question: 'Как вы оцениваете качество обслуживания?',
      options: [
        { id: 'opt1', text: 'Отлично', value: 'excellent' },
        { id: 'opt2', text: 'Хорошо', value: 'good' },
        { id: 'opt3', text: 'Удовлетворительно', value: 'satisfactory' },
        { id: 'opt4', text: 'Плохо', value: 'poor' }
      ]
    },
    {
      id: 'q2',
      question: 'Есть ли стандарты обслуживания?',
      options: [
        { id: 'opt1', text: 'Да, детальные', value: 'detailed' },
        { id: 'opt2', text: 'Базовые', value: 'basic' },
        { id: 'opt3', text: 'Нет', value: 'no' }
      ]
    },
    {
      id: 'q3',
      question: 'Как вы работаете с жалобами клиентов?',
      options: [
        { id: 'opt1', text: 'Быстро и эффективно', value: 'fast_effective' },
        { id: 'opt2', text: 'Стандартно', value: 'standard' },
        { id: 'opt3', text: 'Медленно', value: 'slow' }
      ]
    }
  ],
  sales: [
    {
      id: 'q1',
      question: 'Как вы оцениваете эффективность продаж?',
      options: [
        { id: 'opt1', text: 'Отлично', value: 'excellent' },
        { id: 'opt2', text: 'Хорошо', value: 'good' },
        { id: 'opt3', text: 'Удовлетворительно', value: 'satisfactory' },
        { id: 'opt4', text: 'Плохо', value: 'poor' }
      ]
    },
    {
      id: 'q2',
      question: 'Есть ли маркетинговая стратегия?',
      options: [
        { id: 'opt1', text: 'Да, детальная', value: 'detailed' },
        { id: 'opt2', text: 'Базовая', value: 'basic' },
        { id: 'opt3', text: 'Нет', value: 'no' }
      ]
    },
    {
      id: 'q3',
      question: 'Как вы привлекаете новых клиентов?',
      options: [
        { id: 'opt1', text: 'Активно и разнообразно', value: 'active_diverse' },
        { id: 'opt2', text: 'Стандартными методами', value: 'standard' },
        { id: 'opt3', text: 'Минимально', value: 'minimal' }
      ]
    }
  ]
};

export default function BlockQuestionsScreen({ 
  blockId, 
  blockTitle, 
  onComplete, 
  onContinue 
}: BlockQuestionsScreenProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const blockQuestions = questions[blockId] || [];
  const currentQuestion = blockQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === blockQuestions.length - 1;
  const allQuestionsAnswered = Object.keys(answers).length === blockQuestions.length;

  const handleAnswerSelect = (questionId: string, answerValue: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerValue
    }));
  };

  const saveTasksToStorage = async (tasks: Task[]) => {
    try {
      const existingTasks = await AsyncStorage.getItem('actionPlanTasks');
      const existingTasksArray = existingTasks ? JSON.parse(existingTasks) : [];
      const newTasks = [...existingTasksArray, ...tasks];
      await AsyncStorage.setItem('actionPlanTasks', JSON.stringify(newTasks));
      console.log('Задачи сохранены:', newTasks);
    } catch (error) {
      console.error('Ошибка сохранения задач:', error);
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Генерируем задачи на основе неправильных ответов
      const generatedTasks = generateTasksFromAnswers(blockId, answers);
      console.log('Сгенерированные задачи:', generatedTasks);
      
      if (generatedTasks.length > 0) {
        // Сохраняем задачи
        saveTasksToStorage(generatedTasks);
        
        // Показываем выбор с информацией о количестве задач
        Alert.alert(
          'Блок завершен!',
          `На основе ваших ответов сгенерировано ${generatedTasks.length} рекомендаций. Что хотите сделать дальше?`,
          [
            {
              text: 'Продолжить самодиагностику',
              style: 'default',
              onPress: onContinue
            },
            {
              text: 'Перейти к рекомендациям',
              style: 'default',
              onPress: onComplete
            }
          ]
        );
      } else {
        // Нет неправильных ответов, задач не генерируется
        Alert.alert(
          'Блок завершен!',
          'Отлично! По результатам диагностики проблем не выявлено. Что хотите сделать дальше?',
          [
            {
              text: 'Продолжить самодиагностику',
              style: 'default',
              onPress: onContinue
            },
            {
              text: 'Перейти к рекомендациям',
              style: 'default',
              onPress: onComplete
            }
          ]
        );
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Вопросы для этого блока не найдены</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.blockTitle}>{blockTitle}</Text>
        <Text style={styles.progress}>
          Вопрос {currentQuestionIndex + 1} из {blockQuestions.length}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
        
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                answers[currentQuestion.id] === option.value && styles.selectedOption
              ]}
              onPress={() => handleAnswerSelect(currentQuestion.id, option.value)}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.radioButton,
                  answers[currentQuestion.id] === option.value && styles.selectedRadio
                ]}>
                  {answers[currentQuestion.id] === option.value && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  answers[currentQuestion.id] === option.value && styles.selectedOptionText
                ]}>
                  {option.text}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.navigationContainer}>
        {currentQuestionIndex > 0 && (
          <TouchableOpacity
            style={[styles.navButton, styles.backButton]}
            onPress={handlePreviousQuestion}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.blue} />
            <Text style={styles.backButtonText}>Назад</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            !answers[currentQuestion.id] && styles.disabledButton
          ]}
          onPress={handleNextQuestion}
          disabled={!answers[currentQuestion.id]}
        >
          <Text style={styles.nextButtonText}>
            {isLastQuestion ? 'Завершить блок' : 'Далее'}
          </Text>
          {!isLastQuestion && <Ionicons name="arrow-forward" size={20} color={COLORS.white} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.gray,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  blockTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 8,
  },
  progress: {
    fontSize: 16,
    color: COLORS.orange,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 24,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: COLORS.gray,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#FFF4E6',
    borderColor: COLORS.orange,
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
    borderColor: COLORS.blue,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
    borderColor: COLORS.orange,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.orange,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.blue,
    flex: 1,
  },
  selectedOptionText: {
    color: COLORS.orange,
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.blue,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
    marginLeft: 8,
  },
  nextButton: {
    backgroundColor: COLORS.orange,
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.darkGray,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginRight: 8,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 50,
  },
});
