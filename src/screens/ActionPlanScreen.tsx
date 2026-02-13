import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import AnimatedPressable from '../components/AnimatedPressable';
import DashboardHeader from '../components/DashboardHeader';
import { DEFAULT_BLOCKS, DiagnosisBlock } from '../data/diagnosisBlocks';
import questionsData from '../data/questions.json';
import { generateTasksFromAnswers, getTasksByBlock, Task } from '../utils/recommendationEngine';
import { getCurrentUserId, getSelectedVenueId, getVenueScopedKey, loadUserQuestionnaire, loadUserTasks, saveUserTasks } from '../utils/userDataStorage';
import { palette, radii, spacing, typography } from '../styles/theme';

const logo = require('../../assets/images/logo-pelby.png');

const { width: screenWidth, height: SCREEN_HEIGHT } = Dimensions.get('window');
const cardWidth = screenWidth - spacing.md * 2;

const questionsByBlock: Record<string, any[]> = {};
(questionsData as any[]).forEach((block: any) => {
  questionsByBlock[block.id] = block.questions;
});

// Task interface теперь импортируется из recommendationEngine

export default function ActionPlanScreen({ route, navigation }: { route?: any; navigation?: any }) {
  const [restaurantName, setRestaurantName] = useState('Проект');
  const [city, setCity] = useState<string>('');
  const [projectAvatarUri, setProjectAvatarUri] = useState<string | null>(null);
  const [cityIconSvg, setCityIconSvg] = useState<string>('');
  const [helpButtonIconSvg, setHelpButtonIconSvg] = useState<string>('');
  const [headerReady] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [venues, setVenues] = useState<Array<{ id: string; name: string; city: string; logoUri?: string | null }>>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [completedBlocks, setCompletedBlocks] = useState<DiagnosisBlock[]>([]);
  const [allBlocks, setAllBlocks] = useState<DiagnosisBlock[]>([]);
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
  const [progressBarSvg, setProgressBarSvg] = useState<string>('');
  const [modalCloseIconSvg, setModalCloseIconSvg] = useState<string>('');
  const [radioActiveSvg, setRadioActiveSvg] = useState<string>('');
  const [radioInactiveSvg, setRadioInactiveSvg] = useState<string>('');
  const [logoPlaceholderSvg, setLogoPlaceholderSvg] = useState<string>('');
  const [taskCheckboxEmptySvg, setTaskCheckboxEmptySvg] = useState<string>('');
  const [taskCheckboxCheckedSvg, setTaskCheckboxCheckedSvg] = useState<string>('');
  const [subtasksByTask, setSubtasksByTask] = useState<
    Record<string, Array<{ id: string; title: string; completed: boolean }>>
  >({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showAddWarningModal, setShowAddWarningModal] = useState(false);

  const getTaskKey = (task: Task) => {
    const baseId = (task as any).id || task.title || 'task';
    const blockId = (task as any).blockId || task.blockId || 'block';
    return `${baseId}__${blockId}`;
  };

  useEffect(() => {
    loadIcons();
  }, []);

  // Обновляем задачи при возврате на экран (БЕЗ очистки данных)
  useFocusEffect(
    useCallback(() => {
      console.log('Экран "Задачи" получил фокус, обновляем задачи...');
      const syncSelectedVenue = async () => {
        const userId = await getCurrentUserId();
        const storedVenueId = await getSelectedVenueId(userId);
        if (storedVenueId && storedVenueId !== selectedVenueId) {
          setSelectedVenueId(storedVenueId);
          return;
        }
        loadTasksWithoutClearing();
        loadCompletedBlocks();
        loadProfileData();
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
        console.error('Ошибка загрузки заведений (задачи):', error);
      }
    };
    loadVenues();
  }, []);

  useEffect(() => {
    if (!selectedVenueId) return;
    setTasks([]);
    setCompletedBlocks([]);
    setAllBlocks([]);
    loadProfileData();
    loadCompletedBlocks();
    loadTasksWithoutClearing();
  }, [selectedVenueId]);

  const toggleVenue = (venueId: string) => {
    setSelectedVenueId(venueId);
    const venue = venues.find((item) => item.id === venueId);
    if (venue) {
      setRestaurantName(venue.name);
      setCity(venue.city);
      setProjectAvatarUri(venue.logoUri || null);
    }
    (async () => {
      try {
        const userId = await getCurrentUserId();
        await AsyncStorage.setItem('diagnosis_selected_venue_id', venueId);
        if (userId) {
          await AsyncStorage.setItem(`user_${userId}_diagnosis_selected_venue_id`, venueId);
        }
      } catch (error) {
        console.error('Ошибка сохранения выбранного проекта (задачи):', error);
      }
    })();
    loadProfileData();
    loadCompletedBlocks();
    loadTasksWithoutClearing();
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

      // Иконка закрытия модалки
      try {
        const closeAsset = Asset.fromModule(require('../../assets/images/compact-button-icon.svg'));
        await closeAsset.downloadAsync();
        if (closeAsset.localUri) {
          const response = await fetch(closeAsset.localUri);
          setModalCloseIconSvg(await response.text());
        }
      } catch (error) {
        console.error('Ошибка загрузки compact-button-icon.svg:', error);
      }

      // Радио-кнопки для выбора проекта
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

      // Плейсхолдер логотипа
      try {
        const logoAsset = Asset.fromModule(require('../../assets/images/restaurant-avatar-placeholder.svg'));
        await logoAsset.downloadAsync();
        if (logoAsset.localUri) {
          const response = await fetch(logoAsset.localUri);
          setLogoPlaceholderSvg(await response.text());
        }
      } catch (error) {
        console.error('Ошибка загрузки restaurant-avatar-placeholder.svg:', error);
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
        const emptyAsset = Asset.fromModule(
          require('../../assets/images/select-box-blank-circle-line (1).svg')
        );
        await emptyAsset.downloadAsync();
        if (emptyAsset.localUri) {
          const response = await fetch(emptyAsset.localUri);
          setTaskCheckboxEmptySvg(await response.text());
        }
      } catch (error) {
        console.error('Ошибка загрузки select-box-blank-circle-line.svg:', error);
      }

      try {
        const checkedAsset = Asset.fromModule(require('../../assets/images/checkbox-checked.svg'));
        await checkedAsset.downloadAsync();
        if (checkedAsset.localUri) {
          const response = await fetch(checkedAsset.localUri);
          setTaskCheckboxCheckedSvg(await response.text());
        }
      } catch (error) {
        console.error('Ошибка загрузки checkbox-checked.svg:', error);
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


  const readJsonFromKey = async (key: string) => {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Ошибка чтения ключа', key, error);
      return null;
    }
  };

  const loadCompletedBlocks = async () => {
    try {
      const userId = await getCurrentUserId();
      const venueId = selectedVenueId || (await getSelectedVenueId(userId));
      if (!venueId) {
        setCompletedBlocks([]);
        setAllBlocks(DEFAULT_BLOCKS);
        return;
      }
      let blocksSource: DiagnosisBlock[] = [];
      const blocksKey = getVenueScopedKey('diagnosisBlocks', userId, venueId);
      const storedBlocks = await readJsonFromKey(blocksKey);
      if (Array.isArray(storedBlocks) && storedBlocks.length) {
        blocksSource = storedBlocks;
      }

      // Объединяем с DEFAULT_BLOCKS, чтобы получить все блоки
      const mergedBlocks = DEFAULT_BLOCKS.map(defaultBlock => {
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

      // Фолбэк: если блоки не отмечены как пройденные, пересчитываем по сохраненным ответам
      const recalculatedBlocks: DiagnosisBlock[] = [];
      for (const block of mergedBlocks) {
        if (block.completed && block.efficiency !== undefined) {
          recalculatedBlocks.push(block);
          continue;
        }
        let saved: string | null = null;
        const answersKey = getVenueScopedKey(`diagnosis_answers_${block.id}`, userId, venueId);
        saved = await AsyncStorage.getItem(answersKey);
        if (!saved) {
          const keys = await AsyncStorage.getAllKeys();
          const candidates = keys.filter((k) => k.includes(`diagnosis_answers_${block.id}`));
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
        if (!saved) {
          recalculatedBlocks.push(block);
          continue;
        }
        try {
          const parsed = JSON.parse(saved);
          const blockQuestions = questionsByBlock[block.id] || [];
          let blockScoreSum = 0;
          let blockAnsweredCount = 0;
          blockQuestions.forEach((question: any) => {
            const questionKey = `${block.id}_${question.id}`;
            const selectedAnswerId = parsed[questionKey];
            if (selectedAnswerId) {
              const selectedOption = question.options.find((opt: any) => opt.id === selectedAnswerId);
              if (selectedOption && selectedOption.value) {
                const score = getOptionScore(selectedOption);
                blockScoreSum += score;
                blockAnsweredCount += 1;
              }
            }
          });
          if (blockAnsweredCount > 0) {
            const blockEfficiency = Math.round((blockScoreSum / blockAnsweredCount) * 100);
            recalculatedBlocks.push({
              ...block,
              completed: true,
              efficiency: blockEfficiency,
            });
          } else {
            recalculatedBlocks.push(block);
          }
        } catch (error) {
          console.error('Ошибка пересчета блока по ответам:', error);
          recalculatedBlocks.push(block);
        }
      }

      const completed = recalculatedBlocks.filter(b => b.completed && b.efficiency !== undefined);
      setAllBlocks(recalculatedBlocks);
      setCompletedBlocks(completed);
    } catch (error) {
      console.error('Ошибка загрузки блоков:', error);
      setCompletedBlocks([]);
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
      return sum + (task.completed ? task.efficiencyGain : 0);
    }, 0);
    const base = block.efficiency || 0;
    return Math.min(100, base + completedGain);
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

  const generateTasksFromStoredAnswers = async (userId: string | null, venueId: string | null) => {
    try {
      if (!venueId) return [];
      const generated: Task[] = [];
      for (const block of DEFAULT_BLOCKS) {
        let saved: string | null = null;
        const answersKey = getVenueScopedKey(`diagnosis_answers_${block.id}`, userId, venueId);
        saved = await AsyncStorage.getItem(answersKey);
        if (!saved) {
          const keys = await AsyncStorage.getAllKeys();
          const candidates = keys.filter((k) => k.includes(`diagnosis_answers_${block.id}`));
          const preferred = userId
            ? [
                ...candidates.filter((k) => k.includes(`user_${userId}`)),
                ...candidates.filter((k) => !k.includes(`user_${userId}`)),
              ]
            : candidates;
          if (preferred.length > 0) {
            saved = await AsyncStorage.getItem(preferred[0]);
          }
        }
        if (!saved) continue;
        const parsed = JSON.parse(saved);
        const blockQuestions = questionsByBlock[block.id] || [];
        const blockAnswers: Record<string, string> = {};
        blockQuestions.forEach((question: any) => {
          const questionKey = `${block.id}_${question.id}`;
          const selectedAnswerId = parsed[questionKey];
          if (selectedAnswerId) {
            const selectedOption = question.options.find((opt: any) => opt.id === selectedAnswerId);
            if (selectedOption && selectedOption.value) {
              blockAnswers[question.id] = selectedOption.value;
            }
          }
        });
        if (Object.keys(blockAnswers).length === 0) continue;
        const blockTasks = generateTasksFromAnswers(block.id, blockAnswers, blockQuestions, block.title);
        generated.push(...blockTasks);
      }
      return generated;
    } catch (error) {
      console.error('Ошибка генерации задач из ответов:', error);
      return [];
    }
  };

  const loadTasksWithoutClearing = async () => {
    try {
      console.log('Загружаем задачи без очистки...');
      let tasksSource: Task[] = [];
      const userId = await getCurrentUserId();
      if (userId) {
        tasksSource = await loadUserTasks(userId);
      }

      if (!userId && tasksSource.length === 0) {
        const venueId = await getSelectedVenueId(userId);
        const tasksKey = getVenueScopedKey('actionPlanTasks', userId, venueId);
        const storedTasks = await AsyncStorage.getItem(tasksKey);
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
        const venueId = await getSelectedVenueId(userId);
        const generatedTasks = await generateTasksFromStoredAnswers(userId, venueId);
        if (generatedTasks.length > 0) {
          const tasksWithDefaults = generatedTasks.map((task: any, index: number) => ({
            ...task,
            id: task.id || `task_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
            completed: task.completed || false,
          }));
          setTasks(tasksWithDefaults);
          const tasksKey = getVenueScopedKey('actionPlanTasks', userId, venueId);
          await AsyncStorage.setItem(tasksKey, JSON.stringify(tasksWithDefaults));
          if (userId) {
            await saveUserTasks(userId, tasksWithDefaults);
          }
        } else {
          console.log('Задач в хранилище нет, показываем пустой список');
          setTasks([]);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
      setTasks([]);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    if (route?.params?.selectedTab) {
      setSelectedTab(route.params.selectedTab);
    }
  }, [route?.params?.selectedTab]);

  const loadTasks = async () => {
    try {
      console.log('Загружаем задачи из AsyncStorage...');
      
      let tasksSource: Task[] = [];
      const userId = await getCurrentUserId();

      if (userId) {
        tasksSource = await loadUserTasks(userId);
      }

      if (!userId && tasksSource.length === 0) {
        const venueId = await getSelectedVenueId(userId);
        const tasksKey = getVenueScopedKey('actionPlanTasks', userId, venueId);
        const storedTasks = await AsyncStorage.getItem(tasksKey);
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
        const venueId = await getSelectedVenueId(userId);
        const generatedTasks = await generateTasksFromStoredAnswers(userId, venueId);
        if (generatedTasks.length > 0) {
          const tasksWithDefaults = generatedTasks.map((task: any, index: number) => ({
            ...task,
            id: task.id || `task_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
            completed: task.completed || false,
          }));
          setTasks(tasksWithDefaults);
          const tasksKey = getVenueScopedKey('actionPlanTasks', userId, venueId);
          await AsyncStorage.setItem(tasksKey, JSON.stringify(tasksWithDefaults));
          if (userId) {
            await saveUserTasks(userId, tasksWithDefaults);
          }
        } else {
          console.log('Задач в хранилище нет, показываем пустой список');
          setTasks([]);
        }
      }

      // Загружаем подзадачи
      const venueId = await getSelectedVenueId(userId);
      const subtasksKey = getVenueScopedKey('actionPlanSubtasks', userId, venueId);
      const subtasksJson = await AsyncStorage.getItem(subtasksKey);
      const subtasksParsed = subtasksJson ? JSON.parse(subtasksJson) : {};
      setSubtasksByTask(subtasksParsed || {});
      
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

      const userId = await getCurrentUserId();
      const venueId = await getSelectedVenueId(userId);
      const tasksKey = getVenueScopedKey('actionPlanTasks', userId, venueId);
      await AsyncStorage.setItem(tasksKey, JSON.stringify(updatedTasks));

      if (userId) {
        await saveUserTasks(userId, updatedTasks);
      }
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
    }
  };

  const saveSubtasks = async (next: Record<string, Array<{ id: string; title: string; completed: boolean }>>) => {
    try {
      setSubtasksByTask(next);
      const userId = await getCurrentUserId();
      const venueId = await getSelectedVenueId(userId);
      const subtasksKey = getVenueScopedKey('actionPlanSubtasks', userId, venueId);
      await AsyncStorage.setItem(subtasksKey, JSON.stringify(next));
    } catch (error) {
      console.error('Ошибка сохранения подзадач:', error);
    }
  };

  const addSubtask = async (taskId: string, title: string) => {
    if (!title.trim()) return;
    const newItem = { id: `sub_${Date.now()}`, title: title.trim(), completed: false };
    const next = {
      ...subtasksByTask,
      [taskId]: [...(subtasksByTask[taskId] || []), newItem],
    };
    await saveSubtasks(next);
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    const list = subtasksByTask[taskId] || [];
    const nextList = list.map((item) =>
      item.id === subtaskId ? { ...item, completed: !item.completed } : item
    );
    await saveSubtasks({ ...subtasksByTask, [taskId]: nextList });
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    const list = subtasksByTask[taskId] || [];
    const nextList = list.filter((item) => item.id !== subtaskId);
    await saveSubtasks({ ...subtasksByTask, [taskId]: nextList });
  };

  const deleteTask = async (taskId: string) => {
    try {
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      const userId = await getCurrentUserId();
      const venueId = await getSelectedVenueId(userId);
      const tasksKey = getVenueScopedKey('actionPlanTasks', userId, venueId);
      await AsyncStorage.setItem(tasksKey, JSON.stringify(updatedTasks));

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
      const userId = await getCurrentUserId();
      const venueId = await getSelectedVenueId(userId);
      const tasksKey = getVenueScopedKey('actionPlanTasks', userId, venueId);
      await AsyncStorage.removeItem(tasksKey);
      console.log('Все задачи очищены');

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

  // Задачи с приростом эффективности для каждого блока (без автогенерации шагов)
  const getStableWeight = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    const normalized = Math.abs(hash) % 100;
    return normalized + 1;
  };

  const isMaintenanceTask = (task: Task) => {
    const text = `${task.title || ''} ${task.description || ''}`.toLowerCase();
    return /поддерживай|поддерживайте|сохраняй|сохраняйте|регулярно|следите|обновляйте|актуализируйте/.test(text);
  };

  const getBlockTasks = (blockId: string) => {
    const blockInfo = allBlocks.find((b) => b.id === blockId);
    const baseEfficiency = blockInfo?.efficiency ?? 0;
    const remaining = Math.max(0, 100 - baseEfficiency);
    const rawTasks = tasksByBlock[blockId]?.tasks ?? [];
    if (!rawTasks.length) return [];

    const weights = rawTasks.map((task) =>
      getStableWeight(`${task.id || task.title || ''}:${blockId}`)
    );
    const totalWeight = weights.reduce((sum, w) => sum + w, 0) || 1;
    const gains = rawTasks.map((_, idx) =>
      remaining > 0 ? Math.floor((remaining * weights[idx]) / totalWeight) : 0
    );
    let assigned = gains.reduce((sum, v) => sum + v, 0);
    let leftover = Math.max(0, remaining - assigned);
    if (leftover > 0) {
      const indices = weights
        .map((w, i) => ({ w, i }))
        .sort((a, b) => b.w - a.w)
        .map((item) => item.i);
      let cursor = 0;
      while (leftover > 0) {
        const idx = indices[cursor % indices.length];
        gains[idx] += 1;
        leftover -= 1;
        cursor += 1;
      }
    }

    // Перемешиваем распределение, чтобы не было "по порядку"
    const shuffledGains = [...gains];
    let seed = getStableWeight(`${blockId}:${rawTasks.length}`) + 7;
    for (let i = shuffledGains.length - 1; i > 0; i -= 1) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = seed % (i + 1);
      const tmp = shuffledGains[i];
      shuffledGains[i] = shuffledGains[j];
      shuffledGains[j] = tmp;
    }

    // Не допускаем 0% для "действий": перераспределяем минимум 1% от других задач
    if (remaining > 0) {
      const zeroActionIndices = rawTasks
        .map((task, idx) => ({ idx, task }))
        .filter(({ idx, task }) => shuffledGains[idx] === 0 && !isMaintenanceTask(task))
        .map(({ idx }) => idx);

      if (zeroActionIndices.length) {
        const sortedDonors = shuffledGains
          .map((gain, idx) => ({ gain, idx }))
          .filter((item) => item.gain > 0)
          .sort((a, b) => b.gain - a.gain);

        zeroActionIndices.forEach((targetIdx) => {
          let donorIdx = sortedDonors.find((item) => item.gain > 1)?.idx;
          if (donorIdx === undefined) {
            donorIdx = sortedDonors.find((item) => item.gain > 0)?.idx;
          }
          if (donorIdx !== undefined) {
            shuffledGains[donorIdx] -= 1;
            shuffledGains[targetIdx] += 1;
          } else {
            shuffledGains[targetIdx] += 1;
          }
        });
      }
    }

    return rawTasks.map((task, idx) => ({
      ...task,
      blockId: task.blockId || blockId,
      blockTitle: task.blockTitle || blockInfo?.title || blockId,
      efficiencyGain: shuffledGains[idx],
    }));
  };

  const completedBlocksToDisplay = completedBlocks;
  const completedForMax = allBlocks.filter((b) => b.completed && b.efficiency !== undefined);
  const isMaxEfficiency =
    completedForMax.length === DEFAULT_BLOCKS.length &&
    completedForMax.every((b) => (b.efficiency ?? 0) >= 100);
  const currentBadgeValue = completedForMax.length
    ? Math.round(
        completedForMax.reduce((sum, b) => sum + (b.efficiency ?? 0), 0) / completedForMax.length
      )
    : 0;
  const incompleteTasksCount = tasks.filter((task) => !task.completed).length;

  // Непройденные блоки берём из актуальных данных
  const uncompletedBlocksToDisplay: DiagnosisBlock[] = allBlocks.filter(
    (block) => !block.completed || block.efficiency === undefined
  );
  
  // Объединяем: сначала завершенные, затем два непройденных блока внизу
  const blocksToDisplay = [...completedBlocksToDisplay, ...uncompletedBlocksToDisplay];

  // Сортируем только завершенные блоки по динамической эффективности (от меньшей к большей)
  // Непройденные блоки остаются в конце без сортировки
  const completedSorted = completedBlocksToDisplay.sort((a, b) => {
    const efficiencyA = getBlockTasksEfficiency(a);
    const efficiencyB = getBlockTasksEfficiency(b);
    return efficiencyA - efficiencyB; // От меньшей к большей
  });
  
  // Объединяем: завершенные (отсортированные) + непройденные (в конце)
  const sortedBlocksToDisplay = [...completedSorted, ...uncompletedBlocksToDisplay];

  // Формируем список блоков для отображения
  // Если выбран конкретный таб, соответствующий блок ставим первым, остальные в исходном порядке
  // Непройденные блоки всегда остаются внизу
  const displayedBlocks = sortedBlocksToDisplay;

  const blockOffsetsRef = useRef<Record<string, number>>({});
  const programmaticScrollRef = useRef(false);

  const scrollToBlock = (blockId: string) => {
    const y = blockOffsetsRef.current[blockId];
    if (y === undefined) return;
    programmaticScrollRef.current = true;
    scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 60), animated: true });
    setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 350);
  };

  useEffect(() => {
    if (!selectedTab || selectedTab === 'all') return;
    const timeout = setTimeout(() => {
      scrollToBlock(selectedTab);
    }, 50);
    return () => clearTimeout(timeout);
  }, [selectedTab]);

  // Мемоизируем JSX шапки для предотвращения ре-рендеров
  const headerJSX = useMemo(() => {
    return (
      <DashboardHeader
        navigation={navigation}
        onHeaderPress={() => setShowAddModal(true)}
        selectedVenueId={selectedVenueId}
      />
    );
  }, [navigation, selectedVenueId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Загрузка задач...</Text>
      </View>
    );
  }

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 500 && !showScrollTop) {
      setShowScrollTop(true);
    } else if (offsetY <= 500 && showScrollTop) {
      setShowScrollTop(false);
    }

    if (programmaticScrollRef.current) return;

    if (offsetY <= 40 && selectedTab !== 'all') {
      setSelectedTab('all');
    }
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
          <Pressable
            style={({ pressed }) => [
              styles.tabButton,
              selectedTab === 'all' && styles.tabButtonActive,
              pressed && styles.tabButtonPressed,
            ]}
            onPress={() => setSelectedTab('all')}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.tabButtonText,
                selectedTab === 'all' && styles.tabButtonTextActive,
              ]}
            >
              Все задачи
            </Text>
          </Pressable>
          {sortedBlocksToDisplay
            .filter(block => block.completed && block.efficiency !== undefined) // Завершенные блоки
            .map((block) => {
            const shortName = getShortBlockName(block.title);
            const dynamicEfficiency = getBlockTasksEfficiency(block);
            return (
              <Pressable 
                key={block.id}
                style={({ pressed }) => [
                  styles.tabButton,
                  selectedTab === block.id && styles.tabButtonActive,
                  pressed && styles.tabButtonPressed,
                ]}
                onPress={() => setSelectedTab(block.id)}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabButtonText,
                    selectedTab === block.id && styles.tabButtonTextActive,
                  ]}
                >
                  {shortName} {dynamicEfficiency}%
                </Text>
              </Pressable>
            );
          })}
          {/* Два непройденных блока в табах справа с "0%" */}
          {uncompletedBlocksToDisplay.map((block) => {
            const shortName = getShortBlockName(block.title);
            return (
              <Pressable 
                key={block.id}
                style={({ pressed }) => [
                  styles.tabButton,
                  selectedTab === block.id && styles.tabButtonActive,
                  pressed && styles.tabButtonPressed,
                ]}
                onPress={() => setSelectedTab(block.id)}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabButtonText,
                    selectedTab === block.id && styles.tabButtonTextActive,
                  ]}
                >
                  {shortName} 0%
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Блоки с задачами */}
      {displayedBlocks.map((block, blockIndex) => {
        const isUncompleted = !block.completed || block.efficiency === undefined;
        const blockTasks = getBlockTasks(block.id);
        const dynamicEfficiency = getBlockTasksEfficiency(block);
        const sortedBlockTasks = blockTasks;
        const blockIconSvg = getBlockIconSvg(block.id);
        const blockBadgeColors = getDiagnosisBadgeColors(dynamicEfficiency);
        const isLastBlock = blockIndex === displayedBlocks.length - 1;
        
        // Если блок непройденный, показываем специальный формат
        if (isUncompleted) {
          return (
            <React.Fragment key={block.id}>
              <View
                style={styles.blockContainer}
                onLayout={(e) => {
                  blockOffsetsRef.current[block.id] = e.nativeEvent.layout.y;
                }}
              >
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
                        blockTitle: block.title,
                        venueId: selectedVenueId,
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
            <View
              style={styles.blockContainer}
              onLayout={(e) => {
                blockOffsetsRef.current[block.id] = e.nativeEvent.layout.y;
              }}
            >
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
                  const efficiencyGain = Number.isFinite(task.efficiencyGain) ? task.efficiencyGain : 0;
                  const taskKey = getTaskKey(task);
                  const subtaskCount = subtasksByTask[taskKey]?.length || 0;
                  const isCompleted = task.completed;
                  const completedColor = '#868C98';
                  const rawTitle = (task.title || '').trim();
                  const displayTitle =
                    rawTitle && rawTitle.toLowerCase() !== 'рекомендация'
                      ? rawTitle
                      : (task.description || rawTitle || 'Рекомендация');
                  const displayTitleClean = displayTitle.replace(/\.+\s*$/g, '').trim();
                  
                  const isMaintenanceTaskUi = /поддерживай|поддерживайте|сохраняй|сохраняйте|регулярно|следите|обновляйте|актуализируйте/i.test(
                    `${displayTitleClean} ${task.description || ''}`
                  );
                  return (
                    <TouchableOpacity 
                      key={taskIndex} 
                      style={styles.taskCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        navigation.navigate('TaskSubtasks', { task });
                      }}
                    >
                      <View style={styles.taskCardTopRow}>
                        <TouchableOpacity
                          style={styles.taskCheckbox}
                          activeOpacity={0.8}
                          onPress={() => toggleTaskCompletion(task.id)}
                        >
                          {isCompleted ? (
                            taskCheckboxCheckedSvg ? (
                              <SvgXml xml={taskCheckboxCheckedSvg} width={24} height={24} />
                            ) : (
                              <View style={styles.taskCheckboxFallbackActive} />
                            )
                          ) : taskCheckboxEmptySvg ? (
                            <SvgXml xml={taskCheckboxEmptySvg} width={24} height={24} />
                          ) : (
                            <View style={styles.taskCheckboxFallback} />
                          )}
                        </TouchableOpacity>
                        <View style={styles.taskCardTextContainer}>
                          <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}>
                            {displayTitleClean}
                          </Text>
                          <View style={styles.taskStepsRow}>
                            <Text
                              style={[
                                styles.taskEfficiencyValue,
                                isCompleted && styles.taskTextCompleted,
                              ]}
                            >
                              {efficiencyGain > 0
                                ? `+${efficiencyGain}%`
                                : isMaintenanceTaskUi
                                  ? '+%'
                                  : '+1%'}
                            </Text>
                            <View style={styles.taskStepsDot} />
                            <Text style={[styles.taskSubtaskLabel, isCompleted && styles.taskTextCompleted]}>
                              {subtaskCount > 0 ? `${subtaskCount} ${getStepsWord(subtaskCount)}` : 'нет подзадач'}
                            </Text>
                          </View>
                        </View>
                        {arrowRightIconSvg ? (
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

    {showScrollTop && (
      <TouchableOpacity
        style={styles.scrollTopButton}
        activeOpacity={0.8}
        onPress={() => {
          setSelectedTab('all');
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }}
      >
        <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    )}

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
                  { backgroundColor: getDiagnosisBadgeColors(currentBadgeValue).bg },
                ]}
              >
                <Text
                  style={[
                    styles.addWarningBadgeText,
                    { color: getDiagnosisBadgeColors(currentBadgeValue).text },
                  ]}
                >
                  {currentBadgeValue}%
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
    alignSelf: 'flex-start',
    flexShrink: 0,
    flexGrow: 0,
  },
  tabButtonActive: {
    backgroundColor: '#191BDF',
    borderColor: '#191BDF',
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#525866',
    flexShrink: 0,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  tabButtonPressed: {
    transform: [{ scale: 0.98 }],
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
    flexShrink: 1,
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
    minHeight: 100,
    backgroundColor: palette.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  taskCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  taskCheckbox: {
    marginRight: 12,
    alignSelf: 'flex-start',
    marginTop: 2,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCheckboxFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#868C98',
  },
  taskCheckboxFallbackActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#38C793',
  },
  taskCardTextContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0D14',
    fontFamily: 'Manrope-SemiBold',
    marginBottom: spacing.xxs,
  },
  taskTitleCompleted: {
    color: '#868C98',
  },
  taskStepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskSubtaskLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Manrope-Medium',
    color: '#525866',
  },
  taskTextCompleted: {
    color: '#868C98',
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
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CDD0D5',
    marginHorizontal: 8,
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
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 18,
    includeFontPadding: false,
    color: '#38C793',
    marginLeft: 0,
  },
  taskEfficiencyHidden: {
    opacity: 0,
  },
  subtaskEmptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  subtaskEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0D14',
    marginBottom: 6,
  },
  subtaskEmptyText: {
    fontSize: 14,
    fontWeight: '300',
    color: '#525866',
    textAlign: 'center',
  },
  subtasksList: {
    gap: 10,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  subtaskCheckbox: {
    marginRight: 10,
  },
  subtaskText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Manrope-Regular',
    color: '#0A0D14',
  },
  subtaskTextCompleted: {
    color: '#868C98',
  },
  subtaskDelete: {
    paddingLeft: 6,
  },
  addSubtaskButton: {
    marginTop: 14,
    alignSelf: 'center',
  },
  addSubtaskButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#191BDF',
  },
  subtaskEditorContent: {
    width: cardWidth,
    backgroundColor: palette.white,
    borderRadius: 20,
    padding: spacing.md,
    alignSelf: 'center',
  },
  subtaskInput: {
    borderWidth: 1,
    borderColor: '#E2E4E9',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#0A0D14',
    marginTop: 12,
  },
  subtaskSaveButton: {
    marginTop: 14,
    backgroundColor: '#191BDF',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  subtaskSaveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  taskArrow: {
    marginLeft: spacing.sm,
    alignSelf: 'center',
  },
  scrollTopButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl + 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#191BDF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
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
