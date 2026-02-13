import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Task } from '../utils/recommendationEngine';
import { getCurrentUserId, loadUserBlocks, loadUserTasks } from '../utils/userDataStorage';
import { palette, radii, shadows, spacing, typography } from '../styles/theme';

const logo = require('../../assets/images/logo-pelby.png');

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
      const { completedBlocks, tasksList } = await fetchBlocksAndTasks();
      setResults(completedBlocks);
      setTasks(tasksList);
      console.log('Загружены результаты:', completedBlocks.length);
      console.log('Загружены задачи:', tasksList.length);
    } catch (error) {
      console.error('Ошибка загрузки результатов:', error);
      setResults([]);
      setTasks([]);
    }
  };

  const loadResults = async () => {
    try {
      console.log('Загружаем результаты диагностики...');
      const { completedBlocks, tasksList } = await fetchBlocksAndTasks();
      setResults(completedBlocks);
      setTasks(tasksList);
      console.log('Загружены завершенные блоки:', completedBlocks.length);
      console.log('Загружены задачи:', tasksList.length);
    } catch (error) {
      console.error('Ошибка загрузки результатов:', error);
      setResults([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocksAndTasks = async (): Promise<{ completedBlocks: DiagnosisResult[]; tasksList: Task[] }> => {
    let blocksSource: DiagnosisResult[] = [];
    let tasksSource: Task[] = [];

    try {
      const userId = await getCurrentUserId();

      if (userId) {
        const userBlocks = await loadUserBlocks(userId);
        if (Array.isArray(userBlocks)) {
          blocksSource = userBlocks.filter((block: any) => block.completed);
        }

        const userTasks = await loadUserTasks(userId);
        if (Array.isArray(userTasks)) {
          tasksSource = userTasks;
        }
      }

      if (blocksSource.length === 0) {
        const storedBlocks = await AsyncStorage.getItem('diagnosisBlocks');
        if (storedBlocks) {
          const parsedBlocks = JSON.parse(storedBlocks);
          blocksSource = parsedBlocks.filter((block: any) => block.completed);
        }
      }

      if (tasksSource.length === 0) {
        const storedTasks = await AsyncStorage.getItem('actionPlanTasks');
        if (storedTasks) {
          tasksSource = JSON.parse(storedTasks);
        }
      }
    } catch (error) {
      console.error('Ошибка получения данных для истории:', error);
    }

    return {
      completedBlocks: blocksSource,
      tasksList: tasksSource,
    };
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }


  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollButton(offsetY > 500);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitleContainer}>
              <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
              <Text style={styles.headerTitle} numberOfLines={1}>
                Результаты диагностики
              </Text>
            </View>
          </View>
        </View>

        {results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Завершенные блоки</Text>
            {results.map(item => (
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

        {tasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Сгенерированные задачи</Text>
            {tasks.map(item => (
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

        {results.length === 0 && tasks.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Пока нет результатов</Text>
            <Text style={styles.emptySubtext}>Пройдите диагностику в разделе "Диагностика"</Text>
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    backgroundColor: palette.background,
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
  loadingText: {
    ...typography.body,
    color: palette.primaryBlue,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  section: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading3,
    color: palette.primaryBlue,
    marginBottom: spacing.sm,
  },
  resultCard: {
    backgroundColor: palette.white,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: palette.primaryOrange,
    ...shadows.card,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  resultTitle: {
    ...typography.heading3,
    color: palette.primaryBlue,
    flex: 1,
    marginRight: spacing.sm,
  },
  completedBadge: {
    backgroundColor: palette.primaryOrange,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.white,
  },
  resultDescription: {
    ...typography.body,
    fontSize: 14,
    color: palette.gray600,
    marginBottom: spacing.xs,
  },
  completedAt: {
    ...typography.caption,
    color: palette.gray500,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.heading3,
    color: palette.primaryBlue,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.body,
    fontSize: 14,
    color: palette.gray600,
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: palette.white,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: palette.primaryBlue,
    ...shadows.card,
  },
  taskCardCompleted: {
    backgroundColor: '#F3FFF6',
    borderLeftColor: palette.success,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  taskTitle: {
    ...typography.body,
    fontWeight: '600',
    color: palette.primaryBlue,
    flex: 1,
    marginRight: spacing.sm,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: palette.gray500,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.white,
  },
  taskDescription: {
    ...typography.body,
    fontSize: 14,
    color: palette.gray600,
    marginBottom: spacing.xs,
  },
  taskBlock: {
    ...typography.caption,
    color: palette.gray600,
    fontStyle: 'italic',
  },
});
