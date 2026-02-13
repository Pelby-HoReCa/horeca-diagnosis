import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { SvgXml } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import AnimatedPressable from '../components/AnimatedPressable';
import { palette, spacing } from '../styles/theme';
import { getCurrentUserId, loadUserQuestionnaire, saveUserQuestionnaire } from '../utils/userDataStorage';
import { getUsers, updateUser } from '../utils/usersStorage';

const YANDEX_GEOCODER_API_KEY = 'd54ee7de-414b-4803-acae-6c3f72d850bd';
const YANDEX_SUGGEST_API_KEY = '1d508342-375a-432f-b5ed-d94ff51a8111';
const YANDEX_SEARCH_API_KEY = 'e18abfd7-3df3-428a-8de2-26daca78c426';

interface RegisterScreen2Props {
  onContinue: () => void;
  onSkip?: () => void;
  onBack?: () => void;
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

export default function RegisterScreen2({
  onContinue,
  onSkip,
  onBack,
  onOpenMap,
  mapSelection,
  mapTargetIndex,
  onMapAddressApplied,
}: RegisterScreen2Props) {
  const [restaurants, setRestaurants] = useState<RestaurantDraft[]>([createRestaurantDraft()]);
  const [userIconSvg, setUserIconSvg] = useState<string>('');
  const [emailIconSvg, setEmailIconSvg] = useState<string>('');
  const [logoPlaceholderSvg, setLogoPlaceholderSvg] = useState<string>('');
  const [removeIconSvg, setRemoveIconSvg] = useState<string>('');
  const [hasLoadedRegistration, setHasLoadedRegistration] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<Record<string, AddressSuggestion[]>>({});
  const [isSuggestLoading, setIsSuggestLoading] = useState<Record<string, boolean>>({});
  const [focusedAddressId, setFocusedAddressId] = useState<string | null>(null);
  const [isScrollInProgress, setIsScrollInProgress] = useState(false);
  const [isSuggestionInteracting, setIsSuggestionInteracting] = useState(false);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const lastFocusRef = React.useRef(0);
  const insideInputTouchRef = React.useRef(false);
  const suggestTimersRef = React.useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});

  useEffect(() => {
    const hasRestaurantData = (items: RestaurantDraft[] | undefined) =>
      Array.isArray(items) && items.some((item) => item.name || item.address || item.logoUri);

    const normalizeRestaurants = (items: Array<Partial<RestaurantDraft>> | undefined) => {
      if (!items || items.length === 0) {
        return null;
      }
      return items.map((item) => ({
        id: item.id || `rest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: item.name || '',
        address: item.address || '',
        logoUri: item.logoUri || null,
      }));
    };

    const tryRecoverFromUserData = async (): Promise<boolean> => {
      const userId = await getCurrentUserId();
      if (!userId) {
        return false;
      }

      const questionnaire = await loadUserQuestionnaire(userId);
      if (questionnaire) {
        const recoveredRestaurants = normalizeRestaurants(questionnaire.restaurants);
        if (recoveredRestaurants && hasRestaurantData(recoveredRestaurants)) {
          setRestaurants(recoveredRestaurants);
          console.log('Восстановили рестораны из анкеты пользователя.');
          return true;
        }

        const fallbackRestaurant = normalizeRestaurants([
          {
            name: questionnaire.restaurantName,
            address: questionnaire.address,
            logoUri: questionnaire.projectLogoUri || null,
          },
        ]);
        if (fallbackRestaurant && hasRestaurantData(fallbackRestaurant)) {
          setRestaurants(fallbackRestaurant);
          console.log('Восстановили данные ресторана из анкеты пользователя.');
          return true;
        }
      }

      const users = await getUsers();
      const user = users.find((item) => item.id === userId);
      if (user) {
        const fallbackRestaurant = normalizeRestaurants([
          {
            name: user.projectName,
            address: user.address,
            logoUri: user.projectLogoUri || null,
          },
        ]);
        if (fallbackRestaurant && hasRestaurantData(fallbackRestaurant)) {
          setRestaurants(fallbackRestaurant);
          console.log('Восстановили данные ресторана из профиля пользователя.');
          return true;
        }
      }

      return false;
    };

    const loadSavedRegistration = async () => {
      const saved = await AsyncStorage.getItem('registrationStep2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.restaurants) && parsed.restaurants.length > 0) {
            const normalized = normalizeRestaurants(parsed.restaurants) || [createRestaurantDraft()];
            setRestaurants(normalized);
            if (!hasRestaurantData(normalized)) {
              await tryRecoverFromUserData();
            }
          } else {
            const fallback = normalizeRestaurants([
              {
                name: parsed.restaurantName,
                address: parsed.address,
                logoUri: parsed.logoUri || null,
              },
            ]);
            if (fallback) {
              setRestaurants(fallback);
              if (!hasRestaurantData(fallback)) {
                await tryRecoverFromUserData();
              }
            } else {
              await tryRecoverFromUserData();
            }
          }
        } catch (error) {
          console.error('Ошибка чтения данных регистрации (шаг 2):', error);
        }
      } else {
        await tryRecoverFromUserData();
      }
      setHasLoadedRegistration(true);
    };

    // Загружаем SVG иконку для поля "Названия заведения"
    const loadUserIcon = async () => {
      try {
        const iconAsset = Asset.fromModule(require('../../assets/images/venue-name-icon.svg'));
        await iconAsset.downloadAsync();
        if (iconAsset.localUri) {
          const response = await fetch(iconAsset.localUri);
          const fileContent = await response.text();
          setUserIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки пользователя (экран 2):', error);
      }
    };

    // Загружаем SVG иконку для поля "Адрес заведения"
    const loadEmailIcon = async () => {
      try {
        const iconAsset = Asset.fromModule(require('../../assets/images/venue-address-icon.svg'));
        await iconAsset.downloadAsync();
        if (iconAsset.localUri) {
          const response = await fetch(iconAsset.localUri);
          const fileContent = await response.text();
          setEmailIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки email (экран 2):', error);
      }
    };

    const loadLogoPlaceholderIcon = async () => {
      try {
        const iconAsset = Asset.fromModule(require('../../assets/images/restaurant-avatar-placeholder.svg'));
        await iconAsset.downloadAsync();
        if (iconAsset.localUri) {
          const response = await fetch(iconAsset.localUri);
          const fileContent = await response.text();
          setLogoPlaceholderSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG заглушки логотипа (экран 2):', error);
      }
    };

    const loadRemoveIcon = async () => {
      try {
        const iconAsset = Asset.fromModule(require('../../assets/images/compact-button-icon.svg'));
        await iconAsset.downloadAsync();
        if (iconAsset.localUri) {
          const response = await fetch(iconAsset.localUri);
          const fileContent = await response.text();
          setRemoveIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки удаления:', error);
      }
    };

    loadSavedRegistration();
    loadUserIcon();
    loadEmailIcon();
    loadLogoPlaceholderIcon();
    loadRemoveIcon();
  }, []);

  useEffect(() => {
    if (!hasLoadedRegistration) {
      return;
    }
    const saveDraft = async () => {
      try {
        await AsyncStorage.setItem(
          'registrationStep2',
          JSON.stringify({
            restaurantName: restaurants[0]?.name || '',
            address: restaurants[0]?.address || '',
            logoUri: restaurants[0]?.logoUri || null,
            restaurants,
          })
        );
      } catch (error) {
        console.error('Ошибка сохранения черновика (шаг 2):', error);
      }
    };

    saveDraft();
  }, [restaurants]);

  useEffect(() => {
    if (!hasLoadedRegistration) {
      return;
    }
    if (mapSelection && mapTargetIndex !== null && mapTargetIndex >= 0) {
      setRestaurants((prev) =>
        prev.map((item, idx) =>
          idx === mapTargetIndex ? { ...item, address: mapSelection.address } : item
        )
      );
      const restaurantId = restaurants[mapTargetIndex]?.id;
      if (restaurantId) {
        setAddressSuggestions((prev) => ({ ...prev, [restaurantId]: [] }));
      }
      onMapAddressApplied?.();
    }
  }, [mapSelection, mapTargetIndex, onMapAddressApplied, hasLoadedRegistration]);

  const updateRestaurant = (index: number, updates: Partial<RestaurantDraft>) => {
    setRestaurants((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item))
    );
  };

  const fetchAddressSuggestions = async (query: string): Promise<AddressSuggestion[]> => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      return [];
    }
    const suggestUrl = `https://suggest-maps.yandex.ru/v1/suggest?apikey=${YANDEX_SUGGEST_API_KEY}&text=${encodeURIComponent(trimmed)}&lang=ru_RU&results=6&types=geo,biz,house`;
    const searchUrl = `https://search-maps.yandex.ru/v1/?apikey=${YANDEX_SEARCH_API_KEY}&text=${encodeURIComponent(trimmed)}&lang=ru_RU&type=biz&results=6`;
    const geocodeUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_GEOCODER_API_KEY}&format=json&lang=ru_RU&results=6&geocode=${encodeURIComponent(trimmed)}`;

    const fetchJson = async (url: string, label: string) => {
      const response = await fetch(url);
      let data: any = null;
      try {
        data = await response.json();
      } catch (error) {
        console.warn(`Ошибка чтения ответа ${label}:`, error);
      }
      if (!response.ok) {
        console.warn(`Ошибка ${label}:`, response.status, data);
      }
      return data;
    };

    const [suggestResponse, searchResponse, geocodeResponse] = await Promise.allSettled([
      fetchJson(suggestUrl, 'Yandex Suggest'),
      fetchJson(searchUrl, 'Yandex Search'),
      fetchJson(geocodeUrl, 'Yandex Geocode'),
    ]);

    const suggestResults =
      suggestResponse.status === 'fulfilled' ? suggestResponse.value?.results ?? [] : [];
    const searchResults =
      searchResponse.status === 'fulfilled' ? searchResponse.value?.features ?? [] : [];

    const suggestions = suggestResults.map((item: any, index: number) => {
      const title = item?.title?.text || item?.text || trimmed;
      const subtitle = item?.subtitle?.text || item?.subtitle || '';
      return {
        id: `suggest-${title}-${index}`,
        text: title,
        subtitle,
        value: title,
      };
    });

    const businesses = searchResults.map((feature: any, index: number) => {
      const props = feature?.properties ?? {};
      const meta = props?.CompanyMetaData ?? {};
      const name = meta?.name || props?.name || '';
      const address = meta?.address || props?.description || '';
      const text = name || address || trimmed;
      return {
        id: `biz-${text}-${index}`,
        text,
        subtitle: address,
        value: address || text,
      };
    });

    const geocodeResults =
      geocodeResponse.status === 'fulfilled'
        ? geocodeResponse.value?.response?.GeoObjectCollection?.featureMember ?? []
        : [];
    const geocodeSuggestions = geocodeResults.map((member: any, index: number) => {
      const geo = member.GeoObject;
      const meta = geo?.metaDataProperty?.GeocoderMetaData;
      const text = meta?.text || geo?.name || trimmed;
      const subtitle = geo?.description || '';
      return {
        id: `geo-${text}-${index}`,
        text,
        subtitle,
        value: text,
      };
    });

    const combined = [...suggestions, ...businesses, ...geocodeSuggestions];
    const seen = new Set<string>();
    const unique = combined.filter((item) => {
      const key = item.value.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    return unique.slice(0, 12);
  };

  const handleAddressInput = (index: number, value: string) => {
    const restaurantId = restaurants[index]?.id;
    if (!restaurantId) {
      return;
    }
    updateRestaurant(index, { address: value });
    if (suggestTimersRef.current[restaurantId]) {
      clearTimeout(suggestTimersRef.current[restaurantId]!);
    }
    suggestTimersRef.current[restaurantId] = setTimeout(async () => {
      setIsSuggestLoading((prev) => ({ ...prev, [restaurantId]: true }));
      try {
        const suggestions = await fetchAddressSuggestions(value);
        setAddressSuggestions((prev) => ({ ...prev, [restaurantId]: suggestions }));
      } catch (error) {
        console.warn('Ошибка загрузки подсказок адреса:', error);
        setAddressSuggestions((prev) => ({ ...prev, [restaurantId]: [] }));
      } finally {
        setIsSuggestLoading((prev) => ({ ...prev, [restaurantId]: false }));
      }
    }, 350);
  };

  const handlePickLogo = async (index: number) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Доступ к галерее',
          'Разрешите доступ к галерее, чтобы выбрать логотип.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        updateRestaurant(index, { logoUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Ошибка выбора логотипа:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать логотип. Попробуйте снова.');
    }
  };

  const handleRemoveLogo = (index: number) => {
    updateRestaurant(index, { logoUri: null });
  };

  const handleAddRestaurant = () => {
    setRestaurants((prev) => [...prev, createRestaurantDraft()]);
  };

  const handleRemoveRestaurant = (index: number) => {
    if (index === 0) {
      return;
    }
    setRestaurants((prev) => prev.filter((_, idx) => idx !== index));
    const restaurantId = restaurants[index]?.id;
    if (restaurantId) {
      if (suggestTimersRef.current[restaurantId]) {
        clearTimeout(suggestTimersRef.current[restaurantId]!);
      }
      setAddressSuggestions((prev) => {
        const next = { ...prev };
        delete next[restaurantId];
        return next;
      });
      setIsSuggestLoading((prev) => {
        const next = { ...prev };
        delete next[restaurantId];
        return next;
      });
    }
  };

  const handleContinue = async () => {
    const payload = {
      restaurantName: restaurants[0]?.name || '',
      address: restaurants[0]?.address || '',
      logoUri: restaurants[0]?.logoUri || null,
      restaurants,
    };

    await AsyncStorage.setItem('registrationStep2', JSON.stringify(payload));

    const userId = await getCurrentUserId();
    if (userId) {
      await updateUser(userId, {
        projectName: restaurants[0]?.name || '',
        address: restaurants[0]?.address || '',
        projectLogoUri: restaurants[0]?.logoUri || undefined,
      });
      await saveUserQuestionnaire(userId, {
        restaurantName: restaurants[0]?.name || '',
        city: '',
        address: restaurants[0]?.address || '',
        projectLogoUri: restaurants[0]?.logoUri || undefined,
        restaurants,
      });
    }

    onContinue();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        onTouchStart={(event) => {
          const { pageX, pageY } = event.nativeEvent;
          touchStartRef.current = { x: pageX, y: pageY };
        }}
        onTouchEnd={(event) => {
          const start = touchStartRef.current;
          touchStartRef.current = null;
          if (!start || isSuggestionInteracting || isScrollInProgress) {
            return;
          }
          if (focusedAddressId && Date.now() - lastFocusRef.current < 200) {
            return;
          }
          if (insideInputTouchRef.current) {
            return;
          }
          const { pageX, pageY } = event.nativeEvent;
          const deltaX = Math.abs(pageX - start.x);
          const deltaY = Math.abs(pageY - start.y);
          if (deltaX < 6 && deltaY < 6) {
            Keyboard.dismiss();
            setFocusedAddressId(null);
          }
        }}
        onScrollBeginDrag={() => setIsScrollInProgress(true)}
        onScrollEndDrag={() => {
          setTimeout(() => setIsScrollInProgress(false), 100);
        }}
      >
        <View>
          {/* Header: Back button, Step indicator and Skip button */}
          <View style={styles.header}>
            {onBack && (
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#0A0D14" />
              </TouchableOpacity>
            )}
            <View style={styles.stepIndicatorContainer}>
              <Text style={styles.stepIndicator}>2 / 3 ШАГ</Text>
            </View>
            <TouchableOpacity onPress={onSkip || (() => {})} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Пропустить</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.title}>Данные о вашем{'\n'}ресторане</Text>

          {/* Description */}
          <Text style={styles.description}>
            Укажите заведения, чтобы получить точный анализ по каждому направлению.
          </Text>

          <View style={styles.inputsContainer}>
            {restaurants.map((restaurant, index) => (
              <View
                key={restaurant.id}
                style={[
                  styles.restaurantBlock,
                  index > 0 && styles.restaurantBlockAfterFirst,
                ]}
              >
                {/* Названия заведения */}
                <View
                  style={styles.inputWrapper}
                  onTouchStart={() => {
                    insideInputTouchRef.current = true;
                  }}
                  onTouchEnd={() => {
                    setTimeout(() => {
                      insideInputTouchRef.current = false;
                    }, 0);
                  }}
                >
                  <View
                    style={[
                      styles.fieldLabelRow,
                      index > 0 && styles.fieldLabelRowOffset,
                    ]}
                  >
                    <Text
                      style={[
                        styles.inputLabel,
                        index === 0 && styles.firstNameLabelOffset,
                      ]}
                    >
                      Названия заведения
                    </Text>
                    {index > 0 && removeIconSvg && (
                      <TouchableOpacity
                        style={styles.removeRestaurantButton}
                        onPress={() => handleRemoveRestaurant(index)}
                        activeOpacity={0.7}
                      >
                        <SvgXml xml={removeIconSvg} width={21} height={21} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={[styles.inputContainer, styles.nameInputContainer]}>
                    {userIconSvg ? (
                      <View style={styles.inputIcon}>
                        <SvgXml xml={userIconSvg} width={20} height={20} />
                      </View>
                    ) : (
                      <Ionicons name="person-outline" size={20} color={palette.gray400} style={styles.inputIcon} />
                    )}
                    <TextInput
                      style={styles.input}
                      placeholder="Суши-бар"
                      placeholderTextColor={palette.gray400}
                      value={restaurant.name}
                      onChangeText={(value) => updateRestaurant(index, { name: value })}
                    />
                  </View>
                </View>

                {/* Адрес заведения */}
                <View
                  style={[styles.inputWrapper, styles.addressInputWrapper]}
                  onTouchStart={() => {
                    insideInputTouchRef.current = true;
                  }}
                  onTouchEnd={() => {
                    setTimeout(() => {
                      insideInputTouchRef.current = false;
                    }, 0);
                  }}
                >
                  <View style={styles.addressLabelRowAbsolute}>
                    <Text style={styles.inputLabel}>Адрес заведения</Text>
                    <TouchableOpacity onPress={() => onOpenMap?.(index)} activeOpacity={0.7}>
                      <Text style={styles.mapLinkText}>Указать на карте</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.inputContainer, styles.addressInputContainer]}>
                    {emailIconSvg ? (
                      <View style={styles.inputIcon}>
                        <SvgXml xml={emailIconSvg} width={20} height={20} />
                      </View>
                    ) : (
                      <Ionicons name="location-outline" size={20} color={palette.gray400} style={styles.inputIcon} />
                    )}
                    <TextInput
                      style={styles.input}
                      placeholder="Москва, ул. Пушкина, 1А"
                      placeholderTextColor={palette.gray400}
                      value={restaurant.address}
                      onChangeText={(value) => handleAddressInput(index, value)}
                      onFocus={() => {
                        lastFocusRef.current = Date.now();
                        setFocusedAddressId(restaurant.id);
                      }}
                      onBlur={() => {
                        if (isScrollInProgress) {
                          return;
                        }
                        setTimeout(() => {
                          setFocusedAddressId((prev) => (prev === restaurant.id ? null : prev));
                        }, 100);
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  {focusedAddressId === restaurant.id && (
                    <View
                      style={styles.suggestionsContainer}
                      onTouchStart={() => {
                        insideInputTouchRef.current = true;
                      }}
                      onTouchEnd={() => {
                        setTimeout(() => {
                          insideInputTouchRef.current = false;
                        }, 0);
                      }}
                    >
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                        contentContainerStyle={styles.suggestionsContent}
                        keyboardShouldPersistTaps="always"
                        keyboardDismissMode="none"
                        onTouchStart={() => setIsSuggestionInteracting(true)}
                        onTouchEnd={() => setIsSuggestionInteracting(false)}
                        onScrollBeginDrag={() => setIsSuggestionInteracting(true)}
                        onScrollEndDrag={() => {
                          setTimeout(() => setIsSuggestionInteracting(false), 100);
                        }}
                      >
                        {(addressSuggestions[restaurant.id] ?? []).map((suggestion) => (
                          <TouchableOpacity
                            key={suggestion.id}
                            style={styles.suggestionItem}
                            activeOpacity={0.8}
                            onPressIn={() => {
                              isSuggestionInteracting || setIsSuggestionInteracting(true);
                            }}
                            onPressOut={() => {
                              setTimeout(() => setIsSuggestionInteracting(false), 50);
                            }}
                            onPress={() => {
                              updateRestaurant(index, { address: suggestion.value || suggestion.text });
                              setAddressSuggestions((prev) => ({ ...prev, [restaurant.id]: [] }));
                              setFocusedAddressId(null);
                            }}
                          >
                            <Text style={styles.suggestionText}>{suggestion.text}</Text>
                            {!!suggestion.subtitle && (
                              <Text style={styles.suggestionSubtitle}>{suggestion.subtitle}</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                        {isSuggestLoading[restaurant.id] && (
                          <Text style={styles.suggestionLoading}>Поиск...</Text>
                        )}
                        {!isSuggestLoading[restaurant.id] &&
                          !(addressSuggestions[restaurant.id] ?? []).length && (
                            <Text style={styles.suggestionLoading}>
                              {restaurant.address.trim().length < 3
                                ? 'Введите адрес или название'
                                : 'Нет результатов'}
                            </Text>
                          )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Logo block */}
                <View style={styles.logoSection}>
                  <TouchableOpacity
                    style={styles.logoPreview}
                    onPress={() => handlePickLogo(index)}
                    activeOpacity={0.8}
                  >
                    {restaurant.logoUri ? (
                      <Image source={{ uri: restaurant.logoUri }} style={styles.logoImage} />
                    ) : logoPlaceholderSvg ? (
                      <SvgXml xml={logoPlaceholderSvg} width={50} height={50} />
                    ) : (
                      <Ionicons name="image-outline" size={30} color={palette.gray400} />
                    )}
                  </TouchableOpacity>
                  <View style={styles.logoTextContainer}>
                    <Text style={styles.logoTitle}>Логотип</Text>
                    <Text style={styles.logoSubtitle}>200x200px, png / jpg</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.logoUploadButton}
                    onPress={() => (restaurant.logoUri ? handleRemoveLogo(index) : handlePickLogo(index))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.logoUploadButtonText}>
                      {restaurant.logoUri ? 'Удалить' : 'Загрузить'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {index < restaurants.length - 1 && <View style={styles.logoDividerInner} />}
              </View>
            ))}
          </View>

          {restaurants.map((restaurant, index) => (
            <React.Fragment key={`divider-${restaurant.id}`}>
              {index === restaurants.length - 1 && (
                <>
                  {/* Серая полоса под блоками */}
                  <View style={styles.logoDivider} />

                  {/* "+ Добавить еще ресторан" под серой линией */}
                  <TouchableOpacity
                    style={styles.addRestaurantRow}
                    onPress={handleAddRestaurant}
                    activeOpacity={0.8}
                  >
            <Text style={styles.addRestaurantPlus}>+ </Text>
                    <Text style={styles.addRestaurantText}>Добавить еще ресторан</Text>
                  </TouchableOpacity>
                </>
              )}
            </React.Fragment>
          ))}

        </View>
      </ScrollView>
      {/* Кнопка "Продолжить" - абсолютное позиционирование */}
      <View style={styles.continueButtonContainer}>
        <AnimatedPressable
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Продолжить</Text>
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
    marginBottom: spacing.xl,
    position: 'relative',
  },
  backButton: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
    zIndex: 3,
  },
  stepIndicatorContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(10, 13, 20, 0.5)',
    fontFamily: 'Manrope-SemiBold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: 0,
    height: 'auto',
    marginLeft: 'auto', // Выравнивание справа
    zIndex: 2,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#191BDF',
    fontFamily: 'Manrope-Medium',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0A0D14',
    fontFamily: 'Manrope-Bold',
    marginTop: -20,
    marginBottom: spacing.sm,
    lineHeight: 36,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(10, 13, 20, 0.8)',
    fontFamily: 'Manrope-Medium',
    marginBottom: spacing.xl,
    lineHeight: 24,
    textAlign: 'center',
  },
  inputsContainer: {
    marginBottom: spacing.lg,
  },
  inputWrapper: {
    marginBottom: spacing.lg,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.xs, // Отступ как у "Название заведения"
  },
  addressInputWrapper: {
    position: 'relative', // Для абсолютного позиционирования заголовка
  },
  addressLabelRowAbsolute: {
    position: 'absolute',
    top: 0, // Начало контейнера
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
    marginBottom: 0,
    marginTop: 0,
  },
  firstNameLabelOffset: {
    transform: [{ translateY: -4 }],
  },
  mapLinkText: {
    fontSize: 14, // Как у "Выбрать все" на третьем экране
    fontWeight: '500', // Как у "Выбрать все"
    color: '#191BDF', // Как у "Выбрать все"
    fontFamily: 'Manrope-Medium', // Как у "Выбрать все"
    letterSpacing: 0.5, // Как у "Выбрать все"
    paddingRight: 0,
    transform: [{ translateY: -4 }], // Поднимаем ещё на 2px
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
    marginTop: spacing.xs + 22,
  },
  addressInputContainer: {
    marginTop: spacing.xs + 22, // Отступ сверху для поля (spacing.xs 8px + высота заголовка ~22px) = такой же отступ как у "Название заведения"
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#868C98',
    fontFamily: 'Manrope-Medium',
    padding: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0, // чтобы иконка и контент выровнялись по левому краю полей регистрации
    paddingVertical: spacing.md - 35,
    marginTop: -5,
  },
  restaurantBlock: {
    marginBottom: spacing.md,
  },
  restaurantBlockAfterFirst: {
    marginTop: -29,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    transform: [{ translateY: 24 }],
  },
  fieldLabelRowOffset: {
    transform: [{ translateY: 27 }],
  },
  removeRestaurantButton: {
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
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
    fontSize: 17, // на 2 больше, чем у заголовка полей (15)
    fontWeight: '600', // как у заголовков полей регистрации
    color: '#0A0D14', // как у заголовков полей регистрации
    fontFamily: 'Manrope-SemiBold',
    marginBottom: 2, // уменьшен отступ, чтобы подпись подойти ближе к заголовку
  },
  logoSubtitle: {
    fontSize: 14, // на 2 меньше, чем было
    fontWeight: '500', // как у подзаголовка
    color: '#525866',
    fontFamily: 'Manrope-Medium',
    lineHeight: 20,
  },
  logoUploadButton: {
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: 12, // как у полей регистрации
    borderWidth: 1,
    borderColor: '#E2E4E9', // как у полей регистрации
    backgroundColor: palette.white, // как у полей регистрации
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoUploadButtonText: {
    fontSize: 16, // как у подзаголовка
    fontWeight: '500', // как у подзаголовка
    color: '#525866',
    fontFamily: 'Manrope-Medium',
    lineHeight: 24,
  },
  logoDivider: {
    height: 1,
    backgroundColor: '#E2E4E9', // как тонкая серая полоса на дашборде
    marginTop: spacing.md - 25, // опущено на 40px
    alignSelf: 'stretch', // ширина как у полей регистрации (учитывая paddingHorizontal scrollContent)
  },
  logoDividerInner: {
    height: 1,
    backgroundColor: '#E2E4E9',
    marginTop: spacing.md + 5,
    alignSelf: 'stretch',
  },
  addRestaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md + 20, // опущено на 20px
    marginBottom: spacing.md + 24, // Увеличено еще на 2px, чтобы кнопка была ниже
  },
  addRestaurantPlus: {
    fontSize: 23, // на 4 больше, чем текст (19)
    fontWeight: '400',
    color: '#CDD0D5',
    fontFamily: 'Manrope-Bold',
    marginRight: 6,
    transform: [{ translateX: 0 }],
  },
  addRestaurantText: {
    fontSize: 19, // как было
    fontWeight: '400',
    color: '#CDD0D5',
    fontFamily: 'Manrope-Bold',
    textAlign: 'center',
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
  continueButtonContainer: {
    position: 'absolute',
    bottom: 57, // Поднято еще на 2px выше (55 + 2)
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
  },
  continueButton: {
    backgroundColor: '#191BDF', // Стили как у кнопки "План улучшений"
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 18, // Как у кнопки "Начать" на онбординге
    fontWeight: '500', // Как у кнопки "Начать" на онбординге
    fontFamily: Platform.select({
      ios: 'Manrope',
      android: 'Manrope',
      web: "'Manrope', sans-serif",
      default: 'Manrope',
    }),
    color: palette.white, // Как у кнопки "Начать" на онбординге
    textAlign: 'center',
  },
});
