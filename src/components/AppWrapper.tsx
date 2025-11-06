import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { View } from 'react-native';

import AppNavigator from '../navigation/AppNavigator';
import AuthScreen from '../screens/AuthScreen';
import SplashScreen from '../screens/SplashScreen';
import { initializeDefaultUser } from '../utils/usersStorage';

// Контекст для управления переходом к авторизации
interface AppContextType {
  navigateToAuth: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  return context;
};

export default function AppWrapper() {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'auth' | 'main'>('splash');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Инициализируем предустановленного пользователя
    initializeDefaultUser();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
      const authToken = await AsyncStorage.getItem('authToken');
      
      // Если пользователь уже авторизован, пропускаем экран авторизации
      if (isAuthenticated === 'true' && authToken) {
        setIsCheckingAuth(false);
        setCurrentScreen('main');
      } else {
        setIsCheckingAuth(false);
        // Показываем splash, который затем перейдет к auth
        setCurrentScreen('splash');
      }
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      setIsCheckingAuth(false);
      setCurrentScreen('splash');
    }
  };

  const handleSplashFinish = () => {
    // Если проверка авторизации еще идет, ждем
    if (isCheckingAuth) return;
    
    // Проверяем, нужно ли показывать экран авторизации
    AsyncStorage.getItem('isAuthenticated').then((isAuth) => {
      if (isAuth === 'true') {
        setCurrentScreen('main');
      } else {
        setCurrentScreen('auth');
      }
    });
  };

  const handleAuthContinue = () => {
    setCurrentScreen('main');
  };

  const navigateToAuth = async () => {
    // Очищаем данные авторизации
    await AsyncStorage.removeItem('isAuthenticated');
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userEmail');
    await AsyncStorage.removeItem('userId');
    setCurrentScreen('auth');
  };

  const contextValue: AppContextType = {
    navigateToAuth,
  };

  if (currentScreen === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (currentScreen === 'auth') {
    return <AuthScreen onContinue={handleAuthContinue} />;
  }

  return (
    <AppContext.Provider value={contextValue}>
      <View style={{ flex: 1 }}>
        <AppNavigator />
      </View>
    </AppContext.Provider>
  );
}
