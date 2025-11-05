import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { getTasksByBlock, Task } from '../utils/recommendationEngine';

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

export default function ActionPlanScreen({ route }: { route?: any }) {
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
      const storedTasks = await AsyncStorage.getItem('actionPlanTasks');
      
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        console.log('=== ЗАГРУЗКА ЗАДАЧ В ЭКШЕН ПЛАНЕ ===');
        console.log('Найдены задачи в хранилище:', parsedTasks.length);
        console.log('Сырые задачи:', parsedTasks);
        const tasksWithDefaults = parsedTasks.map((task: any, index: number) => ({
          ...task,
          id: task.id || `task_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
          completed: task.completed || false,
        }));
        setTasks(tasksWithDefaults);
        console.log('Загружены задачи:', tasksWithDefaults.map((t: Task) => ({ id: t.id, title: t.title, blockId: t.blockId })));
        console.log('=== КОНЕЦ ЗАГРУЗКИ ЗАДАЧ ===');
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
      
      // Загружаем существующие задачи
      const storedTasks = await AsyncStorage.getItem('actionPlanTasks');
      
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        console.log('Найдены задачи в хранилище:', parsedTasks.length);
        const tasksWithDefaults = parsedTasks.map((task: any, index: number) => ({
          ...task,
          id: task.id || `task_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
          completed: task.completed || false,
        }));
        setTasks(tasksWithDefaults);
        console.log('Загружены задачи:', tasksWithDefaults.map((t: Task) => ({ id: t.id, title: t.title, blockId: t.blockId })));
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
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      await AsyncStorage.setItem('actionPlanTasks', JSON.stringify(updatedTasks));
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
        <Text style={styles.subtitle}>
          Всего задач: {tasks.length} | Выполнено: {tasks.filter(t => t.completed).length}
        </Text>
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
            Готово ({getTabCount('completed')})
          </Text>
        </AnimatedPressable>
      </View>

      {/* Блоки с прогрессом */}
      {Object.keys(tasksByBlock).length > 0 && (
        <View style={styles.blocksContainer}>
          <Text style={styles.blocksTitle}>Прогресс по блокам</Text>
          {Object.entries(tasksByBlock).map(([blockId, blockData]) => (
            <View key={blockId} style={styles.blockProgress}>
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
            </View>
          ))}
        </View>
      )}

      {/* Список задач */}
      <View style={styles.tasksContainer}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <View key={task.id} style={[styles.taskCard, task.completed && styles.taskCardCompleted]}>
              <View style={styles.taskHeader}>
                <AnimatedPressable
                  style={styles.checkbox}
                  onPress={() => toggleTaskCompletion(task.id)}
                >
                  <Ionicons
                    name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={task.completed ? COLORS.green : COLORS.blue}
                  />
                </AnimatedPressable>
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                    {task.title}
                  </Text>
                  <Text style={styles.taskDescription}>{task.description}</Text>
                  <View style={styles.taskMeta}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                      <Text style={styles.priorityText}>{getPriorityText(task.priority)}</Text>
                    </View>
                    <Text style={styles.dueDate}>{task.dueDate}</Text>
                  </View>
                </View>
                <AnimatedPressable
                  style={styles.deleteButton}
                  onPress={() => deleteTask(task.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.darkGray} />
                </AnimatedPressable>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.darkGray} />
            <Text style={styles.emptyText}>
              {activeTab === 'all' ? 'Нет задач' : 
               activeTab === 'pending' ? 'Нет задач в работе' : 
               'Нет выполненных задач'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'all' ? 
                'Задачи появятся после прохождения блоков диагностики с неправильными ответами' :
                activeTab === 'pending' ? 
                'Все задачи выполнены или еще не созданы' :
                'Выполненных задач пока нет'
              }
            </Text>
          </View>
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
    fontSize: 18,
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
  subtitle: {
    fontSize: 14,
    color: COLORS.orange,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
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
});
