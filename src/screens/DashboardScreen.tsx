import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import BarChart from '../components/BarChart';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { DEFAULT_BLOCKS, DiagnosisBlock } from '../data/diagnosisBlocks';
import { Task } from '../utils/recommendationEngine';
import {
  getCurrentUserId,
  loadUserBlocks,
  loadUserDashboardData,
  loadUserQuestionnaire,
  loadUserTasks,
  saveUserDashboardData
} from '../utils/userDataStorage';
import { palette, radii, spacing, typography } from '../styles/theme';

const COLORS = {
  gray: palette.gray200,
  darkGray: palette.gray600,
  blue: palette.primaryBlue,
  orange: palette.primaryOrange,
  green: palette.success,
  red: palette.error,
  white: palette.white,
};

// Фирменные цвета
interface Comparison {
  previous: number | null; // null означает, что это первое прохождение
  current: number;
  change?: number; // Изменение в процентах (положительное = рост, отрицательное = падение)
}

export default function DashboardScreen({ navigation }: any) {
  const [restaurantName, setRestaurantName] = useState('Название ресторана');
  const [blockResults, setBlockResults] = useState<DiagnosisBlock[]>([]);
  const [comparison, setComparison] = useState<Comparison>({ previous: null, current: 0 });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [allBlocksFinished, setAllBlocksFinished] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadDashboardData();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authStatus = await AsyncStorage.getItem('isAuthenticated');
      setIsAuthenticated(authStatus === 'true');
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      setIsAuthenticated(false);
    }
  };

  // Обновляем данные при возврате на экран
  useFocusEffect(
    useCallback(() => {
      console.log('Дашборд получил фокус, обновляем данные...');
      loadDashboardDataWithoutClearing();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      console.log('Загружаем данные дашборда...');
      
      const userId = await getCurrentUserId();
      
      // Загружаем название ресторана из данных пользователя
      if (userId) {
        const questionnaireData = await loadUserQuestionnaire(userId);
        if (questionnaireData && questionnaireData.restaurantName && questionnaireData.restaurantName.trim()) {
          setRestaurantName(questionnaireData.restaurantName);
        } else {
          setRestaurantName('Название ресторана');
        }
      } else {
        setRestaurantName('Название ресторана');
      }
      
      // Загружаем существующие данные
      let storedBlocks: DiagnosisBlock[] | null = null;
      let storedTasks: Task[] = [];
      
      if (userId) {
        storedBlocks = await loadUserBlocks(userId);
        storedTasks = await loadUserTasks(userId);
      } else {
        // Fallback к глобальным данным
        const blocksJson = await AsyncStorage.getItem('diagnosisBlocks');
        const tasksJson = await AsyncStorage.getItem('actionPlanTasks');
        if (blocksJson) storedBlocks = JSON.parse(blocksJson);
        if (tasksJson) storedTasks = JSON.parse(tasksJson);
      }
      
      let allBlocksCompleted: string | null = null;
      let storedPrevious: string | null = null;
      let storedCurrent: string | null = null;
      
      if (userId) {
        const dashboardData = await loadUserDashboardData(userId);
        allBlocksCompleted = dashboardData.allBlocksCompleted;
        storedPrevious = dashboardData.previousResult;
        storedCurrent = dashboardData.currentResult;
      } else {
        // Fallback к глобальным данным
        allBlocksCompleted = await AsyncStorage.getItem('dashboardAllBlocksCompleted');
        storedPrevious = await AsyncStorage.getItem('dashboardPreviousResult');
        storedCurrent = await AsyncStorage.getItem('dashboardCurrentResult');
      }
      
      if (storedBlocks) {
        const blocks = Array.isArray(storedBlocks) ? storedBlocks : JSON.parse(storedBlocks);
        // Объединяем загруженные блоки с дефолтными, чтобы показать все блоки
        const allBlocks = DEFAULT_BLOCKS.map(defaultBlock => {
          const foundBlock = blocks.find((b: DiagnosisBlock) => b.id === defaultBlock.id);
          if (foundBlock) {
            // Если блок найден, используем его данные (включая efficiency и completed)
            return {
              ...defaultBlock,
              ...foundBlock,
              // Сохраняем title и description из DEFAULT_BLOCKS
              title: defaultBlock.title,
              description: defaultBlock.description,
            };
          }
          return defaultBlock;
        });
        setBlockResults(allBlocks);
        console.log('Загружены блоки для дашборда:', allBlocks.length);
        
        // Проверяем, все ли блоки завершены
        const completedBlocks = allBlocks.filter(b => b.completed && b.efficiency !== undefined);
        const allCompleted = completedBlocks.length === DEFAULT_BLOCKS.length;
        setAllBlocksFinished(allCompleted);
        
        if (allCompleted && completedBlocks.length > 0) {
          // Рассчитываем среднюю эффективность по всем блокам
          const avgEfficiency = Math.round(
            completedBlocks.reduce((sum, b) => sum + (b.efficiency || 0), 0) / completedBlocks.length
          );
          
          const wasAllCompleted = allBlocksCompleted === 'true';
          const previousValue = storedPrevious ? parseInt(storedPrevious, 10) : null;
          const currentValue = storedCurrent ? parseInt(storedCurrent, 10) : 0;
          
          if (!wasAllCompleted) {
            // Первое прохождение всех блоков - сохраняем только ТЕКУЩИЙ, ПРЕДЫДУЩИЙ не сохраняем
            if (userId) {
              await saveUserDashboardData(userId, {
                allBlocksCompleted: 'true',
                currentResult: avgEfficiency.toString(),
                // previousResult не сохраняем при первом прохождении
              });
            } else {
              await AsyncStorage.setItem('dashboardAllBlocksCompleted', 'true');
              await AsyncStorage.setItem('dashboardCurrentResult', avgEfficiency.toString());
              // previousResult не сохраняем при первом прохождении
            }
            setComparison({ previous: null, current: avgEfficiency, change: undefined });
          } else {
            // Последующие прохождения - проверяем, изменился ли результат
            if (avgEfficiency !== currentValue) {
              // Результат изменился - обновляем ПРЕДЫДУЩИЙ и ТЕКУЩИЙ
              const newPrevious = currentValue;
              const newCurrent = avgEfficiency;
              const change = newCurrent - newPrevious;
              
              if (userId) {
                await saveUserDashboardData(userId, {
                  previousResult: newPrevious.toString(),
                  currentResult: newCurrent.toString(),
                });
              } else {
                await AsyncStorage.setItem('dashboardPreviousResult', newPrevious.toString());
                await AsyncStorage.setItem('dashboardCurrentResult', newCurrent.toString());
              }
              setComparison({ previous: newPrevious, current: newCurrent, change });
            } else {
              // Результат не изменился - используем сохраненные значения
              const change = previousValue !== null && currentValue !== previousValue ? currentValue - previousValue : undefined;
              setComparison({ previous: previousValue, current: currentValue, change });
            }
          }
        } else {
          // Не все блоки завершены - ПРЕДЫДУЩИЙ = null, ТЕКУЩИЙ = среднее по завершенным блокам (или 0)
          const avgEfficiency = completedBlocks.length > 0 
            ? Math.round(completedBlocks.reduce((sum, b) => sum + (b.efficiency || 0), 0) / completedBlocks.length)
            : 0;
          setComparison({ previous: null, current: avgEfficiency, change: undefined });
          setAllBlocksFinished(false);
        }
      } else {
        // Если блоков нет, показываем дефолтные
        setBlockResults(DEFAULT_BLOCKS);
        setComparison({ previous: null, current: 0, change: undefined });
        setAllBlocksFinished(false);
        console.log('Блоков в хранилище нет, показываем дефолтные');
      }
      
      if (storedTasks && storedTasks.length > 0) {
        // Показываем только первые 3 задачи
        setTasks(storedTasks.slice(0, 3));
        console.log('Загружены задачи для дашборда:', tasks.slice(0, 3).length);
      } else {
        setTasks([]);
        console.log('Задач для дашборда нет');
      }
      
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setTasks([]);
      setBlockResults(DEFAULT_BLOCKS);
      setComparison({ previous: 0, current: 0, change: 0 });
      setAllBlocksFinished(false);
    }
  };

  const loadDashboardDataWithoutClearing = async () => {
    try {
      console.log('Загружаем данные дашборда без очистки...');
      
      const userId = await getCurrentUserId();
      
      // Загружаем название ресторана из данных пользователя
      if (userId) {
        const questionnaireData = await loadUserQuestionnaire(userId);
        if (questionnaireData && questionnaireData.restaurantName && questionnaireData.restaurantName.trim()) {
          setRestaurantName(questionnaireData.restaurantName);
        } else {
          setRestaurantName('Название ресторана');
        }
      } else {
        setRestaurantName('Название ресторана');
      }
      
      // Загружаем существующие данные
      let storedBlocks: DiagnosisBlock[] | null = null;
      let storedTasks: Task[] = [];
      
      if (userId) {
        storedBlocks = await loadUserBlocks(userId);
        storedTasks = await loadUserTasks(userId);
      } else {
        // Fallback к глобальным данным
        const blocksJson = await AsyncStorage.getItem('diagnosisBlocks');
        const tasksJson = await AsyncStorage.getItem('actionPlanTasks');
        if (blocksJson) storedBlocks = JSON.parse(blocksJson);
        if (tasksJson) storedTasks = JSON.parse(tasksJson);
      }
      let allBlocksCompleted: string | null = null;
      let storedPrevious: string | null = null;
      let storedCurrent: string | null = null;
      
      if (userId) {
        const dashboardData = await loadUserDashboardData(userId);
        allBlocksCompleted = dashboardData.allBlocksCompleted;
        storedPrevious = dashboardData.previousResult;
        storedCurrent = dashboardData.currentResult;
      } else {
        allBlocksCompleted = await AsyncStorage.getItem('dashboardAllBlocksCompleted');
        storedPrevious = await AsyncStorage.getItem('dashboardPreviousResult');
        storedCurrent = await AsyncStorage.getItem('dashboardCurrentResult');
      }
      
      if (storedBlocks) {
        const blocks = Array.isArray(storedBlocks) ? storedBlocks : JSON.parse(storedBlocks);
        // Объединяем загруженные блоки с дефолтными, чтобы показать все блоки
        const allBlocks = DEFAULT_BLOCKS.map(defaultBlock => {
          const foundBlock = blocks.find((b: DiagnosisBlock) => b.id === defaultBlock.id);
          if (foundBlock) {
            // Если блок найден, используем его данные (включая efficiency и completed)
            return {
              ...defaultBlock,
              ...foundBlock,
              // Сохраняем title и description из DEFAULT_BLOCKS
              title: defaultBlock.title,
              description: defaultBlock.description,
            };
          }
          return defaultBlock;
        });
        setBlockResults(allBlocks);
        console.log('Загружены блоки для дашборда:', allBlocks.length);
        
        // Проверяем, все ли блоки завершены
        const completedBlocks = allBlocks.filter(b => b.completed && b.efficiency !== undefined);
        const allCompleted = completedBlocks.length === DEFAULT_BLOCKS.length;
        setAllBlocksFinished(allCompleted);
        
        if (allCompleted && completedBlocks.length > 0) {
          // Рассчитываем среднюю эффективность по всем блокам
          const avgEfficiency = Math.round(
            completedBlocks.reduce((sum, b) => sum + (b.efficiency || 0), 0) / completedBlocks.length
          );
          
          const wasAllCompleted = allBlocksCompleted === 'true';
          const previousValue = storedPrevious ? parseInt(storedPrevious, 10) : null;
          const currentValue = storedCurrent ? parseInt(storedCurrent, 10) : 0;
          
          if (!wasAllCompleted) {
            // Первое прохождение всех блоков - сохраняем только ТЕКУЩИЙ, ПРЕДЫДУЩИЙ не сохраняем
            if (userId) {
              await saveUserDashboardData(userId, {
                allBlocksCompleted: 'true',
                currentResult: avgEfficiency.toString(),
                // previousResult не сохраняем при первом прохождении
              });
            } else {
              await AsyncStorage.setItem('dashboardAllBlocksCompleted', 'true');
              await AsyncStorage.setItem('dashboardCurrentResult', avgEfficiency.toString());
              // previousResult не сохраняем при первом прохождении
            }
            setComparison({ previous: null, current: avgEfficiency, change: undefined });
          } else {
            // Последующие прохождения - проверяем, изменился ли результат
            if (avgEfficiency !== currentValue) {
              // Результат изменился - обновляем ПРЕДЫДУЩИЙ и ТЕКУЩИЙ
              const newPrevious = currentValue;
              const newCurrent = avgEfficiency;
              const change = newCurrent - newPrevious;
              
              if (userId) {
                await saveUserDashboardData(userId, {
                  previousResult: newPrevious.toString(),
                  currentResult: newCurrent.toString(),
                });
              } else {
                await AsyncStorage.setItem('dashboardPreviousResult', newPrevious.toString());
                await AsyncStorage.setItem('dashboardCurrentResult', newCurrent.toString());
              }
              setComparison({ previous: newPrevious, current: newCurrent, change });
            } else {
              // Результат не изменился - используем сохраненные значения
              const change = previousValue !== null && currentValue !== previousValue ? currentValue - previousValue : undefined;
              setComparison({ previous: previousValue, current: currentValue, change });
            }
          }
        } else {
          // Не все блоки завершены - ПРЕДЫДУЩИЙ = null, ТЕКУЩИЙ = среднее по завершенным блокам (или 0)
          const avgEfficiency = completedBlocks.length > 0 
            ? Math.round(completedBlocks.reduce((sum, b) => sum + (b.efficiency || 0), 0) / completedBlocks.length)
            : 0;
          setComparison({ previous: null, current: avgEfficiency, change: undefined });
          setAllBlocksFinished(false);
        }
      } else {
        // Если блоков нет, показываем дефолтные
        setBlockResults(DEFAULT_BLOCKS);
        setComparison({ previous: null, current: 0, change: undefined });
        setAllBlocksFinished(false);
        console.log('Блоков в хранилище нет, показываем дефолтные');
      }

      // Загружаем задачи
      if (storedTasks && storedTasks.length > 0) {
        setTasks(storedTasks.slice(0, 3)); // Показываем только первые 3 задачи
        console.log('Загружены задачи для дашборда:', storedTasks.length);
      } else {
        setTasks([]);
        console.log('Задач для дашборда нет');
      }
      
    } catch (error) {
      console.error('Ошибка загрузки данных дашборда:', error);
      setAllBlocksFinished(false);
    }
  };

  const getEfficiencyColor = (efficiency?: number): { bg: string; text: string; border?: string } => {
    if (efficiency === undefined || efficiency === null) {
      return { bg: COLORS.gray, text: COLORS.darkGray };
    }
    
    // Чем ниже эффективность, тем тревожнее цвет
    if (efficiency >= 80) {
      // Высокая эффективность - спокойный зеленоватый
      return { bg: '#E8F5E9', text: COLORS.green, border: '#81C784' };
    } else if (efficiency >= 60) {
      // Средняя эффективность - нейтральный голубоватый
      return { bg: '#E3F2FD', text: COLORS.blue, border: '#64B5F6' };
    } else if (efficiency >= 40) {
      // Низкая эффективность - предупреждающий оранжевый
      return { bg: '#FFF3E0', text: '#F57C00', border: '#FFB74D' };
    } else {
      // Очень низкая эффективность - тревожный красноватый
      return { bg: '#FFEBEE', text: '#D32F2F', border: '#E57373' };
    }
  };

  const BlockCard = ({ block }: { block: DiagnosisBlock }) => {
    const efficiency = block.efficiency ?? 0;
    const colors = getEfficiencyColor(block.efficiency);
    
    return (
      <AnimatedPressable
        style={[
          styles.blockCard,
          { backgroundColor: colors.bg, borderLeftWidth: 4, borderLeftColor: colors.border || colors.text }
        ]}
        onPress={() => {
          if (navigation) {
            navigation.navigate('BlockDetail', { blockId: block.id });
          }
        }}
      >
        <Text style={[styles.blockTitle, { color: COLORS.blue }]}>{block.title}</Text>
        <View style={styles.efficiencyContainer}>
          <Text style={[styles.efficiencyValue, { color: colors.text }]}>
            {block.completed ? `${efficiency}%` : '—'}
          </Text>
          <Text style={[styles.efficiencyLabel, { color: colors.text }]}>эффективность</Text>
        </View>
      </AnimatedPressable>
    );
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <View style={styles.taskItem}>
      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.taskDescription}>{task.description}</Text>
        <Text style={styles.taskPriority}>
          Приоритет: {task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
        </Text>
      </View>
      <Ionicons 
        name={task.completed ? 'checkmark-circle' : 'ellipse-outline'} 
        size={20} 
        color={task.completed ? COLORS.green : COLORS.blue} 
      />
    </View>
  );

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollButton(offsetY > 500);
  };

  return (
    <View style={styles.container}>
    <ScrollView 
      ref={scrollViewRef} 
      style={styles.scrollView}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {/* Название ресторана */}
      <View style={styles.restaurantNameContainer}>
        <Text style={styles.restaurantName}>{restaurantName}</Text>
      </View>

      {/* Общий результат - сверху */}
      <View style={[styles.section, styles.overallResultSection]}>
        <Text style={styles.sectionTitle}>Общий результат</Text>
        <View style={styles.comparisonContainer}>
          <View style={styles.comparisonItem}>
            <Text style={[styles.comparisonValue, { color: COLORS.red }]}>
              {allBlocksFinished && comparison.previous !== null ? `${comparison.previous}%` : '—'}
            </Text>
            <Text style={styles.comparisonLabel}>ПРЕДЫДУЩИЙ</Text>
          </View>
          <View style={styles.comparisonItem}>
            <View style={styles.currentResultContainer}>
              <Text style={[styles.comparisonValue, { color: COLORS.green }]}>
                {allBlocksFinished ? `${comparison.current}%` : '—'}
              </Text>
              {allBlocksFinished && comparison.change !== undefined && comparison.change !== 0 && (
                <View style={styles.changeIndicator}>
                  <Ionicons 
                    name={comparison.change > 0 ? "arrow-up" : "arrow-down"} 
                    size={14} 
                    color={comparison.change > 0 ? COLORS.green : COLORS.red} 
                  />
                  <Text style={[
                    styles.changeText,
                    { color: comparison.change > 0 ? COLORS.green : COLORS.red }
                  ]}>
                    {Math.abs(comparison.change)}%
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.comparisonLabel}>ТЕКУЩИЙ</Text>
          </View>
        </View>
        {!allBlocksFinished && (
          <Text style={styles.incompleteHint}>Пройдите все блоки, чтобы увидеть сводные показатели</Text>
        )}
      </View>

      {/* Столбчатая диаграмма */}
      <View style={[styles.section, styles.chartSection]}>
        <Text style={styles.sectionTitle}>Результаты диагностики</Text>
        <BarChart blocks={blockResults} isAuthenticated={isAuthenticated} />
      </View>

      {/* Результаты по блокам */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Результаты по блокам</Text>
        <View style={styles.blocksGrid}>
          {blockResults.map((block, index) => (
            <View 
              key={block.id}
              style={[
                styles.blockCardWrapper,
                index % 2 === 0 ? null : styles.blockCardRight
              ]}
            >
              <BlockCard block={block} />
            </View>
          ))}
        </View>
      </View>

      {/* Текущие задачи */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Текущие задачи</Text>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))
        ) : (
          <Text style={styles.emptyText}>Нет активных задач</Text>
        )}
      </View>
    </ScrollView>
    <ScrollToTopButton onPress={scrollToTop} visible={showScrollButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollView: {
    flex: 1,
  },
  restaurantNameContainer: {
    backgroundColor: palette.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
    marginHorizontal: spacing.md,
    borderRadius: radii.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.primaryBlue,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.primaryOrange,
    letterSpacing: 0.5,
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading3,
    color: palette.primaryBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  blocksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'space-between',
  },
  blockCardWrapper: {
    width: '48%',
    marginBottom: spacing.md,
  },
  blockCardRight: {},
  blockCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    minHeight: 110,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  blockTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
    lineHeight: 16,
    textAlign: 'center',
    color: palette.primaryBlue,
  },
  efficiencyContainer: {
    alignItems: 'center',
    marginTop: 2,
    width: '100%',
  },
  efficiencyValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  efficiencyLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: palette.gray600,
  },
  overallResultSection: {
    marginTop: 0,
    marginBottom: spacing.xl,
  },
  chartSection: {
    marginTop: 0,
    marginBottom: spacing.xl,
  },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: palette.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: palette.primaryBlue,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  comparisonItem: {
    alignItems: 'center',
    flex: 1,
  },
  currentResultContainer: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  comparisonValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  comparisonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.primaryBlue,
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  incompleteHint: {
    fontSize: 12,
    color: palette.gray600,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 2,
  },
  taskDescription: {
    fontSize: 11,
    color: COLORS.darkGray,
    marginBottom: 2,
    lineHeight: 14,
  },
  taskPriority: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
