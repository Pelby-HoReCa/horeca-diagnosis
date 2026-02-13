import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import AnimatedPressable from '../components/AnimatedPressable';
import DashboardHeader from '../components/DashboardHeader';
import { DEFAULT_BLOCKS, DiagnosisBlock } from '../data/diagnosisBlocks';
import questionsData from '../data/questions.json';
import { palette, radii, spacing, typography } from '../styles/theme';
import { getCurrentUserId, getSelectedVenueId, getVenueScopedKey, loadUserQuestionnaire, saveUserBlocks } from '../utils/userDataStorage';

const logo = require('../../assets/images/logo-pelby.png');
const { width: screenWidth, height: SCREEN_HEIGHT } = Dimensions.get('window');
const cardWidth = screenWidth - spacing.md * 2;

export default function SelfDiagnosisBlocksScreen({ navigation }: any) {
  const [restaurantName, setRestaurantName] = useState('Проект');
  const [city, setCity] = useState<string>('');
  const [projectAvatarUri, setProjectAvatarUri] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [venues, setVenues] = useState<Array<{ id: string; name: string; city: string; logoUri?: string | null }>>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [cityIconSvg, setCityIconSvg] = useState<string>('');
  const [helpButtonIconSvg, setHelpButtonIconSvg] = useState<string>('');
  const [headerReady] = useState(true);
  const [blocks, setBlocks] = useState<DiagnosisBlock[]>([]);
  const [blockProgress, setBlockProgress] = useState<Record<string, { answered: number; total: number; efficiency?: number }>>({});
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [refreshIconSvg, setRefreshIconSvg] = useState<string>('');
  const [addIconSvg, setAddIconSvg] = useState<string>('');
  const [modalCloseIconSvg, setModalCloseIconSvg] = useState<string>('');
  const [radioActiveSvg, setRadioActiveSvg] = useState<string>('');
  const [radioInactiveSvg, setRadioInactiveSvg] = useState<string>('');
  const [logoPlaceholderSvg, setLogoPlaceholderSvg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('Все');
  // Иконки для блоков
  const [coinsIconSvg, setCoinsIconSvg] = useState<string>('');
  const [colorsIconSvg, setColorsIconSvg] = useState<string>('');
  const [chartBarLineIconSvg, setChartBarLineIconSvg] = useState<string>('');
  const [arrowRightIconSvg, setArrowRightIconSvg] = useState<string>('');
  const [fileIconSvg, setFileIconSvg] = useState<string>('');
  const [marketingIconSvg, setMarketingIconSvg] = useState<string>('');
  const [computerSettingsIconSvg, setComputerSettingsIconSvg] = useState<string>('');
  const [userMultipleIconSvg, setUserMultipleIconSvg] = useState<string>('');
  const [dishWasherIconSvg, setDishWasherIconSvg] = useState<string>('');
  const [legalDocumentIconSvg, setLegalDocumentIconSvg] = useState<string>('');
  const [chartIncreaseIconSvg, setChartIncreaseIconSvg] = useState<string>('');
  const [showAllCompletedModal, setShowAllCompletedModal] = useState(false);
  const [showAddWarningModal, setShowAddWarningModal] = useState(false);
  const [incompleteTasksCount, setIncompleteTasksCount] = useState(0);

  const questionsByBlock: Record<string, any[]> = useMemo(() => {
    const map: Record<string, any[]> = {};
    (questionsData as any[]).forEach((block: any) => {
      map[block.id] = block.questions;
    });
    return map;
  }, []);

  useEffect(() => {
    console.log('Компонент загружен, инициализируем...');
    loadIcons();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const syncSelectedVenue = async () => {
        const userId = await getCurrentUserId();
        const storedVenueId = await getSelectedVenueId(userId);
        if (storedVenueId && storedVenueId !== selectedVenueId) {
          setSelectedVenueId(storedVenueId);
          return;
        }
        loadProfileData();
        loadBlocksWithoutClearing();
      };
      syncSelectedVenue();
    }, [selectedVenueId])
  );

  const loadProfileData = async () => {
    try {
      const userId = await getCurrentUserId();

      let nextProjectName = 'Проект';
      let nextCity = 'город';
      let nextAvatar: string | null = null;

      if (userId) {
        const questionnaireData = await loadUserQuestionnaire(userId);
        const restaurants = Array.isArray(questionnaireData?.restaurants)
          ? questionnaireData.restaurants
          : [];
        const selectedVenueId =
          (await AsyncStorage.getItem(`user_${userId}_diagnosis_selected_venue_id`)) ||
          (await AsyncStorage.getItem('diagnosis_selected_venue_id'));
        const selectedVenue =
          restaurants.find((venue: any) => venue.id === selectedVenueId) ||
          restaurants[0];

        if (selectedVenue?.name) {
          nextProjectName = selectedVenue.name;
        } else if (questionnaireData?.restaurantName?.trim()) {
          nextProjectName = questionnaireData.restaurantName;
        }

        if (selectedVenue?.address) {
          const cityPart = selectedVenue.address.split(',')[0]?.trim();
          if (cityPart) {
            nextCity = cityPart;
          }
        } else if (questionnaireData?.city) {
          nextCity = questionnaireData.city;
        }

        if (selectedVenue?.logoUri) {
          nextAvatar = selectedVenue.logoUri;
        }
      }

      if (!nextAvatar) {
        const savedSelectedLogo =
          (userId && (await AsyncStorage.getItem(`user_${userId}_diagnosis_selected_venue_logo_uri`))) ||
          (await AsyncStorage.getItem('diagnosis_selected_venue_logo_uri')) ||
          (await AsyncStorage.getItem('projectAvatar'));
        if (savedSelectedLogo) {
          nextAvatar = savedSelectedLogo;
        }
      }

      setRestaurantName(nextProjectName);
      setCity(nextCity);
      setProjectAvatarUri(nextAvatar);
    } catch (error) {
      console.error('Ошибка загрузки данных профиля:', error);
    }
  };

  const parseCityFromAddress = (address?: string) => {
    if (!address) return 'город';
    const firstPart = address.split(',')[0]?.trim();
    return firstPart || 'город';
  };

  useEffect(() => {
    const loadVenues = async () => {
      try {
        const userId = await getCurrentUserId();
        let restaurants: any[] = [];
        let fallbackName = 'Проект';
        let fallbackAddress = '';
        let fallbackLogo: string | null = null;

        const saved = await AsyncStorage.getItem('registrationStep2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.restaurantName) {
            fallbackName = parsed.restaurantName;
          }
          if (parsed?.address) {
            fallbackAddress = parsed.address;
          }
          fallbackLogo = parsed?.logoUri || parsed?.projectLogoUri || null;
          restaurants = Array.isArray(parsed.restaurants) ? parsed.restaurants : [];
        }

        if (restaurants.length === 0 && userId) {
          const questionnaire = await loadUserQuestionnaire(userId);
          if (questionnaire) {
            if (questionnaire?.restaurantName) {
              fallbackName = questionnaire.restaurantName;
            }
            if (questionnaire?.address) {
              fallbackAddress = questionnaire.address;
            }
            fallbackLogo = questionnaire?.projectLogoUri || questionnaire?.logoUri || fallbackLogo || null;
            restaurants = Array.isArray(questionnaire.restaurants) ? questionnaire.restaurants : [];
          }
        }

        if (restaurants.length === 0 && (fallbackName || fallbackAddress || fallbackLogo)) {
          restaurants = [
            {
              id: 'venue_0',
              name: fallbackName,
              address: fallbackAddress,
              logoUri: fallbackLogo,
            },
          ];
        }

        const mapped = restaurants.map((restaurant: any, index: number) => ({
          id: restaurant?.id || `venue_${index}`,
          name: restaurant?.name || fallbackName || 'Проект',
          city: parseCityFromAddress(restaurant?.address || fallbackAddress || ''),
          logoUri:
            restaurant?.logoUri ||
            restaurant?.projectLogoUri ||
            restaurant?.logo ||
            fallbackLogo ||
            null,
        }));
        if (mapped.length > 0) {
          setVenues(mapped);
          const savedVenueId = await getSelectedVenueId(userId);
          const exists = savedVenueId && mapped.some((venue) => venue.id === savedVenueId);
          setSelectedVenueId(exists ? savedVenueId : mapped[0].id);
        }
      } catch (error) {
        console.error('Ошибка загрузки заведений (диагностика):', error);
      }
    };
    loadVenues();
  }, []);

  useEffect(() => {
    if (!selectedVenueId) return;
    setBlocks([]);
    loadProfileData();
    loadBlocksWithoutClearing();
  }, [selectedVenueId]);

  const toggleVenue = (venueId: string) => {
    setSelectedVenueId(venueId);
    const venue = venues.find((item) => item.id === venueId);
    if (venue) {
      setRestaurantName(venue.name);
      setProjectAvatarUri(venue.logoUri || null);
      setCity(venue.city);
    }
    (async () => {
      try {
        const userId = await getCurrentUserId();
        await AsyncStorage.setItem('diagnosis_selected_venue_id', venueId);
        if (userId) {
          await AsyncStorage.setItem(`user_${userId}_diagnosis_selected_venue_id`, venueId);
        }
      } catch (error) {
        console.error('Ошибка сохранения выбранного проекта (диагностика):', error);
      }
    })();
    loadProfileData();
    loadBlocksWithoutClearing();
  };

  const loadIcons = async () => {
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
    
    // Загружаем SVG иконки для секции "Общая эффективность"
    const loadEfficiencyIcons = async () => {
      try {
        // Иконка обновления (часов)
        const refreshAsset = Asset.fromModule(require('../../assets/images/refresh-icon.svg'));
        await refreshAsset.downloadAsync();
        if (refreshAsset.localUri) {
          const response = await fetch(refreshAsset.localUri);
          const fileContent = await response.text();
          setRefreshIconSvg(fileContent);
        }
        
        // Иконка добавления (плюсик)
        const addAsset = Asset.fromModule(require('../../assets/images/add-icon.svg'));
        await addAsset.downloadAsync();
        if (addAsset.localUri) {
          const response = await fetch(addAsset.localUri);
          const fileContent = await response.text();
          setAddIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконок эффективности:', error);
      }
    };

    const loadModalIcons = async () => {
      try {
        const closeAsset = Asset.fromModule(require('../../assets/images/compact-button-icon.svg'));
        await closeAsset.downloadAsync();
        if (closeAsset.localUri) {
          const response = await fetch(closeAsset.localUri);
          setModalCloseIconSvg(await response.text());
        }
      } catch (error) {
        console.error('Ошибка загрузки modal-close-icon.svg:', error);
      }

      try {
        const radioActiveAsset = Asset.fromModule(require('../../assets/images/radio-active-icon.svg'));
        await radioActiveAsset.downloadAsync();
        if (radioActiveAsset.localUri) {
          const response = await fetch(radioActiveAsset.localUri);
          setRadioActiveSvg(await response.text());
        }
        const radioInactiveAsset = Asset.fromModule(require('../../assets/images/radio-inactive-icon.svg'));
        await radioInactiveAsset.downloadAsync();
        if (radioInactiveAsset.localUri) {
          const response = await fetch(radioInactiveAsset.localUri);
          setRadioInactiveSvg(await response.text());
        }
      } catch (error) {
        console.error('Ошибка загрузки радио-иконок:', error);
      }

      try {
        const logoAsset = Asset.fromModule(require('../../assets/images/restaurant-avatar-placeholder.svg'));
        await logoAsset.downloadAsync();
        if (logoAsset.localUri) {
          const response = await fetch(logoAsset.localUri);
          setLogoPlaceholderSvg(await response.text());
        }
      } catch (error) {
        console.error('Ошибка загрузки placeholder_logo_rest.svg:', error);
      }
    };
    
    // Загружаем иконки блоков
    const loadBlockIcons = async () => {
      try {
        // Иконка финансов
        const coinsAsset = Asset.fromModule(require('../../assets/images/coins-icon.svg'));
        await coinsAsset.downloadAsync();
        if (coinsAsset.localUri) {
          const response = await fetch(coinsAsset.localUri);
          const fileContent = await response.text();
          setCoinsIconSvg(fileContent);
        }
        
        // Иконка концепции
        const colorsAsset = Asset.fromModule(require('../../assets/images/colors-icon.svg'));
        await colorsAsset.downloadAsync();
        if (colorsAsset.localUri) {
          const response = await fetch(colorsAsset.localUri);
          const fileContent = await response.text();
          setColorsIconSvg(fileContent);
        }
        
        // Иконка управления
        const chartBarLineAsset = Asset.fromModule(require('../../assets/images/chart-bar-line-icon.svg'));
        await chartBarLineAsset.downloadAsync();
        if (chartBarLineAsset.localUri) {
          const response = await fetch(chartBarLineAsset.localUri);
          const fileContent = await response.text();
          setChartBarLineIconSvg(fileContent);
        }
        
        // Иконка стрелочки
        const arrowAsset = Asset.fromModule(require('../../assets/images/arrow-right-s-line.svg'));
        await arrowAsset.downloadAsync();
        if (arrowAsset.localUri) {
          const response = await fetch(arrowAsset.localUri);
          const fileContent = await response.text();
          setArrowRightIconSvg(fileContent);
        }
        
        // Иконка меню (file)
        const fileAsset = Asset.fromModule(require('../../assets/images/file-icon.svg'));
        await fileAsset.downloadAsync();
        if (fileAsset.localUri) {
          const response = await fetch(fileAsset.localUri);
          const fileContent = await response.text();
          setFileIconSvg(fileContent);
        }
        
        // Иконка маркетинга
        const marketingAsset = Asset.fromModule(require('../../assets/images/marketing-icon.svg'));
        await marketingAsset.downloadAsync();
        if (marketingAsset.localUri) {
          const response = await fetch(marketingAsset.localUri);
          const fileContent = await response.text();
          setMarketingIconSvg(fileContent);
        }
        
        // Иконка операций (computer-settings)
        const computerSettingsAsset = Asset.fromModule(require('../../assets/images/computer-settings-icon.svg'));
        await computerSettingsAsset.downloadAsync();
        if (computerSettingsAsset.localUri) {
          const response = await fetch(computerSettingsAsset.localUri);
          const fileContent = await response.text();
          setComputerSettingsIconSvg(fileContent);
        }
        
        // Иконка клиентского опыта (user-multiple)
        const userMultipleAsset = Asset.fromModule(require('../../assets/images/user-multiple-icon.svg'));
        await userMultipleAsset.downloadAsync();
        if (userMultipleAsset.localUri) {
          const response = await fetch(userMultipleAsset.localUri);
          const fileContent = await response.text();
          setUserMultipleIconSvg(fileContent);
        }
        
        // Иконка инфраструктуры (dish-washer)
        const dishWasherAsset = Asset.fromModule(require('../../assets/images/dish-washer-icon.svg'));
        await dishWasherAsset.downloadAsync();
        if (dishWasherAsset.localUri) {
          const response = await fetch(dishWasherAsset.localUri);
          const fileContent = await response.text();
          setDishWasherIconSvg(fileContent);
        }
        
        // Иконка рисков (legal-document)
        const legalDocumentAsset = Asset.fromModule(require('../../assets/images/legal-document-icon.svg'));
        await legalDocumentAsset.downloadAsync();
        if (legalDocumentAsset.localUri) {
          const response = await fetch(legalDocumentAsset.localUri);
          const fileContent = await response.text();
          setLegalDocumentIconSvg(fileContent);
        }
        
        // Иконка стратегии (chart-increase)
        const chartIncreaseAsset = Asset.fromModule(require('../../assets/images/chart-increase-icon.svg'));
        await chartIncreaseAsset.downloadAsync();
        if (chartIncreaseAsset.localUri) {
          const response = await fetch(chartIncreaseAsset.localUri);
          const fileContent = await response.text();
          setChartIncreaseIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконок блоков:', error);
      }
    };
    
    loadModalIcons();
    loadEfficiencyIcons();
    loadBlockIcons();
  };

  // Обновляем блоки при возврате на экран (БЕЗ очистки данных)
  useFocusEffect(
    useCallback(() => {
      console.log('Экран блоков получил фокус, обновляем блоки...');
      loadBlocksWithoutClearing();
      const loadIncompleteTasks = async () => {
        try {
          const userId = await getCurrentUserId();
          const venueId = selectedVenueId || (await getSelectedVenueId(userId));
          if (!venueId) {
            setIncompleteTasksCount(0);
            return;
          }
          const tasksKey = getVenueScopedKey('actionPlanTasks', userId, venueId);
          const storedTasks = await AsyncStorage.getItem(tasksKey);
          if (storedTasks) {
            const tasks = JSON.parse(storedTasks);
            const count = Array.isArray(tasks) ? tasks.filter((t) => !t.completed).length : 0;
            setIncompleteTasksCount(count);
          } else {
            setIncompleteTasksCount(0);
          }
        } catch (error) {
          console.error('Ошибка загрузки незавершенных задач:', error);
        }
      };
      loadIncompleteTasks();
    }, [])
  );


  const mergeBlocksWithDefaults = (source: DiagnosisBlock[]): DiagnosisBlock[] =>
    DEFAULT_BLOCKS.map(defaultBlock => {
      const storedBlock = source.find(block => block.id === defaultBlock.id);
      return storedBlock ? { ...defaultBlock, ...storedBlock } : defaultBlock;
    });

  const persistBlocks = async (blocksToSave: DiagnosisBlock[]) => {
    try {
      const userId = await getCurrentUserId();
      const venueId = selectedVenueId || (await getSelectedVenueId(userId));
      if (!venueId) {
        return;
      }
      const blocksKey = getVenueScopedKey('diagnosisBlocks', userId, venueId);
      await AsyncStorage.setItem(blocksKey, JSON.stringify(blocksToSave));
      if (userId) {
        await saveUserBlocks(userId, blocksToSave, venueId);
      }
    } catch (error) {
      console.error('Ошибка сохранения блоков:', error);
    }
  };

  const fetchBlocks = async (): Promise<DiagnosisBlock[]> => {
    let blocksSource: DiagnosisBlock[] = [];

    try {
      const userId = await getCurrentUserId();
      const venueId = selectedVenueId || (await getSelectedVenueId(userId));
      if (venueId) {
        const blocksKey = getVenueScopedKey('diagnosisBlocks', userId, venueId);
        const storedBlocks = await AsyncStorage.getItem(blocksKey);
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
      const nextBlocks = await buildBlocksFromProgress(allBlocks);
      setBlocks(nextBlocks);
      await persistBlocks(nextBlocks);
      console.log('Блоки обновлены в состоянии:', nextBlocks.length);
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
      const nextBlocks = await buildBlocksFromProgress(allBlocks);
      setBlocks(nextBlocks);
      await persistBlocks(nextBlocks);
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
    const parentNav = navigation.getParent?.();
    if (parentNav) {
      parentNav.navigate('Задачи', { screen: 'ActionPlanMain', params: { selectedTab: block.id } });
    } else {
      navigation.navigate('ActionPlanMain', { selectedTab: block.id });
    }
  };

  const getNextUncompletedBlock = () => {
    return blocks.find((block) => {
      const progress = blockProgress[block.id];
      const total = progress?.total ?? getQuestionCountForBlock(block.id);
      const answered = progress?.answered ?? 0;
      return answered < total;
    });
  };

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

  // Функция для получения цветов badge эффективности (как на дашборде)
  const getDiagnosisBadgeColors = (value: number) => {
    if (value === 0 || value === undefined || value === null) {
      return { bg: '#F6F8FA', text: '#525866' }; // серый
    }
    if (value >= 78) return { bg: '#CBF5E5', text: '#176448' }; // зеленый
    if (value >= 38) return { bg: '#FFDAC2', text: '#6E330C' }; // оранжевый (для 38-77)
    return { bg: '#F8C9D2', text: '#710E21' }; // красный (для < 38)
  };

  // Функция для подсчета количества вопросов в блоке
  const getQuestionCountForBlock = (blockId: string): number => {
    const blockData = (questionsData as any[]).find((block: any) => block.id === blockId);
    return blockData?.questions?.length || 0;
  };

  const getQuestionWord = (count: number): string => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 14) return 'вопросов';
    if (mod10 === 1) return 'вопрос';
    if (mod10 >= 2 && mod10 <= 4) return 'вопроса';
    return 'вопросов';
  };

  const getOptionScore = (option: any): number => {
    if (!option) return 0;
    if (option.correct === true) return 1;
    const priority = option.recommendation?.priority;
    if (priority === 'low') return 1;
    if (priority === 'medium') return 0.5;
    if (priority === 'high') return 0;
    return 0;
  };

  const readAnswersForBlock = async (blockId: string, userId?: string | null, venueId?: string | null) => {
    const primaryKey = getVenueScopedKey(`diagnosis_answers_${blockId}`, userId, venueId);
    let saved = await AsyncStorage.getItem(primaryKey);
    if (!saved) {
      const keys = await AsyncStorage.getAllKeys();
      const candidates = keys.filter((k) => k.includes(`diagnosis_answers_${blockId}`));
      const venueScoped = venueId ? candidates.filter((k) => k.includes(`_${venueId}`)) : candidates;
      const preferred = userId
        ? [
            ...venueScoped.filter((k) => k.includes(`user_${userId}`)),
            ...venueScoped.filter((k) => !k.includes(`user_${userId}`)),
          ]
        : venueScoped;
      if (preferred.length > 0) {
        saved = await AsyncStorage.getItem(preferred[0]);
      }
    }
    return saved ? JSON.parse(saved) : null;
  };

  const buildBlocksFromProgress = async (source: DiagnosisBlock[]) => {
    const userId = await getCurrentUserId();
    const venueId = await getSelectedVenueId(userId);
    const progressMap: Record<string, { answered: number; total: number; efficiency?: number }> = {};
    const nextBlocks: DiagnosisBlock[] = [];

    for (const block of source) {
      const questions = questionsByBlock[block.id] || [];
      const total = questions.length;
      const saved = await readAnswersForBlock(block.id, userId, venueId);
      let answered = 0;
      let scoreSum = 0;
      if (saved) {
        questions.forEach((question: any) => {
          const questionKey = `${block.id}_${question.id}`;
          const selectedAnswerId = saved[questionKey];
          if (selectedAnswerId) {
            const selectedOption = question.options.find((opt: any) => opt.id === selectedAnswerId);
            if (selectedOption && selectedOption.value) {
              answered += 1;
              scoreSum += getOptionScore(selectedOption);
            }
          }
        });
      }

      const efficiency = answered > 0 ? Math.round((scoreSum / answered) * 100) : undefined;
      const completed = answered > 0 ? answered >= total : block.completed;
      progressMap[block.id] = { answered, total, efficiency };
      nextBlocks.push({
        ...block,
        completed: completed || block.completed,
        efficiency: completed && efficiency !== undefined ? efficiency : block.efficiency,
      });
    }

    setBlockProgress(progressMap);
    return nextBlocks;
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
  const completedWithEfficiency = blocks.filter(
    (block) => block.completed && block.efficiency !== undefined
  );
  const overallEfficiency = completedWithEfficiency.length
    ? Math.round(
        completedWithEfficiency.reduce((sum, block) => sum + (block.efficiency ?? 0), 0) /
          completedWithEfficiency.length
      )
    : 0;

  const headerJSX = useMemo(() => {
    return (
      <DashboardHeader
        navigation={navigation}
        onHeaderPress={() => setShowAddModal(true)}
        selectedVenueId={selectedVenueId}
      />
    );
  }, [navigation, selectedVenueId]);

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          // Обработка скролла
        }}
        scrollEventThrottle={16}
      >
      {headerJSX}

      {/* Секция с иконками часов и плюсика */}
      <View style={[styles.section, styles.efficiencySection]}>
        <View style={styles.efficiencyHeader}>
          <View style={styles.efficiencyTitleContainer}>
            <Text style={styles.efficiencyTitle}>Диагностика</Text>
          </View>
          <View style={styles.efficiencyIcons}>
            {refreshIconSvg && (
              <AnimatedPressable style={styles.iconButton}>
                <SvgXml xml={refreshIconSvg} width={38} height={38} />
              </AnimatedPressable>
            )}
            {addIconSvg && (
              <AnimatedPressable style={styles.iconButton} onPress={() => setShowAddModal(true)}>
                <SvgXml xml={addIconSvg} width={38} height={38} />
              </AnimatedPressable>
            )}
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
              activeTab === 'Все' && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab('Все')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'Все' && styles.tabButtonTextActive
            ]}>
              Все
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tabButton,
              activeTab === 'К прохождению' && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab('К прохождению')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'К прохождению' && styles.tabButtonTextActive
            ]}>
              К прохождению
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tabButton,
              activeTab === 'Начатые' && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab('Начатые')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'Начатые' && styles.tabButtonTextActive
            ]}>
              Начатые
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tabButton,
              activeTab === 'Завершенные' && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab('Завершенные')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'Завершенные' && styles.tabButtonTextActive
            ]}>
              Завершенные
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Серая линия под табами */}
      <View style={styles.tabsDivider} />

      {/* Заголовок "Завершенные блоки" */}
      {(activeTab === 'Все' || activeTab === 'Завершенные') && (
      <View style={styles.completedSection}>
        <View style={styles.completedHeader}>
          <Text style={styles.completedTitle}>Завершенные блоки</Text>
          <Text style={styles.completedCount}>
            {blocks.filter((b) => b.completed && b.efficiency !== undefined).length}/{DEFAULT_BLOCKS.length}
          </Text>
        </View>
        <View style={styles.completedBlocksContainer}>
          {blocks
            .filter((block) => block.completed && block.efficiency !== undefined)
            .sort((a, b) => (a.efficiency ?? 0) - (b.efficiency ?? 0))
            .map((block) => {
              const efficiency = block.efficiency ?? 0;
              const badgeColors = getDiagnosisBadgeColors(efficiency);
              return (
                <TouchableOpacity
                  key={block.id}
                  style={styles.completedBlockCard}
                  onPress={() => handleBlockPress(block)}
                  activeOpacity={0.7}
                >
                  <View style={styles.completedBlockTopRow}>
                    <View style={styles.completedBlockIconCircle}>
                      <View style={styles.completedBlockIconScaled}>
                        {(() => {
                          const icon = getBlockIconSvg(block.id);
                          return icon ? (
                            <SvgXml xml={icon} width={38} height={38} />
                          ) : (
                            <Ionicons name="cube-outline" size={38} color={palette.primaryBlue} />
                          );
                        })()}
                      </View>
                    </View>
                    <View style={styles.completedBlockTextContainer}>
                      <Text style={styles.completedBlockTitle}>{block.title}</Text>
                      <Text style={styles.completedBlockSubtitle}>{getQuestionCountForBlock(block.id)} вопросов</Text>
                    </View>
                    <View style={[styles.completedBlockEfficiencyBadge, { backgroundColor: badgeColors.bg }]}>
                      <Text style={[styles.completedBlockEfficiencyPercent, { color: badgeColors.text }]}>
                        {efficiency}%
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
        </View>
      </View>
      )}

      {/* Серая линия под секцией "Завершенные блоки" */}
      {(activeTab === 'Все' || activeTab === 'Завершенные') && (
      <View style={styles.blocksDivider} />
      )}

      {/* Заголовок "К прохождению" и блоки */}
      {(activeTab === 'Все' || activeTab === 'К прохождению') && (
      <View style={styles.toPassSection}>
        <Text style={styles.toPassTitle}>К прохождению</Text>
        <View style={styles.toPassBlocksContainer}>
          {blocks
            .filter((block) => (blockProgress[block.id]?.answered ?? 0) === 0)
            .map((block) => (
              <TouchableOpacity
                key={block.id}
                style={styles.toPassBlockCard}
                onPress={() => handleBlockPress(block)}
                activeOpacity={0.7}
              >
                <View style={styles.toPassBlockTopRow}>
                  <View style={styles.toPassBlockIconCircle}>
                    <View style={styles.toPassBlockIconScaled}>
                      {(() => {
                        const icon = getBlockIconSvg(block.id);
                        return icon ? (
                          <SvgXml xml={icon} width={38} height={38} />
                        ) : (
                          <Ionicons name="cube-outline" size={38} color={palette.primaryBlue} />
                        );
                      })()}
                    </View>
                  </View>
                  <View style={styles.toPassBlockTextContainer}>
                    <Text style={styles.toPassBlockTitle}>{block.title}</Text>
                    <Text style={styles.toPassBlockSubtitle}>
                      {getQuestionCountForBlock(block.id)} вопросов
                    </Text>
                  </View>
                  {arrowRightIconSvg && (
                    <View style={styles.toPassBlockArrow}>
                      <SvgXml xml={arrowRightIconSvg} width={24} height={24} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
        </View>
      </View>
      )}

      {/* Серая линия под блоком "Концепция и позиционирование" */}
      {(activeTab === 'Все' || activeTab === 'К прохождению') && (
      <View style={styles.blocksDivider} />
      )}

      {/* Заголовок "В процессе" */}
      {(activeTab === 'Все' || activeTab === 'Начатые') && (
      <View style={styles.inProgressSection}>
          <Text style={styles.inProgressTitle}>В процессе</Text>
          <View style={styles.inProgressBlocksContainer}>
            {blocks
              .filter((block) => {
                const progress = blockProgress[block.id];
                return progress && progress.answered > 0 && progress.answered < progress.total;
              })
              .map((block) => {
                const progress = blockProgress[block.id];
                const remaining = progress ? Math.max(0, progress.total - progress.answered) : 0;
                return (
                  <TouchableOpacity
                    key={block.id}
                    style={styles.inProgressBlockCard}
                    onPress={() => handleBlockPress(block)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.inProgressBlockTopRow}>
                      <View style={styles.inProgressBlockIconCircle}>
                        <View style={styles.inProgressBlockIconScaled}>
                          {(() => {
                            const icon = getBlockIconSvg(block.id);
                            return icon ? (
                              <SvgXml xml={icon} width={38} height={38} />
                            ) : (
                              <Ionicons name="cube-outline" size={38} color={palette.primaryBlue} />
                            );
                          })()}
                        </View>
                      </View>
                      <View style={styles.inProgressBlockTextContainer}>
                        <Text style={styles.inProgressBlockTitle}>{block.title}</Text>
                        <Text style={styles.inProgressBlockSubtitle}>
                          осталось {remaining} {getQuestionWord(remaining)}
                        </Text>
                      </View>
                      {arrowRightIconSvg && (
                        <View style={styles.inProgressBlockArrow}>
                          <SvgXml xml={arrowRightIconSvg} width={24} height={24} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
          </View>
        </View>
      )}

      {/* Серая линия под блоком "Управление и организация" */}
      {(activeTab === 'Все' || activeTab === 'Начатые') && (
      <View style={styles.blocksDivider} />
      )}

      {/* Кнопки под серой линией */}
      <View style={styles.buttonsContainer}>
        <AnimatedPressable
          style={styles.continueButton}
          onPress={() => {
            const nextBlock = getNextUncompletedBlock();
            if (nextBlock) {
              navigation.navigate('BlockQuestions', {
                blockId: nextBlock.id,
                blockTitle: nextBlock.title,
                venueId: selectedVenueId,
              });
            } else {
              setShowAllCompletedModal(true);
            }
          }}
        >
          <Text style={styles.continueButtonText}>Продолжить диагностику</Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={styles.secondButton}
          onPress={() => {
            navigation.navigate('Register2');
          }}
        >
          <Text style={styles.secondButtonText}>Новая диагностика</Text>
        </AnimatedPressable>
      </View>

      <Modal
        visible={showAllCompletedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAllCompletedModal(false)}
      >
        <View style={styles.allCompletedOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowAllCompletedModal(false)}
          />
          <View style={styles.allCompletedCard}>
            <Text style={styles.allCompletedTitle}>Все блоки завершены</Text>
            <AnimatedPressable
              style={styles.allCompletedButton}
              onPress={() => setShowAllCompletedModal(false)}
            >
              <Text style={styles.allCompletedButtonText}>Отлично</Text>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>

      {/* Уведомление под кнопками */}
      <View style={styles.notificationContainer}>
        <View style={styles.notificationLeftBar} />
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>
            Мы рекомендуем сначала{' '}
            <Text style={styles.notificationTextBold}>завершить оставшиеся блоки</Text>
            {' '}и выполнить задачи по улучшению.{'\n'}
            Повторную диагностику оптимально{' '}
            <Text style={styles.notificationTextBold}>проходить раз в месяц</Text>
            {' '}— так вы увидите динамику роста.
          </Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationButtonText}>Настроить уведомления</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Отступ после уведомления */}
      <View style={{ height: 30 }} />

      </ScrollView>

      {/* Модальное окно выбора проекта */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowAddModal(false)}
          />
          <View style={styles.addModalContent}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Выберите ресторан</Text>
              <TouchableOpacity
                style={styles.addModalCloseButton}
                onPress={() => setShowAddModal(false)}
              >
                {modalCloseIconSvg ? (
                  <SvgXml xml={modalCloseIconSvg} width={24} height={24} />
                ) : (
                  <Text style={{ fontSize: 22, color: '#525866' }}>×</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.venuesCard}>
              {venues.length >= 5 ? (
                <ScrollView
                  style={styles.venuesScroll}
                  contentContainerStyle={styles.venuesScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {venues.map((venue, index) => {
                    const isSelected = venue.id === selectedVenueId;
                    return (
                      <TouchableOpacity
                        key={venue.id}
                        style={[
                          styles.venueRow,
                          index === venues.length - 1 && styles.venueRowLast,
                          { paddingHorizontal: 0 },
                        ]}
                        activeOpacity={0.8}
                        onPress={() => toggleVenue(venue.id)}
                      >
                        <View style={styles.venueAvatar}>
                          {venue.logoUri ? (
                            <Image source={{ uri: venue.logoUri }} style={styles.venueLogo} />
                          ) : logoPlaceholderSvg ? (
                            <View style={styles.venueIconScaled}>
                              <SvgXml xml={logoPlaceholderSvg} width={50} height={50} />
                            </View>
                          ) : (
                            <Ionicons name="image-outline" size={30} color={palette.gray400} />
                          )}
                        </View>
                        <View style={styles.venueInfo}>
                          <Text style={styles.venueName}>{venue.name}</Text>
                          <View style={styles.venueCityRow}>
                            <Text style={styles.venueCity}>{venue.city}</Text>
                            <View style={styles.venueCityIconContainer}>
                              {cityIconSvg ? (
                                <SvgXml xml={cityIconSvg} width={16} height={16} />
                              ) : (
                                <View style={{ width: 16, height: 16 }} />
                              )}
                            </View>
                          </View>
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
                </ScrollView>
              ) : (
                venues.map((venue, index) => {
                  const isSelected = venue.id === selectedVenueId;
                  return (
                    <TouchableOpacity
                      key={venue.id}
                      style={[
                        styles.venueRow,
                        index === venues.length - 1 && styles.venueRowLast,
                        { paddingHorizontal: 0 },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => toggleVenue(venue.id)}
                    >
                      <View style={styles.venueAvatar}>
                        {venue.logoUri ? (
                          <Image source={{ uri: venue.logoUri }} style={styles.venueLogo} />
                        ) : logoPlaceholderSvg ? (
                          <View style={styles.venueIconScaled}>
                            <SvgXml xml={logoPlaceholderSvg} width={50} height={50} />
                          </View>
                        ) : (
                          <Ionicons name="image-outline" size={30} color={palette.gray400} />
                        )}
                      </View>
                      <View style={styles.venueInfo}>
                        <Text style={styles.venueName}>{venue.name}</Text>
                        <View style={styles.venueCityRow}>
                          <Text style={styles.venueCity}>{venue.city}</Text>
                          <View style={styles.venueCityIconContainer}>
                            {cityIconSvg ? (
                              <SvgXml xml={cityIconSvg} width={16} height={16} />
                            ) : (
                              <View style={{ width: 16, height: 16 }} />
                            )}
                          </View>
                        </View>
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
                })
              )}
            </View>
            <TouchableOpacity
              style={styles.addRestaurantRow}
              onPress={() => {
                const isMaxEfficiency =
                  blocks.length === DEFAULT_BLOCKS.length &&
                  blocks.every((b) => b.completed && (b.efficiency ?? 0) >= 100);
                if (!isMaxEfficiency) {
                  setShowAddModal(false);
                  setShowAddWarningModal(true);
                  return;
                }
                setShowAddModal(false);
                navigation.navigate('Register2');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.addRestaurantPlus}>+ </Text>
              <Text style={styles.addRestaurantText}>Добавить еще ресторан</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddWarningModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddWarningModal(false)}
      >
        <View style={styles.addWarningOverlay}>
          <View style={styles.addWarningContent}>
            <View style={styles.addWarningHeader}>
              <View style={styles.addWarningLogo}>
                {projectAvatarUri ? (
                  <Image source={{ uri: projectAvatarUri }} style={styles.addWarningLogoImage} />
                ) : logoPlaceholderSvg ? (
                  <SvgXml xml={logoPlaceholderSvg} width={64} height={64} />
                ) : (
                  <View style={styles.addWarningLogoFallback}>
                    <Ionicons name="business" size={28} color={palette.gray400} />
                  </View>
                )}
                <View
                  style={[
                    styles.addWarningBadge,
                    { backgroundColor: getDiagnosisBadgeColors(overallEfficiency).bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.addWarningBadgeText,
                      { color: getDiagnosisBadgeColors(overallEfficiency).text },
                    ]}
                  >
                    {overallEfficiency}%
                  </Text>
                </View>
              </View>
              {modalCloseIconSvg && (
                <TouchableOpacity
                  style={styles.addWarningClose}
                  onPress={() => setShowAddWarningModal(false)}
                >
                  <SvgXml xml={modalCloseIconSvg} width={24} height={24} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.addWarningTitle}>Начать новую диагностику?</Text>
            <Text style={styles.addWarningText}>
              У вас есть{' '}
              <Text style={styles.addWarningHighlight}>{incompleteTasksCount} незавершенных задач</Text>{' '}
              по предыдущей диагностике. Мы рекомендуем сначала выполнить их, чтобы улучшить ваши
              показатели эффективности.
            </Text>
            <View style={styles.addWarningButtons}>
              <AnimatedPressable
                style={styles.maxActionButton}
                onPress={() => {
                  setShowAddWarningModal(false);
                  navigation.navigate('Register2');
                }}
              >
                <Text style={styles.addWarningPrimaryButtonText}>Все равно начать диагностику</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.improvementPlanButton}
                onPress={() => {
                  setShowAddWarningModal(false);
                  navigation.navigate('Задачи', { screen: 'ActionPlanMain', params: { selectedTab: 'all' } });
                }}
              >
                <Text style={styles.addWarningSecondaryButtonText}>К задачам</Text>
              </AnimatedPressable>
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
  scrollViewContent: {
    paddingBottom: spacing.xxl,
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
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
    minHeight: 18, // Фиксируем высоту, чтобы не прыгало
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 0,
  },
  addModalContent: {
    backgroundColor: '#F6F8FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    marginTop: SCREEN_HEIGHT * 0.54 - 25,
    height: SCREEN_HEIGHT * 0.46 + 25,
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
  venuesScroll: {
    maxHeight: SCREEN_HEIGHT * 0.26,
  },
  venuesScrollContent: {
    paddingBottom: spacing.xs,
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
  venueLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  venueCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueCity: {
    fontSize: 14,
    fontWeight: '300',
    color: palette.gray600,
  },
  venueCityIconContainer: {
    marginLeft: 4,
    transform: [{ translateY: 1 }],
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  addRestaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md - 2,
    marginBottom: spacing.md + 24,
  },
  addRestaurantPlus: {
    fontSize: 23,
    fontWeight: '400',
    color: '#0A0D14',
    fontFamily: 'Manrope-Bold',
    marginRight: 6,
  },
  addRestaurantText: {
    fontSize: 19,
    fontWeight: '400',
    color: '#0A0D14',
    fontFamily: 'Manrope-Bold',
    textAlign: 'center',
  },
  venueCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueCheckSelected: {
    borderColor: '#191BDF',
    backgroundColor: '#191BDF',
  },
  venueCheckText: {
    color: palette.white,
    fontSize: 14,
  },
  addWarningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  addWarningContent: {
    width: screenWidth,
    backgroundColor: palette.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    minHeight: SCREEN_HEIGHT * 0.5,
  },
  addWarningHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 70,
  },
  addWarningLogo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addWarningLogoImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  addWarningLogoFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addWarningClose: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 6,
  },
  addWarningBadge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  addWarningBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addWarningTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: '#0A0D14',
    marginTop: 16,
    textAlign: 'center',
  },
  addWarningText: {
    fontSize: 16,
    fontWeight: '300',
    color: 'rgba(10,13,20,0.8)',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  addWarningHighlight: {
    color: '#FF7A00',
    fontWeight: '400',
  },
  addWarningButtons: {
    marginTop: 22,
    gap: 12,
  },
  addWarningPrimaryButtonText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#162664',
  },
  addWarningSecondaryButtonText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#EBF1FF',
  },
  maxActionButton: {
    backgroundColor: 'transparent',
    height: 56,
    paddingHorizontal: spacing.md,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C2D6FF',
    width: '100%',
    alignSelf: 'stretch',
  },
  improvementPlanButton: {
    backgroundColor: '#191BDF',
    height: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerHidden: {
    opacity: 0,
  },
  profileInfoPressed: {
    opacity: 0.6,
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
    marginTop: spacing.md - 48, // Опущено на 2 пикселя (было -50, стало -48)
    marginBottom: spacing.sm,
  },
  efficiencyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  efficiencyTitle: {
    fontSize: 27,
    fontWeight: '400',
    color: '#0A0D14',
    marginLeft: 5,
  },
  efficiencyIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    // Убрали padding, чтобы иконки выравнивались как метрики ниже
  },
  tabsContainer: {
    marginTop: spacing.lg - spacing.sm - 2, // Поднято на 2 пикселя вверх
    marginBottom: spacing.md,
  },
  tabsScrollContent: {
    paddingLeft: spacing.sm + 5, // Выравнивание по левому краю заголовка "Диагностика"
    paddingRight: spacing.sm,
    gap: spacing.xxs,
  },
  tabButton: {
    paddingHorizontal: spacing.md - 2,
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
  tabsDivider: {
    height: 1,
    backgroundColor: '#E2E4E9',
    marginLeft: spacing.sm + 5, // Выравнивание по левому краю табов
    marginRight: spacing.sm,
    marginTop: spacing.md, // Такой же отступ как у заголовка "К прохождению"
    marginBottom: 0,
    zIndex: 1,
    position: 'relative',
  },
  toPassSection: {
    marginTop: spacing.lg,
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },
  toPassTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A0D14',
    fontFamily: 'Manrope-SemiBold',
    marginBottom: spacing.md,
  },
  toPassBlocksContainer: {
    gap: 15,
  },
  toPassBlockCard: {
    width: cardWidth,
    height: 100,
    backgroundColor: palette.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    padding: spacing.md,
  },
  toPassBlockTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  toPassBlockIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginRight: spacing.sm,
  },
  toPassBlockIconScaled: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 0.65 }],
  },
  toPassBlockTextContainer: {
    flex: 1,
  },
  toPassBlockTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0A0D14',
    fontFamily: 'Manrope-Medium',
    marginBottom: spacing.xxs,
  },
  toPassBlockSubtitle: {
    fontSize: 14,
    fontWeight: '300',
    color: palette.gray600,
    fontFamily: 'Manrope-Light',
  },
  toPassBlockArrow: {
    marginLeft: spacing.sm,
    alignSelf: 'center',
  },
  blocksDivider: {
    height: 1,
    backgroundColor: '#E2E4E9',
    marginLeft: spacing.md, // Такие же отступы как у блоков (toPassSection)
    marginRight: spacing.md,
    marginTop: spacing.lg + 15, // Увеличен отступ сверху еще на 5px
    marginBottom: 0,
    zIndex: 1,
    position: 'relative',
  },
  inProgressSection: {
    marginTop: spacing.md, // Такой же отступ как между табами и линией
    marginLeft: spacing.md, // Выравнивание по левой стороне как у toPassSection
    marginRight: spacing.md,
  },
  inProgressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A0D14',
    fontFamily: 'Manrope-SemiBold',
    marginBottom: spacing.md,
  },
  inProgressBlocksContainer: {
    gap: 15,
  },
  inProgressBlockCard: {
    width: cardWidth,
    height: 100,
    backgroundColor: palette.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    padding: spacing.md,
  },
  inProgressBlockTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  inProgressBlockIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginRight: spacing.sm,
  },
  inProgressBlockIconScaled: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 0.65 }],
  },
  inProgressBlockTextContainer: {
    flex: 1,
  },
  inProgressBlockTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0A0D14',
    fontFamily: 'Manrope-Medium',
    marginBottom: spacing.xxs,
  },
  inProgressBlockSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F17B2C',
    fontFamily: 'Manrope-Medium', // Увеличено на 100 (400 -> 500)
  },
  inProgressBlockArrow: {
    marginLeft: spacing.sm,
    alignSelf: 'center',
  },
  // Стили для секции "Завершенные блоки"
  completedSection: {
    marginTop: spacing.md,
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A0D14',
    fontFamily: 'Manrope-SemiBold',
  },
  completedCount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#525866',
    fontFamily: 'Manrope-Medium', // Увеличено на 100 (400 -> 500)
  },
  completedBlocksContainer: {
    gap: 15, // Такой же отступ как между блоками в секции "К прохождению"
  },
  completedBlockCard: {
    width: cardWidth,
    height: 100,
    backgroundColor: palette.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  completedBlockTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  completedBlockIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    backgroundColor: '#F6F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  completedBlockIconScaled: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 0.65 }],
  },
  completedBlockTextContainer: {
    flex: 1,
  },
  completedBlockTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0A0D14',
    fontFamily: 'Manrope-Medium',
    marginBottom: spacing.xxs,
  },
  completedBlockSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: palette.gray600,
    fontFamily: 'Manrope-Regular',
  },
  completedBlockEfficiencyBadge: {
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 6,
    minWidth: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  completedBlockEfficiencyPercent: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    includeFontPadding: false,
  },
  // Стили для кнопок под серой линией
  buttonsContainer: {
    marginTop: 15, // Отступ от серой линии
    marginLeft: spacing.md,
    marginRight: spacing.md,
    marginBottom: 5, // Уменьшено на 10px (15 -> 5)
    gap: 15, // Отступ между кнопками (такой же как между блоками)
  },
  continueButton: {
    backgroundColor: '#191BDF',
    height: 61, // Увеличено на 5px (56 -> 61)
    paddingHorizontal: spacing.lg,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600', // Увеличено на 100 (500 -> 600)
    fontFamily: Platform.select({
      ios: 'Manrope',
      android: 'Manrope',
      web: "'Manrope', sans-serif",
      default: 'Manrope',
    }),
    color: '#EBF1FF',
    textAlign: 'center',
  },
  secondButton: {
    backgroundColor: 'rgba(55, 93, 251, 0.1)', // #375DFB с непрозрачностью 10%
    height: 61, // Увеличено на 5px (56 -> 61)
    paddingHorizontal: spacing.lg,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondButtonText: {
    fontSize: 18,
    fontWeight: '600', // Увеличено на 100 (500 -> 600)
    fontFamily: Platform.select({
      ios: 'Manrope',
      android: 'Manrope',
      web: "'Manrope', sans-serif",
      default: 'Manrope',
    }),
    color: '#162664',
    textAlign: 'center',
  },
  allCompletedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  allCompletedCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
  },
  allCompletedTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#0A0D14',
    marginBottom: spacing.md,
  },
  allCompletedButton: {
    backgroundColor: '#191BDF',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: 99,
  },
  allCompletedButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // Стили для уведомления
  notificationContainer: {
    flexDirection: 'row',
    marginTop: 15, // Такой же отступ как между блоками
    marginLeft: spacing.md,
    marginRight: spacing.md,
    marginBottom: -7, // Уменьшено еще на 15px (8 - 15 = -7)
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FEF3EB',
  },
  notificationLeftBar: {
    width: 4,
    backgroundColor: '#FD680A',
  },
  notificationContent: {
    flex: 1,
    padding: spacing.md,
  },
  notificationText: {
    fontSize: 15, // Уменьшено на 1px (16 -> 15)
    fontWeight: '400',
    color: 'rgba(10, 13, 20, 0.9)', // #0A0D14 с непрозрачностью 90%
    fontFamily: 'Manrope-Regular',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  notificationTextBold: {
    fontWeight: '600',
    fontFamily: 'Manrope-SemiBold',
  },
  notificationButton: {
    backgroundColor: '#FEF3EB',
    borderWidth: 1,
    borderColor: '#FD680A',
    borderRadius: 99,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  notificationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FD680A',
    fontFamily: 'Manrope-Medium',
  },
});
