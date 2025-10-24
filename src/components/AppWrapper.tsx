import React, { useState } from 'react';
import { View } from 'react-native';

import AppNavigator from '../navigation/AppNavigator';
import AuthScreen from '../screens/AuthScreen';
import SplashScreen from '../screens/SplashScreen';

export default function AppWrapper() {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'auth' | 'main'>('splash');

  const handleSplashFinish = () => {
    setCurrentScreen('auth');
  };

  const handleAuthContinue = () => {
    setCurrentScreen('main');
  };

  if (currentScreen === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (currentScreen === 'auth') {
    return <AuthScreen onContinue={handleAuthContinue} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <AppNavigator />
    </View>
  );
}
