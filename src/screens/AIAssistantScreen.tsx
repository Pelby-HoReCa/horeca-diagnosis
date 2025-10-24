import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  gray: '#F0F0F0',
  white: '#FFFFFF',
  darkGray: '#666666',
};

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
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
});
