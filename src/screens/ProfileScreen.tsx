import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated as RNAnimated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AnimatedPressable from '../components/AnimatedPressable';
import { getUserData } from '../utils/api';
import { getCurrentUserId, loadUserQuestionnaire } from '../utils/userDataStorage';
import { getCityFromAddress } from '../utils/address';
import { palette, spacing } from '../styles/theme';

const PROFILE_AVATAR_RESET_ONCE_KEY = 'profile_avatar_reset_once_v1';
const ENABLE_DIAGNOSTICS_RESET_ACTION = false;
const PROFILE_OPEN_NOTIFICATIONS_ONCE_KEY = 'profile_open_notifications_once';

const DIAGNOSTICS_RESET_PATTERNS = [
  'diagnosis_answers_',
  'diagnosis_answers_backup_',
  'diagnosis_progress',
  'diagnosis_repeat_mode',
  'diagnosis_selected_blocks',
  'diagnosis_block_results',
  'diagnosis_block_results_by_venue',
  'diagnosisBlocks',
  'actionPlanTasks',
  'actionPlanSubtasks',
  'diagnosis_history',
  'diagnosis_notes',
  'userDiagnosisHistory',
  'surveyHistory',
  'dashboardAllBlocksCompleted',
  'dashboardPreviousResult',
  'dashboardCurrentResult',
];

interface VenueItem {
  id: string;
  name: string;
  city: string;
  logoUri: string | null;
}

