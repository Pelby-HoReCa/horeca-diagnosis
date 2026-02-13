import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import AnimatedPressable from '../components/AnimatedPressable';
import { DEFAULT_BLOCKS, DiagnosisBlock } from '../data/diagnosisBlocks';
import { getTasksByBlock, Task } from '../utils/recommendationEngine';
import { getCurrentUserId, loadUserBlocks, loadUserQuestionnaire, loadUserTasks, saveUserTasks } from '../utils/userDataStorage';
import { palette, radii, spacing, typography } from '../styles/theme';

const logo = require('../../assets/images/logo-pelby.png');

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - spacing.md * 2;

// Task interface теперь импортируется из recommendationEngine

export default function ActionPlanScreen({ route, navigation }: { route?: any; navigation?: any }) {
  const [restaurantName, setRestaurantName] = useState('Проект');
  const [city, setCity] = useState<string>('');
  const [projectAvatarUri, setProjectAvatarUri] = useState<string | null>(null);
  const [cityIconSvg, setCityIconSvg] = useState<string>('');
  const [helpButtonIconSvg, setHelpButtonIconSvg] = useState<string>('');
  const [completedBlocks, setCompletedBlocks] = useState<DiagnosisBlock[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [emptyBlockIconSvg, setEmptyBlockIconSvg] = useState<string>('');
  const [coinsIconSvg, setCoinsIconSvg] = useState<string>('');
  const [colorsIconSvg, setColorsIconSvg] = useState<string>('');
  const [arrowRightIconSvg, setArrowRightIconSvg] = useState<string>('');
  const [fileIconSvg, setFileIconSvg] = useState<string>('');
  const [marketingIconSvg, setMarketingIconSvg] = useState<string>('');
  const [computerSettingsIconSvg, setComputerSettingsIconSvg] = useState<string>('');
  const [userMultipleIconSvg, setUserMultipleIconSvg] = useState<string>('');
  const [dishWasherIconSvg, setDishWasherIconSvg] = useState<string>('');
  const [legalDocumentIconSvg, setLegalDocumentIconSvg] = useState<string>('');
  const [chartIncreaseIconSvg, setChartIncreaseIconSvg] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [progressBarSvg, setProgressBarSvg] = useState<string>('');
  const [stepUncheckedSvg, setStepUncheckedSvg] = useState<string>('');
  const [stepCheckedSvg, setStepCheckedSvg] = useState<string>('');
  const [closeIconSvg, setCloseIconSvg] = useState<string>('');
  const [completedStepIds, setCompletedStepIds] = useState<Set<number>>(new Set());
  const [checkmarkIconSvg, setCheckmarkIconSvg] = useState<string>('');
  const [taskCompletedSteps, setTaskCompletedSteps] = useState<Record<string, Set<number>>>({});

  const getTaskKey = (task: Task) => {
    const baseId = (task as any).id || task.title || 'task';
    const blockId = (task as any).blockId || task.blockId || 'block';
    return `${baseId}__${blockId}`;
  };

  // При каждом перезапуске/монтировании экрана сбрасываем завершённость шагов
  useEffect(() => {
    setTaskCompletedSteps({});
    setCompletedStepIds(new Set<number>());
  }, []);

  useEffect(() => {
    loadTasks();
    loadProfileData();
    loadIcons();
    loadCompletedBlocks();
  }, []);

  // Обновляем задачи при возврате на экран (БЕЗ очистки данных)
  useFocusEffect(
    useCallback(() => {
      console.log('Экран "Задачи" получил фокус, обновляем задачи...');
      loadTasksWithoutClearing();
      loadCompletedBlocks();
    }, [])
  );

  const loadProfileData = async () => {
    try {
      const userId = await getCurrentUserId();
      
      if (userId) {
        const questionnaireData = await loadUserQuestionnaire(userId);
        if (questionnaireData && questionnaireData.restaurantName && questionnaireData.restaurantName.trim()) {
          setRestaurantName(questionnaireData.restaurantName);
        } else {
          setRestaurantName('Проект');
        }
        
        // Загружаем город
        if (questionnaireData && questionnaireData.city) {
          setCity(questionnaireData.city);
        }
      } else {
        setRestaurantName('Проект');
      }
      
      const savedProjectAvatar = await AsyncStorage.getItem('projectAvatar');
      if (savedProjectAvatar) {
        setProjectAvatarUri(savedProjectAvatar);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных профиля:', error);
    }
  };

  const loadIcons = async () => {
    try {
      // Загружаем SVG иконку для города
      const loadCityIcon = async () => {
        try {
          const iconAsset = Asset.fromModule(require('../../assets/images/arrow-down-city.svg'));
          await iconAsset.downloadAsync();
          if (iconAsset.localUri) {
            const response = await fetch(iconAsset.localUri);
            const fileContent = await response.text();
            setCityIconSvg(fileContent);
          }
        } catch (error) {
          console.error('Ошибка загрузки SVG иконки города:', error);
        }
      };
      
      // Загружаем SVG иконку для кнопки помощи
      const loadHelpButtonIcon = async () => {
        try {
          const iconAsset = Asset.fromModule(require('../../assets/images/help-button-icon.svg'));
          await iconAsset.downloadAsync();
          if (iconAsset.localUri) {
            const response = await fetch(iconAsset.localUri);
            const fileContent = await response.text();
            setHelpButtonIconSvg(fileContent);
          }
        } catch (error) {
          console.error('Ошибка загрузки SVG иконки кнопки помощи:', error);
        }
      };
      
      loadCityIcon();
      loadHelpButtonIcon();
      
      // Иконка стрелки вправо (серая, как в диагностике)
      const arrowAsset = Asset.fromModule(require('../../assets/images/arrow-right-s-line.svg'));
      await arrowAsset.downloadAsync();
      if (arrowAsset.localUri) {
        const response = await fetch(arrowAsset.localUri);
        const fileContent = await response.text();
        setArrowRightIconSvg(fileContent);
      }
      
      // Иконки блоков
      const coinsAsset = Asset.fromModule(require('../../assets/images/coins-icon.svg'));
      await coinsAsset.downloadAsync();
      if (coinsAsset.localUri) {
        const response = await fetch(coinsAsset.localUri);
        setCoinsIconSvg(await response.text());
      }

      const colorsAsset = Asset.fromModule(require('../../assets/images/colors-icon.svg'));
      await colorsAsset.downloadAsync();
      if (colorsAsset.localUri) {
        const response = await fetch(colorsAsset.localUri);
        setColorsIconSvg(await response.text());
      }

      const fileAsset = Asset.fromModule(require('../../assets/images/file-icon.svg'));
      await fileAsset.downloadAsync();
      if (fileAsset.localUri) {
        const response = await fetch(fileAsset.localUri);
        setFileIconSvg(await response.text());
      }

      const marketingAsset = Asset.fromModule(require('../../assets/images/marketing-icon.svg'));
      await marketingAsset.downloadAsync();
      if (marketingAsset.localUri) {
        const response = await fetch(marketingAsset.localUri);
        setMarketingIconSvg(await response.text());
      }

      const computerSettingsAsset = Asset.fromModule(require('../../assets/images/computer-settings-icon.svg'));
      await computerSettingsAsset.downloadAsync();
      if (computerSettingsAsset.localUri) {
        const response = await fetch(computerSettingsAsset.localUri);
        setComputerSettingsIconSvg(await response.text());
      }

      const userMultipleAsset = Asset.fromModule(require('../../assets/images/user-multiple-icon.svg'));
      await userMultipleAsset.downloadAsync();
      if (userMultipleAsset.localUri) {
        const response = await fetch(userMultipleAsset.localUri);
        setUserMultipleIconSvg(await response.text());
      }

      const dishWasherAsset = Asset.fromModule(require('../../assets/images/dish-washer-icon.svg'));
      await dishWasherAsset.downloadAsync();
      if (dishWasherAsset.localUri) {
        const response = await fetch(dishWasherAsset.localUri);
        setDishWasherIconSvg(await response.text());
      }

      const legalDocumentAsset = Asset.fromModule(require('../../assets/images/legal-document-icon.svg'));
      await legalDocumentAsset.downloadAsync();
      if (legalDocumentAsset.localUri) {
        const response = await fetch(legalDocumentAsset.localUri);
        setLegalDocumentIconSvg(await response.text());
      }

      const chartIncreaseAsset = Asset.fromModule(require('../../assets/images/chart-increase-icon.svg'));
      await chartIncreaseAsset.downloadAsync();
      if (chartIncreaseAsset.localUri) {
        const response = await fetch(chartIncreaseAsset.localUri);
        setChartIncreaseIconSvg(await response.text());
      }

      // Загружаем SVG иконки для модального окна задач
      // Используем inline SVG для надежности
      try {
        // Бар загрузки
        const progressBarSvgContent = '<svg width="361" height="3" viewBox="0 0 361 3" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="361" height="3" fill="#E2E4E9"/><rect width="161" height="3" fill="#38C793"/></svg>';
        setProgressBarSvg(progressBarSvgContent);
      } catch (error) {
        console.error('Ошибка загрузки progress-bar.svg:', error);
      }

      try {
        // Невыполненный шаг
        const stepUncheckedSvgContent = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21C7.0293 21 3 16.9707 3 12C3 7.0293 7.0293 3 12 3C16.9707 3 21 7.0293 21 12C21 16.9707 16.9707 21 12 21ZM12 19.2C13.9096 19.2 15.7409 18.4414 17.0912 17.0912C18.4414 15.7409 19.2 13.9096 19.2 12C19.2 10.0904 18.4414 8.25909 17.0912 6.90883C15.7409 5.55857 13.9096 4.8 12 4.8C10.0904 4.8 8.25909 5.55857 6.90883 6.90883C5.55857 8.25909 4.8 10.0904 4.8 12C4.8 13.9096 5.55857 15.7409 6.90883 17.0912C8.25909 18.4414 10.0904 19.2 12 19.2Z" fill="#868C98"/></svg>';
        setStepUncheckedSvg(stepUncheckedSvgContent);
      } catch (error) {
        console.error('Ошибка загрузки step-unchecked.svg:', error);
      }

      try {
        // Выполненный шаг
        const stepCheckedSvgContent = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21C7.0293 21 3 16.9707 3 12C3 7.0293 7.0293 3 12 3C16.9707 3 21 7.0293 21 12C21 16.9707 16.9707 21 12 21ZM11.1027 15.6L17.4657 9.2361L16.1931 7.9635L11.1027 13.0548L8.5566 10.5087L7.284 11.7813L11.1027 15.6Z" fill="#38C793"/></svg>';
        setStepCheckedSvg(stepCheckedSvgContent);
      } catch (error) {
        console.error('Ошибка загрузки step-checked.svg:', error);
      }

      // Иконка close для модального окна
      const closeSvg = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.773 3.7125L8.4855 0L9.546 1.0605L5.8335 4.773L9.546 8.4855L8.4855 9.546L4.773 5.8335L1.0605 9.546L0 8.4855L3.7125 4.773L0 1.0605L1.0605 0L4.773 3.7125Z" fill="#525866"/></svg>';
      setCloseIconSvg(closeSvg);
      console.log('Close icon SVG set');

      // Иконка галочки для выполненных задач
      try {
        // Используем inline SVG, так как файл может не загружаться через require
        const checkmarkSvg = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.50005 12.3791L15.3941 5.48438L16.4553 6.54488L8.50005 14.5001L3.72705 9.72712L4.78755 8.66663L8.50005 12.3791Z" fill="#868C98"/></svg>';
        setCheckmarkIconSvg(checkmarkSvg);
      } catch (error) {
        console.error('Ошибка загрузки checkmark-icon.svg:', error);
        // Fallback на inline SVG
        const checkmarkSvg = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.50005 12.3791L15.3941 5.48438L16.4553 6.54488L8.50005 14.5001L3.72705 9.72712L4.78755 8.66663L8.50005 12.3791Z" fill="#868C98"/></svg>';
        setCheckmarkIconSvg(checkmarkSvg);
      }

      // Иконка для пустых блоков (кружочек с числом 0)
      try {
        const emptyBlockIconSvgContent = '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><g filter="url(#filter0_d_4560_7557)"><path d="M2 21C2 9.95431 10.9543 1 22 1C33.0457 1 42 9.95431 42 21C42 32.0457 33.0457 41 22 41C10.9543 41 2 32.0457 2 21Z" fill="white"/><path d="M22 1.5C32.7696 1.5 41.5 10.2304 41.5 21C41.5 31.7696 32.7696 40.5 22 40.5C11.2304 40.5 2.5 31.7696 2.5 21C2.5 10.2304 11.2304 1.5 22 1.5Z" stroke="#E2E4E9"/><path d="M22.0032 27.24C21.2192 27.24 20.5259 27.0693 19.9232 26.728C19.3205 26.3813 18.8459 25.9067 18.4992 25.304C18.1579 24.7013 17.9872 24.008 17.9872 23.224V19.256C17.9872 18.472 18.1579 17.7787 18.4992 17.176C18.8459 16.5733 19.3205 16.1013 19.9232 15.76C20.5259 15.4133 21.2192 15.24 22.0032 15.24C22.7872 15.24 23.4805 15.4133 24.0832 15.76C24.6859 16.1013 25.1579 16.5733 25.4992 17.176C25.8459 17.7787 26.0192 18.472 26.0192 19.256V23.224C26.0192 24.008 25.8459 24.7013 25.4992 25.304C25.1579 25.9067 24.6859 26.3813 24.0832 26.728C23.4805 27.0693 22.7872 27.24 22.0032 27.24ZM22.0032 25.64C22.4299 25.64 22.8165 25.5387 23.1632 25.336C23.5152 25.128 23.7952 24.8507 24.0032 24.504C24.2112 24.152 24.3152 23.76 24.3152 23.328V19.136C24.3152 18.7093 24.2112 18.3227 24.0032 17.976C23.7952 17.624 23.5152 17.3467 23.1632 17.144C22.8165 16.936 22.4299 16.832 22.0032 16.832C21.5765 16.832 21.1872 16.936 20.8352 17.144C20.4885 17.3467 20.2112 17.624 20.0032 17.976C19.7952 18.3227 19.6912 18.7093 19.6912 19.136V23.328C19.6912 23.76 19.7952 24.152 20.0032 24.504C20.2112 24.8507 20.4885 25.128 20.8352 25.336C21.1872 25.5387 21.5765 25.64 22.0032 25.64Z" fill="#0A0D14"/></g><defs><filter id="filter0_d_4560_7557" x="0" y="0" width="44" height="44" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dy="1"/><feGaussianBlur stdDeviation="1"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0.894118 0 0 0 0 0.898039 0 0 0 0 0.905882 0 0 0 0.24 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_4560_7557"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_4560_7557" result="shape"/></filter></defs></svg>';
        setEmptyBlockIconSvg(emptyBlockIconSvgContent);
      } catch (error) {
        console.error('Ошибка загрузки empty-block-icon.svg:', error);
      }
    } catch (error) {
      console.error('Ошибка загрузки иконок:', error);
    }
  };

  const loadCompletedBlocks = async () => {
    try {
      const userId = await getCurrentUserId();
      let blocksSource: DiagnosisBlock[] = [];

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

      // Объединяем с DEFAULT_BLOCKS, чтобы получить все блоки
      const allBlocks = DEFAULT_BLOCKS.map(defaultBlock => {
        const foundBlock = blocksSource.find(b => b.id === defaultBlock.id);
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

      const completed = allBlocks.filter(b => b.completed && b.efficiency !== undefined);
      
      setCompletedBlocks(completed);
    } catch (error) {
      console.error('Ошибка загрузки блоков:', error);
      setCompletedBlocks([]);
      setUncompletedBlocks([]);
    }
  };

  const getShortBlockName = (fullName: string): string => {
    const mapping: Record<string, string> = {
      'Финансы и бухгалтерия': 'Финансы',
      'Концепция и позиционирование': 'Концепция',
      'Управление и организация': 'Управление',
      'Продуктовая стратегия': 'Продукты',
      'Маркетинг и продажи': 'Маркетинг',
      'Операционная деятельность': 'Операционка',
      'Клиентский опыт': 'Клиентский опыт',
      'Инфраструктура и оборудование': 'Инфраструктура',
      'Риски и нормы': 'Риски и нормы',
      'Стратегия развития': 'Развитие',
    };
    return mapping[fullName] || fullName;
  };

  const getStepsWord = (count: number): string => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    // Исключения для 11, 12, 13, 14
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'шагов';
    }
    
    // 1 шаг
    if (lastDigit === 1) {
      return 'шаг';
    }
    
    // 2, 3, 4 шага
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'шага';
    }
    
    // 5, 6, 7, 8, 9, 0 шагов
    return 'шагов';
  };

  const getBlockIconSvg = (blockId: string): string | null => {
    const iconMap: Record<string, string> = {
      'finance': coinsIconSvg,
      'concept': colorsIconSvg,
      'management': arrowRightIconSvg,
      'menu': fileIconSvg, // Продуктовая стратегия
      'product': fileIconSvg,
      'marketing': marketingIconSvg,
      'operations': computerSettingsIconSvg,
      'client_experience': userMultipleIconSvg,
      'infrastructure': dishWasherIconSvg,
      'risks': legalDocumentIconSvg,
      'strategy': chartIncreaseIconSvg,
    };
    return iconMap[blockId] || null;
  };

  const getDiagnosisBadgeColors = (value: number) => {
    if (value === 0 || value === undefined || value === null) {
      return { bg: '#F6F8FA', text: '#525866' };
    }
    if (value >= 78) return { bg: '#CBF5E5', text: '#176448' };
    if (value >= 60) return { bg: '#FFAD1F', text: '#0A0D14' };
    if (value >= 38) return { bg: '#FFDAC2', text: '#6E330C' };
    return { bg: '#F8C9D2', text: '#710E21' };
  };

  const getBlockTasksEfficiency = (block: DiagnosisBlock) => {
    const tasksForBlock = getBlockTasks(block.id);
    const completedGain = tasksForBlock.reduce((sum, task) => {
      const taskKey = getTaskKey(task);
      const stepsCount = task.steps.length;
      const completedSet = taskCompletedSteps[taskKey] || new Set<number>();
      const allCompleted = stepsCount > 0 && completedSet.size === stepsCount;
      return sum + (allCompleted ? task.efficiencyGain : 0);
    }, 0);
    const base = block.efficiency || 0;
    return Math.min(100, base + completedGain);
  };

  const loadTasksWithoutClearing = async () => {
    try {
      console.log('Загружаем задачи без очистки...');
      let tasksSource: Task[] = [];
      const userId = await getCurrentUserId();

      if (userId) {
        tasksSource = await loadUserTasks(userId);
      }

      if ((!userId || tasksSource.length === 0)) {
        const storedTasks = await AsyncStorage.getItem('actionPlanTasks');
        if (storedTasks) {
          tasksSource = JSON.parse(storedTasks);
        }
      }

      if (tasksSource.length > 0) {
        console.log('=== ЗАГРУЗКА ЗАДАЧ В ЭКШЕН ПЛАНЕ ===');
        console.log('Найдены задачи:', tasksSource.length);
        const tasksWithDefaults = tasksSource.map((task: any, index: number) => ({
          ...task,
          id: task.id || `task_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
          completed: task.completed || false,
        }));
        setTasks(tasksWithDefaults);
        console.log('Загружены задачи:', tasksWithDefaults.map((t: Task) => ({ id: t.id, title: t.title, blockId: t.blockId })));
        if (userId) {
          await saveUserTasks(userId, tasksWithDefaults);
        }
      } else {
        console.log('Задач в хранилище нет, показываем пустой список');
        setTasks([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
      setTasks([]);
    }
  };

  // Обрабатываем параметры навигации
  useEffect(() => {
    if (route?.params?.newTasks) {
      console.log('Получены новые задачи:', route.params.newTasks);
      // Перезагружаем задачи
      loadTasks();
    }
  }, [route?.params]);

  const loadTasks = async () => {
    try {
      console.log('Загружаем задачи из AsyncStorage...');
      
      let tasksSource: Task[] = [];
      const userId = await getCurrentUserId();

      if (userId) {
        tasksSource = await loadUserTasks(userId);
      }

      if ((!userId || tasksSource.length === 0)) {
        const storedTasks = await AsyncStorage.getItem('actionPlanTasks');
        if (storedTasks) {
          tasksSource = JSON.parse(storedTasks);
        }
      }

      if (tasksSource.length > 0) {
        console.log('Найдены задачи:', tasksSource.length);
        console.log('Сырые задачи:', tasksSource);
        const tasksWithDefaults = tasksSource.map((task: any, index: number) => ({
          ...task,
          id: task.id || `task_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
          completed: task.completed || false,
        }));
        setTasks(tasksWithDefaults);
        console.log('Загружены задачи:', tasksWithDefaults.map((t: Task) => ({ id: t.id, title: t.title, blockId: t.blockId })));
        if (userId) {
          await saveUserTasks(userId, tasksWithDefaults);
        }
      } else {
        console.log('Задач в хранилище нет, показываем пустой список');
        setTasks([]);
      }
      
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      setTasks(updatedTasks);

      await AsyncStorage.setItem('actionPlanTasks', JSON.stringify(updatedTasks));

      const userId = await getCurrentUserId();
      if (userId) {
        await saveUserTasks(userId, updatedTasks);
      }
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      await AsyncStorage.setItem('actionPlanTasks', JSON.stringify(updatedTasks));

      const userId = await getCurrentUserId();
      if (userId) {
        await saveUserTasks(userId, updatedTasks);
      }
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
    }
  };

  const clearAllTasks = async () => {
    try {
      console.log('Очищаем все задачи...');
      setTasks([]);
      await AsyncStorage.removeItem('actionPlanTasks');
      console.log('Все задачи очищены');

      const userId = await getCurrentUserId();
      if (userId) {
        await saveUserTasks(userId, []);
      }
    } catch (error) {
      console.error('Ошибка очистки задач:', error);
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

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return 'Не указан';
    }
  };

  const tasksByBlock = getTasksByBlock(tasks);

  // Хардкодные данные для 7 блоков из завершенных на экране диагностики
  const hardcodedCompletedBlocks: Array<{ id: string; title: string; efficiency: number }> = [
    { id: 'menu', title: 'Продуктовая стратегия', efficiency: 85 },
    { id: 'marketing', title: 'Маркетинг и продажи', efficiency: 72 },
    { id: 'operations', title: 'Операционная деятельность', efficiency: 45 },
    { id: 'client_experience', title: 'Клиентский опыт', efficiency: 92 },
    { id: 'infrastructure', title: 'Инфраструктура и оборудование', efficiency: 35 },
    { id: 'risks', title: 'Риски и нормы', efficiency: 65 },
    { id: 'strategy', title: 'Стратегия развития', efficiency: 78 },
  ];

  // Задачи с приростом эффективности для каждого блока
  const getBlockTasks = (blockId: string) => {
    // Хардкодные данные для 7 блоков из завершенных
    const blockTasksMap: Record<string, Array<{ title: string; steps: string[]; efficiencyGain: number }>> = {
      'menu': [ // Продуктовая стратегия - 85%, нужно +15%
        {
          title: 'Оптимизировать меню и ценообразование',
          steps: ['Проанализировать популярность блюд', 'Скорректировать цены', 'Обновить меню'],
          efficiencyGain: 8,
        },
        {
          title: 'Внедрить систему контроля качества блюд',
          steps: ['Разработать стандарты качества', 'Обучить персонал', 'Внедрить контроль'],
          efficiencyGain: 7,
        },
      ],
      'marketing': [ // Маркетинг и продажи - 72%, нужно +28%
        {
          title: 'Разработать стратегию продвижения в соцсетях',
          steps: ['Создать контент-план', 'Настроить таргетинг', 'Запустить рекламу', 'Мониторить результаты'],
          efficiencyGain: 12,
        },
        {
          title: 'Внедрить программу лояльности',
          steps: ['Разработать программу', 'Обучить персонал', 'Запустить программу', 'Проанализировать эффективность'],
          efficiencyGain: 10,
        },
        {
          title: 'Провести анализ конкурентов и улучшить позиционирование',
          steps: ['Изучить конкурентов', 'Определить УТП', 'Обновить маркетинговые материалы'],
          efficiencyGain: 6,
        },
      ],
      'operations': [ // Операционная деятельность - 45%, нужно +55%
        {
          title: 'Оптимизировать рабочие процессы',
          steps: ['Провести аудит процессов', 'Выявить узкие места', 'Разработать улучшения', 'Внедрить изменения', 'Обучить персонал'],
          efficiencyGain: 20,
        },
        {
          title: 'Внедрить систему учета и контроля',
          steps: ['Выбрать систему', 'Настроить систему', 'Обучить персонал', 'Запустить систему', 'Мониторить работу'],
          efficiencyGain: 18,
        },
        {
          title: 'Улучшить управление запасами',
          steps: ['Проанализировать текущие запасы', 'Оптимизировать закупки', 'Внедрить систему контроля', 'Обучить персонал'],
          efficiencyGain: 17,
        },
      ],
      'client_experience': [ // Клиентский опыт - 92%, нужно +8%
        {
          title: 'Провести опрос клиентов и внедрить улучшения',
          steps: ['Провести опрос', 'Проанализировать результаты', 'Внедрить улучшения'],
          efficiencyGain: 5,
        },
        {
          title: 'Улучшить сервис обслуживания',
          steps: ['Обучить персонал', 'Внедрить стандарты обслуживания'],
          efficiencyGain: 3,
        },
      ],
      'infrastructure': [ // Инфраструктура и оборудование - 35%, нужно +65%
        {
          title: 'Провести аудит оборудования и составить план обновления',
          steps: ['Оценить состояние оборудования', 'Составить план', 'Приоритизировать замену', 'Составить бюджет'],
          efficiencyGain: 25,
        },
        {
          title: 'Обновить критически важное оборудование',
          steps: ['Выбрать оборудование', 'Заказать оборудование', 'Установить оборудование', 'Обучить персонал', 'Протестировать'],
          efficiencyGain: 22,
        },
        {
          title: 'Оптимизировать использование пространства',
          steps: ['Проанализировать планировку', 'Разработать улучшения', 'Внедрить изменения'],
          efficiencyGain: 18,
        },
      ],
      'risks': [ // Риски и нормы - 65%, нужно +35%
        {
          title: 'Провести аудит соответствия нормам',
          steps: ['Проверить соответствие', 'Выявить нарушения', 'Составить план исправлений', 'Исправить нарушения'],
          efficiencyGain: 15,
        },
        {
          title: 'Внедрить систему управления рисками',
          steps: ['Разработать систему', 'Обучить персонал', 'Внедрить систему', 'Мониторить работу'],
          efficiencyGain: 12,
        },
        {
          title: 'Обновить документацию и процедуры',
          steps: ['Проверить документацию', 'Обновить процедуры', 'Обучить персонал'],
          efficiencyGain: 8,
        },
      ],
      'strategy': [ // Стратегия развития - 78%, нужно +22%
        {
          title: 'Разработать стратегию развития на год',
          steps: ['Провести анализ', 'Определить цели', 'Разработать план', 'Утвердить стратегию'],
          efficiencyGain: 10,
        },
        {
          title: 'Внедрить систему KPI и мониторинга',
          steps: ['Определить KPI', 'Настроить систему', 'Обучить персонал', 'Запустить мониторинг'],
          efficiencyGain: 7,
        },
        {
          title: 'Провести анализ рынка и конкурентов',
          steps: ['Изучить рынок', 'Проанализировать конкурентов', 'Определить возможности'],
          efficiencyGain: 5,
        },
      ],
    };

    return blockTasksMap[blockId] || [];
  };

  // Используем хардкодные блоки, если нет загруженных
  const completedBlocksToDisplay = completedBlocks.length > 0 
    ? completedBlocks 
    : hardcodedCompletedBlocks.map(b => ({ ...b, completed: true } as DiagnosisBlock));
  
  // Два блока из секции "К прохождению" с экрана диагностики
  const uncompletedBlocksToDisplay: DiagnosisBlock[] = [
    { 
      id: 'finance', 
      title: 'Финансы и бухгалтерия', 
      description: '', 
      completed: false, 
      efficiency: undefined 
    } as DiagnosisBlock,
    { 
      id: 'concept', 
      title: 'Концепция и позиционирование', 
      description: '', 
      completed: false, 
      efficiency: undefined 
    } as DiagnosisBlock,
  ];
  
  // Объединяем: сначала завершенные, затем два непройденных блока внизу
  const blocksToDisplay = [...completedBlocksToDisplay, ...uncompletedBlocksToDisplay];

  // Сортируем только завершенные блоки по эффективности (от меньшей к большей)
  // Непройденные блоки остаются в конце без сортировки
  const completedSorted = completedBlocksToDisplay.sort((a, b) => {
    const efficiencyA = a.efficiency || 0;
    const efficiencyB = b.efficiency || 0;
    return efficiencyA - efficiencyB; // От меньшей к большей
  });
  
  // Объединяем: завершенные (отсортированные) + непройденные (в конце)
  const sortedBlocksToDisplay = [...completedSorted, ...uncompletedBlocksToDisplay];

  // Формируем список блоков для отображения
  // Если выбран конкретный таб, соответствующий блок ставим первым, остальные в исходном порядке
  // Непройденные блоки всегда остаются внизу
  const displayedBlocks = (() => {
    if (selectedTab === 'all') {
      return sortedBlocksToDisplay;
    }
    
    // Разделяем на завершенные и непройденные
    const completedBlocksList = sortedBlocksToDisplay.filter(b => b.completed && b.efficiency !== undefined);
    const uncompletedBlocksList = sortedBlocksToDisplay.filter(b => !b.completed || b.efficiency === undefined);
    
    // Находим выбранный блок
    const selectedBlock = sortedBlocksToDisplay.find(b => b.id === selectedTab);
    if (!selectedBlock) {
      return sortedBlocksToDisplay;
    }
    
    // Если выбран завершенный блок
    if (selectedBlock.completed && selectedBlock.efficiency !== undefined) {
      const otherCompletedBlocks = completedBlocksList.filter(b => b.id !== selectedTab);
      // Возвращаем: выбранный блок первым, затем остальные завершенные, затем непройденные внизу
      return [selectedBlock, ...otherCompletedBlocks, ...uncompletedBlocksList];
    }
    
    // Если выбран непройденный блок, ставим его первым
    const otherUncompletedBlocks = uncompletedBlocksList.filter(b => b.id !== selectedTab);
    // Возвращаем: выбранный непройденный блок первым, затем завершенные, затем остальные непройденные внизу
    return [selectedBlock, ...completedBlocksList, ...otherUncompletedBlocks];
  })();

  // Мемоизируем JSX шапки для предотвращения ре-рендеров
  const headerJSX = useMemo(() => {
    return (
      <View style={[styles.section, styles.profileSection]}>
        <View style={styles.profileInfo}>
          {/* Аватар компании */}
          <View style={styles.avatarContainer}>
            {projectAvatarUri ? (
              <Image source={{ uri: projectAvatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="business" size={32} color={palette.gray400} />
              </View>
            )}
          </View>
          
          {/* Название и город */}
          <View style={styles.projectInfo}>
            <Text style={styles.projectName}>Проект</Text>
            <View style={styles.cityContainer}>
              <Text style={styles.cityText}>{city || 'город'}</Text>
              <View style={styles.cityIconContainer}>
                {cityIconSvg ? (
                  <SvgXml xml={cityIconSvg} width={16} height={16} />
                ) : (
                  <View style={{ width: 16, height: 16 }} />
                )}
              </View>
            </View>
          </View>
        </View>
        
        {/* Кнопка Помощь PELBY */}
        <AnimatedPressable 
          style={styles.helpButton}
          onPress={() => {
            if (navigation) {
              navigation.navigate('Help');
            }
          }}
        >
          <View style={styles.helpButtonIconContainer}>
            {helpButtonIconSvg ? (
              <SvgXml xml={helpButtonIconSvg} width={18} height={18} />
            ) : (
              <View style={{ width: 18, height: 18 }} />
            )}
          </View>
          <Text style={styles.helpButtonText}>Помощь PELBY</Text>
        </AnimatedPressable>
      </View>
    );
  }, [projectAvatarUri, city, cityIconSvg, helpButtonIconSvg, navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Загрузка задач...</Text>
      </View>
    );
  }

  const handleScroll = (event: any) => {
    // Обработка скролла
  };

  return (
    <View style={styles.container}>
    <ScrollView 
      ref={scrollViewRef} 
      style={styles.scrollView}
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {/* Секция профиля проекта - МЕМОИЗИРОВАНА для предотвращения ре-рендеров */}
      {headerJSX}

      {/* Секция с заголовком */}
      <View style={[styles.section, styles.efficiencySection]}>
        <View style={styles.efficiencyHeader}>
          <View style={styles.efficiencyTitleContainer}>
            <Text style={styles.efficiencyTitle}>Задачи</Text>
          </View>
        </View>
      </View>

      {/* Секции-табы */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          <TouchableOpacity 
            style={[
              styles.tabButton,
              selectedTab === 'all' && styles.tabButtonActive
            ]}
            onPress={() => setSelectedTab('all')}
          >
            <Text style={[
              styles.tabButtonText,
              selectedTab === 'all' && styles.tabButtonTextActive
            ]}>
              Все задачи
            </Text>
          </TouchableOpacity>
          {sortedBlocksToDisplay
            .filter(block => block.completed && block.efficiency !== undefined) // Завершенные блоки
            .map((block) => {
            const shortName = getShortBlockName(block.title);
            const dynamicEfficiency = getBlockTasksEfficiency(block);
            return (
              <TouchableOpacity 
                key={block.id}
                style={[
                  styles.tabButton,
                  selectedTab === block.id && styles.tabButtonActive
                ]}
                onPress={() => setSelectedTab(block.id)}
              >
                <Text style={[
                  styles.tabButtonText,
                  selectedTab === block.id && styles.tabButtonTextActive
                ]}>
                  {shortName} {dynamicEfficiency}%
                </Text>
              </TouchableOpacity>
            );
          })}
          {/* Два непройденных блока в табах справа с "0%" */}
          {uncompletedBlocksToDisplay.map((block) => {
            const shortName = getShortBlockName(block.title);
            return (
              <TouchableOpacity 
                key={block.id}
                style={[
                  styles.tabButton,
                  selectedTab === block.id && styles.tabButtonActive
                ]}
                onPress={() => setSelectedTab(block.id)}
              >
                <Text style={[
                  styles.tabButtonText,
                  selectedTab === block.id && styles.tabButtonTextActive
                ]}>
                  {shortName} 0%
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Блоки с задачами */}
      {displayedBlocks.map((block, blockIndex) => {
        const isUncompleted = !block.completed || block.efficiency === undefined;
        const blockTasks = getBlockTasks(block.id);
        const dynamicEfficiency = getBlockTasksEfficiency(block);
        // Сортируем задачи по efficiencyGain: от большего к меньшему
        const sortedBlockTasks = [...blockTasks].sort((a, b) => {
          return b.efficiencyGain - a.efficiencyGain; // От большего к меньшему
        });
        const blockIconSvg = getBlockIconSvg(block.id);
        const blockBadgeColors = getDiagnosisBadgeColors(dynamicEfficiency);
        const isLastBlock = blockIndex === displayedBlocks.length - 1;
        
        // Если блок непройденный, показываем специальный формат
        if (isUncompleted) {
          return (
            <React.Fragment key={block.id}>
              <View style={styles.blockContainer}>
                {/* Заголовок блока с иконкой и "-%" */}
                <View style={[styles.blockHeaderCard, styles.blockHeaderCardUncompleted]}>
                  <View style={styles.blockHeaderTopRow}>
                    {blockIconSvg && (
                      <View style={styles.blockHeaderIcon}>
                        <View style={styles.blockHeaderIconScaled}>
                          <SvgXml xml={blockIconSvg} width={38} height={38} />
                        </View>
                      </View>
                    )}
                    <View style={styles.blockHeaderTextContainer}>
                      <Text style={styles.blockHeaderTitle}>{block.title}</Text>
                    </View>
                    <Text style={styles.blockUncompletedPercent}>-%</Text>
                  </View>
                </View>

                {/* Контент для непройденного блока */}
                <View style={styles.uncompletedBlockContent}>
                  {/* Кружочек с числом 0 */}
                  <View style={styles.emptyBlockIconContainer}>
                    {emptyBlockIconSvg ? (
                      <SvgXml xml={emptyBlockIconSvg} width={46} height={46} />
                    ) : (
                      <View style={styles.emptyBlockIconPlaceholder}>
                        <Text style={styles.emptyBlockIconText}>0</Text>
                      </View>
                    )}
                  </View>

                  {/* Подпись "Тут пока нет задач по улучшению" */}
                  <Text style={styles.uncompletedBlockTitle}>
                    Тут пока нет задач по улучшению
                  </Text>

                  {/* Подпись "Вам необходимо пройти диагностику блока..." */}
                  <Text style={styles.uncompletedBlockDescription}>
                    Вам необходимо пройти диагностику блока,{'\n'}и мы сформируем список задач.
                  </Text>

                  {/* Кнопка "К диагностике" */}
                  <TouchableOpacity
                    style={styles.diagnosisButton}
                    activeOpacity={0.7}
                    onPress={() => {
                      navigation.navigate('BlockQuestions', { 
                        blockId: block.id, 
                        blockTitle: block.title 
                      });
                    }}
                  >
                    <Text style={styles.diagnosisButtonText}>К диагностике</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Серая линия между блоками (такая же, как между задачами и заголовками) */}
              <View style={styles.blocksDivider} />
            </React.Fragment>
          );
        }
        
        // Для завершенных блоков - обычный формат
        return (
          <React.Fragment key={block.id}>
            <View style={styles.blockContainer}>
              {/* Заголовок блока с иконкой и эффективностью */}
              <View style={styles.blockHeaderCard}>
                <View style={styles.blockHeaderTopRow}>
                  {blockIconSvg && (
                    <View style={styles.blockHeaderIcon}>
                      <View style={styles.blockHeaderIconScaled}>
                        <SvgXml xml={blockIconSvg} width={38} height={38} />
                      </View>
                    </View>
                  )}
                  <View style={styles.blockHeaderTextContainer}>
                    <Text style={styles.blockHeaderTitle}>{block.title}</Text>
                  </View>
                  <View
                    style={[
                      styles.blockEfficiencyBadge,
                      { backgroundColor: blockBadgeColors.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.blockEfficiencyPercent,
                        { color: blockBadgeColors.text },
                      ]}
                    >
                      {dynamicEfficiency}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Задачи */}
              <View style={styles.tasksContainer}>
                {sortedBlockTasks.map((task, taskIndex) => {
                  const stepsCount = task.steps.length;
                  const efficiencyGain = task.efficiencyGain;
                  const changeColor = efficiencyGain > 0 ? '#176448' : efficiencyGain < 0 ? '#DF1C41' : '#525866';
                  const changeArrow = efficiencyGain > 0 ? 'arrow-up' : efficiencyGain < 0 ? 'arrow-down' : null;
                  
                  // Проверяем, все ли шаги выполнены для этой задачи (по уникальному ключу)
                  const taskKey = getTaskKey(task);
                  const taskCompletedStepsSet = taskCompletedSteps[taskKey] || new Set<number>();
                  const allStepsCompleted = stepsCount > 0 && taskCompletedStepsSet.size === stepsCount;
                  
                  return (
                    <TouchableOpacity 
                      key={taskIndex} 
                      style={styles.taskCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedTask(task);
                        // Всегда сбрасываем completedStepIds при открытии новой задачи
                        // Загружаем сохраненные выполненные шаги для этой задачи только если они есть
                        const taskKey = getTaskKey(task);
                        const savedSteps = taskCompletedSteps[taskKey];
                        // Убеждаемся, что savedSteps - это действительно Set с элементами
                        if (savedSteps && savedSteps instanceof Set && savedSteps.size > 0 && Array.from(savedSteps).length > 0) {
                          setCompletedStepIds(new Set(savedSteps));
                        } else {
                          // Все шаги невыполнены по умолчанию - всегда используем пустой Set
                          setCompletedStepIds(new Set<number>());
                        }
                        setShowTaskModal(true);
                      }}
                    >
                      <View style={styles.taskCardTopRow}>
                        <View style={styles.taskCardTextContainer}>
                          <Text style={[styles.taskTitle, allStepsCompleted && styles.taskTitleCompleted]}>
                            {task.title}
                          </Text>
                          <View style={styles.taskStepsRow}>
                            <Text style={[styles.taskStepsCount, allStepsCompleted && styles.taskStepsCountCompleted]}>
                              {stepsCount} {getStepsWord(stepsCount)}
                            </Text>
                            {!allStepsCompleted && (
                              <Text style={styles.taskEfficiencyValue}>
                                {efficiencyGain > 0 ? '+' : ''}{efficiencyGain}%
                              </Text>
                            )}
                          </View>
                        </View>
                        {allStepsCompleted ? (
                          checkmarkIconSvg ? (
                            <View style={styles.taskArrow}>
                              <SvgXml xml={checkmarkIconSvg} width={20} height={20} />
                            </View>
                          ) : (
                            <View style={styles.taskArrow}>
                              <Text style={{ fontSize: 20, color: '#868C98' }}>✓</Text>
                            </View>
                          )
                        ) : arrowRightIconSvg ? (
                          <View style={styles.taskArrow}>
                            <SvgXml xml={arrowRightIconSvg} width={24} height={24} />
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            {/* Серая линия между блоками */}
            {!isLastBlock && <View style={styles.blocksDivider} />}
          </React.Fragment>
        );
      })}

    </ScrollView>

      {/* Модальное окно с шагами задачи */}
      <Modal
        visible={showTaskModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          // Сохраняем выполненные шаги перед закрытием
          if (selectedTask && completedStepIds.size > 0) {
            const taskKey = getTaskKey(selectedTask);
            setTaskCompletedSteps(prev => ({
              ...prev,
              [taskKey]: new Set(completedStepIds),
            }));
          }
          setShowTaskModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedTask?.title || 'Задача'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  // Сохраняем выполненные шаги перед закрытием только если есть выполненные
                  if (selectedTask && completedStepIds.size > 0) {
                    const taskKey = getTaskKey(selectedTask);
                    setTaskCompletedSteps(prev => ({
                      ...prev,
                      [taskKey]: new Set(completedStepIds),
                    }));
                  } else if (selectedTask) {
                    // Если все шаги невыполнены, удаляем запись из taskCompletedSteps
                    const taskKey = getTaskKey(selectedTask);
                    setTaskCompletedSteps(prev => {
                      const updated = { ...prev };
                      delete updated[taskKey];
                      return updated;
                    });
                  }
                  setShowTaskModal(false);
                }}
                style={styles.modalCloseButton}
              >
                {closeIconSvg ? (
                  <SvgXml xml={closeIconSvg} width={10} height={10} />
                ) : (
                  <Text style={{ fontSize: 18, color: '#525866' }}>×</Text>
                )}
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Список шагов */}
              {selectedTask && (() => {
                // Генерируем шаги для задачи
                const totalSteps = selectedTask.steps.length || 8;
                const steps = [];
                
                // Если у задачи есть шаги, используем их, иначе создаем примерные
                if (selectedTask.steps && selectedTask.steps.length > 0) {
                  selectedTask.steps.forEach((step, index) => {
                    steps.push({
                      id: index,
                      title: step,
                    });
                  });
                } else {
                  // Примерные шаги для задачи
                  const exampleSteps = [
                    'Определить текущие категории расходов и доходов',
                    'Выбрать систему учета (Excel, 1С, специализированное ПО)',
                    'Настроить структуру категорий в выбранной системе',
                    'Обучить персонал работе с системой учета',
                    'Внедрить ежедневный ввод данных',
                    'Настроить автоматические отчеты',
                    'Провести анализ первых результатов',
                    'Оптимизировать процесс на основе полученных данных',
                  ];
                  
                  exampleSteps.slice(0, totalSteps).forEach((stepTitle, index) => {
                    steps.push({
                      id: index,
                      title: stepTitle,
                    });
                  });
                }

                // Определяем, какие шаги выполнены (используем состояние completedStepIds)
                const stepsWithStatus = steps.map(step => ({
                  ...step,
                  completed: completedStepIds.has(step.id),
                }));

                // Бар загрузки: рассчитываем прогресс после вычисления stepsWithStatus
                const completedCount = stepsWithStatus.filter(step => step.completed).length;
                const progress =
                  totalSteps > 0 ? Math.min(1, Math.max(0, completedCount / totalSteps)) : 0;
                const barWidth = screenWidth - spacing.lg * 2;

                // Сортируем шаги: сначала невыполненные, потом выполненные
                const sortedSteps = [...stepsWithStatus].sort((a, b) => {
                  if (a.completed === b.completed) return 0;
                  return a.completed ? 1 : -1; // Невыполненные первыми
                });

                const toggleStep = (stepId: number) => {
                  setCompletedStepIds(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(stepId)) {
                      newSet.delete(stepId);
                    } else {
                      newSet.add(stepId);
                    }
                    // Сохраняем выполненные шаги для текущей задачи (только если есть выполненные)
                    if (selectedTask) {
                      const taskKey = getTaskKey(selectedTask);
                      if (newSet.size > 0) {
                        setTaskCompletedSteps(prev => ({
                          ...prev,
                          [taskKey]: new Set(newSet),
                        }));
                      } else {
                        // Если все шаги невыполнены, удаляем запись из taskCompletedSteps
                        setTaskCompletedSteps(prev => {
                          const updated = { ...prev };
                          delete updated[taskKey];
                          return updated;
                        });
                      }
                    }
                    return newSet;
                  });
                };

                return (
                  <View style={styles.stepsContainer}>
                    {/* Бар загрузки */}
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBarBackground, { width: barWidth }]}>
                        <View style={[styles.progressBarFill, { width: barWidth * progress }]} />
                      </View>
                    </View>

                    {sortedSteps.map((step, index) => (
                      <React.Fragment key={step.id}>
                        <TouchableOpacity 
                          style={styles.stepItem}
                          activeOpacity={0.7}
                          onPress={() => toggleStep(step.id)}
                        >
                          <Text style={[styles.stepText, step.completed ? styles.stepTextCompleted : styles.stepTextIncomplete]}>
                            {step.title}
                          </Text>
                          <View style={styles.stepIconContainer}>
                            {step.completed ? (
                              stepCheckedSvg ? (
                                <SvgXml xml={stepCheckedSvg} width={20} height={20} />
                              ) : (
                                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#38C793', justifyContent: 'center', alignItems: 'center' }}>
                                  <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>
                                </View>
                              )
                            ) : (
                              stepUncheckedSvg ? (
                                <SvgXml xml={stepUncheckedSvg} width={20} height={20} />
                              ) : (
                                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#868C98' }} />
                              )
                            )}
                          </View>
                        </TouchableOpacity>
                        {index < sortedSteps.length - 1 && <View style={styles.stepDivider} />}
                      </React.Fragment>
                    ))}
                  </View>
                );
              })()}
            </ScrollView>
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
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
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
    minHeight: 16, // Фиксируем высоту, чтобы не прыгало
    minWidth: 40, // Фиксируем ширину, чтобы не прыгало
  },
  cityIconContainer: {
    marginLeft: 2,
    transform: [{ translateY: 1 }],
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
  },
  efficiencySection: {
    marginLeft: spacing.sm,
    marginRight: spacing.md,
    marginBottom: 0, // Убираем отступ снизу, чтобы контролировать расстояние до табов
  },
  efficiencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md - 46, // Опущено на 1 пиксель вниз (было -47, стало -46)
    marginBottom: spacing.sm,
  },
  efficiencyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  efficiencyTitle: {
    fontSize: 28,
    fontWeight: '400',
    color: '#0A0D14',
    marginLeft: 5,
  },
  tabsContainer: {
    marginTop: spacing.lg - spacing.sm + 1, // Поднято на 1 пиксель вверх (было +2, стало +1)
    marginBottom: spacing.md,
  },
  tabsScrollContent: {
    paddingLeft: spacing.sm + 5, // Выравнивание по левому краю заголовка "Задачи"
    paddingRight: spacing.sm,
    gap: spacing.xxs,
  },
  tabButton: {
    paddingHorizontal: spacing.md - 4,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    marginRight: spacing.xxs,
  },
  tabButtonActive: {
    backgroundColor: '#191BDF',
    borderColor: '#191BDF',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#525866',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  blockContainer: {
    marginLeft: spacing.md, // Возвращаем marginLeft для блоков задач
    marginRight: spacing.md,
    marginTop: 10,
    marginBottom: 0, // Убираем marginBottom, чтобы отступ до серой линии был таким же, как у кнопки
  },
  blocksDivider: {
    height: 1,
    backgroundColor: '#E2E4E9',
    marginLeft: spacing.md, // Такие же отступы как у блоков (эталон)
    marginRight: spacing.md, // Такие же отступы как у блоков (эталон)
    marginTop: spacing.md + 10, // Отступ сверху увеличен на 10px (было +5, теперь +10)
    marginBottom: spacing.md, // Отступ снизу такой же, как paddingVertical в stepItem
    zIndex: 1,
    position: 'relative',
  },
  // Стили для модального окна задачи
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
    fontSize: 22,
    fontWeight: '600',
    color: '#0A0D14',
    fontFamily: 'Manrope-SemiBold',
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
  progressBarContainer: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  stepsContainer: {
    marginTop: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  stepIconContainer: {
    marginLeft: spacing.md,
    flexShrink: 0,
  },
  stepText: {
    fontSize: 17,
    fontWeight: '500',
    fontFamily: 'Manrope-Medium',
    lineHeight: 24,
    flex: 1,
  },
  stepTextIncomplete: {
    color: '#0A0D14',
  },
  stepTextCompleted: {
    color: '#868C98',
  },
  stepDivider: {
    height: 1,
    backgroundColor: '#E2E4E9',
    marginLeft: 0,
    marginRight: 0,
    marginTop: 5,
    marginBottom: 5,
  },
  blockHeaderCard: {
    marginBottom: 10, // Уменьшено на 5px (было 15, стало 10)
  },
  blockHeaderCardUncompleted: {
    marginTop: 0, // Выровнено с завершенными блоками
  },
  blockHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockHeaderIcon: {
    marginRight: spacing.sm - 5, // Уменьшено на 5 пикселей, чтобы заголовок был ближе к иконке
    marginLeft: 5 - spacing.md + 3, // Сдвигаем иконку вправо на 3 пикселя (было 5 - spacing.md, стало +3)
  },
  blockHeaderIconScaled: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 0.65 }],
  },
  blockHeaderTextContainer: {
    flex: 1,
  },
  blockHeaderTitle: {
    fontSize: 17,
    fontWeight: '500',
    fontFamily: 'Manrope-Medium',
    color: '#0A0D14',
    marginBottom: spacing.xxs,
  },
  blockEfficiencyBadge: {
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 6,
    minWidth: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  blockEfficiencyPercent: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    includeFontPadding: false,
  },
  blockUncompletedPercent: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 16,
    includeFontPadding: false,
    color: '#868C98', // Цвет как у стрелочки
  },
  uncompletedBlockContent: {
    alignItems: 'center',
    paddingTop: spacing.lg - 25, // Поднято вверх на 10px (было -15, стало -25)
    paddingBottom: 0, // Убираем padding снизу, так как серая линия будет снаружи
  },
  emptyBlockIconContainer: {
    marginBottom: spacing.md,
  },
  emptyBlockIconPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E4E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.24,
    shadowRadius: 1,
    elevation: 1,
  },
  emptyBlockIconText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0D14',
  },
  uncompletedBlockTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Manrope-SemiBold',
    color: '#0A0D14',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 20,
  },
  uncompletedBlockDescription: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Manrope-Medium',
    color: palette.gray600,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  diagnosisButton: {
    backgroundColor: '#FD680A',
    borderRadius: 99,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagnosisButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Manrope-SemiBold',
    color: '#FEF3EB',
  },
  tasksContainer: {
    gap: 15,
    marginBottom: 0, // Отступ снизу убираем, так как серая линия будет снаружи с marginTop
  },
  taskCard: {
    width: cardWidth,
    height: 100,
    backgroundColor: palette.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  taskCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  taskCardTextContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0A0D14',
    fontFamily: 'Manrope-Medium',
    marginBottom: spacing.xxs,
  },
  taskTitleCompleted: {
    color: '#868C98',
  },
  taskStepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskStepsCount: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.gray600,
    fontFamily: 'Manrope-Medium',
  },
  taskStepsCountCompleted: {
    color: '#868C98',
  },
  taskStepsDot: {
    fontSize: 14,
    fontWeight: '400',
    color: palette.gray600,
    fontFamily: 'Manrope-Regular',
    marginHorizontal: 2,
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: '#E2E4E9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#38C793',
    borderRadius: 2,
  },
  taskEfficiencyValue: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 16,
    includeFontPadding: false,
    color: '#38C793',
    marginLeft: 20,
  },
  taskArrow: {
    marginLeft: spacing.sm,
    alignSelf: 'center',
  },
  taskCardCompleted: {
    backgroundColor: '#F0FAF5',
    borderLeftColor: palette.success,
    opacity: 0.95,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: spacing.sm,
    marginTop: spacing.xs,
  },
  taskInfo: {
    flex: 1,
  },
  taskDescription: {
    fontSize: 13,
    color: palette.gray600,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: palette.background,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.primaryBlue,
  },
  dueDate: {
    fontSize: 12,
    color: palette.gray600,
  },
  deleteButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    color: palette.gray600,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: palette.gray500,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
  blocksContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: palette.white,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.gray200,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  blocksTitle: {
    ...typography.heading3,
    color: palette.primaryBlue,
    marginBottom: spacing.md,
  },
  blockProgress: {
    marginBottom: spacing.md,
    backgroundColor: palette.white,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.gray200,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primaryBlue,
    flex: 1,
  },
  blockProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.primaryOrange,
  },
  progressBar: {
    height: 8,
    backgroundColor: palette.gray200,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.primaryOrange,
    borderRadius: radii.sm,
  },
  recommendationsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  recommendationsTitle: {
    ...typography.heading3,
    color: palette.primaryBlue,
    marginBottom: spacing.xs,
  },
  recommendationsSubtitle: {
    fontSize: 14,
    color: palette.gray600,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: palette.white,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.gray200,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  recommendationNumber: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: palette.primaryOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  recommendationNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.white,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationBlockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primaryBlue,
    marginBottom: spacing.xs,
  },
  recommendationStats: {
    gap: spacing.xs,
  },
  recommendationStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  recommendationStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.gray600,
  },
  recommendationTotalTasks: {
    fontSize: 12,
    color: palette.gray500,
    marginTop: spacing.xs,
  },
  emptyRecommendations: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyRecommendationsText: {
    fontSize: 14,
    color: palette.gray600,
    textAlign: 'center',
  },
});
