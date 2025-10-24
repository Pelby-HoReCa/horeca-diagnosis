import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  gray: '#F0F0F0',
  white: '#FFFFFF',
  darkGray: '#666666',
  red: '#FF0000',
  green: '#00AA00',
};

interface BlockResult {
  id: string;
  title: string;
  score: number;
}

interface Comparison {
  previous: number;
  current: number;
}

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export default function DashboardScreen() {
  const [restaurantName, setRestaurantName] = useState('Название ресторана');
  const [blockResults, setBlockResults] = useState<BlockResult[]>([]);
  const [comparison, setComparison] = useState<Comparison>({ previous: 45, current: 72 });
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Загружаем данные из AsyncStorage
      const storedTasks = await AsyncStorage.getItem('actionPlanTasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        setTasks(parsedTasks.slice(0, 3)); // Показываем только первые 3 задачи
      }

      // Моковые данные для блоков
      setBlockResults([
        { id: 'economy', title: 'Экономика', score: 75 },
        { id: 'production', title: 'Производство', score: 80 },
        { id: 'team', title: 'Команда', score: 65 },
        { id: 'delivery', title: 'Доставка', score: 70 },
        { id: 'service', title: 'Сервис', score: 85 },
        { id: 'sales', title: 'Продажи', score: 60 },
      ]);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const BlockCard = ({ block }: { block: BlockResult }) => (
    <View style={styles.blockCard}>
      <Text style={styles.blockTitle}>{block.title}</Text>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${block.score}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{block.score}%</Text>
      </View>
    </View>
  );

  const TaskItem = ({ task }: { task: Task }) => (
    <View style={styles.taskItem}>
      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle}>{task.title}</Text>
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

  return (
    <ScrollView style={styles.container}>
      {/* Название ресторана */}
      <View style={styles.restaurantNameContainer}>
        <Text style={styles.restaurantName}>{restaurantName}</Text>
      </View>

      {/* Результаты по блокам */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Результаты по блокам</Text>
        <View style={styles.blocksGrid}>
          {blockResults.map((block) => (
            <BlockCard key={block.id} block={block} />
          ))}
        </View>
      </View>

      {/* Сравнение было/стало */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Сравнение эффективности</Text>
        <View style={styles.comparisonContainer}>
          <View style={styles.comparisonItem}>
            <Text style={[styles.comparisonValue, { color: COLORS.red }]}>{comparison.previous}%</Text>
            <Text style={styles.comparisonLabel}>БЫЛО</Text>
          </View>
          <View style={styles.comparisonItem}>
            <Text style={[styles.comparisonValue, { color: COLORS.green }]}>{comparison.current}%</Text>
            <Text style={styles.comparisonLabel}>СТАЛО</Text>
          </View>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  restaurantNameContainer: {
    backgroundColor: COLORS.orange,
    padding: 20,
    marginTop: 50,
    marginHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 15,
  },
  blocksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  blockCard: {
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    width: '48%',
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.white,
    borderRadius: 4,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.orange,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.blue,
  },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.gray,
    padding: 20,
    borderRadius: 12,
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.blue,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 4,
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
