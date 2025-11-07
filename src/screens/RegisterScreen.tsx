import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import { register } from '../utils/api';
import { saveUserQuestionnaire } from '../utils/userDataStorage';

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  white: '#FFFFFF',
  gray: '#F0F0F0',
  darkGray: '#666666',
  red: '#FF0000',
  green: '#00AA00',
};

interface RegisterScreenProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type RegistrationStep = 1 | 2 | 3;

export default function RegisterScreen({
  visible,
  onClose,
  onSuccess,
}: RegisterScreenProps) {
  const [step, setStep] = useState<RegistrationStep>(1);
  
  // Шаг 1: О себе
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('+7 (');
  const [email, setEmail] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [agreePersonalData, setAgreePersonalData] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // Шаг 2: О бизнесе
  const [projectName, setProjectName] = useState('');
  const [outletsCount, setOutletsCount] = useState('');
  const [workFormat, setWorkFormat] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [projectLink, setProjectLink] = useState('');

  // Шаг 3: Данные для входа
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pressedArrow, setPressedArrow] = useState<'back' | 'forward' | null>(null);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  
  // Анимация для точек
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseAnim3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Анимация пульсации для активной точки
    const createPulseAnimation = (animValue: Animated.Value) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
    };

    let animation1: Animated.CompositeAnimation | null = null;
    let animation2: Animated.CompositeAnimation | null = null;
    let animation3: Animated.CompositeAnimation | null = null;

    // Сброс всех анимаций
    pulseAnim1.setValue(1);
    pulseAnim2.setValue(1);
    pulseAnim3.setValue(1);

    if (step === 1) {
      animation1 = createPulseAnimation(pulseAnim1);
      animation1.start();
    } else if (step === 2) {
      animation2 = createPulseAnimation(pulseAnim2);
      animation2.start();
    } else if (step === 3) {
      animation3 = createPulseAnimation(pulseAnim3);
      animation3.start();
    }

    return () => {
      animation1?.stop();
      animation2?.stop();
      animation3?.stop();
    };
  }, [step]);

  const validateStep3 = (): boolean => {
    const invalid = new Set<string>();
    
    if (!password.trim() || password.length < 6) {
      invalid.add('password');
    }

    if (!confirmPassword.trim()) {
      invalid.add('confirmPassword');
    } else if (password !== confirmPassword) {
      invalid.add('confirmPassword');
    }
    
    setInvalidFields(invalid);
    
    if (invalid.size > 0) {
      if (!password.trim() || password.length < 6) {
        setError('Пароль должен содержать минимум 6 символов');
      } else if (password !== confirmPassword) {
        setError('Пароли не совпадают');
      } else {
        setError('Заполните все обязательные поля');
      }
      return false;
    }
    
    setInvalidFields(new Set());
    return true;
  };

  const handleRegister = async () => {
    setError('');

    if (!validateStep3()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await register(email, password, {
        fullName,
        position,
        phone,
        socialLink,
        agreePersonalData,
        agreePrivacy,
        projectName,
        outletsCount,
        workFormat,
        city,
        address,
        projectLink,
      });
      
      if (response.success && response.user) {
        // Сохраняем данные анкетирования
        await saveUserQuestionnaire(response.user.id, {
          restaurantName: projectName,
          fullName,
          position,
          phone,
          email,
          telegram: socialLink,
          outletsCount,
          city,
          address,
          workFormat,
          socialLink: projectLink,
        });

        // Автоматически переходим на главный экран
        setLoading(false);
        handleClose();
        onSuccess?.();
      } else {
        setError(response.error || 'Ошибка регистрации');
        setLoading(false);
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      setError('Ошибка регистрации. Попробуйте снова.');
      setLoading(false);
    }
  };

  const validateStep1 = (): boolean => {
    const invalid = new Set<string>();
    
    if (!fullName.trim()) {
      invalid.add('fullName');
    }
    if (!position.trim()) {
      invalid.add('position');
    }
    // Проверяем, что телефон заполнен (минимум +7 (9XX) XXX-XX-XX = 18 символов)
    const phoneDigits = phone.replace(/[^\d]/g, '');
    if (phoneDigits.length < 11 || !phone.startsWith('+7')) {
      invalid.add('phone');
    }
    if (!email.trim() || !email.includes('@')) {
      invalid.add('email');
    }
    if (!agreePersonalData) {
      invalid.add('agreePersonalData');
    }
    if (!agreePrivacy) {
      invalid.add('agreePrivacy');
    }
    
    setInvalidFields(invalid);
    
    if (invalid.size > 0) {
      setError('Заполните все обязательные поля');
      return false;
    }
    
    setInvalidFields(new Set());
    return true;
  };

  const validateStep2 = (): boolean => {
    const invalid = new Set<string>();
    
    if (!projectName.trim()) {
      invalid.add('projectName');
    }
    if (!outletsCount.trim()) {
      invalid.add('outletsCount');
    }
    if (!workFormat.trim()) {
      invalid.add('workFormat');
    }
    if (!city.trim()) {
      invalid.add('city');
    }
    if (!address.trim()) {
      invalid.add('address');
    }
    
    setInvalidFields(invalid);
    
    if (invalid.size > 0) {
      setError('Заполните все обязательные поля');
      return false;
    }
    
    setInvalidFields(new Set());
    return true;
  };

  const handleNext = () => {
    setError('');
    setInvalidFields(new Set());
    
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      }
    }
  };

  const handleBack = () => {
    setError('');
    setInvalidFields(new Set());
    if (step > 1) {
      setStep((step - 1) as RegistrationStep);
    }
  };

  const formatPhoneNumber = (text: string): string => {
    // Удаляем все нецифровые символы, кроме +
    const cleaned = text.replace(/[^\d+]/g, '');
    
    // Если начинается не с +7, добавляем +7
    if (!cleaned.startsWith('+7')) {
      const digits = cleaned.replace(/\+/g, '');
      if (digits.length === 0) {
        return '+7 (';
      }
      // Если первая цифра 8, заменяем на 7
      const firstDigit = digits[0];
      const restDigits = digits.slice(1);
      if (firstDigit === '8') {
        return formatPhoneDigits('7' + restDigits);
      }
      return formatPhoneDigits('7' + digits);
    }
    
    // Извлекаем цифры после +7
    const digits = cleaned.slice(2);
    return formatPhoneDigits('7' + digits);
  };

  const formatPhoneDigits = (digits: string): string => {
    if (digits.length <= 1) {
      return '+7 (';
    }
    if (digits.length <= 4) {
      return `+7 (${digits.slice(1)}`;
    }
    if (digits.length <= 7) {
      return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    }
    if (digits.length <= 9) {
      return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  const handleClose = () => {
    setStep(1);
    setFullName('');
    setPosition('');
    setPhone('+7 (');
    setEmail('');
    setSocialLink('');
    setAgreePersonalData(false);
    setAgreePrivacy(false);
    setProjectName('');
    setOutletsCount('');
    setWorkFormat('');
    setCity('');
    setAddress('');
    setProjectLink('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  const renderStep1 = () => (
    <View>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>ФИО *</Text>
        <TextInput
          style={[
            styles.input,
            invalidFields.has('fullName') && styles.inputError
          ]}
          value={fullName}
          onChangeText={(value) => {
            setFullName(value);
            if (invalidFields.has('fullName')) {
              const newInvalid = new Set(invalidFields);
              newInvalid.delete('fullName');
              setInvalidFields(newInvalid);
            }
          }}
          placeholder="Введите ФИО"
          placeholderTextColor={COLORS.darkGray}
          editable={!loading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Должность *</Text>
        <TextInput
          style={[
            styles.input,
            invalidFields.has('position') && styles.inputError
          ]}
          value={position}
          onChangeText={(value) => {
            setPosition(value);
            if (invalidFields.has('position')) {
              const newInvalid = new Set(invalidFields);
              newInvalid.delete('position');
              setInvalidFields(newInvalid);
            }
          }}
          placeholder="Введите должность"
          placeholderTextColor={COLORS.darkGray}
          editable={!loading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Телефон *</Text>
        <TextInput
          style={[
            styles.input,
            invalidFields.has('phone') && styles.inputError
          ]}
          value={phone}
          onChangeText={(value) => {
            const formatted = formatPhoneNumber(value);
            setPhone(formatted);
            if (invalidFields.has('phone')) {
              const newInvalid = new Set(invalidFields);
              newInvalid.delete('phone');
              setInvalidFields(newInvalid);
            }
          }}
          placeholder="+7 (999) 123-45-67"
          placeholderTextColor={COLORS.darkGray}
          keyboardType="phone-pad"
          editable={!loading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Почта *</Text>
        <TextInput
          style={[
            styles.input,
            invalidFields.has('email') && styles.inputError
          ]}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (invalidFields.has('email')) {
              const newInvalid = new Set(invalidFields);
              newInvalid.delete('email');
              setInvalidFields(newInvalid);
            }
          }}
          placeholder="example@email.com"
          placeholderTextColor={COLORS.darkGray}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Ссылка на соц сети</Text>
        <TextInput
          style={styles.input}
          value={socialLink}
          onChangeText={setSocialLink}
          placeholder="https://instagram.com/username"
          placeholderTextColor={COLORS.darkGray}
          autoCapitalize="none"
          editable={!loading}
        />
      </View>

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            invalidFields.has('agreePersonalData') && styles.checkboxError
          ]}
          onPress={() => {
            setAgreePersonalData(!agreePersonalData);
            if (invalidFields.has('agreePersonalData')) {
              const newInvalid = new Set(invalidFields);
              newInvalid.delete('agreePersonalData');
              setInvalidFields(newInvalid);
            }
          }}
          disabled={loading}
        >
          <Ionicons
            name={agreePersonalData ? 'checkbox' : 'square-outline'}
            size={20}
            color={agreePersonalData ? COLORS.orange : (invalidFields.has('agreePersonalData') ? COLORS.red : COLORS.darkGray)}
          />
          <Text style={styles.checkboxLabel}>
            Я согласен на сбор и обработку персональных данных*
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            invalidFields.has('agreePrivacy') && styles.checkboxError
          ]}
          onPress={() => {
            setAgreePrivacy(!agreePrivacy);
            if (invalidFields.has('agreePrivacy')) {
              const newInvalid = new Set(invalidFields);
              newInvalid.delete('agreePrivacy');
              setInvalidFields(newInvalid);
            }
          }}
          disabled={loading}
        >
          <Ionicons
            name={agreePrivacy ? 'checkbox' : 'square-outline'}
            size={20}
            color={agreePrivacy ? COLORS.orange : (invalidFields.has('agreePrivacy') ? COLORS.red : COLORS.darkGray)}
          />
          <Text style={styles.checkboxLabel}>
            Я согласен с политикой конфиденциальности*
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Название проекта *</Text>
        <TextInput
          style={[
            styles.input,
            invalidFields.has('projectName') && styles.inputError
          ]}
          value={projectName}
          onChangeText={(value) => {
            setProjectName(value);
            if (invalidFields.has('projectName')) {
              const newInvalid = new Set(invalidFields);
              newInvalid.delete('projectName');
              setInvalidFields(newInvalid);
            }
          }}
          placeholder="Введите название проекта"
          placeholderTextColor={COLORS.darkGray}
          editable={!loading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Количество точек *</Text>
        <TextInput
          style={[
            styles.input,
            invalidFields.has('outletsCount') && styles.inputError
          ]}
          value={outletsCount}
          onChangeText={(value) => {
            setOutletsCount(value);
            if (invalidFields.has('outletsCount')) {
              const newInvalid = new Set(invalidFields);
              newInvalid.delete('outletsCount');
              setInvalidFields(newInvalid);
            }
          }}
          placeholder="Например: 3"
          placeholderTextColor={COLORS.darkGray}
          keyboardType="numeric"
          editable={!loading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Формат заведения *</Text>
        <TextInput
          style={[
            styles.input,
            invalidFields.has('workFormat') && styles.inputError
          ]}
          value={workFormat}
          onChangeText={(value) => {
            setWorkFormat(value);
            if (invalidFields.has('workFormat')) {
              const newInvalid = new Set(invalidFields);
              newInvalid.delete('workFormat');
              setInvalidFields(newInvalid);
            }
          }}
          placeholder="Кафе, ресторан, кофейня и пр."
          placeholderTextColor={COLORS.darkGray}
          editable={!loading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Город *</Text>
        <TextInput
          style={[
            styles.input,
            invalidFields.has('city') && styles.inputError
          ]}
          value={city}
          onChangeText={(value) => {
            setCity(value);
            if (invalidFields.has('city')) {
              const newInvalid = new Set(invalidFields);
              newInvalid.delete('city');
              setInvalidFields(newInvalid);
            }
          }}
          placeholder="Введите город"
          placeholderTextColor={COLORS.darkGray}
          editable={!loading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Адрес проекта/адрес флагмана *</Text>
        <TextInput
          style={[
            styles.input,
            invalidFields.has('address') && styles.inputError
          ]}
          value={address}
          onChangeText={(value) => {
            setAddress(value);
            if (invalidFields.has('address')) {
              const newInvalid = new Set(invalidFields);
              newInvalid.delete('address');
              setInvalidFields(newInvalid);
            }
          }}
          placeholder="Введите адрес"
          placeholderTextColor={COLORS.darkGray}
          editable={!loading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Ссылка на проект (сайт, соц сети)</Text>
        <TextInput
          style={styles.input}
          value={projectLink}
          onChangeText={setProjectLink}
          placeholder="https://example.com"
          placeholderTextColor={COLORS.darkGray}
          autoCapitalize="none"
          editable={!loading}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Логин *</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={email}
          editable={false}
          placeholderTextColor={COLORS.darkGray}
        />
        <Text style={styles.inputHint}>Почта из первого шага</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Пароль *</Text>
        <TextInput
          style={[
            styles.input,
            invalidFields.has('password') && styles.inputError
          ]}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (invalidFields.has('password')) {
              const newInvalid = new Set(invalidFields);
              newInvalid.delete('password');
              setInvalidFields(newInvalid);
            }
            // Проверяем совпадение паролей, если поле подтверждения уже заполнено
            if (confirmPassword) {
              if (value !== confirmPassword) {
                const newInvalid = new Set(invalidFields);
                newInvalid.add('confirmPassword');
                setInvalidFields(newInvalid);
                setError('Пароли не совпадают');
              } else {
                const newInvalid = new Set(invalidFields);
                newInvalid.delete('confirmPassword');
                setInvalidFields(newInvalid);
                if (value.length >= 6) {
                  setError('');
                }
              }
            }
          }}
          placeholder="Минимум 6 символов"
          placeholderTextColor={COLORS.darkGray}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Подтвердите пароль *</Text>
        <TextInput
          style={[
            styles.input,
            invalidFields.has('confirmPassword') && styles.inputError
          ]}
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            // Проверяем совпадение паролей в реальном времени
            if (value && password && value !== password) {
              const newInvalid = new Set(invalidFields);
              newInvalid.add('confirmPassword');
              setInvalidFields(newInvalid);
              setError('Пароли не совпадают');
            } else if (invalidFields.has('confirmPassword')) {
              const newInvalid = new Set(invalidFields);
              newInvalid.delete('confirmPassword');
              setInvalidFields(newInvalid);
              if (value === password && password.length >= 6) {
                setError('');
              }
            }
          }}
          placeholder="Повторите пароль"
          placeholderTextColor={COLORS.darkGray}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          onSubmitEditing={handleRegister}
          returnKeyType="done"
        />
      </View>

      <Text style={styles.requiredNote}>* поля, обязательные для заполнения</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Способы подтвердить регистрацию</Text>
        <View style={styles.confirmButtonsVertical}>
          <AnimatedPressable
            style={[styles.confirmButtonVertical, styles.confirmEmailButton, styles.confirmEmailButtonWidth]}
            onPress={() => {
              // Кнопка номинальная, без действия
            }}
            disabled={loading}
          >
            <Ionicons name="mail-outline" size={16} color={COLORS.white} />
            <Text style={styles.confirmButtonTextSmall}>Почта</Text>
          </AnimatedPressable>

          <AnimatedPressable
            style={[styles.confirmButtonVertical, styles.confirmPhoneButton, styles.confirmPhoneButtonWidth]}
            onPress={() => {
              // Кнопка номинальная, без действия
            }}
            disabled={loading}
          >
            <Ionicons name="call-outline" size={16} color={COLORS.white} />
            <Text style={styles.confirmButtonTextSmall}>SMS</Text>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <ScrollView
          contentContainerStyle={styles.modalScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={COLORS.blue} />
            </TouchableOpacity>
            <Text style={styles.stepTitle}>
              {step === 1 && 'О себе'}
              {step === 2 && 'О бизнесе'}
              {step === 3 && 'Данные для входа'}
            </Text>

            {/* Индикатор шагов */}
            <View style={styles.stepIndicator}>
              <Animated.View 
                style={[
                  styles.stepDot, 
                  step >= 1 && styles.stepDotActive,
                  step === 1 && { transform: [{ scale: pulseAnim1 }] }
                ]} 
              />
              <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
              <Animated.View 
                style={[
                  styles.stepDot, 
                  step >= 2 && styles.stepDotActive,
                  step === 2 && { transform: [{ scale: pulseAnim2 }] }
                ]} 
              />
              <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
              <Animated.View 
                style={[
                  styles.stepDot, 
                  step >= 3 && styles.stepDotActive,
                  step === 3 && { transform: [{ scale: pulseAnim3 }] }
                ]} 
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {step !== 3 && (
              <Text style={styles.requiredNote}>* поля, обязательные для заполнения</Text>
            )}

            {step === 3 && (
              <AnimatedPressable
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.registerButtonText}>Зарегистрировать проект</Text>
              </AnimatedPressable>
            )}

            <View style={styles.arrowsContainer}>
              {step > 1 ? (
                <AnimatedPressable
                  style={styles.arrowButton}
                  onPress={handleBack}
                  onPressIn={() => setPressedArrow('back')}
                  onPressOut={() => setPressedArrow(null)}
                  disabled={loading}
                >
                  <View style={[
                    styles.arrowCircle,
                    pressedArrow === 'back' && styles.arrowCircleActive,
                    loading && styles.disabledArrow
                  ]}>
                    <Ionicons 
                      name="chevron-back" 
                      size={24} 
                      color={pressedArrow === 'back' ? COLORS.white : COLORS.blue} 
                    />
                  </View>
                </AnimatedPressable>
              ) : (
                <View style={[styles.arrowButton, styles.arrowButtonDisabled]}>
                  <View style={styles.arrowCircleDisabled}>
                    <Ionicons 
                      name="chevron-back" 
                      size={24} 
                      color={COLORS.darkGray} 
                    />
                  </View>
                </View>
              )}

              {step < 3 ? (
                <AnimatedPressable
                  style={styles.arrowButton}
                  onPress={handleNext}
                  onPressIn={() => setPressedArrow('forward')}
                  onPressOut={() => setPressedArrow(null)}
                  disabled={loading}
                >
                  <View style={[
                    styles.arrowCircle,
                    pressedArrow === 'forward' && styles.arrowCircleActive,
                    loading && styles.disabledArrow
                  ]}>
                    <Ionicons 
                      name="chevron-forward" 
                      size={24} 
                      color={pressedArrow === 'forward' ? COLORS.white : COLORS.blue} 
                    />
                  </View>
                </AnimatedPressable>
              ) : (
                <View style={[styles.arrowButton, styles.arrowButtonDisabled]}>
                  <View style={styles.arrowCircleDisabled}>
                    <Ionicons 
                      name="chevron-forward" 
                      size={24} 
                      color={COLORS.darkGray} 
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    paddingBottom: 16,
    width: '90%',
    maxWidth: 400,
    minWidth: 350,
    minHeight: 500,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
    alignSelf: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 12,
    top: 16,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    width: '100%',
    marginBottom: 12,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.blue,
    textAlign: 'center',
    width: '100%',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.gray,
    borderWidth: 2,
    borderColor: COLORS.darkGray,
  },
  stepDotActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.gray,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: COLORS.orange,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
    width: '100%',
    alignSelf: 'center',
  },
  tempContent: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  tempText: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  checkboxContainer: {
    marginBottom: 12,
    width: '100%',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  checkboxError: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#FFF5F5',
  },
  checkboxLabel: {
    fontSize: 12,
    color: COLORS.blue,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  inputContainer: {
    marginBottom: 12,
    width: '100%',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 6,
    paddingLeft: 0,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  input: {
    backgroundColor: COLORS.gray,
    borderRadius: 8,
    paddingVertical: 0,
    paddingHorizontal: 10,
    fontSize: 14,
    color: COLORS.blue,
    borderWidth: 1,
    borderColor: COLORS.gray,
    height: 44,
    minHeight: 44,
    maxHeight: 44,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  inputError: {
    borderColor: COLORS.red,
    borderWidth: 2,
    backgroundColor: '#FFF5F5',
    height: 44,
    minHeight: 44,
    maxHeight: 44,
  },
  disabledInput: {
    opacity: 0.6,
    height: 44,
    minHeight: 44,
    maxHeight: 44,
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 4,
  },
  recoverySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
  },
  recoveryLink: {
    marginBottom: 16,
    alignItems: 'center',
  },
  recoveryLinkText: {
    fontSize: 14,
    color: COLORS.blue,
    textDecorationLine: 'underline',
  },
  confirmTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButtonsVertical: {
    flexDirection: 'column',
    gap: 12,
    alignItems: 'stretch',
    width: '100%',
    alignSelf: 'stretch',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  confirmButtonVertical: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  confirmEmailButton: {
    backgroundColor: COLORS.blue,
  },
  confirmEmailButtonWidth: {
    // Не нужен отдельный стиль, width: '100%' в confirmButtonVertical
  },
  confirmPhoneButton: {
    backgroundColor: COLORS.orange,
  },
  confirmPhoneButtonWidth: {
    // Не нужен отдельный стиль, width: '100%' в confirmButtonVertical
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  confirmButtonTextSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.white,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.red,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.red,
    textAlign: 'center',
  },
  arrowsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 8,
    marginBottom: 8,
    paddingTop: 4,
  },
  arrowButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  arrowCircleActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  disabledArrow: {
    opacity: 0.5,
  },
  arrowButtonDisabled: {
    opacity: 0.3,
  },
  arrowCircleDisabled: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  requiredNote: {
    fontSize: 11,
    color: COLORS.darkGray,
    textAlign: 'left',
    marginTop: 4,
    marginBottom: 8,
    opacity: 0.7,
    paddingLeft: 2,
  },
  registerButton: {
    width: '100%',
    backgroundColor: COLORS.blue,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