const getValidLogoUri = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  return trimmed;
};

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [settingsIconSvg, setSettingsIconSvg] = useState('');
  const [addVenueIconSvg, setAddVenueIconSvg] = useState('');
  const [editVenueIconSvg, setEditVenueIconSvg] = useState('');
  const [historySettingIconSvg, setHistorySettingIconSvg] = useState('');
  const [notificationsSettingIconSvg, setNotificationsSettingIconSvg] = useState('');
  const [contactSettingIconSvg, setContactSettingIconSvg] = useState('');
  const [documentsSettingIconSvg, setDocumentsSettingIconSvg] = useState('');
  const [resetDataSettingIconSvg, setResetDataSettingIconSvg] = useState('');
  const [deleteAccountSettingIconSvg, setDeleteAccountSettingIconSvg] = useState('');
  const [rightArrowIconSvg, setRightArrowIconSvg] = useState('');
  const [avatarPlaceholderSvg, setAvatarPlaceholderSvg] = useState('');
  const [modalCloseIconSvg, setModalCloseIconSvg] = useState('');
  const [radioActiveSvg, setRadioActiveSvg] = useState('');
  const [radioInactiveSvg, setRadioInactiveSvg] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [totalDiagnosticsCount, setTotalDiagnosticsCount] = useState(0);
  const [showResetDataModal, setShowResetDataModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const notificationsSlideAnim = useRef(new RNAnimated.Value(420)).current;
  const [notificationFrequency, setNotificationFrequency] = useState<
    'yearly' | 'halfYear' | 'quarter' | 'monthly' | 'biweekly' | 'weekly'
  >('monthly');

  const displayName = useMemo(() => fullName.trim() || 'Имя и фамилия', [fullName]);
  const displayPhone = useMemo(() => {
    const raw = phone.trim();
    if (!raw) return '';
    if (raw.startsWith('+7')) return raw;

    if (raw.includes('(') || raw.includes(')')) {
      return `+7 ${raw}`;
    }

    const digitsOnly = raw.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      return `+7 (${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 8)}-${digitsOnly.slice(8, 10)}`;
    }

    if (digitsOnly.length === 11 && digitsOnly.startsWith('7')) {
      const d = digitsOnly.slice(1);
      return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
    }

    if (digitsOnly.length === 11 && digitsOnly.startsWith('8')) {
      const d = digitsOnly.slice(1);
      return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
    }

    return raw;
  }, [phone]);
  const showSeparator = Boolean(displayPhone && email.trim());
  const parseCityFromAddress = (address?: string) => {
    return getCityFromAddress(address, '');
  };

  useEffect(() => {
    const loadIcons = async () => {
      try {
        const settingsAsset = Asset.fromModule(require('../../assets/images/Frame 33 (1).svg'));
        await settingsAsset.downloadAsync();
        if (settingsAsset.localUri) {
          const settingsResponse = await fetch(settingsAsset.localUri);
          setSettingsIconSvg(await settingsResponse.text());
        }

        const placeholderAsset = Asset.fromModule(
          require('../../assets/images/restaurant-avatar-placeholder.svg')
        );
        await placeholderAsset.downloadAsync();
        if (placeholderAsset.localUri) {
          const placeholderResponse = await fetch(placeholderAsset.localUri);
          const rawSvg = await placeholderResponse.text();
          const cleanedSvg = rawSvg.replace(/<rect[^>]*stroke="#E2E4E9"[^>]*\/>/i, '');
          setAvatarPlaceholderSvg(cleanedSvg);
        }

        const addVenueAsset = Asset.fromModule(
          require('../../assets/images/arrow-right-s-line (2).svg')
        );
        await addVenueAsset.downloadAsync();
        if (addVenueAsset.localUri) {
          const addVenueResponse = await fetch(addVenueAsset.localUri);
          setAddVenueIconSvg(await addVenueResponse.text());
        }

        const editVenueAsset = Asset.fromModule(require('../../assets/images/edit-line.svg'));
        await editVenueAsset.downloadAsync();
        if (editVenueAsset.localUri) {
          const editVenueResponse = await fetch(editVenueAsset.localUri);
          setEditVenueIconSvg(await editVenueResponse.text());
        }

        const historySettingAsset = Asset.fromModule(
          require('../../assets/images/Frame 33 (1) — копия.svg')
        );
        await historySettingAsset.downloadAsync();
        if (historySettingAsset.localUri) {
          const historySettingResponse = await fetch(historySettingAsset.localUri);
          setHistorySettingIconSvg(await historySettingResponse.text());
        }

        const notificationsSettingAsset = Asset.fromModule(
          require('../../assets/images/Frame 33 (1) — копия 2.svg')
        );
        await notificationsSettingAsset.downloadAsync();
        if (notificationsSettingAsset.localUri) {
          const notificationsSettingResponse = await fetch(notificationsSettingAsset.localUri);
          setNotificationsSettingIconSvg(await notificationsSettingResponse.text());
        }

        const contactSettingAsset = Asset.fromModule(
          require('../../assets/images/Frame 33 (1) — копия 3.svg')
        );
        await contactSettingAsset.downloadAsync();
        if (contactSettingAsset.localUri) {
          const contactSettingResponse = await fetch(contactSettingAsset.localUri);
          setContactSettingIconSvg(await contactSettingResponse.text());
        }

        const documentsSettingAsset = Asset.fromModule(
          require('../../assets/images/Frame 33 (1) — копия 4.svg')
        );
        await documentsSettingAsset.downloadAsync();
        if (documentsSettingAsset.localUri) {
          const documentsSettingResponse = await fetch(documentsSettingAsset.localUri);
          setDocumentsSettingIconSvg(await documentsSettingResponse.text());
        }

        const resetDataSettingAsset = Asset.fromModule(
          require('../../assets/images/Frame 33 (1) — копия 5.svg')
        );
        await resetDataSettingAsset.downloadAsync();
        if (resetDataSettingAsset.localUri) {
          const resetDataSettingResponse = await fetch(resetDataSettingAsset.localUri);
          setResetDataSettingIconSvg(await resetDataSettingResponse.text());
        }

        const deleteAccountSettingAsset = Asset.fromModule(
          require('../../assets/images/Buttons [1.0] (1).svg')
        );
        await deleteAccountSettingAsset.downloadAsync();
        if (deleteAccountSettingAsset.localUri) {
          const deleteAccountSettingResponse = await fetch(deleteAccountSettingAsset.localUri);
          setDeleteAccountSettingIconSvg(await deleteAccountSettingResponse.text());
        }

        const rightArrowAsset = Asset.fromModule(require('../../assets/images/arrow-right-s-line.svg'));
        await rightArrowAsset.downloadAsync();
        if (rightArrowAsset.localUri) {
          const rightArrowResponse = await fetch(rightArrowAsset.localUri);
          setRightArrowIconSvg(await rightArrowResponse.text());
        }

        const closeIconAsset = Asset.fromModule(require('../../assets/images/compact-button-icon.svg'));
        await closeIconAsset.downloadAsync();
        if (closeIconAsset.localUri) {
          const closeIconResponse = await fetch(closeIconAsset.localUri);
          setModalCloseIconSvg(await closeIconResponse.text());
        }

        const radioActiveAsset = Asset.fromModule(require('../../assets/images/radio-active-icon.svg'));
        await radioActiveAsset.downloadAsync();
        if (radioActiveAsset.localUri) {
          const radioActiveResponse = await fetch(radioActiveAsset.localUri);
          setRadioActiveSvg(await radioActiveResponse.text());
        }

        const radioInactiveAsset = Asset.fromModule(
          require('../../assets/images/radio-inactive-icon.svg')
        );
        await radioInactiveAsset.downloadAsync();
        if (radioInactiveAsset.localUri) {
          const radioInactiveResponse = await fetch(radioInactiveAsset.localUri);
          setRadioInactiveSvg(await radioInactiveResponse.text());
        }
      } catch (error) {
        console.error('Ошибка загрузки иконок профиля:', error);
      }
    };

    loadIcons();
  }, []);

  const loadProfileData = useCallback(async () => {
      try {
        // Разовый сброс текущей авы для теста (не затрагивает другие данные)
        const resetDone = await AsyncStorage.getItem(PROFILE_AVATAR_RESET_ONCE_KEY);
        if (!resetDone) {
          const resetUserId = await getCurrentUserId();
          const avatarKeysToRemove = ['userAvatar', 'profile_avatar_uri'];
          if (resetUserId) {
            avatarKeysToRemove.push(`user_${resetUserId}_profile_avatar_uri`);
          }
          await AsyncStorage.multiRemove(avatarKeysToRemove);
          await AsyncStorage.setItem(PROFILE_AVATAR_RESET_ONCE_KEY, 'true');
        }

        const user = await getUserData();
        if (user?.fullName) setFullName(user.fullName);
        if (user?.phone) setPhone(user.phone);
        if (user?.email) setEmail(user.email);

        if (!user?.fullName || !user?.phone || !user?.email) {
          const registrationRaw = await AsyncStorage.getItem('registrationStep1');
          if (registrationRaw) {
            const registration = JSON.parse(registrationRaw);
            if (!user?.fullName && registration?.fullName) {
              setFullName(registration.fullName);
            }
            if (!user?.phone && registration?.phone) {
              setPhone(registration.phone);
            }
            if (!user?.email && registration?.email) {
              setEmail(registration.email);
            }
          }
        }

        const userId = await getCurrentUserId();
        const avatarKey = userId ? `user_${userId}_profile_avatar_uri` : 'profile_avatar_uri';
        const savedAvatar =
          (await AsyncStorage.getItem(avatarKey)) || (await AsyncStorage.getItem('userAvatar'));
        if (savedAvatar) {
          setAvatarUri(savedAvatar);
        }

        let restaurants: any[] = [];
        let fallbackName = user?.projectName || user?.restaurantName || 'Проект';
        let fallbackAddress = user?.address || '';
        let fallbackLogo: string | null = null;

        const registrationStep2 = await AsyncStorage.getItem('registrationStep2');
        if (registrationStep2) {
          const parsed = JSON.parse(registrationStep2);
          restaurants = Array.isArray(parsed?.restaurants) ? parsed.restaurants : [];
          fallbackName = parsed?.restaurantName || fallbackName;
          fallbackAddress = parsed?.address || fallbackAddress;
          fallbackLogo = parsed?.logoUri || parsed?.projectLogoUri || fallbackLogo;
        }

        if (userId) {
          const questionnaire = await loadUserQuestionnaire(userId);
          if (questionnaire) {
            if (!restaurants.length) {
              restaurants = Array.isArray(questionnaire?.restaurants) ? questionnaire.restaurants : [];
            }
            fallbackName = questionnaire?.restaurantName || fallbackName;
            fallbackAddress = questionnaire?.address || fallbackAddress;
            fallbackLogo =
              questionnaire?.projectLogoUri || questionnaire?.logoUri || fallbackLogo || null;
          }
        }

        if (!restaurants.length && (fallbackName || fallbackAddress || fallbackLogo)) {
          restaurants = [
            {
              id: 'venue_0',
              name: fallbackName || 'Проект',
              address: fallbackAddress || '',
              logoUri: fallbackLogo,
            },
          ];
        }

        const mappedVenues: VenueItem[] = restaurants.map((restaurant: any, index: number) => ({
          id: restaurant?.id || `venue_${index}`,
          name: restaurant?.name || fallbackName || 'Проект',
          city: parseCityFromAddress(restaurant?.address || fallbackAddress),
          logoUri: getValidLogoUri(
            restaurant?.logoUri || restaurant?.projectLogoUri || restaurant?.logo || fallbackLogo || null
          ),
        }));
        setVenues(mappedVenues);

        if (userId) {
          const uniqueHistoryEntries = new Set<string>();
          const historyKeys = mappedVenues.flatMap((venue) => [
            `user_${userId}_diagnosis_history_${venue.id}`,
            `diagnosis_history_${venue.id}`,
          ]);
          const debugCounts: Record<string, number> = {};

          for (const historyKey of historyKeys) {
            try {
              const historyRaw = await AsyncStorage.getItem(historyKey);
              const history = historyRaw ? JSON.parse(historyRaw) : [];
              if (!Array.isArray(history)) {
                continue;
              }

              debugCounts[historyKey] = history.length;

              history.forEach((entry, index) => {
                if (entry && typeof entry === 'object') {
                  const objectEntry = entry as Record<string, unknown>;
                  const signature = JSON.stringify({
                    createdAt:
                      typeof objectEntry.createdAt === 'string' ? objectEntry.createdAt : null,
                    efficiency:
                      typeof objectEntry.efficiency === 'number' ? objectEntry.efficiency : null,
                    blockEfficiencies:
                      objectEntry.blockEfficiencies &&
                      typeof objectEntry.blockEfficiencies === 'object'
                        ? objectEntry.blockEfficiencies
                        : null,
                  });
                  const dedupeKey =
                    signature ||
                    (typeof objectEntry.createdAt === 'string' && objectEntry.createdAt) ||
                    (typeof objectEntry.timestamp === 'number' && String(objectEntry.timestamp)) ||
                    `${historyKey}:${index}:${JSON.stringify(objectEntry)}`;
                  uniqueHistoryEntries.add(dedupeKey);
                  return;
                }

                uniqueHistoryEntries.add(`${historyKey}:${index}:${String(entry)}`);
              });
            } catch (parseError) {
              console.error(`Ошибка чтения истории диагностики (${historyKey}):`, parseError);
            }
          }

          console.log('profile_history_debug_keys', historyKeys);
          console.log('profile_history_debug_counts', debugCounts);
          console.log('profile_history_debug_unique_total', uniqueHistoryEntries.size);
          setTotalDiagnosticsCount(uniqueHistoryEntries.size);
        } else {
          setTotalDiagnosticsCount(0);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных профиля:', error);
      }
    }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const pending = await AsyncStorage.getItem(PROFILE_OPEN_NOTIFICATIONS_ONCE_KEY);
          if (!pending || cancelled) return;
          await AsyncStorage.removeItem(PROFILE_OPEN_NOTIFICATIONS_ONCE_KEY);
          if (!cancelled) {
            setShowNotificationsModal(true);
          }
        } catch (error) {
          console.error('Ошибка открытия модалки уведомлений из внешнего перехода:', error);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Доступ к галерее', 'Разрешите доступ к галерее, чтобы загрузить фото.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      const nextUri = result.assets[0].uri;
      setAvatarUri(nextUri);

      const userId = await getCurrentUserId();
      const avatarKey = userId ? `user_${userId}_profile_avatar_uri` : 'profile_avatar_uri';
      await AsyncStorage.setItem(avatarKey, nextUri);
      await AsyncStorage.setItem('userAvatar', nextUri);
    } catch (error) {
      console.error('Ошибка выбора фото профиля:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить фото. Попробуйте снова.');
    }
  };

  const handleRemoveAvatar = useCallback(() => {
    Alert.alert(
      'Удалить фото профиля?',
      'Фотография будет удалена из профиля.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                const userId = await getCurrentUserId();
                const keysToRemove = ['userAvatar', 'profile_avatar_uri'];
                if (userId) {
                  keysToRemove.push(`user_${userId}_profile_avatar_uri`);
                }
                await AsyncStorage.multiRemove(keysToRemove);
                setAvatarUri(null);
              } catch (error) {
                console.error('Ошибка удаления фото профиля:', error);
                Alert.alert('Ошибка', 'Не удалось удалить фото. Попробуйте снова.');
              }
            })();
          },
        },
      ]
    );
  }, []);

  const handleConfirmDeleteAccount = useCallback(() => {
    // Тестовый режим: пока без удаления данных.
    setShowDeleteAccountModal(false);
  }, []);

  const handleConfirmResetDiagnostics = useCallback(async () => {
    setShowResetDataModal(false);

    // Тестовый режим: пока без сброса данных.
    if (!ENABLE_DIAGNOSTICS_RESET_ACTION) {
      return;
    }

    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToReset = allKeys.filter((key) =>
        DIAGNOSTICS_RESET_PATTERNS.some((pattern) => key.includes(pattern))
      );

      if (keysToReset.length > 0) {
        await AsyncStorage.multiRemove(Array.from(new Set(keysToReset)));
      }

      await loadProfileData();
    } catch (error) {
      console.error('Ошибка сброса диагностических данных:', error);
    }
  }, [loadProfileData]);

  const notificationsSubtitle = useMemo(() => {
    if (notificationFrequency === 'yearly') return 'раз в год';
    if (notificationFrequency === 'halfYear') return 'раз в пол года';
    if (notificationFrequency === 'quarter') return 'раз в 3 месяца';
    if (notificationFrequency === 'biweekly') return 'раз в 2 недели';
    if (notificationFrequency === 'weekly') return 'раз в неделю';
    return 'раз в месяц';
  }, [notificationFrequency]);

  const handleOpenNotifications = useCallback(() => {
    setShowNotificationsModal(true);
  }, []);

  const handleCloseNotifications = useCallback(() => {
    if (!showNotificationsModal) return;

    RNAnimated.timing(notificationsSlideAnim, {
      toValue: 420,
      duration: 210,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setShowNotificationsModal(false);
      }
    });
  }, [notificationsSlideAnim, showNotificationsModal]);

  useEffect(() => {
    if (!showNotificationsModal) return;

    notificationsSlideAnim.setValue(420);
    RNAnimated.timing(notificationsSlideAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [notificationsSlideAnim, showNotificationsModal]);

  const handleOpenDiagnosisHistory = useCallback(async () => {
    try {
      navigation.navigate('Главная', {
        screen: 'DiagnosisHistory',
        params: { from: 'profile' },
      });
    } catch (error) {
      console.error('Ошибка перехода к истории диагностик:', error);
      await AsyncStorage.setItem('pendingTab', 'Главная');
      navigation.navigate('Главная');
    }
  }, [navigation]);

  const handleOpenPersonalDataConsent = useCallback(() => {
    navigation.navigate('PersonalDataPolicy', { origin: 'profile' });
  }, [navigation]);

  const hasProfileIdentity = Boolean(
    fullName.trim() || phone.trim() || email.trim() || avatarUri
  );
  const hasUserVenues = venues.length > 0;
  const showUnregisteredProfileView = !hasProfileIdentity && !hasUserVenues;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Профиль</Text>
          <AnimatedPressable
            style={styles.headerIconContainer}
            onPress={() => navigation.navigate('EditProfile')}
          >
            {settingsIconSvg ? <SvgXml xml={settingsIconSvg} width={37} height={37} /> : null}
          </AnimatedPressable>
        </View>

        {showUnregisteredProfileView ? (
          <>
            <AnimatedPressable
              style={styles.profileQuickActionRow}
              onPress={() => navigation.navigate('EditProfile', { startEmpty: true })}
            >
              <Text style={styles.profileQuickActionTitle}>Мои данные</Text>
              <View style={styles.profileQuickActionIconWrap}>
                {addVenueIconSvg ? (
                  <SvgXml xml={addVenueIconSvg} width={27} height={27} />
                ) : (
                  <Text style={styles.profileQuickActionIconFallback}>+</Text>
                )}
              </View>
            </AnimatedPressable>
            <View style={styles.profileQuickActionDivider} />

            <AnimatedPressable
              style={styles.profileQuickActionRow}
              onPress={() => navigation.navigate('AddProject')}
            >
              <Text style={styles.profileQuickActionTitle}>Мои заведения</Text>
              <View style={styles.profileQuickActionIconWrap}>
                {addVenueIconSvg ? (
                  <SvgXml xml={addVenueIconSvg} width={27} height={27} />
                ) : (
                  <Text style={styles.profileQuickActionIconFallback}>+</Text>
                )}
              </View>
            </AnimatedPressable>
            <View style={styles.profileQuickActionDivider} />
          </>
        ) : (
          <>
            <View style={styles.avatarContainer}>
              <TouchableOpacity style={styles.avatarButton} activeOpacity={0.9} onPress={handlePickAvatar}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : avatarPlaceholderSvg ? (
                  <SvgXml xml={avatarPlaceholderSvg} width={120} height={120} />
                ) : (
                  <View style={styles.avatarFallback} />
                )}
              </TouchableOpacity>
              {avatarUri ? (
                <TouchableOpacity
                  style={styles.avatarRemoveButton}
                  activeOpacity={0.85}
                  onPress={handleRemoveAvatar}
                >
                  <Ionicons name="trash-outline" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.profileName}>{displayName}</Text>
            <View style={styles.contactsRow}>
              {!!displayPhone && <Text style={styles.contactText}>{displayPhone}</Text>}
              {showSeparator && <Text style={styles.contactSeparator}>  •  </Text>}
              {!!email && <Text style={styles.contactText}>{email}</Text>}
            </View>

            <View style={styles.venuesHeader}>
              <Text style={styles.venuesTitle}>Мои заведения</Text>
              <AnimatedPressable
                style={styles.addVenueButton}
                onPress={() => navigation.navigate('AddProject')}
              >
                {addVenueIconSvg ? <SvgXml xml={addVenueIconSvg} width={27} height={27} /> : null}
              </AnimatedPressable>
            </View>

            <View style={styles.venuesCard}>
              {venues.map((venue, index) => (
                <View key={venue.id} style={[styles.venueRow, index > 0 && styles.venueRowDivider]}>
                  <View style={styles.venueLeft}>
                    <View style={styles.venueLogoWrap}>
                      {venue.logoUri ? (
                        <Image source={{ uri: venue.logoUri }} style={styles.venueLogoImage} />
                      ) : avatarPlaceholderSvg ? (
                        <SvgXml xml={avatarPlaceholderSvg} width={45} height={45} />
                      ) : (
                        <View style={styles.venueLogoFallback} />
                      )}
                    </View>
                    <View style={styles.venueTextWrap}>
                      <Text style={styles.venueName} numberOfLines={1}>
                        {venue.name}
                      </Text>
                      <Text style={styles.venueCity} numberOfLines={1}>
                        {venue.city || '—'}
                      </Text>
                    </View>
                  </View>
                  <AnimatedPressable
                    style={styles.editVenueButton}
                    onPress={() => navigation.navigate('EditProject', { venueId: venue.id })}
                  >
                    {editVenueIconSvg ? <SvgXml xml={editVenueIconSvg} width={24} height={24} /> : null}
                  </AnimatedPressable>
                </View>
              ))}
            </View>
          </>
        )}

        {!showUnregisteredProfileView ? <View style={styles.bottomDivider} /> : null}

        <View style={styles.settingsSection}>
          <Text style={styles.settingsTitle}>Настройки</Text>

          <AnimatedPressable style={styles.settingsCard} onPress={handleOpenDiagnosisHistory}>
            <View style={styles.settingsLeft}>
              <View style={styles.settingsIconWrap}>
                {historySettingIconSvg ? (
                  <SvgXml xml={historySettingIconSvg} width={46} height={46} />
                ) : null}
              </View>
              <View style={styles.settingsTextWrap}>
                <Text style={styles.settingsItemTitle}>История диагностик</Text>
                <Text style={styles.settingsItemSubtitle}>{totalDiagnosticsCount} за все время</Text>
              </View>
            </View>
            <View style={styles.settingsArrowWrap}>
              {rightArrowIconSvg ? <SvgXml xml={rightArrowIconSvg} width={22} height={22} /> : null}
            </View>
          </AnimatedPressable>

          <AnimatedPressable style={styles.settingsCard} onPress={handleOpenNotifications}>
            <View style={styles.settingsLeft}>
              <View style={styles.settingsIconWrap}>
                {notificationsSettingIconSvg ? (
                  <SvgXml xml={notificationsSettingIconSvg} width={46} height={46} />
                ) : null}
              </View>
              <View style={styles.settingsTextWrap}>
                <Text style={styles.settingsItemTitle}>Уведомления</Text>
                <Text style={styles.settingsItemSubtitle}>{notificationsSubtitle}</Text>
              </View>
            </View>
            <View style={styles.settingsArrowWrap}>
              {rightArrowIconSvg ? <SvgXml xml={rightArrowIconSvg} width={22} height={22} /> : null}
            </View>
          </AnimatedPressable>

          <AnimatedPressable style={[styles.settingsCard, styles.settingsCardLast]} onPress={() => {}}>
            <View style={styles.settingsLeft}>
              <View style={styles.settingsIconWrap}>
                {contactSettingIconSvg ? (
                  <SvgXml xml={contactSettingIconSvg} width={46} height={46} />
                ) : null}
              </View>
              <View style={styles.settingsTextWrap}>
                <Text style={styles.settingsItemTitle}>Связаться с нами</Text>
              </View>
            </View>
            <View style={styles.settingsArrowWrap}>
              {rightArrowIconSvg ? <SvgXml xml={rightArrowIconSvg} width={22} height={22} /> : null}
            </View>
          </AnimatedPressable>

          <View style={styles.settingsBottomDivider} />
        </View>

        <View style={styles.documentsSection}>
          <Text style={styles.settingsTitle}>Документы</Text>

          <AnimatedPressable style={styles.settingsCard} onPress={() => {}}>
            <View style={styles.settingsLeft}>
              <View style={styles.settingsIconWrap}>
                {documentsSettingIconSvg ? (
                  <SvgXml xml={documentsSettingIconSvg} width={46} height={46} />
                ) : null}
              </View>
              <View style={styles.settingsTextWrap}>
                <Text style={[styles.settingsItemTitle, styles.policyItemTitle]}>
                  Политика конфиденциальности
                </Text>
              </View>
            </View>
            <View style={styles.settingsArrowWrap}>
              {rightArrowIconSvg ? <SvgXml xml={rightArrowIconSvg} width={22} height={22} /> : null}
            </View>
          </AnimatedPressable>

          <AnimatedPressable style={styles.settingsCard} onPress={() => {}}>
            <View style={styles.settingsLeft}>
              <View style={styles.settingsIconWrap}>
                {documentsSettingIconSvg ? (
                  <SvgXml xml={documentsSettingIconSvg} width={46} height={46} />
                ) : null}
              </View>
              <View style={styles.settingsTextWrap}>
                <Text style={styles.settingsItemTitle}>Условия использования</Text>
              </View>
            </View>
            <View style={styles.settingsArrowWrap}>
              {rightArrowIconSvg ? <SvgXml xml={rightArrowIconSvg} width={22} height={22} /> : null}
            </View>
          </AnimatedPressable>

          <AnimatedPressable
            style={[styles.settingsCard, styles.settingsCardLast]}
            onPress={handleOpenPersonalDataConsent}
          >
            <View style={styles.settingsLeft}>
              <View style={styles.settingsIconWrap}>
                {documentsSettingIconSvg ? (
                  <SvgXml xml={documentsSettingIconSvg} width={46} height={46} />
                ) : null}
              </View>
              <View style={styles.settingsTextWrap}>
                <Text style={[styles.settingsItemTitle, styles.policyItemTitle]}>
                  Согласие на обработку персональных данных
                </Text>
              </View>
            </View>
            <View style={styles.settingsArrowWrap}>
              {rightArrowIconSvg ? <SvgXml xml={rightArrowIconSvg} width={22} height={22} /> : null}
            </View>
          </AnimatedPressable>

          <View style={styles.documentsBottomDivider} />
        </View>

        <View style={styles.miscSection}>
          <Text style={styles.settingsTitle}>Остальное</Text>

          <AnimatedPressable style={styles.settingsCard} onPress={() => setShowResetDataModal(true)}>
            <View style={styles.settingsLeft}>
              <View style={styles.settingsIconWrap}>
                {resetDataSettingIconSvg ? (
                  <SvgXml xml={resetDataSettingIconSvg} width={46} height={46} />
                ) : null}
              </View>
              <View style={styles.settingsTextWrap}>
                <Text style={styles.settingsItemTitle}>Сброс данных</Text>
              </View>
            </View>
            <View style={styles.settingsArrowWrap}>
              {rightArrowIconSvg ? <SvgXml xml={rightArrowIconSvg} width={22} height={22} /> : null}
            </View>
          </AnimatedPressable>

          <AnimatedPressable
            style={[styles.settingsCard, styles.settingsCardLast]}
            onPress={() => setShowDeleteAccountModal(true)}
          >
            <View style={styles.settingsLeft}>
              <View style={styles.settingsIconWrap}>
                {deleteAccountSettingIconSvg ? (
                  <SvgXml xml={deleteAccountSettingIconSvg} width={46} height={46} />
                ) : null}
              </View>
              <View style={styles.settingsTextWrap}>
                <Text style={styles.settingsItemTitle}>Удалить аккаунт</Text>
              </View>
            </View>
            <View style={styles.settingsArrowWrap}>
              {rightArrowIconSvg ? <SvgXml xml={rightArrowIconSvg} width={22} height={22} /> : null}
            </View>
          </AnimatedPressable>

          <Text style={styles.versionText}>версия 1.0</Text>
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={showResetDataModal}
        onRequestClose={() => setShowResetDataModal(false)}
      >
        <View style={styles.deleteModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowResetDataModal(false)}
          />
          <View style={styles.deleteModalCard}>
            <Text style={styles.deleteModalTitle}>Сбросить данные</Text>
            <Text style={styles.deleteModalMessage}>
              Все ваши ответы, результаты диагностики и задачи будут удалены. Откат назад будет
              невозможен.
            </Text>
            <View style={styles.deleteModalActionsRow}>
              <View style={[styles.deleteModalActionCell, styles.deleteModalActionCellLeft]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.deleteModalActionButton,
                    pressed && styles.deleteModalActionButtonPressed,
                  ]}
                  onPress={() => setShowResetDataModal(false)}
                >
                  <Text style={styles.deleteModalCancelText}>Отмена</Text>
                </Pressable>
              </View>
              <View style={styles.deleteModalActionCell}>
                <Pressable
                  style={({ pressed }) => [
                    styles.deleteModalActionButton,
                    pressed && styles.deleteModalActionButtonPressed,
                  ]}
                  onPress={handleConfirmResetDiagnostics}
                >
                  <Text style={styles.deleteModalDeleteText}>Сбросить</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="none"
        visible={showNotificationsModal}
        onRequestClose={handleCloseNotifications}
      >
        <View style={styles.notificationsModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleCloseNotifications}
          />
          <RNAnimated.View
            style={[
              styles.notificationsModalCard,
              { transform: [{ translateY: notificationsSlideAnim }] },
            ]}
          >
            <View style={styles.notificationsModalHeader}>
              <Text style={styles.notificationsModalTitle}>Настройка уведомлений</Text>
              <Pressable
                onPress={handleCloseNotifications}
                style={({ pressed }) => [
                  styles.notificationsModalCloseButton,
                  pressed && styles.notificationsModalCloseButtonPressed,
                ]}
              >
                {modalCloseIconSvg ? (
                  <SvgXml xml={modalCloseIconSvg} width={22} height={22} />
                ) : (
                  <Text style={styles.notificationsModalCloseText}>×</Text>
                )}
              </Pressable>
            </View>
            <View style={styles.notificationsOptionsWrap}>
              <AnimatedPressable
                style={[styles.notificationsOption, styles.notificationsOptionCompact]}
                onPress={() => setNotificationFrequency('yearly')}
              >
                <View style={styles.notificationsOptionTextWrap}>
                  <Text style={styles.notificationsOptionTitle}>Раз в год</Text>
                </View>
                <TouchableOpacity
                  style={styles.notificationsOptionRadioButton}
                  activeOpacity={0.8}
                  onPress={() => setNotificationFrequency('yearly')}
                >
                  {notificationFrequency === 'yearly' && radioActiveSvg ? (
                    <SvgXml xml={radioActiveSvg} width={20} height={20} />
                  ) : radioInactiveSvg ? (
                    <SvgXml xml={radioInactiveSvg} width={20} height={20} />
                  ) : (
                    <View
                      style={[
                        styles.notificationsOptionRadioOuter,
                        notificationFrequency === 'yearly' &&
                          styles.notificationsOptionRadioOuterActive,
                      ]}
                    >
                      {notificationFrequency === 'yearly' ? (
                        <View style={styles.notificationsOptionRadioInner} />
                      ) : null}
                    </View>
                  )}
                </TouchableOpacity>
              </AnimatedPressable>

              <AnimatedPressable
                style={[styles.notificationsOption, styles.notificationsOptionCompact]}
                onPress={() => setNotificationFrequency('halfYear')}
              >
                <View style={styles.notificationsOptionTextWrap}>
                  <Text style={styles.notificationsOptionTitle}>Раз в пол года</Text>
                </View>
                <TouchableOpacity
                  style={styles.notificationsOptionRadioButton}
                  activeOpacity={0.8}
                  onPress={() => setNotificationFrequency('halfYear')}
                >
                  {notificationFrequency === 'halfYear' && radioActiveSvg ? (
                    <SvgXml xml={radioActiveSvg} width={20} height={20} />
                  ) : radioInactiveSvg ? (
                    <SvgXml xml={radioInactiveSvg} width={20} height={20} />
                  ) : (
                    <View
                      style={[
                        styles.notificationsOptionRadioOuter,
                        notificationFrequency === 'halfYear' &&
                          styles.notificationsOptionRadioOuterActive,
                      ]}
                    >
                      {notificationFrequency === 'halfYear' ? (
                        <View style={styles.notificationsOptionRadioInner} />
                      ) : null}
                    </View>
                  )}
                </TouchableOpacity>
              </AnimatedPressable>

              <AnimatedPressable
                style={[styles.notificationsOption, styles.notificationsOptionCompact]}
                onPress={() => setNotificationFrequency('quarter')}
              >
                <View style={styles.notificationsOptionTextWrap}>
                  <Text style={styles.notificationsOptionTitle}>Раз в 3 месяца</Text>
                </View>
                <TouchableOpacity
                  style={styles.notificationsOptionRadioButton}
                  activeOpacity={0.8}
                  onPress={() => setNotificationFrequency('quarter')}
                >
                  {notificationFrequency === 'quarter' && radioActiveSvg ? (
                    <SvgXml xml={radioActiveSvg} width={20} height={20} />
                  ) : radioInactiveSvg ? (
                    <SvgXml xml={radioInactiveSvg} width={20} height={20} />
                  ) : (
                    <View
                      style={[
                        styles.notificationsOptionRadioOuter,
                        notificationFrequency === 'quarter' &&
                          styles.notificationsOptionRadioOuterActive,
                      ]}
                    >
                      {notificationFrequency === 'quarter' ? (
                        <View style={styles.notificationsOptionRadioInner} />
                      ) : null}
                    </View>
                  )}
                </TouchableOpacity>
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.notificationsOption}
                onPress={() => setNotificationFrequency('monthly')}
              >
                <View style={styles.notificationsOptionTextWrap}>
                  <Text style={styles.notificationsOptionTitle}>Раз в месяц</Text>
                  <Text style={styles.notificationsOptionRecommended}>Рекомендуем</Text>
                </View>
                <TouchableOpacity
                  style={styles.notificationsOptionRadioButton}
                  activeOpacity={0.8}
                  onPress={() => setNotificationFrequency('monthly')}
                >
                  {notificationFrequency === 'monthly' && radioActiveSvg ? (
                    <SvgXml xml={radioActiveSvg} width={20} height={20} />
                  ) : radioInactiveSvg ? (
                    <SvgXml xml={radioInactiveSvg} width={20} height={20} />
                  ) : (
                    <View
                      style={[
                        styles.notificationsOptionRadioOuter,
                        notificationFrequency === 'monthly' &&
                          styles.notificationsOptionRadioOuterActive,
                      ]}
                    >
                      {notificationFrequency === 'monthly' ? (
                        <View style={styles.notificationsOptionRadioInner} />
                      ) : null}
                    </View>
                  )}
                </TouchableOpacity>
              </AnimatedPressable>

              <AnimatedPressable
                style={[styles.notificationsOption, styles.notificationsOptionCompact]}
                onPress={() => setNotificationFrequency('biweekly')}
              >
                <View style={styles.notificationsOptionTextWrap}>
                  <Text style={styles.notificationsOptionTitle}>Раз в 2 недели</Text>
                </View>
                <TouchableOpacity
                  style={styles.notificationsOptionRadioButton}
                  activeOpacity={0.8}
                  onPress={() => setNotificationFrequency('biweekly')}
                >
                  {notificationFrequency === 'biweekly' && radioActiveSvg ? (
                    <SvgXml xml={radioActiveSvg} width={20} height={20} />
                  ) : radioInactiveSvg ? (
                    <SvgXml xml={radioInactiveSvg} width={20} height={20} />
                  ) : (
                    <View
                      style={[
                        styles.notificationsOptionRadioOuter,
                        notificationFrequency === 'biweekly' &&
                          styles.notificationsOptionRadioOuterActive,
                      ]}
                    >
                      {notificationFrequency === 'biweekly' ? (
                        <View style={styles.notificationsOptionRadioInner} />
                      ) : null}
                    </View>
                  )}
                </TouchableOpacity>
              </AnimatedPressable>

              <AnimatedPressable
                style={[styles.notificationsOption, styles.notificationsOptionCompact]}
                onPress={() => setNotificationFrequency('weekly')}
              >
                <View style={styles.notificationsOptionTextWrap}>
                  <Text style={styles.notificationsOptionTitle}>Раз в неделю</Text>
                </View>
                <TouchableOpacity
                  style={styles.notificationsOptionRadioButton}
                  activeOpacity={0.8}
                  onPress={() => setNotificationFrequency('weekly')}
                >
                  {notificationFrequency === 'weekly' && radioActiveSvg ? (
                    <SvgXml xml={radioActiveSvg} width={20} height={20} />
                  ) : radioInactiveSvg ? (
                    <SvgXml xml={radioInactiveSvg} width={20} height={20} />
                  ) : (
                    <View
                      style={[
                        styles.notificationsOptionRadioOuter,
                        notificationFrequency === 'weekly' &&
                          styles.notificationsOptionRadioOuterActive,
                      ]}
                    >
                      {notificationFrequency === 'weekly' ? (
                        <View style={styles.notificationsOptionRadioInner} />
                      ) : null}
                    </View>
                  )}
                </TouchableOpacity>
              </AnimatedPressable>
            </View>
          </RNAnimated.View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={showDeleteAccountModal}
        onRequestClose={() => setShowDeleteAccountModal(false)}
      >
        <View style={styles.deleteModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowDeleteAccountModal(false)}
          />
          <View style={styles.deleteModalCard}>
            <Text style={styles.deleteModalTitle}>Удалить аккаунт?</Text>
            <Text style={styles.deleteModalMessage}>
              При удалении аккаунта будут удалены все ваши данные и результаты диагностики.
            </Text>
            <View style={styles.deleteModalActionsRow}>
              <View style={[styles.deleteModalActionCell, styles.deleteModalActionCellLeft]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.deleteModalActionButton,
                    pressed && styles.deleteModalActionButtonPressed,
                  ]}
                  onPress={() => setShowDeleteAccountModal(false)}
                >
                  <Text style={styles.deleteModalCancelText}>Отмена</Text>
                </Pressable>
              </View>
              <View style={styles.deleteModalActionCell}>
                <Pressable
                  style={({ pressed }) => [
                    styles.deleteModalActionButton,
                    pressed && styles.deleteModalActionButtonPressed,
                  ]}
                  onPress={handleConfirmDeleteAccount}
                >
                  <Text style={styles.deleteModalDeleteText}>Удалить</Text>
                </Pressable>
              </View>
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.xxl + 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '400',
    color: '#0A0D14',
    marginLeft: 5,
  },
  headerIconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileQuickActionRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  profileQuickActionTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '300',
    color: 'rgba(10, 13, 20, 0.8)',
  },
  profileQuickActionIconWrap: {
    width: 27,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
  profileQuickActionIconFallback: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '400',
    color: '#191BDF',
  },
  profileQuickActionDivider: {
    height: 1,
    backgroundColor: '#E2E4E9',
  },
  avatarContainer: {
    marginTop: -10,
    width: 112,
    height: 112,
    alignSelf: 'center',
  },
  avatarButton: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarRemoveButton: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DF1C41',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A0D14',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E2E4E9',
  },
  profileName: {
    marginTop: spacing.md,
    alignSelf: 'center',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '400',
    color: '#0A0D14',
    textAlign: 'center',
  },
  contactsRow: {
    marginTop: spacing.xs - 5,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
  },
  contactText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '300',
    color: '#6A6C70',
    textAlign: 'center',
  },
  contactSeparator: {
    fontSize: 17,
    lineHeight: 23,
    color: '#C7CAD1',
    fontWeight: '400',
  },
  venuesHeader: {
    marginTop: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  venuesTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '300',
    color: 'rgba(10, 13, 20, 0.8)',
  },
  addVenueButton: {
    width: 27,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: 1 }, { translateY: 2 }],
  },
  venuesCard: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  venueRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  venueRowDivider: {
    borderTopWidth: 0,
  },
  venueLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueLogoWrap: {
    width: 47,
    height: 47,
    borderRadius: 23.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    transform: [{ translateY: 2 }],
  },
  venueLogoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 23.5,
  },
  venueLogoFallback: {
    width: 31,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: '#E2E4E9',
  },
  venueTextWrap: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  venueName: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: '#0A0D14',
  },
  venueCity: {
    marginTop: -1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '300',
    color: '#525866',
  },
  editVenueButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  bottomDivider: {
    marginTop: 15,
    height: 1,
    backgroundColor: '#E2E4E9',
  },
  settingsSection: {
    marginTop: 16,
    marginBottom: spacing.md,
  },
  settingsTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '300',
    color: 'rgba(10, 13, 20, 0.8)',
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E4E9',
    borderRadius: 24,
    minHeight: 68,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    transform: [{ translateY: 2 }],
  },
  settingsTextWrap: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: -4,
  },
  settingsItemTitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: '#0A0D14',
  },
  settingsItemSubtitle: {
    marginTop: -1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '300',
    color: '#525866',
  },
  settingsArrowWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    opacity: 0.75,
  },
  settingsCardLast: {
    marginBottom: 0,
  },
  settingsBottomDivider: {
    marginTop: 15,
    height: 1,
    backgroundColor: '#E2E4E9',
  },
  documentsSection: {
    marginTop: 4,
    marginBottom: spacing.md,
  },
  documentsBottomDivider: {
    marginTop: 15,
    height: 1,
    backgroundColor: '#E2E4E9',
  },
  miscSection: {
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  versionText: {
    marginTop: 36,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '300',
    color: 'rgba(10, 13, 20, 0.8)',
  },
  policyItemTitle: {
    lineHeight: 20,
  },
  deleteModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#DFE1E8',
    borderRadius: 22,
    overflow: 'hidden',
  },
  deleteModalTitle: {
    marginTop: 28,
    fontSize: 23,
    lineHeight: 26,
    fontWeight: '400',
    color: '#0A0D14',
    textAlign: 'center',
  },
  deleteModalMessage: {
    marginTop: 3,
    marginBottom: 22,
    paddingHorizontal: 26,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '300',
    color: '#0A0D14',
    textAlign: 'center',
  },
  deleteModalActionsRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: '#C7CAD1',
  },
  deleteModalActionCell: {
    width: '50%',
    height: '100%',
  },
  deleteModalActionCellLeft: {
    borderRightWidth: 1,
    borderRightColor: '#C7CAD1',
  },
  deleteModalActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalActionButtonPressed: {
    backgroundColor: 'rgba(10, 13, 20, 0.06)',
  },
  deleteModalCancelText: {
    fontSize: 19,
    lineHeight: 22,
    fontWeight: '400',
    color: '#007AFF',
    textAlign: 'center',
  },
  deleteModalDeleteText: {
    fontSize: 19,
    lineHeight: 22,
    fontWeight: '500',
    color: '#FF3B30',
    textAlign: 'center',
  },
  notificationsModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    justifyContent: 'flex-end',
  },
  notificationsModalCard: {
    width: '100%',
    backgroundColor: '#F6F8FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 38,
  },
  notificationsModalHeader: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -10,
    marginBottom: 10,
    transform: [{ translateY: -5 }],
  },
  notificationsModalTitle: {
    color: '#0A0D14',
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '300',
    textAlign: 'left',
    flex: 1,
  },
  notificationsModalCloseButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginLeft: 12,
  },
  notificationsModalCloseButtonPressed: {
    backgroundColor: 'rgba(10, 13, 20, 0.08)',
  },
  notificationsModalCloseText: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '300',
    color: '#6A6C70',
  },
  notificationsOptionsWrap: {
    gap: 12,
  },
  notificationsOption: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E4E9',
    borderWidth: 1,
    borderRadius: 20,
    minHeight: 70,
    paddingHorizontal: 18,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationsOptionCompact: {
    minHeight: 62,
  },
  notificationsOptionTextWrap: {
    flex: 1,
  },
  notificationsOptionTitle: {
    color: '#0A0D14',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
  },
  notificationsOptionRecommended: {
    marginTop: 2,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '300',
    color: '#38C793',
  },
  notificationsOptionRadioButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  notificationsOptionRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D4D8DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationsOptionRadioOuterActive: {
    borderColor: '#375DFB',
  },
  notificationsOptionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#375DFB',
  },
});
