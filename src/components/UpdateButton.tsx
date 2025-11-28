import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { palette, radii, spacing, typography } from '../styles/theme';
import AnimatedPressable from './AnimatedPressable';

interface UpdateButtonProps {
  style?: any;
}

export default function UpdateButton({ style }: UpdateButtonProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Проверка доступности обновлений (только для production)
  const checkForUpdates = async () => {
    const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
    
    // Для web-версии: всегда можно "обновиться" через перезагрузку
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const confirmed = window.confirm('Проверить обновления? Страница будет перезагружена.');
        if (confirmed) {
          window.location.reload();
        }
      }
      return;
    }
    
    // Для мобильных: проверяем development режим
    if (isDev) {
      Alert.alert(
        'Обновления',
        'Обновления доступны только в production версии приложения',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const update = await Updates.checkForUpdateAsync();
      setUpdateAvailable(update.isAvailable);
      
      if (update.isAvailable) {
        Alert.alert(
          'Доступно обновление',
          'Найдено новое обновление приложения. Хотите установить его сейчас?',
          [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Обновить', onPress: downloadAndApplyUpdate }
          ]
        );
      } else {
        Alert.alert('Обновления', 'У вас установлена последняя версия приложения');
      }
    } catch (error) {
      console.error('Ошибка проверки обновлений:', error);
      Alert.alert('Ошибка', 'Не удалось проверить обновления');
    }
  };

  // Загрузка и применение обновления
  const downloadAndApplyUpdate = async () => {
    const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
    if (isDev || Platform.OS === 'web') {
      Alert.alert('Обновления', 'Обновления доступны только в production версии');
      return;
    }

    try {
      setIsUpdating(true);
      
      // Загружаем обновление
      const result = await Updates.fetchUpdateAsync();
      
      if (result.isNew) {
        // Применяем обновление
        await Updates.reloadAsync();
      } else {
        setIsUpdating(false);
        Alert.alert('Обновления', 'Обновление уже установлено');
      }
    } catch (error: any) {
      console.error('Ошибка обновления:', error);
      setIsUpdating(false);
      Alert.alert(
        'Ошибка обновления',
        error.message || 'Не удалось обновить приложение. Попробуйте позже.'
      );
    }
  };

  // Принудительное обновление (для админов)
  const forceUpdate = async () => {
    const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
    
    // Для web-версии: просто перезагружаем страницу
    if (Platform.OS === 'web') {
      if (isDev) {
        // В development режиме на web просто перезагружаем
        if (typeof window !== 'undefined' && window.confirm('Обновить приложение? Страница будет перезагружена.')) {
          window.location.reload();
        }
        return;
      }
      
      // В production на web: перезагружаем с очисткой кэша
      if (typeof window !== 'undefined' && window.confirm('Обновить приложение? Страница будет перезагружена для получения последней версии.')) {
        setIsUpdating(true);
        // Hard reload для очистки кэша
        window.location.reload();
      }
      return;
    }
    
    // Для мобильных: проверяем development режим
    if (isDev) {
      Alert.alert(
        'Обновление приложения',
        'В development режиме обновления недоступны. Используйте production сборку.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Обновить приложение',
      'Это действие загрузит и установит последнее доступное обновление. Продолжить?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Обновить', onPress: downloadAndApplyUpdate }
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      <AnimatedPressable
        onPress={forceUpdate}
        disabled={isUpdating}
        style={styles.button}
      >
        <Ionicons
          name={isUpdating ? 'refresh' : 'refresh-outline'}
          size={20}
          color={palette.primaryBlue}
          style={isUpdating ? styles.rotating : undefined}
        />
        <Text style={styles.buttonText}>
          {isUpdating ? 'Обновление...' : 'Обновить приложение'}
        </Text>
      </AnimatedPressable>
      
      {updateAvailable && (
        <Text style={styles.updateAvailable}>
          Доступно обновление
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
    borderWidth: 2,
    borderColor: palette.primaryBlue,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  buttonText: {
    ...typography.body,
    color: palette.primaryBlue,
    fontWeight: '600',
  },
  updateAvailable: {
    ...typography.caption,
    color: palette.primaryOrange,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  rotating: {
    transform: [{ rotate: '360deg' }],
  },
});

