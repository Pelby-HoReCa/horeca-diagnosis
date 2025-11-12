import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { DEFAULT_BLOCKS, DiagnosisBlock } from '../data/diagnosisBlocks';
import { Task } from '../utils/recommendationEngine';
import { getCurrentUserId, loadUserBlocks, loadUserTasks, saveUserTasks } from '../utils/userDataStorage';
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
  const [allBlocks, setAllBlocks] = useState<DiagnosisBlock[]>([]);
  const [pressedButton, setPressedButton] = useState<'prev' | 'next' | null>(null);
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
      // Загружаем данные блока из хранилища (пользовательского или глобального)
      const userId = await getCurrentUserId();
      let storedBlocks: DiagnosisBlock[] | null = null;
      
      if (userId) {
        storedBlocks = await loadUserBlocks(userId);
      }
      
      if (!storedBlocks) {
        const globalBlocks = await AsyncStorage.getItem('diagnosisBlocks');
        if (globalBlocks) {
          storedBlocks = JSON.parse(globalBlocks);
        }
      }

      // Объединяем DEFAULT_BLOCKS с сохраненными данными
      const mergedBlocks = DEFAULT_BLOCKS.map(defaultBlock => {
        const foundBlock = storedBlocks?.find(b => b.id === defaultBlock.id);
        if (foundBlock) {
          return {
            ...defaultBlock,
            ...foundBlock,
            title: defaultBlock.title,
            description: defaultBlock.description,
          };
        }
        return defaultBlock;
      });

      setAllBlocks(mergedBlocks);

      // Находим текущий блок
      const foundBlock = mergedBlocks.find(b => b.id === blockId);
      if (foundBlock) {
        setBlock(foundBlock);
      }

      // Загружаем задачи для этого блока
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
        return palette.primaryBlue; // Синий для высокого приоритета
      case 'medium':
        return palette.primaryOrange; // Оранжевый для среднего приоритета
      case 'low':
        return palette.error; // Красный для низкого приоритета
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

  const getEfficiencyColor = (efficiency?: number): string => {
    if (efficiency === undefined || efficiency === null) {
      return palette.gray600;
    }
    
    // Чем ниже эффективность, тем тревожнее цвет
    if (efficiency >= 80) {
      // Высокая эффективность - зеленый
      return palette.success;
    } else if (efficiency >= 60) {
      // Средняя эффективность - синий
      return palette.primaryBlue;
    } else if (efficiency >= 40) {
      // Низкая эффективность - оранжевый
      return palette.primaryOrange;
    } else {
      // Очень низкая эффективность - красный
      return palette.error;
    }
  };

  const capitalizeFirstLetter = (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollButton(offsetY > 500);
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const navigateToBlock = (direction: 'prev' | 'next') => {
    if (allBlocks.length === 0 || !block) return;

    const currentIndex = allBlocks.findIndex(b => b.id === block.id);
    if (currentIndex === -1) return;

    let targetIndex: number;
    if (direction === 'prev') {
      targetIndex = currentIndex > 0 ? currentIndex - 1 : allBlocks.length - 1;
    } else {
      targetIndex = currentIndex < allBlocks.length - 1 ? currentIndex + 1 : 0;
    }

    const targetBlock = allBlocks[targetIndex];
    if (targetBlock) {
      navigation.replace('BlockDetail', { blockId: targetBlock.id });
    }
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
  // Показываем разницу между 100% и текущей эффективностью
  // Это значение должно обновляться при изменении текущего результата
  const pendingTasks = tasks.filter(task => !task.completed);
  // Потенциальный прирост = 100% - текущая эффективность
  // Показываем только если блок завершен и есть невыполненные задачи
  const potentialGrowth = block.completed && efficiency !== undefined && tasks.length > 0 && pendingTasks.length > 0
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
            <View style={styles.headerTitleContainer}>
              <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
              <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {block.title}
              </Text>
            </View>
          </View>
          <View style={styles.resultContainer}>
            <AnimatedPressable
              style={styles.homeButton}
              onPress={() => {
                // Переходим на главный экран с диаграммой
                navigation.navigate('DashboardMain');
              }}
            >
              <Text style={styles.homeButtonText}>На главную</Text>
            </AnimatedPressable>
            <View style={styles.resultContent}>
              <Text style={styles.resultLabel}>Текущий результат</Text>
              <View style={styles.resultValueContainer}>
                <AnimatedPressable
                  style={[
                    styles.navButton,
                    pressedButton === 'prev' && styles.navButtonPressed
                  ]}
                  onPressIn={() => setPressedButton('prev')}
                  onPressOut={() => setPressedButton(null)}
                  onPress={() => {
                    setPressedButton(null);
                    navigateToBlock('prev');
                  }}
                >
                  <Ionicons 
                    name="arrow-back-outline" 
                    size={18} 
                    color={pressedButton === 'prev' ? palette.primaryOrange : palette.primaryBlue} 
                  />
                </AnimatedPressable>
                <Text style={[styles.resultValue, { color: block.completed && efficiency !== undefined ? getEfficiencyColor(efficiency) : palette.gray600 }]}>
                  {block.completed && efficiency !== undefined ? `${efficiency}%` : '—'}
                </Text>
                <AnimatedPressable
                  style={[
                    styles.navButton,
                    pressedButton === 'next' && styles.navButtonPressed
                  ]}
                  onPressIn={() => setPressedButton('next')}
                  onPressOut={() => setPressedButton(null)}
                  onPress={() => {
                    setPressedButton(null);
                    navigateToBlock('next');
                  }}
                >
                  <Ionicons 
                    name="arrow-forward-outline" 
                    size={18} 
                    color={pressedButton === 'next' ? palette.primaryOrange : palette.primaryBlue} 
                  />
                </AnimatedPressable>
              </View>
              {potentialGrowth > 0 && (
                <View style={styles.potentialGrowthContainer}>
                  <Ionicons name="trending-up" size={16} color={palette.success} />
                  <Text style={styles.potentialGrowthText}>
                    +{potentialGrowth}% эффективности при выполнении всех задач в блоке
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Задачи */}
        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>
            План работ ({tasks.length})
          </Text>
          
          {tasks.length > 0 ? (
            (() => {
              // Сортируем задачи по приоритету: high -> medium -> low
              const priorityOrder = { high: 0, medium: 1, low: 2 };
              const sortedTasks = [...tasks].sort((a, b) => {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
              });
              
              return sortedTasks.map((task, index) => (
              <AnimatedPressable
                key={task.id}
                style={[
                  styles.taskCard,
                  task.completed && styles.taskCardCompleted
                ]}
                onPress={() => toggleTaskCompletion(task.id)}
              >
                <View style={styles.taskOrderBadgeTopLeft}>
                  <Text style={styles.taskOrderText}>{index + 1}</Text>
                </View>
                <View style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(task.priority) }
                ]}>
                  <Text style={styles.priorityText}>
                    {getPriorityLabel(task.priority)}
                  </Text>
                </View>
                <View style={styles.taskHeader}>
                  <View style={styles.taskTitleContainer}>
                    <Text 
                      style={[
                        styles.taskTitle,
                        task.completed && styles.taskTitleCompleted
                      ]}
                    >
                      {capitalizeFirstLetter(task.title)}
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
              ));
            })()
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Плана работ пока нет</Text>
              <Text style={styles.emptySubtext}>
                Пройдите диагностику этого блока, чтобы получить план работ
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    maxWidth: '100%',
  },
  headerLogo: {
    width: 24,
    height: 24,
    marginRight: spacing.xs,
    flexShrink: 0,
  },
  headerTitle: {
    ...typography.heading2,
    color: palette.primaryBlue,
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 26,
  },
  resultContainer: {
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: palette.primaryBlue,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
    position: 'relative',
    overflow: 'visible',
  },
  resultContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  homeButton: {
    position: 'absolute',
    top: -2,
    right: -2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: palette.primaryBlue,
    borderTopRightRadius: radii.lg,
    borderTopLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: radii.sm,
    zIndex: 10,
    elevation: 10,
  },
  homeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.white,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.primaryBlue,
    marginBottom: spacing.xs,
  },
  resultValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    width: '100%',
    paddingHorizontal: spacing.xs,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.sm,
    width: 45,
    height: 45,
    flexShrink: 0,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: palette.primaryBlue,
  },
  navButtonPressed: {
    backgroundColor: palette.primaryOrange,
    borderColor: palette.primaryOrange,
  },
  resultValue: {
    fontSize: 48,
    fontWeight: '700',
    minWidth: 120,
    textAlign: 'center',
    flex: 1,
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
    marginHorizontal: spacing.md,
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
    borderWidth: 2,
    borderColor: palette.primaryBlue,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
    position: 'relative',
  },
  taskCardCompleted: {
    backgroundColor: '#F0FAF5',
    borderColor: palette.success,
    opacity: 0.95,
  },
  taskHeader: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingTop: 8,
    paddingHorizontal: spacing.sm,
  },
  taskOrderBadgeTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 32,
    height: 32,
    backgroundColor: palette.primaryOrange,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  taskOrderText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.white,
  },
  taskTitleContainer: {
    width: '100%',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.primaryBlue,
    lineHeight: 24,
    textAlign: 'center',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: palette.gray500,
  },
  priorityBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopRightRadius: radii.lg,
    borderTopLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: radii.sm,
    zIndex: 1,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.white,
  },
  taskDescription: {
    fontSize: 14,
    color: palette.gray600,
    lineHeight: 20,
    marginBottom: spacing.sm,
    textAlign: 'left',
    paddingHorizontal: spacing.sm,
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

