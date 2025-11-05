import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import { findUserByEmail, findUserByUsername, saveUser } from '../utils/usersStorage';

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

export default function RegisterScreen({
  visible,
  onClose,
  onSuccess,
}: RegisterScreenProps) {
  // Основные поля
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Форматирование телефона с маской +7
  const handlePhoneChange = (text: string) => {
    // Убираем все нецифровые символы
    let cleaned = text.replace(/\D/g, '');
    
    // Если пользователь начинает вводить с 7 или 8, заменяем на пустую строку (будет добавлен +7)
    if (cleaned.startsWith('7')) {
      cleaned = cleaned.slice(1);
    }
    if (cleaned.startsWith('8')) {
      cleaned = cleaned.slice(1);
    }
    
    // Ограничиваем длину до 10 цифр (без +7)
    cleaned = cleaned.slice(0, 10);
    
    setPhone(cleaned);
  };
  
  const getFormattedPhoneDisplay = (phoneNumber: string) => {
    // Всегда начинаем с "+7 ("
    const prefix = '+7 (';
    
    // Если поле пустое, показываем только префикс
    if (!phoneNumber || phoneNumber.length === 0) return prefix;
    
    // Убираем все нецифровые символы
    let digits = phoneNumber.replace(/\D/g, '');
    
    // Если первая цифра 7 или 8, убираем её
    if (digits.startsWith('7')) {
      digits = digits.slice(1);
    }
    if (digits.startsWith('8')) {
      digits = digits.slice(1);
    }
    
    // Ограничиваем до 10 цифр
    digits = digits.slice(0, 10);
    
    // Если после обработки ничего не осталось, возвращаем только префикс
    if (digits.length === 0) return prefix;
    
    // Форматируем с префиксом "+7 ("
    if (digits.length <= 3) return `${prefix}${digits}`;
    if (digits.length <= 6) return `${prefix}${digits.slice(0, 3)}) ${digits.slice(3)}`;
    if (digits.length <= 8) return `${prefix}${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `${prefix}${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  };
  
  // Чекбоксы
  const [agreePersonalData, setAgreePersonalData] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  
  // Данные для входа
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Подтверждение
  const [verificationMethod, setVerificationMethod] = useState<'sms' | 'email' | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  
  // Состояние для переключения между окнами
  const [currentStep, setCurrentStep] = useState<'registration' | 'login'>('registration');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Валидация и переход к следующему шагу
  const handleRegistrationComplete = async () => {
    setError('');

    // Валидация основных полей
    if (!firstName.trim()) {
      setError('Введите имя');
      return;
    }
    
    if (!lastName.trim()) {
      setError('Введите фамилию');
      return;
    }
    
    if (!email.trim()) {
      setError('Введите email');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Введите корректный email');
      return;
    }

    // Проверяем, не занят ли email
    const existingUserByEmail = await findUserByEmail(email);
    if (existingUserByEmail) {
      setError('Пользователь с таким email уже зарегистрирован');
      return;
    }

    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Введите корректный номер телефона');
      return;
    }

    // Проверка обязательного чекбокса
    if (!agreePersonalData) {
      setError('Необходимо согласие на обработку персональных данных');
      return;
    }

    // Переходим к следующему шагу
    setCurrentStep('login');
    setError('');
  };

  const handleSendVerificationCode = async (method: 'sms' | 'email') => {
    setError('');

    // Валидация данных для входа
    if (!username.trim()) {
      setError('Введите логин');
      return;
    }
    
    // Проверяем, не занят ли логин
    const existingUserByUsername = await findUserByUsername(username);
    if (existingUserByUsername) {
      setError('Пользователь с таким логином уже существует');
      return;
    }
    
    if (!password.trim()) {
      setError('Введите пароль');
      return;
    }
    
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    // Отправляем код подтверждения
    setVerificationMethod(method);
    setLoading(true);
    
    try {
      // TODO: Интеграция с API отправки SMS или Email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowVerificationInput(true);
      const methodText = method === 'sms' ? 'SMS' : 'почту';
      Alert.alert('Код отправлен', `Код подтверждения отправлен на ваш ${methodText}`);
    } catch (error) {
      setError(`Ошибка отправки кода на ${method === 'sms' ? 'SMS' : 'почту'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!verificationCode.trim()) {
      setError('Введите код подтверждения');
      return;
    }

    setLoading(true);
    
    try {
      // TODO: Проверка кода через API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Проверяем, не занят ли логин
      const existingUserByUsername = await findUserByUsername(username);
      if (existingUserByUsername) {
        setError('Пользователь с таким логином уже существует');
        setLoading(false);
        return;
      }
      
      // Сохраняем пользователя
      const fullPhone = `+7${phone.replace(/\D/g, '')}`;
      const savedUser = await saveUser({
        firstName,
        lastName,
        email,
        phone: fullPhone,
        username,
        agreePersonalData,
        agreeMarketing,
      });
      
      console.log('Пользователь успешно зарегистрирован:', savedUser.id);
      
      Alert.alert(
        'Регистрация успешна',
        'Вы успешно зарегистрированы!',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess?.();
              handleClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      setError('Неверный код подтверждения или ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setAgreePersonalData(false);
    setAgreeMarketing(false);
    setVerificationMethod(null);
    setVerificationCode('');
    setShowVerificationInput(false);
    setCurrentStep('registration');
    setError('');
    onClose();
  };

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
        {currentStep === 'registration' ? (
          <View style={styles.modalContentCompact}>
            <View style={styles.header}>
              <Text style={styles.modalTitle}>Регистрация</Text>
              <AnimatedPressable
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Ionicons name="close" size={24} color={COLORS.darkGray} />
              </AnimatedPressable>
            </View>

            <View style={styles.formContainer}>
                {/* Основные поля */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Личные данные</Text>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Имя *</Text>
                      <TextInput
                        style={styles.input}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Введите имя"
                        placeholderTextColor={COLORS.darkGray}
                        editable={!loading}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Фамилия *</Text>
                      <TextInput
                        style={styles.input}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Введите фамилию"
                        placeholderTextColor={COLORS.darkGray}
                        editable={!loading}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Почта *</Text>
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="example@email.com"
                        placeholderTextColor={COLORS.darkGray}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                      />
                    </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Телефон *</Text>
                  <TextInput
                    style={styles.input}
                    value={getFormattedPhoneDisplay(phone)}
                    onChangeText={handlePhoneChange}
                    placeholder=""
                    placeholderTextColor={COLORS.darkGray}
                    keyboardType="phone-pad"
                    editable={!loading}
                    maxLength={18} // +7 (999) 123-45-67
                    autoComplete="tel"
                  />
                </View>

                    {/* Чекбоксы */}
                    <View style={styles.checkboxContainer}>
                      <AnimatedPressable
                        style={styles.checkbox}
                        onPress={() => setAgreePersonalData(!agreePersonalData)}
                        disabled={loading}
                      >
                        <View style={[styles.checkboxBox, agreePersonalData && styles.checkboxChecked]}>
                          {agreePersonalData && (
                            <Ionicons name="checkmark" size={16} color={COLORS.white} />
                          )}
                        </View>
                        <Text style={styles.checkboxText}>
                          Согласие на обработку персональных данных<Text style={styles.requiredStar}>*</Text>
                        </Text>
                      </AnimatedPressable>

                      <AnimatedPressable
                        style={styles.checkbox}
                        onPress={() => setAgreeMarketing(!agreeMarketing)}
                        disabled={loading}
                      >
                        <View style={[styles.checkboxBox, agreeMarketing && styles.checkboxChecked]}>
                          {agreeMarketing && (
                            <Ionicons name="checkmark" size={16} color={COLORS.white} />
                          )}
                        </View>
                        <Text style={styles.checkboxText}>
                          Согласие на получение рекламных материалов
                        </Text>
                      </AnimatedPressable>
                    </View>
                  </View>

                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Кнопка продолжения */}
                <AnimatedPressable
                  style={[styles.continueButton, loading && styles.disabledButton]}
                  onPress={handleRegistrationComplete}
                  disabled={loading}
                >
                  <Text style={styles.continueButtonText}>Далее</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                </AnimatedPressable>
              </View>

              {/* Кнопка закрытия */}
              <AnimatedPressable
                style={[styles.cancelButton, styles.bottomButton]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </AnimatedPressable>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalContent}>
                <View style={styles.header}>
                  <Text style={styles.modalTitle}>Данные для входа</Text>
                  <AnimatedPressable
                    style={styles.closeButton}
                    onPress={handleClose}
                  >
                    <Ionicons name="close" size={24} color={COLORS.darkGray} />
                  </AnimatedPressable>
                </View>

                <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
                {/* Данные для входа */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Данные для входа</Text>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Логин *</Text>
                      <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Введите логин"
                        placeholderTextColor={COLORS.darkGray}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading && !showVerificationInput}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Пароль *</Text>
                      <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Минимум 6 символов"
                        placeholderTextColor={COLORS.darkGray}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading && !showVerificationInput}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Подтвердите пароль *</Text>
                      <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Повторите пароль"
                        placeholderTextColor={COLORS.darkGray}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading && !showVerificationInput}
                      />
                    </View>
                  </View>

                  {/* Подтверждение регистрации */}
                  {!showVerificationInput ? (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Подтвердить регистрацию с помощью:</Text>
                      
                      <View style={styles.verificationButtonsVertical}>
                        <AnimatedPressable
                          style={[styles.verificationButtonFullWidth, styles.smsButton]}
                          onPress={() => handleSendVerificationCode('sms')}
                          disabled={loading}
                        >
                          <Ionicons name="call-outline" size={20} color={COLORS.white} />
                          <Text style={styles.verificationButtonText}>Код из SMS</Text>
                        </AnimatedPressable>

                        <AnimatedPressable
                          style={[styles.verificationButtonFullWidth, styles.emailButton]}
                          onPress={() => handleSendVerificationCode('email')}
                          disabled={loading}
                        >
                          <Ionicons name="mail-outline" size={20} color={COLORS.white} />
                          <Text style={styles.verificationButtonText}>Код на почту</Text>
                        </AnimatedPressable>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        Код отправлен на {verificationMethod === 'sms' ? 'SMS' : 'почту'}
                      </Text>
                      
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Код подтверждения *</Text>
                        <TextInput
                          style={styles.input}
                          value={verificationCode}
                          onChangeText={setVerificationCode}
                          placeholder="Введите код"
                          placeholderTextColor={COLORS.darkGray}
                          keyboardType="number-pad"
                          editable={!loading}
                        />
                      </View>

                      <AnimatedPressable
                        style={[styles.submitButton, loading && styles.disabledButton]}
                        onPress={handleVerifyAndRegister}
                        disabled={loading}
                      >
                        <Text style={styles.submitButtonText}>
                          {loading ? 'Проверка...' : 'Подтвердить'}
                        </Text>
                      </AnimatedPressable>

                      <AnimatedPressable
                        style={styles.backButton}
                        onPress={() => {
                          setShowVerificationInput(false);
                          setVerificationCode('');
                          setVerificationMethod(null);
                        }}
                        disabled={loading}
                      >
                        <Text style={styles.backButtonText}>Изменить способ подтверждения</Text>
                      </AnimatedPressable>
                    </View>
                  )}

                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Кнопка назад */}
                <AnimatedPressable
                  style={styles.backStepButton}
                  onPress={() => {
                    setCurrentStep('registration');
                    setError('');
                  }}
                  disabled={loading || showVerificationInput}
                >
                  <Ionicons name="arrow-back" size={20} color={COLORS.blue} />
                  <Text style={styles.backStepButtonText}>Назад</Text>
                </AnimatedPressable>
                </ScrollView>

                {/* Кнопка закрытия */}
                <AnimatedPressable
                  style={[styles.cancelButton, styles.bottomButton]}
                  onPress={handleClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Отмена</Text>
                </AnimatedPressable>
              </View>
            </ScrollView>
          )}
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
    padding: 12,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    maxWidth: '100%',
    maxHeight: '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContentCompact: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: '90%',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.blue,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  formScrollView: {
    flexGrow: 0, // Не растягивается, чтобы кнопка была видна
    maxHeight: 500,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 12,
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.gray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.blue,
    borderWidth: 1,
    borderColor: COLORS.gray,
    height: 44, // Фиксированная высота для компактности
  },
  checkboxContainer: {
    marginTop: 4,
    gap: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.blue,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  checkboxText: {
    fontSize: 13,
    color: COLORS.blue,
    flex: 1,
    lineHeight: 18,
  },
  requiredStar: {
    fontSize: 13,
    color: COLORS.blue,
    flexShrink: 0,
  },
  continueButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  verificationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  verificationButtonsVertical: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  verificationButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  verificationButtonFullWidth: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  smsButton: {
    backgroundColor: COLORS.orange,
  },
  emailButton: {
    backgroundColor: COLORS.blue,
  },
  verificationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  submitButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  backButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: COLORS.blue,
    textDecorationLine: 'underline',
  },
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  backStepButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
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
  bottomButton: {
    marginTop: 16,
    width: '100%',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.gray,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
