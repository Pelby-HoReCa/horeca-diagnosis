import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Manrope_300Light, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavigationIndependentTree, CommonActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AppState, Platform } from 'react-native';

import { AppContext, AppContextType } from '../context/AppContext';
import AppNavigator from '../navigation/AppNavigator';
import OnboardingScreen1 from '../screens/OnboardingScreen1';
import OnboardingScreen2 from '../screens/OnboardingScreen2';
import OnboardingScreen3 from '../screens/OnboardingScreen3';
import RegisterScreen1 from '../screens/RegisterScreen1';
import RegisterScreen2 from '../screens/RegisterScreen2';
import PersonalDataPolicyScreen from '../screens/PersonalDataPolicyScreen';
import AddProjectScreen from '../screens/AddProjectScreen';
import EditProjectScreen from '../screens/EditProjectScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ErrorScreen from '../screens/ErrorScreen';
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
import { generateTasksFromAnswers, Task } from '../utils/recommendationEngine';
import { pushLocalDataToServer, pullServerDataToLocal } from '../utils/syncService';

const Stack = createStackNavigator();

export default function AppWrapper() {
  const MAP_TARGET_ADD_PROJECT = -1;
  const MAP_TARGET_EDIT_PROJECT = -2;
  const [selectedBlocksForDiagnosis, setSelectedBlocksForDiagnosis] = useState<string[]>([]);
  const [completedBlockId, setCompletedBlockId] = useState<string | null>(null);
  const [nextBlockId, setNextBlockId] = useState<string | null>(null);
  const [mapTargetIndex, setMapTargetIndex] = useState<number | null>(null);
  const [mapSelection, setMapSelection] = useState<{ address: string; token: number } | null>(null);
  const [mapSelectionToken, setMapSelectionToken] = useState(0);
  const syncInFlightRef = useRef(false);

  const questionsMap: Record<string, any[]> = useMemo(() => {
    const map: Record<string, any[]> = {};
    questionsData.forEach((block: any) => {
      map[block.id] = block.questions;
    });
    return map;
  }, []);

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

  const syncLocalSnapshot = useCallback(async () => {
    if (syncInFlightRef.current) {
      return false;
    }

    try {
      const [authToken, isAuthenticated, userId] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('isAuthenticated'),
        AsyncStorage.getItem('userId'),
      ]);
      const isAuthorized = Boolean(authToken && userId && isAuthenticated === 'true');
      if (!isAuthorized) {
        return false;
      }

      syncInFlightRef.current = true;
      const pushed = await pushLocalDataToServer();
      if (pushed) {
        await AsyncStorage.setItem('serverSyncCompleted_v1', 'true');
      }
      return pushed;
    } catch (error) {
      console.error('Ошибка фоновой синхронизации:', error);
      return false;
    } finally {
      syncInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    const syncOnce = async () => {
      try {
        const syncedFlag = await AsyncStorage.getItem('serverSyncCompleted_v1');
        // Первая инициализация: пробуем подтянуть данные сервера только до первичного sync-флага.
        const pulled = syncedFlag ? false : await pullServerDataToLocal(false);
        // Затем всегда пытаемся отправить локальные изменения (внутри есть проверка хеша).
        const pushed = await syncLocalSnapshot();
        if (!syncedFlag && (pulled || pushed)) {
          await AsyncStorage.setItem('serverSyncCompleted_v1', 'true');
        }
      } catch (error) {
        console.error('Ошибка синхронизации с сервером:', error);
      }
    };

    syncOnce();
  }, [syncLocalSnapshot]);

  useEffect(() => {
    const syncOnActive = (state: string) => {
      if (state === 'active') {
        void syncLocalSnapshot();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', syncOnActive);
    const syncIntervalId = setInterval(() => {
      void syncLocalSnapshot();
    }, 45000);

    return () => {
      appStateSubscription.remove();
      clearInterval(syncIntervalId);
    };
  }, [syncLocalSnapshot]);

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
      const repeatModeRaw = await AsyncStorage.getItem(
        getVenueScopedKey('diagnosis_repeat_mode', userId, venueId)
      );
      if (repeatModeRaw === 'true') {
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

  const getOptionScore = (option: any): number => {
    if (!option) return 0;
    if (option.correct === true) return 1;
    const priority = option.recommendation?.priority;
    if (priority === 'low') return 1;
    if (priority === 'medium') return 0.5;
    if (priority === 'high') return 0;
    return 0;
  };

  const syncCompletedBlockData = useCallback(
    async (blockId: string) => {
      try {
        const userId = await getCurrentUserId();
        const venueId = await getSelectedVenueId(userId);
        if (!venueId || !blockId) {
          return;
        }

        const blockQuestions = questionsMap[blockId] || [];
        if (blockQuestions.length === 0) {
          return;
        }

        const answersKey = getVenueScopedKey(`diagnosis_answers_${blockId}`, userId, venueId);
        const answersRaw = await AsyncStorage.getItem(answersKey);
        const parsedAnswers = answersRaw ? JSON.parse(answersRaw) : {};

        const blockAnswers: Record<string, string> = {};
        let scoreSum = 0;
        let answeredCount = 0;

        blockQuestions.forEach((question: any) => {
          const questionKey = `${blockId}_${question.id}`;
          const selectedAnswerId = parsedAnswers[questionKey];
          if (!selectedAnswerId) return;

          const selectedOption = question.options.find((opt: any) => opt.id === selectedAnswerId);
          if (!selectedOption) return;

          if (selectedOption.value) {
            blockAnswers[question.id] = selectedOption.value;
          }
          scoreSum += getOptionScore(selectedOption);
          answeredCount += 1;
        });

        const blockEfficiency =
          answeredCount > 0 ? Math.round((scoreSum / answeredCount) * 100) : 0;

        const blocksKey = getVenueScopedKey('diagnosisBlocks', userId, venueId);
        const storedBlocksRaw = await AsyncStorage.getItem(blocksKey);
        const storedBlocks = storedBlocksRaw ? JSON.parse(storedBlocksRaw) : [];
        const normalizedBlocks = DEFAULT_BLOCKS.map((defaultBlock) => {
          const found = Array.isArray(storedBlocks)
            ? storedBlocks.find((block: any) => block?.id === defaultBlock.id)
            : null;
          if (found) {
            return {
              ...defaultBlock,
              ...found,
              title: defaultBlock.title,
              description: defaultBlock.description,
            };
          }
          return {
            ...defaultBlock,
            completed: false,
            efficiency: undefined,
          };
        });

        const updatedBlocks = normalizedBlocks.map((block) =>
          block.id === blockId
            ? {
                ...block,
                completed: true,
                completedAt: new Date().toLocaleDateString('ru-RU'),
                efficiency: blockEfficiency,
                answers: blockAnswers,
              }
            : block
        );
        await AsyncStorage.setItem(blocksKey, JSON.stringify(updatedBlocks));

        const currentBlockTitle =
          DEFAULT_BLOCKS.find((block) => block.id === blockId)?.title || blockId;
        const generatedBlockTasks = generateTasksFromAnswers(
          blockId,
          blockAnswers,
          blockQuestions,
          currentBlockTitle
        );

        const tasksKey = getVenueScopedKey('actionPlanTasks', userId, venueId);
        const existingTasksRaw = await AsyncStorage.getItem(tasksKey);
        const existingTasks = existingTasksRaw ? JSON.parse(existingTasksRaw) : [];
        const tasksWithoutBlock = (Array.isArray(existingTasks) ? existingTasks : []).filter(
          (task: Task | any) => String(task?.blockId || '') !== blockId
        );
        const updatedTasks = [...tasksWithoutBlock, ...generatedBlockTasks];
        await AsyncStorage.setItem(tasksKey, JSON.stringify(updatedTasks));
      } catch (error) {
        console.error('Ошибка синхронизации задач/статуса завершенного блока:', error);
      }
    },
    [questionsMap]
  );

  if (!fontsLoaded) {
    return null;
  }

  const handleSplashFinish = async (navigation: any) => {
    try {
      const [authToken, isAuthenticated, userId, hasSeenOnboarding] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('isAuthenticated'),
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('hasSeenOnboarding'),
      ]);

      const isRegisteredUser = Boolean(
        authToken && userId && isAuthenticated === 'true'
      );

      if (isRegisteredUser) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
        return;
      }

      if (hasSeenOnboarding === 'true') {
        navigation.replace('Register1');
        return;
      }

      navigation.replace('Onboarding1');
    } catch (error) {
      console.error('Ошибка определения стартового маршрута:', error);
      navigation.replace('Onboarding1');
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <NavigationIndependentTree>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
          <Stack.Screen name="Splash">
            {(props) => (
              <SplashScreen
                onFinish={() => handleSplashFinish(props.navigation)}
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
                onBack={() => props.navigation.goBack()}
                onOpenConsentDocument={() =>
                  props.navigation.navigate('PersonalDataPolicy', { origin: 'register1' })
                }
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="PersonalDataPolicy">
            {(props) => (
              <PersonalDataPolicyScreen navigation={props.navigation} route={props.route} />
            )}
          </Stack.Screen>

          <Stack.Screen name="Register2">
            {(props) => (
              <RegisterScreen2
                onContinue={() => props.navigation.navigate('Register3')}
                onSkip={() => props.navigation.navigate('Register3')}
                onBack={() => props.navigation.navigate('Register1')}
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

          <Stack.Screen name="AddProject">
            {(props) => (
              <AddProjectScreen
                onBack={() => props.navigation.goBack()}
                onAdded={() => props.navigation.goBack()}
                onOpenMap={() => {
                  setMapTargetIndex(MAP_TARGET_ADD_PROJECT);
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

          <Stack.Screen name="EditProject">
            {(props) => (
              <EditProjectScreen
                venueId={props.route.params?.venueId}
                onBack={() => props.navigation.goBack()}
                onSaved={() => props.navigation.goBack()}
                onDeleted={() => props.navigation.goBack()}
                onOpenMap={() => {
                  setMapTargetIndex(MAP_TARGET_EDIT_PROJECT);
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

          <Stack.Screen name="EditProfile">
            {(props) => (
              <EditProfileScreen
                onBack={() => props.navigation.goBack()}
                startEmpty={Boolean(props.route.params?.startEmpty)}
                onOpenConsentDocument={() =>
                  props.navigation.navigate('PersonalDataPolicy', { origin: 'editProfile' })
                }
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="ErrorScreen" component={ErrorScreen} />

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
                isRepeatMode={Boolean(props.route.params?.isRepeatMode)}
                repeatVenueId={props.route.params?.venueId ?? null}
                onContinue={async (selectedBlocks) => {
                  await AsyncStorage.setItem('registrationStep3Completed', 'true');
                  setSelectedBlocksForDiagnosis(selectedBlocks);
                  if (Platform.OS === 'web') {
                    props.navigation.reset({
                      index: 0,
                      routes: [{ name: 'MainTabs' }],
                    });
                    return;
                  }
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
                  if (Platform.OS === 'web') {
                    props.navigation.reset({
                      index: 0,
                      routes: [{ name: 'MainTabs' }],
                    });
                    return;
                  }
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
            {(props) => {
              const routeSelectedBlocks = props.route.params?.selectedBlocks;
              const effectiveSelectedBlocks =
                Array.isArray(routeSelectedBlocks) && routeSelectedBlocks.length > 0
                  ? routeSelectedBlocks
                  : selectedBlocksForDiagnosis;
              return (
                <DiagnosisQuestionsScreen
                  selectedBlocks={effectiveSelectedBlocks}
                  currentBlockId={props.route.params?.blockId}
                  onBack={() => props.navigation.goBack()}
                  onSkip={() => props.navigation.goBack()}
                  onBlockComplete={async (blockId) => {
                    setCompletedBlockId(blockId);
                    await syncCompletedBlockData(blockId);
                    props.navigation.replace('BlockResults', {
                      blockId,
                      selectedBlocks: effectiveSelectedBlocks,
                    });
                  }}
                />
              );
            }}
          </Stack.Screen>

          <Stack.Screen name="BlockResults">
            {(props) => {
              const blockId = props.route.params?.blockId || completedBlockId || '';
              const routeSelectedBlocks = props.route.params?.selectedBlocks;
              const effectiveSelectedBlocks =
                Array.isArray(routeSelectedBlocks) && routeSelectedBlocks.length > 0
                  ? routeSelectedBlocks
                  : selectedBlocksForDiagnosis;
              const blocksCount = effectiveSelectedBlocks.length || DEFAULT_BLOCKS.length;
              const selectedIndex = effectiveSelectedBlocks.indexOf(blockId);
              return (
                <BlockResultsScreen
                  blockId={blockId}
                  completedBlockIndex={selectedIndex >= 0 ? selectedIndex : DEFAULT_BLOCKS.findIndex((b) => b.id === blockId)}
                  totalBlocks={blocksCount}
                  selectedBlocks={effectiveSelectedBlocks}
                  onContinue={async () => {
                    const blocks = effectiveSelectedBlocks.length
                      ? effectiveSelectedBlocks
                      : await loadSelectedBlocksFromStorage();
                    const currentIdx = blocks.findIndex((id) => id === blockId);
                    const nextIdx = currentIdx + 1;
                    if (nextIdx < blocks.length) {
                      const nextId = blocks[nextIdx];
                      setNextBlockId(nextId);
                      const completed = await isBlockCompleted(nextId);
                      if (completed) {
                        props.navigation.replace('BlockResults', {
                          blockId: nextId,
                          selectedBlocks: blocks,
                        });
                      } else {
                        props.navigation.replace('NextBlock', {
                          blockId: nextId,
                          origin: 'blockResults',
                          selectedBlocks: blocks,
                        });
                      }
                    } else {
                      props.navigation.replace('DiagnosisResults');
                    }
                  }}
                  onViewTasks={() => {
                    const jumpNonce = Date.now();
                    props.navigation.dispatch(
                      CommonActions.reset({
                        index: 0,
                        routes: [
                          {
                            name: 'MainTabs',
                            params: {
                              tab: 'Задачи',
                              screen: 'Задачи',
                              params: {
                                screen: 'ActionPlanMain',
                                params: {
                                  selectedTab: blockId,
                                  targetBlockId: blockId,
                                  jumpNonce,
                                },
                              },
                            },
                          },
                        ],
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
              const routeSelectedBlocks = props.route.params?.selectedBlocks;
              const effectiveSelectedBlocks =
                Array.isArray(routeSelectedBlocks) && routeSelectedBlocks.length > 0
                  ? routeSelectedBlocks
                  : selectedBlocksForDiagnosis;
              const blockIndex = DEFAULT_BLOCKS.findIndex((block) => block.id === blockId);
              const blockTitle = DEFAULT_BLOCKS.find((block) => block.id === blockId)?.title;
              return (
                <NextBlockScreen
                  blockId={blockId}
                  blockTitle={blockTitle}
                  currentStepIndex={blockIndex >= 0 ? blockIndex : undefined}
                  selectedBlocks={effectiveSelectedBlocks}
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
                        const repeatModeRaw = await AsyncStorage.getItem(
                          getVenueScopedKey('diagnosis_repeat_mode', userId, venueId)
                        );
                        if (repeatModeRaw !== 'true') {
                          const answersKey = getVenueScopedKey(`diagnosis_answers_${blockId}`, userId, venueId);
                          const saved = await AsyncStorage.getItem(answersKey);
                          const parsed = saved ? JSON.parse(saved) : {};
                          const answered = Object.values(parsed || {}).filter(
                            (value) => value !== null && value !== undefined && value !== ''
                          ).length;
                          if (answered >= total) {
                            await syncCompletedBlockData(blockId);
                            props.navigation.replace('BlockResults', {
                              blockId,
                              selectedBlocks: effectiveSelectedBlocks,
                            });
                            return;
                          }
                        }
                      }
                    } catch (error) {
                      console.error('Ошибка проверки завершения блока:', error);
                    }
                    props.navigation.replace('DiagnosisQuestions', {
                      blockId,
                      selectedBlocks: effectiveSelectedBlocks,
                    });
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
