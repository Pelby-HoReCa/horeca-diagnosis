import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ImageBackground, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import { SvgXml } from 'react-native-svg';

interface HelpScreenProps {
  navigation: any;
}

export default function HelpScreen({ navigation }: HelpScreenProps) {
  const [arrowIconSvg, setArrowIconSvg] = useState<string>('');

  const benefits = [
    'Персональные рекомендации по всем направлениям',
    'Возможность задать вопросы команде Pelby',
    'Разбор слабых зон и пошаговые решения',
    'Приоритетная поддержка и сопровождение',
  ];

  useEffect(() => {
    const loadArrowIcon = async () => {
      try {
        const arrowAsset = Asset.fromModule(require('../../assets/images/arrow-right-icon.svg'));
        await arrowAsset.downloadAsync();
        if (arrowAsset.localUri) {
          const response = await fetch(arrowAsset.localUri);
          const fileContent = await response.text();
          // Заменяем цвет на оранжевый #FD680A
          const coloredSvg = fileContent.replace(/#[0-9A-Fa-f]{6}/g, '#FD680A');
          setArrowIconSvg(coloredSvg);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG стрелки:', error);
      }
    };

    loadArrowIcon();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Скрываем таб-бар при фокусе на этом экране
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }

      return () => {
        // Восстанавливаем таб-бар с закрепленными стилями
        const parent = navigation.getParent();
        if (parent) {
          parent.setOptions({
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopColor: '#F0F0F0',
              borderTopWidth: 1,
              paddingBottom: 6,
              paddingTop: -8,
              height: 70,
              paddingHorizontal: 0,
              marginBottom: 0,
            },
          });
        }
      };
    }, [navigation])
  );


  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../../assets/images/help-screen-background.png')} 
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        {/* Затемняющий слой */}
        <View style={styles.darkOverlay} />
        
        {/* Крестик закрытия */}
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Заголовок */}
          <Text style={[styles.title, { color: '#EBF1FF' }]}>
            Получите доступ{'\n'}к экспертам Pelby
          </Text>

          {/* Подзаголовок */}
          <Text style={styles.subtitle}>
            Полная диагностика вашего бизнеса + связь с командой, которая стоит за сотнями успешных ресторанов.
          </Text>

          {/* Список преимуществ */}
          <View style={styles.benefitsList}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                {arrowIconSvg && (
                  <SvgXml xml={arrowIconSvg} width={16} height={16} style={[styles.benefitIcon, index === 0 && styles.benefitIconFirst]} />
                )}
                <Text style={[styles.benefitText, index === 0 && styles.benefitTextFirst]}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Кнопка */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => {
              // TODO: обработка нажатия
            }}
          >
            <Text style={styles.buttonText}>Получить доступ</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    resizeMode: 'cover',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingTop: 280,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Manrope-ExtraBold',
    fontWeight: '800',
    color: '#EBF1FF',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 50,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '300',
    color: '#EBF1FF',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 26,
  },
  benefitsList: {
    marginTop: 34,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  benefitIcon: {
    marginLeft: -18,
    marginRight: 12,
    marginTop: 6,
  },
  benefitIconFirst: {
    marginLeft: -18,
    marginTop: 4,
  },
  benefitText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#EBF1FF',
    opacity: 0.8,
    flex: 1,
    lineHeight: 28,
    letterSpacing: -0.5,
    marginLeft: 0,
  },
  benefitTextFirst: {
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 45,
    paddingTop: 8,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#FD680A',
    borderRadius: 99,
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#EBF1FF',
  },
});
