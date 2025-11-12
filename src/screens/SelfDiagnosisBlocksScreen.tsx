import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { DEFAULT_BLOCKS, DiagnosisBlock } from '../data/diagnosisBlocks';
import { palette, radii, spacing, typography } from '../styles/theme';
import { getCurrentUserId, loadUserBlocks, saveUserBlocks } from '../utils/userDataStorage';

const logo = require('../../assets/images/1111.png');

export default function SelfDiagnosisBlocksScreen({ navigation }: any) {
  const [blocks, setBlocks] = useState<DiagnosisBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    console.log('Компонент загружен, инициализируем...');
    loadBlocks();
  }, []);

  // Обновляем блоки при возврате на экран (БЕЗ очистки данных)
  useFocusEffect(
    useCallback(() => {
      console.log('Экран блоков получил фокус, обновляем блоки...');
      loadBlocksWithoutClearing();
    }, [])
  );


  const mergeBlocksWithDefaults = (source: DiagnosisBlock[]): DiagnosisBlock[] =>
    DEFAULT_BLOCKS.map(defaultBlock => {
      const storedBlock = source.find(block => block.id === defaultBlock.id);
      return storedBlock ? { ...defaultBlock, ...storedBlock } : defaultBlock;
    });

  const persistBlocks = async (blocksToSave: DiagnosisBlock[]) => {
    try {
      await AsyncStorage.setItem('diagnosisBlocks', JSON.stringify(blocksToSave));
      const userId = await getCurrentUserId();
      if (userId) {
        await saveUserBlocks(userId, blocksToSave);
      }
    } catch (error) {
      console.error('Ошибка сохранения блоков:', error);
    }
  };

  const fetchBlocks = async (): Promise<DiagnosisBlock[]> => {
    let blocksSource: DiagnosisBlock[] = [];

    try {
      const userId = await getCurrentUserId();

      if (userId) {
        const userBlocks = await loadUserBlocks(userId);
        if (Array.isArray(userBlocks) && userBlocks.length) {
          blocksSource = userBlocks;
        }
      }

      if (!blocksSource.length) {
        const storedBlocks = await AsyncStorage.getItem('diagnosisBlocks');
        if (storedBlocks) {
          blocksSource = JSON.parse(storedBlocks);
        }
      }
    } catch (error) {
      console.error('Ошибка получения блоков:', error);
    }

    if (!blocksSource.length) {
      return DEFAULT_BLOCKS;
    }

    return mergeBlocksWithDefaults(blocksSource);
  };

  const loadBlocksWithoutClearing = async () => {
    try {
      console.log('Загружаем блоки без очистки...');
      const allBlocks = await fetchBlocks();
      setBlocks(allBlocks);
      await persistBlocks(allBlocks);
      console.log('Блоки обновлены в состоянии:', allBlocks.length);
    } catch (error) {
      console.error('Ошибка загрузки блоков:', error);
    }
  };


  // Принудительная инициализация блоков, если они пустые
  useEffect(() => {
    if (!loading && blocks.length === 0) {
      setBlocks(DEFAULT_BLOCKS);
    }
  }, [loading, blocks.length]);

  const loadBlocks = async () => {
    try {
      console.log('Загружаем блоки диагностики...');
      const allBlocks = await fetchBlocks();
      setBlocks(allBlocks);
      await persistBlocks(allBlocks);
      console.log('Блоки загружены и сохранены');
    } catch (error) {
      console.error('Ошибка загрузки блоков:', error);
      // В случае ошибки показываем блоки по умолчанию
      setBlocks(DEFAULT_BLOCKS);
    } finally {
      setLoading(false);
    }
  };
  const handleBlockPress = (block: DiagnosisBlock) => {
    console.log('Нажата карточка блока:', block.title);
    // Переходим сразу к вопросам блока
    navigation.navigate('BlockQuestions', { blockId: block.id, blockTitle: block.title });
  };

  const getEfficiencyColor = (efficiency?: number): { bg: string; text: string; border?: string } => {
    if (efficiency === undefined || efficiency === null) {
      return { bg: palette.gray200, text: palette.gray500 };
    }

    if (efficiency >= 80) {
      return { bg: '#E6F7F1', text: palette.success, border: '#81C784' };
    } else if (efficiency >= 60) {
      return { bg: '#E5EBFF', text: palette.primaryBlue, border: '#A7B5FF' };
    } else if (efficiency >= 40) {
      return { bg: '#FFF4E6', text: palette.primaryOrange, border: '#FFBE7B' };
    } else {
      return { bg: '#FFE9EC', text: palette.error, border: '#FF9AA4' };
    }
  };

  const renderBlock = ({ item }: { item: DiagnosisBlock }) => {
    const colors = getEfficiencyColor(item.efficiency);
    
    return (
      <AnimatedPressable
        style={[
          styles.blockCard,
          { 
            backgroundColor: palette.white,
            borderColor: item.completed ? (colors.border || colors.text) : palette.gray200,
            borderLeftWidth: item.completed ? 6 : 1,
            borderLeftColor: colors.border || palette.gray300
          }
        ]}
        onPress={() => handleBlockPress(item)}
      >
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>{item.title}</Text>
          {item.completed && (
            <Ionicons name="checkmark-circle" size={22} color={palette.primaryOrange} />
          )}
        </View>
        <Text style={styles.blockDescription}>{item.description}</Text>
        {item.completed && item.efficiency !== undefined ? (
          <View style={styles.efficiencyContainer}>
            <Text style={[styles.efficiencyValue, { color: colors.text }]}>
              {item.efficiency}%
            </Text>
            <Text style={[styles.efficiencyLabel, { color: colors.text }]}>эффективность</Text>
          </View>
        ) : (
          <View style={styles.efficiencyContainer}>
            <Text style={[styles.efficiencyValue, { color: palette.gray500 }]}>—</Text>
            <Text style={[styles.efficiencyLabel, { color: palette.gray500 }]}>не пройдено</Text>
          </View>
        )}
      </AnimatedPressable>
    );
  };

  const completedCount = blocks.filter(block => block.completed).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollButton(offsetY > 500);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={blocks}
        renderItem={renderBlock}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerTitleContainer}>
                <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
                <Text style={styles.headerTitle} numberOfLines={1}>Блоки самодиагностики</Text>
              </View>
            </View>
            <View style={styles.startButtonContainer}>
              <Text style={styles.progress}>
                Пройдено: {completedCount} из {blocks.length}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>Блоки не загружены</Text>
        )}
      />
      <ScrollToTopButton onPress={scrollToTop} visible={showScrollButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    backgroundColor: palette.background,
    marginBottom: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    marginBottom: spacing.xs,
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
  startButtonContainer: {
    position: 'relative',
    marginTop: spacing.xs,
  },
  progress: {
    fontSize: 14,
    color: palette.primaryOrange,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: spacing.sm,
    paddingRight: spacing.xs,
  },
  emptyText: {
    fontSize: 16,
    color: palette.gray600,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  blockCard: {
    backgroundColor: palette.white,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.gray200,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    minHeight: 120,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  blockTitle: {
    ...typography.heading3,
    color: palette.primaryBlue,
    flex: 1,
  },
  blockDescription: {
    fontSize: 14,
    color: palette.gray600,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  efficiencyContainer: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  efficiencyValue: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  efficiencyLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    color: palette.gray600,
    letterSpacing: 0.5,
  },
});
