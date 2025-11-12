import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { DEFAULT_BLOCKS, DiagnosisBlock } from '../data/diagnosisBlocks';
import { Task } from '../utils/recommendationEngine';
import { getCurrentUserId, loadUserTasks, saveUserTasks } from '../utils/userDataStorage';
import { palette, radii, spacing, typography } from '../styles/theme';

const logo = require('../../assets/images/1111.png');

interface BlockDetailScreenProps {
  route: any;
  navigation: any;
}

export default function BlockDetailScreen({ route, navigation }: BlockDetailScreenProps) {
  const { blockId } = route.params;
  const [block, setBlock] = useState<DiagnosisBlock | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      loadBlockData();
    }, [blockId])
  );

  useEffect(() => {
    loadBlockData();
  }, [blockId]);

  const loadBlockData = async () => {
    try {
      // Находим блок из DEFAULT_BLOCKS
      const foundBlock = DEFAULT_BLOCKS.find(b => b.id === blockId);
      
      // Загружаем данные блока из хранилища
      const storedBlocks = await AsyncStorage.getItem('diagnosisBlocks');
      if (storedBlocks) {
        const blocks = JSON.parse(storedBlocks);
        const storedBlock = blocks.find((b: DiagnosisBlock) => b.id === blockId);
        
        if (storedBlock && foundBlock) {
          setBlock({
            ...foundBlock,
            ...storedBlock,
            title: foundBlock.title,
            description: foundBlock.description,
          });
        } else if (foundBlock) {
          setBlock(foundBlock);
        }
      } else if (foundBlock) {
        setBlock(foundBlock);
      }

      // Загружаем задачи для этого блока
      let allTasks: Task[] = [];
      const userId = await getCurrentUserId();
      if (userId) {
        allTasks = await loadUserTasks(userId);
      }
      if ((!userId || allTasks.length === 0)) {
        const storedTasks = await AsyncStorage.getItem('actionPlanTasks');
        if (storedTasks) {
          allTasks = JSON.parse(storedTasks);
        }
      }
      const blockTasks = allTasks.filter((t: Task) => t.blockId === blockId);
      setTasks(blockTasks);
    } catch (error) {
      console.error('Ошибка загрузки данных блока:', error);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const userId = await getCurrentUserId();
      let allTasks: Task[] = [];
      if (userId) {
        allTasks = await loadUserTasks(userId);
      }
      if ((!userId || allTasks.length === 0)) {
        const storedTasks = await AsyncStorage.getItem('actionPlanTasks');
        if (storedTasks) {
          allTasks = JSON.parse(storedTasks);
        }
      }

      if (allTasks.length > 0) {
        const updatedTasks = allTasks.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        await AsyncStorage.setItem('actionPlanTasks', JSON.stringify(updatedTasks));
        if (userId) {
          await saveUserTasks(userId, updatedTasks);
        }

        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
        );
      }
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Высокий';
      case 'medium':
        return 'Средний';
      case 'low':
        return 'Низкий';
      default:
        return priority;
    }
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollButton(offsetY > 500);
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  if (!block) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Блок не найден</Text>
      </View>
    );
  }

  const efficiency = block.efficiency ?? 0;
  
  // Рассчитываем потенциальный прирост эффективности
  // Если все задачи выполнены, эффективность будет 100%
  const pendingTasks = tasks.filter(task => !task.completed);
  const potentialGrowth = tasks.length > 0 && pendingTasks.length > 0 
    ? Math.max(0, 100 - efficiency) 
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Шапка с результатом */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <AnimatedPressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={palette.primaryBlue} />
            </AnimatedPressable>
            <View style={styles.headerTitleContainer}>
              <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
              <Text style={styles.headerTitle} numberOfLines={1}>{block.title}</Text>
            </View>
            <View style={styles.backButtonPlaceholder} />
          </View>
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Текущий результат</Text>
            <Text style={styles.resultValue}>
              {block.completed && efficiency !== undefined ? `${efficiency}%` : '—'}
            </Text>
            {tasks.length > 0 && pendingTasks.length > 0 && potentialGrowth > 0 && (
              <View style={styles.potentialGrowthContainer}>
                <Ionicons name="trending-up" size={16} color={palette.success} />
                <Text style={styles.potentialGrowthText}>
                  +{potentialGrowth}% эффективности при выполнении всех задач в блоке
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Задачи */}
        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>
            Рекомендации ({tasks.length})
          </Text>
          
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <AnimatedPressable
                key={task.id}
                style={[
                  styles.taskCard,
                  task.completed && styles.taskCardCompleted
                ]}
                onPress={() => toggleTaskCompletion(task.id)}
              >
                <View style={styles.taskHeader}>
                  <View style={styles.taskHeaderLeft}>
                    <Ionicons 
                      name={task.completed ? 'checkmark-circle' : 'ellipse-outline'} 
                      size={24} 
                      color={task.completed ? palette.success : palette.primaryBlue} 
                    />
                    <View style={styles.taskTitleContainer}>
                      <Text 
                        style={[
                          styles.taskTitle,
                          task.completed && styles.taskTitleCompleted
                        ]}
                      >
                        {task.title}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(task.priority) + '20' }
                  ]}>
                    <Text style={[
                      styles.priorityText,
                      { color: getPriorityColor(task.priority) }
                    ]}>
                      {getPriorityLabel(task.priority)}
                    </Text>
                  </View>
                </View>
                
                <Text 
                  style={[
                    styles.taskDescription,
                    task.completed && styles.taskDescriptionCompleted
                  ]}
                >
                  {task.description}
                </Text>
                
                {task.completed && (
                  <View style={styles.completedIndicator}>
                    <Ionicons name="checkmark" size={16} color={palette.success} />
                    <Text style={styles.completedText}>Выполнено</Text>
                  </View>
                )}
              </AnimatedPressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Рекомендаций пока нет</Text>
              <Text style={styles.emptySubtext}>
                Пройдите диагностику этого блока, чтобы получить рекомендации
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
    backgroundColor: palette.background,
  },
  scrollView: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: palette.primaryOrange,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    backgroundColor: palette.background,
  },
  headerTop: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    marginBottom: spacing.md,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: spacing.xs,
    zIndex: 2,
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerLogo: {
    width: 28,
    height: 28,
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.heading2,
    color: palette.primaryBlue,
    flexShrink: 1,
    textAlign: 'center',
  },
  resultContainer: {
    alignItems: 'center',
    backgroundColor: palette.white,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.gray200,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.primaryBlue,
    marginBottom: spacing.xs,
  },
  resultValue: {
    fontSize: 48,
    fontWeight: '700',
    color: palette.primaryOrange,
    marginBottom: spacing.sm,
  },
  potentialGrowthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7F1',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  potentialGrowthText: {
    fontSize: 12,
    color: palette.success,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  tasksSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading3,
    color: palette.primaryBlue,
    marginBottom: spacing.sm,
  },
  taskCard: {
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.gray200,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  taskCardCompleted: {
    backgroundColor: '#F0FAF5',
    borderColor: palette.success,
    opacity: 0.95,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: spacing.sm,
  },
  taskTitleContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primaryBlue,
    lineHeight: 22,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: palette.gray500,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
    backgroundColor: palette.background,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.primaryBlue,
  },
  taskDescription: {
    fontSize: 14,
    color: palette.gray600,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  taskDescriptionCompleted: {
    textDecorationLine: 'line-through',
    color: palette.gray600,
    opacity: 0.7,
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.success,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.success,
    marginLeft: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primaryBlue,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: palette.gray600,
    textAlign: 'center',
    lineHeight: 20,
  },
});

