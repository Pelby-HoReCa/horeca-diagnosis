import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import React, { useCallback, useEffect, useMemo, useRef, useState, memo, startTransition } from 'react';
import { Dimensions, Image, ImageBackground, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import AnimatedPressable from '../components/AnimatedPressable';
import BlockGauge from '../components/BlockGauge';
import DashboardHeader from '../components/DashboardHeader';
import { DEFAULT_BLOCKS, DiagnosisBlock } from '../data/diagnosisBlocks';
import { palette, radii, spacing } from '../styles/theme';
import { getTasksByBlock, Task } from '../utils/recommendationEngine';
import {
    getCurrentUserId,
    loadUserBlocks,
    loadUserDashboardData,
    loadUserQuestionnaire,
    loadUserTasks,
    saveUserDashboardData
} from '../utils/userDataStorage';

const COLORS = {
  gray: palette.gray200,
  darkGray: palette.gray600,
  blue: palette.primaryBlue,
  orange: palette.primaryOrange,
  green: palette.success,
  red: palette.error,
  white: palette.white,
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Фирменные цвета
interface Comparison {
  previous: number | null; // null означает, что это первое прохождение
  current: number;
  change?: number; // Изменение в процентах (положительное = рост, отрицательное = падение)
}


export default function DashboardScreen({ navigation }: any) {
  const [restaurantName, setRestaurantName] = useState('Проект');
  const [blockResults, setBlockResults] = useState<DiagnosisBlock[]>([]);
  const [comparison, setComparison] = useState<Comparison>({ previous: null, current: 0 });
  const [overallEfficiency, setOverallEfficiency] = useState<number>(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasksCount, setAllTasksCount] = useState(0);
  const [tasksByBlock, setTasksByBlock] = useState<Record<string, { tasks: Task[], completed: number, total: number }>>({});
  const [infoIconSvg, setInfoIconSvg] = useState<string>('');
  const [refreshIconSvg, setRefreshIconSvg] = useState<string>('');
  const [addIconSvg, setAddIconSvg] = useState<string>('');
  const [addFillIconSvg, setAddFillIconSvg] = useState<string>('');
  const [modalCloseIconSvg, setModalCloseIconSvg] = useState<string>('');
  const [radioActiveSvg, setRadioActiveSvg] = useState<string>('');
  const [radioInactiveSvg, setRadioInactiveSvg] = useState<string>('');
  const [logoPlaceholderSvg, setLogoPlaceholderSvg] = useState<string>('');
  const [selectedVenueId, setSelectedVenueId] = useState<string>('1');
  const [showEfficiencyModal, setShowEfficiencyModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [businessAssessmentIconSvg, setBusinessAssessmentIconSvg] = useState<string>('');
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
  const [closeIconSvg, setCloseIconSvg] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const prevBlocksRef = useRef<string | null>(null);
  const dashboardDataLoadedRef = useRef(false);
  const prevComparisonRef = useRef<string | null>(null);
  const prevTasksRef = useRef<string | null>(null);
  const efficiencyIconsLoadedRef = useRef(false);

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

  // Цвета для зеленого/желтого/красного/серого кружка "Прошлая диагностика"
  const getDiagnosisBadgeColors = (value: number) => {
    if (value === 0 || value === undefined || value === null) {
      return { bg: '#F6F8FA', text: '#525866' }; // серый
    }
    if (value >= 78) return { bg: '#CBF5E5', text: '#176448' }; // зеленый
    if (value >= 60) return { bg: '#FFAD1F', text: '#0A0D14' }; // желтый
    if (value >= 38) return { bg: '#FFDAC2', text: '#6E330C' }; // оранжевый (четвертый цвет)
    return { bg: '#F8C9D2', text: '#710E21' }; // красный фон (по запросу), текст требуемого цвета
  };
  // Текущее значение для кружка — берём актуальную общую эффективность (обновляется после каждого пройденного блока)
  const currentBadgeValue = overallEfficiency ?? 0;
  const currentBadgeColors = getDiagnosisBadgeColors(currentBadgeValue);

  // Функция для вычисления общей эффективности всех пройденных блоков
  const calculateOverallEfficiency = (blocks: DiagnosisBlock[]): number => {
    const completedBlocks = blocks.filter(b => b.completed && b.efficiency !== undefined);
    if (completedBlocks.length === 0) return 0;
    return Math.round(
      completedBlocks.reduce((sum, b) => sum + (b.efficiency || 0), 0) / completedBlocks.length
    );
  };

  // Загружаем название ресторана для других целей (не для шапки)
  useEffect(() => {
    const loadRestaurantName = async () => {
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          const questionnaireData = await loadUserQuestionnaire(userId);
          if (questionnaireData && questionnaireData.restaurantName && questionnaireData.restaurantName.trim()) {
            setRestaurantName(questionnaireData.restaurantName);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки названия ресторана:', error);
      }
    };
    
    loadRestaurantName();
  }, []);

  useEffect(() => {
    // Загружаем данные дашборда только один раз при монтировании
    if (!dashboardDataLoadedRef.current) {
      loadDashboardData();
      dashboardDataLoadedRef.current = true;
    }
    checkAuthStatus();
  }, []);

  // Загружаем иконки эффективности отдельно, чтобы не вызывать ререндер шапки
  useEffect(() => {
    if (efficiencyIconsLoadedRef.current) {
      return;
    }
    
    const loadEfficiencyIcons = async () => {
      try {
        // Иконка информации
        const infoAsset = Asset.fromModule(require('../../assets/images/information-line.svg'));
        await infoAsset.downloadAsync();
        if (infoAsset.localUri) {
          const response = await fetch(infoAsset.localUri);
          const fileContent = await response.text();
          setInfoIconSvg(fileContent);
        }
        
        // Иконка обновления
        const refreshAsset = Asset.fromModule(require('../../assets/images/refresh-icon.svg'));
        await refreshAsset.downloadAsync();
        if (refreshAsset.localUri) {
          const response = await fetch(refreshAsset.localUri);
          const fileContent = await response.text();
          setRefreshIconSvg(fileContent);
        }
        
        // Иконка добавления
        const addAsset = Asset.fromModule(require('../../assets/images/add-icon.svg'));
        await addAsset.downloadAsync();
        if (addAsset.localUri) {
          const response = await fetch(addAsset.localUri);
          const fileContent = await response.text();
          setAddIconSvg(fileContent);
        }

        // Иконка add-fill
        const addFillAsset = Asset.fromModule(require('../../assets/images/add-fill.svg'));
        await addFillAsset.downloadAsync();
        if (addFillAsset.localUri) {
          const response = await fetch(addFillAsset.localUri);
          const fileContent = await response.text();
          setAddFillIconSvg(fileContent);
        }

        // Иконка крестика
        const closeIconAsset = Asset.fromModule(require('../../assets/images/compact-button-icon.svg'));
        await closeIconAsset.downloadAsync();
        if (closeIconAsset.localUri) {
          const response = await fetch(closeIconAsset.localUri);
          const fileContent = await response.text();
          setModalCloseIconSvg(fileContent);
        }

        // Иконки радиокнопок
        const radioActiveAsset = Asset.fromModule(require('../../assets/images/radio-active-icon.svg'));
        await radioActiveAsset.downloadAsync();
        if (radioActiveAsset.localUri) {
          const response = await fetch(radioActiveAsset.localUri);
          const fileContent = await response.text();
          setRadioActiveSvg(fileContent);
        }

        const radioInactiveAsset = Asset.fromModule(require('../../assets/images/radio-inactive-icon.svg'));
        await radioInactiveAsset.downloadAsync();
        if (radioInactiveAsset.localUri) {
          const response = await fetch(radioInactiveAsset.localUri);
          const fileContent = await response.text();
          setRadioInactiveSvg(fileContent);
        }

        const logoAsset = Asset.fromModule(require('../../assets/images/restaurant-avatar-placeholder.svg'));
        await logoAsset.downloadAsync();
        if (logoAsset.localUri) {
          const response = await fetch(logoAsset.localUri);
          const fileContent = await response.text();
          setLogoPlaceholderSvg(fileContent);
        }
        
        // Иконка для "Оценка бизнес-направлений"
        const businessAssessmentAsset = Asset.fromModule(require('../../assets/images/business-assessment-icon.svg'));
        await businessAssessmentAsset.downloadAsync();
        if (businessAssessmentAsset.localUri) {
          const response = await fetch(businessAssessmentAsset.localUri);
          const fileContent = await response.text();
          setBusinessAssessmentIconSvg(fileContent);
        }
        
        // Иконка монет для карточки "Финансы и бухгалтерия"
        const coinsAsset = Asset.fromModule(require('../../assets/images/coins-icon.svg'));
        await coinsAsset.downloadAsync();
        if (coinsAsset.localUri) {
          const response = await fetch(coinsAsset.localUri);
          const fileContent = await response.text();
          setCoinsIconSvg(fileContent);
        }
        
        // Иконка colors для карточки "Концепция и позиционирование"
        const colorsAsset = Asset.fromModule(require('../../assets/images/colors-icon.svg'));
        await colorsAsset.downloadAsync();
        if (colorsAsset.localUri) {
          const response = await fetch(colorsAsset.localUri);
          const fileContent = await response.text();
          setColorsIconSvg(fileContent);
        }
        
        // Иконка chart-bar-line для карточки "Управление и организация"
        const chartBarLineAsset = Asset.fromModule(require('../../assets/images/chart-bar-line-icon.svg'));
        await chartBarLineAsset.downloadAsync();
        if (chartBarLineAsset.localUri) {
          const response = await fetch(chartBarLineAsset.localUri);
          const fileContent = await response.text();
          setChartBarLineIconSvg(fileContent);
        }
        
        // Иконка file для карточки "Продуктовая стратегия"
        const fileAsset = Asset.fromModule(require('../../assets/images/file-icon.svg'));
        await fileAsset.downloadAsync();
        if (fileAsset.localUri) {
          const response = await fetch(fileAsset.localUri);
          const fileContent = await response.text();
          setFileIconSvg(fileContent);
        }
        
        // Иконка marketing для карточки "Маркетинг и продажи"
        const marketingAsset = Asset.fromModule(require('../../assets/images/marketing-icon.svg'));
        await marketingAsset.downloadAsync();
        if (marketingAsset.localUri) {
          const response = await fetch(marketingAsset.localUri);
          const fileContent = await response.text();
          setMarketingIconSvg(fileContent);
        }
        
        // Иконка computer-settings для карточки "Операционная деятельность"
        const computerSettingsAsset = Asset.fromModule(require('../../assets/images/computer-settings-icon.svg'));
        await computerSettingsAsset.downloadAsync();
        if (computerSettingsAsset.localUri) {
          const response = await fetch(computerSettingsAsset.localUri);
          const fileContent = await response.text();
          setComputerSettingsIconSvg(fileContent);
        }
        
        // Иконка user-multiple для карточки "Клиентский опыт"
        const userMultipleAsset = Asset.fromModule(require('../../assets/images/user-multiple-icon.svg'));
        await userMultipleAsset.downloadAsync();
        if (userMultipleAsset.localUri) {
          const response = await fetch(userMultipleAsset.localUri);
          const fileContent = await response.text();
          setUserMultipleIconSvg(fileContent);
        }
        
        // Иконка dish-washer для карточки "Инфраструктура и оборудование"
        const dishWasherAsset = Asset.fromModule(require('../../assets/images/dish-washer-icon.svg'));
        await dishWasherAsset.downloadAsync();
        if (dishWasherAsset.localUri) {
          const response = await fetch(dishWasherAsset.localUri);
          const fileContent = await response.text();
          setDishWasherIconSvg(fileContent);
        }
        
        // Иконка legal-document для карточки "Риски и нормы"
        const legalDocumentAsset = Asset.fromModule(require('../../assets/images/legal-document-icon.svg'));
        await legalDocumentAsset.downloadAsync();
        if (legalDocumentAsset.localUri) {
          const response = await fetch(legalDocumentAsset.localUri);
          const fileContent = await response.text();
          setLegalDocumentIconSvg(fileContent);
        }
        
        // Иконка chart-increase для карточки "Стратегия развития"
        const chartIncreaseAsset = Asset.fromModule(require('../../assets/images/chart-increase-icon.svg'));
        await chartIncreaseAsset.downloadAsync();
        if (chartIncreaseAsset.localUri) {
          const response = await fetch(chartIncreaseAsset.localUri);
          const fileContent = await response.text();
          setChartIncreaseIconSvg(fileContent);
        }
        
        // Иконка close для модального окна
        const closeSvg = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.773 3.7125L8.4855 0L9.546 1.0605L5.8335 4.773L9.546 8.4855L8.4855 9.546L4.773 5.8335L1.0605 9.546L0 8.4855L3.7125 4.773L0 1.0605L1.0605 0L4.773 3.7125Z" fill="#525866"/></svg>';
        setCloseIconSvg(closeSvg);
        
        efficiencyIconsLoadedRef.current = true;
      } catch (error) {
        console.error('Ошибка загрузки SVG иконок эффективности:', error);
      }
    };
    
    loadEfficiencyIcons();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authStatus = await AsyncStorage.getItem('isAuthenticated');
      setIsAuthenticated(authStatus === 'true');
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      setIsAuthenticated(false);
    }
  };


  // НЕ обновляем данные при фокусе - они уже загружены в useEffect и не должны меняться
  // Это предотвращает ререндеры шапки при переключении между экранами

  const loadDashboardData = async () => {
    try {
      console.log('Загружаем данные дашборда...');
      
      const userId = await getCurrentUserId();
      
      // Загружаем существующие данные
      let storedBlocks: DiagnosisBlock[] | null = null;
      let storedTasks: Task[] = [];
      
      if (userId) {
        storedBlocks = await loadUserBlocks(userId);
        storedTasks = await loadUserTasks(userId);
      } else {
        // Fallback к глобальным данным
        const blocksJson = await AsyncStorage.getItem('diagnosisBlocks');
        const tasksJson = await AsyncStorage.getItem('actionPlanTasks');
        if (blocksJson) storedBlocks = JSON.parse(blocksJson);
        if (tasksJson) storedTasks = JSON.parse(tasksJson);
      }
      
      let allBlocksCompleted: string | null = null;
      let storedPrevious: string | null = null;
      let storedCurrent: string | null = null;
      
      if (userId) {
        const dashboardData = await loadUserDashboardData(userId);
        allBlocksCompleted = dashboardData.allBlocksCompleted;
        storedPrevious = dashboardData.previousResult;
        storedCurrent = dashboardData.currentResult;
      } else {
        // Fallback к глобальным данным
        allBlocksCompleted = await AsyncStorage.getItem('dashboardAllBlocksCompleted');
        storedPrevious = await AsyncStorage.getItem('dashboardPreviousResult');
        storedCurrent = await AsyncStorage.getItem('dashboardCurrentResult');
      }
      
      if (storedBlocks) {
        const blocks = Array.isArray(storedBlocks) ? storedBlocks : JSON.parse(storedBlocks);
        // Объединяем загруженные блоки с дефолтными, чтобы показать все блоки
        const allBlocks = DEFAULT_BLOCKS.map(defaultBlock => {
          const foundBlock = blocks.find((b: DiagnosisBlock) => b.id === defaultBlock.id);
          if (foundBlock) {
            // Если блок найден, используем его данные (включая efficiency и completed)
            return {
              ...defaultBlock,
              ...foundBlock,
              // Сохраняем title и description из DEFAULT_BLOCKS
              title: defaultBlock.title,
              description: defaultBlock.description,
            };
          }
          return defaultBlock;
        });
        const blocksJson = JSON.stringify(allBlocks);
        if (prevBlocksRef.current !== blocksJson) {
          prevBlocksRef.current = blocksJson;
          setBlockResults(allBlocks);
          setOverallEfficiency(calculateOverallEfficiency(allBlocks));
          console.log('Загружены блоки для дашборда:', allBlocks.length);
        } else {
          console.log('Данные блоков не изменились — пропускаем обновление состояния');
        }
        
        // Проверяем, все ли блоки завершены
        const completedBlocks = allBlocks.filter(b => b.completed && b.efficiency !== undefined);
        const allCompleted = completedBlocks.length === DEFAULT_BLOCKS.length;
        
        if (allCompleted && completedBlocks.length > 0) {
          // Рассчитываем среднюю эффективность по всем блокам
          const avgEfficiency = Math.round(
            completedBlocks.reduce((sum, b) => sum + (b.efficiency || 0), 0) / completedBlocks.length
          );
          
          const wasAllCompleted = allBlocksCompleted === 'true';
          const previousValue = storedPrevious ? parseInt(storedPrevious, 10) : null;
          const currentValue = storedCurrent ? parseInt(storedCurrent, 10) : 0;
          
          if (!wasAllCompleted) {
            // Первое прохождение всех блоков - сохраняем только ТЕКУЩИЙ, ПРЕДЫДУЩИЙ не сохраняем
            if (userId) {
              await saveUserDashboardData(userId, {
                allBlocksCompleted: 'true',
                currentResult: avgEfficiency.toString(),
                // previousResult не сохраняем при первом прохождении
              });
            } else {
              await AsyncStorage.setItem('dashboardAllBlocksCompleted', 'true');
              await AsyncStorage.setItem('dashboardCurrentResult', avgEfficiency.toString());
              // previousResult не сохраняем при первом прохождении
            }
            const newComparison = { previous: null, current: avgEfficiency, change: undefined };
            const comparisonJson = JSON.stringify(newComparison);
            if (prevComparisonRef.current !== comparisonJson) {
              prevComparisonRef.current = comparisonJson;
              setComparison(newComparison);
            }
          } else {
            // Последующие прохождения - проверяем, изменился ли результат
            if (avgEfficiency !== currentValue) {
              // Результат изменился - обновляем ПРЕДЫДУЩИЙ и ТЕКУЩИЙ
              const newPrevious = currentValue;
              const newCurrent = avgEfficiency;
              const change = newCurrent - newPrevious;
              
              if (userId) {
                await saveUserDashboardData(userId, {
                  previousResult: newPrevious.toString(),
                  currentResult: newCurrent.toString(),
                });
              } else {
                await AsyncStorage.setItem('dashboardPreviousResult', newPrevious.toString());
                await AsyncStorage.setItem('dashboardCurrentResult', newCurrent.toString());
              }
              const newComparison = { previous: newPrevious, current: newCurrent, change };
              const comparisonJson = JSON.stringify(newComparison);
              if (prevComparisonRef.current !== comparisonJson) {
                prevComparisonRef.current = comparisonJson;
                setComparison(newComparison);
              }
            } else {
              // Результат не изменился - используем сохраненные значения
              const change = previousValue !== null && currentValue !== previousValue ? currentValue - previousValue : undefined;
              const newComparison = { previous: previousValue, current: currentValue, change };
              const comparisonJson = JSON.stringify(newComparison);
              if (prevComparisonRef.current !== comparisonJson) {
                prevComparisonRef.current = comparisonJson;
                setComparison(newComparison);
              }
            }
          }
        } else {
          // Не все блоки завершены - ПРЕДЫДУЩИЙ = null, ТЕКУЩИЙ = среднее по завершенным блокам (или 0)
          const avgEfficiency = completedBlocks.length > 0 
            ? Math.round(completedBlocks.reduce((sum, b) => sum + (b.efficiency || 0), 0) / completedBlocks.length)
            : 0;
          const newComparison = { previous: null, current: avgEfficiency, change: undefined };
          const comparisonJson = JSON.stringify(newComparison);
          if (prevComparisonRef.current !== comparisonJson) {
            prevComparisonRef.current = comparisonJson;
            setComparison(newComparison);
          }
        }
      } else {
        // Если блоков нет, показываем дефолтные
        const defaultBlocksJson = JSON.stringify(DEFAULT_BLOCKS);
        if (prevBlocksRef.current !== defaultBlocksJson) {
          prevBlocksRef.current = defaultBlocksJson;
          setBlockResults(DEFAULT_BLOCKS);
          setOverallEfficiency(0);
        }
        const newComparison = { previous: null, current: 0, change: undefined };
        const comparisonJson = JSON.stringify(newComparison);
        if (prevComparisonRef.current !== comparisonJson) {
          prevComparisonRef.current = comparisonJson;
          setComparison(newComparison);
        }
        console.log('Блоков в хранилище нет, показываем дефолтные');
      }
      
      if (storedTasks && storedTasks.length > 0) {
        const tasksToShow = storedTasks.slice(0, 3);
        const tasksJson = JSON.stringify(tasksToShow);
        if (prevTasksRef.current !== tasksJson) {
          prevTasksRef.current = tasksJson;
          // Показываем только первые 3 задачи для списка
          setTasks(tasksToShow);
          // Сохраняем общее количество задач для метрики
          setAllTasksCount(storedTasks.length);
          // Группируем задачи по блокам
          const groupedTasks = getTasksByBlock(storedTasks);
          setTasksByBlock(groupedTasks);
          console.log('Загружены задачи для дашборда:', storedTasks.length);
        }
      } else {
        const emptyTasksJson = JSON.stringify([]);
        if (prevTasksRef.current !== emptyTasksJson) {
          prevTasksRef.current = emptyTasksJson;
          setTasks([]);
          setAllTasksCount(0);
          setTasksByBlock({});
          console.log('Задач для дашборда нет');
        }
      }
      
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setTasks([]);
      setBlockResults(DEFAULT_BLOCKS);
      setComparison({ previous: 0, current: 0, change: 0 });
      setOverallEfficiency(0);
    }
  };

  const loadDashboardDataWithoutClearing = async () => {
    try {
      console.log('Загружаем данные дашборда без очистки...');
      
      const userId = await getCurrentUserId();
      
      // НЕ ЗАГРУЖАЕМ данные профиля здесь - они загружаются один раз в loadProfileData
      // Это предотвращает ре-рендеры шапки при фокусе экрана
      
      // Загружаем существующие данные
      let storedBlocks: DiagnosisBlock[] | null = null;
      let storedTasks: Task[] = [];
      
      if (userId) {
        storedBlocks = await loadUserBlocks(userId);
        storedTasks = await loadUserTasks(userId);
      } else {
        // Fallback к глобальным данным
        const blocksJson = await AsyncStorage.getItem('diagnosisBlocks');
        const tasksJson = await AsyncStorage.getItem('actionPlanTasks');
        if (blocksJson) storedBlocks = JSON.parse(blocksJson);
        if (tasksJson) storedTasks = JSON.parse(tasksJson);
      }
      let allBlocksCompleted: string | null = null;
      let storedPrevious: string | null = null;
      let storedCurrent: string | null = null;
      
      if (userId) {
        const dashboardData = await loadUserDashboardData(userId);
        allBlocksCompleted = dashboardData.allBlocksCompleted;
        storedPrevious = dashboardData.previousResult;
        storedCurrent = dashboardData.currentResult;
      } else {
        allBlocksCompleted = await AsyncStorage.getItem('dashboardAllBlocksCompleted');
        storedPrevious = await AsyncStorage.getItem('dashboardPreviousResult');
        storedCurrent = await AsyncStorage.getItem('dashboardCurrentResult');
      }
      
      if (storedBlocks) {
        const blocks = Array.isArray(storedBlocks) ? storedBlocks : JSON.parse(storedBlocks);
        // Объединяем загруженные блоки с дефолтными, чтобы показать все блоки
        const allBlocks = DEFAULT_BLOCKS.map(defaultBlock => {
          const foundBlock = blocks.find((b: DiagnosisBlock) => b.id === defaultBlock.id);
          if (foundBlock) {
            // Если блок найден, используем его данные (включая efficiency и completed)
            return {
              ...defaultBlock,
              ...foundBlock,
              // Сохраняем title и description из DEFAULT_BLOCKS
              title: defaultBlock.title,
              description: defaultBlock.description,
            };
          }
          return defaultBlock;
        });
        const blocksJson = JSON.stringify(allBlocks);
        if (prevBlocksRef.current !== blocksJson) {
          prevBlocksRef.current = blocksJson;
          setBlockResults(allBlocks);
          setOverallEfficiency(calculateOverallEfficiency(allBlocks));
          console.log('Загружены блоки для дашборда:', allBlocks.length);
        } else {
          console.log('Данные блоков не изменились — пропускаем обновление состояния');
        }
        
        // Проверяем, все ли блоки завершены
        const completedBlocks = allBlocks.filter(b => b.completed && b.efficiency !== undefined);
        const allCompleted = completedBlocks.length === DEFAULT_BLOCKS.length;
        
        if (allCompleted && completedBlocks.length > 0) {
          // Рассчитываем среднюю эффективность по всем блокам
          const avgEfficiency = Math.round(
            completedBlocks.reduce((sum, b) => sum + (b.efficiency || 0), 0) / completedBlocks.length
          );
          
          const wasAllCompleted = allBlocksCompleted === 'true';
          const previousValue = storedPrevious ? parseInt(storedPrevious, 10) : null;
          const currentValue = storedCurrent ? parseInt(storedCurrent, 10) : 0;
          
          if (!wasAllCompleted) {
            // Первое прохождение всех блоков - сохраняем только ТЕКУЩИЙ, ПРЕДЫДУЩИЙ не сохраняем
            if (userId) {
              await saveUserDashboardData(userId, {
                allBlocksCompleted: 'true',
                currentResult: avgEfficiency.toString(),
                // previousResult не сохраняем при первом прохождении
              });
            } else {
              await AsyncStorage.setItem('dashboardAllBlocksCompleted', 'true');
              await AsyncStorage.setItem('dashboardCurrentResult', avgEfficiency.toString());
              // previousResult не сохраняем при первом прохождении
            }
            const newComparison = { previous: null, current: avgEfficiency, change: undefined };
            const comparisonJson = JSON.stringify(newComparison);
            if (prevComparisonRef.current !== comparisonJson) {
              prevComparisonRef.current = comparisonJson;
              setComparison(newComparison);
            }
          } else {
            // Последующие прохождения - проверяем, изменился ли результат
            if (avgEfficiency !== currentValue) {
              // Результат изменился - обновляем ПРЕДЫДУЩИЙ и ТЕКУЩИЙ
              const newPrevious = currentValue;
              const newCurrent = avgEfficiency;
              const change = newCurrent - newPrevious;
              
              if (userId) {
                await saveUserDashboardData(userId, {
                  previousResult: newPrevious.toString(),
                  currentResult: newCurrent.toString(),
                });
              } else {
                await AsyncStorage.setItem('dashboardPreviousResult', newPrevious.toString());
                await AsyncStorage.setItem('dashboardCurrentResult', newCurrent.toString());
              }
              const newComparison = { previous: newPrevious, current: newCurrent, change };
              const comparisonJson = JSON.stringify(newComparison);
              if (prevComparisonRef.current !== comparisonJson) {
                prevComparisonRef.current = comparisonJson;
                setComparison(newComparison);
              }
            } else {
              // Результат не изменился - используем сохраненные значения
              const change = previousValue !== null && currentValue !== previousValue ? currentValue - previousValue : undefined;
              const newComparison = { previous: previousValue, current: currentValue, change };
              const comparisonJson = JSON.stringify(newComparison);
              if (prevComparisonRef.current !== comparisonJson) {
                prevComparisonRef.current = comparisonJson;
                setComparison(newComparison);
              }
            }
          }
        } else {
          // Не все блоки завершены - ПРЕДЫДУЩИЙ = null, ТЕКУЩИЙ = среднее по завершенным блокам (или 0)
          const avgEfficiency = completedBlocks.length > 0 
            ? Math.round(completedBlocks.reduce((sum, b) => sum + (b.efficiency || 0), 0) / completedBlocks.length)
            : 0;
          const newComparison = { previous: null, current: avgEfficiency, change: undefined };
          const comparisonJson = JSON.stringify(newComparison);
          if (prevComparisonRef.current !== comparisonJson) {
            prevComparisonRef.current = comparisonJson;
            setComparison(newComparison);
          }
        }
      } else {
        // Если блоков нет, показываем дефолтные
        const defaultBlocksJson = JSON.stringify(DEFAULT_BLOCKS);
        if (prevBlocksRef.current !== defaultBlocksJson) {
          prevBlocksRef.current = defaultBlocksJson;
          setBlockResults(DEFAULT_BLOCKS);
          setOverallEfficiency(0);
        }
        const newComparison = { previous: null, current: 0, change: undefined };
        const comparisonJson = JSON.stringify(newComparison);
        if (prevComparisonRef.current !== comparisonJson) {
          prevComparisonRef.current = comparisonJson;
          setComparison(newComparison);
        }
        console.log('Блоков в хранилище нет, показываем дефолтные');
      }

      // Загружаем задачи
      if (storedTasks && storedTasks.length > 0) {
        const tasksToShow = storedTasks.slice(0, 3);
        const tasksJson = JSON.stringify(tasksToShow);
        if (prevTasksRef.current !== tasksJson) {
          prevTasksRef.current = tasksJson;
          setTasks(tasksToShow); // Показываем только первые 3 задачи
          setAllTasksCount(storedTasks.length); // Сохраняем общее количество задач
          // Группируем задачи по блокам
          const groupedTasks = getTasksByBlock(storedTasks);
          setTasksByBlock(groupedTasks);
          console.log('Загружены задачи для дашборда:', storedTasks.length);
        }
      } else {
        const emptyTasksJson = JSON.stringify([]);
        if (prevTasksRef.current !== emptyTasksJson) {
          prevTasksRef.current = emptyTasksJson;
          setTasks([]);
          setAllTasksCount(0);
          setTasksByBlock({});
          console.log('Задач для дашборда нет');
        }
      }
      
    } catch (error) {
      console.error('Ошибка загрузки данных дашборда:', error);
    }
  };

  // Функция для получения иконки блока
  const getBlockIcon = (blockId: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      'concept': 'bulb-outline',
      'finance': 'cash-outline',
      'management': 'people-outline',
      'menu': 'restaurant-outline',
      'marketing': 'megaphone-outline',
      'operations': 'settings-outline',
      'client_experience': 'happy-outline',
      'infrastructure': 'build-outline',
      'risks': 'shield-outline',
      'strategy': 'trending-up-outline',
    };
    return iconMap[blockId] || 'cube-outline';
  };

  const getEfficiencyColor = (efficiency?: number): { bg: string; text: string; border?: string } => {
    if (efficiency === undefined || efficiency === null) {
      return { bg: COLORS.gray, text: COLORS.darkGray };
    }
    
    // Чем ниже эффективность, тем тревожнее цвет
    if (efficiency >= 80) {
      // Высокая эффективность - спокойный зеленоватый
      return { bg: '#E8F5E9', text: COLORS.green, border: '#81C784' };
    } else if (efficiency >= 60) {
      // Средняя эффективность - нейтральный голубоватый
      return { bg: '#E3F2FD', text: COLORS.blue, border: '#64B5F6' };
    } else if (efficiency >= 40) {
      // Низкая эффективность - предупреждающий оранжевый
      return { bg: '#FFF3E0', text: '#F57C00', border: '#FFB74D' };
    } else {
      // Очень низкая эффективность - тревожный красноватый
      return { bg: '#FFEBEE', text: '#D32F2F', border: '#E57373' };
    }
  };



  const handleScroll = (event: any) => {
    // Обработка скролла
  };

  const venues = [
    { id: '1', name: 'Проект', city: 'город' },
    { id: '2', name: 'Проект', city: 'город' },
  ];

  const toggleVenue = (venueId: string) => {
    setSelectedVenueId(venueId);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Секция профиля проекта - отдельный компонент, полностью изолирован */}
        <DashboardHeader navigation={navigation} />

        {/* Секция Общая эффективность */}
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
              {refreshIconSvg && (
                <AnimatedPressable
                  style={styles.iconButton}
                  onPress={() => navigation.navigate('DiagnosisHistory')}
                >
                  <SvgXml xml={refreshIconSvg} width={36} height={36} />
                </AnimatedPressable>
              )}
              {addIconSvg && (
                <AnimatedPressable
                  style={styles.iconButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <SvgXml xml={addIconSvg} width={36} height={36} />
                </AnimatedPressable>
              )}
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
              {(() => {
                const weakBlocksCount = blockResults.filter(b => b.completed && b.efficiency !== undefined && b.efficiency < 38).length;
                // Преобразуем количество слабых блоков (0-10) в процент для определения цвета по той же шкале, что в карточках
                // 0 слабых = 100% (все хорошо), 10 слабых = 0% (все плохо)
                // Инвертируем: если 0 слабых блоков, это 100% эффективности, если 10 слабых - 0%
                const efficiencyPercent = weakBlocksCount === 0 ? 100 : Math.max(0, 100 - (weakBlocksCount * 10));
                const weakBlocksColors = getDiagnosisBadgeColors(efficiencyPercent);
                return (
                  <View style={[styles.metricBadge, { backgroundColor: weakBlocksColors.bg, minWidth: 35, paddingHorizontal: 6 }]}>
                    <Text style={[styles.weakBlocksBadgeText, { color: weakBlocksColors.text }]}>
                      {weakBlocksCount}
                    </Text>
                  </View>
                );
              })()}
            </View>
            
            {/* Серая полоса под "Слабых блоков" */}
            <View style={styles.weakBlocksDivider} />

            {/* Прошлая диагностика */}
            <View style={[styles.metricItem, { marginTop: 20 }]}>
              <Text style={styles.metricLabel}>Прошлая диагностика</Text>
              <View style={styles.metricValueRow}>
                <View style={styles.changeIndicator}>
                  {changeDisplayValue !== 0 && (
                    <Text style={[styles.changeText, { color: changeColor, marginRight: 2 }]}>
                      {changeArrow === 'arrow-up' ? '▴' : '▾'}
                    </Text>
                  )}
                  <Text style={[styles.changeText, { color: changeColor }]}>
                    {changeDisplayValue}%
                  </Text>
                </View>
                <View style={[styles.metricBadge, styles.previousDiagnosisBadge, { backgroundColor: currentBadgeColors.bg }]}>
                  <Text style={[styles.previousDiagnosisBadgeText, { color: currentBadgeColors.text }]}>
                    {`${currentBadgeValue}%`}
                  </Text>
                </View>
              </View>
            </View>

            {/* Задач по улучшению */}
            <View style={[styles.metricItem, { marginTop: -3 }]}>
              <Text style={styles.metricLabel}>Задач по улучшению</Text>
              <View style={[styles.metricBadge, styles.tasksBadge]}>
                <Text style={styles.tasksBadgeText}>
                  {allTasksCount}
                </Text>
              </View>
            </View>
          </View>

          {/* Кнопка "План улучшений" */}
          <AnimatedPressable 
            style={[styles.improvementPlanButton, { marginTop: -20 }]}
            onPress={() => navigation.navigate('ActionPlan')}
          >
            <Text style={styles.improvementPlanButtonText}>План улучшений</Text>
          </AnimatedPressable>
        </View>

        {/* Секция Оценка бизнес-направлений */}
        <View style={styles.businessAssessmentTitleContainer}>
          <Text style={styles.businessAssessmentTitle}>Оценка бизнес-направлений</Text>
          {businessAssessmentIconSvg && (
            <View style={styles.businessAssessmentIconContainer}>
              <SvgXml xml={businessAssessmentIconSvg} width={40} height={40} />
            </View>
          )}
        </View>
        {/* Сетка карточек блоков */}
        <View style={styles.blocksGridContainer}>
          <View style={styles.blocksGridNew}>
            {blockResults.map((block) => {
              const efficiency = block.efficiency ?? 0;
              const colors = getEfficiencyColor(block.efficiency);
              const blockTasks = tasksByBlock[block.id] || { total: 0, completed: 0 };
              const iconName = getBlockIcon(block.id);
              
              // Определяем цвет badge по тем же правилам, что и "Прошлая диагностика"
              const blockEfficiencyValue = block.completed && block.efficiency !== undefined ? block.efficiency : 0;
              const blockBadgeColors = getDiagnosisBadgeColors(blockEfficiencyValue);

              return (
                <AnimatedPressable
                  key={block.id}
                  style={styles.businessBlockCard}
                  onPress={() => {
                    // Навигация на BlockDetail удалена
                  }}
                >
                  {/* Верх: иконка слева и процент эффективности в badge справа */}
                  <View style={styles.blockCardTopRow}>
                    {/* Иконка в левом верхнем углу */}
                    {block.id === 'finance' && coinsIconSvg && (
                      <View style={styles.blockCardIcon}>
                        <SvgXml xml={coinsIconSvg} width={38} height={38} />
                      </View>
                    )}
                    {block.id === 'concept' && colorsIconSvg && (
                      <View style={styles.blockCardIcon}>
                        <SvgXml xml={colorsIconSvg} width={38} height={38} />
                      </View>
                    )}
                    {block.id === 'management' && chartBarLineIconSvg && (
                      <View style={styles.blockCardIcon}>
                        <SvgXml xml={chartBarLineIconSvg} width={38} height={38} />
                      </View>
                    )}
                    {block.id === 'menu' && fileIconSvg && (
                      <View style={styles.blockCardIcon}>
                        <SvgXml xml={fileIconSvg} width={38} height={38} />
                      </View>
                    )}
                    {block.id === 'marketing' && marketingIconSvg && (
                      <View style={styles.blockCardIcon}>
                        <SvgXml xml={marketingIconSvg} width={38} height={38} />
                      </View>
                    )}
                    {block.id === 'operations' && computerSettingsIconSvg && (
                      <View style={styles.blockCardIcon}>
                        <SvgXml xml={computerSettingsIconSvg} width={38} height={38} />
                      </View>
                    )}
                    {block.id === 'client_experience' && userMultipleIconSvg && (
                      <View style={styles.blockCardIcon}>
                        <SvgXml xml={userMultipleIconSvg} width={38} height={38} />
                      </View>
                    )}
                    {block.id === 'infrastructure' && dishWasherIconSvg && (
                      <View style={styles.blockCardIcon}>
                        <SvgXml xml={dishWasherIconSvg} width={38} height={38} />
                      </View>
                    )}
                    {block.id === 'risks' && legalDocumentIconSvg && (
                      <View style={styles.blockCardIcon}>
                        <SvgXml xml={legalDocumentIconSvg} width={38} height={38} />
                      </View>
                    )}
                    {block.id === 'strategy' && chartIncreaseIconSvg && (
                      <View style={styles.blockCardIcon}>
                        <SvgXml xml={chartIncreaseIconSvg} width={38} height={38} />
                      </View>
                    )}
                    {/* Процент эффективности в badge справа */}
                    <View
                      style={[
                        styles.blockEfficiencyBadge,
                        { backgroundColor: blockBadgeColors.bg },
                      ]}
                    >
                      <Text style={[styles.blockEfficiencyPercent, { color: blockBadgeColors.text }]}>
                        {block.completed && block.efficiency !== undefined ? `${block.efficiency}%` : '0%'}
                      </Text>
                    </View>
                  </View>

                  {/* Низ: заголовок и задачи как единый блок снизу */}
                  <View style={styles.blockTextGroup}>
                    <View style={styles.blockHeader}>
                      <Text
                        style={styles.blockTitle}
                        numberOfLines={block.id === 'strategy' ? 1 : undefined}
                        ellipsizeMode={block.id === 'strategy' ? 'clip' : 'tail'}
                      >
                        {block.title}
                      </Text>
                      {block.completed && (
                        <Ionicons name="checkmark-circle" size={22} color={palette.primaryOrange} />
                      )}
                    </View>
                    <Text style={styles.blockTasksText}>
                      {(() => {
                        // Если эффективность блока от 90% до 100% включительно - показываем "Все хорошо"
                        if (block.completed && block.efficiency !== undefined && block.efficiency >= 90 && block.efficiency <= 100) {
                          return 'Все хорошо';
                        }
                        // Иначе показываем количество задач
                        const n = blockTasks.total;
                        if (n === 0) return '0 задач';
                        const lastDigit = n % 10;
                        const lastTwoDigits = n % 100;
                        let taskWord = 'задач';
                        if (lastTwoDigits >= 11 && lastTwoDigits <= 14) taskWord = 'задач';
                        else if (lastDigit === 1) taskWord = 'задача';
                        else if (lastDigit >= 2 && lastDigit <= 4) taskWord = 'задачи';
                        return `${n} ${taskWord}`;
                      })()}
                    </Text>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        {/* Секция призыва к действию */}
        <View style={[styles.section, styles.ctaSection]}>
          <ImageBackground 
            source={require('../../assets/images/cta-card-background.png')} 
            style={styles.ctaCard}
            imageStyle={styles.ctaCardBackgroundImage}
          >
            <Text style={styles.ctaTitle}>Провалы в эффективности?</Text>
            <Text style={styles.ctaDescription} numberOfLines={1} ellipsizeMode="tail">
              У нас есть решения для всех направлений
            </Text>
            <AnimatedPressable 
              style={styles.ctaButton}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('Help');
                }
              }}
            >
              <Text style={styles.ctaButtonText}>Улучшить эффективность</Text>
            </AnimatedPressable>
          </ImageBackground>
        </View>
      </ScrollView>

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
              {closeIconSvg && (
                <TouchableOpacity 
                  onPress={() => setShowEfficiencyModal(false)}
                  style={styles.modalCloseButton}
                >
                  <SvgXml xml={closeIconSvg} width={10} height={10} />
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

      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Выберите ресторан</Text>
              {modalCloseIconSvg && (
                <TouchableOpacity
                  style={styles.addModalCloseButton}
                  onPress={() => setShowAddModal(false)}
                >
                  <SvgXml xml={modalCloseIconSvg} width={24} height={24} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.venuesCard}>
              {venues.map((venue, index) => {
                const isSelected = venue.id === selectedVenueId;
                return (
                  <TouchableOpacity
                    key={venue.id}
                    style={[styles.venueRow, index === venues.length - 1 && styles.venueRowLast, { paddingHorizontal: 0 }]}
                    activeOpacity={0.8}
                    onPress={() => toggleVenue(venue.id)}
                  >
                    <View style={styles.venueAvatar}>
                      {logoPlaceholderSvg ? (
                        <View style={styles.venueIconScaled}>
                          <SvgXml xml={logoPlaceholderSvg} width={50} height={50} />
                        </View>
                      ) : (
                        <Ionicons name="image-outline" size={30} color={palette.gray400} />
                      )}
                    </View>
                    <View style={styles.venueInfo}>
                      <Text style={styles.venueName}>{venue.name}</Text>
                      <Text style={styles.venueCity}>{venue.city}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.radioButton}
                      activeOpacity={0.8}
                      onPress={() => toggleVenue(venue.id)}
                    >
                      {isSelected && radioActiveSvg ? (
                        <SvgXml xml={radioActiveSvg} width={20} height={20} />
                      ) : radioInactiveSvg ? (
                        <SvgXml xml={radioInactiveSvg} width={20} height={20} />
                      ) : (
                        <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.addMoreContainer}>
              {addFillIconSvg && (
                <SvgXml xml={addFillIconSvg} width={20} height={20} />
              )}
              <Text style={styles.addMoreText}>Добавить еще ресторан</Text>
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
    backgroundColor: palette.background,
  },
  scrollView: {
    flex: 1,
  },
  // Секция профиля проекта
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 0,
    paddingVertical: spacing.md,
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
    marginRight: spacing.md,
    marginLeft: spacing.sm,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    transform: [{ translateY: -2 }],
  },
  avatarContainer: {
    marginRight: 2,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.gray100,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectInfo: {
    flex: 1,
    transform: [{ translateY: -2 }],
  },
  projectName: {
    fontSize: 18,
    fontWeight: '400',
    color: '#0A0D14',
    marginBottom: spacing.xxs,
    marginTop: 0,
    marginLeft: -1,
    transform: [{ translateY: 2 }],
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
    minHeight: 22, // Фиксируем высоту, чтобы не прыгало
    minWidth: 60, // Фиксируем ширину, чтобы не прыгало
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 18, // Фиксируем высоту, чтобы не прыгало
  },
  cityText: {
    fontSize: 14,
    color: palette.gray600,
    marginRight: 2,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
    minHeight: 18, // Фиксируем высоту, чтобы не прыгало
    minWidth: 40, // Фиксируем ширину, чтобы не прыгало
  },
  cityIconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FD680A',
    paddingLeft: 6,
    paddingRight: 6,
    paddingVertical: 6,
    height: 32,
    borderRadius: 999,
    marginLeft: -1,
    transform: [{ translateY: -2 }],
  },
  helpButtonIconContainer: {
    marginRight: 2,
    marginLeft: 0,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '300',
    color: palette.white,
    lineHeight: 16,
    transform: [{ translateY: 0 }, { translateX: -1 }],
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
    minHeight: 16, // Фиксируем высоту, чтобы не прыгало
    minWidth: 90, // Фиксируем ширину текста, чтобы не прыгало
    transform: [{ translateY: 0 }, { translateX: -1 }],
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
    minHeight: 16, // Фиксируем высоту, чтобы не прыгало
    minWidth: 90, // Фиксируем ширину текста, чтобы не прыгало
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  // Секция Общая эффективность
  efficiencySection: {
    backgroundColor: palette.white,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg + 20,
    paddingBottom: spacing.md,
    marginBottom: spacing.lg,
    marginTop: -(spacing.md + 15),
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
    marginTop: -29, // Поднято еще на 1 пиксель выше (было -28, стало -29)
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
  iconButton: {
    // Убрали padding, чтобы иконки выравнивались как метрики ниже
  },
  efficiencyDivider: {
    height: 1,
    backgroundColor: '#E2E4E9',
    marginLeft: 5,
    marginRight: 5,
    marginBottom: (spacing.lg - spacing.sm) / 2,
    zIndex: 1,
    position: 'relative',
  },
  weakBlocksDivider: {
    height: 1,
    backgroundColor: '#E2E4E9',
    marginLeft: 0,
    marginRight: 0,
    marginBottom: (spacing.lg - spacing.sm) / 2,
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
  blocksCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.gray600,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    letterSpacing: 0.5,
  },
  metricsContainer: {
    marginBottom: spacing.lg,
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
  tasksBadge: {
    backgroundColor: '#F6F8FA',
    minWidth: 42,
    paddingHorizontal: 8,
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
  // Секция Оценка бизнес-направлений
  businessAssessmentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md - 14,
    marginBottom: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
  },
  businessAssessmentIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessAssessmentSection: {
    backgroundColor: palette.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  businessAssessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  businessAssessmentTitle: {
    fontSize: 21,
    fontWeight: '400',
    color: '#0A0D14',
  },
  filterButton: {
    padding: spacing.xs,
  },
  blocksGridContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: 3,
  },
  blocksGridNew: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  businessBlockCard: {
    width: 170,
    height: 140,
    backgroundColor: palette.white,
    borderRadius: radii.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xs + 5,
    marginBottom: spacing.md,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  blockCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  blockCardIcon: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  blockCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  blockIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockEfficiencyBadge: {
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 6,
    minWidth: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockEfficiencyPercent: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    includeFontPadding: false,
  },
  blockTextGroup: {
    marginTop: 0,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0A0D14',
    lineHeight: 20,
    flexWrap: 'wrap',
    flex: 1,
  },
  blockTasksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  blockTasksText: {
    fontSize: 14,
    fontWeight: '400',
    color: palette.gray600,
    marginTop: 2,
  },
  // Секция призыва к действию
  ctaSection: {
    marginBottom: spacing.lg,
  },
  ctaCard: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    height: 166,
    overflow: 'hidden',
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaCardBackgroundImage: {
    resizeMode: 'cover',
    transform: [{ translateY: 1 }, { scaleY: 1.03 }],
  },
  ctaTitle: {
    fontSize: 19,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  ctaDescription: {
    fontSize: 16,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  ctaButton: {
    backgroundColor: '#FD680A',
    borderRadius: 99,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '300',
    color: palette.white,
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
  addModalContent: {
    backgroundColor: '#F6F8FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    marginTop: SCREEN_HEIGHT * 0.67 - 25,
    height: SCREEN_HEIGHT * 0.33 + 25,
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  addModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  addModalTitle: {
    color: '#0A0D14',
    fontSize: 25,
    fontWeight: '300',
  },
  addModalCloseButton: {
    padding: spacing.xs,
    marginTop: -6,
    marginRight: -spacing.lg + 9,
  },
  venuesCard: {
    alignSelf: 'stretch',
    backgroundColor: palette.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  venueRowLast: {
    marginBottom: 0,
  },
  venueAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  venueIconScaled: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '300',
    color: '#0A0D14',
    marginBottom: spacing.xxs,
  },
  venueCity: {
    fontSize: 14,
    fontWeight: '300',
    color: palette.gray600,
  },
  radioButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2E4E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: palette.accentBlue,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.accentBlue,
  },
  addMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: spacing.md + 20,
    gap: spacing.xs,
  },
  addMoreText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#0A0D14',
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
    marginRight: -20,
    marginTop: -5,
  },
  modalScrollView: {
    flex: 1,
  },
  modalText: {
    fontSize: 16,
    fontWeight: '400', // Увеличено на 100 (300 -> 400)
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
    fontWeight: '500', // Увеличено на 200 (300 -> 500)
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
});
