import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.pageBackground}>
        <View style={styles.appFrame}>
          <StatusBar style="dark" backgroundColor={COLORS.white} />
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AppWrapper />
          </ThemeProvider>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  pageBackground: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#EEF0F4' : COLORS.white,
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    justifyContent: 'center',
  },
  appFrame: {
    flex: Platform.OS === 'web' ? 0 : 1,
    width: Platform.OS === 'web' ? '100%' : '100%',
    maxWidth: Platform.OS === 'web' ? 430 : undefined,
    minHeight: Platform.OS === 'web' ? '100vh' : undefined,
    height: Platform.OS === 'web' ? '100vh' : '100%',
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
});
