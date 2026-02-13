import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import AnimatedPressable from '../components/AnimatedPressable';
import BlockGauge from '../components/BlockGauge';
import { DEFAULT_BLOCKS, DiagnosisBlock } from '../data/diagnosisBlocks';
import questionsData from '../data/questions.json';
import { palette, radii, spacing } from '../styles/theme';
import { generateTasksFromAnswers } from '../utils/recommendationEngine';
import { getCurrentUserId } from '../utils/userDataStorage';

const logo = require('../../assets/images/logo-pelby.png');

interface DiagnosisResultsScreenProps {
  selectedBlocks?: string[]; // Список пройденных блоков
  onBack?: () => void;
  onClose?: () => void;
}

const DiagnosisResultsScreen: React.FC<DiagnosisResultsScreenProps> = ({
  selectedBlocks,
  onBack,
  onClose,
}) => {
  const [closeIconSvg, setCloseIconSvg] = useState<string>('');
  const [modalCloseIconSvg, setModalCloseIconSvg] = useState<string>('');
  const [projectAvatarUri, setProjectAvatarUri] = useState<string | null>(null);
  const [checkboxSvg, setCheckboxSvg] = useState<string>('');
  const [infoIconSvg, setInfoIconSvg] = useState<string>('');
  const [directionsArrowSvg, setDirectionsArrowSvg] = useState<string>('');
  const [directionsCloseIconSvg, setDirectionsCloseIconSvg] = useState<string>('');
  const [showEfficiencyModal, setShowEfficiencyModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  // Иконки блоков
  const [coinsIconSvg, setCoinsIconSvg] = useState<string>('');
  const [colorsIconSvg, setColorsIconSvg] = useState<string>('');
  const [chartBarLineIconSvg, setChartBarLineIconSvg] = useState<string>('');
  const [fileIconSvg, setFileIconSvg] = useState<string>('');
  const [marketingIconSvg, setMarketingIconSvg] = useState<string>('');
  const [computerSettingsIconSvg, setComputerSettingsIconSvg] = useState<string>('');
  const [userMultipleIconSvg, setUserMultipleIconSvg] = useState<string>('');
  const [dishWasherIconSvg, setDishWasherIconSvg] = useState<string>('');
  const [legalDocumentIconSvg, setLegalDocumentIconSvg] = useState<string>('');
  const [chartIncreaseIconSvg, setChartIncreaseIconSvg] = useState<string>('');
  const [totalTasksCount, setTotalTasksCount] = useState<number>(0);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState<number>(0);
  const [overallEfficiency, setOverallEfficiency] = useState<number>(0);
  const [blockResults, setBlockResults] = useState<DiagnosisBlock[]>([]);
  const [modalBadgeWidth, setModalBadgeWidth] = useState<number | null>(null);

  // Загружаем вопросы из JSON
  const questions: Record<string, any[]> = {};
  questionsData.forEach((block: any) => {
    questions[block.id] = block.questions;
  });

  // Функция для склонения слова "задача"
  const getTaskWord = (count: number): string => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    // Исключения для 11-14
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'задач';
    }
    
    // 1, 21, 31, 41, 51, 61, 71, 81, 91...
    if (lastDigit === 1) {
      return 'задача';
    }
    
    // 2, 3, 4, 22, 23, 24, 32, 33, 34...
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'задачи';
    }
    
    // 5, 6, 7, 8, 9, 10, 20, 25, 26, 27, 28, 29, 30...
    return 'задач';
  };

  useEffect(() => {
    const loadIcons = async () => {
      // Загружаем крестик для шапки экрана
      try {
        const closeIconAsset = Asset.fromModule(require('../../assets/images/compact-button-icon.svg'));
        await closeIconAsset.downloadAsync();
        if (closeIconAsset.localUri) {
          const response = await fetch(closeIconAsset.localUri);
          const fileContent = await response.text();
          setCloseIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG крестика:', error);
      }

      // Иконка close для модального окна (инлайн SVG, как в дашборде)
      const closeSvg = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.773 3.7125L8.4855 0L9.546 1.0605L5.8335 4.773L9.546 8.4855L8.4855 9.546L4.773 5.8335L1.0605 9.546L0 8.4855L3.7125 4.773L0 1.0605L1.0605 0L4.773 3.7125Z" fill="#525866"/></svg>';
      setModalCloseIconSvg(closeSvg);

      // Загружаем галочку
      try {
        const checkboxAsset = Asset.fromModule(require('../../assets/images/checkbox-checked.svg'));
        await checkboxAsset.downloadAsync();
        if (checkboxAsset.localUri) {
          const response = await fetch(checkboxAsset.localUri);
          const fileContent = await response.text();
          setCheckboxSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG галочки:', error);
      }

      // Загружаем иконку информации
      try {
        const infoAsset = Asset.fromModule(require('../../assets/images/information-line.svg'));
        await infoAsset.downloadAsync();
        if (infoAsset.localUri) {
          const response = await fetch(infoAsset.localUri);
          const fileContent = await response.text();
          setInfoIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки информации:', error);
      }

      // Загружаем иконку стрелки для "По направлениям"
      try {
        const arrowAsset = Asset.fromModule(require('../../assets/images/directions-arrow.svg'));
        await arrowAsset.downloadAsync();
        if (arrowAsset.localUri) {
          const response = await fetch(arrowAsset.localUri);
          const fileContent = await response.text();
          setDirectionsArrowSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG стрелки направлений:', error);
      }

      // Загружаем иконку закрытия для модального окна "По направлениям"
      try {
        const closeIconAsset = Asset.fromModule(require('../../assets/images/directions-close-icon.svg'));
        await closeIconAsset.downloadAsync();
        if (closeIconAsset.localUri) {
          const response = await fetch(closeIconAsset.localUri);
          const fileContent = await response.text();
          setDirectionsCloseIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки закрытия направлений:', error);
      }

      // Загружаем иконки блоков
      const loadBlockIcons = async () => {
        const iconLoaders = [
          { path: require('../../assets/images/coins-icon.svg'), setter: setCoinsIconSvg },
          { path: require('../../assets/images/colors-icon.svg'), setter: setColorsIconSvg },
          { path: require('../../assets/images/chart-bar-line-icon.svg'), setter: setChartBarLineIconSvg },
          { path: require('../../assets/images/file-icon.svg'), setter: setFileIconSvg },
          { path: require('../../assets/images/marketing-icon.svg'), setter: setMarketingIconSvg },
          { path: require('../../assets/images/computer-settings-icon.svg'), setter: setComputerSettingsIconSvg },
          { path: require('../../assets/images/user-multiple-icon.svg'), setter: setUserMultipleIconSvg },
          { path: require('../../assets/images/dish-washer-icon.svg'), setter: setDishWasherIconSvg },
          { path: require('../../assets/images/legal-document-icon.svg'), setter: setLegalDocumentIconSvg },
          { path: require('../../assets/images/chart-increase-icon.svg'), setter: setChartIncreaseIconSvg },
        ];

        for (const loader of iconLoaders) {
          try {
            const asset = Asset.fromModule(loader.path);
            await asset.downloadAsync();
            if (asset.localUri) {
              const response = await fetch(asset.localUri);
              const fileContent = await response.text();
              loader.setter(fileContent);
            }
          } catch (error) {
            console.error('Ошибка загрузки иконки блока:', error);
          }
        }
      };

      await loadBlockIcons();
    };

    const loadProjectAvatar = async () => {
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          const avatarKey = `project_avatar_${userId}`;
          const avatarUri = await AsyncStorage.getItem(avatarKey);
          if (avatarUri) {
            setProjectAvatarUri(avatarUri);
          }
        } else {
          // Если нет userId, пробуем загрузить глобальный аватар
          const globalAvatarUri = await AsyncStorage.getItem('project_avatar');
          if (globalAvatarUri) {
            setProjectAvatarUri(globalAvatarUri);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки аватара проекта:', error);
      }
    };

    loadIcons();
    loadProjectAvatar();
  }, []);

  // Подсчитываем общее количество задач, правильных/неправильных ответов, эффективность и формируем blockResults
  useEffect(() => {
    const calculateTotalTasks = async () => {
      try {
        const blocksToProcess = selectedBlocks && selectedBlocks.length > 0 
          ? selectedBlocks 
          : DEFAULT_BLOCKS.map(block => block.id);
        
        let totalTasks = 0;
        let totalCorrect = 0;
        let totalIncorrect = 0;
        const blocksData: DiagnosisBlock[] = [];

        for (const blockId of blocksToProcess) {
          const block = DEFAULT_BLOCKS.find(b => b.id === blockId);
          if (!block) continue;

          // Загружаем ответы для блока
          const saved = await AsyncStorage.getItem(`diagnosis_answers_${blockId}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            const blockQuestions = questions[blockId] || [];
            const blockAnswers: Record<string, string> = {};
            let blockCorrect = 0;
            let blockIncorrect = 0;
            
            // Формируем объект ответов и считаем правильные/неправильные
            blockQuestions.forEach((question) => {
              const questionKey = `${blockId}_${question.id}`;
              const selectedAnswerId = parsed[questionKey];
              if (selectedAnswerId) {
                const selectedOption = question.options.find((opt: any) => opt.id === selectedAnswerId);
                if (selectedOption && selectedOption.value) {
                  blockAnswers[question.id] = selectedOption.value;
                  
                  // Считаем правильные и неправильные ответы
                  if (selectedOption.correct) {
                    blockCorrect++;
                    totalCorrect++;
                  } else {
                    blockIncorrect++;
                    totalIncorrect++;
                  }
                }
              }
            });
            
            // Рассчитываем эффективность блока
            const blockTotalAnswers = blockCorrect + blockIncorrect;
            const blockEfficiency = blockTotalAnswers > 0 ? Math.round((blockCorrect / blockTotalAnswers) * 100) : 0;
            
            // Генерируем задачи для блока
            const generatedTasks = generateTasksFromAnswers(
              blockId,
              blockAnswers,
              blockQuestions,
              block.title
            );
            
            totalTasks += generatedTasks.length;

            // Добавляем блок в результаты
            blocksData.push({
              ...block,
              completed: true,
              efficiency: blockEfficiency,
              answers: blockAnswers,
            });
          } else {
            // Блок не пройден
            blocksData.push({
              ...block,
              completed: false,
              efficiency: undefined,
            });
          }
        }

        // Дополняем до 10 блоков, если нужно
        while (blocksData.length < DEFAULT_BLOCKS.length) {
          const remainingBlock = DEFAULT_BLOCKS[blocksData.length];
          blocksData.push({
            ...remainingBlock,
            completed: false,
            efficiency: undefined,
          });
        }

        setTotalTasksCount(totalTasks);
        setCorrectAnswers(totalCorrect);
        setIncorrectAnswers(totalIncorrect);
        setBlockResults(blocksData);
        
        // Рассчитываем общую эффективность
        const totalAnswers = totalCorrect + totalIncorrect;
        const efficiency = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
        setOverallEfficiency(efficiency);
      } catch (error) {
        console.error('Ошибка подсчета задач:', error);
      }
    };

    calculateTotalTasks();
  }, [selectedBlocks]);

  // Функция для получения иконки блока
  const getBlockIconSvg = (blockId: string): string | null => {
    const iconMap: Record<string, string | null> = {
      'concept': colorsIconSvg,
      'finance': coinsIconSvg,
      'management': chartBarLineIconSvg,
      'menu': fileIconSvg,
      'marketing': marketingIconSvg,
      'operations': computerSettingsIconSvg,
      'client_experience': userMultipleIconSvg,
      'infrastructure': dishWasherIconSvg,
      'risks': legalDocumentIconSvg,
      'strategy': chartIncreaseIconSvg,
    };
    return iconMap[blockId] || null;
  };

  // Функция для определения цвета эффективности
  const getEfficiencyBadgeColors = (efficiency?: number): { bg: string; text: string } => {
    if (efficiency === undefined || efficiency === null) {
      return { bg: '#F6F8FA', text: '#525866' };
    }
    if (efficiency >= 78) {
      return { bg: '#CBF5E5', text: '#176448' };
    } else if (efficiency >= 38) {
      return { bg: '#FFDAC2', text: '#6E330C' };
    } else {
      return { bg: '#F8C9D2', text: '#710E21' };
    }
  };

  // Отсортированный массив блоков для модального списка — используем повторно в JSX
  const sortedBlockResults = [...blockResults].sort((a, b) => {
    const aEfficiency = a.efficiency !== undefined ? a.efficiency : 0;
    const bEfficiency = b.efficiency !== undefined ? b.efficiency : 0;
    return aEfficiency - bEfficiency;
  });

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Header: Back button, Project icon and Close button */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity 
              onPress={onBack} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#0A0D14" />
            </TouchableOpacity>
          )}
          <View style={styles.projectIconContainer}>
            <View style={styles.avatarContainer}>
              {projectAvatarUri ? (
                <Image source={{ uri: projectAvatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="business" size={54} color={palette.gray400} />
                </View>
              )}
              {/* Галочка в правом нижнем углу, если загружена аватарка */}
              {projectAvatarUri && checkboxSvg && (
                <View style={styles.checkboxContainer}>
                  <SvgXml xml={checkboxSvg} width={27} height={27} />
                </View>
              )}
            </View>
          </View>
          {closeIconSvg && (
            <TouchableOpacity 
              style={styles.closeButton}
              activeOpacity={0.7}
              onPress={onClose || onBack}
            >
              <SvgXml xml={closeIconSvg} width={24} height={24} />
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>Диагностика завершена</Text>

        {/* Description */}
        <Text style={styles.description}>
          Сформировано <Text style={styles.tasksCountHighlight}>{totalTasksCount} {getTaskWord(totalTasksCount)}</Text> для повышения эффективности по ключевым зонам роста.
        </Text>

        {/* Белое поле с метриками */}
        <View style={[styles.section, styles.efficiencySection]}>
          {/* Заголовок с иконками */}
          <View style={styles.efficiencyHeader}>
            <View style={styles.efficiencyTitleContainer}>
              <Text style={styles.efficiencyTitle}>Общая эффективность</Text>
              {infoIconSvg && (
                <AnimatedPressable 
                  style={styles.infoIconButton}
                  onPress={() => setShowEfficiencyModal(true)}
                >
                  <SvgXml xml={infoIconSvg} width={20} height={20} />
                </AnimatedPressable>
              )}
            </View>
            <View style={styles.efficiencyIcons}>
              <TouchableOpacity style={styles.noteButton}>
                <Text style={styles.noteButtonText}>+ Заметка</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Серая полоса под заголовком */}
          <View style={styles.efficiencyDivider} />

          {/* Спидометр */}
          <View style={styles.gaugeContainer}>
            <BlockGauge 
              blockResults={blockResults}
              currentValue={overallEfficiency}
            />
          </View>

          {/* Метрики */}
          <View style={styles.metricsContainer}>
            {/* Слабых блоков */}
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Слабых блоков</Text>
              <View style={[styles.metricBadge, { backgroundColor: '#F8C9D2', minWidth: 35, paddingHorizontal: 6 }]}>
                <Text style={[styles.weakBlocksBadgeText, { color: '#710E21' }]}>
                  {blockResults.filter(b => b.completed && b.efficiency !== undefined && b.efficiency < 78).length}
                </Text>
              </View>
            </View>

            {/* Всего задач */}
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Всего задач</Text>
              <View style={[styles.metricBadge, styles.tasksBadge]}>
                <Text style={styles.tasksBadgeText}>
                  {totalTasksCount}
                </Text>
              </View>
            </View>
            
            {/* Серая полоса */}
            <View style={styles.weakBlocksDivider} />

            {/* По направлениям */}
            <View style={[styles.metricItem, { marginTop: -10 }]}>
              <Text style={styles.metricLabel}>По направлениям</Text>
              {directionsArrowSvg && (
                <TouchableOpacity 
                  style={styles.directionsArrowButton}
                  onPress={() => {
                    setShowDirectionsModal(true);
                  }}
                >
                  <SvgXml xml={directionsArrowSvg} width={22} height={22} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Кнопка "На главную" - абсолютное позиционирование */}
      <View style={styles.homeButtonContainer}>
        <AnimatedPressable
          style={styles.homeButton}
          onPress={() => {
            if (onClose) {
              onClose();
            }
          }}
        >
          <Text style={styles.homeButtonText}>
            На главную
          </Text>
        </AnimatedPressable>
      </View>

      {/* Кнопка "План улучшений" - абсолютное позиционирование */}
      <View style={styles.startButtonContainer}>
        <AnimatedPressable
          style={styles.startButton}
          onPress={() => {
            // TODO: Навигация к плану улучшений
          }}
        >
          <Text style={styles.startButtonText}>
            План улучшений
          </Text>
          <Text style={styles.startButtonQuestionCount} numberOfLines={1}>
            {totalTasksCount} {getTaskWord(totalTasksCount)}
          </Text>
        </AnimatedPressable>
      </View>

      {/* Модальное окно с пояснением эффективности */}
      <Modal
        visible={showEfficiencyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEfficiencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>Как считается эффективность</Text>
              {modalCloseIconSvg && (
                <TouchableOpacity 
                  onPress={() => setShowEfficiencyModal(false)}
                  style={styles.modalCloseButton}
                >
                  <SvgXml xml={modalCloseIconSvg} width={10} height={10} />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalText}>
                Общая эффективность формируется на основе результатов всех диагностических блоков, которые вы прошли. Каждый блок оценивается отдельно — например, финансовая эффективность, операционные процессы, сервис, кухня, персонал и другие направления.
              </Text>
              <Text style={[styles.modalText, styles.modalTextParagraph]}>
                Показатель помогает понять, насколько <Text style={styles.modalTextBold}>сбалансированы процессы</Text> в компании, где вы теряете эффективность и какие направления стоит улучшить в первую очередь. Некоторые блоки влияют на итоговую оценку сильнее — например, финансы, кухня и операционка — так как они относятся к ключевым зонам управления рестораном.
              </Text>
              <View style={[styles.modalLevelsContainer, { marginTop: 20 }]}>
                <View style={styles.modalLevelItem}>
                  <View style={[styles.modalLevelDot, { backgroundColor: '#FF4D57' }]} />
                  <Text style={styles.modalLevelText}>
                    <Text style={styles.modalLevelBold}>0–49%</Text> — критически низкий уровень. Требуются срочные улучшения и выполнение задач по приоритету.
                  </Text>
                </View>
                <View style={styles.modalLevelItem}>
                  <View style={[styles.modalLevelDot, { backgroundColor: '#FFAD1F' }]} />
                  <Text style={styles.modalLevelText}>
                    <Text style={styles.modalLevelBold}>50–74%</Text> — средний уровень. Есть существенные точки роста, рекомендуем выполнить задачи и пройти повторную диагностику.
                  </Text>
                </View>
                <View style={styles.modalLevelItem}>
                  <View style={[styles.modalLevelDot, { backgroundColor: '#81C784' }]} />
                  <Text style={styles.modalLevelText}>
                    <Text style={styles.modalLevelBold}>75-90%</Text> — Хорошее состояние процессов. Большинство направлений работают стабильно, но есть отдельные моменты, которые можно оптимизировать. Поддерживайте текущий уровень и выполняйте точечные улучшения.
                  </Text>
                </View>
                <View style={styles.modalLevelItem}>
                  <View style={[styles.modalLevelDot, { backgroundColor: '#03A66A' }]} />
                  <Text style={styles.modalLevelText}>
                    <Text style={styles.modalLevelBold}>91–100%</Text> — Высокий, почти идеальный уровень эффективности. Процессы выстроены качественно, показатели находятся в отличном состоянии. Можно переходить к улучшениям второго уровня: масштабирование, внедрение инноваций, повышение качества сервиса и операционной точности.
                  </Text>
                </View>
              </View>
              <View style={styles.modalRecommendationBox}>
                <View style={styles.modalRecommendationBar} />
                <View style={styles.modalRecommendationContent}>
                  <Text style={styles.modalRecommendationText}>
                    Для повышения эффективности <Text style={styles.modalRecommendationBold}>выполните сгенерированный список задач.</Text> Они сформированы на основе ваших ответов и отражают ключевые точки роста.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Модальное окно "По направлениям" */}
      <Modal
        visible={showDirectionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDirectionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>По направлениям</Text>
              {directionsCloseIconSvg && (
                <TouchableOpacity 
                  onPress={() => setShowDirectionsModal(false)}
                  style={styles.modalCloseButton}
                >
                  <SvgXml xml={directionsCloseIconSvg} width={22} height={22} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.directionsScrollContainer}>
              <View pointerEvents="none" style={styles.directionsDividerOverlay} />
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.directionsScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {sortedBlockResults.map((block, index) => {
                      const blockIconSvg = getBlockIconSvg(block.id);
                      const efficiencyColors = getEfficiencyBadgeColors(block.efficiency);
                      const efficiencyValue = block.efficiency !== undefined ? block.efficiency : 0;
                      const isLast = index === sortedBlockResults.length - 1;
                      return (
                        <View key={block.id} style={styles.directionsBlockItem}>
                          {blockIconSvg && (
                            <SvgXml xml={blockIconSvg} width={23} height={23} />
                          )}
                          <Text style={styles.directionsBlockTitle} numberOfLines={1}>
                            {block.title.replace(/\n/g, ' ')}
                          </Text>
                          <View
                            onLayout={isLast ? (e) => {
                              if (!modalBadgeWidth) setModalBadgeWidth(e.nativeEvent.layout.width + 1);
                            } : undefined}
                            style={[
                              styles.metricBadge,
                              { backgroundColor: efficiencyColors.bg, minWidth: 35, paddingHorizontal: 6 },
                              modalBadgeWidth ? { width: modalBadgeWidth } : undefined,
                            ]}
                          >
                            <Text
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              style={[
                                styles.modalBadgeText,
                                { color: efficiencyColors.text, flexShrink: 0, textAlign: 'center' },
                              ]}
                            >
                              {efficiencyValue}%
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                {/* Серая полоса под списком */}
                <View style={[styles.modalDivider, { marginTop: 13, marginBottom: 0 }]} />
              </ScrollView>
            </View>
            
            {/* Секция заметки */}
            <View style={styles.noteSection}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteTitle}>Моя заметка</Text>
                <TouchableOpacity>
                  <Text style={styles.noteEditButton}>Редактировать</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.noteInputContainer}>
                <Text style={styles.noteInputText}>
                  Были некоторые проблемы с поставщиками продуктов, на данный момент решил эти вопросы.
                </Text>
              </View>
              <Text style={styles.noteHintText}>Текст заметки виден только вам</Text>
            </View>
            
            {/* Индикатор свайпа внизу */}
            <View style={styles.swipeIndicator} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

    // Вычисляем точную ширину делителя в модальном окне, чтобы контролировать
    // видимую ширину независимо от внутренних отступов контейнера.
    const { width: SCREEN_WIDTH } = Dimensions.get('window');
    const MODAL_DIVIDER_INSET = 16; // уменьшить видимую ширину: +6px (каждая сторона)
    const MODAL_DIVIDER_WIDTH = Math.max(0, SCREEN_WIDTH - (spacing.lg * 2) - (MODAL_DIVIDER_INSET * 2));

    const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
    paddingHorizontal: spacing.md,
    marginLeft: 9,
    marginRight: 9,
    marginLeft: 10,
    marginRight: 10,
    zIndex: 3,
  },
  projectIconContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
      // Используем фиксированную ширину, вычисленную на основе экрана и
      // внутренних отступов modalContent — это даёт детерминированный результат.
      width: MODAL_DIVIDER_WIDTH,
    justifyContent: 'center',
    zIndex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  checkboxContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    zIndex: 2,
  },
  avatarImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: palette.gray100,
  },
  avatarPlaceholder: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: palette.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: -5,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0A0D14',
    fontFamily: 'Manrope-Bold',
    marginTop: -5,
    marginBottom: spacing.xs,
    lineHeight: 32,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(10, 13, 20, 0.8)',
    fontFamily: 'Manrope-Medium',
    marginBottom: spacing.sm + 5,
    lineHeight: 24,
    textAlign: 'center',
  },
  tasksCountHighlight: {
    fontWeight: '700',
    color: '#FD680A',
    fontFamily: 'Manrope-Bold',
  },
  section: {
    marginHorizontal: 0,
    marginBottom: spacing.md,
  },
  efficiencySection: {
    backgroundColor: palette.white,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg + 20,
    paddingBottom: spacing.md - 5 + 10 - 5 - 5 - 5 - 3 - 2 - 2 - 10 - 10,
    marginBottom: 3 - 10,
    marginTop: -4,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  efficiencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -29,
    marginBottom: spacing.sm,
  },
  efficiencyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  efficiencyTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#0A0D14',
    marginRight: 2,
  },
  infoIconButton: {
    marginLeft: 2,
    marginTop: 1,
  },
  efficiencyIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  noteButton: {
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: 0,
    height: 'auto',
  },
  noteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#191BDF',
    fontFamily: 'Manrope-SemiBold',
    letterSpacing: 0.5,
  },
  efficiencyDivider: {
    height: 1,
    backgroundColor: '#E2E4E9',
    // Уменьшаем горизонтальные отступы на 2px (с 8 до 6), чтобы линия стала шире
    marginLeft: 6,
    marginRight: 6,
    marginBottom: spacing.md,
    zIndex: 1,
    position: 'relative',
  },
  // Специальный делитель для модального окна — уже на 3px с каждой стороны
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E4E9',
    alignSelf: 'stretch',
    marginHorizontal: 18,
    marginBottom: spacing.md,
    zIndex: 1,
    position: 'relative',
  },
  gaugeContainer: {
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    overflow: 'visible',
    zIndex: 10,
    elevation: 10,
    position: 'relative',
  },
  metricsContainer: {
    marginBottom: spacing.lg - 15 - 10,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '300',
    color: '#0A0D14',
    flex: 1,
  },
  metricBadge: {
    minWidth: 50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weakBlocksBadge: {
    backgroundColor: '#F8C9D2',
    minWidth: 35,
    paddingHorizontal: 6,
  },
  weakBlocksBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#710E21',
  },
  // Текст бейджей внутри модального окна — на 1px меньше стандартного
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#710E21',
  },
  tasksBadge: {
    backgroundColor: '#F6F8FA',
    minWidth: 35,
    paddingHorizontal: 6,
  },
  tasksBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#525866',
  },
  directionsArrowButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
    marginRight: -2,
    transform: [{ translateX: 5 }],
  },
  weakBlocksDivider: {
    height: 1,
    backgroundColor: '#E2E4E9',
    marginLeft: 0,
    marginRight: 0,
    marginBottom: spacing.md,
    zIndex: 1,
    position: 'relative',
  },
  viewTasksButton: {
    backgroundColor: 'transparent',
    height: 56,
    paddingHorizontal: spacing.md,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C2D6FF',
    marginTop: -5,
    marginBottom: spacing.md - 5,
  },
  viewTasksButtonText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Manrope',
    color: '#162664',
  },
  // Стили для модального окна эффективности
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 0,
  },
  modalContent: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    marginTop: 100,
    flex: 1,
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingRight: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: 'rgba(10, 13, 20, 0.9)',
    fontFamily: 'Manrope-Medium',
    flex: 1,
  },
  modalCloseButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
    marginRight: 0,
    marginTop: -5,
    transform: [{ translateX: 18 }],
  },
  modalScrollView: {
    flex: 1,
  },
  directionsScrollContainer: {
    flex: 1,
    position: 'relative',
  },
  directionsDividerOverlay: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: '#E2E4E9',
    zIndex: 2,
  },
  directionsScrollContent: {
    paddingTop: spacing.md,
  },
  modalText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#525866',
    fontFamily: 'Manrope-Regular',
    lineHeight: 24,
    marginBottom: 0,
  },
  modalTextParagraph: {
    marginTop: 20,
    marginBottom: 0,
  },
  modalTextBold: {
    fontWeight: '500',
    color: '#0A0D14',
    fontFamily: 'Manrope-Medium',
  },
  modalLevelsContainer: {
    marginBottom: spacing.lg - 20,
  },
  modalLevelItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalLevelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
    marginTop: 6,
  },
  modalLevelText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#525866',
    fontFamily: 'Manrope-Regular',
    lineHeight: 24,
    flex: 1,
  },
  modalLevelBold: {
    fontWeight: '500',
    fontFamily: 'Manrope-Medium',
  },
  modalRecommendationBox: {
    flexDirection: 'row',
    backgroundColor: '#EAECF8',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: spacing.md - 15,
    overflow: 'hidden',
  },
  modalRecommendationBar: {
    width: 5,
    backgroundColor: '#191BDF',
  },
  modalRecommendationContent: {
    flex: 1,
    padding: spacing.md,
  },
  modalRecommendationText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0A0D14',
    fontFamily: 'Manrope-Regular',
    lineHeight: 24,
    flex: 1,
  },
  modalRecommendationBold: {
    fontWeight: '600',
    fontFamily: 'Manrope-SemiBold',
  },
  startButtonContainer: {
    position: 'absolute',
    bottom: 57,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    zIndex: 20,
  },
  startButton: {
    backgroundColor: '#191BDF',
    height: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: Platform.select({
      ios: 'Manrope',
      android: 'Manrope',
      web: "'Manrope', sans-serif",
      default: 'Manrope',
    }),
    color: palette.white,
    textAlign: 'center',
    marginTop: 1,
  },
  startButtonQuestionCount: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Manrope-Medium',
    textAlign: 'center',
    marginTop: -1,
  },
  homeButtonContainer: {
    position: 'absolute',
    bottom: 57 + 56 + 10, // 10 пикселей выше кнопки "План улучшений"
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    zIndex: 20,
  },
  homeButton: {
    backgroundColor: 'transparent',
    height: 56,
    paddingHorizontal: spacing.md,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C2D6FF',
  },
  homeButtonText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Manrope',
    color: '#162664',
    textAlign: 'center',
  },
  directionsBlockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingVertical: 6,
    paddingLeft: 0,
    paddingRight: 0,
  },
  directionsBlockTitle: {
    fontSize: 15,
    fontWeight: '300',
    color: '#0A0D14',
    flex: 1,
    marginLeft: spacing.sm,
  },
  noteSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingHorizontal: 0,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0A0D14',
  },
  noteEditButton: {
    fontSize: 14,
    fontWeight: '400',
    color: '#525866',
  },
  noteInputContainer: {
    backgroundColor: '#F6F8FA',
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    minHeight: 80,
    marginHorizontal: 0,
  },
  noteInputText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#525866',
    lineHeight: 20,
  },
  noteHintText: {
    fontSize: 14,
    fontWeight: '300',
    color: '#868C98',
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#C7D4E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
});

export default DiagnosisResultsScreen;
