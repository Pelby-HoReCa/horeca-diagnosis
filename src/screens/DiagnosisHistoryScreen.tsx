import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SvgXml } from 'react-native-svg';
import AnimatedPressable from '../components/AnimatedPressable';
import { DEFAULT_BLOCKS, DiagnosisBlock } from '../data/diagnosisBlocks';
import questionsData from '../data/questions.json';
import { palette, radii, spacing } from '../styles/theme';
import { getCurrentUserId, getSelectedVenueId, getVenueScopedKey, loadUserQuestionnaire } from '../utils/userDataStorage';

const initialCards = [{ id: 'summary', type: 'summary' as const }];

export default function DiagnosisHistoryScreen({ navigation }: any) {
  const [backIconSvg, setBackIconSvg] = useState<string>('');
  const [menuIconSvg, setMenuIconSvg] = useState<string>('');
  const [projectAvatarUri, setProjectAvatarUri] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('Проект');
  const [city, setCity] = useState<string>('город');
  const [cityIconSvg, setCityIconSvg] = useState<string>('');
  const [checkboxSvg, setCheckboxSvg] = useState<string>('');
  const [arrowDownSvg, setArrowDownSvg] = useState<string>('');
  const [deleteIconSvg, setDeleteIconSvg] = useState<string>('');
  const [directionsCloseIconSvg, setDirectionsCloseIconSvg] = useState<string>('');
  const [radioActiveSvg, setRadioActiveSvg] = useState<string>('');
  const [radioInactiveSvg, setRadioInactiveSvg] = useState<string>('');
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [modalBadgeWidth, setModalBadgeWidth] = useState<number | null>(null);
  const [modalHeaderInfo, setModalHeaderInfo] = useState<{ value: string; date: string; color: string } | null>(null);
  const [summaryValue, setSummaryValue] = useState<number | null>(null);
  const [blockResults, setBlockResults] = useState<DiagnosisBlock[]>(
    DEFAULT_BLOCKS.map((block) => ({
      ...block,
      completed: false,
      efficiency: undefined,
    }))
  );
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
  const [cards, setCards] = useState(initialCards);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<any | null>(null);
  const [previousHistoryEntry, setPreviousHistoryEntry] = useState<any | null>(null);
  const [venues, setVenues] = useState<Array<{ id: string; name: string; city: string; logoUri?: string | null }>>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [dateFilterText, setDateFilterText] = useState('');
  const [logoPlaceholderSvg, setLogoPlaceholderSvg] = useState<string>('');
  const NOTE_PLACEHOLDER = 'В этом месяце проблемы с ...';
  const LEGACY_NOTE_DEFAULT = 'Были некоторые проблемы с поставщиками продуктов, на данный момент решил эти вопросы.';
  const [notes, setNotes] = useState<
    Array<{ id: string; title: string; body: string; createdAt: string; historyEntryId?: string }>
  >([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteTitleDraft, setNoteTitleDraft] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteItemHeight, setNoteItemHeight] = useState<number | null>(null);
  const [isNoteEditing, setIsNoteEditing] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [showNoteConfirm, setShowNoteConfirm] = useState(false);
  const [noteEditorSource, setNoteEditorSource] = useState<'directions' | 'main' | null>(null);
  const [closeIconSvg, setCloseIconSvg] = useState<string>('');
  const noteInputRef = React.useRef<TextInput>(null);
  const [noteClearIconSvg, setNoteClearIconSvg] = useState<string>('');
  const [noteConfirmIconSvg, setNoteConfirmIconSvg] = useState<string>('');
  const [noteDeleteIconSvg, setNoteDeleteIconSvg] = useState<string>('');
  const [allHistoryEntries, setAllHistoryEntries] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [highlightedEntryId, setHighlightedEntryId] = useState<string | null>(null);
  const historyCardRefs = useRef<Record<string, View | null>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const latestVenueIdRef = useRef<string | null>(null);
  const historyLoadTokenRef = useRef(0);

  const openNoteEditor = (note?: { id?: string; title?: string; body?: string }) => {
    setEditingNoteId(note?.id || null);
    setNoteTitleDraft(note?.title || '');
    setNoteDraft(note?.body || '');
    setIsTitleEditing(false);
    setNoteEditorSource('directions');
    setShowDirectionsModal(false);
    setTimeout(() => setIsNoteEditing(true), 50);
  };

  const deleteCard = (id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
  };

  const renderRightActions = useCallback(
    () => (
      <View style={styles.deleteAction}>
        {deleteIconSvg && <SvgXml xml={deleteIconSvg} width={23} height={23} />}
      </View>
    ),
    [deleteIconSvg]
  );

  const parseCityFromAddress = (address?: string) => {
    if (!address) return 'город';
    const cityPart = address.split(',')[0]?.trim();
    return cityPart || 'город';
  };

  const updateHeaderFromVenue = (venue?: { id: string; name: string; city: string; logoUri?: string | null }) => {
    if (!venue) return;
    setProjectName(venue.name || 'Проект');
    setCity(venue.city || 'город');
    setProjectAvatarUri(venue.logoUri || null);
  };

  const questions: Record<string, any[]> = {};
  (questionsData as any[]).forEach((block: any) => {
    questions[block.id] = block.questions;
  });

  const calculateBlockResults = async (venueId: string | null) => {
    try {
      const blocksData: DiagnosisBlock[] = [];
      const userId = await getCurrentUserId();

      for (const block of DEFAULT_BLOCKS) {
        const answersKey = getVenueScopedKey(`diagnosis_answers_${block.id}`, userId, venueId);
        const saved = await AsyncStorage.getItem(answersKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          const blockQuestions = questions[block.id] || [];
          let blockCorrect = 0;
          let blockIncorrect = 0;

          blockQuestions.forEach((question) => {
            const questionKey = `${block.id}_${question.id}`;
            const selectedAnswerId = parsed[questionKey];
            if (selectedAnswerId) {
              const selectedOption = question.options.find((opt: any) => opt.id === selectedAnswerId);
              if (selectedOption && selectedOption.value) {
                if (selectedOption.correct) {
                  blockCorrect++;
                } else {
                  blockIncorrect++;
                }
              }
            }
          });

          const blockTotalAnswers = blockCorrect + blockIncorrect;
          const blockEfficiency = blockTotalAnswers > 0 ? Math.round((blockCorrect / blockTotalAnswers) * 100) : 0;

          blocksData.push({
            ...block,
            completed: true,
            efficiency: blockEfficiency,
          });
        } else {
          blocksData.push({
            ...block,
            completed: false,
            efficiency: undefined,
          });
        }
      }

      setBlockResults(blocksData);
    } catch (error) {
      console.error('Ошибка подсчета результатов блоков:', error);
    }
  };

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

  const getBlockDelta = (blockId: string, current?: number) => {
    if (!previousHistoryEntry || typeof current !== 'number') return null;
    const prev = previousHistoryEntry?.blockEfficiencies?.[blockId];
    if (typeof prev !== 'number') return null;
    const delta = current - prev;
    if (delta === 0) return 0;
    return delta;
  };

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

  const modalBlockResults = DEFAULT_BLOCKS.map((block) => {
    const efficiency = selectedHistoryEntry?.blockEfficiencies?.[block.id];
    return {
      ...block,
      completed: typeof efficiency === 'number',
      efficiency: typeof efficiency === 'number' ? efficiency : undefined,
    };
  });

  const sortedBlockResults = [...modalBlockResults].sort((a, b) => {
    const aEfficiency = a.efficiency !== undefined ? a.efficiency : 0;
    const bEfficiency = b.efficiency !== undefined ? b.efficiency : 0;
    return aEfficiency - bEfficiency;
  });

  useEffect(() => {
    const loadIcons = async () => {
      try {
        const backIconAsset = Asset.fromModule(require('../../assets/images/Frame 8 (3).svg'));
        await backIconAsset.downloadAsync();
        if (backIconAsset.localUri) {
          const response = await fetch(backIconAsset.localUri);
          const fileContent = await response.text();
          setBackIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG стрелки:', error);
      }

      try {
        const menuIconAsset = Asset.fromModule(require('../../assets/images/Frame 9.svg'));
        await menuIconAsset.downloadAsync();
        if (menuIconAsset.localUri) {
          const response = await fetch(menuIconAsset.localUri);
          const fileContent = await response.text();
          setMenuIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки меню:', error);
      }

      try {
        const cityIconAsset = Asset.fromModule(require('../../assets/images/arrow-down-city.svg'));
        await cityIconAsset.downloadAsync();
        if (cityIconAsset.localUri) {
          const response = await fetch(cityIconAsset.localUri);
          const fileContent = await response.text();
          setCityIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки города:', error);
      }

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

      try {
        const logoAsset = Asset.fromModule(require('../../assets/images/restaurant-avatar-placeholder.svg'));
        await logoAsset.downloadAsync();
        if (logoAsset.localUri) {
          const response = await fetch(logoAsset.localUri);
          const fileContent = await response.text();
          setLogoPlaceholderSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG логотипа-заглушки:', error);
      }

      try {
        const arrowAsset = Asset.fromModule(require('../../assets/images/вниз.svg'));
        await arrowAsset.downloadAsync();
        if (arrowAsset.localUri) {
          const response = await fetch(arrowAsset.localUri);
          const fileContent = await response.text();
          setArrowDownSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG стрелки вниз:', error);
      }

      try {
        const deleteAsset = Asset.fromModule(require('../../assets/images/delete-02.svg'));
        await deleteAsset.downloadAsync();
        if (deleteAsset.localUri) {
          const response = await fetch(deleteAsset.localUri);
          const fileContent = await response.text();
          setDeleteIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG корзины:', error);
      }

      try {
        const closeIconAsset = Asset.fromModule(require('../../assets/images/compact-button-icon.svg'));
        await closeIconAsset.downloadAsync();
        if (closeIconAsset.localUri) {
          const response = await fetch(closeIconAsset.localUri);
          const fileContent = await response.text();
          setDirectionsCloseIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки закрытия направлений:', error);
      }

      try {
        const closeIconAsset = Asset.fromModule(require('../../assets/images/compact-button-icon.svg'));
        await closeIconAsset.downloadAsync();
        if (closeIconAsset.localUri) {
          const response = await fetch(closeIconAsset.localUri);
          const fileContent = await response.text();
          setCloseIconSvg(fileContent);
        }
      } catch (error) {}

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

      try {
        const noteClearAsset = Asset.fromModule(require('../../assets/images/Group 3362253.svg'));
        await noteClearAsset.downloadAsync();
        if (noteClearAsset.localUri) {
          const response = await fetch(noteClearAsset.localUri);
          setNoteClearIconSvg(await response.text());
        }
      } catch (error) {}

      try {
        const noteConfirmAsset = Asset.fromModule(require('../../assets/images/Checkbox [1.0] (2).svg'));
        await noteConfirmAsset.downloadAsync();
        if (noteConfirmAsset.localUri) {
          const response = await fetch(noteConfirmAsset.localUri);
          setNoteConfirmIconSvg(await response.text());
        }
      } catch (error) {}

      try {
        const noteDeleteAsset = Asset.fromModule(require('../../assets/images/delete-02.svg'));
        await noteDeleteAsset.downloadAsync();
        if (noteDeleteAsset.localUri) {
          const response = await fetch(noteDeleteAsset.localUri);
          setNoteDeleteIconSvg(await response.text());
        }
      } catch (error) {}

    try {
      const radioActiveAsset = Asset.fromModule(require('../../assets/images/radio-active-icon.svg'));
      await radioActiveAsset.downloadAsync();
      if (radioActiveAsset.localUri) {
        const response = await fetch(radioActiveAsset.localUri);
        const fileContent = await response.text();
        setRadioActiveSvg(fileContent);
      }
    } catch (error) {
      console.error('Ошибка загрузки SVG активной радиокнопки:', error);
    }

    try {
      const radioInactiveAsset = Asset.fromModule(require('../../assets/images/radio-inactive-icon.svg'));
      await radioInactiveAsset.downloadAsync();
      if (radioInactiveAsset.localUri) {
        const response = await fetch(radioInactiveAsset.localUri);
        const fileContent = await response.text();
        setRadioInactiveSvg(fileContent);
      }
    } catch (error) {
      console.error('Ошибка загрузки SVG неактивной радиокнопки:', error);
    }

    };

    loadIcons();
  }, []);

  const loadVenues = async () => {
    try {
      const userId = await getCurrentUserId();
      let restaurants: any[] = [];
      let fallbackName = 'Проект';
      let fallbackAddress = '';
      let fallbackLogo: string | null = null;

      if (userId) {
        const questionnaireData = await loadUserQuestionnaire(userId);
        if (questionnaireData) {
          fallbackName = questionnaireData.projectName || questionnaireData.restaurantName || fallbackName;
          fallbackAddress = questionnaireData.address || questionnaireData.city || '';
          fallbackLogo = questionnaireData.projectLogoUri || questionnaireData.logoUri || questionnaireData.logo || null;
          if (Array.isArray(questionnaireData.restaurants)) {
            restaurants = questionnaireData.restaurants;
          }
        }
      }

      if (!restaurants.length) {
        restaurants = [
          {
            id: 'venue_0',
            name: fallbackName,
            address: fallbackAddress,
            logoUri: fallbackLogo,
          },
        ];
      }

      const mapped = restaurants.map((restaurant: any, index: number) => {
        const name = restaurant?.name || fallbackName || 'Проект';
        const address = restaurant?.address || fallbackAddress || '';
        return {
          id: restaurant?.id || `venue_${index}`,
          name,
          city: parseCityFromAddress(address),
          logoUri:
            restaurant?.logoUri ||
            restaurant?.projectLogoUri ||
            restaurant?.logo ||
            fallbackLogo ||
            null,
        };
      });

      setVenues(mapped);

      const savedVenueId = await getSelectedVenueId(userId);
      const exists = savedVenueId && mapped.some((venue) => venue.id === savedVenueId);
      const nextVenueId = exists ? savedVenueId : mapped[0]?.id || null;
      setSelectedVenueId(nextVenueId);
      if (nextVenueId) {
        const venue = mapped.find((item) => item.id === nextVenueId);
        updateHeaderFromVenue(venue);
      }
    } catch (error) {
      console.error('Ошибка загрузки заведений (история):', error);
    }
  };

  const loadNotes = async (venueId: string | null) => {
    try {
      const userId = await getCurrentUserId();
      const notesKey = getVenueScopedKey('diagnosis_notes', userId, venueId);
      const savedNotes = await AsyncStorage.getItem(notesKey);
      if (savedNotes) {
        const parsed = JSON.parse(savedNotes);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((note) => {
            const body = String(note?.body || '').trim();
            if (!body) return false;
            return body !== LEGACY_NOTE_DEFAULT;
          });
          if (filtered.length !== parsed.length) {
            await AsyncStorage.setItem(notesKey, JSON.stringify(filtered));
          }
          setNotes(filtered);
          return;
        }
      }
      // В истории не создаем заметку по умолчанию — только если пользователь сам добавил
      setNotes([]);
    } catch (error) {
      console.error('Ошибка загрузки заметок:', error);
    }
  };

  const saveNotes = async (nextNotes: any[], venueId: string | null) => {
    try {
      const userId = await getCurrentUserId();
      const notesKey = getVenueScopedKey('diagnosis_notes', userId, venueId);
      await AsyncStorage.setItem(notesKey, JSON.stringify(nextNotes));
    } catch (error) {
      console.error('Ошибка сохранения заметок:', error);
    }
  };

  const deleteNote = async (id: string, venueId: string | null) => {
    const nextNotes = notes.filter((note) => note.id !== id);
    setNotes(nextNotes);
    await saveNotes(nextNotes, venueId);
  };

  useEffect(() => {
    if (isNoteEditing) {
      setShowDirectionsModal(false);
    }
  }, [isNoteEditing]);

  const formatRuDate = (date: Date) => date.toLocaleDateString('ru-RU');
  const parseFlexibleDate = (value?: string) => {
    if (!value) return null;
    if (value.includes('T')) {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = parseRuDate(value);
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  };
  const isSameDay = (a?: string, b?: string) => {
    const da = parseFlexibleDate(a);
    const db = parseFlexibleDate(b);
    if (!da || !db) return false;
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  };
  const formatNoteDate = (value: string) => {
    if (!value) {
      return '';
    }
    if (value.includes('T')) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
      }
    }
    return value;
  };
  const formatIsoDate = (value?: string) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    const formatted = d
      .toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      .replace(/\s?г\.?$/, '')
      .trim();
    const parts = formatted.split(' ');
    if (parts.length >= 3) {
      return `${parts[0]} ${parts[1]}, ${parts.slice(2).join(' ')}`.trim();
    }
    return formatted;
  };

  const parseRuDate = (value?: string) => {
    if (!value) return null;
    const parts = value.split(/[./]/).map((v) => parseInt(v, 10));
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
    const [day, month, year] = parts;
    return new Date(year, month - 1, day);
  };

  const normalizeDateFilter = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    const parsed = parseRuDate(trimmed);
    if (parsed && !Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('ru-RU');
    }
    return trimmed;
  };

  const handleDateFilterChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const parts = [];
    if (digits.length >= 2) {
      parts.push(digits.slice(0, 2));
    } else if (digits.length > 0) {
      parts.push(digits);
    }
    if (digits.length >= 4) {
      parts.push(digits.slice(2, 4));
    } else if (digits.length > 2) {
      parts.push(digits.slice(2));
    }
    if (digits.length > 4) {
      parts.push(digits.slice(4));
    }
    setDateFilterText(parts.join('.'));
  };

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear; y >= 2020; y -= 1) {
      years.push(y);
    }
    return years;
  }, []);

  const monthLabels = ['я', 'ф', 'м', 'а', 'м', 'и', 'и', 'а', 'с', 'о', 'н', 'д'];
  const CHART_HEIGHT = 200;

  const getHistoryColor = (efficiency: number) => {
    if (efficiency >= 78) return '#38C793';
    if (efficiency >= 38) return '#F2AE40';
    return '#DF1C41';
  };

  const getHistoryDeltaColor = (delta: number) => {
    if (delta > 0) return '#38C793';
    if (delta < 0) return '#DF1C41';
    return '#868C98';
  };

  const chartData = useMemo(() => {
    const result: Array<{ value: number; color: string; entryId?: string } | null> = Array(12).fill(null);
    const latestByMonth: Array<{ value: number; color: string; date: number; entryId: string } | null> = Array(12).fill(null);
    historyEntries.forEach((entry) => {
      const d = new Date(entry.createdAt || 0);
      if (Number.isNaN(d.getTime())) return;
      const year = d.getFullYear();
      if (year !== selectedYear) return;
      const month = d.getMonth();
      const value = entry.efficiency;
      if (typeof value !== 'number') return;
      const time = d.getTime();
      const current = latestByMonth[month];
      if (!current || time > current.date) {
        latestByMonth[month] = {
          value,
          color: getHistoryColor(value),
          date: time,
          entryId: entry.id,
        };
      }
    });
    latestByMonth.forEach((item, idx) => {
      if (item) {
        result[idx] = { value: item.value, color: item.color, entryId: item.entryId };
      }
    });
    return result;
  }, [historyEntries, selectedYear]);

  const historyCards = useMemo(() => cards.filter((card) => card.type !== 'summary'), [cards]);

  const loadHistoryCards = async (venueId: string | null) => {
    const loadToken = ++historyLoadTokenRef.current;
    try {
      const userId = await getCurrentUserId();
      const resolvedVenueId = venueId;
      if (!resolvedVenueId) {
        setHistoryEntries([]);
        setSummaryValue(null);
        setAllHistoryEntries([]);
        setCards([{ id: 'summary', type: 'summary' as const }]);
        return;
      }
      if (latestVenueIdRef.current && resolvedVenueId !== latestVenueIdRef.current) {
        return;
      }
      console.log('history_chart_venue', resolvedVenueId);
      const historyKey = getVenueScopedKey('diagnosis_history', userId, resolvedVenueId);
      const raw = await AsyncStorage.getItem(historyKey);
      let history = raw ? JSON.parse(raw) : [];
      const allKeys = await AsyncStorage.getAllKeys();
      const hasAnyAnswersForVenue = allKeys.some((k) => k.includes('diagnosis_answers_') && k.includes(resolvedVenueId));
      if (!hasAnyAnswersForVenue) {
        history = [];
        await AsyncStorage.setItem(historyKey, JSON.stringify([]));
      }


      if (!Array.isArray(history) || history.length === 0) {
        history = [];
      }

      const normalized = Array.isArray(history) ? history : [];

      const entries = normalized
        .filter((item) => typeof item?.efficiency === 'number')
        .map((item) => ({
          venueId: resolvedVenueId,
          ...item,
          dateLabel: formatIsoDate(item.createdAt),
          color: getHistoryColor(item.efficiency),
        }));

      const ordered = entries.slice().sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return db - da;
      });
      if (historyLoadTokenRef.current !== loadToken) {
        return;
      }
      if (latestVenueIdRef.current && resolvedVenueId !== latestVenueIdRef.current) {
        return;
      }
      setAllHistoryEntries(ordered);
      if (ordered.length > 0) {
        const latestYear = new Date(ordered[0].createdAt || new Date().toISOString()).getFullYear();
        setSelectedYear(latestYear);
      } else {
        setSelectedYear(new Date().getFullYear());
      }
      const normalizedFilter = normalizeDateFilter(dateFilterText);
      const filtered = normalizedFilter
        ? ordered.filter((entry) => {
            const label = entry.dateLabel || '';
            if (normalizedFilter.includes('.') || normalizedFilter.includes('/')) {
              return label === normalizedFilter;
            }
            return label.toLowerCase().includes(normalizedFilter.toLowerCase());
          })
        : ordered;
      const sorted = sortOrder === 'asc' ? filtered.slice().reverse() : filtered;

      if (historyLoadTokenRef.current !== loadToken) {
        return;
      }
      if (latestVenueIdRef.current && resolvedVenueId !== latestVenueIdRef.current) {
        return;
      }
      setHistoryEntries(sorted);

      if (sorted.length > 1) {
        const latest = sorted[0].efficiency;
        const previous = sorted[1].efficiency;
        const delta = latest - previous;
        if (delta === 0) {
          setSummaryValue(null);
        } else {
          setSummaryValue(delta);
        }
      } else {
        setSummaryValue(null);
      }

      const cardsList = sorted.map((entry) => ({
        id: entry.id || `hist_${entry.createdAt}`,
        value: `${entry.efficiency}%`,
        date: entry.dateLabel || '—',
        color: entry.color,
        entry,
      }));

      setCards([{ id: 'summary', type: 'summary' as const }, ...cardsList]);
    } catch (error) {
      console.error('Ошибка загрузки истории диагностики:', error);
      setCards([{ id: 'summary', type: 'summary' as const }]);
      setHistoryEntries([]);
      setAllHistoryEntries([]);
      setSummaryValue(null);
    }
  };

  const toggleVenue = async (venueId: string) => {
    setSelectedVenueId(venueId);
    latestVenueIdRef.current = venueId;
    setShowYearDropdown(false);
    setAllHistoryEntries([]);
    setHistoryEntries([]);
    setCards([{ id: 'summary', type: 'summary' as const }]);
    setSummaryValue(null);
    setSelectedYear(new Date().getFullYear());
    const venue = venues.find((item) => item.id === venueId);
    updateHeaderFromVenue(venue);
    try {
      const userId = await getCurrentUserId();
      await AsyncStorage.setItem('diagnosis_selected_venue_id', venueId);
      if (userId) {
        await AsyncStorage.setItem(`user_${userId}_diagnosis_selected_venue_id`, venueId);
      }
    } catch (error) {
      console.error('Ошибка сохранения выбранного проекта (история):', error);
    }
    // мгновенно перезагружаем данные под выбранный проект
    calculateBlockResults(venueId);
    loadHistoryCards(venueId);
    loadNotes(venueId);
  };

  useFocusEffect(
    useCallback(() => {
      loadVenues();
    }, [])
  );

  useEffect(() => {
    loadVenues();
  }, []);

  useEffect(() => {
    if (!selectedVenueId) return;
    latestVenueIdRef.current = selectedVenueId;
    setAllHistoryEntries([]);
    setHistoryEntries([]);
    setCards([{ id: 'summary', type: 'summary' as const }]);
    setSummaryValue(null);
    const venue = venues.find((item) => item.id === selectedVenueId);
    if (venue) {
      updateHeaderFromVenue(venue);
    }
    calculateBlockResults(selectedVenueId);
    loadHistoryCards(selectedVenueId);
    loadNotes(selectedVenueId);
  }, [selectedVenueId]);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 500 && !showScrollTop) {
      setShowScrollTop(true);
    } else if (offsetY <= 500 && showScrollTop) {
      setShowScrollTop(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {backIconSvg && (
          <TouchableOpacity
            style={styles.iconButtonLeft}
            onPress={() => navigation?.goBack?.()}
            activeOpacity={0.7}
          >
            <SvgXml xml={backIconSvg} width={25} height={25} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>История диагностик</Text>
        {menuIconSvg && (
          <TouchableOpacity
            style={styles.iconButtonRight}
            activeOpacity={0.7}
            onPress={() => setShowMenuModal(true)}
          >
            <SvgXml xml={menuIconSvg} width={20} height={20} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.cardsContainer}>
        <View>
          <TouchableOpacity
            style={[styles.historyCard, styles.firstHistoryCard]}
            activeOpacity={0.8}
            onPress={() => setShowVenueModal(true)}
          >
            <View style={styles.historyCardContent}>
              <View style={styles.avatarContainer}>
                {projectAvatarUri ? (
                  <Image source={{ uri: projectAvatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="business" size={32} color={palette.gray400} />
                  </View>
                )}
              </View>
              <View style={styles.projectInfo}>
                <Text style={styles.projectName}>{projectName || 'Проект'}</Text>
                <View style={styles.cityContainer}>
                  <Text style={styles.cityText}>{city || 'город'}</Text>
                  <View style={styles.cityIconContainer}>
                    {cityIconSvg ? (
                      <SvgXml xml={cityIconSvg} width={16} height={16} />
                    ) : (
                      <View style={styles.cityIconPlaceholder} />
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.historyStat}>
                <Text
                  style={[
                    styles.historyStatValue,
                    summaryValue === null || summaryValue === 0 ? styles.historyStatValueMuted : null,
                    summaryValue !== null && summaryValue !== 0 ? { color: getHistoryDeltaColor(summaryValue) } : null,
                  ]}
                >
                  {summaryValue === null ? '—' : `${summaryValue > 0 ? '+' : ''}${summaryValue}%`}
                </Text>
                <Text style={styles.historyStatLabel}>за все время</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.historyDivider} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.cardsScroll}
        contentContainerStyle={styles.cardsScrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.historyChartCard}>
          <View style={styles.historyChartHeader}>
            <Text style={styles.historyChartTitle}>Динамика изменений</Text>
            <TouchableOpacity
              style={styles.historyChartYear}
              onPress={() => setShowYearDropdown((prev) => !prev)}
            >
              <Text style={styles.historyChartYearText}>{selectedYear}</Text>
              <Text style={styles.historyChartYearArrow}>▾</Text>
            </TouchableOpacity>
          </View>
          {showYearDropdown && (
            <View style={styles.historyYearOverlay}>
              <TouchableWithoutFeedback onPress={() => setShowYearDropdown(false)}>
                <View style={styles.historyYearBackdrop} />
              </TouchableWithoutFeedback>
              <View style={styles.historyYearDropdown}>
                <ScrollView style={styles.historyYearScroll} showsVerticalScrollIndicator={false}>
                  {yearOptions.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={styles.historyYearItem}
                      onPress={() => {
                        setSelectedYear(year);
                        setShowYearDropdown(false);
                      }}
                    >
                      <Text style={styles.historyYearItemText}>{year}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
            <View style={styles.historyChartArea}>
              <View pointerEvents="none" style={styles.historyChartGrid}>
                {monthLabels.map((_, idx) => (
                  <View key={`grid_${idx}`} style={styles.historyChartGridColumn}>
                    <View style={styles.historyChartGridLine}>
                      {Array.from({ length: 24 }).map((__, dashIdx) => (
                        <View key={`grid_dash_${idx}_${dashIdx}`} style={styles.historyChartBarDash} />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.historyChartBars}>
                {chartData.map((item, idx) => {
                  const height = item ? Math.max(6, (item.value / 100) * CHART_HEIGHT) : 0;
                  const active = item?.entryId && item.entryId === highlightedEntryId;
                  return (
                    <TouchableOpacity
                      key={`bar_${idx}`}
                      style={styles.historyChartBarSlot}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (!item?.entryId) return;
                        setHighlightedEntryId((prev) => (prev === item.entryId ? null : item.entryId));
                        const target = historyCardRefs.current[item.entryId];
                        if (target && highlightedEntryId !== item.entryId) {
                          target.measureInWindow((x, y) => {
                            const offset = Math.max(0, y - 120);
                            scrollViewRef.current?.scrollTo({ y: offset, animated: true });
                          });
                        }
                      }}
                    >
                      {item ? (
                        <View
                          style={[
                            styles.historyChartBar,
                            active && styles.historyChartBarActive,
                            { height, backgroundColor: item.color },
                          ]}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            <View style={styles.historyChartAxis}>
              {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map((label) => (
                <Text key={`y_${label}`} style={styles.historyChartAxisLabel}>
                  {label}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.historyChartMonths}>
            {monthLabels.map((label, idx) => (
              <Text key={`m_${idx}`} style={styles.historyChartMonthLabel}>
                {label}
              </Text>
            ))}
          </View>
        </View>

        {historyEntries.length === 0 && (
          <View style={styles.emptyHistoryContainer}>
            <AnimatedPressable
              style={styles.startDiagnosisButton}
              onPress={() => {
                const parentNav = navigation?.getParent?.();
                if (parentNav) {
                  parentNav.navigate('Диагностика');
                } else {
                  navigation?.navigate?.('SelfDiagnosisBlocks');
                }
              }}
            >
              <Text style={styles.startDiagnosisButtonText}>Начать диагностику</Text>
            </AnimatedPressable>
          </View>
        )}

        {historyCards.map((card, index) => (
          <View key={card.id}>
            <Swipeable
              renderRightActions={renderRightActions}
              onSwipeableWillOpen={() => deleteCard(card.id)}
              rightThreshold={30}
              friction={1}
              overshootRight={false}
            >
              <TouchableOpacity
                style={[
                  styles.historyCard,
                  highlightedEntryId === card.entry?.id && styles.historyCardHighlighted,
                ]}
                ref={(ref) => {
                  historyCardRefs.current[card.entry?.id || card.id] = ref;
                }}
                activeOpacity={0.85}
                onPress={() => {
                  if (card.entry) {
                    const current = card.entry;
                    const idx = historyEntries.findIndex((item) => item.id === current.id);
                    setSelectedHistoryEntry(current);
                    setPreviousHistoryEntry(idx >= 0 ? historyEntries[idx + 1] || null : null);
                  }
                  setModalHeaderInfo({
                    value: card.value,
                    date: card.date,
                    color: card.color,
                  });
                  setShowDirectionsModal(true);
                }}
              >
                <View style={styles.historyCardContent}>
                <View style={styles.historyStatLeft}>
                  <Text style={[styles.historyStatValue, { color: card.color }]}>{card.value}</Text>
                  <Text style={[styles.historyStatLabel, styles.historyStatLabelOffset]}>{card.date}</Text>
                </View>
                {arrowDownSvg && (
                  <TouchableOpacity
                    style={styles.historyArrow}
                    onPress={() => {
                      if (card.entry) {
                        const current = card.entry;
                        const idx = historyEntries.findIndex((item) => item.id === current.id);
                        setSelectedHistoryEntry(current);
                        setPreviousHistoryEntry(idx >= 0 ? historyEntries[idx + 1] || null : null);
                        }
                        setModalHeaderInfo({
                          value: card.value,
                          date: card.date,
                          color: card.color,
                        });
                        setShowDirectionsModal(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <SvgXml xml={arrowDownSvg} width={25} height={25} />
                    </TouchableOpacity>
                  )}
                </View>
                {(() => {
                  if (!card.entry?.id) return null;
                  const relatedNotes = notes
                    .filter((note) => {
                      if (note.historyEntryId === card.entry.id) return true;
                      if (!note.historyEntryId && isSameDay(note.createdAt, card.entry.createdAt)) return true;
                      return false;
                    })
                    .slice()
                    .sort((a, b) => {
                      const da = new Date(a.createdAt || 0).getTime();
                      const db = new Date(b.createdAt || 0).getTime();
                      return db - da;
                    });
                  const lastNote = relatedNotes[0];
                  if (!lastNote?.body) return null;
                  return (
                    <View style={styles.historyNotePreview}>
                      <Text style={styles.historyNotePreviewText}>{lastNote.body}</Text>
                    </View>
                  );
                })()}
              </TouchableOpacity>
            </Swipeable>
          </View>
        ))}
      </ScrollView>

      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollTopButton}
          activeOpacity={0.8}
          onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}
        >
          <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      <Modal
        visible={showVenueModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVenueModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowVenueModal(false)}
          />
          <View style={styles.addModalContent}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Выберите ресторан</Text>
              {directionsCloseIconSvg && (
                <TouchableOpacity
                  style={styles.addModalCloseButton}
                  onPress={() => setShowVenueModal(false)}
                >
                  <SvgXml xml={directionsCloseIconSvg} width={22} height={22} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.venuesCard}>
              {venues.map((venue, index) => {
                const isSelected = venue.id === selectedVenueId;
                return (
                  <TouchableOpacity
                    key={venue.id}
                    style={[styles.venueRow, index === venues.length - 1 && styles.venueRowLast]}
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
                      style={styles.venueCheckPlaceholder}
                      activeOpacity={0.8}
                      onPress={() => toggleVenue(venue.id)}
                    >
                      {isSelected && radioActiveSvg ? (
                        <SvgXml xml={radioActiveSvg} width={20} height={20} />
                      ) : radioInactiveSvg ? (
                        <SvgXml xml={radioInactiveSvg} width={20} height={20} />
                      ) : (
                        <View style={{ width: 20, height: 20 }} />
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showDirectionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDirectionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowDirectionsModal(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text
                  style={[
                    styles.modalHeaderValue,
                    modalHeaderInfo ? { color: modalHeaderInfo.color } : null,
                  ]}
                  numberOfLines={1}
                >
                  {modalHeaderInfo?.value || '—'}
                </Text>
                <Text style={styles.modalHeaderDate} numberOfLines={1}>
                  {modalHeaderInfo?.date || ''}
                </Text>
              </View>
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
                  const deltaValue = getBlockDelta(block.id, block.efficiency);
                  const deltaColor =
                    deltaValue === null
                      ? '#525866'
                      : deltaValue < 0
                        ? '#DF1C41'
                        : deltaValue > 0
                          ? '#176448'
                          : '#525866';
                  const deltaArrow = deltaValue !== null && deltaValue < 0 ? '▾' : '▴';
                  const deltaDisplay = deltaValue !== null ? Math.abs(deltaValue) : 0;
                  const isLast = index === sortedBlockResults.length - 1;
                  return (
                    <View key={`${block.id}_${index}`} style={styles.directionsBlockItem}>
                      {blockIconSvg && (
                        <SvgXml xml={blockIconSvg} width={23} height={23} />
                      )}
                      <Text style={styles.directionsBlockTitle} numberOfLines={1}>
                        {block.title.replace(/\n/g, ' ')}
                      </Text>
                      {deltaValue !== null && (
                        <View style={styles.changeIndicator}>
                          {deltaDisplay !== 0 && (
                            <Text style={[styles.changeText, { color: deltaColor, marginRight: 2 }]}>
                              {deltaArrow}
                            </Text>
                          )}
                          <Text style={[styles.changeText, { color: deltaColor }]}>
                            {deltaDisplay}%
                          </Text>
                        </View>
                      )}
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
                <View style={styles.noteSection}>
                  <View pointerEvents="none" style={styles.notesDividerOverlay} />
                  <ScrollView
                    style={styles.noteSectionScroll}
                    contentContainerStyle={[
                      styles.noteSectionContent,
                      notes.length === 0 && styles.noteSectionContentEmpty,
                    ]}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                  >
                    {notes.length > 0 && (
                      <ScrollView
                        style={[
                          styles.notesListScroll,
                          notes.length > 3 && noteItemHeight
                            ? { maxHeight: noteItemHeight * 3 + spacing.sm * 2 }
                            : undefined,
                        ]}
                        contentContainerStyle={styles.notesList}
                        showsVerticalScrollIndicator={notes.length > 3}
                        scrollEnabled={notes.length > 3}
                        nestedScrollEnabled
                        horizontal={false}
                        directionalLockEnabled
                        showsHorizontalScrollIndicator={false}
                        alwaysBounceHorizontal={false}
                        bounces={false}
                      >
                        {notes.map((note) => (
                          <Swipeable
                            key={note.id}
                            renderRightActions={() => (
                              <View style={styles.noteDeleteAction}>
                                {noteDeleteIconSvg ? <SvgXml xml={noteDeleteIconSvg} width={23} height={23} /> : null}
                              </View>
                            )}
                            onSwipeableWillOpen={() => deleteNote(note.id, selectedVenueId)}
                            rightThreshold={30}
                            friction={1}
                            overshootRight={false}
                          >
                            <TouchableOpacity
                              activeOpacity={0.9}
                              onPress={() => {
                                setEditingNoteId(note.id);
                                setNoteTitleDraft(note.title);
                                setNoteDraft(note.body);
                                setIsTitleEditing(false);
                                setIsNoteEditing(true);
                                setNoteEditorSource('directions');
                                setShowDirectionsModal(false);
                              }}
                            >
                              <View
                                style={styles.noteItem}
                                onLayout={(event) => {
                                  if (!noteItemHeight) {
                                    setNoteItemHeight(event.nativeEvent.layout.height);
                                  }
                                }}
                              >
                                <View style={styles.noteItemHeader}>
                                  <Text style={styles.noteItemTitle}>{note.title}</Text>
                                  <Text style={styles.noteItemDate}>{formatNoteDate(note.createdAt)}</Text>
                                </View>
                                <Text style={styles.noteItemBody}>{note.body}</Text>
                              </View>
                            </TouchableOpacity>
                          </Swipeable>
                        ))}
                      </ScrollView>
                    )}
                    {notes.length > 0 && <View style={styles.notesListDivider} />}
                    <View style={[styles.noteHeader, { transform: [{ translateY: -3 }] }]}>
                      <Text style={styles.noteTitle}>Моя заметка</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setIsNoteEditing(true);
                          setNoteEditorSource('directions');
                          setNoteTitleDraft('');
                          setNoteDraft('');
                          setIsTitleEditing(false);
                          setEditingNoteId(null);
                          setShowDirectionsModal(false);
                        }}
                      >
                        <Text style={styles.noteEditButton}>Редактировать</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[styles.noteInputContainer, styles.noteInputContainerDirections]}
                      activeOpacity={0.9}
                      onPress={() => {
                        setIsNoteEditing(true);
                        setNoteEditorSource('directions');
                        setNoteTitleDraft('');
                        setNoteDraft('');
                        setIsTitleEditing(false);
                        setEditingNoteId(null);
                        setShowDirectionsModal(false);
                      }}
                    >
                      <Text style={styles.noteInputPlaceholder}>{NOTE_PLACEHOLDER}</Text>
                    </TouchableOpacity>
                    <Text style={styles.noteHintText}>Текст заметки виден только вам</Text>
                  </ScrollView>
                </View>
              </ScrollView>
            </View>
            <View style={styles.swipeIndicator} />
          </View>
        </View>
      </Modal>
      <Modal
        visible={showMenuModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowMenuModal(false)}
          />
          <View style={styles.menuCard}>
            <AnimatedPressable
              style={styles.menuItem}
              onPress={() => {
                setShowMenuModal(false);
                setShowDateFilterModal(true);
              }}
            >
              <Text style={styles.menuItemText}>Дата диагностики</Text>
            </AnimatedPressable>
            <View style={styles.menuDivider} />
            <AnimatedPressable
              style={styles.menuItem}
              onPress={() => {
                setShowMenuModal(false);
                setShowVenueModal(true);
              }}
            >
              <Text style={styles.menuItemText}>Выбрать проект</Text>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showDateFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateFilterModal(false)}
      >
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowDateFilterModal(false)}
          />
          <View style={styles.dateFilterCard}>
            <View style={styles.dateFilterHeader}>
              <Text style={styles.dateFilterTitle}>Дата диагностики</Text>
              <TouchableOpacity
                style={styles.dateFilterClose}
                onPress={() => setShowDateFilterModal(false)}
              >
                {closeIconSvg ? <SvgXml xml={closeIconSvg} width={22} height={22} /> : null}
              </TouchableOpacity>
            </View>
            <View style={styles.dateFilterRow}>
              <Text style={styles.dateFilterLabel}>Сортировка</Text>
              <AnimatedPressable
                style={styles.dateFilterToggle}
                onPress={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              >
                <Text style={styles.dateFilterToggleText}>
                  {sortOrder === 'desc' ? 'От новой к старой' : 'От старой к новой'}
                </Text>
              </AnimatedPressable>
            </View>
            <View style={styles.dateFilterRow}>
              <Text style={styles.dateFilterLabel}>Поиск по дате</Text>
              <TextInput
                style={styles.dateFilterInput}
                value={dateFilterText}
                onChangeText={handleDateFilterChange}
                placeholder="дд.мм.гггг"
                placeholderTextColor="#868C98"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            <View style={styles.dateFilterActions}>
              <AnimatedPressable
                style={styles.dateFilterClear}
                onPress={() => setDateFilterText('')}
              >
                <Text style={styles.dateFilterClearText}>Сбросить</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.dateFilterApply}
                onPress={() => setShowDateFilterModal(false)}
              >
                <Text style={styles.dateFilterApplyText}>Применить</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={isNoteEditing}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNoteEditing(false)}
      >
        <View style={styles.noteEditOverlay}>
          <TouchableWithoutFeedback
            onPress={() => {
              setIsNoteEditing(false);
              setIsTitleEditing(false);
              setEditingNoteId(null);
              if (noteEditorSource === 'directions') {
                setShowDirectionsModal(true);
              }
            }}
          >
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.noteEditAvoider}
          >
            <View style={styles.noteEditCard}>
              <View style={[styles.noteHeaderEditing, { marginTop: 3, transform: [{ translateY: -10 }] }]}>
                {isTitleEditing ? (
                  <TextInput
                    style={[styles.noteTitleInput, styles.noteTitleEditing]}
                    value={noteTitleDraft}
                    onChangeText={setNoteTitleDraft}
                    onBlur={() => setIsTitleEditing(false)}
                    autoFocus
                  />
                ) : (
                  <TouchableOpacity onPress={() => setIsTitleEditing(true)}>
                    <Text style={[styles.noteTitle, styles.noteTitleEditing]}>
                      {noteTitleDraft || 'Моя заметка'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={async () => {
                    setIsNoteEditing(false);
                    setIsTitleEditing(false);
                    setEditingNoteId(null);
                    Keyboard.dismiss();
                    if (noteEditorSource === 'directions') {
                      setShowDirectionsModal(true);
                    }
                  }}
                >
                  {closeIconSvg ? <SvgXml xml={closeIconSvg} width={22} height={22} /> : null}
                </TouchableOpacity>
              </View>
              <View
                style={[styles.noteInputContainer, styles.noteInputContainerEditing]}
                pointerEvents="box-none"
              >
                <TextInput
                  ref={noteInputRef}
                  style={styles.noteInputText}
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                  placeholder={NOTE_PLACEHOLDER}
                  placeholderTextColor="#868C98"
                  multiline
                />
                {noteClearIconSvg && (
                  <TouchableOpacity
                    style={styles.noteClearButton}
                    onPress={() => setNoteDraft('')}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <SvgXml xml={noteClearIconSvg} width={20} height={20} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.noteConfirmButton}
                  onPress={() => setShowNoteConfirm(true)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  {noteConfirmIconSvg ? (
                    <SvgXml xml={noteConfirmIconSvg} width={20} height={20} />
                  ) : (
                    <Ionicons name="checkmark-circle" size={20} color="#191BDF" />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.noteHintText}>Текст заметки виден только вам</Text>
            </View>
          </KeyboardAvoidingView>
          {showNoteConfirm && (
            <View style={styles.confirmOverlay}>
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>Сохранить изменения?</Text>
                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => setShowNoteConfirm(false)}
                  >
                    <Text style={styles.confirmButtonText}>Отмена</Text>
                  </TouchableOpacity>
                  <View style={styles.confirmDivider} />
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={async () => {
                      const title = noteTitleDraft.trim() || 'Моя заметка';
                      const body = noteDraft.trim();
                      if (!body) {
                        setShowNoteConfirm(false);
                        return;
                      }
                      const historyEntryId =
                        noteEditorSource === 'directions' && selectedHistoryEntry?.id
                          ? selectedHistoryEntry.id
                          : undefined;
                      const nextNotes = editingNoteId
                        ? notes.map((note) =>
                            note.id === editingNoteId
                              ? { ...note, title, body, historyEntryId: note.historyEntryId }
                              : note
                          )
                        : [
                            {
                              id: `note_${Date.now()}`,
                              title,
                              body,
                              createdAt: new Date().toISOString(),
                              ...(historyEntryId ? { historyEntryId } : {}),
                            },
                            ...notes,
                          ];
                      setNotes(nextNotes);
                      await saveNotes(nextNotes, selectedVenueId);
                      setNoteDraft('');
                      setNoteTitleDraft('');
                      setEditingNoteId(null);
                      setShowNoteConfirm(false);
                      setIsNoteEditing(false);
                      Keyboard.dismiss();
                      if (noteEditorSource === 'directions' || noteEditorSource === 'main') {
                        setShowDirectionsModal(true);
                      }
                    }}
                  >
                    <Text style={styles.confirmButtonText}>Сохранить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth - spacing.md * 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: spacing.md,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  header: {
    marginTop: 60,
    minHeight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
    
  },
  cardsScroll: {
    flex: 1,
  },
  cardsScrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
    alignItems: 'center',
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
  historyCard: {
    width: cardWidth,
    minHeight: 80,
    backgroundColor: palette.white,
    borderRadius: 20,
    marginBottom: 17,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 12,
    alignItems: 'stretch',
  },
  historyChartCard: {
    width: cardWidth,
    backgroundColor: palette.white,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginTop: 20,
    marginBottom: 17,
  },
  historyChartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyChartTitle: {
    fontSize: 19,
    fontWeight: '300',
    color: '#0A0D14',
  },
  historyChartYear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyChartYearText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#0A0D14',
  },
  historyChartYearArrow: {
    fontSize: 16,
    color: '#0A0D14',
  },
  historyYearDropdown: {
    position: 'absolute',
    top: 42,
    right: 12,
    width: 90,
    maxHeight: 200,
    backgroundColor: palette.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    zIndex: 10,
    paddingVertical: 6,
  },
  historyYearOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9,
  },
  historyYearBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  historyYearScroll: {
    maxHeight: 188,
  },
  historyYearItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  historyYearItemText: {
    fontSize: 15,
    fontWeight: '300',
    color: '#0A0D14',
  },
  historyChartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 200,
  },
  historyChartGrid: {
    position: 'absolute',
    top: 0,
    left: -1,
    right: 28,
    height: 200,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyChartGridColumn: {
    flex: 1,
    alignItems: 'center',
  },
  historyChartGridLine: {
    width: 1,
    height: 200,
    paddingTop: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyChartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
    paddingRight: 28,
    paddingLeft: 0,
    
  },
  historyChartBarSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  historyChartBarTrack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#E2E4E9',
    opacity: 0.6,
  },
  historyChartBarDash: {
    width: 1,
    height: 3,
    backgroundColor: '#D1D7E0',
    opacity: 0.95,
    borderRadius: 1,
  },
  historyChartBar: {
    width: 6,
    borderRadius: 3,
    zIndex: 1,
    transform: [{ translateX: 0 }],
  },
  historyChartBarActive: {
    width: 8,
  },
  historyChartAxis: {
    width: 28,
    position: 'absolute',
    right: 0,
    top: 0,
    height: 200,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  historyChartAxisLabel: {
    fontSize: 12,
    fontWeight: '300',
    color: '#525866',
  },
  historyChartMonths: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 28,
    paddingLeft: 0,
  },
  historyChartMonthLabel: {
    fontSize: 12,
    fontWeight: '300',
    color: '#525866',
    textTransform: 'uppercase',
    width: '8.33%',
    textAlign: 'center',
    flexShrink: 0,
  },
  historyCardHighlighted: {
    borderWidth: 2,
    borderColor: '#C2D6FF',
  },
  firstHistoryCard: {
    marginBottom: 0,
  },
  historyDivider: {
    width: cardWidth - 4,
    height: 1,
    backgroundColor: '#E2E4E9',
    marginTop: 18,
    marginBottom: 0,
    alignSelf: 'center',
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    minHeight: 56,
  },
  historyNotePreview: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    alignSelf: 'stretch',
    width: '100%',
  },
  historyNotePreviewText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#525866',
    lineHeight: 21,
    width: '100%',
  },
  avatarContainer: {
    marginRight: 2,
    position: 'relative',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    transform: [{ translateX: 10 }],
  },
  projectInfo: {
    flex: 1,
    alignSelf: 'center',
    marginLeft: 10,
  },
  projectName: {
    fontSize: 20,
    fontWeight: '400',
    color: '#0A0D14',
    marginBottom: 2,
    marginTop: 0,
    marginLeft: -1,
    lineHeight: 22,
    minHeight: 22,
    minWidth: 60,
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 18,
    marginTop: 1,
  },
  cityText: {
    fontSize: 14,
    color: palette.gray600,
    marginRight: 2,
    minHeight: 16,
    minWidth: 40,
  },
  cityIconContainer: {
    marginLeft: 2,
    transform: [{ translateY: 1 }],
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityIconPlaceholder: {
    width: 16,
    height: 16,
  },
  historyStat: {
    alignItems: 'flex-end',
    marginRight: 6,
  },
  historyStatLeft: {
    alignItems: 'flex-start',
    marginLeft: 8,
  },
  historyArrow: {
    marginLeft: 'auto',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAction: {
    width: 80,
    height: 80,
    backgroundColor: 'transparent',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    marginTop: 150,
    flex: 1,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    
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
  modalHeaderContent: {
    flex: 1,
  },
  modalHeaderValue: {
    fontSize: 22,
    fontWeight: '400',
    color: '#0A0D14',
  },
  modalHeaderDate: {
    fontSize: 16,
    fontWeight: '300',
    color: '#525866',
    marginTop: 2,
  },
  modalCloseButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
    marginRight: 0,
    marginTop: -5,
    transform: [{ translateX: 18 }],
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E4E9',
    alignSelf: 'stretch',
    marginHorizontal: 18,
    marginBottom: spacing.md,
    zIndex: 1,
    position: 'relative',
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
  directionsBlockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingVertical: 6,
    paddingLeft: -6,
    paddingRight: 0,
  },
  blockDeltaText: {
    minWidth: 44,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
    minWidth: 44,
    justifyContent: 'flex-end',
  },
  changeText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: spacing.xs,
    color: '#DF1C41',
  },
  directionsBlockTitle: {
    fontSize: 15,
    fontWeight: '300',
    color: '#0A0D14',
    flex: 1,
    marginLeft: spacing.sm,
  },
  metricBadge: {
    minWidth: 50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#710E21',
  },
  noteSection: {
    marginTop: 8,
    position: 'relative',
    zIndex: 1,
  },
  noteSectionScroll: {
    flex: 1,
  },
  noteSectionContent: {
    paddingTop: 6,
    paddingBottom: 4,
  },
  noteSectionContentEmpty: {
    paddingTop: 15,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
    marginTop: -3,
    paddingHorizontal: 0,
  },
  noteHeaderEditing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
    marginTop: 3,
    paddingHorizontal: 0,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0A0D14',
  },
  noteTitleEditing: {
    fontSize: 21,
    fontWeight: '300',
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
    minHeight: 100,
    marginHorizontal: 0,
    position: 'relative',
    paddingBottom: 36,
  },
  noteInputContainerDirections: {
    minHeight: 72,
  },
  noteInputContainerEditing: {
    backgroundColor: '#FFFFFF',
  },
  noteEditOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 13, 20, 0.45)',
    justifyContent: 'flex-end',
  },
  noteEditAvoider: {
    width: '100%',
  },
  noteEditCard: {
    backgroundColor: '#F6F8FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.lg + 10,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    width: '100%',
    marginHorizontal: 0,
    marginBottom: 0,
  },
  noteInputText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#525866',
    lineHeight: 20,
  },
  noteInputPlaceholder: {
    fontSize: 16,
    fontWeight: '300',
    color: '#868C98',
    lineHeight: 20,
  },
  noteTitleInputContainer: {
    marginTop: 0,
    marginBottom: 0,
  },
  noteTitleInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0A0D14',
  },
  noteClearButton: {
    position: 'absolute',
    left: spacing.sm - 8,
    bottom: spacing.sm - 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2,
    transform: [{ translateX: 2 }, { translateY: 5 }],
  },
  noteConfirmButton: {
    position: 'absolute',
    right: 6,
    bottom: 15,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    elevation: 3,
    transform: [{ translateX: 1 }, { translateY: 10 }],
  },
  notesList: {
    marginTop: 15,
    gap: spacing.sm,
    marginHorizontal: -3,
    marginLeft: 0,
    marginRight: 3,
    marginBottom: spacing.sm + 5 - 15,
  },
  notesListScroll: {
    marginHorizontal: -3,
    marginLeft: 0,
    marginRight: 3,
  },
  notesListDivider: {
    height: 1,
    backgroundColor: '#E2E4E9',
    marginVertical: 10,
    marginBottom: 30,
  },
  notesDividerOverlay: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: '#E2E4E9',
    zIndex: 2,
  },
  noteItem: {
    backgroundColor: '#F6F8FA',
    borderRadius: 10,
    padding: spacing.sm,
  },
  noteItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0A0D14',
  },
  noteItemDate: {
    fontSize: 12,
    fontWeight: '300',
    color: '#868C98',
  },
  noteItemBody: {
    fontSize: 14,
    fontWeight: '300',
    color: '#525866',
    lineHeight: 20,
  },
  noteDeleteAction: {
    width: 80,
    height: 80,
    backgroundColor: 'transparent',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  historyStatValue: {
    fontSize: 22,
    fontWeight: '400',
    color: '#38C793',
    lineHeight: 22,
    marginBottom: 2,
  },
  historyStatValueMuted: {
    color: '#667085',
  },
  historyStatLabel: {
    fontSize: 16,
    fontWeight: '300',
    color: '#525866',
    marginTop: 0,
  },
  historyStatLabelOffset: {
    marginTop: 2,
  },
  emptyHistoryContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  startDiagnosisButton: {
    backgroundColor: '#191BDF',
    height: 61,
    paddingHorizontal: spacing.lg,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startDiagnosisButtonText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'Manrope',
      android: 'Manrope',
      web: "'Manrope', sans-serif",
      default: 'Manrope',
    }),
    color: '#EBF1FF',
    textAlign: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 120,
    paddingRight: spacing.lg,
  },
  menuCard: {
    backgroundColor: palette.white,
    borderRadius: 14,
    paddingVertical: spacing.sm,
    width: 210,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  menuItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0A0D14',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E2E4E9',
    marginHorizontal: spacing.md,
  },
  dateFilterCard: {
    backgroundColor: palette.white,
    borderRadius: 20,
    width: '90%',
    marginTop: 90,
    padding: spacing.lg,
  },
  dateFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dateFilterTitle: {
    fontSize: 21,
    fontWeight: '500',
    color: '#0A0D14',
  },
  dateFilterClose: {
    padding: spacing.xs,
  },
  dateFilterRow: {
    marginBottom: spacing.md,
  },
  dateFilterLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#0A0D14',
    marginBottom: spacing.xs,
  },
  dateFilterToggle: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: '#F6F8FA',
  },
  dateFilterToggleText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#0A0D14',
  },
  dateFilterInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    paddingHorizontal: spacing.md,
    color: '#0A0D14',
    fontSize: 15,
    backgroundColor: '#FFFFFF',
  },
  dateFilterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  dateFilterClear: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dateFilterClearText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#0A0D14',
  },
  dateFilterApply: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: '#191BDF',
  },
  dateFilterApplyText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  addModalContent: {
    width: cardWidth,
    backgroundColor: palette.white,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginTop: 120,
  },
  addModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A0D14',
  },
  addModalCloseButton: {
    padding: 6,
  },
  venuesCard: {
    backgroundColor: palette.white,
    borderRadius: 16,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E4E9',
  },
  venueRowLast: {
    borderBottomWidth: 0,
  },
  venueAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: palette.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  venueLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  venueIconScaled: {
    transform: [{ scale: 0.9 }],
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0A0D14',
    marginBottom: 4,
  },
  venueCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueCity: {
    fontSize: 14,
    color: '#667085',
    marginRight: 6,
  },
  venueCityIconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueCheckPlaceholder: {
    width: 24,
  },
  iconButtonLeft: {
    position: 'absolute',
    left: -1,
    height: 20,
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonRight: {
    position: 'absolute',
    right: 0,
    height: 20,
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#000000',
    fontSize: 23,
    fontWeight: '400',
    textAlign: 'center',
  },
  blockDeltaContainer: {
    minWidth: 40,
    alignItems: 'flex-end',
    marginRight: 8,
  },
  blockDeltaText: {
    fontSize: 13,
    fontWeight: '400',
  },
  deltaPositive: {
    color: '#1B7F5A',
  },
  deltaNegative: {
    color: '#B42318',
  },
  deltaNeutral: {
    color: '#667085',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 13, 20, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: -1,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  confirmCard: {
    width: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmTitle: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0D14',
  },
  confirmActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E4E9',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDivider: {
    width: 1,
    backgroundColor: '#E2E4E9',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0A0D14',
  },
});
