import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Manrope_300Light, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AppContext, AppContextType } from '../context/AppContext';
import AppNavigator from '../navigation/AppNavigator';
import OnboardingScreen1 from '../screens/OnboardingScreen1';
import OnboardingScreen2 from '../screens/OnboardingScreen2';
import OnboardingScreen3 from '../screens/OnboardingScreen3';
import RegisterScreen1 from '../screens/RegisterScreen1';
import RegisterScreen2 from '../screens/RegisterScreen2';
import MapPickerScreen from '../screens/MapPickerScreen';
import RegisterScreen3 from '../screens/RegisterScreen3';
import DiagnosisQuestionsScreen from '../screens/DiagnosisQuestionsScreen';
import BlockResultsScreen from '../screens/BlockResultsScreen';
import NextBlockScreen from '../screens/NextBlockScreen';
import DiagnosisResultsScreen from '../screens/DiagnosisResultsScreen';
import SplashScreen from '../screens/SplashScreen';
import { DEFAULT_BLOCKS } from '../data/diagnosisBlocks';

export default function AppWrapper() {
  const [currentScreen, setCurrentScreen] = useState<
    'splash' | 'onboarding1' | 'onboarding2' | 'onboarding3' | 'register1' | 'register2' | 'register3' | 'mapPicker' | 'diagnosis' | 'blockResults' | 'nextBlock' | 'diagnosisResults' | 'main'
  >('splash');
  
  // Состояние для хранения выбранных блоков для диагностики
  const [selectedBlocksForDiagnosis, setSelectedBlocksForDiagnosis] = useState<string[]>([]);
  
  // Состояние для хранения ID завершенного блока
  const [completedBlockId, setCompletedBlockId] = useState<string | null>(null);
  
  // Состояние для хранения ID следующего блока
  const [nextBlockId, setNextBlockId] = useState<string | null>(null);
  const [mapTargetIndex, setMapTargetIndex] = useState<number | null>(null);
  const [mapSelection, setMapSelection] = useState<{ address: string; token: number } | null>(null);
  const [mapSelectionToken, setMapSelectionToken] = useState(0);

  // Логирование изменений currentScreen для отладки
  useEffect(() => {
    console.log('currentScreen изменился на:', currentScreen);
  }, [currentScreen]);

  const [fontsLoaded] = useFonts({
    'Manrope-Light': Manrope_300Light,
    'Manrope-Regular': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
    'Manrope-ExtraBold': Manrope_800ExtraBold,
  });

  const handleSplashFinish = async () => {
    setCurrentScreen('onboarding1');
  };

  const handleOnboarding1Continue = () => {
    setCurrentScreen('onboarding2');
  };

  const handleOnboarding2Continue = () => {
    setCurrentScreen('onboarding3');
  };

  const handleOnboarding3Continue = async () => {
    console.log('Onboarding3 продолжение - переходим на регистрацию');
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    setCurrentScreen('register1');
    console.log('Экран установлен на register1');
  };

  const handleRegister1Continue = () => {
    setCurrentScreen('register2');
  };

  const handleRegister1Skip = () => {
    console.log('Пропустить - переходим на второй экран регистрации');
    setCurrentScreen('register2'); // Переводит на второй экран регистрации
  };

  const handleRegister2Continue = () => {
    // "Продолжить" на втором экране регистрации ведёт на третий экран
    setCurrentScreen('register3');
  };

  const handleRegister2Skip = () => {
    // "Пропустить" на втором экране регистрации ведёт на третий экран регистрации
    setCurrentScreen('register3');
  };

  const handleRegister3Continue = async (selectedBlocks: string[]) => {
    // Сохраняем выбранные блоки и переходим на первый блок диагностики
    console.log('Переход на первый блок диагностики с блоками:', selectedBlocks);
    await AsyncStorage.setItem('registrationStep3Completed', 'true');
    setSelectedBlocksForDiagnosis(selectedBlocks);
    // Переходим на NextBlockScreen с первым блоком
    if (selectedBlocks.length > 0) {
      const firstBlockId = selectedBlocks[0];
      setNextBlockId(firstBlockId);
      setCurrentScreen('nextBlock');
    } else {
      // Если блоки не выбраны, переходим на дашборд
      setCurrentScreen('main');
    }
  };

  const handleRegister3Skip = async () => {
    // "Пропустить" на третьем экране ведёт в основное приложение (дашборд)
    console.log('Пропустить на экране 3 - переходим на дашборд');
    await AsyncStorage.setItem('registrationStep3Completed', 'true');
    setCurrentScreen('main');
  };

  const handleRegister1Back = () => {
    setCurrentScreen('onboarding3');
  };

  const handleRegister2Back = () => {
    setCurrentScreen('register1');
  };

  const handleRegister3Back = () => {
    setCurrentScreen('register2');
  };

  // Пустая функция для совместимости с ProfileScreen
  const navigateToAuth = () => {
    // Авторизация отключена
  };

  const contextValue: AppContextType = {
    navigateToAuth,
  };

  if (currentScreen === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (currentScreen === 'onboarding1') {
    return <OnboardingScreen1 onContinue={handleOnboarding1Continue} />;
  }

  if (currentScreen === 'onboarding2') {
    return <OnboardingScreen2 onContinue={handleOnboarding2Continue} />;
  }

  if (currentScreen === 'onboarding3') {
    return <OnboardingScreen3 onContinue={handleOnboarding3Continue} />;
  }

        if (currentScreen === 'register1') {
          console.log('Отображаем экран регистрации');
          return <RegisterScreen1 onContinue={handleRegister1Continue} onSkip={handleRegister1Skip} onBack={handleRegister1Back} />;
        }

        if (currentScreen === 'register2') {
          console.log('Отображаем второй экран регистрации');
          return (
            <RegisterScreen2
              onContinue={handleRegister2Continue}
              onSkip={handleRegister2Skip}
              onBack={handleRegister2Back}
              onOpenMap={(index) => {
                setMapTargetIndex(index);
                setCurrentScreen('mapPicker');
              }}
              mapSelection={mapSelection}
              mapTargetIndex={mapTargetIndex}
              onMapAddressApplied={() => {
                setMapSelection(null);
                setMapTargetIndex(null);
              }}
            />
          );
        }

        if (currentScreen === 'mapPicker') {
          return (
            <MapPickerScreen
              onBack={() => setCurrentScreen('register2')}
              onConfirm={(address) => {
                setMapSelectionToken((prev) => {
                  const nextToken = prev + 1;
                  setMapSelection({ address, token: nextToken });
                  return nextToken;
                });
                setCurrentScreen('register2');
              }}
            />
          );
        }

        if (currentScreen === 'register3') {
          console.log('Отображаем третий экран регистрации');
          return (
            <RegisterScreen3 
              onContinue={(selectedBlocks) => handleRegister3Continue(selectedBlocks)} 
              onSkip={handleRegister3Skip} 
              onBack={handleRegister3Back}
            />
          );
        }

        if (currentScreen === 'diagnosis') {
          console.log('Отображаем экран вопросов диагностики');
          // Определяем текущий блок для вопросов (это блок из NextBlockScreen)
          const currentBlockForQuestions = nextBlockId || (selectedBlocksForDiagnosis.length > 0 ? selectedBlocksForDiagnosis[0] : '');
          return (
            <DiagnosisQuestionsScreen 
              selectedBlocks={selectedBlocksForDiagnosis}
              currentBlockId={currentBlockForQuestions}
              onBack={() => {
                // Возвращаемся к NextBlockScreen для текущего блока
                if (nextBlockId) {
                  setCurrentScreen('nextBlock');
                } else {
                  setNextBlockId(selectedBlocksForDiagnosis[0]);
                  setCurrentScreen('nextBlock');
                }
              }}
              onSkip={() => setCurrentScreen('main')}
              onBlockComplete={(blockId) => {
                setCompletedBlockId(blockId);
                setCurrentScreen('blockResults');
              }}
            />
          );
        }

        if (currentScreen === 'blockResults') {
          console.log('Отображаем экран результатов блока');
          const currentBlockIdx = completedBlockId 
            ? selectedBlocksForDiagnosis.findIndex(id => id === completedBlockId)
            : -1;
          const blocksCount = selectedBlocksForDiagnosis.length > 0 
            ? selectedBlocksForDiagnosis.length 
            : DEFAULT_BLOCKS.length;
          return (
            <BlockResultsScreen
              blockId={completedBlockId || ''}
              completedBlockIndex={currentBlockIdx >= 0 ? currentBlockIdx : undefined}
              totalBlocks={blocksCount}
              selectedBlocks={selectedBlocksForDiagnosis}
              onContinue={() => {
                // Определяем следующий блок
                const currentBlockIdx = completedBlockId 
                  ? selectedBlocksForDiagnosis.findIndex(id => id === completedBlockId)
                  : -1;
                const nextBlockIdx = currentBlockIdx + 1;
                
                if (nextBlockIdx < selectedBlocksForDiagnosis.length) {
                  // Есть следующий блок - переходим на экран следующего блока
                  const nextId = selectedBlocksForDiagnosis[nextBlockIdx];
                  setNextBlockId(nextId);
                  setCurrentScreen('nextBlock');
                } else {
                  // Все блоки пройдены - переходим на экран результатов диагностики
                  setCurrentScreen('diagnosisResults');
                }
              }}
              onBack={() => {
                // Возвращаемся к экрану вопросов
                setCurrentScreen('diagnosis');
              }}
              onClose={() => {
                // Закрываем экран результатов
                setCurrentScreen('main');
              }}
            />
          );
        }

        if (currentScreen === 'diagnosisResults') {
          console.log('Отображаем экран результатов диагностики');
          return (
            <DiagnosisResultsScreen
              selectedBlocks={selectedBlocksForDiagnosis}
              onBack={() => {
                // Возвращаемся на третий экран регистрации
                setCurrentScreen('register3');
              }}
              onClose={() => {
                setCurrentScreen('main');
              }}
            />
          );
        }

        if (currentScreen === 'nextBlock') {
          console.log('Отображаем экран следующего блока');
          const nextBlock = DEFAULT_BLOCKS.find(block => block.id === nextBlockId);
          const currentBlockIdx = nextBlockId 
            ? selectedBlocksForDiagnosis.findIndex(id => id === nextBlockId)
            : -1;
          return (
            <NextBlockScreen
              blockId={nextBlockId || ''}
              blockTitle={nextBlock?.title}
              onBack={() => {
                // Если это первый блок, возвращаемся на регистрацию
                if (currentBlockIdx === 0) {
                  setCurrentScreen('register3');
                } else {
                  // Иначе возвращаемся на результаты предыдущего блока
                  setCurrentScreen('blockResults');
                }
              }}
              onContinue={() => {
                // Переходим на экран вопросов для текущего блока
                setCurrentScreen('diagnosis');
              }}
            />
          );
        }

  // Когда currentScreen === 'main', показываем AppNavigator (дашборд)
  if (currentScreen === 'main') {
    console.log('Отображаем дашборд (main)');
    return (
      <AppContext.Provider value={contextValue}>
        <AppNavigator />
      </AppContext.Provider>
    );
  }

  // Fallback - не должно доходить сюда
  return (
    <AppContext.Provider value={contextValue}>
      <AppNavigator />
    </AppContext.Provider>
  );
}
