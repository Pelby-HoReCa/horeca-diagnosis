import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Alert, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getCurrentUserId, getSelectedVenueId, getVenueScopedKey } from '../utils/userDataStorage';
import { SvgXml } from 'react-native-svg';
import AnimatedPressable from '../components/AnimatedPressable';
import { DEFAULT_BLOCKS } from '../data/diagnosisBlocks';
import questionsData from '../data/questions.json';
import { palette, spacing } from '../styles/theme';

interface RegisterScreen3Props {
  onContinue?: (selectedBlocks: string[]) => void;
  onSkip?: () => void;
  onBack?: () => void;
}

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const cardWidth = screenWidth - spacing.md * 2;

export default function RegisterScreen3({ onContinue, onSkip, onBack }: RegisterScreen3Props) {
  const navigation = useNavigation<any>();
  const [logoPlaceholderSvg, setLogoPlaceholderSvg] = useState<string>('');
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [venues, setVenues] = useState<Array<{ id: string; name: string; city: string; logoUri?: string | null }>>(
    []
  );
  const [radioInactiveSvg, setRadioInactiveSvg] = useState<string>('');
  const [radioActiveSvg, setRadioActiveSvg] = useState<string>('');
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
  const [toggleActiveSvg, setToggleActiveSvg] = useState<string>('');
  const [toggleInactiveSvg, setToggleInactiveSvg] = useState<string>('');
  const [gradientBottomImage, setGradientBottomImage] = useState<any>(null);
  // По умолчанию все блоки выбраны
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());

  const parseCityFromAddress = (address?: string) => {
    if (!address) {
      return 'город';
    }
    const firstPart = address.split(',')[0]?.trim();
    return firstPart || 'город';
  };

  const toggleSelectAll = () => {
    if (selectedBlocks.size === DEFAULT_BLOCKS.length) {
      setSelectedBlocks(new Set());
    } else {
      setSelectedBlocks(new Set(DEFAULT_BLOCKS.map((block) => block.id)));
    }
  };

  const toggleVenue = (venueId: string) => {
    setSelectedVenueId((prev) => (prev === venueId ? null : venueId));
    (async () => {
      try {
        const userId = await getCurrentUserId();
        await AsyncStorage.setItem('diagnosis_selected_venue_id', venueId);
        if (userId) {
          await AsyncStorage.setItem(`user_${userId}_diagnosis_selected_venue_id`, venueId);
        }
      } catch (error) {
        console.error('Ошибка сохранения выбранного проекта (tap):', error);
      }
    })();
  };

  // Функция для получения SVG иконки блока (как на дашборде)
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

  // Функция для подсчета количества вопросов в блоке
  const getQuestionCountForBlock = (blockId: string): number => {
    const blockData = (questionsData as any[]).find((block: any) => block.id === blockId);
    return blockData?.questions?.length || 0;
  };

  // Функция для подсчета общего количества вопросов из выбранных блоков
  const getTotalQuestionCount = (): number => {
    let total = 0;
    selectedBlocks.forEach(blockId => {
      total += getQuestionCountForBlock(blockId);
    });
    return total;
  };

  // Функция для правильного склонения слова "вопрос"
  const getQuestionWord = (count: number): string => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'вопросов';
    }
    if (lastDigit === 1) {
      return 'вопрос';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'вопроса';
    }
    return 'вопросов';
  };

  // Функция для переключения блока
  const toggleBlock = (blockId: string) => {
    setSelectedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  };

  // Функция для выбора всех блоков
  const selectAllBlocks = () => {
    if (selectedBlocks.size === DEFAULT_BLOCKS.length) {
      // Если все выбраны, снимаем выбор со всех
      setSelectedBlocks(new Set());
    } else {
      // Иначе выбираем все
      setSelectedBlocks(new Set(DEFAULT_BLOCKS.map(block => block.id)));
    }
  };

  useEffect(() => {
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
        console.error('Ошибка загрузки SVG заглушки логотипа (экран 3):', error);
      }
    };

    const loadRadioIcons = async () => {
      try {
        const inactiveAsset = Asset.fromModule(require('../../assets/images/radio-inactive-icon.svg'));
        await inactiveAsset.downloadAsync();
        if (inactiveAsset.localUri) {
          const response = await fetch(inactiveAsset.localUri);
          const fileContent = await response.text();
          setRadioInactiveSvg(fileContent);
        }

        const activeAsset = Asset.fromModule(require('../../assets/images/radio-active-icon.svg'));
        await activeAsset.downloadAsync();
        if (activeAsset.localUri) {
          const response = await fetch(activeAsset.localUri);
          const fileContent = await response.text();
          setRadioActiveSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконок радио:', error);
      }
    };

    const loadBlockIcons = async () => {
      try {
        const coinsAsset = Asset.fromModule(require('../../assets/images/coins-icon.svg'));
        await coinsAsset.downloadAsync();
        if (coinsAsset.localUri) {
          const response = await fetch(coinsAsset.localUri);
          const fileContent = await response.text();
          setCoinsIconSvg(fileContent);
        }

        const colorsAsset = Asset.fromModule(require('../../assets/images/colors-icon.svg'));
        await colorsAsset.downloadAsync();
        if (colorsAsset.localUri) {
          const response = await fetch(colorsAsset.localUri);
          const fileContent = await response.text();
          setColorsIconSvg(fileContent);
        }

        const chartBarLineAsset = Asset.fromModule(require('../../assets/images/chart-bar-line-icon.svg'));
        await chartBarLineAsset.downloadAsync();
        if (chartBarLineAsset.localUri) {
          const response = await fetch(chartBarLineAsset.localUri);
          const fileContent = await response.text();
          setChartBarLineIconSvg(fileContent);
        }

        const fileAsset = Asset.fromModule(require('../../assets/images/file-icon.svg'));
        await fileAsset.downloadAsync();
        if (fileAsset.localUri) {
          const response = await fetch(fileAsset.localUri);
          const fileContent = await response.text();
          setFileIconSvg(fileContent);
        }

        const marketingAsset = Asset.fromModule(require('../../assets/images/marketing-icon.svg'));
        await marketingAsset.downloadAsync();
        if (marketingAsset.localUri) {
          const response = await fetch(marketingAsset.localUri);
          const fileContent = await response.text();
          setMarketingIconSvg(fileContent);
        }

        const computerSettingsAsset = Asset.fromModule(require('../../assets/images/computer-settings-icon.svg'));
        await computerSettingsAsset.downloadAsync();
        if (computerSettingsAsset.localUri) {
          const response = await fetch(computerSettingsAsset.localUri);
          const fileContent = await response.text();
          setComputerSettingsIconSvg(fileContent);
        }

        const userMultipleAsset = Asset.fromModule(require('../../assets/images/user-multiple-icon.svg'));
        await userMultipleAsset.downloadAsync();
        if (userMultipleAsset.localUri) {
          const response = await fetch(userMultipleAsset.localUri);
          const fileContent = await response.text();
          setUserMultipleIconSvg(fileContent);
        }

        const dishWasherAsset = Asset.fromModule(require('../../assets/images/dish-washer-icon.svg'));
        await dishWasherAsset.downloadAsync();
        if (dishWasherAsset.localUri) {
          const response = await fetch(dishWasherAsset.localUri);
          const fileContent = await response.text();
          setDishWasherIconSvg(fileContent);
        }

        const legalDocumentAsset = Asset.fromModule(require('../../assets/images/legal-document-icon.svg'));
        await legalDocumentAsset.downloadAsync();
        if (legalDocumentAsset.localUri) {
          const response = await fetch(legalDocumentAsset.localUri);
          const fileContent = await response.text();
          setLegalDocumentIconSvg(fileContent);
        }

        const chartIncreaseAsset = Asset.fromModule(require('../../assets/images/chart-increase-icon.svg'));
        await chartIncreaseAsset.downloadAsync();
        if (chartIncreaseAsset.localUri) {
          const response = await fetch(chartIncreaseAsset.localUri);
          const fileContent = await response.text();
          setChartIncreaseIconSvg(fileContent);
        }

        // Загружаем переключатели
        const toggleActiveAsset = Asset.fromModule(require('../../assets/images/toggle-active.svg'));
        await toggleActiveAsset.downloadAsync();
        if (toggleActiveAsset.localUri) {
          const response = await fetch(toggleActiveAsset.localUri);
          const fileContent = await response.text();
          setToggleActiveSvg(fileContent);
        }

        const toggleInactiveAsset = Asset.fromModule(require('../../assets/images/toggle-inactive.svg'));
        await toggleInactiveAsset.downloadAsync();
        if (toggleInactiveAsset.localUri) {
          const response = await fetch(toggleInactiveAsset.localUri);
          const fileContent = await response.text();
          setToggleInactiveSvg(fileContent);
        }

        // Загружаем PNG градиент
        const gradientImage = require('../../assets/images/gradient-bottom.png');
        setGradientBottomImage(gradientImage);
      } catch (error) {
        console.error('Ошибка загрузки SVG иконок блоков:', error);
      }
    };

    loadLogoPlaceholderIcon();
    loadRadioIcons();
    loadBlockIcons();
  }, []);

  useEffect(() => {
    const loadVenues = async () => {
      try {
        const saved = await AsyncStorage.getItem('registrationStep2');
        if (!saved) {
          return;
        }
        const parsed = JSON.parse(saved);
        const restaurants = Array.isArray(parsed.restaurants) ? parsed.restaurants : [];
        const mapped = restaurants.map((restaurant: any, index: number) => {
          const name = restaurant?.name || 'Проект';
          const address = restaurant?.address || '';
          return {
            id: restaurant?.id || `venue_${index}`,
            name,
            city: parseCityFromAddress(address),
            logoUri: restaurant?.logoUri || null,
          };
        });
        if (mapped.length > 0) {
          setVenues(mapped);
          const userId = await getCurrentUserId();
          const savedVenueId = await getSelectedVenueId(userId);
          const exists = savedVenueId && mapped.some((venue) => venue.id === savedVenueId);
          setSelectedVenueId(exists ? savedVenueId : mapped[0].id);
        }
      } catch (error) {
        console.error('Ошибка загрузки заведений (шаг 3):', error);
      }
    };

    loadVenues();
  }, []);

  useEffect(() => {
    const persistSelectedVenue = async () => {
      try {
        const userId = await getCurrentUserId();
        if (selectedVenueId) {
          await AsyncStorage.setItem('diagnosis_selected_venue_id', selectedVenueId);
          if (userId) {
            await AsyncStorage.setItem(`user_${userId}_diagnosis_selected_venue_id`, selectedVenueId);
          }
        }
      } catch (error) {
        console.error('Ошибка сохранения выбранного проекта (шаг 3):', error);
      }
    };
    if (selectedVenueId) {
      persistSelectedVenue();
    }
  }, [selectedVenueId]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* Header: Back button, Step indicator and Skip button */}
          <View style={styles.header}>
            {onBack && (
              <TouchableOpacity
                onPress={() => {
                  if (onBack) {
                    onBack();
                    return;
                  }
                  navigation.navigate('Register2');
                }}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#0A0D14" />
              </TouchableOpacity>
            )}
            <View style={styles.stepIndicatorContainer}>
              <Text style={styles.stepIndicator}>3 / 3 ШАГ</Text>
            </View>
            <TouchableOpacity 
              onPress={() => {
                console.log('Кнопка Пропустить нажата на экране 3');
                if (onSkip) {
                  onSkip();
                }
              }} 
              style={styles.skipButton}
            >
              <Text style={styles.skipButtonText}>Пропустить</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.title}>Вы готовы{'\n'}к диагностике!</Text>

          {/* Description */}
          <Text style={styles.description}>
            Вы можете пройти полную диагностику или{'\n'}выбрать только нужные направления.
          </Text>

          {/* Подпись как у "Названия заведения" на втором экране */}
          <View style={styles.inputsContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Выберите заведение для диагностики</Text>
            </View>
          </View>

          {/* Карточка выбора заведения для диагностики */}
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
                  {/* Иконка заведения (как аватар на дашборде / логотип на 2 экране регистрации) */}
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

                  {/* Название и город — как проект и город на дашборде */}
                  <View style={styles.venueInfo}>
                    <Text style={styles.venueName}>{venue.name}</Text>
                    <Text style={styles.venueCity}>{venue.city}</Text>
                  </View>

                  {/* Переключатель выбора заведения */}
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

          {/* Направления диагностики */}
          <View style={styles.directionsHeader}>
            <Text style={styles.directionsTitle}>Направления диагностики</Text>
            <TouchableOpacity style={styles.selectAllButton} onPress={toggleSelectAll}>
              <Text style={styles.selectAllButtonText}>Выбрать все</Text>
            </TouchableOpacity>
          </View>

          {/* Блоки диагностики */}
          <View style={styles.blocksContainer}>
            {DEFAULT_BLOCKS.map((block) => {
              const blockIconSvg = getBlockIconSvg(block.id);
              const questionCount = getQuestionCountForBlock(block.id);

              const isSelected = selectedBlocks.has(block.id);

              return (
                <TouchableOpacity 
                  key={block.id} 
                  style={styles.blockCard}
                  onPress={() => toggleBlock(block.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.blockCardTopRow}>
                    <View style={styles.blockCardIconCircle}>
                      <View style={styles.blockCardIconScaled}>
                        {blockIconSvg ? (
                          <SvgXml xml={blockIconSvg} width={38} height={38} />
                        ) : (
                          <Ionicons name="cube-outline" size={38} color={palette.primaryBlue} />
                        )}
                      </View>
                    </View>
                    <View style={styles.blockCardTextContainer}>
                      <Text style={styles.blockCardTitle}>{block.title}</Text>
                      <Text style={styles.blockCardSubtitle}>{questionCount} вопросов</Text>
                    </View>
                    <View style={styles.blockCardToggle}>
                      <View style={styles.toggleContainer}>
                        {isSelected && toggleActiveSvg ? (
                          <SvgXml xml={toggleActiveSvg} width={38} height={32} style={styles.toggleSvgActive} />
                        ) : toggleInactiveSvg ? (
                          <SvgXml xml={toggleInactiveSvg} width={38} height={32} style={styles.toggleSvgInactive} />
                        ) : null}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
      {/* Градиент внизу экрана - ДО кнопки, от самого нижнего края */}
      {gradientBottomImage && (
        <Image 
          source={gradientBottomImage}
          style={styles.gradientBottomImage}
          resizeMode="stretch"
        />
      )}
      {/* Кнопка "Начать диагностику" - абсолютное позиционирование */}
      <View style={styles.startButtonContainer}>
        <AnimatedPressable
          style={styles.startButton}
          onPress={async () => {
            console.log('Кнопка "Начать диагностику" нажата');
            const selectedInOrder = DEFAULT_BLOCKS.map((block) => block.id).filter((id) =>
              selectedBlocks.has(id)
            );

            if (!selectedVenueId) {
              Alert.alert('Выберите заведение', 'Выберите проект для диагностики.');
              return;
            }
            if (selectedInOrder.length === 0) {
              Alert.alert('Выберите направления', 'Отметьте хотя бы одно направление диагностики.');
              return;
            }

            try {
              const userId = await getCurrentUserId();
              const payload = JSON.stringify(selectedInOrder);
              const selectedVenue = venues.find((venue) => venue.id === selectedVenueId);
              if (userId) {
                await AsyncStorage.setItem(
                  getVenueScopedKey('diagnosis_selected_blocks', userId, selectedVenueId),
                  payload
                );
              }
              await AsyncStorage.setItem(
                getVenueScopedKey('diagnosis_selected_blocks', null, selectedVenueId),
                payload
              );
              if (selectedVenueId) {
                await AsyncStorage.setItem('diagnosis_selected_venue_id', selectedVenueId);
                if (userId) {
                  await AsyncStorage.setItem(`user_${userId}_diagnosis_selected_venue_id`, selectedVenueId);
                }
                if (selectedVenue?.logoUri) {
                  await AsyncStorage.setItem('diagnosis_selected_venue_logo_uri', selectedVenue.logoUri);
                  if (userId) {
                    await AsyncStorage.setItem(
                      `user_${userId}_diagnosis_selected_venue_logo_uri`,
                      selectedVenue.logoUri
                    );
                  }
                }
              }
              const progressPayload = JSON.stringify({
                blockIndex: 0,
                questionIndex: 0,
                blockId: selectedInOrder[0],
                selectedBlocks: selectedInOrder,
              });
              if (userId) {
                await AsyncStorage.setItem(
                  getVenueScopedKey('diagnosis_progress', userId, selectedVenueId),
                  progressPayload
                );
              }
              await AsyncStorage.setItem(
                getVenueScopedKey('diagnosis_progress', null, selectedVenueId),
                progressPayload
              );
            } catch (error) {
              console.error('Ошибка сохранения выбранных направлений:', error);
            }

            if (onContinue) {
              onContinue(selectedInOrder);
            } else {
              console.error('onContinue не передан в RegisterScreen3');
            }
          }}
        >
          <Text style={styles.startButtonText}>Начать диагностику</Text>
          <Text style={styles.startButtonQuestionCount}>
            {getTotalQuestionCount()} {getQuestionWord(getTotalQuestionCount())}
          </Text>
        </AnimatedPressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.xl + 85,
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
    marginBottom: 15,
  },
  inputWrapper: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(10, 13, 20, 0.8)',
    fontFamily: 'Manrope-SemiBold',
    marginBottom: 0,
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
  venueLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  directionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 15,
  },
  directionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(10, 13, 20, 0.8)',
    fontFamily: 'Manrope-SemiBold',
  },
  selectAllButton: {
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: 0,
    marginLeft: 'auto',
  },
  selectAllButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#191BDF',
    fontFamily: 'Manrope-Medium',
    letterSpacing: 0.5,
  },
  blocksContainer: {
    marginTop: -2, // Поднято еще на 1px выше (-1 - 1)
  },
  blockCard: {
    width: cardWidth,
    height: 100, // Фиксированная высота для всех блоков
    backgroundColor: palette.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    padding: spacing.md,
    marginBottom: 15,
  },
  blockCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%', // Занимает всю высоту блока
  },
  blockCardToggle: {
    marginLeft: spacing.sm,
    alignSelf: 'center', // Выравнивание по центру вертикально
  },
  toggleContainer: {
    width: 38, // Точная ширина SVG
    height: 32, // Точная высота SVG
    position: 'relative',
    overflow: 'visible', // Позволяем видеть содержимое за пределами контейнера
  },
  toggleSvgActive: {
    position: 'absolute',
    top: 0,
    left: 0, // Активный SVG: тело начинается с x=2 в SVG
    width: 38,
    height: 32,
  },
  toggleSvgInactive: {
    position: 'absolute',
    top: 0,
    left: -6, // Неактивный SVG: тело начинается с x=8 в SVG, сдвигаем на -6px чтобы выровнять с активным
    width: 38,
    height: 32,
  },
  blockCardIconCircle: {
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
  blockCardIconScaled: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 0.65 }],
  },
  blockCardTextContainer: {
    flex: 1,
  },
  blockCardTitle: {
    fontSize: 16,
    fontWeight: '500', // Увеличено на 100 (400 -> 500)
    color: '#0A0D14',
    fontFamily: 'Manrope-Medium', // Соответствует fontWeight '500'
    marginBottom: spacing.xxs,
  },
  blockCardSubtitle: {
    fontSize: 14,
    fontWeight: '300',
    color: palette.gray600,
    fontFamily: 'Manrope-Light',
  },
  gradientBottomImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: screenWidth,
    height: 175,
    opacity: 0.6,
    zIndex: 1,
    pointerEvents: 'none',
  },
  startButtonContainer: {
    position: 'absolute',
    bottom: 57, // Такое же позиционирование как на RegisterScreen2
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    zIndex: 20, // Поверх градиента
  },
  startButton: {
    backgroundColor: '#191BDF', // Стили как у кнопки "Продолжить"
    height: 56, // Фиксированная высота как у кнопки "Продолжить" на RegisterScreen1
    paddingHorizontal: spacing.lg,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 18, // Как у кнопки "Продолжить"
    fontWeight: '500', // Как у кнопки "Продолжить"
    fontFamily: Platform.select({
      ios: 'Manrope',
      android: 'Manrope',
      web: "'Manrope', sans-serif",
      default: 'Manrope',
    }),
    color: palette.white, // Как у кнопки "Продолжить"
    textAlign: 'center',
    marginTop: 1, // Опущено на 3px ниже (-2 + 3 = 1)
  },
  startButtonQuestionCount: {
    fontSize: 14, // Как у blockCardSubtitle
    fontWeight: '500', // Увеличено на 100 (400 -> 500)
    color: 'rgba(255, 255, 255, 0.7)', // Полупрозрачный белый для контраста на синем фоне
    fontFamily: 'Manrope-Medium', // Соответствует fontWeight '500'
    textAlign: 'center',
    marginTop: -1, // Уменьшено еще на 1px (0 - 1 = -1)
  },
});
