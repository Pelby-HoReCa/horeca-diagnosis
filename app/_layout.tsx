import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import AppWrapper from '@/src/components/AppWrapper';

const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  white: '#FFFFFF',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const router = useRouter();

  // На вебе игнорируем URL-маршруты Expo Router и всегда показываем AppWrapper
  useEffect(() => {
    if (Platform.OS === 'web' && pathname && pathname !== '/') {
      // Перенаправляем любые URL на корневой путь
      router.replace('/');
    }
  }, [pathname, router]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <StatusBar style="dark" backgroundColor={COLORS.white} />
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppWrapper />
    </ThemeProvider>
    </View>
  );
}
