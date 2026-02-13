import { Asset } from 'expo-asset';
import React, { useEffect, useState } from 'react';
import { Dimensions, ImageBackground, Platform, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import AnimatedPressable from '../components/AnimatedPressable';
import { palette, spacing } from '../styles/theme';

const { width } = Dimensions.get('window');

interface OnboardingScreen2Props {
  onContinue: () => void;
  onSkip?: () => void;
  currentStep?: 1 | 2 | 3;
}

// Экран 2 - Второй экран онбординга
export default function OnboardingScreen2({ onContinue, onSkip, currentStep = 2 }: OnboardingScreen2Props) {
  // Элементы экрана:
  const [tunerSvg, setTunerSvg] = useState<string>(''); // Tuner (нижний квадрат с градиентом)

  useEffect(() => {
    // Загружаем SVG Tuner
    const loadTuner = async () => {
      try {
        const tunerAsset = Asset.fromModule(require('../../assets/images/tuner.svg'));
        await tunerAsset.downloadAsync();
        
        if (tunerAsset.localUri) {
          const response = await fetch(tunerAsset.localUri);
          const fileContent = await response.text();
          setTunerSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки Tuner:', error);
      }
    };

    loadTuner();
  }, []);

  return (
    <ImageBackground 
      source={require('../../assets/images/onboarding-screen2-background.png')} 
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageStyle}
    >
      {/* Заголовок и подзаголовок - текст поверх всего */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          Чёткие рекомендации{'\n'}по улучшению
        </Text>
        <Text style={styles.subtitle}>
          После анализа вы увидите, где бизнес теряет{'\n'}эффективность и как это исправить.
        </Text>
      </View>
      
      {/* 22. Кнопка Продолжить и точки индикатора */}
      <View style={styles.buttonContainer}>
        <AnimatedPressable
          onPress={onContinue}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>Продолжить</Text>
        </AnimatedPressable>
        
        {/* Точки индикатора - три точки под кнопкой */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, currentStep === 1 && styles.dotActive]} />
          <View style={[styles.dot, currentStep === 2 && styles.dotActive]} />
          <View style={[styles.dot, currentStep === 3 && styles.dotActive]} />
        </View>
      </View>

      {/* 23. Tuner - нижний квадрат с градиентом */}
      {tunerSvg && (
        <View style={styles.tunerContainer}>
          <SvgXml 
            xml={tunerSvg} 
            width={393} 
            height={395} 
          />
        </View>
      )}

      {/* Черный прямоугольник - продлевает Tuner до низа экрана */}
      <View style={styles.blackBottomBar} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
  },
  // 21. textContainer
  textContainer: {
    position: 'absolute',
    bottom: '16%', // Опущено ниже (было 18%)
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 20, // Поверх всего
    pointerEvents: 'none',
  },
  title: {
    fontSize: 24,
    fontWeight: '800', // ExtraBold
    fontFamily: Platform.select({
      ios: 'Manrope',
      android: 'Manrope',
      web: "'Manrope', sans-serif",
      default: 'Manrope',
    }),
    color: '#EBF1FF',
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400', // Regular (тоньше, чем Medium)
    fontFamily: Platform.select({
      ios: 'Manrope',
      android: 'Manrope',
      web: "'Manrope', sans-serif",
      default: 'Manrope',
    }),
    color: '#EBF1FF',
    textAlign: 'center',
    opacity: 0.8, // 80% прозрачности
    lineHeight: 24, // Увеличили межстрочное расстояние (было 20)
  },
  // 22. buttonContainer
  buttonContainer: {
    position: 'absolute',
    bottom: '4%', // Еще на 2% ниже (было 6%)
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 20,
    pointerEvents: 'box-none',
  },
  continueButton: {
    width: 329,
    height: 56,
    backgroundColor: '#191BDF', // Синий цвет из скриншота
    borderRadius: 999, // Полностью скругленная
    paddingHorizontal: 16,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md * 2, // Двойной отступ между заголовком и подзаголовком
    pointerEvents: 'auto', // Разрешаем клики на кнопке
  },
  continueButtonText: {
    fontSize: 18, // Увеличили на 2 (было 16)
    fontWeight: '500', // Уменьшили жирность (было 600)
    fontFamily: Platform.select({
      ios: 'Manrope',
      android: 'Manrope',
      web: "'Manrope', sans-serif",
      default: 'Manrope',
    }),
    color: palette.white,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12, // Увеличили расстояние между точками (было 8)
    marginTop: spacing.md,
  },
  dot: {
    width: 8, // Увеличили размер точек (было 6)
    height: 8, // Увеличили размер точек (было 6)
    borderRadius: 4, // Увеличили радиус (было 3)
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Темно-серый для неактивных
  },
  dotActive: {
    backgroundColor: palette.white, // Белый для активной точки
  },
  // 23. tunerContainer
  tunerContainer: {
    position: 'absolute',
    bottom: -10, // Опущено еще ниже (было 0%)
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 18, // Поверх белого поля (которое имеет zIndex: 17)
    pointerEvents: 'none',
  },
  // 24. blackBottomBar
  blackBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '5%', // Высота равна отступу Tuner от низа
    backgroundColor: '#000000',
    zIndex: 14, // Ниже Tuner, но выше других элементов
    pointerEvents: 'none',
  },
});

