import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { palette } from '../styles/theme';

interface RegisterScreenProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegisterScreen({ visible, onClose, onSuccess }: RegisterScreenProps) {
  // Заглушка для модального окна регистрации
  // TODO: Реализовать полноценный экран регистрации
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Заглушка - можно будет заменить на полноценный экран регистрации */}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
});



