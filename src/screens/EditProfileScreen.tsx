import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Asset } from 'expo-asset';
import { SvgXml } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';

import AnimatedPressable from '../components/AnimatedPressable';
import { palette, spacing } from '../styles/theme';
import { getUserData } from '../utils/api';
import { getCurrentUserId, loadUserQuestionnaire, saveUserQuestionnaire } from '../utils/userDataStorage';
import { findUserByEmail, updateUser } from '../utils/usersStorage';

interface EditProfileScreenProps {
  onBack?: () => void;
  startEmpty?: boolean;
  onOpenConsentDocument?: () => void;
}

interface FormErrors {
  fullName: string;
  email: string;
  phone: string;
  consent: string;
}

const formatPhoneToMask = (value: string) => {
  const digits = value.replace(/\D/g, '');
  const withoutCountry =
    digits.length >= 11 && (digits.startsWith('7') || digits.startsWith('8'))
      ? digits.slice(1)
      : digits;
  const limitedDigits = withoutCountry.substring(0, 10);

  if (!limitedDigits.length) return '';

  let formatted = `(${limitedDigits.substring(0, 3)}`;
  if (limitedDigits.length > 3) {
    formatted += `) ${limitedDigits.substring(3, 6)}`;
    if (limitedDigits.length > 6) {
      formatted += `-${limitedDigits.substring(6, 8)}`;
      if (limitedDigits.length > 8) {
        formatted += `-${limitedDigits.substring(8)}`;
      }
    }
  }

  return formatted;
};

