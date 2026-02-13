import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Asset } from 'expo-asset';
import { SvgXml } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedPressable from '../components/AnimatedPressable';
import { palette, spacing, radii, typography } from '../styles/theme';
import { findUserByEmail, saveUser, updateUser } from '../utils/usersStorage';

interface RegisterScreen1Props {
  onContinue: () => void;
  onSkip?: () => void;
  onBack?: () => void;
}

export default function RegisterScreen1({ onContinue, onSkip, onBack }: RegisterScreen1Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [userIconSvg, setUserIconSvg] = useState<string>('');
  const [emailIconSvg, setEmailIconSvg] = useState<string>('');
  const [russiaFlagSvg, setRussiaFlagSvg] = useState<string>('');
  const [checkboxActiveSvg, setCheckboxActiveSvg] = useState<string>('');
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    consent: '',
  });

  // Функция форматирования телефона с автоматической маской
  const handlePhoneChange = (text: string) => {
    // Удаляем все символы кроме цифр
    const digits = text.replace(/\D/g, '');
    
    // Ограничиваем до 10 цифр (для российского номера без +7)
    const limitedDigits = digits.substring(0, 10);
    
    // Автоматически применяем маску (XXX) XXX-XX-XX
    let formatted = '';
    if (limitedDigits.length > 0) {
      formatted = `(${limitedDigits.substring(0, 3)}`;
      if (limitedDigits.length > 3) {
        formatted += `) ${limitedDigits.substring(3, 6)}`;
        if (limitedDigits.length > 6) {
          formatted += `-${limitedDigits.substring(6, 8)}`;
          if (limitedDigits.length > 8) {
            formatted += `-${limitedDigits.substring(8)}`;
          }
        }
      }
    }
    
    setPhone(formatted);
    // Очищаем ошибку при вводе
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      phone: '',
      consent: '',
    };

    // Валидация имени
    if (!name.trim()) {
      newErrors.name = 'Обязательное поле';
    }

    // Валидация email
    if (!email.trim()) {
      newErrors.email = 'Обязательное поле';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Некорректный email';
    }

    // Валидация телефона
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      newErrors.phone = 'Обязательное поле';
    }

    // Валидация согласия
    if (!consent) {
      newErrors.consent = 'Необходимо дать согласие на обработку персональных данных';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    const payload = {
      fullName: name,
      email,
      phone,
      consent,
    };

    await AsyncStorage.setItem('registrationStep1', JSON.stringify(payload));

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      await updateUser(existingUser.id, {
        fullName: name,
        phone,
        email,
        agreePersonalData: consent,
        agreePrivacy: consent,
      });
      await AsyncStorage.setItem('userId', existingUser.id);
    } else {
      const newUser = await saveUser({
        email,
        password: '',
        fullName: name,
        phone,
        agreePersonalData: consent,
        agreePrivacy: consent,
      });
      await AsyncStorage.setItem('userId', newUser.id);
    }

    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('userEmail', email);
    await AsyncStorage.setItem('isAuthenticated', 'true');

    onContinue();
  };

  useEffect(() => {
    const loadSavedRegistration = async () => {
      const saved = await AsyncStorage.getItem('registrationStep1');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.fullName) setName(parsed.fullName);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.phone) setPhone(parsed.phone);
          if (typeof parsed.consent === 'boolean') setConsent(parsed.consent);
        } catch (error) {
          console.error('Ошибка чтения данных регистрации (шаг 1):', error);
        }
      }
    };

    // Загружаем SVG иконку для поля "Имя и фамилия"
    const loadUserIcon = async () => {
      try {
        const iconAsset = Asset.fromModule(require('../../assets/images/user-3-line-icon.svg'));
        await iconAsset.downloadAsync();
        if (iconAsset.localUri) {
          const response = await fetch(iconAsset.localUri);
          const fileContent = await response.text();
          setUserIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки пользователя:', error);
      }
    };

    // Загружаем SVG иконку для поля "Email"
    const loadEmailIcon = async () => {
      try {
        const iconAsset = Asset.fromModule(require('../../assets/images/mail-line-icon.svg'));
        await iconAsset.downloadAsync();
        if (iconAsset.localUri) {
          const response = await fetch(iconAsset.localUri);
          const fileContent = await response.text();
          setEmailIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки email:', error);
      }
    };

    // Загружаем SVG иконку флага России
    const loadRussiaFlagIcon = async () => {
      try {
        const iconAsset = Asset.fromModule(require('../../assets/images/russia-flag-icon.svg'));
        await iconAsset.downloadAsync();
        if (iconAsset.localUri) {
          const response = await fetch(iconAsset.localUri);
          const fileContent = await response.text();
          setRussiaFlagSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки флага России:', error);
      }
    };

    // Загружаем SVG активного чекбокса
    const loadCheckboxActive = async () => {
      try {
        const checkboxAsset = Asset.fromModule(require('../../assets/images/checkbox-active.svg'));
        await checkboxAsset.downloadAsync();
        if (checkboxAsset.localUri) {
          const response = await fetch(checkboxAsset.localUri);
          const fileContent = await response.text();
          setCheckboxActiveSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG активного чекбокса:', error);
      }
    };

    loadSavedRegistration();
    loadUserIcon();
    loadEmailIcon();
    loadRussiaFlagIcon();
    loadCheckboxActive();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: Back button, Step indicator and Skip button */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#0A0D14" />
            </TouchableOpacity>
          )}
          <View style={styles.stepIndicatorContainer}>
            <Text style={styles.stepIndicator}>1 / 3 ШАГ</Text>
          </View>
          <TouchableOpacity onPress={onSkip || (() => {})} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Пропустить</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>Персонализируем{'\n'}вашу диагностику</Text>

        {/* Description */}
        <Text style={styles.description}>
          Укажите данные — и мы подготовим рекомендации под ваш бизнес.
        </Text>

        {/* Input Fields */}
        <View style={styles.inputsContainer}>
          {/* Name and Surname */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Имя и фамилия</Text>
            <View style={[styles.inputContainer, errors.name && styles.inputContainerError]}>
              {userIconSvg ? (
                <View style={styles.inputIcon}>
                  <SvgXml xml={userIconSvg} width={20} height={20} />
                </View>
              ) : (
                <Ionicons name="person-outline" size={20} color={palette.gray400} style={styles.inputIcon} />
              )}
              <TextInput
                style={[styles.input, name ? styles.inputFilled : styles.inputEmpty]}
                placeholder="Иван Иванов"
                placeholderTextColor={palette.gray400}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) {
                    setErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
              />
            </View>
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputContainerError]}>
              {emailIconSvg ? (
                <View style={styles.inputIcon}>
                  <SvgXml xml={emailIconSvg} width={20} height={20} />
                </View>
              ) : (
                <Ionicons name="mail-outline" size={20} color={palette.gray400} style={styles.inputIcon} />
              )}
              <TextInput
                style={[styles.input, email ? styles.inputFilled : styles.inputEmpty]}
                placeholder="hello@pelby.ru"
                placeholderTextColor={palette.gray400}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          {/* Phone */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Телефон</Text>
            <View style={[styles.phoneInputContainer, errors.phone && styles.inputContainerError]}>
              <View style={styles.phonePrefix}>
                {russiaFlagSvg && (
                  <View style={styles.flagIconContainer}>
                    <SvgXml xml={russiaFlagSvg} width={20} height={20} />
                  </View>
                )}
                <Text style={styles.phonePrefixText}>+7</Text>
                <View style={styles.phoneDivider} />
              </View>
              <View style={styles.phoneInputWrapper}>
                <TextInput
                  style={[styles.phoneInput, phone ? styles.inputFilled : styles.inputEmpty]}
                  placeholder="(988) 123-45-67"
                  placeholderTextColor={palette.gray400}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
          </View>
        </View>

        {/* Informational Text */}
        <Text style={styles.infoText}>
          Это поможет нам связаться с вами{'\n'}и улучшить ваши результаты.
        </Text>

        {/* Continue Button */}
        <AnimatedPressable
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Продолжить</Text>
        </AnimatedPressable>

        {/* Consent Checkbox */}
        <View style={styles.consentWrapper}>
          <View style={styles.consentContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => {
                setConsent(!consent);
                if (errors.consent) {
                  setErrors(prev => ({ ...prev, consent: '' }));
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
            <TouchableOpacity 
              activeOpacity={1}
              onPress={() => {
                setConsent(!consent);
                if (errors.consent) {
                  setErrors(prev => ({ ...prev, consent: '' }));
                }
              }}
              style={styles.consentTextContainer}
            >
              <Text style={styles.consentText} numberOfLines={1} ellipsizeMode="clip">
                <Text style={styles.consentMainText}>Даю согласие на обработку </Text>
                <Text style={styles.consentLink}>персональных данных</Text>
              </Text>
            </TouchableOpacity>
          </View>
          {errors.consent ? <Text style={styles.errorText}>{errors.consent}</Text> : null}
        </View>
      </ScrollView>
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
    paddingBottom: spacing.xl,
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
    fontWeight: '600', // Увеличена толщина на 100 (было '500', стало '600')
    color: 'rgba(10, 13, 20, 0.5)', // Цвет #0A0D14 с прозрачностью 50%
    fontFamily: 'Manrope-SemiBold',
    textAlign: 'center', // Выравнивание по центру горизонтально
    letterSpacing: 0.5, // Увеличение расстояния между символами
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
    fontSize: 14, // Уменьшен на 1 (было 15, стало 14)
    fontWeight: '500', // Уменьшена толщина на 100 (было '600', стало '500')
    color: '#191BDF', // Цвет #191BDF, непрозрачность 100%
    fontFamily: 'Manrope-Medium',
    letterSpacing: 0.5, // Такое же межбуквенное расстояние
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0A0D14', // Цвет #0A0D14
    fontFamily: 'Manrope-Bold',
    marginTop: -20, // Поднято выше на 20 пикселей
    marginBottom: spacing.sm,
    lineHeight: 36,
    textAlign: 'center', // Выравнивание посередине
  },
  description: {
    fontSize: 16,
    fontWeight: '500', // Увеличена толщина на 100 (было '400', стало '500')
    color: 'rgba(10, 13, 20, 0.8)', // Цвет #0A0D14 с непрозрачностью 80%
    fontFamily: 'Manrope-Medium',
    marginBottom: spacing.xl,
    lineHeight: 24,
    textAlign: 'center', // Выравнивание по центру
  },
  inputsContainer: {
    marginBottom: spacing.lg,
  },
  inputWrapper: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 15, // Увеличен на 1 (было 14, стало 15)
    fontWeight: '600', // Увеличена толщина на 100 (было '500', стало '600')
    color: '#0A0D14', // Цвет #0A0D14
    fontFamily: 'Manrope-SemiBold',
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: 12, // Увеличено скругление до 12
    borderWidth: 1,
    borderColor: '#E2E4E9', // Такая же рамка как у табов
    paddingHorizontal: spacing.md,
    height: 56,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500', // Уменьшена толщина на 100 (было '600', стало '500')
    fontFamily: 'Manrope-Medium',
    padding: 0,
    includeFontPadding: false, // Убираем дополнительные отступы шрифта
    textAlignVertical: 'center', // Выравнивание по вертикали
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
    borderRadius: 12, // Увеличено скругление до 12
    borderWidth: 1,
    borderColor: '#E2E4E9', // Такая же рамка как у табов
    height: 56,
  },
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md - 3, // Сдвинуто левее на 3 пикселя (иконка страны и "+7")
    paddingRight: spacing.md,
    justifyContent: 'flex-start',
    width: 80, // Вернул на прежнюю ширину
    position: 'relative',
  },
  flagIconContainer: {
    marginRight: spacing.xxs, // Уменьшен отступ между иконкой и "+7" (ближе к "+7")
    justifyContent: 'center',
    alignItems: 'center',
    height: 20, // Такая же высота как у иконки для вертикального выравнивания
  },
  phonePrefixText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0A0D14', // Цвет такой же как у названия поля "Телефон"
    fontFamily: 'Manrope-Regular',
    marginLeft: 3, // Сдвинуто вправо на 2 пикселя (было 1, стало 3)
  },
  phoneDivider: {
    position: 'absolute',
    right: spacing.md - 4, // Сдвинуто правее еще на 2 пикселя (всего на 4)
    top: 2, // Отступ сверху 2 пикселя
    bottom: 2, // Отступ снизу 2 пикселя
    width: 1,
    backgroundColor: palette.gray200,
  },
  phoneInputWrapper: {
    flex: 1,
    paddingLeft: spacing.md - 16, // Уменьшен на 16 пикселей (14 + 2), чтобы сдвинуть номер телефона левее
    paddingRight: spacing.md,
    justifyContent: 'center',
  },
  phoneInput: {
    fontSize: 16,
    fontWeight: '500', // Уменьшена толщина на 100 (было '600', стало '500')
    fontFamily: 'Manrope-Medium',
    padding: 0,
    includeFontPadding: false, // Убираем дополнительные отступы шрифта
    textAlignVertical: 'center', // Выравнивание по вертикали
  },
  infoText: {
    fontSize: 16, // Размер как у подзаголовка
    fontWeight: '500', // Жирность как у подзаголовка
    color: 'rgba(10, 13, 20, 0.8)', // Цвет #0A0D14 с непрозрачностью 80%
    fontFamily: 'Manrope-Medium',
    textAlign: 'center',
    marginTop: 3, // Поднято еще на 2px выше к полю "телефон" (5 - 2)
    marginBottom: 57, // Увеличенный отступ снизу до кнопки для баланса
    lineHeight: 24, // Как у подзаголовка
  },
  continueButton: {
    backgroundColor: '#191BDF', // Стили как у кнопки "План улучшений"
    height: 56, // Точно как кнопка "Начать" на онбординге
    paddingHorizontal: spacing.lg,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4, // Поднято еще на 1px выше (-3 - 1)
    marginBottom: spacing.md,
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
  consentWrapper: {
    marginTop: -7, // Опущено на 2px ниже (-9 + 2)
    marginBottom: spacing.lg,
  },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Выровнено по центру горизонтально с чекбоксом
    paddingHorizontal: spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: '#FF4D57',
    marginTop: spacing.xxs,
    marginLeft: spacing.xs,
    fontFamily: 'Manrope-Regular',
  },
  inputContainerError: {
    borderColor: '#FF4D57', // Красная рамка при ошибке
  },
  checkboxContainer: {
    marginRight: spacing.sm - 3, // Уменьшен на 3 пикселя (1 + 2), чтобы текст был ближе к чекбоксу
    marginLeft: -8, // Сдвинуто влево на 8 пикселей
    marginTop: 2,
  },
  checkboxEmpty: {
    width: 17, // Уменьшено на 2px (19 - 2)
    height: 17, // Уменьшено на 2px (19 - 2)
    borderRadius: 6, // Скругление 6
    borderWidth: 1, // 1 пиксель серая обводка
    borderColor: palette.gray400, // Цвет как у иконки почты
    backgroundColor: 'transparent',
  },
  checkboxGradient: {
    width: 17, // Уменьшено на 2px (19 - 2)
    height: 17, // Уменьшено на 2px (19 - 2)
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#253EA7', // Цвет рамки 253EA7
    justifyContent: 'center',
    alignItems: 'center',
  },
  consentTextContainer: {
    flex: 1,
    marginLeft: -2, // Сдвинуто влево на 2 пикселя, чтобы быть ближе к чекбоксу
  },
  consentText: {
    fontSize: 13, // Уменьшен на 1 (было 14, стало 13)
    fontWeight: '600', // Толщина больше на 100 (было '500', стало '600')
    fontFamily: 'Manrope-SemiBold',
    lineHeight: 20,
    flexShrink: 0, // Не сжимается, чтобы "данных" отображалось полностью
  },
  consentMainText: {
    color: '#0A0D14', // Цвет для "Даю согласие на обработку"
    opacity: 0.8, // Непрозрачность 80%
  },
  consentLink: {
    color: '#191BDF', // Цвет 191BDF для "персональных данных"
    fontWeight: '500',
  },
});
