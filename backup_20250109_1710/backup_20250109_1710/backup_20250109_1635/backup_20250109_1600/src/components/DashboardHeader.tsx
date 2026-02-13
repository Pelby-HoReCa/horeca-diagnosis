import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import AnimatedPressable from './AnimatedPressable';
import { getCurrentUserId, loadUserQuestionnaire } from '../utils/userDataStorage';
import { palette, spacing } from '../styles/theme';

interface DashboardHeaderProps {
  navigation: any;
}

export default function DashboardHeader({ navigation }: DashboardHeaderProps) {
  const [projectAvatarUri, setProjectAvatarUri] = useState<string | null>(null);
  const [city, setCity] = useState<string>('');
  const [cityIconSvg, setCityIconSvg] = useState<string>('');
  const [helpButtonIconSvg, setHelpButtonIconSvg] = useState<string>('');
  
  const dataLoadedRef = useRef(false);

  useEffect(() => {
    if (dataLoadedRef.current) {
      return; // Уже загружено
    }

    const loadData = async () => {
      try {
        // Загружаем данные профиля
        const userId = await getCurrentUserId();
        let newCity = 'город';
        let newAvatar: string | null = null;

        if (userId) {
          const questionnaireData = await loadUserQuestionnaire(userId);
          if (questionnaireData && questionnaireData.city) {
            newCity = questionnaireData.city;
          }
        }

        const savedProjectAvatar = await AsyncStorage.getItem('projectAvatar');
        if (savedProjectAvatar) {
          newAvatar = savedProjectAvatar;
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
        setProjectAvatarUri(newAvatar);
        setCityIconSvg(cityIconContent);
        setHelpButtonIconSvg(helpIconContent);

        dataLoadedRef.current = true;
      } catch (error) {
        console.error('Ошибка загрузки данных шапки:', error);
        dataLoadedRef.current = true;
      }
    };

    loadData();
  }, []);

  // Мемоизируем JSX шапки
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
    minHeight: 22,
    minWidth: 60,
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 18,
  },
  cityText: {
    fontSize: 14,
    color: palette.gray600,
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
    minHeight: 16,
    minWidth: 90,
  },
});
