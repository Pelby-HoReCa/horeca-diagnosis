import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, View } from 'react-native';
const logo = require('../../assets/images/1111.png');

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
    // Анимация вращения логотипа - ПЛАВНОЕ непрерывное вращение
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000, // 2 секунды на оборот
        easing: Easing.linear, // Линейная анимация без ускорений
        useNativeDriver: true,
      }),
      { iterations: -1 }
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

    // Переходим к следующему экрану через 5 секунд
    const timer = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => {
      rotateAnimation.stop();
      clearTimeout(timer);
    };
  }, [onFinish]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Animated.View style={[styles.logo, { transform: [{ rotate }] }]}>
          <Image 
            source={logo} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
      
      <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
        <Text style={styles.welcomeText}>Pelby</Text>
        <Text style={styles.appName}>Мы знаем все о ресторанах и немного больше...</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
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
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.orange,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.9,
  },
  description: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width * 0.8,
  },
});
