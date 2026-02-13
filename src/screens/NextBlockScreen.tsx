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
import { getCurrentUserId, getSelectedVenueId, getVenueScopedKey } from '../utils/userDataStorage';

interface NextBlockScreenProps {
  blockId: string;
  blockTitle?: string;
  currentStepIndex?: number;
  selectedBlocks?: string[];
  onBack?: () => void;
  onContinue?: () => void;
}

const NextBlockScreen: React.FC<NextBlockScreenProps> = ({
  blockId,
  blockTitle,
  currentStepIndex,
  selectedBlocks,
  onBack,
  onContinue,
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
  const [dashSvg, setDashSvg] = useState<string>('');
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
  const [blockEfficiency, setBlockEfficiency] = useState<number>(0);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState<number>(0);
  const [blockResults, setBlockResults] = useState<any[]>([]);
  const [comparison, setComparison] = useState<{ previous: number | null; current: number }>({ previous: null, current: 0 });
  const [overallEfficiency, setOverallEfficiency] = useState<number>(0);
  const [allTasksCount, setAllTasksCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);

  // Загружаем вопросы из JSON
  const questions: Record<string, any[]> = {};
  questionsData.forEach((block: any) => {
    questions[block.id] = block.questions;
  });

  // Вычисляем текущий блок и общее количество блоков
  const blocksToUse = selectedBlocks && selectedBlocks.length > 0
    ? selectedBlocks
    : DEFAULT_BLOCKS.map((block) => block.id);
  const selectedBlockIndex = blocksToUse.indexOf(blockId);
  const rawBlockIndex = currentStepIndex !== undefined ? currentStepIndex : selectedBlockIndex;
  const currentBlockIndex = selectedBlockIndex >= 0 ? selectedBlockIndex : Math.max(rawBlockIndex, 0);
  const totalBlocksCount = blocksToUse.length;
  const currentBlockNumber = currentBlockIndex + 1;
  
  // Находим информацию о текущем блоке
  const currentBlock = DEFAULT_BLOCKS.find(block => block.id === blockId);
  
  // Находим следующий блок по порядку прохождения
  const nextBlockIndex = currentBlockIndex + 1;
  const nextBlockId = nextBlockIndex < blocksToUse.length ? blocksToUse[nextBlockIndex] : null;
  const nextBlock = nextBlockId
    ? DEFAULT_BLOCKS.find((block) => block.id === nextBlockId) || null
    : null;

  const hasProgress = answeredCount > 0;

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

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const userId = await getCurrentUserId();
        const venueId = await getSelectedVenueId(userId);
        const answersKey = getVenueScopedKey(`diagnosis_answers_${blockId}`, userId, venueId);
        const saved = await AsyncStorage.getItem(answersKey);
        const parsed = saved ? JSON.parse(saved) : {};
        const count = Object.values(parsed || {}).filter(
          (value) => value !== null && value !== undefined && value !== ''
        ).length;
        const total = questions[blockId]?.length || 0;
        setAnsweredCount(count);
        setTotalQuestionsCount(total);
      } catch (error) {
        console.error('Ошибка загрузки прогресса блока:', error);
        setAnsweredCount(0);
        setTotalQuestionsCount(0);
      }
    };

    if (blockId) {
      loadProgress();
    }
  }, [blockId]);
  const changeDisplayValue =
    hasPreviousResult && hasCurrentResult
      ? Math.abs(changeDelta)
      : 0;

  // Текущее значение для кружка — берём актуальную общую эффективность (обновляется после каждого пройденного блока)
  const currentBadgeValue = overallEfficiency ?? 0;
  const currentBadgeColors = getDiagnosisBadgeColors(currentBadgeValue);
  
  // На NextBlockScreen не загружаем результаты - это экран ознакомления с блоком
  // Результаты будут на BlockResultsScreen после прохождения вопросов

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

      // Загружаем SVG для тире (вместо процентов)
      try {
        const dashAsset = Asset.fromModule(require('../../assets/images/dash-icon.svg'));
        await dashAsset.downloadAsync();
        if (dashAsset.localUri) {
          const response = await fetch(dashAsset.localUri);
          const fileContent = await response.text();
          setDashSvg(fileContent);
          console.log('✅ Загружен dash-icon.svg');
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG тире:', error);
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
              onPress={onBack}
            >
              <SvgXml xml={closeIconSvg} width={24} height={24} />
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {hasProgress ? 'Продолжить диагностику блока' : 'Начать диагностику блока'}
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          {hasProgress
            ? `Вы ответили на ${answeredCount} из ${totalQuestionsCount} вопросов`
            : 'Рекомендации будут доступны после прохождения блока'}
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
              correctAnswers={0}
              incorrectAnswers={0}
              efficiency={0}
              isGray={true}
              dashSvg={dashSvg}
            />
          </View>

          {/* Метрики */}
          <View style={styles.metricsContainer}>
            {/* Правильных ответов */}
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Правильных ответов</Text>
              <View style={[styles.metricBadge, { backgroundColor: '#F6F8FA', minWidth: 35, paddingHorizontal: 6 }]}>
                <Text style={styles.tasksBadgeText}>
                  -
                </Text>
              </View>
            </View>

            {/* Неправильных ответов */}
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Неправильных ответов</Text>
              <View style={[styles.metricBadge, { backgroundColor: '#F6F8FA', minWidth: 35, paddingHorizontal: 6 }]}>
                <Text style={styles.tasksBadgeText}>
                  -
                </Text>
              </View>
            </View>
            
            {/* Серая полоса */}
            <View style={styles.weakBlocksDivider} />

            {/* Задач по улучшению блока */}
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Задач по улучшению блока</Text>
              <View style={[styles.metricBadge, { backgroundColor: '#F6F8FA', minWidth: 35, paddingHorizontal: 6 }]}>
                <Text style={styles.tasksBadgeText}>
                  -
                </Text>
              </View>
            </View>
          </View>

          {/* Количество вопросов в блоке */}
          <View style={styles.questionsCountContainer}>
            <Text style={styles.questionsCountText}>
              {currentBlock ? (questions[currentBlock.id]?.length || 0) : 0} вопросов
            </Text>
          </View>
        </View>
      </View>

      {/* Прогресс-бар блоков - ниже белого поля на 5 пикселей */}
      {blocksToUse && blocksToUse.length > 0 && (
        <View style={styles.progressBarContainer}>
          {blocksToUse.map((blockId, index) => {
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
              <View key={`${blockId}-${index}`} style={styles.progressDot}>
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

      {/* Кнопка "Начать диагностику" - абсолютное позиционирование */}
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
            {hasProgress ? 'Продолжить диагностику' : 'Начать диагностику'}
          </Text>
          <Text style={styles.startButtonQuestionCount} numberOfLines={1}>
            {currentBlock ? currentBlock.title.replace(/\n/g, ' ') : ''}
          </Text>
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
    minWidth: 42,
    paddingHorizontal: 8,
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
  questionsCountContainer: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -5,
    marginBottom: spacing.md - 5,
  },
  questionsCountText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Manrope-SemiBold',
    color: '#525866',
    textAlign: 'center',
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
  isGray?: boolean; // Серый спидометр без секций
  dashSvg?: string; // SVG для тире вместо процентов
}

const BlockGaugeSimple: React.FC<BlockGaugeSimpleProps> = ({
  correctAnswers,
  incorrectAnswers,
  efficiency,
  isGray = false,
  dashSvg,
}) => {
  // Параметры спидометра (как в BlockGauge)
  const GAUGE_SIZE = 340;
  const GAUGE_HEIGHT = 150;
  const RADIUS = 167;
  const STROKE_WIDTH = 18;
  const CENTER_X = 170;
  const CENTER_Y = 122;
  const TOTAL_ANGLE = 180;
  
  // Вычисляем углы для двух секций по эффективности
  const clampedEfficiency = Math.max(0, Math.min(100, efficiency));
  const greenAngle = isGray ? 0 : (clampedEfficiency / 100) * TOTAL_ANGLE;
  const redAngle = isGray ? 0 : TOTAL_ANGLE - greenAngle;
  
  // Для серого спидометра - полный круг серым цветом
  const grayAngle = isGray ? TOTAL_ANGLE : 0;
  
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

  // Путь для серого спидометра (полный круг)
  const grayPath = useMemo(() => {
    if (!isGray) return '';
    const startAngle = -180;
    const endAngle = 0;
    return createSectionPath(startAngle, endAngle);
  }, [isGray]);

  return (
    <View style={gaugeStyles.container}>
      <Svg width={GAUGE_SIZE} height={GAUGE_HEIGHT} viewBox="-10 -60 360 200">
        {isGray ? (
          // Серый спидометр без секций
          <Path
            d={grayPath}
            stroke="#E2E4E9"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="butt"
          />
        ) : (
          <>
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
          </>
        )}
      </Svg>
      {/* SVG тире вместо процентов или процент эффективности */}
      {isGray && dashSvg ? (
        <View style={gaugeStyles.dashContainer}>
          <SvgXml xml={dashSvg} width={55} height={12} />
        </View>
      ) : (
        <Text style={gaugeStyles.percentageText}>
          {efficiency}%
        </Text>
      )}
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
  dashContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: [{ translateY: -2 }],
    alignItems: 'center',
    justifyContent: 'center',
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

export default NextBlockScreen;