export default function EditProfileScreen({
  onBack,
  startEmpty = false,
  onOpenConsentDocument,
}: EditProfileScreenProps) {
  const [backIconSvg, setBackIconSvg] = useState('');
  const [userIconSvg, setUserIconSvg] = useState('');
  const [emailIconSvg, setEmailIconSvg] = useState('');
  const [russiaFlagSvg, setRussiaFlagSvg] = useState('');
  const [avatarPlaceholderSvg, setAvatarPlaceholderSvg] = useState('');
  const [checkboxActiveSvg, setCheckboxActiveSvg] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({
    fullName: '',
    email: '',
    phone: '',
    consent: '',
  });

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneToMask(text);
    setPhone(formatted);
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: '' }));
    }
  };

  useEffect(() => {
    const loadIcons = async () => {
      try {
        const backAsset = Asset.fromModule(require('../../assets/images/Frame 8 (3).svg'));
        await backAsset.downloadAsync();
        if (backAsset.localUri) {
          const response = await fetch(backAsset.localUri);
          setBackIconSvg(await response.text());
        }

        const userAsset = Asset.fromModule(require('../../assets/images/user-3-line-icon.svg'));
        await userAsset.downloadAsync();
        if (userAsset.localUri) {
          const response = await fetch(userAsset.localUri);
          setUserIconSvg(await response.text());
        }

        const mailAsset = Asset.fromModule(require('../../assets/images/mail-line-icon.svg'));
        await mailAsset.downloadAsync();
        if (mailAsset.localUri) {
          const response = await fetch(mailAsset.localUri);
          setEmailIconSvg(await response.text());
        }

        const flagAsset = Asset.fromModule(require('../../assets/images/russia-flag-icon.svg'));
        await flagAsset.downloadAsync();
        if (flagAsset.localUri) {
          const response = await fetch(flagAsset.localUri);
          setRussiaFlagSvg(await response.text());
        }

        const placeholderAsset = Asset.fromModule(
          require('../../assets/images/restaurant-avatar-placeholder.svg')
        );
        await placeholderAsset.downloadAsync();
        if (placeholderAsset.localUri) {
          const response = await fetch(placeholderAsset.localUri);
          const rawSvg = await response.text();
          const cleanedSvg = rawSvg.replace(/<rect[^>]*stroke="#E2E4E9"[^>]*\/>/i, '');
          setAvatarPlaceholderSvg(cleanedSvg);
        }

        const checkboxAsset = Asset.fromModule(require('../../assets/images/checkbox-active.svg'));
        await checkboxAsset.downloadAsync();
        if (checkboxAsset.localUri) {
          const response = await fetch(checkboxAsset.localUri);
          setCheckboxActiveSvg(await response.text());
        }
      } catch (error) {
        console.error('Ошибка загрузки иконок EditProfileScreen:', error);
      }
    };

    loadIcons();
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (startEmpty) {
          setFullName('');
          setEmail('');
          setPhone('');
          setAvatarUri(null);
          setConsent(false);
          return;
        }

        const user = await getUserData();
        if (user?.fullName) setFullName(user.fullName);
        if (user?.email) setEmail(user.email);
        if (user?.phone) setPhone(formatPhoneToMask(user.phone));

        if (!user?.fullName || !user?.email || !user?.phone) {
          const registrationRaw = await AsyncStorage.getItem('registrationStep1');
          if (registrationRaw) {
            const registration = JSON.parse(registrationRaw);
            if (!user?.fullName && registration?.fullName) {
              setFullName(registration.fullName);
            }
            if (!user?.email && registration?.email) {
              setEmail(registration.email);
            }
            if (!user?.phone && registration?.phone) {
              setPhone(formatPhoneToMask(registration.phone));
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
      } catch (error) {
        console.error('Ошибка загрузки данных профиля для редактирования:', error);
      }
    };

    loadInitialData();
  }, [startEmpty]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const syncConsentFromStorage = async () => {
        try {
          const consentAcceptedFlag = await AsyncStorage.getItem('editProfileConsentAccepted');
          if (consentAcceptedFlag === 'true' && isActive) {
            setConsent(true);
            if (errors.consent) {
              setErrors((prev) => ({ ...prev, consent: '' }));
            }
            await AsyncStorage.removeItem('editProfileConsentAccepted');
          }
        } catch (error) {
          console.error('Ошибка синхронизации согласия в профиле:', error);
        }
      };

      syncConsentFromStorage();

      return () => {
        isActive = false;
      };
    }, [errors.consent])
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

  const handleRemoveAvatar = async () => {
    try {
      setAvatarUri(null);
      const userId = await getCurrentUserId();
      const avatarKey = userId ? `user_${userId}_profile_avatar_uri` : 'profile_avatar_uri';
      await AsyncStorage.removeItem(avatarKey);
      await AsyncStorage.removeItem('userAvatar');
    } catch (error) {
      console.error('Ошибка удаления фото профиля:', error);
    }
  };

  const validate = () => {
    const nextErrors: FormErrors = {
      fullName: '',
      email: '',
      phone: '',
      consent: '',
    };

    if (!fullName.trim()) {
      nextErrors.fullName = 'Обязательное поле';
    }

    if (!email.trim()) {
      nextErrors.email = 'Обязательное поле';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Некорректный email';
    }

    if (phone.replace(/\D/g, '').length < 10) {
      nextErrors.phone = 'Обязательное поле';
    }

    if (!consent) {
      nextErrors.consent = 'Необходимо дать согласие на обработку персональных данных';
    }

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const isFormReady = useMemo(() => {
    return Boolean(
      fullName.trim() &&
        email.trim() &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
        phone.replace(/\D/g, '').length >= 10 &&
        consent
    );
  }, [fullName, email, phone, consent]);

  const handleSave = async () => {
    if (!validate()) return;

    try {
      const userId = await getCurrentUserId();
      const nextEmail = email.trim();

      if (userId) {
        const existingByEmail = await findUserByEmail(nextEmail);
        if (existingByEmail && existingByEmail.id !== userId) {
          Alert.alert('Email занят', 'Пользователь с таким email уже существует.');
          return;
        }

        await updateUser(userId, {
          fullName: fullName.trim(),
          email: nextEmail,
          phone: phone.trim(),
          agreePersonalData: consent,
          agreePrivacy: consent,
        });

        const questionnaire = await loadUserQuestionnaire(userId);
        if (questionnaire) {
          await saveUserQuestionnaire(userId, {
            ...questionnaire,
            fullName: fullName.trim(),
            email: nextEmail,
            phone: phone.trim(),
          });
        }
      }

      const registrationRaw = await AsyncStorage.getItem('registrationStep1');
      const registration = registrationRaw ? JSON.parse(registrationRaw) : {};
      await AsyncStorage.setItem(
        'registrationStep1',
        JSON.stringify({
          ...registration,
          fullName: fullName.trim(),
          email: nextEmail,
          phone: phone.trim(),
          consent,
        })
      );

      await AsyncStorage.setItem('userEmail', nextEmail);

      onBack?.();
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить изменения. Попробуйте снова.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback
        accessible={false}
        onPress={() => {
          Keyboard.dismiss();
        }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              {backIconSvg ? (
                <SvgXml xml={backIconSvg} width={24} height={24} />
              ) : (
                <Text style={styles.backFallback}>‹</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Редактировать профиль</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Имя и фамилия</Text>
            <View style={styles.inputContainer}>
              {userIconSvg ? (
                <View style={styles.inputIcon}>
                  <SvgXml xml={userIconSvg} width={20} height={20} />
                </View>
              ) : null}
              <TextInput
                style={[styles.input, fullName ? styles.inputFilled : styles.inputEmpty]}
                placeholder="Мирослав Зудин"
                placeholderTextColor={palette.gray400}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) {
                    setErrors((prev) => ({ ...prev, fullName: '' }));
                  }
                }}
              />
            </View>
            {!!errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputContainer}>
              {emailIconSvg ? (
                <View style={styles.inputIcon}>
                  <SvgXml xml={emailIconSvg} width={20} height={20} />
                </View>
              ) : null}
              <TextInput
                style={[styles.input, email ? styles.inputFilled : styles.inputEmpty]}
                placeholder="hello@pelby.ru"
                placeholderTextColor={palette.gray400}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: '' }));
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Телефон</Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.phonePrefix}>
                {russiaFlagSvg ? (
                  <View style={styles.flagIconContainer}>
                    <SvgXml xml={russiaFlagSvg} width={20} height={20} />
                  </View>
                ) : null}
                <Text style={styles.phonePrefixText}>+7</Text>
                <View style={styles.phoneDivider} />
              </View>
              <View style={styles.phoneInputWrapper}>
                <TextInput
                  style={[styles.phoneInput, phone ? styles.inputFilled : styles.inputEmpty]}
                  placeholder="(988) 317-36-53"
                  placeholderTextColor={palette.gray400}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <View style={styles.logoSection}>
            <TouchableOpacity style={styles.logoInfoPressable} onPress={handlePickAvatar} activeOpacity={0.8}>
              <View style={styles.logoPreview}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.logoImage} />
                ) : avatarPlaceholderSvg ? (
                  <SvgXml xml={avatarPlaceholderSvg} width={50} height={50} />
                ) : null}
              </View>

              <View style={styles.logoTextContainer}>
                <Text style={styles.logoTitle}>Фото профиля</Text>
                <Text style={styles.logoSubtitle}>200x200px, png / jpg</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoUploadButton}
              onPress={avatarUri ? handleRemoveAvatar : handlePickAvatar}
              activeOpacity={0.8}
            >
              <Text style={styles.logoUploadButtonText}>{avatarUri ? 'Удалить' : 'Загрузить'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.consentWrapper}>
            <View style={styles.consentContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => {
                  const nextValue = !consent;
                  setConsent(nextValue);
                  if (errors.consent && nextValue) {
                    setErrors((prev) => ({ ...prev, consent: '' }));
                  }
                }}
                activeOpacity={0.7}
              >
                {consent ? (
                  checkboxActiveSvg ? (
                    <SvgXml xml={checkboxActiveSvg} width={17} height={17} />
                  ) : (
                    <View style={styles.checkboxEmpty} />
                  )
                ) : (
                  <View style={styles.checkboxEmpty} />
                )}
              </TouchableOpacity>
              <View style={styles.consentTextContainer}>
                <Text style={styles.consentText} numberOfLines={1} ellipsizeMode="clip">
                  <Text style={styles.consentMainText}>Даю согласие на обработку </Text>
                  <Text
                    style={styles.consentLink}
                    onPress={onOpenConsentDocument}
                  >
                    персональных данных
                  </Text>
                </Text>
              </View>
            </View>
            {!!errors.consent && <Text style={styles.errorText}>{errors.consent}</Text>}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      <View style={styles.saveButtonContainer}>
        <AnimatedPressable
          style={[styles.saveButton, !isFormReady && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isFormReady}
        >
          <Text style={styles.saveButtonText}>Сохранить изменения</Text>
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
  },
  backFallback: {
    fontSize: 24,
    color: '#0A0D14',
    lineHeight: 24,
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
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A0D14',
    fontFamily: 'Manrope-SemiBold',
    marginBottom: spacing.xs,
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
  phoneInputContainer: {
    flexDirection: 'row',
    backgroundColor: palette.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    height: 56,
  },
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md - 3,
    paddingRight: spacing.md,
    justifyContent: 'flex-start',
    width: 80,
    position: 'relative',
  },
  flagIconContainer: {
    marginRight: spacing.xxs,
    justifyContent: 'center',
    alignItems: 'center',
    height: 20,
  },
  phonePrefixText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0A0D14',
    fontFamily: 'Manrope-Regular',
    marginLeft: 3,
  },
  phoneDivider: {
    position: 'absolute',
    right: spacing.md - 4,
    top: 2,
    bottom: 2,
    width: 1,
    backgroundColor: palette.gray200,
  },
  phoneInputWrapper: {
    flex: 1,
    paddingLeft: spacing.md - 16,
    paddingRight: spacing.md,
    justifyContent: 'center',
  },
  phoneInput: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Manrope-Medium',
    padding: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
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
    paddingVertical: spacing.sm,
    marginTop: -6,
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
  consentWrapper: {
    marginTop: 6,
    marginBottom: spacing.lg,
  },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  checkboxContainer: {
    marginRight: spacing.sm - 3,
    marginLeft: -8,
    marginTop: 2,
  },
  checkboxEmpty: {
    width: 17,
    height: 17,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: palette.gray400,
    backgroundColor: 'transparent',
  },
  consentTextContainer: {
    flex: 1,
    marginLeft: -2,
  },
  consentText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Manrope-SemiBold',
    lineHeight: 20,
    flexShrink: 0,
  },
  consentMainText: {
    color: '#0A0D14',
    opacity: 0.8,
  },
  consentLink: {
    color: '#191BDF',
    fontWeight: '500',
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 57,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: 0,
  },
  saveButton: {
    marginTop: 23,
    backgroundColor: '#191BDF',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#CDD0D5',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.white,
    fontFamily: Platform.select({
      ios: 'Manrope',
      android: 'Manrope',
      web: "'Manrope', sans-serif",
      default: 'Manrope',
    }),
    textAlign: 'center',
  },
});
