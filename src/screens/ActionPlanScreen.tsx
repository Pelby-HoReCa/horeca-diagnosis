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

const logo = require('../../assets/images/1111.png');

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  gray: '#F0F0F0',
  white: '#FFFFFF',
  darkGray: '#666666',
  green: '#00AA00',
  red: '#FF0000',
};

// Task interface теперь импортируется из recommendationEngine

export default function ActionPlanScreen({ route, navigation }: { route?: any; navigation?: any }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
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
    if (route?.params?.activeTab) {
      setActiveTab(route.params.activeTab);
    }
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
      case 'high': return COLORS.red;
      case 'medium': return COLORS.orange;
      case 'low': return COLORS.blue;
      default: return COLORS.darkGray;
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

  const filteredTasks = tasks.filter(task => {
    switch (activeTab) {
      case 'pending': return !task.completed;
      case 'completed': return task.completed;
      default: return true;
    }
  });

  const tasksByBlock = getTasksByBlock(tasks);

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'pending': return tasks.filter(task => !task.completed).length;
      case 'completed': return tasks.filter(task => task.completed).length;
      default: return tasks.length;
    }
  };

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
        {tasks.length > 0 && (
          <View style={styles.clearButtonContainer}>
            <AnimatedPressable
              style={styles.clearButton}
              onPress={clearAllTasks}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.red} />
            </AnimatedPressable>
          </View>
        )}
      </View>

      {/* Табы */}
      <View style={styles.tabsContainer}>
        <AnimatedPressable
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Все ({getTabCount('all')})
          </Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            В работе ({getTabCount('pending')})
          </Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Выполнены ({getTabCount('completed')})
          </Text>
        </AnimatedPressable>
      </View>

      {/* Подзаголовок под табами */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>
          Всего задач: {tasks.length} | Выполнено: {tasks.filter(t => t.completed).length}
        </Text>
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
                        <Ionicons name="alert-circle" size={14} color={COLORS.red} />
                        <Text style={[styles.recommendationStatText, { color: COLORS.red }]}>
                          {blockPriority.highPriorityTasks} высокий приоритет
                        </Text>
                      </View>
                    )}
                    {blockPriority.mediumPriorityTasks > 0 && (
                      <View style={styles.recommendationStat}>
                        <Ionicons name="information-circle" size={14} color={COLORS.orange} />
                        <Text style={[styles.recommendationStatText, { color: COLORS.orange }]}>
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
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.blue,
  },
  header: {
    padding: 12,
    paddingTop: 40,
    backgroundColor: COLORS.gray,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    marginBottom: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.blue,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  clearButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.red,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 8,
  },
  subtitleContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.orange,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.orange,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.blue,
  },
  activeTabText: {
    color: COLORS.white,
  },
  tasksContainer: {
    padding: 12,
  },
  taskCard: {
    backgroundColor: COLORS.gray,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.blue,
  },
  taskCardCompleted: {
    backgroundColor: '#F0F8F0',
    borderLeftColor: COLORS.green,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 3,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.darkGray,
  },
  taskDescription: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 6,
    lineHeight: 16,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  dueDate: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  blocksContainer: {
    margin: 20,
    backgroundColor: COLORS.gray,
    padding: 16,
    borderRadius: 12,
  },
  blocksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 16,
  },
  blockProgress: {
    marginBottom: 12,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.blue,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
    flex: 1,
  },
  blockProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.orange,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.white,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.orange,
    borderRadius: 4,
  },
  recommendationsContainer: {
    padding: 12,
    marginTop: 8,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 8,
  },
  recommendationsSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 16,
    lineHeight: 20,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.blue,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recommendationNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationBlockTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 8,
  },
  recommendationStats: {
    gap: 6,
  },
  recommendationStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recommendationStatText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationTotalTasks: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 4,
  },
  emptyRecommendations: {
    padding: 32,
    alignItems: 'center',
  },
  emptyRecommendationsText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
});
