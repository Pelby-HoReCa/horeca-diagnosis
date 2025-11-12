import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { DEFAULT_BLOCKS } from '../data/diagnosisBlocks';
import { getTasksByBlock, Task } from '../utils/recommendationEngine';
import { getCurrentUserId, loadUserTasks, saveUserTasks } from '../utils/userDataStorage';
import { palette, radii, spacing, typography } from '../styles/theme';

const logo = require('../../assets/images/1111.png');

// Task interface теперь импортируется из recommendationEngine

export default function ActionPlanScreen({ route, navigation }: { route?: any; navigation?: any }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  // Обновляем задачи при возврате на экран (БЕЗ очистки данных)
  useFocusEffect(
    useCallback(() => {
      console.log('Экран "Задачи" получил фокус, обновляем задачи...');
      loadTasksWithoutClearing();
    }, [])
  );

  const loadTasksWithoutClearing = async () => {
    try {
      console.log('Загружаем задачи без очистки...');
      let tasksSource: Task[] = [];
      const userId = await getCurrentUserId();

      if (userId) {
        tasksSource = await loadUserTasks(userId);
      }

      if ((!userId || tasksSource.length === 0)) {
        const storedTasks = await AsyncStorage.getItem('actionPlanTasks');
        if (storedTasks) {
          tasksSource = JSON.parse(storedTasks);
        }
      }

      if (tasksSource.length > 0) {
        console.log('=== ЗАГРУЗКА ЗАДАЧ В ЭКШЕН ПЛАНЕ ===');
        console.log('Найдены задачи:', tasksSource.length);
        const tasksWithDefaults = tasksSource.map((task: any, index: number) => ({
          ...task,
          id: task.id || `task_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
          completed: task.completed || false,
        }));
        setTasks(tasksWithDefaults);
        console.log('Загружены задачи:', tasksWithDefaults.map((t: Task) => ({ id: t.id, title: t.title, blockId: t.blockId })));
        if (userId) {
          await saveUserTasks(userId, tasksWithDefaults);
        }
      } else {
        console.log('Задач в хранилище нет, показываем пустой список');
        setTasks([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
      setTasks([]);
    }
  };

  // Обрабатываем параметры навигации
  useEffect(() => {
    if (route?.params?.newTasks) {
      console.log('Получены новые задачи:', route.params.newTasks);
      // Перезагружаем задачи
      loadTasks();
    }
  }, [route?.params]);

  const loadTasks = async () => {
    try {
      console.log('Загружаем задачи из AsyncStorage...');
      
      let tasksSource: Task[] = [];
      const userId = await getCurrentUserId();

      if (userId) {
        tasksSource = await loadUserTasks(userId);
      }

      if ((!userId || tasksSource.length === 0)) {
        const storedTasks = await AsyncStorage.getItem('actionPlanTasks');
        if (storedTasks) {
          tasksSource = JSON.parse(storedTasks);
        }
      }

      if (tasksSource.length > 0) {
        console.log('Найдены задачи:', tasksSource.length);
        console.log('Сырые задачи:', tasksSource);
        const tasksWithDefaults = tasksSource.map((task: any, index: number) => ({
          ...task,
          id: task.id || `task_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
          completed: task.completed || false,
        }));
        setTasks(tasksWithDefaults);
        console.log('Загружены задачи:', tasksWithDefaults.map((t: Task) => ({ id: t.id, title: t.title, blockId: t.blockId })));
        if (userId) {
          await saveUserTasks(userId, tasksWithDefaults);
        }
      } else {
        console.log('Задач в хранилище нет, показываем пустой список');
        setTasks([]);
      }
      
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      setTasks(updatedTasks);

      await AsyncStorage.setItem('actionPlanTasks', JSON.stringify(updatedTasks));

      const userId = await getCurrentUserId();
      if (userId) {
        await saveUserTasks(userId, updatedTasks);
      }
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      await AsyncStorage.setItem('actionPlanTasks', JSON.stringify(updatedTasks));

      const userId = await getCurrentUserId();
      if (userId) {
        await saveUserTasks(userId, updatedTasks);
      }
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
    }
  };

  const clearAllTasks = async () => {
    try {
      console.log('Очищаем все задачи...');
      setTasks([]);
      await AsyncStorage.removeItem('actionPlanTasks');
      console.log('Все задачи очищены');

      const userId = await getCurrentUserId();
      if (userId) {
        await saveUserTasks(userId, []);
      }
    } catch (error) {
      console.error('Ошибка очистки задач:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return palette.error;
      case 'medium':
        return palette.primaryOrange;
      case 'low':
        return palette.primaryBlue;
      default:
        return palette.gray500;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return 'Не указан';
    }
  };

  const tasksByBlock = getTasksByBlock(tasks);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Загрузка задач...</Text>
      </View>
    );
  }

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
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
            <Text style={styles.headerTitle} numberOfLines={1}>План действий</Text>
          </View>
        </View>
      </View>

      {/* Блоки с прогрессом */}
      {Object.keys(tasksByBlock).length > 0 && (
        <View style={styles.blocksContainer}>
          <Text style={styles.blocksTitle}>Прогресс по блокам</Text>
          {Object.entries(tasksByBlock).map(([blockId, blockData]) => (
            <AnimatedPressable
              key={blockId}
              style={styles.blockProgress}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('BlockDetail', { blockId });
                }
              }}
            >
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>{blockData.tasks[0]?.blockTitle || blockId}</Text>
                <Text style={styles.blockProgressText}>
                  {blockData.completed}/{blockData.total} ({blockData.total > 0 ? Math.round((blockData.completed / blockData.total) * 100) : 0}%)
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(blockData.completed / blockData.total) * 100}%` }
                  ]} 
                />
              </View>
            </AnimatedPressable>
          ))}
        </View>
      )}

      {/* Рекомендации по приоритету блоков */}
      {(() => {
        // Вычисляем приоритет блоков на основе количества высокоприоритетных задач
        const blockPriorities = Object.entries(tasksByBlock).map(([blockId, blockData]) => {
          const highPriorityTasks = blockData.tasks.filter(t => t.priority === 'high' && !t.completed).length;
          const mediumPriorityTasks = blockData.tasks.filter(t => t.priority === 'medium' && !t.completed).length;
          const lowPriorityTasks = blockData.tasks.filter(t => t.priority === 'low' && !t.completed).length;
          const totalPending = blockData.tasks.filter(t => !t.completed).length;
          
          const block = DEFAULT_BLOCKS.find(b => b.id === blockId);
          
          return {
            blockId,
            blockTitle: block?.title || blockData.tasks[0]?.blockTitle || blockId,
            highPriorityTasks,
            mediumPriorityTasks,
            lowPriorityTasks,
            totalPending,
            score: highPriorityTasks * 3 + mediumPriorityTasks * 2 + lowPriorityTasks * 1,
          };
        }).filter(b => b.totalPending > 0).sort((a, b) => b.score - a.score);

        if (blockPriorities.length === 0) {
          return (
            <View style={styles.recommendationsContainer}>
              <Text style={styles.recommendationsTitle}>Рекомендации по приоритету</Text>
              <View style={styles.emptyRecommendations}>
                <Text style={styles.emptyRecommendationsText}>
                  Все задачи выполнены! Отличная работа!
                </Text>
              </View>
            </View>
          );
        }

        return (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.recommendationsTitle}>Рекомендуемый порядок выполнения</Text>
            <Text style={styles.recommendationsSubtitle}>
              Выполняйте блоки в указанном порядке для максимальной эффективности
            </Text>
            {blockPriorities.map((blockPriority, index) => (
              <View key={blockPriority.blockId} style={styles.recommendationCard}>
                <View style={styles.recommendationNumber}>
                  <Text style={styles.recommendationNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationBlockTitle}>{blockPriority.blockTitle}</Text>
                  <View style={styles.recommendationStats}>
                    {blockPriority.highPriorityTasks > 0 && (
                      <View style={styles.recommendationStat}>
                        <Ionicons name="alert-circle" size={14} color={palette.error} />
                        <Text style={[styles.recommendationStatText, { color: palette.error }]}>
                          {blockPriority.highPriorityTasks} высокий приоритет
                        </Text>
                      </View>
                    )}
                    {blockPriority.mediumPriorityTasks > 0 && (
                      <View style={styles.recommendationStat}>
                        <Ionicons name="information-circle" size={14} color={palette.primaryOrange} />
                        <Text style={[styles.recommendationStatText, { color: palette.primaryOrange }]}>
                          {blockPriority.mediumPriorityTasks} средний приоритет
                        </Text>
                      </View>
                    )}
                    <Text style={styles.recommendationTotalTasks}>
                      Всего задач: {blockPriority.totalPending}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        );
      })()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.background,
  },
  loadingText: {
    fontSize: 16,
    color: palette.primaryBlue,
  },
  header: {
    backgroundColor: palette.white,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray200,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    marginBottom: spacing.sm,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 28,
    height: 28,
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.heading2,
    color: palette.primaryBlue,
  },
  tasksContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  taskCard: {
    backgroundColor: palette.white,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: palette.primaryBlue,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  taskCardCompleted: {
    backgroundColor: '#F0FAF5',
    borderLeftColor: palette.success,
    opacity: 0.95,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: spacing.sm,
    marginTop: spacing.xs,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.primaryBlue,
    marginBottom: spacing.xs,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: palette.gray500,
  },
  taskDescription: {
    fontSize: 13,
    color: palette.gray600,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: palette.background,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.primaryBlue,
  },
  dueDate: {
    fontSize: 12,
    color: palette.gray600,
  },
  deleteButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    color: palette.gray600,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: palette.gray500,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
  blocksContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: palette.white,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.gray200,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  blocksTitle: {
    ...typography.heading3,
    color: palette.primaryBlue,
    marginBottom: spacing.md,
  },
  blockProgress: {
    marginBottom: spacing.md,
    backgroundColor: palette.white,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.gray200,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primaryBlue,
    flex: 1,
  },
  blockProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.primaryOrange,
  },
  progressBar: {
    height: 8,
    backgroundColor: palette.gray200,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.primaryOrange,
    borderRadius: radii.sm,
  },
  recommendationsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  recommendationsTitle: {
    ...typography.heading3,
    color: palette.primaryBlue,
    marginBottom: spacing.xs,
  },
  recommendationsSubtitle: {
    fontSize: 14,
    color: palette.gray600,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: palette.white,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.gray200,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  recommendationNumber: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: palette.primaryOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  recommendationNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.white,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationBlockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primaryBlue,
    marginBottom: spacing.xs,
  },
  recommendationStats: {
    gap: spacing.xs,
  },
  recommendationStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  recommendationStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.gray600,
  },
  recommendationTotalTasks: {
    fontSize: 12,
    color: palette.gray500,
    marginTop: spacing.xs,
  },
  emptyRecommendations: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyRecommendationsText: {
    fontSize: 14,
    color: palette.gray600,
    textAlign: 'center',
  },
});
