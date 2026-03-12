import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { SvgXml } from 'react-native-svg';
import { useIsFocused } from '@react-navigation/native';

import AnimatedPressable from '../components/AnimatedPressable';
import { palette, spacing } from '../styles/theme';
import { getCurrentUserId, loadUserQuestionnaire, saveUserQuestionnaire } from '../utils/userDataStorage';
import { updateUser } from '../utils/usersStorage';

const YANDEX_GEOCODER_API_KEY = 'd54ee7de-414b-4803-acae-6c3f72d850bd';
const YANDEX_SUGGEST_API_KEY = '1d508342-375a-432f-b5ed-d94ff51a8111';
const YANDEX_SEARCH_API_KEY = 'e18abfd7-3df3-428a-8de2-26daca78c426';

interface EditProjectScreenProps {
  venueId?: string;
  onBack?: () => void;
  onSaved?: () => void;
  onDeleted?: () => void;
  onOpenMap?: (index: number) => void;
  mapSelection?: { address: string; token: number } | null;
  mapTargetIndex?: number | null;
  onMapAddressApplied?: () => void;
}

interface RestaurantDraft {
  id: string;
  name: string;
  address: string;
  logoUri: string | null;
}

interface AddressSuggestion {
  id: string;
  text: string;
  subtitle: string;
  value: string;
}

