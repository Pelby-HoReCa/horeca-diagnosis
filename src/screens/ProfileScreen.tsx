import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../components/AppWrapper';
import AnimatedPressable from '../components/AnimatedPressable';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { getUserData, logout, User } from '../utils/api';

const logo = require('../../assets/images/1111.png');

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  gray: '#F0F0F0',
  white: '#FFFFFF',
  darkGray: '#666666',
  red: '#FF0000',
};

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Получаем функцию для перехода к авторизации
  const appContext = useAppContext();
  const navigateToAuth = appContext?.navigateToAuth;

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Проверяем авторизацию
      const authStatus = await AsyncStorage.getItem('isAuthenticated');
      const authToken = await AsyncStorage.getItem('authToken');
      setIsAuthenticated(authStatus === 'true' && !!authToken);
      
      if (authStatus === 'true' && authToken) {
        const userData = await getUserData();
        setUser(userData);
        
        // Загружаем аватар из локального хранилища
        const savedAvatar = await AsyncStorage.getItem('userAvatar');
        if (savedAvatar) {
          setAvatarUri(savedAvatar);
        }
      } else {
        setUser(null);
        setAvatarUri(null);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных пользователя:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      // Запрашиваем разрешение на доступ к галерее
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Доступ к галерее',
          'Необходимо разрешение на доступ к галерее для загрузки фото',
          [{ text: 'OK' }]
        );
        return;
      }

      // Открываем галерею
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setAvatarUri(uri);
        
        // Сохраняем URI в локальное хранилище
        await AsyncStorage.setItem('userAvatar', uri);
        
        // TODO: Здесь будет загрузка на сервер
        console.log('Фото профиля загружено:', uri);
      }
    } catch (error) {
      console.error('Ошибка загрузки фото:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить фото. Попробуйте снова.');
    }
  };

  const handleLogin = () => {
    if (navigateToAuth) {
      navigateToAuth();
    } else {
      // Fallback: очищаем данные и показываем alert
      Alert.alert(
        'Авторизация',
        'Для доступа к личному кабинету необходимо авторизоваться. Перезапустите приложение.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLogout = async () => {
    // В веб-версии Alert может не работать, поэтому используем confirm
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Вы уверены, что хотите выйти из аккаунта?');
      if (!confirmed) return;
    } else {
      Alert.alert(
        'Выход из аккаунта',
        'Вы уверены, что хотите выйти?',
        [
          { text: 'Отмена', style: 'cancel', onPress: () => {} },
          {
            text: 'Выйти',
            style: 'destructive',
            onPress: () => performLogout(),
          },
        ]
      );
      return;
    }
    
    // Если веб или после confirm, выполняем выход
    performLogout();
  };

  const performLogout = async () => {
    try {
      console.log('Выполняется выход из аккаунта...');
      await logout();
      
      // Обновляем локальное состояние
      setUser(null);
      setAvatarUri(null);
      setIsAuthenticated(false);
      
      console.log('Состояние обновлено, переход к авторизации...');
      
      // Переходим на экран авторизации
      if (navigateToAuth) {
        console.log('Вызываем navigateToAuth');
        navigateToAuth();
      } else {
        console.log('navigateToAuth недоступен, перезагружаем данные');
        // Fallback: перезагружаем данные
        await loadUserData();
      }
    } catch (error) {
      console.error('Ошибка выхода:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Ошибка', 'Не удалось выйти из аккаунта. Попробуйте снова.');
      } else {
        alert('Ошибка: Не удалось выйти из аккаунта. Попробуйте снова.');
      }
    }
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollButton(offsetY > 500);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Заголовок с логотипом */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitleContainer}>
              <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
              <Text style={styles.headerTitle} numberOfLines={1}>Личный кабинет</Text>
            </View>
          </View>
        </View>

        {/* Информация о пользователе */}
        <View style={styles.section}>
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              {isAuthenticated ? (
                <View style={styles.avatarWrapper}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person-circle" size={80} color={COLORS.blue} />
                  )}
                  <AnimatedPressable
                    style={styles.avatarEditButton}
                    onPress={handlePickImage}
                  >
                    <Ionicons name="add" size={20} color={COLORS.white} />
                  </AnimatedPressable>
                </View>
              ) : (
                <Ionicons name="person-circle-outline" size={80} color={COLORS.darkGray} />
              )}
            </View>
            
            {isAuthenticated ? (
              <>
                <Text style={styles.userEmail}>{user?.email || 'Пользователь'}</Text>
                {user?.fullName && (
                  <Text style={styles.userName}>{user.fullName}</Text>
                )}
                {user?.createdAt && (
                  <Text style={styles.userDate}>
                    Пользователь с {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.notAuthorizedText}>Вы не авторизованы</Text>
                <Text style={styles.notAuthorizedSubtext}>
                  Авторизуйтесь для доступа к личному кабинету и истории диагностик
                </Text>
                <AnimatedPressable
                  style={styles.loginButton}
                  onPress={handleLogin}
                >
                  <Text style={styles.loginButtonText}>Авторизоваться</Text>
                </AnimatedPressable>
              </>
            )}
          </View>
        </View>

        {/* Настройки аккаунта - только для авторизованных */}
        {isAuthenticated && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Настройки аккаунта</Text>
              
              <AnimatedPressable
                style={styles.menuItem}
                onPress={() => {
                  // TODO: Навигация к редактированию профиля
                  console.log('Редактирование профиля');
                }}
              >
                <Ionicons name="person-outline" size={24} color={COLORS.blue} />
                <Text style={styles.menuItemText}>Редактировать профиль</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.menuItem}
                onPress={() => {
                  navigation.navigate('Результаты');
                }}
              >
                <Ionicons name="time-outline" size={24} color={COLORS.blue} />
                <Text style={styles.menuItemText}>История диагностик</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.menuItem}
                onPress={() => {
                  // TODO: Навигация к настройкам уведомлений
                  console.log('Настройки уведомлений');
                }}
              >
                <Ionicons name="notifications-outline" size={24} color={COLORS.blue} />
                <Text style={styles.menuItemText}>Уведомления</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
              </AnimatedPressable>
            </View>

            {/* Выход */}
            <View style={styles.section}>
              <AnimatedPressable
                style={[styles.menuItem, styles.logoutItem]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={24} color={COLORS.red} />
                <Text style={[styles.menuItemText, styles.logoutText]}>Выйти из аккаунта</Text>
              </AnimatedPressable>
            </View>
          </>
        )}

        {/* Информация о приложении */}
        <View style={styles.section}>
          <Text style={styles.appVersion}>Версия 1.0.0</Text>
          <Text style={styles.appInfo}>Pelby - Самодиагностика бизнеса ХОРЕКА</Text>
        </View>
      </ScrollView>
      <ScrollToTopButton onPress={scrollToTop} visible={showScrollButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.blue,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    padding: 12,
    paddingTop: 40,
    backgroundColor: COLORS.gray,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    marginBottom: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.blue,
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.orange,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.orange,
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 8,
    textAlign: 'center',
  },
  userName: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 8,
    textAlign: 'center',
  },
  userDate: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  notAuthorizedText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
    textAlign: 'center',
  },
  notAuthorizedSubtext: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: COLORS.orange,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.blue,
    marginLeft: 12,
    fontWeight: '500',
  },
  logoutItem: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.red,
  },
  logoutText: {
    color: COLORS.red,
  },
  appVersion: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 4,
  },
  appInfo: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
