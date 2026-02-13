import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Manrope_300Light, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import React, { useEffect, useMemo, useState } from 'react';
import { NavigationIndependentTree, CommonActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

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
import questionsData from '../data/questions.json';
import { getCurrentUserId, getSelectedVenueId, getVenueScopedKey, loadUserQuestionnaire } from '../utils/userDataStorage';
import { pushLocalDataToServer, pullServerDataToLocal } from '../utils/syncService';

const Stack = createStackNavigator();

export default function AppWrapper() {
  const [selectedBlocksForDiagnosis, setSelectedBlocksForDiagnosis] = useState<string[]>([]);
  const [completedBlockId, setCompletedBlockId] = useState<string | null>(null);
  const [nextBlockId, setNextBlockId] = useState<string | null>(null);
  const [mapTargetIndex, setMapTargetIndex] = useState<number | null>(null);
  const [mapSelection, setMapSelection] = useState<{ address: string; token: number } | null>(null);
  const [mapSelectionToken, setMapSelectionToken] = useState(0);

  const questionsMap: Record<string, any[]> = {};
  questionsData.forEach((block: any) => {
    questionsMap[block.id] = block.questions;
  });

  const [fontsLoaded] = useFonts({
    'Manrope-Light': Manrope_300Light,
    'Manrope-Regular': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
    'Manrope-ExtraBold': Manrope_800ExtraBold,
  });

  const navigateToAuth = () => {
    // Авторизация отключена
  };

  const contextValue: AppContextType = useMemo(() => ({ navigateToAuth }), []);

  useEffect(() => {
    const syncOnce = async () => {
      try {
        const syncedFlag = await AsyncStorage.getItem('serverSyncCompleted_v1');
        if (syncedFlag) return;
        // 1) пробуем подтянуть с сервера, если на устройстве пусто
        await pullServerDataToLocal(false);
        // 2) отправляем локальные данные на сервер (резервная копия)
        const pushed = await pushLocalDataToServer();
        if (pushed) {
          await AsyncStorage.setItem('serverSyncCompleted_v1', 'true');
        }
      } catch (error) {
        console.error('Ошибка синхронизации с сервером:', error);
      }
    };

    syncOnce();
  }, []);

  useEffect(() => {
    const resetDiagnosisAnswersOnce = async () => {
      try {
        const flagKey = 'diagnosisAnswersReset_v3';
        const alreadyCleared = await AsyncStorage.getItem(flagKey);
        if (alreadyCleared) {
          return;
        }
        const keys = await AsyncStorage.getAllKeys();
        const patterns = [
          'diagnosis_answers_',
          'diagnosis_block_results',
          'diagnosis_block_results_by_venue',
          'diagnosisBlocks',
          'diagnosis_progress',
          'dashboardAllBlocksCompleted',
          'dashboardPreviousResult',
          'dashboardCurrentResult',
          'actionPlanTasks',
          'userDiagnosisHistory',
          'surveyHistory',
        ];
        const keysToRemove = keys.filter((key) => patterns.some((p) => key.includes(p)));
        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
        }
        await AsyncStorage.setItem(flagKey, 'true');
      } catch (error) {
        console.error('Ошибка сброса ответов диагностики:', error);
      }
    };
    resetDiagnosisAnswersOnce();
  }, []);

  useEffect(() => {
    const resetSelectedProjectsAnswersOnce = async () => {
      try {
        const flagKey = 'diagnosisAnswersReset_pelbi_lepshchik_v4';
        const alreadyCleared = await AsyncStorage.getItem(flagKey);
        if (alreadyCleared) {
          return;
        }

        const userId = await getCurrentUserId();
        const questionnaire = userId ? await loadUserQuestionnaire(userId) : null;
        let restaurants = Array.isArray(questionnaire?.restaurants) ? questionnaire?.restaurants : [];
        if (restaurants.length === 0) {
          const saved = await AsyncStorage.getItem('registrationStep2');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed?.restaurants)) {
              restaurants = parsed.restaurants;
            }
          }
        }
        const targetNames = ['пелби', 'добрый лепщик'];
        const targetVenueIds = restaurants
          .filter((restaurant: any) => {
            const name = String(restaurant?.name || '').toLowerCase();
            return targetNames.some((target) => name.includes(target));
          })
          .map((restaurant: any) => restaurant.id)
          .filter(Boolean);

        if (targetVenueIds.length === 0) {
          await AsyncStorage.setItem(flagKey, 'true');
          return;
        }

        const keys = await AsyncStorage.getAllKeys();
        const patterns = [
          'diagnosis_answers_',
          'diagnosis_block_results',
          'diagnosis_block_results_by_venue',
          'diagnosisBlocks',
          'diagnosis_progress',
          'dashboardAllBlocksCompleted',
          'dashboardPreviousResult',
          'dashboardCurrentResult',
          'actionPlanTasks',
          'diagnosis_history',
          'diagnosis_notes',
          'userDiagnosisHistory',
          'surveyHistory',
        ];

        const keysToRemove = keys.filter((key) => {
          const matchesVenue = targetVenueIds.some((venueId) => key.includes(`_${venueId}`));
          if (!matchesVenue) return false;
          return patterns.some((pattern) => key.includes(pattern));
        });

        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
        }

        // Удаляем данные по выбранным venue из общих per-venue ключей
        if (userId && targetVenueIds.length > 0) {
          const perVenueKey = `user_${userId}_diagnosis_block_results_by_venue`;
          const perVenueRaw = await AsyncStorage.getItem(perVenueKey);
          if (perVenueRaw) {
            const perVenueParsed = JSON.parse(perVenueRaw);
            let changed = false;
            targetVenueIds.forEach((venueId) => {
              if (perVenueParsed && perVenueParsed[venueId]) {
                delete perVenueParsed[venueId];
                changed = true;
              }
            });
            if (changed) {
              await AsyncStorage.setItem(perVenueKey, JSON.stringify(perVenueParsed));
            }
          }
        }

        if (targetVenueIds.length > 0) {
          const perVenueKey = 'diagnosis_block_results_by_venue';
          const perVenueRaw = await AsyncStorage.getItem(perVenueKey);
          if (perVenueRaw) {
            const perVenueParsed = JSON.parse(perVenueRaw);
            let changed = false;
            targetVenueIds.forEach((venueId) => {
              if (perVenueParsed && perVenueParsed[venueId]) {
                delete perVenueParsed[venueId];
                changed = true;
              }
            });
            if (changed) {
              await AsyncStorage.setItem(perVenueKey, JSON.stringify(perVenueParsed));
            }
          }
        }

        await AsyncStorage.setItem(flagKey, 'true');
      } catch (error) {
        console.error('Ошибка сброса ответов выбранных проектов:', error);
      }
    };

    resetSelectedProjectsAnswersOnce();
  }, []);

  useEffect(() => {
    const resetCurrentVenueOnce = async () => {
      try {
        const flagKey = 'diagnosisAnswersReset_currentVenue_v1';
        const alreadyCleared = await AsyncStorage.getItem(flagKey);
        if (alreadyCleared) {
          return;
        }

        const userId = await getCurrentUserId();
        const venueId = await getSelectedVenueId(userId);
        if (!venueId) {
          return;
        }

        const keys = await AsyncStorage.getAllKeys();
        const patterns = [
          'diagnosis_answers_',
          'diagnosis_block_results',
          'diagnosis_block_results_by_venue',
          'diagnosisBlocks',
          'diagnosis_progress',
          'dashboardAllBlocksCompleted',
          'dashboardPreviousResult',
          'dashboardCurrentResult',
          'actionPlanTasks',
          'diagnosis_history',
          'diagnosis_notes',
          'userDiagnosisHistory',
          'surveyHistory',
        ];

        const keysToRemove = keys.filter((key) => {
          if (!key.includes(`_${venueId}`)) return false;
          return patterns.some((pattern) => key.includes(pattern));
        });

        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
        }

        if (userId) {
          const perVenueKey = `user_${userId}_diagnosis_block_results_by_venue`;
          const perVenueRaw = await AsyncStorage.getItem(perVenueKey);
          if (perVenueRaw) {
            const perVenueParsed = JSON.parse(perVenueRaw);
            if (perVenueParsed && perVenueParsed[venueId]) {
              delete perVenueParsed[venueId];
              await AsyncStorage.setItem(perVenueKey, JSON.stringify(perVenueParsed));
            }
          }
        }

        const perVenueKey = 'diagnosis_block_results_by_venue';
        const perVenueRaw = await AsyncStorage.getItem(perVenueKey);
        if (perVenueRaw) {
          const perVenueParsed = JSON.parse(perVenueRaw);
          if (perVenueParsed && perVenueParsed[venueId]) {
            delete perVenueParsed[venueId];
            await AsyncStorage.setItem(perVenueKey, JSON.stringify(perVenueParsed));
          }
        }

        await AsyncStorage.setItem(flagKey, 'true');
      } catch (error) {
        console.error('Ошибка сброса данных текущего проекта:', error);
      }
    };

    resetCurrentVenueOnce();
  }, []);

  const loadSelectedBlocksFromStorage = async (): Promise<string[]> => {
    try {
      const userId = await getCurrentUserId();
      const venueId = await getSelectedVenueId(userId);
      const userKey = getVenueScopedKey('diagnosis_selected_blocks', userId, venueId);
      const globalKey = getVenueScopedKey('diagnosis_selected_blocks', null, venueId);
      const userValue = await AsyncStorage.getItem(userKey);
      const globalValue = userValue ? null : await AsyncStorage.getItem(globalKey);
      const parsed = userValue || globalValue;
      if (parsed) {
        const blocks = JSON.parse(parsed);
        if (Array.isArray(blocks) && blocks.length) {
          return blocks;
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки выбранных блоков:', error);
    }
    return DEFAULT_BLOCKS.map((block) => block.id);
  };

  const isBlockCompleted = async (blockId: string): Promise<boolean> => {
    try {
      const userId = await getCurrentUserId();
      const venueId = await getSelectedVenueId(userId);
      const total = questionsMap[blockId]?.length || 0;
      if (!venueId || total === 0) {
        return false;
      }
      const answersKey = getVenueScopedKey(`diagnosis_answers_${blockId}`, userId, venueId);
      const saved = await AsyncStorage.getItem(answersKey);
      const parsed = saved ? JSON.parse(saved) : {};
      const answered = Object.values(parsed || {}).filter(
        (value) => value !== null && value !== undefined && value !== ''
      ).length;
      return answered >= total;
    } catch (error) {
      console.error('Ошибка проверки завершенности блока:', error);
      return false;
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AppContext.Provider value={contextValue}>
      <NavigationIndependentTree>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
          <Stack.Screen name="Splash">
            {(props) => (
              <SplashScreen
                onFinish={() => props.navigation.replace('Onboarding1')}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Onboarding1">
            {(props) => (
              <OnboardingScreen1
                onContinue={() => props.navigation.navigate('Onboarding2')}
                onSkip={() => props.navigation.navigate('Register1')}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Onboarding2">
            {(props) => (
              <OnboardingScreen2
                onContinue={() => props.navigation.navigate('Onboarding3')}
                onSkip={() => props.navigation.navigate('Register1')}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Onboarding3">
            {(props) => (
              <OnboardingScreen3
                onContinue={async () => {
                  await AsyncStorage.setItem('hasSeenOnboarding', 'true');
                  props.navigation.navigate('Register1');
                }}
                onSkip={() => props.navigation.navigate('Register1')}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Register1">
            {(props) => (
              <RegisterScreen1
                onContinue={() => props.navigation.navigate('Register2')}
                onSkip={() => props.navigation.navigate('Register2')}
                onBack={() => props.navigation.navigate('Register2')}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Register2">
            {(props) => (
              <RegisterScreen2
                onContinue={() => props.navigation.navigate('Register3')}
                onSkip={() => props.navigation.navigate('Register3')}
                onBack={() => props.navigation.goBack()}
                onOpenMap={(index) => {
                  setMapTargetIndex(index);
                  props.navigation.navigate('MapPicker');
                }}
                mapSelection={mapSelection}
                mapTargetIndex={mapTargetIndex}
                onMapAddressApplied={() => {
                  setMapSelection(null);
                  setMapTargetIndex(null);
                }}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="MapPicker">
            {(props) => (
              <MapPickerScreen
                onBack={() => props.navigation.goBack()}
                onConfirm={(address) => {
                  setMapSelectionToken((prev) => {
                    const nextToken = prev + 1;
                    setMapSelection({ address, token: nextToken });
                    return nextToken;
                  });
                  props.navigation.goBack();
                }}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Register3">
            {(props) => (
              <RegisterScreen3
                onContinue={async (selectedBlocks) => {
                  await AsyncStorage.setItem('registrationStep3Completed', 'true');
                  setSelectedBlocksForDiagnosis(selectedBlocks);
                  if (selectedBlocks.length > 0) {
                    const firstBlockId = selectedBlocks[0];
                    setNextBlockId(firstBlockId);
                    const completed = await isBlockCompleted(firstBlockId);
                    if (completed) {
                      props.navigation.replace('BlockResults', { blockId: firstBlockId });
                    } else {
                      props.navigation.navigate('NextBlock', { blockId: firstBlockId, origin: 'register3' });
                    }
                  } else {
                    props.navigation.reset({
                      index: 0,
                      routes: [{ name: 'MainTabs' }],
                    });
                  }
                }}
                onSkip={async () => {
                  await AsyncStorage.setItem('registrationStep3Completed', 'true');
                  props.navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                  });
                }}
                onBack={() => props.navigation.goBack()}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="DiagnosisQuestions">
            {(props) => (
              <DiagnosisQuestionsScreen
                selectedBlocks={selectedBlocksForDiagnosis}
                currentBlockId={props.route.params?.blockId}
                onBack={() => props.navigation.goBack()}
                onSkip={() => props.navigation.goBack()}
                onBlockComplete={(blockId) => {
                  setCompletedBlockId(blockId);
                  props.navigation.replace('BlockResults', { blockId });
                }}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="BlockResults">
            {(props) => {
              const blockId = props.route.params?.blockId || completedBlockId || '';
              const blocksCount = selectedBlocksForDiagnosis.length || DEFAULT_BLOCKS.length;
              const selectedIndex = selectedBlocksForDiagnosis.indexOf(blockId);
              return (
                <BlockResultsScreen
                  blockId={blockId}
                  completedBlockIndex={selectedIndex >= 0 ? selectedIndex : DEFAULT_BLOCKS.findIndex((b) => b.id === blockId)}
                  totalBlocks={blocksCount}
                  selectedBlocks={selectedBlocksForDiagnosis}
                  onContinue={async () => {
                    const blocks = selectedBlocksForDiagnosis.length
                      ? selectedBlocksForDiagnosis
                      : await loadSelectedBlocksFromStorage();
                    const currentIdx = blocks.findIndex((id) => id === blockId);
                    const nextIdx = currentIdx + 1;
                    if (nextIdx < blocks.length) {
                      const nextId = blocks[nextIdx];
                      setNextBlockId(nextId);
                      const completed = await isBlockCompleted(nextId);
                      if (completed) {
                        props.navigation.replace('BlockResults', { blockId: nextId });
                      } else {
                        props.navigation.replace('NextBlock', { blockId: nextId, origin: 'blockResults' });
                      }
                    } else {
                      props.navigation.replace('DiagnosisResults');
                    }
                  }}
                  onViewTasks={() => {
                    props.navigation.dispatch(
                      CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'MainTabs', params: { tab: 'Задачи' } }],
                      })
                    );
                  }}
                  onBack={() => props.navigation.goBack()}
                  onClose={() => {
                    props.navigation.dispatch(
                      CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'MainTabs' }],
                      })
                    );
                  }}
                />
              );
            }}
          </Stack.Screen>

          <Stack.Screen name="NextBlock">
            {(props) => {
              const blockId = props.route.params?.blockId || nextBlockId || '';
              const blockIndex = DEFAULT_BLOCKS.findIndex((block) => block.id === blockId);
              const blockTitle = DEFAULT_BLOCKS.find((block) => block.id === blockId)?.title;
              return (
                <NextBlockScreen
                  blockId={blockId}
                  blockTitle={blockTitle}
                  currentStepIndex={blockIndex >= 0 ? blockIndex : undefined}
                  selectedBlocks={selectedBlocksForDiagnosis}
                  onBack={() => {
                    const origin = props.route.params?.origin;
                    if (origin === 'register3') {
                      props.navigation.navigate('Register3');
                      return;
                    }
                    props.navigation.goBack();
                  }}
                  onContinue={async () => {
                    try {
                      const userId = await getCurrentUserId();
                      const venueId = await getSelectedVenueId(userId);
                      const total = questionsMap[blockId]?.length || 0;
                      if (venueId && total > 0) {
                        const answersKey = getVenueScopedKey(`diagnosis_answers_${blockId}`, userId, venueId);
                        const saved = await AsyncStorage.getItem(answersKey);
                        const parsed = saved ? JSON.parse(saved) : {};
                        const answered = Object.values(parsed || {}).filter(
                          (value) => value !== null && value !== undefined && value !== ''
                        ).length;
                        if (answered >= total) {
                          props.navigation.replace('BlockResults', { blockId });
                          return;
                        }
                      }
                    } catch (error) {
                      console.error('Ошибка проверки завершения блока:', error);
                    }
                    props.navigation.replace('DiagnosisQuestions', { blockId });
                  }}
                />
              );
            }}
          </Stack.Screen>

          <Stack.Screen name="DiagnosisResults">
            {(props) => (
              <DiagnosisResultsScreen
                selectedBlocks={selectedBlocksForDiagnosis}
                onBack={() => props.navigation.goBack()}
                onClose={() => {
                  props.navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: 'MainTabs' }],
                    })
                  );
                }}
                onViewTasks={() => {
                  props.navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: 'MainTabs', params: { tab: 'Задачи' } }],
                    })
                  );
                }}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="MainTabs" component={AppNavigator} />
        </Stack.Navigator>
      </NavigationIndependentTree>
    </AppContext.Provider>
  );
}
