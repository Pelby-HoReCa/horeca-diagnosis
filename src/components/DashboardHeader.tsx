import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import AnimatedPressable from './AnimatedPressable';
import { getCurrentUserId, loadUserQuestionnaire } from '../utils/userDataStorage';
import { getCityFromAddress } from '../utils/address';
import { palette, spacing } from '../styles/theme';

interface DashboardHeaderProps {
  navigation: any;
  onHeaderPress?: () => void;
  selectedVenueId?: string | null;
  leftContent?: ReactNode;
  compact?: boolean;
}

const getValidLogoUri = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  return trimmed;
};

export default function DashboardHeader({
  navigation,
  onHeaderPress,
  selectedVenueId,
  leftContent,
  compact = false,
}: DashboardHeaderProps) {
  const [projectAvatarUri, setProjectAvatarUri] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('Проект');
  const [city, setCity] = useState<string>('');
  const [cityIconSvg, setCityIconSvg] = useState<string>('');
  const [helpButtonIconSvg, setHelpButtonIconSvg] = useState<string>('');
  const [headerReady, setHeaderReady] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Загружаем данные профиля
        const userId = await getCurrentUserId();
        let newCity = 'город';
        let newAvatar: string | null = null;
        let newProjectName = 'Проект';
        let fallbackLogo: string | null = null;
        let questionnaireData: any = null;
        let restaurants: any[] = [];

        const registrationRaw = await AsyncStorage.getItem('registrationStep2');
        if (registrationRaw) {
          const registrationData = JSON.parse(registrationRaw);
          if (registrationData?.restaurantName) {
            newProjectName = registrationData.restaurantName;
          }
          fallbackLogo = getValidLogoUri(
            registrationData?.logoUri || registrationData?.projectLogoUri || registrationData?.logo
          );
          restaurants = Array.isArray(registrationData?.restaurants) ? registrationData.restaurants : [];
        }

        if (userId) {
          questionnaireData = await loadUserQuestionnaire(userId);
          const questionnaireRestaurants = Array.isArray(questionnaireData?.restaurants)
            ? questionnaireData.restaurants
            : [];
          if (restaurants.length === 0) {
            restaurants = questionnaireRestaurants;
          }
          if (questionnaireData?.restaurantName) {
            newProjectName = questionnaireData.restaurantName;
          }
          fallbackLogo =
            getValidLogoUri(
              questionnaireData?.projectLogoUri || questionnaireData?.logoUri || questionnaireData?.logo
            ) || fallbackLogo;
        }

        const normalizedRestaurants = restaurants.map((venue: any, index: number) => ({
          id: venue?.id || `venue_${index}`,
          name: venue?.name || newProjectName || 'Проект',
          address: venue?.address || '',
          logoUri: getValidLogoUri(venue?.logoUri || venue?.projectLogoUri || venue?.logo) || fallbackLogo,
        }));

        if (normalizedRestaurants.length > 0) {
          const storedVenueId =
            (await AsyncStorage.getItem(`user_${userId}_diagnosis_selected_venue_id`)) ||
            (await AsyncStorage.getItem('diagnosis_selected_venue_id'));
          const effectiveVenueId = selectedVenueId || storedVenueId;
          const selectedVenue =
            normalizedRestaurants.find((venue: any) => venue.id === effectiveVenueId) ||
            normalizedRestaurants[0];

          if (selectedVenue?.address) {
            const cityPart = getCityFromAddress(selectedVenue.address, 'город');
            if (cityPart) {
              newCity = cityPart;
            }
          } else if (questionnaireData?.city) {
            newCity = questionnaireData.city;
          }

          if (selectedVenue?.name) {
            newProjectName = selectedVenue.name;
          }

          if (selectedVenue?.logoUri) {
            newAvatar = selectedVenue.logoUri;
          }
        } else if (questionnaireData?.city) {
          newCity = questionnaireData.city;
        }

        if (!newAvatar) {
          const savedSelectedLogo =
            (userId && (await AsyncStorage.getItem(`user_${userId}_diagnosis_selected_venue_logo_uri`))) ||
            (await AsyncStorage.getItem('diagnosis_selected_venue_logo_uri')) ||
            (await AsyncStorage.getItem('projectAvatar'));
          if (savedSelectedLogo || fallbackLogo) {
            newAvatar = getValidLogoUri(savedSelectedLogo) || fallbackLogo;
          }
        }

        // Загружаем иконки
        const [cityIconContent, helpIconContent] = await Promise.all([
          (async () => {
            try {
              const iconAsset = Asset.fromModule(require('../../assets/images/arrow-down-city.svg'));
              await iconAsset.downloadAsync();
              if (iconAsset.localUri) {
                const response = await fetch(iconAsset.localUri);
                return await response.text();
              }
            } catch (error) {
              console.error('Ошибка загрузки SVG иконки города:', error);
            }
            return '';
          })(),
          (async () => {
            try {
              const iconAsset = Asset.fromModule(require('../../assets/images/help-button-icon.svg'));
              await iconAsset.downloadAsync();
              if (iconAsset.localUri) {
                const response = await fetch(iconAsset.localUri);
                return await response.text();
              }
            } catch (error) {
              console.error('Ошибка загрузки SVG иконки кнопки помощи:', error);
            }
            return '';
          })()
        ]);

        // Обновляем все состояния ОДНОВРЕМЕННО
        setCity(newCity);
        setProjectName(newProjectName);
        setProjectAvatarUri(newAvatar);
        setCityIconSvg(cityIconContent);
        setHelpButtonIconSvg(helpIconContent);
        setHeaderReady(true);
      } catch (error) {
        console.error('Ошибка загрузки данных шапки:', error);
      }
    };

    loadData();
    const unsubscribe = navigation?.addListener?.('focus', loadData);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [navigation, selectedVenueId]);

  // Мемоизируем JSX шапки
  const headerJSX = useMemo(() => {
    return (
      <View style={[styles.section, styles.profileSection, compact && styles.profileSectionCompact]}>
        {leftContent ? (
          <View style={styles.customLeftContentWrap}>{leftContent}</View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.profileInfo, pressed && styles.profileInfoPressed]}
            onPress={() => onHeaderPress?.()}
          >
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
            <View style={[styles.projectInfo, !headerReady && styles.headerHidden]}>
              <Text style={styles.projectName}>{projectName || 'Проект'}</Text>
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
          </Pressable>
        )}
        
        {/* Кнопка Помощь PELBY */}
        <AnimatedPressable 
          style={[styles.helpButton, !headerReady && styles.headerHidden]}
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
  }, [
    projectAvatarUri,
    projectName,
    city,
    cityIconSvg,
    helpButtonIconSvg,
    navigation,
    onHeaderPress,
    leftContent,
    headerReady,
    compact,
  ]);

  return headerJSX;
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
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
  profileSectionCompact: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm - 15,
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
  },
  projectName: {
    fontSize: 18,
    fontWeight: '400',
    color: '#0A0D14',
    lineHeight: 22,
    marginBottom: spacing.xxs,
    marginTop: 1,
    marginLeft: -1,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
    minHeight: 22,
    minWidth: 60,
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 18,
  },
  cityText: {
    fontSize: 16,
    color: palette.gray600,
    fontWeight: '300',
    marginRight: 2,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
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
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FD680A',
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 6,
    height: 32,
    borderRadius: 999,
    minWidth: 110,
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
    textAlign: 'center',
    transform: [{ translateY: 0 }],
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
    minHeight: 16,
    flexShrink: 1,
  },
  headerHidden: {
    opacity: 0,
  },
  profileInfoPressed: {
    opacity: 0.6,
  },
  customLeftContentWrap: {
    flex: 1,
    justifyContent: 'center',
  },
});
