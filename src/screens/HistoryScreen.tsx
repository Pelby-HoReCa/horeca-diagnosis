import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { Task } from '../utils/recommendationEngine';

const logo = require('../../assets/images/1111.png');

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  gray: '#F0F0F0',
  white: '#FFFFFF',
  darkGray: '#666666',
};

interface DiagnosisResult {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

export default function HistoryScreen() {
  const [results, setResults] = useState<DiagnosisResult[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadResults();
  }, []);

  // Обновляем результаты при возврате на экран (БЕЗ очистки данных)
  useFocusEffect(
    useCallback(() => {
      console.log('Экран "Результаты" получил фокус, обновляем результаты...');
      loadResultsWithoutClearing();
    }, [])
  );

  const loadResultsWithoutClearing = async () => {
    try {
      console.log('Загружаем результаты без очистки...');
      
      // Загружаем блоки
      const storedBlocks = await AsyncStorage.getItem('diagnosisBlocks');
      if (storedBlocks) {
        const blocks = JSON.parse(storedBlocks);
        // Показываем только завершенные блоки
        const completedBlocks = blocks.filter((block: DiagnosisResult) => block.completed);
        setResults(completedBlocks);
        console.log('Загружены результаты:', completedBlocks.length);
      } else {
        setResults([]);
        console.log('Результатов нет');
      }
      
      // Загружаем задачи
      const storedTasks = await AsyncStorage.getItem('actionPlanTasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        setTasks(parsedTasks);
        console.log('Загружены задачи:', parsedTasks.length);
      } else {
        setTasks([]);
        console.log('Задач нет');
      }
      
    } catch (error) {
      console.error('Ошибка загрузки результатов:', error);
      setResults([]);
      setTasks([]);
    }
  };

  const loadResults = async () => {
    try {
      console.log('Загружаем результаты диагностики...');
      
      // Загружаем существующие результаты
      const storedBlocks = await AsyncStorage.getItem('diagnosisBlocks');
      const storedTasks = await AsyncStorage.getItem('actionPlanTasks');
      
      if (storedBlocks) {
        const parsedBlocks = JSON.parse(storedBlocks);
        const completedBlocks = parsedBlocks.filter((block: any) => block.completed);
        setResults(completedBlocks);
        console.log('Загружены завершенные блоки:', completedBlocks.length);
      } else {
        setResults([]);
        console.log('Завершенных блоков нет');
      }
      
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        setTasks(parsedTasks);
        console.log('Загружены задачи:', parsedTasks.length);
      } else {
        setTasks([]);
        console.log('Задач нет');
      }
      
    } catch (error) {
      console.error('Ошибка загрузки результатов:', error);
      setResults([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = ({ item }: { item: DiagnosisResult }) => (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✓ Завершено</Text>
        </View>
      </View>
      <Text style={styles.resultDescription}>{item.description}</Text>
      {item.completedAt && (
        <Text style={styles.completedAt}>Завершено: {item.completedAt}</Text>
      )}
    </View>
  );

  const renderTask = ({ item }: { item: Task }) => (
    <View style={[styles.taskCard, item.completed && styles.taskCardCompleted]}>
      <View style={styles.taskHeader}>
        <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>
          {item.title}
        </Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{getPriorityText(item.priority)}</Text>
        </View>
      </View>
      <Text style={styles.taskDescription}>{item.description}</Text>
      <Text style={styles.taskBlock}>Блок: {item.blockTitle}</Text>
    </View>
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF0000';
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Загрузка...</Text>
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
            <Text style={styles.headerTitle} numberOfLines={1}>Результаты диагностики</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Завершенные блоки: {results.length} | Задач: {tasks.length}
        </Text>
      </View>

      {/* Завершенные блоки */}
      {results.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Завершенные блоки</Text>
          {results.map((item) => (
            <View key={item.id} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓ Завершено</Text>
                </View>
              </View>
              <Text style={styles.resultDescription}>{item.description}</Text>
              {item.completedAt && (
                <Text style={styles.completedAt}>Завершено: {item.completedAt}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Задачи */}
      {tasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Сгенерированные задачи</Text>
          {tasks.map((item) => (
            <View key={item.id} style={[styles.taskCard, item.completed && styles.taskCardCompleted]}>
              <View style={styles.taskHeader}>
                <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>
                  {item.title}
                </Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                  <Text style={styles.priorityText}>{getPriorityText(item.priority)}</Text>
                </View>
              </View>
              <Text style={styles.taskDescription}>{item.description}</Text>
              <Text style={styles.taskBlock}>Блок: {item.blockTitle}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Пустое состояние */}
      {results.length === 0 && tasks.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Пока нет результатов</Text>
          <Text style={styles.emptySubtext}>
            Пройдите диагностику в разделе "Диагностика"
          </Text>
        </View>
      )}
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
  header: {
    padding: 12,
    paddingTop: 40,
    backgroundColor: COLORS.gray,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
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
  subtitle: {
    fontSize: 14,
    color: COLORS.orange,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.blue,
    textAlign: 'center',
  },
  listContainer: {
    padding: 12,
  },
  resultCard: {
    backgroundColor: COLORS.gray,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.orange,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.blue,
    flex: 1,
  },
  completedBadge: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  resultDescription: {
    fontSize: 12,
    color: COLORS.darkGray,
    lineHeight: 16,
    marginBottom: 6,
  },
  completedAt: {
    fontSize: 11,
    color: COLORS.darkGray,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 18,
  },
  section: {
    margin: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 10,
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
    borderLeftColor: '#00AA00',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.blue,
    flex: 1,
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
  taskBlock: {
    fontSize: 11,
    color: COLORS.orange,
    fontWeight: '600',
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
});
