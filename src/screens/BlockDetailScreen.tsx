import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { DEFAULT_BLOCKS, DiagnosisBlock } from '../data/diagnosisBlocks';
import { Task } from '../utils/recommendationEngine';

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
      const storedTasks = await AsyncStorage.getItem('actionPlanTasks');
      if (storedTasks) {
        const allTasks = JSON.parse(storedTasks);
        const blockTasks = allTasks.filter((t: Task) => t.blockId === blockId);
        setTasks(blockTasks);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных блока:', error);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const storedTasks = await AsyncStorage.getItem('actionPlanTasks');
      if (storedTasks) {
        const allTasks: Task[] = JSON.parse(storedTasks);
        const updatedTasks = allTasks.map(task => 
          task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        await AsyncStorage.setItem('actionPlanTasks', JSON.stringify(updatedTasks));
        
        // Обновляем локальное состояние
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
        return COLORS.red;
      case 'medium':
        return COLORS.orange;
      case 'low':
        return COLORS.blue;
      default:
        return COLORS.darkGray;
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
              <Ionicons name="arrow-back" size={24} color={COLORS.blue} />
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
                <Ionicons name="trending-up" size={16} color={COLORS.green} />
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
                      color={task.completed ? COLORS.green : COLORS.blue} 
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
                    <Ionicons name="checkmark" size={16} color={COLORS.green} />
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
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 50,
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
    justifyContent: 'space-between',
    minHeight: 60,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
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
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.blue,
  },
  resultContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
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
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.orange,
  },
  potentialGrowthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
    justifyContent: 'center',
  },
  potentialGrowthText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.green,
    marginLeft: 6,
    textAlign: 'center',
  },
  tasksSection: {
    padding: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 16,
  },
  taskCard: {
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
  taskCardCompleted: {
    backgroundColor: '#F0F8F0',
    borderColor: COLORS.green,
    opacity: 0.9,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  taskTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.blue,
    lineHeight: 22,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.darkGray,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 8,
  },
  taskDescriptionCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.darkGray,
    opacity: 0.7,
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.green,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.green,
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
});

