import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import { login } from '../utils/api';
import PasswordResetScreen from './PasswordResetScreen';
import RegisterScreen from './RegisterScreen';

const logo = require('../../assets/images/logo-pelby.png');

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  white: '#FFFFFF',
  gray: '#F0F0F0',
  darkGray: '#666666',
  red: '#FF0000',
};

interface AuthScreenProps {
  onContinue: () => void;
}

export default function AuthScreen({ onContinue }: AuthScreenProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    // Анимация перелива логотипа
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Анимация появления контента
    const fadeAnimation = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    });

    shimmerAnimation.start();
    fadeAnimation.start();

    return () => {
      shimmerAnimation.stop();
    };
  }, []);

  const scale = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1, 0.8],
  });

  const handleLogin = async () => {
    setError('');
    
    // Валидация
    if (!email.trim()) {
      setError('Введите email');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Введите корректный email');
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

    setLoading(true);
    
    try {
      const response = await login(email, password);
      
      if (response.success) {
        console.log('Авторизация успешна:', email);
        
        // Переходим в приложение
        setTimeout(() => {
          setLoading(false);
          setShowLoginModal(false);
          setEmail('');
          setPassword('');
          onContinue();
        }, 500);
      } else {
        setError(response.error || 'Ошибка авторизации. Проверьте email и пароль.');
        setLoading(false);
      }
      
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      setError('Ошибка подключения к серверу. Попробуйте снова.');
      setLoading(false);
    }
  };

  const handleOpenLoginModal = () => {
    setShowLoginModal(true);
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleOpenRegisterModal = () => {
    setShowRegisterModal(true);
  };

  const handleRegisterSuccess = () => {
    setShowRegisterModal(false);
    // После успешной регистрации автоматически авторизуемся
    onContinue();
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    setError('');
    setEmail('');
    setPassword('');
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.logoContainer}>
        <Animated.View style={[styles.logo, { transform: [{ scale }], opacity }]}>
          <Image 
            source={logo} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <View style={styles.buttonsContainer}>
        <AnimatedPressable
          style={[styles.button, styles.blueButton]}
          onPress={onContinue}
        >
          <Text style={styles.blueButtonText}>Продолжить без авторизации</Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.button, styles.orangeButton]}
          onPress={handleOpenRegisterModal}
        >
          <Text style={styles.orangeButtonText}>Зарегистрироваться</Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.button, styles.loginButton]}
          onPress={handleOpenLoginModal}
        >
          <Text style={styles.loginButtonText}>Войти</Text>
        </AnimatedPressable>
      </View>

      {/* Модальное окно авторизации */}
      <Modal
        visible={showLoginModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseLoginModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Авторизация</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
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
                <Text style={styles.inputLabel}>Пароль</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Введите пароль"
                  placeholderTextColor={COLORS.darkGray}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                />
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <AnimatedPressable
                style={styles.forgotPasswordLink}
                onPress={() => {
                  setShowLoginModal(false);
                  setShowPasswordReset(true);
                }}
              >
                <Text style={styles.forgotPasswordText}>Забыли пароль?</Text>
              </AnimatedPressable>

              <View style={styles.modalButtons}>
                <AnimatedPressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCloseLoginModal}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Отмена</Text>
                </AnimatedPressable>

                  <AnimatedPressable
                    style={[
                      styles.modalButton,
                      styles.loginModalButton,
                      loading && styles.disabledButton
                    ]}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    <Text style={styles.loginModalButtonText}>
                      {loading ? 'Вход...' : 'Войти'}
                    </Text>
                  </AnimatedPressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Модальное окно восстановления пароля */}
      <PasswordResetScreen
        visible={showPasswordReset}
        onClose={() => setShowPasswordReset(false)}
        onSuccess={() => {
          // После успешного восстановления можно снова открыть форму входа
          setTimeout(() => {
            handleOpenLoginModal();
          }, 100);
        }}
      />

      {/* Модальное окно регистрации */}
      <RegisterScreen
        visible={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={handleRegisterSuccess}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    paddingTop: 80,
  },
  logo: {
    width: 350,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 350,
    height: 300,
  },
  buttonsContainer: {
    width: '100%',
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  button: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  blueButton: {
    backgroundColor: COLORS.blue,
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: COLORS.blue,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  orangeButton: {
    backgroundColor: COLORS.orange,
    shadowColor: COLORS.orange,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.blue,
    shadowColor: COLORS.blue,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  blueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  orangeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
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
    padding: 14,
    fontSize: 16,
    color: COLORS.blue,
    borderWidth: 1,
    borderColor: COLORS.gray,
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: COLORS.gray,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
  },
  loginModalButton: {
    backgroundColor: COLORS.orange,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
  },
  loginModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  forgotPasswordLink: {
    marginBottom: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.blue,
    textDecorationLine: 'underline',
  },
});
