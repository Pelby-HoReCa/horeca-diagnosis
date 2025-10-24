import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getTasksByBlock, Task } from '../utils/recommendationEngine';

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

  useEffect(() => {
    loadTasks();
  }, []);

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
      const storedTasks = await AsyncStorage.getItem('actionPlanTasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        // Убеждаемся, что у всех задач есть уникальный id и completed
        const tasksWithDefaults = parsedTasks.map((task: any, index: number) => ({
          ...task,
          id: task.id || `task_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
          completed: task.completed || false,
        }));
        setTasks(tasksWithDefaults);
      } else {
        // По умолчанию экшен план пустой
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

  const renderTask = ({ item }: { item: Task }) => (
    <View style={[styles.taskCard, item.completed && styles.taskCardCompleted]}>
      <View style={styles.taskHeader}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleTaskCompletion(item.id)}
        >
          <Ionicons
            name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={item.completed ? COLORS.green : COLORS.blue}
          />
        </TouchableOpacity>
        <View style={styles.taskInfo}>
          <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>
            {item.title}
          </Text>
          <Text style={styles.taskDescription}>{item.description}</Text>
          <View style={styles.taskMeta}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{getPriorityText(item.priority)}</Text>
            </View>
            <Text style={styles.dueDate}>{item.dueDate}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteTask(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.darkGray} />
        </TouchableOpacity>
      </View>
    </View>
  );

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>План действий</Text>
        <Text style={styles.subtitle}>
          Всего задач: {tasks.length} | Выполнено: {tasks.filter(t => t.completed).length}
        </Text>
      </View>

      {/* Табы */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Все ({getTabCount('all')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            В работе ({getTabCount('pending')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Готово ({getTabCount('completed')})
          </Text>
        </TouchableOpacity>
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
                  {blockData.completed}/{blockData.total}
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
      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.darkGray} />
            <Text style={styles.emptyText}>
              {activeTab === 'all' ? 'Нет задач' : 
               activeTab === 'pending' ? 'Нет задач в работе' : 
               'Нет выполненных задач'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
    padding: 20,
    paddingTop: 60, // Отступ от островка iPhone
    backgroundColor: COLORS.gray,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.orange,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.blue,
  },
  activeTabText: {
    color: COLORS.white,
  },
  listContainer: {
    padding: 20,
  },
  taskCard: {
    backgroundColor: COLORS.gray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
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
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.darkGray,
  },
  taskDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
    lineHeight: 18,
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
