import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, spacing, typography } from '../styles/theme';

export default function AIAssistantScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI-агент</Text>
      <Text style={styles.subtitle}>ИИ-помощник пока не реализован</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typography.heading2,
    color: palette.primaryBlue,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: palette.gray600,
    textAlign: 'center',
    maxWidth: 320,
  },
});
