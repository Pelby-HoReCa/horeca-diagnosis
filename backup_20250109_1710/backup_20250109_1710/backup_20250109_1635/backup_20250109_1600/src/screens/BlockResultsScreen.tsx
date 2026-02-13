import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { SvgXml } from 'react-native-svg';
import { Path, Svg } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedPressable from '../components/AnimatedPressable';
import { palette, spacing, radii } from '../styles/theme';
import { DEFAULT_BLOCKS } from '../data/diagnosisBlocks';
import questionsData from '../data/questions.json';
import { generateTasksFromAnswers } from '../utils/recommendationEngine';

interface BlockResultsScreenProps {
  blockId: string;
  completedBlockIndex?: number;
  totalBlocks?: number;
  selectedBlocks?: string[]; // Список выбранных блоков для диагностики
  onContinue?: () => void;
  onBack?: () => void;
  onClose?: () => void;
}

const BlockResultsScreen: React.FC<BlockResultsScreenProps> = ({
  blockId,
  completedBlockIndex,
  totalBlocks,
  selectedBlocks,
  onContinue,
  onBack,
  onClose,
}) => {
  const [closeIconSvg, setCloseIconSvg] = useState<string>('');
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
  const [progressDotCompletedSvg, setProgressDotCompletedSvg] = useState<string>('');
  const [progressDotCurrentSvg, setProgressDotCurrentSvg] = useState<string>('');
  const [progressDotIncompleteSvg, setProgressDotIncompleteSvg] = useState<string>('');
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
  const [blockEfficiency, setBlockEfficiency] = useState<number>(0);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState<number>(0);
  const [blockResults, setBlockResults] = useState<any[]>([]);
  const [tasksCount, setTasksCount] = useState<number>(0);
  const [comparison, setComparison] = useState<{ previous: number | null; current: number }>({ previous: null, current: 0 });
  const [overallEfficiency, setOverallEfficiency] = useState<number>(0);
  const [allTasksCount, setAllTasksCount] = useState(0);

  // Загружаем вопросы из JSON
  const questions: Record<string, any[]> = {};
  questionsData.forEach((block: any) => {
    questions[block.id] = block.questions;
  });

  // Вычисляем текущий блок и общее количество блоков
  const currentBlockIndex = completedBlockIndex !== undefined 
    ? completedBlockIndex 
    : DEFAULT_BLOCKS.findIndex(block => block.id === blockId);
  const totalBlocksCount = totalBlocks !== undefined 
    ? totalBlocks 
    : DEFAULT_BLOCKS.length;
  const currentBlockNumber = currentBlockIndex + 1;
  
  // Находим информацию о текущем блоке
  const currentBlock = DEFAULT_BLOCKS.find(block => block.id === blockId);
  
  // Находим следующий блок по порядку прохождения
  const blocksToUse = selectedBlocks && selectedBlocks.length > 0 ? selectedBlocks : DEFAULT_BLOCKS.map(b => b.id);
  const nextBlockIndex = currentBlockIndex + 1;
  const nextBlockId = nextBlockIndex < blocksToUse.length ? blocksToUse[nextBlockIndex] : null;
  const nextBlock = nextBlockId ? DEFAULT_BLOCKS.find(block => block.id === nextBlockId) : null;

  // Функция для правильного склонения слова "блок"
  const getBlockWord = (count: number): string => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'блоков';
    }
    if (lastDigit === 1) {
      return 'блок';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'блока';
    }
    return 'блоков';
  };

  // Цвета для зеленого/желтого/красного/серого кружка "Прошлая диагностика"
  const getDiagnosisBadgeColors = (value: number) => {
    if (value === 0 || value === undefined || value === null) {
      return { bg: '#F6F8FA', text: '#525866' }; // серый
    }
    if (value >= 78) return { bg: '#CBF5E5', text: '#176448' }; // зеленый
    if (value >= 60) return { bg: '#FFAD1F', text: '#0A0D14' }; // желтый
    if (value >= 38) return { bg: '#F8C9D2', text: '#710E21' }; // красный
    return { bg: '#F6F8FA', text: '#525866' }; // серый
  };

  // Данные для отображения изменения эффективности в "Прошлая диагностика"
  const hasPreviousResult = comparison.previous !== null && comparison.previous !== undefined;
  const hasCurrentResult = comparison.current !== null && comparison.current !== undefined;
  const changeDelta = hasPreviousResult && hasCurrentResult
    ? (comparison.current ?? 0) - (comparison.previous ?? 0)
    : 0;
  const changeColor =
    hasPreviousResult && hasCurrentResult
      ? changeDelta < 0
        ? '#DF1C41' // хуже
        : changeDelta > 0
          ? '#176448' // лучше
          : '#525866' // без изменений
      : '#525866'; // нет данных
  const changeArrow =
    hasPreviousResult && hasCurrentResult
      ? changeDelta < 0
        ? 'arrow-down'
        : 'arrow-up'
      : 'arrow-up';
  const changeDisplayValue =
    hasPreviousResult && hasCurrentResult
      ? Math.abs(changeDelta)
      : 0;

  // Текущее значение для кружка — берём актуальную общую эффективность (обновляется после каждого пройденного блока)
  const currentBadgeValue = overallEfficiency ?? 0;
  const currentBadgeColors = getDiagnosisBadgeColors(currentBadgeValue);
  
  // Загружаем сохраненные ответы и вычисляем эффективность
  useEffect(() => {
    const loadAnswersAndCalculateEfficiency = async () => {
      try {
        const saved = await AsyncStorage.getItem(`diagnosis_answers_${blockId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSavedAnswers(parsed);
          
          // Получаем вопросы для текущего блока
          const blockQuestions = questions[blockId] || [];
          let correct = 0;
          let incorrect = 0;
          
          blockQuestions.forEach((question) => {
            const questionKey = `${blockId}_${question.id}`;
            const selectedAnswerId = parsed[questionKey];
            
            if (selectedAnswerId) {
              // Находим выбранный вариант ответа
              const selectedOption = question.options.find((opt: any) => opt.id === selectedAnswerId);
              if (selectedOption) {
                if (selectedOption.correct === true) {
                  correct++;
                } else {
                  incorrect++;
                }
              }
            }
          });
          
          setCorrectAnswers(correct);
          setIncorrectAnswers(incorrect);
          
          // Вычисляем эффективность
          const total = correct + incorrect;
          const efficiency = total > 0 ? Math.round((correct / total) * 100) : 0;
          setBlockEfficiency(efficiency);
          
          // Подсчитываем количество задач на основе рекомендаций
          const blockAnswers: Record<string, string> = {};
          
          // Формируем объект ответов для функции generateTasksFromAnswers
          blockQuestions.forEach((question) => {
            const questionKey = `${blockId}_${question.id}`;
            const selectedAnswerId = parsed[questionKey];
            if (selectedAnswerId) {
              // Находим выбранный вариант ответа
              const selectedOption = question.options.find((opt: any) => opt.id === selectedAnswerId);
              if (selectedOption) {
                blockAnswers[question.id] = selectedOption.value;
              }
            }
          });
          
          // Генерируем задачи и считаем их количество
          const generatedTasks = generateTasksFromAnswers(
            blockId,
            blockAnswers,
            blockQuestions,
            currentBlock?.title
          );
          setTasksCount(generatedTasks.length);
               }
             } catch (error) {
               console.error('Ошибка загрузки ответов:', error);
             }
           };
           
           loadAnswersAndCalculateEfficiency();
         }, [blockId]);

  // Функция для получения SVG иконки блока
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

  useEffect(() => {
    const loadIcons = async () => {
      // Загружаем крестик
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
            const iconAsset = Asset.fromModule(loader.path);
            await iconAsset.downloadAsync();
            if (iconAsset.localUri) {
              const response = await fetch(iconAsset.localUri);
              const fileContent = await response.text();
              loader.setter(fileContent);
            }
          } catch (error) {
            console.error('Ошибка загрузки SVG иконки блока:', error);
          }
        }
      };

      loadBlockIcons();

      // Загружаем иконки для прогресс-бара
      try {
        const completedAsset = Asset.fromModule(require('../../assets/images/progress-dot-completed.svg'));
        await completedAsset.downloadAsync();
        if (completedAsset.localUri) {
          const response = await fetch(completedAsset.localUri);
          const fileContent = await response.text();
          setProgressDotCompletedSvg(fileContent);
          console.log('✅ Загружен progress-dot-completed.svg');
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG прогресс-бара (completed):', error);
      }

      try {
        const currentAsset = Asset.fromModule(require('../../assets/images/progress-dot-current.svg'));
        await currentAsset.downloadAsync();
        if (currentAsset.localUri) {
          const response = await fetch(currentAsset.localUri);
          const fileContent = await response.text();
          setProgressDotCurrentSvg(fileContent);
          console.log('✅ Загружен progress-dot-current.svg');
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG прогресс-бара (current):', error);
      }

      try {
        const incompleteAsset = Asset.fromModule(require('../../assets/images/progress-dot-incomplete.svg'));
        await incompleteAsset.downloadAsync();
        if (incompleteAsset.localUri) {
          const response = await fetch(incompleteAsset.localUri);
          const fileContent = await response.text();
          setProgressDotIncompleteSvg(fileContent);
          console.log('✅ Загружен progress-dot-incomplete.svg');
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG прогресс-бара (incomplete):', error);
      }
    };

    loadIcons();
  }, []);

  const blockIconSvg = currentBlock ? getBlockIconSvg(currentBlock.id) : null;

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Header: Block counter and Close button */}
        <View style={styles.header}>
        <View style={styles.blockIndicatorContainer}>
          <Text style={styles.blockIndicator}>
            {currentBlockNumber} / {totalBlocksCount} БЛОКОВ
          </Text>
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
        <Text style={styles.title}>Диагностика блока завершена</Text>

        {/* Description */}
        <Text style={styles.description}>
          Доступны рекомендации и задачи по улучшению.
        </Text>

        {/* Белое поле с метриками (без спидометра) */}
        <View style={[styles.section, styles.efficiencySection]}>
          {/* Заголовок с иконкой блока */}
          <View style={styles.efficiencyHeader}>
            <View style={styles.blockTitleContainer}>
              {blockIconSvg && (
                <View style={styles.blockIconContainer}>
                  <SvgXml xml={blockIconSvg} width={31} height={31} />
                </View>
              )}
              <Text style={styles.efficiencyTitle}>
                {currentBlock ? currentBlock.title.replace(/\n/g, ' ') : 'Общая эффективность'}
              </Text>
            </View>
          </View>

          {/* Серая полоса под заголовком */}
          <View style={styles.efficiencyDivider} />

          {/* Спидометр */}
          <View style={styles.gaugeContainer}>
            <BlockGaugeSimple 
              correctAnswers={correctAnswers}
              incorrectAnswers={incorrectAnswers}
              efficiency={blockEfficiency}
            />
          </View>

          {/* Метрики */}
          <View style={styles.metricsContainer}>
            {/* Правильных ответов */}
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Правильных ответов</Text>
              <View style={[styles.metricBadge, { backgroundColor: '#CBF5E5', minWidth: 35, paddingHorizontal: 6 }]}>
                <Text style={[styles.weakBlocksBadgeText, { color: '#176448' }]}>
                  {correctAnswers}
                </Text>
              </View>
            </View>

            {/* Неправильных ответов */}
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Неправильных ответов</Text>
              <View style={[styles.metricBadge, styles.weakBlocksBadge]}>
                <Text style={styles.weakBlocksBadgeText}>
                  {incorrectAnswers}
                </Text>
              </View>
            </View>
            
            {/* Серая полоса */}
            <View style={styles.weakBlocksDivider} />

            {/* Задач по улучшению блока */}
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Задач по улучшению блока</Text>
              <View style={[styles.metricBadge, styles.tasksBadge]}>
                <Text style={styles.tasksBadgeText}>
                  {tasksCount}
                </Text>
              </View>
            </View>
          </View>

          {/* Кнопка "Смотреть задачи" */}
          <AnimatedPressable 
            style={styles.viewTasksButton}
            onPress={onContinue}
          >
            <Text style={styles.viewTasksButtonText}>Смотреть задачи</Text>
          </AnimatedPressable>
        </View>
      </View>

      {/* Прогресс-бар блоков - ниже белого поля на 5 пикселей */}
      {DEFAULT_BLOCKS && DEFAULT_BLOCKS.length > 0 && (
        <View style={styles.progressBarContainer}>
          {DEFAULT_BLOCKS.map((block, index) => {
            let dotSvg = progressDotIncompleteSvg;
            let dotColor = '#C7D4E0';
            let dotSize = 6;
            
            if (index < currentBlockIndex) {
              // Пройденные блоки
              dotSvg = progressDotCompletedSvg;
              dotColor = '#38C793';
              dotSize = 6;
            } else if (index === currentBlockIndex) {
              // Текущий блок (только что завершили)
              dotSvg = progressDotCurrentSvg;
              dotSize = 10;
            }
            
            return (
              <View key={`${block.id}-${index}`} style={styles.progressDot}>
                {dotSvg && dotSvg.length > 0 ? (
                  <SvgXml 
                    xml={dotSvg} 
                    width={dotSize} 
                    height={dotSize}
                  />
                ) : (
                  <View style={{ 
                    width: dotSize, 
                    height: dotSize, 
                    backgroundColor: index === currentBlockIndex ? 'white' : dotColor, 
                    borderRadius: dotSize / 2,
                    borderWidth: index === currentBlockIndex ? 2 : 0,
                    borderColor: index === currentBlockIndex ? '#38C793' : 'transparent',
                  }} />
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Кнопка "Продолжить диагностику" - абсолютное позиционирование */}
      <View style={styles.startButtonContainer}>
        <AnimatedPressable
          style={styles.startButton}
          onPress={() => {
            if (onContinue) {
              onContinue();
            }
          }}
        >
          <Text style={styles.startButtonText}>
            {nextBlock ? 'Продолжить диагностику' : 'Результаты диагностики'}
          </Text>
          {nextBlock && (
            <Text style={styles.startButtonQuestionCount} numberOfLines={1}>
              {nextBlock.title.replace(/\n/g, ' ')}
            </Text>
          )}
        </AnimatedPressable>
      </View>
    </View>
  );
};

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
  },
  blockIndicatorContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    top: 0,
  },
  blockIndicator: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(10, 13, 20, 0.5)',
    fontFamily: 'Manrope-SemiBold',
    textAlign: 'center',
    letterSpacing: 0.5,
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
  section: {
    marginHorizontal: 0,
    marginBottom: spacing.md,
  },
  efficiencySection: {
    backgroundColor: palette.white,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg + 20,
    paddingBottom: spacing.md - 5 + 10 - 5 - 5,
    marginBottom: 3, // 3 пикселя отступ снизу для прогресс-бара
    marginTop: -4, // Поднято выше на 4 пикселя
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
  blockTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  blockIconContainer: {
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  efficiencyTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#0A0D14',
    flex: 1,
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
  iconButton: {
    // Убрали padding, чтобы иконки выравнивались как метрики ниже
  },
  efficiencyDivider: {
    height: 1,
    backgroundColor: '#E2E4E9',
    marginLeft: 5,
    marginRight: -spacing.md,
    marginBottom: (spacing.lg - spacing.sm) / 2,
    zIndex: 1,
    position: 'relative',
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
    marginBottom: spacing.lg - 15,
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
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  previousDiagnosisBadge: {
    backgroundColor: '#CBF5E5',
    minWidth: 55,
    paddingHorizontal: 6,
  },
  previousDiagnosisBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#176448',
    lineHeight: 16,
    includeFontPadding: false,
    transform: [{ translateX: 5 }],
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
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: spacing.xs,
    color: '#DF1C41',
  },
  improvementPlanButton: {
    backgroundColor: '#191BDF',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  improvementPlanButtonText: {
    fontSize: 17,
    fontWeight: '300',
    color: '#EBF1FF',
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
  progressBarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0, // Нет отступа сверху, так как белое поле уже имеет marginBottom: 5
    marginBottom: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 20,
    width: '100%',
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 100, // Поверх всего
  },
  progressDot: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 11,
    width: 12,
    height: 12,
    minWidth: 10,
    minHeight: 10,
  },
});

// Компонент упрощенного спидометра с двумя секциями
interface BlockGaugeSimpleProps {
  correctAnswers: number;
  incorrectAnswers: number;
  efficiency: number;
}

const BlockGaugeSimple: React.FC<BlockGaugeSimpleProps> = ({
  correctAnswers,
  incorrectAnswers,
  efficiency,
}) => {
  // Параметры спидометра (как в BlockGauge)
  const GAUGE_SIZE = 340;
  const GAUGE_HEIGHT = 150;
  const RADIUS = 167;
  const STROKE_WIDTH = 18;
  const CENTER_X = 170;
  const CENTER_Y = 122;
  const TOTAL_ANGLE = 180;
  
  // Вычисляем углы для двух секций
  const totalAnswers = correctAnswers + incorrectAnswers;
  const greenAngle = totalAnswers > 0 ? (correctAnswers / totalAnswers) * TOTAL_ANGLE : 0;
  const redAngle = totalAnswers > 0 ? (incorrectAnswers / totalAnswers) * TOTAL_ANGLE : TOTAL_ANGLE;
  
  // Создаем пути для секций
  const createSectionPath = (startAngle: number, endAngle: number): string => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = CENTER_X + RADIUS * Math.cos(startRad);
    const y1 = CENTER_Y + RADIUS * Math.sin(startRad);
    const x2 = CENTER_X + RADIUS * Math.cos(endRad);
    const y2 = CENTER_Y + RADIUS * Math.sin(endRad);
    
    const largeArcFlag = (endAngle - startAngle) > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };
  
  // Путь для зеленой секции (правильные ответы)
  const greenPath = useMemo(() => {
    const startAngle = -180;
    const endAngle = -180 + greenAngle;
    return createSectionPath(startAngle, endAngle);
  }, [greenAngle]);
  
  // Путь для красной секции (неправильные ответы)
  const redPath = useMemo(() => {
    const startAngle = -180 + greenAngle;
    const endAngle = 0;
    return createSectionPath(startAngle, endAngle);
  }, [greenAngle]);
  
  // Путь для белой линии-разделителя
  const dividerPath = useMemo(() => {
    if (greenAngle === 0 || greenAngle === TOTAL_ANGLE) return '';
    const angle = -180 + greenAngle;
    const rad = (angle * Math.PI) / 180;
    const x1 = CENTER_X + (RADIUS - STROKE_WIDTH / 2) * Math.cos(rad);
    const y1 = CENTER_Y + (RADIUS - STROKE_WIDTH / 2) * Math.sin(rad);
    const x2 = CENTER_X + (RADIUS + STROKE_WIDTH / 2) * Math.cos(rad);
    const y2 = CENTER_Y + (RADIUS + STROKE_WIDTH / 2) * Math.sin(rad);
    
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }, [greenAngle]);

  return (
    <View style={gaugeStyles.container}>
      <Svg width={GAUGE_SIZE} height={GAUGE_HEIGHT} viewBox="-10 -60 360 200">
        {/* Зеленая секция (правильные ответы) */}
        {greenAngle > 0 && (
          <Path
            d={greenPath}
            stroke="#38C793"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="butt"
          />
        )}
        {/* Белая линия-разделитель */}
        {dividerPath && (
          <Path
            d={dividerPath}
            stroke="white"
            strokeWidth={6}
            fill="none"
            strokeLinecap="butt"
          />
        )}
        {/* Красная секция (неправильные ответы) */}
        {redAngle > 0 && (
          <Path
            d={redPath}
            stroke="#DF1C41"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="butt"
          />
        )}
      </Svg>
      {/* Процент эффективности */}
      <Text style={gaugeStyles.percentageText}>
        {efficiency}%
      </Text>
      <Text style={gaugeStyles.blocksText}>
        ЭФФЕКТИВНОСТЬ БЛОКА
      </Text>
    </View>
  );
};

const gaugeStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
    width: 340,
    height: 152,
    paddingTop: 1,
  },
  percentageText: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: [{ translateY: -12 }, { translateX: 3 }],
    paddingTop: 1,
    fontSize: 56,
    fontFamily: 'Manrope-Regular',
    color: '#0A0D14',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 57,
    width: '100%',
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  blocksText: {
    position: 'absolute',
    top: 122 - 1,
    left: 0,
    right: 0,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Manrope-Medium',
    color: '#666666',
    textAlign: 'center',
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
});

export default BlockResultsScreen;

