import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import { resetPassword } from '../utils/api';

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  white: '#FFFFFF',
  gray: '#F0F0F0',
  darkGray: '#666666',
  green: '#00AA00',
  red: '#FF0000',
};

interface PasswordResetScreenProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PasswordResetScreen({
  visible,
  onClose,
  onSuccess,
}: PasswordResetScreenProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('Введите email');
      return;
    }

    if (!email.includes('@')) {
      setError('Введите корректный email');
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(email);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setEmail('');
          onSuccess?.();
          onClose();
        }, 3000);
      } else {
        setError(response.error || 'Ошибка восстановления пароля');
      }
    } catch (error) {
      console.error('Ошибка восстановления пароля:', error);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess(false);
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
        <ScrollView
          contentContainerStyle={styles.modalScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.modalTitle}>Восстановление пароля</Text>
              <AnimatedPressable
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Ionicons name="close" size={24} color={COLORS.darkGray} />
              </AnimatedPressable>
            </View>

            {success ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={64} color={COLORS.green} />
                <Text style={styles.successText}>
                  Инструкции по восстановлению пароля отправлены на ваш email
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.description}>
                  Введите email, указанный при регистрации. Мы отправим вам инструкции по восстановлению пароля.
                </Text>

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

                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.modalButtons}>
                  <AnimatedPressable
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={handleClose}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Отмена</Text>
                  </AnimatedPressable>

                  <AnimatedPressable
                    style={[
                      styles.modalButton,
                      styles.resetButton,
                      loading && styles.disabledButton
                    ]}
                    onPress={handleReset}
                    disabled={loading}
                  >
                    <Text style={styles.resetButtonText}>
                      {loading ? 'Отправка...' : 'Отправить'}
                    </Text>
                  </AnimatedPressable>
                </View>
              </>
            )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.blue,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 24,
    lineHeight: 20,
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
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successText: {
    fontSize: 16,
    color: COLORS.green,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
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
  resetButton: {
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
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

