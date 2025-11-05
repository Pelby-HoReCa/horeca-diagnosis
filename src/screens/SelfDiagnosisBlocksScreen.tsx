import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { DEFAULT_BLOCKS, DiagnosisBlock } from '../data/diagnosisBlocks';

const logo = require('../../assets/images/1111.png');

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  gray: '#F0F0F0',
  white: '#FFFFFF',
  darkGray: '#666666',
};

export default function SelfDiagnosisBlocksScreen({ navigation }: any) {
  const [blocks, setBlocks] = useState<DiagnosisBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'questionnaire' | 'confirm' | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<DiagnosisBlock | null>(null);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    console.log('Компонент загружен, инициализируем...');
    loadBlocks();
    checkQuestionnaireStatus();
  }, []);

  // Обновляем блоки при возврате на экран (БЕЗ очистки данных)
  useFocusEffect(
    useCallback(() => {
      console.log('Экран блоков получил фокус, обновляем блоки...');
      loadBlocksWithoutClearing();
    }, [])
  );


  const loadBlocksWithoutClearing = async () => {
    try {
      console.log('Загружаем блоки без очистки...');
      const storedBlocks = await AsyncStorage.getItem('diagnosisBlocks');
      
      if (storedBlocks) {
        const parsedBlocks = JSON.parse(storedBlocks);
        console.log('Найдены блоки в хранилище:', parsedBlocks.length);
        console.log('Статус блоков:', parsedBlocks.map((b: DiagnosisBlock) => ({ id: b.id, completed: b.completed })));
        // Объединяем загруженные блоки с дефолтными, чтобы показать все блоки
        const allBlocks = DEFAULT_BLOCKS.map(defaultBlock => {
          const foundBlock = parsedBlocks.find((b: DiagnosisBlock) => b.id === defaultBlock.id);
          return foundBlock || defaultBlock;
        });
        setBlocks(allBlocks);
        console.log('Блоки обновлены в состоянии:', allBlocks.length);
      } else {
        console.log('Блоки не найдены в хранилище');
        // Если блоков нет, инициализируем по умолчанию
        setBlocks(DEFAULT_BLOCKS);
        await AsyncStorage.setItem('diagnosisBlocks', JSON.stringify(DEFAULT_BLOCKS));
        console.log('Инициализированы блоки по умолчанию');
      }
    } catch (error) {
      console.error('Ошибка загрузки блоков:', error);
    }
  };

  const checkQuestionnaireStatus = async () => {
    try {
      console.log('Проверяем статус анкетирования...');
      const status = await AsyncStorage.getItem('questionnaireCompleted');
      if (status === 'true') {
        setQuestionnaireCompleted(true);
        console.log('Анкетирование уже пройдено');
      } else {
        setQuestionnaireCompleted(false);
        console.log('Анкетирование не пройдено');
      }
    } catch (error) {
      console.error('Ошибка проверки статуса анкетирования:', error);
      setQuestionnaireCompleted(false);
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
      
      const storedBlocks = await AsyncStorage.getItem('diagnosisBlocks');
      
      if (storedBlocks) {
        const parsedBlocks = JSON.parse(storedBlocks);
        console.log('Найдены блоки в хранилище:', parsedBlocks.length);
        console.log('Статус блоков:', parsedBlocks.map((b: DiagnosisBlock) => ({ id: b.id, completed: b.completed })));
        // Объединяем загруженные блоки с дефолтными, чтобы показать все блоки
        const allBlocks = DEFAULT_BLOCKS.map(defaultBlock => {
          const foundBlock = parsedBlocks.find((b: DiagnosisBlock) => b.id === defaultBlock.id);
          return foundBlock || defaultBlock;
        });
        setBlocks(allBlocks);
        console.log('Блоки загружены из хранилища');
      } else {
        console.log('Блоки не найдены в хранилище, инициализируем по умолчанию');
        setBlocks(DEFAULT_BLOCKS);
        await AsyncStorage.setItem('diagnosisBlocks', JSON.stringify(DEFAULT_BLOCKS));
        console.log('Инициализированы блоки по умолчанию (все неактивные)');
      }
      
    } catch (error) {
      console.error('Ошибка загрузки блоков:', error);
      // В случае ошибки показываем блоки по умолчанию
      setBlocks(DEFAULT_BLOCKS);
    } finally {
      setLoading(false);
    }
  };

  const saveBlocks = async (updatedBlocks: DiagnosisBlock[]) => {
    try {
      await AsyncStorage.setItem('diagnosisBlocks', JSON.stringify(updatedBlocks));
    } catch (error) {
      console.error('Ошибка сохранения блоков:', error);
    }
  };

  const handleBlockPress = (block: DiagnosisBlock) => {
    console.log('Нажата карточка блока:', block.title);
    console.log('Статус анкетирования:', questionnaireCompleted);
    
    setSelectedBlock(block);
    
    if (!questionnaireCompleted) {
      console.log('Показываем модальное окно анкетирования');
      // Предлагаем сначала пройти анкетирование
      setModalType('questionnaire');
      setShowModal(true);
    } else {
      console.log('Переходим к вопросам блока');
      // Переходим сразу к вопросам
      navigation.navigate('BlockQuestions', { blockId: block.id, blockTitle: block.title });
    }
  };

  const handleQuestionnaireComplete = async () => {
    setQuestionnaireCompleted(true);
    await AsyncStorage.setItem('questionnaireCompleted', 'true');
    setShowModal(false);
    setModalType(null);
    // Переходим к анкетированию
    navigation.navigate('Questionnaire');
  };

  const handleQuestionnaireSkip = async () => {
    console.log('=== ПРОПУСК АНКЕТИРОВАНИЯ ===');
    setQuestionnaireCompleted(true);
    await AsyncStorage.setItem('questionnaireCompleted', 'true');
    setShowModal(false);
    setModalType(null);
    
    // Находим первый незавершенный блок для диагностики
    const firstUncompletedBlock = blocks.find(block => !block.completed);
    
    if (firstUncompletedBlock) {
      console.log('Найден первый незавершенный блок:', firstUncompletedBlock.title);
      setSelectedBlock(firstUncompletedBlock);
      navigation.navigate('BlockQuestions', { 
        blockId: firstUncompletedBlock.id, 
        blockTitle: firstUncompletedBlock.title 
      });
    } else {
      console.log('Все блоки завершены');
      // Если все блоки завершены, показываем сообщение или переходим к результатам
      alert('Все блоки диагностики уже завершены!');
    }
    console.log('=== КОНЕЦ ПРОПУСКА АНКЕТИРОВАНИЯ ===');
  };

  const handleCancel = () => {
    setShowModal(false);
    setModalType(null);
    setSelectedBlock(null);
  };

  const getEfficiencyColor = (efficiency?: number): { bg: string; text: string; border?: string } => {
    if (efficiency === undefined || efficiency === null) {
      return { bg: COLORS.gray, text: COLORS.darkGray };
    }
    
    // Чем ниже эффективность, тем тревожнее цвет (та же логика, что на дашборде)
    if (efficiency >= 80) {
      return { bg: '#E8F5E9', text: '#00AA00', border: '#81C784' };
    } else if (efficiency >= 60) {
      return { bg: '#E3F2FD', text: COLORS.blue, border: '#64B5F6' };
    } else if (efficiency >= 40) {
      return { bg: '#FFF3E0', text: '#F57C00', border: '#FFB74D' };
    } else {
      return { bg: '#FFEBEE', text: '#D32F2F', border: '#E57373' };
    }
  };

  const renderBlock = ({ item }: { item: DiagnosisBlock }) => {
    const colors = getEfficiencyColor(item.efficiency);
    
    return (
      <AnimatedPressable
        style={[
          styles.blockCard,
          { 
            backgroundColor: item.completed ? colors.bg : COLORS.gray,
            borderLeftWidth: item.completed ? 4 : 0,
            borderLeftColor: colors.border || colors.text
          }
        ]}
        onPress={() => handleBlockPress(item)}
      >
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>{item.title}</Text>
          {item.completed && (
            <Ionicons name="checkmark-circle" size={24} color={COLORS.orange} />
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
            <Text style={[styles.efficiencyValue, { color: COLORS.darkGray }]}>—</Text>
            <Text style={[styles.efficiencyLabel, { color: COLORS.darkGray }]}>не пройдено</Text>
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
            <Text style={styles.progress}>
              Пройдено: {completedCount} из {blocks.length}
            </Text>
            
            <AnimatedPressable
              style={styles.startButton}
              onPress={() => {
                console.log('Нажата кнопка "Начать диагностику"');
                console.log('Статус анкетирования:', questionnaireCompleted);
                setModalType('questionnaire');
                setShowModal(true);
              }}
            >
              <Text style={styles.startButtonText}>Начать диагностику</Text>
            </AnimatedPressable>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>Блоки не загружены</Text>
        )}
      />

      {/* Модальное окно для анкетирования */}
      <Modal
        visible={showModal && modalType === 'questionnaire'}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
        onShow={() => console.log('Модальное окно анкетирования показано')}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Расскажите о себе!</Text>
            <Text style={styles.modalText}>
              Для более точной диагностики рекомендуем заполнить анкету с основными данными о вашем ресторане.
            </Text>
            <View style={styles.modalButtons}>
              <AnimatedPressable
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={handleQuestionnaireSkip}
              >
                <Text style={styles.secondaryButtonText}>Пропустить</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={[styles.modalButton, styles.primaryButton]}
                onPress={handleQuestionnaireComplete}
              >
                <Text style={styles.primaryButtonText}>Заполнить</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>
      <ScrollToTopButton onPress={scrollToTop} visible={showScrollButton} />
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
    padding: 12,
    paddingTop: 40,
    backgroundColor: COLORS.gray,
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
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
  progress: {
    fontSize: 16,
    color: COLORS.orange,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  startButton: {
    backgroundColor: COLORS.orange,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: COLORS.orange,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 120,
  },
  primaryButton: {
    backgroundColor: COLORS.orange,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.blue,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  blockCard: {
    backgroundColor: COLORS.gray,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 0,
    minHeight: 110,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.blue,
    flex: 1,
  },
  blockDescription: {
    fontSize: 12,
    color: COLORS.darkGray,
    lineHeight: 16,
    marginBottom: 6,
  },
  efficiencyContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  efficiencyValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  efficiencyLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
});