const createRestaurantDraft = (): RestaurantDraft => ({
  id: `rest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  address: '',
  logoUri: null,
});

const normalizeRestaurants = (raw: any): RestaurantDraft[] => {
  if (Array.isArray(raw?.restaurants) && raw.restaurants.length > 0) {
    return raw.restaurants.map((item: any, index: number) => ({
      id: item?.id || `rest_${Date.now()}_${index}`,
      name: item?.name || '',
      address: item?.address || '',
      logoUri: item?.logoUri || item?.projectLogoUri || null,
    }));
  }

  if (raw?.restaurantName || raw?.address || raw?.logoUri) {
    return [
      {
        id: `rest_${Date.now()}_legacy`,
        name: raw.restaurantName || '',
        address: raw.address || '',
        logoUri: raw.logoUri || null,
      },
    ];
  }

  return [];
};

const mergeRestaurants = (...lists: RestaurantDraft[][]): RestaurantDraft[] => {
  const mergedMap = new Map<string, RestaurantDraft>();
  const order: string[] = [];

  lists.forEach((list) => {
    list.forEach((item) => {
      if (!item?.id) return;

      if (!mergedMap.has(item.id)) {
        order.push(item.id);
        mergedMap.set(item.id, { ...item });
        return;
      }

      const prev = mergedMap.get(item.id)!;
      mergedMap.set(item.id, {
        ...prev,
        ...item,
        name: item.name || prev.name,
        address: item.address || prev.address,
        logoUri: item.logoUri ?? prev.logoUri,
      });
    });
  });

  return order.map((id) => mergedMap.get(id)!);
};

const removeVenueFromPerVenueStorage = async (userId: string | null, venueId: string) => {
  const perVenueKeys = ['diagnosis_block_results_by_venue'];
  if (userId) {
    perVenueKeys.push(`user_${userId}_diagnosis_block_results_by_venue`);
  }

  for (const key of perVenueKeys) {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed[venueId]) {
        delete parsed[venueId];
        await AsyncStorage.setItem(key, JSON.stringify(parsed));
      }
    } catch (error) {
      console.error(`Ошибка очистки per-venue ключа (${key}):`, error);
    }
  }
};

export default function EditProjectScreen({
  venueId,
  onBack,
  onSaved,
  onDeleted,
  onOpenMap,
  mapSelection,
  mapTargetIndex,
  onMapAddressApplied,
}: EditProjectScreenProps) {
  const [restaurant, setRestaurant] = useState<RestaurantDraft>(createRestaurantDraft());
  const [isLoaded, setIsLoaded] = useState(false);
  const [backIconSvg, setBackIconSvg] = useState('');
  const [nameIconSvg, setNameIconSvg] = useState('');
  const [addressIconSvg, setAddressIconSvg] = useState('');
  const [logoPlaceholderSvg, setLogoPlaceholderSvg] = useState('');

  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [isAddressFocused, setIsAddressFocused] = useState(false);
  const [addressError, setAddressError] = useState('');

  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAppliedMapTokenRef = useRef<number | null>(null);
  const preserveMapAddressRef = useRef(false);
  const onBackRef = useRef(onBack);
  const isFocused = useIsFocused();

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    const loadIcons = async () => {
      try {
        const backIconAsset = Asset.fromModule(require('../../assets/images/Frame 8 (3).svg'));
        await backIconAsset.downloadAsync();
        if (backIconAsset.localUri) {
          const response = await fetch(backIconAsset.localUri);
          setBackIconSvg(await response.text());
        }

        const venueNameAsset = Asset.fromModule(require('../../assets/images/venue-name-icon.svg'));
        await venueNameAsset.downloadAsync();
        if (venueNameAsset.localUri) {
          const response = await fetch(venueNameAsset.localUri);
          setNameIconSvg(await response.text());
        }

        const venueAddressAsset = Asset.fromModule(require('../../assets/images/venue-address-icon.svg'));
        await venueAddressAsset.downloadAsync();
        if (venueAddressAsset.localUri) {
          const response = await fetch(venueAddressAsset.localUri);
          setAddressIconSvg(await response.text());
        }

        const logoAsset = Asset.fromModule(require('../../assets/images/restaurant-avatar-placeholder.svg'));
        await logoAsset.downloadAsync();
        if (logoAsset.localUri) {
          const response = await fetch(logoAsset.localUri);
          setLogoPlaceholderSvg(await response.text());
        }
      } catch (error) {
        console.error('Ошибка загрузки иконок EditProjectScreen:', error);
      }
    };

    loadIcons();

    return () => {
      if (suggestTimerRef.current) {
        clearTimeout(suggestTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const userId = await getCurrentUserId();
        const registrationRaw = await AsyncStorage.getItem('registrationStep2');
        const registration = registrationRaw ? JSON.parse(registrationRaw) : {};
        const registrationRestaurants = normalizeRestaurants(registration);

        const questionnaire = userId ? await loadUserQuestionnaire(userId) : null;
        const questionnaireRestaurants = normalizeRestaurants(questionnaire);

        const mergedRestaurants = mergeRestaurants(registrationRestaurants, questionnaireRestaurants);

        const targetId = venueId || mergedRestaurants[0]?.id || null;
        const foundRestaurant = mergedRestaurants.find((item) => item.id === targetId);

        if (foundRestaurant) {
          setRestaurant((prev) => {
            if (preserveMapAddressRef.current && prev.address.trim()) {
              return {
                ...foundRestaurant,
                address: prev.address,
              };
            }
            return foundRestaurant;
          });
        } else {
          Alert.alert('Проект не найден', 'Не удалось открыть выбранное заведение.');
          onBackRef.current?.();
        }
      } catch (error) {
        console.error('Ошибка загрузки проекта для редактирования:', error);
        Alert.alert('Ошибка', 'Не удалось загрузить данные проекта.');
        onBackRef.current?.();
      } finally {
        setIsLoaded(true);
      }
    };

    loadProject();
  }, [venueId]);

  useEffect(() => {
    if (!isFocused || !mapSelection) {
      return;
    }
    if (lastAppliedMapTokenRef.current === mapSelection.token) {
      return;
    }
    const nextAddress = (mapSelection.address || '').trim();
    if (!nextAddress) {
      return;
    }
    setRestaurant((prev) => ({ ...prev, address: nextAddress }));
    setAddressError('');
    setAddressSuggestions([]);
    setIsAddressFocused(false);
    Keyboard.dismiss();
    preserveMapAddressRef.current = true;
    lastAppliedMapTokenRef.current = mapSelection.token;
    onMapAddressApplied?.();
  }, [isFocused, mapSelection, mapTargetIndex, onMapAddressApplied]);

  const hasCityInAddress = (value: string) => {
    if (!value) {
      return false;
    }
    const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) {
      return false;
    }
    const city = parts[0];
    return /[A-Za-zА-Яа-я]/.test(city);
  };

  const fetchAddressSuggestions = async (query: string): Promise<AddressSuggestion[]> => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      return [];
    }
    const composeAddressValue = (titleRaw: string, subtitleRaw: string) => {
      const title = String(titleRaw || '').trim();
      const subtitle = String(subtitleRaw || '').trim();
      if (!subtitle) return title;
      const lowerTitle = title.toLowerCase();
      const lowerSubtitle = subtitle.toLowerCase();
      if (lowerTitle.includes(lowerSubtitle)) return title;
      if (lowerSubtitle.includes(lowerTitle)) return subtitle;
      return `${subtitle}, ${title}`;
    };

    const suggestUrl = `https://suggest-maps.yandex.ru/v1/suggest?apikey=${YANDEX_SUGGEST_API_KEY}&text=${encodeURIComponent(trimmed)}&lang=ru_RU&results=6&types=geo,biz,house`;
    const searchUrl = `https://search-maps.yandex.ru/v1/?apikey=${YANDEX_SEARCH_API_KEY}&text=${encodeURIComponent(trimmed)}&lang=ru_RU&type=biz&results=6`;
    const geocodeUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_GEOCODER_API_KEY}&format=json&lang=ru_RU&results=6&geocode=${encodeURIComponent(trimmed)}`;

    const fetchJson = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
      return response.json();
    };

    const [suggestResult, searchResult, geocodeResult] = await Promise.allSettled([
      fetchJson(suggestUrl),
      fetchJson(searchUrl),
      fetchJson(geocodeUrl),
    ]);

    const suggestRows =
      suggestResult.status === 'fulfilled' ? suggestResult.value?.results ?? [] : [];
    const businessRows =
      searchResult.status === 'fulfilled' ? searchResult.value?.features ?? [] : [];
    const geocodeRows =
      geocodeResult.status === 'fulfilled'
        ? geocodeResult.value?.response?.GeoObjectCollection?.featureMember ?? []
        : [];

    const suggestions = suggestRows.map((item: any, index: number) => {
      const title = item?.title?.text || item?.text || trimmed;
      const subtitle = item?.subtitle?.text || item?.subtitle || '';
      return {
        id: `suggest-${index}-${title}`,
        text: title,
        subtitle,
        value: composeAddressValue(title, subtitle),
      };
    });

    const businesses = businessRows.map((feature: any, index: number) => {
      const props = feature?.properties ?? {};
      const meta = props?.CompanyMetaData ?? {};
      const name = meta?.name || props?.name || '';
      const address = meta?.address || props?.description || '';
      const text = name || address || trimmed;
      return {
        id: `biz-${index}-${text}`,
        text,
        subtitle: address,
        value: address || text,
      };
    });

    const geocoded = geocodeRows.map((member: any, index: number) => {
      const geo = member?.GeoObject;
      const meta = geo?.metaDataProperty?.GeocoderMetaData;
      const text = meta?.text || geo?.name || trimmed;
      return {
        id: `geo-${index}-${text}`,
        text,
        subtitle: geo?.description || '',
        value: text,
      };
    });

    const unique = [...suggestions, ...businesses, ...geocoded].filter((item, idx, arr) => {
      const key = item.value.toLowerCase();
      return idx === arr.findIndex((candidate) => candidate.value.toLowerCase() === key);
    });

    return unique.slice(0, 12);
  };

  const handleAddressInput = (value: string) => {
    setRestaurant((prev) => ({ ...prev, address: value }));
    setAddressError('');

    if (suggestTimerRef.current) {
      clearTimeout(suggestTimerRef.current);
    }

    suggestTimerRef.current = setTimeout(async () => {
      setIsSuggestLoading(true);
      try {
        const suggestions = await fetchAddressSuggestions(value);
        setAddressSuggestions(suggestions);
      } catch (error) {
        console.warn('Ошибка подсказок адреса:', error);
        setAddressSuggestions([]);
      } finally {
        setIsSuggestLoading(false);
      }
    }, 350);
  };

  const handlePickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Доступ к галерее', 'Разрешите доступ к галерее, чтобы выбрать логотип.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setRestaurant((prev) => ({ ...prev, logoUri: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Ошибка выбора логотипа:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать логотип. Попробуйте снова.');
    }
  };

  const handleRemoveLogo = () => {
    setRestaurant((prev) => ({ ...prev, logoUri: null }));
  };

  const handleSaveProject = async () => {
    if (!isLoaded) return;

    if (!restaurant.name.trim()) {
      Alert.alert('Название', 'Укажите название заведения.');
      return;
    }

    if (!restaurant.address.trim()) {
      setAddressError('Укажите город и адрес');
      return;
    }

    if (!hasCityInAddress(restaurant.address)) {
      setAddressError('Добавьте город');
      return;
    }

    try {
      const userId = await getCurrentUserId();
      const rawRegistration = await AsyncStorage.getItem('registrationStep2');
      const parsedRegistration = rawRegistration ? JSON.parse(rawRegistration) : {};
      const registrationRestaurants = normalizeRestaurants(parsedRegistration);

      const questionnaire = userId ? await loadUserQuestionnaire(userId) : null;
      const questionnaireRestaurants = normalizeRestaurants(questionnaire);
      const mergedRestaurants = mergeRestaurants(registrationRestaurants, questionnaireRestaurants);

      const updatedRestaurants = mergedRestaurants.map((item) =>
        item.id === restaurant.id ? { ...restaurant } : item
      );

      const registrationPayload = {
        restaurantName: updatedRestaurants[0]?.name || '',
        address: updatedRestaurants[0]?.address || '',
        logoUri: updatedRestaurants[0]?.logoUri || null,
        restaurants: updatedRestaurants,
      };

      await AsyncStorage.setItem('registrationStep2', JSON.stringify(registrationPayload));

      if (userId) {
        const questionnaireData = questionnaire || {};

        await saveUserQuestionnaire(userId, {
          ...questionnaireData,
          restaurantName: registrationPayload.restaurantName || questionnaireData.restaurantName || '',
          address: registrationPayload.address || questionnaireData.address || '',
          projectLogoUri:
            registrationPayload.logoUri || questionnaireData.projectLogoUri || undefined,
          restaurants: updatedRestaurants,
        });

        await updateUser(userId, {
          projectName: registrationPayload.restaurantName || undefined,
          address: registrationPayload.address || undefined,
          projectLogoUri: registrationPayload.logoUri || undefined,
        });
      }

      const selectedVenueId =
        (userId && (await AsyncStorage.getItem(`user_${userId}_diagnosis_selected_venue_id`))) ||
        (await AsyncStorage.getItem('diagnosis_selected_venue_id'));
      if (selectedVenueId === restaurant.id) {
        const nextLogoUri = restaurant.logoUri || '';
        await AsyncStorage.setItem('diagnosis_selected_venue_logo_uri', nextLogoUri);
        if (userId) {
          await AsyncStorage.setItem(`user_${userId}_diagnosis_selected_venue_logo_uri`, nextLogoUri);
        }
      }

      onSaved?.();
    } catch (error) {
      console.error('Ошибка сохранения изменений заведения:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить изменения. Попробуйте снова.');
    }
  };

  const handleDeleteProject = async () => {
    if (!isLoaded) return;

    try {
      const userId = await getCurrentUserId();
      const rawRegistration = await AsyncStorage.getItem('registrationStep2');
      const parsedRegistration = rawRegistration ? JSON.parse(rawRegistration) : {};
      const registrationRestaurants = normalizeRestaurants(parsedRegistration);

      const questionnaire = userId ? await loadUserQuestionnaire(userId) : null;
      const questionnaireRestaurants = normalizeRestaurants(questionnaire);
      const mergedRestaurants = mergeRestaurants(registrationRestaurants, questionnaireRestaurants);

      const nextRestaurants = mergedRestaurants.filter((item) => item.id !== restaurant.id);

      const registrationPayload = {
        restaurantName: nextRestaurants[0]?.name || '',
        address: nextRestaurants[0]?.address || '',
        logoUri: nextRestaurants[0]?.logoUri || null,
        restaurants: nextRestaurants,
      };

      await AsyncStorage.setItem('registrationStep2', JSON.stringify(registrationPayload));

      if (userId) {
        const questionnaireData = questionnaire || {};

        await saveUserQuestionnaire(userId, {
          ...questionnaireData,
          restaurantName: registrationPayload.restaurantName || '',
          address: registrationPayload.address || '',
          projectLogoUri: registrationPayload.logoUri || undefined,
          restaurants: nextRestaurants,
        });

        await updateUser(userId, {
          projectName: registrationPayload.restaurantName || undefined,
          address: registrationPayload.address || undefined,
          projectLogoUri: registrationPayload.logoUri || undefined,
        });
      }

      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter((key) => key.includes(restaurant.id));
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(Array.from(new Set(keysToRemove)));
      }

      const nextVenueId = nextRestaurants[0]?.id || null;
      const nextVenueLogo = nextRestaurants[0]?.logoUri || '';
      const globalSelectedVenue = await AsyncStorage.getItem('diagnosis_selected_venue_id');
      if (globalSelectedVenue === restaurant.id) {
        if (nextVenueId) {
          await AsyncStorage.setItem('diagnosis_selected_venue_id', nextVenueId);
          await AsyncStorage.setItem('diagnosis_selected_venue_logo_uri', nextVenueLogo);
        } else {
          await AsyncStorage.removeItem('diagnosis_selected_venue_id');
          await AsyncStorage.removeItem('diagnosis_selected_venue_logo_uri');
        }
      }

      if (userId) {
        const userSelectedVenueKey = `user_${userId}_diagnosis_selected_venue_id`;
        const userSelectedVenueLogoKey = `user_${userId}_diagnosis_selected_venue_logo_uri`;
        const userSelectedVenue = await AsyncStorage.getItem(userSelectedVenueKey);
        if (userSelectedVenue === restaurant.id) {
          if (nextVenueId) {
            await AsyncStorage.setItem(userSelectedVenueKey, nextVenueId);
            await AsyncStorage.setItem(userSelectedVenueLogoKey, nextVenueLogo);
          } else {
            await AsyncStorage.removeItem(userSelectedVenueKey);
            await AsyncStorage.removeItem(userSelectedVenueLogoKey);
          }
        }
      }

      await removeVenueFromPerVenueStorage(userId, restaurant.id);

      onDeleted?.();
    } catch (error) {
      console.error('Ошибка удаления заведения:', error);
      Alert.alert('Ошибка', 'Не удалось удалить заведение. Попробуйте снова.');
    }
  };

  const isFormReady = Boolean(
    restaurant.name.trim() && restaurant.address.trim() && hasCityInAddress(restaurant.address)
  );

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback
        accessible={false}
        onPress={() => {
          Keyboard.dismiss();
          setIsAddressFocused(false);
        }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              {backIconSvg ? (
                <SvgXml xml={backIconSvg} width={24} height={24} />
              ) : (
                <Ionicons name="arrow-back" size={24} color="#0A0D14" />
              )}
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Редактировать заведение</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Название заведения</Text>
            <View style={[styles.inputContainer, styles.nameInputContainer]}>
              {nameIconSvg ? (
                <View style={styles.inputIcon}>
                  <SvgXml xml={nameIconSvg} width={20} height={20} />
                </View>
              ) : (
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={palette.gray400}
                  style={styles.inputIcon}
                />
              )}
              <TextInput
                style={[styles.input, restaurant.name ? styles.inputFilled : styles.inputEmpty]}
                placeholder="Суши-бар"
                placeholderTextColor={palette.gray400}
                value={restaurant.name}
                onChangeText={(value) => setRestaurant((prev) => ({ ...prev, name: value }))}
              />
            </View>
          </View>

          <View style={[styles.inputWrapper, styles.addressInputWrapper]}>
            <View style={styles.addressLabelRowAbsolute}>
              <Text style={styles.inputLabel}>Адрес заведения</Text>
              <TouchableOpacity onPress={() => onOpenMap?.(0)} activeOpacity={0.7}>
                <Text style={styles.mapLinkText}>Указать на карте</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, styles.addressInputContainer]}>
              {addressIconSvg ? (
                <View style={styles.inputIcon}>
                  <SvgXml xml={addressIconSvg} width={20} height={20} />
                </View>
              ) : (
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={palette.gray400}
                  style={styles.inputIcon}
                />
              )}
              <TextInput
                style={[styles.input, restaurant.address ? styles.inputFilled : styles.inputEmpty]}
                placeholder="Москва, ул. Пушкина, 1А"
                placeholderTextColor={palette.gray400}
                value={restaurant.address}
                onChangeText={handleAddressInput}
                onFocus={() => setIsAddressFocused(true)}
                onBlur={() => {
                  setTimeout(() => setIsAddressFocused(false), 120);
                }}
                autoCapitalize="none"
              />
            </View>

            {!!addressError && <Text style={styles.errorText}>{addressError}</Text>}

            {isAddressFocused && (
              <View style={styles.suggestionsContainer}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  contentContainerStyle={styles.suggestionsContent}
                  keyboardShouldPersistTaps="always"
                >
                  {addressSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion.id}
                      style={styles.suggestionItem}
                      activeOpacity={0.8}
                      onPress={() => {
                        setRestaurant((prev) => ({ ...prev, address: suggestion.value || suggestion.text }));
                        setAddressSuggestions([]);
                        setIsAddressFocused(false);
                        Keyboard.dismiss();
                      }}
                    >
                      <Text style={styles.suggestionText}>{suggestion.text}</Text>
                      {!!suggestion.subtitle && (
                        <Text style={styles.suggestionSubtitle}>{suggestion.subtitle}</Text>
                      )}
                    </TouchableOpacity>
                  ))}

                  {isSuggestLoading && <Text style={styles.suggestionLoading}>Поиск...</Text>}

                  {!isSuggestLoading && !addressSuggestions.length && (
                    <Text style={styles.suggestionLoading}>
                      {restaurant.address.trim().length < 3 ? 'Введите адрес или название' : 'Нет результатов'}
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.logoSection}>
            <TouchableOpacity
              style={styles.logoInfoPressable}
              onPress={handlePickLogo}
              activeOpacity={0.8}
            >
              <View style={styles.logoPreview}>
                {restaurant.logoUri ? (
                  <Image source={{ uri: restaurant.logoUri }} style={styles.logoImage} />
                ) : logoPlaceholderSvg ? (
                  <SvgXml xml={logoPlaceholderSvg} width={50} height={50} />
                ) : (
                  <Ionicons name="image-outline" size={30} color={palette.gray400} />
                )}
              </View>

              <View style={styles.logoTextContainer}>
                <Text style={styles.logoTitle}>Логотип</Text>
                <Text style={styles.logoSubtitle}>200x200px, png / jpg</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoUploadButton}
              onPress={restaurant.logoUri ? handleRemoveLogo : handlePickLogo}
              activeOpacity={0.8}
            >
              <Text style={styles.logoUploadButtonText}>
                {restaurant.logoUri ? 'Удалить' : 'Загрузить'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      <View style={styles.continueButtonContainer}>
        <AnimatedPressable style={styles.deleteButton} onPress={handleDeleteProject}>
          <Text style={styles.deleteButtonText}>Удалить заведение</Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={[styles.continueButton, !isFormReady && styles.continueButtonDisabled]}
          onPress={handleSaveProject}
          disabled={!isFormReady}
        >
          <Text style={styles.continueButtonText}>Сохранить изменения</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.xl + 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl + 8,
    minHeight: 32,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 0,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A0D14',
    fontFamily: 'Manrope-SemiBold',
    lineHeight: 22,
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: spacing.lg,
  },
  addressInputWrapper: {
    position: 'relative',
  },
  addressLabelRowAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A0D14',
    fontFamily: 'Manrope-SemiBold',
  },
  mapLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#191BDF',
    fontFamily: 'Manrope-Medium',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    paddingHorizontal: spacing.md,
    height: 56,
  },
  nameInputContainer: {
    height: 53,
    marginTop: spacing.xs,
  },
  addressInputContainer: {
    marginTop: spacing.xs + 22,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Manrope-Medium',
    padding: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputEmpty: {
    color: '#868C98',
  },
  inputFilled: {
    color: '#0A0D14',
  },
  suggestionsContainer: {
    marginTop: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    maxHeight: 140,
    overflow: 'hidden',
  },
  suggestionsContent: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  suggestionItem: {
    paddingVertical: spacing.xs,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0A0D14',
    fontFamily: 'Manrope-Medium',
  },
  suggestionSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#868C98',
    fontFamily: 'Manrope-Regular',
    marginTop: 2,
  },
  suggestionLoading: {
    fontSize: 12,
    fontWeight: '400',
    color: '#868C98',
    fontFamily: 'Manrope-Regular',
    paddingVertical: spacing.xs,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '400',
    color: '#DF1C41',
    fontFamily: 'Manrope-Regular',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: spacing.md - 35,
    marginTop: -5,
  },
  logoInfoPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPreview: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  logoImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  logoTextContainer: {
    flex: 1,
  },
  logoTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A0D14',
    fontFamily: 'Manrope-SemiBold',
    marginBottom: 2,
  },
  logoSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#525866',
    fontFamily: 'Manrope-Medium',
    lineHeight: 20,
  },
  logoUploadButton: {
    width: 98,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    backgroundColor: palette.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoUploadButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#525866',
    fontFamily: 'Manrope-Medium',
    lineHeight: 24,
  },
  continueButtonContainer: {
    position: 'absolute',
    bottom: 57,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: 0,
  },
  continueButton: {
    marginTop: 23,
    backgroundColor: '#191BDF',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#CDD0D5',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Platform.select({
      ios: 'Manrope',
      android: 'Manrope',
      web: "'Manrope', sans-serif",
      default: 'Manrope',
    }),
    color: palette.white,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#FDEDF0',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Platform.select({
      ios: 'Manrope',
      android: 'Manrope',
      web: "'Manrope', sans-serif",
      default: 'Manrope',
    }),
    color: '#DF1C41',
    textAlign: 'center',
  },
});
