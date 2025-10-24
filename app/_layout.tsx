import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
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

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <StatusBar style="dark" backgroundColor={COLORS.white} />
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppWrapper />
      </ThemeProvider>
    </View>
  );
}
