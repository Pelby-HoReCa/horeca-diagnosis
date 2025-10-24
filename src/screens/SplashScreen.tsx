import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import Logo from '../components/Logo';

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  white: '#FFFFFF',
  gray: '#F0F0F0',
};

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Анимация вращения логотипа
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000, // 3 секунды на полный оборот
        useNativeDriver: true,
      })
    );

    // Анимация появления текста
    const fadeAnimation = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    });

    // Запускаем анимации
    rotateAnimation.start();
    fadeAnimation.start();

    // Переходим к следующему экрану через 3 секунды
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      rotateAnimation.stop();
      clearTimeout(timer);
    };
  }, [onFinish]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Animated.View style={[styles.logo, { transform: [{ rotate }] }]}>
          <Logo size={120} color={COLORS.blue} />
        </Animated.View>
      </View>
      
      <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
        <Text style={styles.welcomeText}>Добро пожаловать!</Text>
        <Text style={styles.appName}>Самодиагностика бизнеса ХОРЕКА</Text>
        <Text style={styles.description}>
          Комплексная диагностика вашего ресторанного бизнеса
        </Text>
      </Animated.View>
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
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.orange,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 10,
    textAlign: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.orange,
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width * 0.8,
  },
});
