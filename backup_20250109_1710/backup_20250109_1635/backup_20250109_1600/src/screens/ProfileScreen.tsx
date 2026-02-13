import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import { useAppContext } from '../context/AppContext';
import { palette, radii, spacing, typography } from '../styles/theme';
import { deleteAccount, getUserData, logout, User } from '../utils/api';
import { getCurrentUserId } from '../utils/userDataStorage';

const logo = require('../../assets/images/logo-pelby.png');

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handleDeleteAccount = async () => {
    // В веб-версии Alert может не работать, поэтому используем confirm
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо. Все ваши данные будут удалены.');
      if (!confirmed) return;
    } else {
      Alert.alert(
        'Удаление аккаунта',
        'Вы уверены, что хотите удалить аккаунт? Это действие необратимо. Все ваши данные будут удалены.',
        [
          { text: 'Отмена', style: 'cancel', onPress: () => {} },
          {
            text: 'Удалить',
            style: 'destructive',
            onPress: () => performDeleteAccount(),
          },
        ]
      );
      return;
    }
    
    // Если веб или после confirm, выполняем удаление
    performDeleteAccount();
  };

  const performDeleteAccount = async () => {
    try {
      console.log('Выполняется удаление аккаунта...');
      await deleteAccount();
      
      // Обновляем локальное состояние
      setUser(null);
      setAvatarUri(null);
      setIsAuthenticated(false);
      
      console.log('Аккаунт удален, переход к авторизации...');
      
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
      console.error('Ошибка удаления аккаунта:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Ошибка', 'Не удалось удалить аккаунт. Попробуйте снова.');
      } else {
        alert('Ошибка: Не удалось удалить аккаунт. Попробуйте снова.');
      }
    }
  };

  const handleResetResults = async () => {
    // В веб-версии Alert может не работать, поэтому используем confirm
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Вы уверены, что хотите сбросить все результаты диагностики? Это действие необратимо. Профиль пользователя не будет изменен.');
      if (!confirmed) return;
    } else {
      Alert.alert(
        'Сброс результатов',
        'Вы уверены, что хотите сбросить все результаты диагностики? Это действие необратимо. Профиль пользователя не будет изменен.',
        [
          { text: 'Отмена', style: 'cancel', onPress: () => {} },
          {
            text: 'Сбросить',
            style: 'destructive',
            onPress: () => performResetResults(),
          },
        ]
      );
      return;
    }
    
    // Если веб или после confirm, выполняем сброс
    performResetResults();
  };

  const performResetResults = async () => {
    try {
      console.log('Выполняется сброс результатов диагностики...');
      
      const userId = await getCurrentUserId();
      
      // Очищаем глобальные ключи (для неавторизованных пользователей)
      const globalKeys = [
        'diagnosisBlocks',
        'actionPlanTasks',
        'dashboardAllBlocksCompleted',
        'dashboardPreviousResult',
        'dashboardCurrentResult',
        'userDiagnosisHistory',
      ];
      
      await Promise.all(globalKeys.map(key => AsyncStorage.removeItem(key)));
      console.log('Глобальные данные результатов очищены');
      
      // Очищаем пользовательские ключи (для авторизованных пользователей)
      if (userId) {
        const userKeys = [
          `user_${userId}_diagnosisBlocks`,
          `user_${userId}_actionPlanTasks`,
          `user_${userId}_dashboardAllBlocksCompleted`,
          `user_${userId}_dashboardPreviousResult`,
          `user_${userId}_dashboardCurrentResult`,
        ];
        
        await Promise.all(userKeys.map(key => AsyncStorage.removeItem(key)));
        console.log(`Данные результатов пользователя ${userId} очищены`);
      }
      
      console.log('Результаты диагностики успешно сброшены');
      
      if (Platform.OS !== 'web') {
        Alert.alert('Успешно', 'Все результаты диагностики сброшены. Профиль пользователя не изменен.');
      } else {
        alert('Успешно: Все результаты диагностики сброшены. Профиль пользователя не изменен.');
      }
    } catch (error) {
      console.error('Ошибка сброса результатов:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Ошибка', 'Не удалось сбросить результаты. Попробуйте снова.');
      } else {
        alert('Ошибка: Не удалось сбросить результаты. Попробуйте снова.');
      }
    }
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
        contentContainerStyle={styles.scrollContent}
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
                    <Ionicons name="person-circle" size={80} color={palette.primaryBlue} />
                  )}
                  <AnimatedPressable
                    style={styles.avatarEditButton}
                    onPress={handlePickImage}
                  >
                    <Ionicons name="add" size={20} color={palette.white} />
                  </AnimatedPressable>
                </View>
              ) : (
                <Ionicons name="person-circle-outline" size={80} color={palette.gray600} />
              )}
            </View>
            
            {isAuthenticated ? (
              <>
                <Text style={styles.userEmail}>{user?.email || 'Пользователь'}</Text>
                {user?.fullName && (
                  <Text style={styles.userName}>{user.fullName}</Text>
                )}
                {user?.position && (
                  <Text style={styles.userInfo}>{user.position}</Text>
                )}
                {user?.projectName && (
                  <Text style={styles.userInfo}>Проект: {user.projectName}</Text>
                )}
                {user?.phone && (
                  <Text style={styles.userInfo}>Телефон: {user.phone}</Text>
                )}
                {user?.city && (
                  <Text style={styles.userInfo}>Город: {user.city}</Text>
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
                <Ionicons name="person-outline" size={24} color={palette.primaryBlue} />
                <Text style={styles.menuItemText}>Редактировать профиль</Text>
                <Ionicons name="chevron-forward" size={20} color={palette.gray600} />
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.menuItem}
                onPress={() => {
                  navigation.navigate('Результаты');
                }}
              >
                <Ionicons name="time-outline" size={24} color={palette.primaryBlue} />
                <Text style={styles.menuItemText}>История диагностик</Text>
                <Ionicons name="chevron-forward" size={20} color={palette.gray600} />
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.menuItem}
                onPress={() => {
                  // TODO: Навигация к настройкам уведомлений
                  console.log('Настройки уведомлений');
                }}
              >
                <Ionicons name="notifications-outline" size={24} color={palette.primaryBlue} />
                <Text style={styles.menuItemText}>Уведомления</Text>
                <Ionicons name="chevron-forward" size={20} color={palette.gray600} />
              </AnimatedPressable>
            </View>

            {/* Временные функции */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Временные функции</Text>
              
              <AnimatedPressable
                style={[styles.menuItem, styles.resetItem]}
                onPress={handleResetResults}
              >
                <Ionicons name="refresh-outline" size={24} color={palette.warning} />
                <Text style={[styles.menuItemText, styles.resetText]}>Сбросить результаты</Text>
              </AnimatedPressable>
            </View>

            {/* Выход */}
            <View style={styles.section}>
              <AnimatedPressable
                style={[styles.menuItem, styles.logoutItem]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={24} color={palette.error} />
                <Text style={[styles.menuItemText, styles.logoutText]}>Выйти из аккаунта</Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={[styles.menuItem, styles.logoutItem]}
                onPress={handleDeleteAccount}
              >
                <Ionicons name="trash-outline" size={24} color={palette.error} />
                <Text style={[styles.menuItemText, styles.logoutText]}>Удалить аккаунт</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    color: palette.primaryBlue,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    backgroundColor: palette.background,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    marginBottom: spacing.sm,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 28,
    height: 28,
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.heading2,
    color: palette.primaryBlue,
    marginLeft: spacing.sm,
  },
  section: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading3,
    color: palette.primaryBlue,
    marginBottom: spacing.sm,
  },
  userCard: {
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'stretch',
    borderLeftWidth: 4,
    borderLeftColor: palette.primaryOrange,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  avatarContainer: {
    marginBottom: spacing.md,
    position: 'relative',
    alignSelf: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.white,
    borderWidth: 2,
    borderColor: palette.primaryBlue,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.primaryOrange,
    borderWidth: 2,
    borderColor: palette.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userEmail: {
    ...typography.heading3,
    fontWeight: '600',
    color: palette.primaryBlue,
    marginBottom: spacing.xs,
    textAlign: 'left',
  },
  userName: {
    ...typography.body,
    fontWeight: '600',
    color: palette.gray600,
    marginBottom: spacing.xs,
    textAlign: 'left',
  },
  userInfo: {
    ...typography.body,
    fontSize: 14,
    color: palette.gray600,
    marginBottom: spacing.xs,
    textAlign: 'left',
  },
  userDate: {
    ...typography.caption,
    color: palette.gray600,
    fontStyle: 'italic',
    textAlign: 'left',
    marginTop: spacing.sm,
  },
  notAuthorizedText: {
    ...typography.heading3,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  notAuthorizedSubtext: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  loginButton: {
    backgroundColor: palette.primaryOrange,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    marginTop: spacing.sm,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  loginButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: palette.white,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.gray200,
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  menuItemText: {
    flex: 1,
    ...typography.body,
    color: palette.primaryBlue,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  resetItem: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: palette.warning,
  },
  resetText: {
    color: palette.warning,
  },
  logoutItem: {
    backgroundColor: '#FEEBEC',
    borderLeftWidth: 4,
    borderLeftColor: palette.error,
  },
  logoutText: {
    color: palette.error,
  },
  appVersion: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  appInfo: {
    ...typography.caption,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
