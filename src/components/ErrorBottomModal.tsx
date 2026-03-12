import React, { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { SvgXml } from 'react-native-svg';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AnimatedPressable from './AnimatedPressable';

interface ErrorBottomModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  buttonText?: string;
  onRetry: () => void;
  onClose: () => void;
}

export default function ErrorBottomModal({
  visible,
  title = 'Упс! Произошла ошибка',
  message = 'Попробуйте снова — обычно это помогает. Мы уже занимаемся её исправлением.',
  buttonText = 'Повторить',
  onRetry,
  onClose,
}: ErrorBottomModalProps) {
  const [errorIconSvg, setErrorIconSvg] = useState('');

  useEffect(() => {
    const loadIcon = async () => {
      try {
        const asset = Asset.fromModule(
          require('../../assets/images/Avatar [1.0] (2) — копия.svg')
        );
        await asset.downloadAsync();
        if (asset.localUri) {
          const response = await fetch(asset.localUri);
          setErrorIconSvg(await response.text());
        }
      } catch (error) {
        console.error('Ошибка загрузки иконки ErrorBottomModal:', error);
      }
    };

    loadIcon();
  }, []);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>

          <View style={styles.iconWrap}>
            {errorIconSvg ? <SvgXml xml={errorIconSvg} width={74} height={74} /> : null}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>
            {message}
          </Text>

          <AnimatedPressable style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>{buttonText}</Text>
          </AnimatedPressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 10,
    minHeight: 345,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  closeText: {
    color: '#6A6C70',
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '300',
  },
  iconWrap: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    textAlign: 'center',
    color: '#0A0D14',
    fontSize: 44 / 2,
    lineHeight: 56 / 2,
    fontWeight: '600',
    marginBottom: 12,
  },
  message: {
    textAlign: 'center',
    color: '#3E434D',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '300',
    paddingHorizontal: 6,
  },
  retryButton: {
    marginTop: 20,
    height: 60,
    borderRadius: 99,
    backgroundColor: '#191BDF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 36 / 2,
    lineHeight: 46 / 2,
    fontWeight: '400',
  },
});
