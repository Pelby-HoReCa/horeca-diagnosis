import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  white: '#FFFFFF',
};

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Самодиагностика бизнеса ХОРЕКА</Text>
      <Text style={styles.subtitle}>Добро пожаловать!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.blue,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.orange,
    textAlign: 'center',
  },
});
