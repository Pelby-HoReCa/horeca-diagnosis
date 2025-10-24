import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  gray: '#F0F0F0',
  white: '#FFFFFF',
  darkGray: '#666666',
};

interface Block {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function SelfDiagnosisBlocksScreen() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'questionnaire' | 'confirm' | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);

  useEffect(() => {
    loadBlocks();
  }, []);

  // Принудительная инициализация блоков, если они пустые
  useEffect(() => {
    if (!loading && blocks.length === 0) {
      console.log('Блоки пустые, принудительно инициализируем...');
      const defaultBlocks: Block[] = [
        { id: 'economy', title: 'Экономика', description: 'Финансовые показатели и эффективность', completed: false },
        { id: 'production', title: 'Производство', description: 'Операционные процессы и качество', completed: false },
        { id: 'team', title: 'Команда', description: 'Управление персоналом и мотивация', completed: false },
        { id: 'delivery', title: 'Доставка', description: 'Логистика и доставка', completed: false },
        { id: 'service', title: 'Сервис', description: 'Качество обслуживания клиентов', completed: false },
        { id: 'sales', title: 'Продажи', description: 'Маркетинг и продажи', completed: false },
      ];
      setBlocks(defaultBlocks);
    }
  }, [loading, blocks.length]);

  const loadBlocks = async () => {
    try {
      console.log('Загружаем блоки диагностики...');
      const storedBlocks = await AsyncStorage.getItem('diagnosisBlocks');
      console.log('Сохраненные блоки:', storedBlocks);
      
      if (storedBlocks) {
        const parsedBlocks = JSON.parse(storedBlocks);
        console.log('Парсированные блоки:', parsedBlocks);
        setBlocks(parsedBlocks);
      } else {
        // Инициализируем блоки по умолчанию
        const defaultBlocks: Block[] = [
          { id: 'economy', title: 'Экономика', description: 'Финансовые показатели и эффективность', completed: false },
          { id: 'production', title: 'Производство', description: 'Операционные процессы и качество', completed: false },
          { id: 'team', title: 'Команда', description: 'Управление персоналом и мотивация', completed: false },
          { id: 'delivery', title: 'Доставка', description: 'Логистика и доставка', completed: false },
          { id: 'service', title: 'Сервис', description: 'Качество обслуживания клиентов', completed: false },
          { id: 'sales', title: 'Продажи', description: 'Маркетинг и продажи', completed: false },
        ];
        console.log('Инициализируем блоки по умолчанию:', defaultBlocks);
        setBlocks(defaultBlocks);
        await AsyncStorage.setItem('diagnosisBlocks', JSON.stringify(defaultBlocks));
        console.log('Блоки сохранены в AsyncStorage');
      }
    } catch (error) {
      console.error('Ошибка загрузки блоков:', error);
      // В случае ошибки показываем блоки по умолчанию
      const defaultBlocks: Block[] = [
        { id: 'economy', title: 'Экономика', description: 'Финансовые показатели и эффективность', completed: false },
        { id: 'production', title: 'Производство', description: 'Операционные процессы и качество', completed: false },
        { id: 'team', title: 'Команда', description: 'Управление персоналом и мотивация', completed: false },
        { id: 'delivery', title: 'Доставка', description: 'Логистика и доставка', completed: false },
        { id: 'service', title: 'Сервис', description: 'Качество обслуживания клиентов', completed: false },
        { id: 'sales', title: 'Продажи', description: 'Маркетинг и продажи', completed: false },
      ];
      setBlocks(defaultBlocks);
    } finally {
      console.log('Загрузка завершена, устанавливаем loading = false');
      setLoading(false);
    }
  };

  const saveBlocks = async (updatedBlocks: Block[]) => {
    try {
      await AsyncStorage.setItem('diagnosisBlocks', JSON.stringify(updatedBlocks));
    } catch (error) {
      console.error('Ошибка сохранения блоков:', error);
    }
  };

  const handleBlockPress = (block: Block) => {
    console.log(`Начинаем диагностику блока: ${block.title}`);
    setSelectedBlock(block);
    
    if (!questionnaireCompleted) {
      // Предлагаем сначала пройти анкетирование
      setModalType('questionnaire');
      setShowModal(true);
    } else {
      // Показываем подтверждение
      setModalType('confirm');
      setShowModal(true);
    }
  };

  const handleQuestionnaireComplete = () => {
    setQuestionnaireCompleted(true);
    setShowModal(false);
    setModalType(null);
    // Переходим к подтверждению
    setModalType('confirm');
    setShowModal(true);
  };

  const handleQuestionnaireSkip = () => {
    setQuestionnaireCompleted(true);
    setShowModal(false);
    setModalType(null);
    // Убираем подтверждение - сразу показываем блоки
  };

  const handleConfirmStart = () => {
    if (!selectedBlock) return;
    
    // Симулируем неправильные ответы для генерации задач
    const mockAnswers = {
      'q1': 'poor', // Неправильный ответ
      'q2': 'no',   // Неправильный ответ
      'q3': 'rarely' // Неправильный ответ
    };
    
    // Импортируем функцию генерации задач
    import('../utils/recommendationEngine').then(({ generateTasksFromAnswers }) => {
      const generatedTasks = generateTasksFromAnswers(selectedBlock.id, mockAnswers);
      console.log('Сгенерированные задачи для блока', selectedBlock.id, ':', generatedTasks);
      
      // Сохраняем задачи
      if (generatedTasks.length > 0) {
        AsyncStorage.getItem('actionPlanTasks').then(existingTasks => {
          const existingTasksArray = existingTasks ? JSON.parse(existingTasks) : [];
          const newTasks = [...existingTasksArray, ...generatedTasks];
          AsyncStorage.setItem('actionPlanTasks', JSON.stringify(newTasks));
          console.log('Задачи сохранены:', newTasks);
        });
      }
    });
    
    // Отмечаем блок как пройденный
    const updatedBlocks = blocks.map(b => 
      b.id === selectedBlock.id ? { ...b, completed: true } : b
    );
    setBlocks(updatedBlocks);
    saveBlocks(updatedBlocks);
    
    setShowModal(false);
    setModalType(null);
    setSelectedBlock(null);
  };

  const handleCancel = () => {
    setShowModal(false);
    setModalType(null);
    setSelectedBlock(null);
  };

  const renderBlock = ({ item }: { item: Block }) => (
    <TouchableOpacity
      style={[
        styles.blockCard,
        item.completed && styles.blockCardCompleted
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
    </TouchableOpacity>
  );

  const completedCount = blocks.filter(block => block.completed).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Блоки самодиагностики</Text>
        <Text style={styles.progress}>
          Пройдено: {completedCount} из {blocks.length}
        </Text>
        
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            // Показываем блоки сразу без модальных окон
            setQuestionnaireCompleted(true);
          }}
        >
          <Text style={styles.startButtonText}>Начать диагностику</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.blocksContainer}>
        <Text style={styles.blocksTitle}>Выберите блок для диагностики:</Text>
        {blocks.length > 0 ? (
          <FlatList
            data={blocks}
            renderItem={renderBlock}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <Text style={styles.emptyText}>Блоки не загружены</Text>
        )}
      </View>

      {/* Модальное окно для анкетирования */}
      <Modal
        visible={showModal && modalType === 'questionnaire'}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Анкетирование</Text>
            <Text style={styles.modalText}>
              Для более точной диагностики рекомендуем заполнить анкету с основными данными о вашем ресторане.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={handleQuestionnaireSkip}
              >
                <Text style={styles.secondaryButtonText}>Пропустить</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={handleQuestionnaireComplete}
              >
                <Text style={styles.primaryButtonText}>Заполнить анкету</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Модальное окно для подтверждения */}
      <Modal
        visible={showModal && modalType === 'confirm'}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Подтверждение</Text>
            <Text style={styles.modalText}>
              Вы уверены, что хотите начать диагностику блока "{selectedBlock?.title}"?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={handleCancel}
              >
                <Text style={styles.secondaryButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={handleConfirmStart}
              >
                <Text style={styles.primaryButtonText}>Начать диагностику</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: COLORS.gray,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 8,
  },
  progress: {
    fontSize: 16,
    color: COLORS.orange,
    fontWeight: '600',
    marginBottom: 16,
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
  blocksContainer: {
    flex: 1,
    padding: 20,
  },
  blocksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 16,
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
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
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
    padding: 20,
  },
  blockCard: {
    backgroundColor: COLORS.gray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 120,
  },
  blockCardCompleted: {
    backgroundColor: '#FFF4E6',
    borderColor: COLORS.orange,
    borderWidth: 2,
    shadowColor: COLORS.orange,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.blue,
    flex: 1,
  },
  blockDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
});
