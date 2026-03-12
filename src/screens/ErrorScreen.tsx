import React, { useEffect, useMemo, useState } from 'react';
import { Asset } from 'expo-asset';
import { SvgXml } from 'react-native-svg';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import AnimatedPressable from '../components/AnimatedPressable';
import { palette, spacing } from '../styles/theme';

interface ErrorScreenRouteParams {
  title?: string;
  message?: string;
  buttonText?: string;
  retryRouteName?: string;
  retryParams?: Record<string, unknown>;
}

export default function ErrorScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route.params || {}) as ErrorScreenRouteParams;

  const [backIconSvg, setBackIconSvg] = useState('');
  const [errorIconSvg, setErrorIconSvg] = useState('');

  const title = params.title || 'Упс! Произошла ошибка';
  const message =
    params.message ||
    'Попробуйте снова — обычно это помогает.\nМы уже занимаемся её исправлением.';
  const buttonText = params.buttonText || 'Повторить';

  useEffect(() => {
    const loadIcons = async () => {
      try {
        const backAsset = Asset.fromModule(require('../../assets/images/Frame 8 (3).svg'));
        await backAsset.downloadAsync();
        if (backAsset.localUri) {
          const response = await fetch(backAsset.localUri);
          setBackIconSvg(await response.text());
        }

        const errorAsset = Asset.fromModule(
          require('../../assets/images/Avatar [1.0] (2) — копия.svg')
        );
        await errorAsset.downloadAsync();
        if (errorAsset.localUri) {
          const response = await fetch(errorAsset.localUri);
          setErrorIconSvg(await response.text());
        }
      } catch (error) {
        console.error('Ошибка загрузки иконок ErrorScreen:', error);
      }
    };

    loadIcons();
  }, []);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('MainTabs');
  };

  const handleRetry = () => {
    if (params.retryRouteName) {
      navigation.navigate(params.retryRouteName, params.retryParams || {});
      return;
    }
    handleBack();
  };

  const messageLines = useMemo(() => {
    // Keep helper text in two visual lines for this screen layout.
    const compact = message.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    return compact.replace(/\.?\s+Мы\s+/i, '.\nМы ');
  }, [message]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.75}>
          {backIconSvg ? (
            <SvgXml xml={backIconSvg} width={24} height={24} />
          ) : (
            <Text style={styles.backFallback}>‹</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ошибка</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          {errorIconSvg ? <SvgXml xml={errorIconSvg} width={88} height={88} /> : null}
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message} numberOfLines={2} ellipsizeMode="clip">
          {messageLines}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <AnimatedPressable style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>{buttonText}</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    lineHeight: 24,
    color: '#868C98',
  },
  headerTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    color: '#0A0D14',
    fontFamily: 'Manrope-SemiBold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -114,
  },
  iconWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 44 / 2,
    lineHeight: 56 / 2,
    fontWeight: '600',
    color: '#0A0D14',
    fontFamily: 'Manrope-SemiBold',
    textAlign: 'center',
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    color: '#3E434D',
    fontFamily: 'Manrope-Regular',
    textAlign: 'center',
    maxWidth: 400,
  },
  buttonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 57,
    paddingHorizontal: spacing.md,
  },
  retryButton: {
    backgroundColor: '#191BDF',
    borderRadius: 99,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Platform.select({
      ios: 'Manrope',
      android: 'Manrope',
      web: "'Manrope', sans-serif",
      default: 'Manrope',
    }),
    color: palette.white,
    textAlign: 'center',
  },
});
