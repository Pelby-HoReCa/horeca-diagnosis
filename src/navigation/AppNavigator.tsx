import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import ActionPlanScreen from '../screens/ActionPlanScreen';
import TaskSubtasksScreen from '../screens/TaskSubtasksScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import BlockQuestionsScreen from '../screens/BlockQuestionsScreen';
import BlockResultsScreen from '../screens/BlockResultsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DiagnosisHistoryScreen from '../screens/DiagnosisHistoryScreen';
import HelpScreen from '../screens/HelpScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SelfDiagnosisBlocksScreen from '../screens/SelfDiagnosisBlocksScreen';
import { clearDataOnAppLaunch } from '../utils/appState';
import { DEFAULT_BLOCKS } from '../data/diagnosisBlocks';

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  gray: '#F0F0F0',
  white: '#FFFFFF',
  darkGray: '#666666',
  inactive: '#868C98',
  active: '#375DFB',
};

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="SelfDiagnosisBlocks" 
        component={SelfDiagnosisBlocksScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="BlockQuestions" 
        component={BlockQuestionsScreen} 
        options={{ title: 'Вопросы блока' }} 
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        listeners={{
          focus: () => {
            // Скрываем таб-бар при открытии экрана Help
          },
        }}
      />
    </Stack.Navigator>
  );
}

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen
        name="DashboardBlockResults"
        component={DashboardBlockResultsScreen}
      />
      <Stack.Screen
        name="DiagnosisHistory"
        component={DiagnosisHistoryScreen}
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        listeners={{
          focus: () => {
            // Скрываем таб-бар при открытии экрана Help
          },
        }}
      />
    </Stack.Navigator>
  );
}

function DashboardBlockResultsScreen({ route, navigation }: any) {
  const { blockId } = route.params || {};
  const blockIndex = DEFAULT_BLOCKS.findIndex((block) => block.id === blockId);
  const totalBlocks = DEFAULT_BLOCKS.length;

  return (
    <BlockResultsScreen
      blockId={blockId}
      completedBlockIndex={blockIndex >= 0 ? blockIndex : undefined}
      totalBlocks={totalBlocks}
      onContinue={() => navigation.goBack()}
      onBack={() => navigation.goBack()}
      onClose={() => navigation.goBack()}
      onViewTasks={() => {
        const parentNav = navigation.getParent?.();
        if (parentNav) {
          parentNav.navigate('Задачи');
        } else {
          navigation.navigate('Задачи');
        }
      }}
    />
  );
}

function ActionPlanStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ActionPlanMain" component={ActionPlanScreen} />
      <Stack.Screen name="TaskSubtasks" component={TaskSubtasksScreen} />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        listeners={{
          focus: () => {
            // Скрываем таб-бар при открытии экрана Help
          },
        }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator({ route }: { route?: any }) {
  const [homeIconSvg, setHomeIconSvg] = useState<string>('');
  const [taskIconSvg, setTaskIconSvg] = useState<string>('');
  const [diagnosisIconSvg, setDiagnosisIconSvg] = useState<string>('');
  const [aiAgentIconSvg, setAiAgentIconSvg] = useState<string>('');
  const [userIconSvg, setUserIconSvg] = useState<string>('');
  const tabRef = useRef<any>(null);

  useEffect(() => {
    clearDataOnAppLaunch();
    
    // Загружаем SVG иконку для главной
    const loadHomeIcon = async () => {
      try {
        const iconAsset = Asset.fromModule(require('../../assets/images/home-02-icon.svg'));
        await iconAsset.downloadAsync();
        if (iconAsset.localUri) {
          const response = await fetch(iconAsset.localUri);
          const fileContent = await response.text();
          setHomeIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки главной:', error);
      }
    };
    
    // Загружаем SVG иконку для задач
    const loadTaskIcon = async () => {
      try {
        const iconAsset = Asset.fromModule(require('../../assets/images/task-daily-icon.svg'));
        await iconAsset.downloadAsync();
        if (iconAsset.localUri) {
          const response = await fetch(iconAsset.localUri);
          const fileContent = await response.text();
          setTaskIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки задач:', error);
      }
    };
    
    // Загружаем SVG иконку для диагностики
    const loadDiagnosisIcon = async () => {
      try {
        const iconAsset = Asset.fromModule(require('../../assets/images/dashboard-speed-icon.svg'));
        await iconAsset.downloadAsync();
        if (iconAsset.localUri) {
          const response = await fetch(iconAsset.localUri);
          const fileContent = await response.text();
          setDiagnosisIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки диагностики:', error);
      }
    };
    
    // Загружаем SVG иконку для AI-агента
    const loadAiAgentIcon = async () => {
      try {
        const iconAsset = Asset.fromModule(require('../../assets/images/stars-icon.svg'));
        await iconAsset.downloadAsync();
        if (iconAsset.localUri) {
          const response = await fetch(iconAsset.localUri);
          const fileContent = await response.text();
          setAiAgentIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки AI-агента:', error);
      }
    };
    
    // Загружаем SVG иконку для профиля
    const loadUserIcon = async () => {
      try {
        const iconAsset = Asset.fromModule(require('../../assets/images/user-icon.svg'));
        await iconAsset.downloadAsync();
        if (iconAsset.localUri) {
          const response = await fetch(iconAsset.localUri);
          const fileContent = await response.text();
          setUserIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки профиля:', error);
      }
    };
    
    loadHomeIcon();
    loadTaskIcon();
    loadDiagnosisIcon();
    loadAiAgentIcon();
    loadUserIcon();
  }, []);

  const tabNames = ['Главная', 'Задачи', 'Диагностика', 'AI-агент', 'Профиль'];

  const navigateToTab = (tabName: string) => {
    let attempts = 0;
    const tryNavigate = () => {
      const nav = tabRef.current;
      if (nav?.jumpTo || nav?.navigate) {
        nav.jumpTo?.(tabName);
        nav.navigate?.(tabName);
        nav.dispatch?.(CommonActions.navigate({ name: tabName } as any));
        return;
      }
      if (attempts < 6) {
        attempts += 1;
        setTimeout(tryNavigate, 100);
      }
    };
    tryNavigate();
  };

  useEffect(() => {
    const applyPendingTab = async () => {
      try {
        const pending = await AsyncStorage.getItem('pendingTab');
        if (!pending) return;
        navigateToTab(pending);
        await AsyncStorage.removeItem('pendingTab');
      } catch (error) {
        console.error('Ошибка применения pendingTab:', error);
      }
    };
    applyPendingTab();
  }, []);

  useEffect(() => {
    const targetTab = route?.params?.tab;
    if (targetTab && tabNames.includes(targetTab)) {
      setTimeout(() => {
        navigateToTab(targetTab);
      }, 0);
    }
  }, [route?.params?.tab]);

  // ЕДИНЫЕ НАСТРОЙКИ МЕНЮ ДЛЯ ВСЕХ ЭКРАНОВ - ЗАКРЕПЛЕНО НАМЕРТВО
  const fixedTabBarStyle = {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
    paddingBottom: 6,
    paddingTop: -8,
    height: 75,
    paddingHorizontal: 0,
    elevation: 8, // Для Android
    shadowColor: '#000', // Для iOS
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  };

  const fixedTabBarLabelStyle = {
    fontSize: 11,
    fontWeight: '400' as const,
    marginTop: 4,
  };

  const fixedTabBarItemStyle = {
    paddingHorizontal: 0,
    paddingTop: 5,
  };

  return (
    <Tab.Navigator
      ref={tabRef}
      initialRouteName={route?.params?.tab && tabNames.includes(route?.params?.tab) ? route?.params?.tab : 'Главная'}
      screenOptions={({ route }) => {
        const focusedRouteName = getFocusedRouteNameFromRoute(route) ?? '';
        const hideTabBar = focusedRouteName === 'Help';
        return {
          headerShown: false,
          tabBarActiveTintColor: COLORS.active,
          tabBarInactiveTintColor: COLORS.inactive,
          // Отключаем изменение URL на вебе
          ...(Platform.OS === 'web' && {
            linking: {
              enabled: false,
            },
          }),
          tabBarStyle: hideTabBar ? { display: 'none' } : fixedTabBarStyle,
          tabBarLabelStyle: fixedTabBarLabelStyle,
          tabBarItemStyle: fixedTabBarItemStyle,
          tabBarBackground: () =>
            hideTabBar ? null : (
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFillObject, { backgroundColor: COLORS.white }]}
              />
            ),
        };
      }}
    >
      <Tab.Screen 
        name="Главная" 
        component={DashboardStack}
        options={{
          tabBarLabel: 'Главная',
          tabBarItemStyle: {
            transform: [{ translateX: 9 }], // Сдвигаем иконку и подпись вправо на 9px
          },
          tabBarIcon: ({ focused, color, size }) => {
            if (homeIconSvg) {
              const iconColor = focused ? COLORS.active : COLORS.inactive;
              const coloredSvg = homeIconSvg.replace(/#868C98/g, iconColor);
              return (
                <View style={{ marginTop: 2 }}>
                  <SvgXml 
                    xml={coloredSvg} 
                    width={23} 
                    height={23}
                  />
                </View>
              );
            }
            return (
              <View style={{ marginTop: 2 }}>
                <Ionicons 
                  name={focused ? 'home' : 'home-outline'} 
                  size={23} 
                  color={focused ? COLORS.active : COLORS.inactive} 
                />
              </View>
            );
          },
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Если уже на табе "Главная", сбрасываем стек навигации до корневого экрана
            const state = navigation.getState();
            const mainTabRoute = state.routes.find(r => r.name === 'Главная');
            
            if (mainTabRoute && mainTabRoute.state && mainTabRoute.state.index > 0) {
              // Если в стеке есть экраны кроме корневого, сбрасываем стек
              e.preventDefault();
              
              // Сбрасываем стек навигации внутри таба "Главная"
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'Главная',
                      state: {
                        routes: [{ name: 'DashboardMain' }],
                        index: 0,
                      },
                    },
                  ],
                })
              );
            }
          },
        })}
      />
      <Tab.Screen 
        name="Задачи" 
        component={ActionPlanStack}
        options={{
          tabBarLabel: 'Задачи',
          tabBarItemStyle: {
            transform: [{ translateX: 20 }], // Сдвигаем иконку и подпись вправо на 20px (было 18, сдвинули вправо на 2px)
          },
          tabBarIcon: ({ focused, color, size }) => {
            if (taskIconSvg) {
              const iconColor = focused ? COLORS.active : COLORS.inactive;
              const coloredSvg = taskIconSvg.replace(/#868C98/g, iconColor);
              return (
                <View style={{ marginTop: 2 }}>
                  <SvgXml 
                    xml={coloredSvg} 
                    width={23} 
                    height={23}
                  />
                </View>
              );
            }
            return (
              <View style={{ marginTop: 2 }}>
                <Ionicons 
                  name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} 
                  size={23} 
                  color={focused ? COLORS.active : COLORS.inactive} 
                />
              </View>
            );
          },
        }}
      />
      <Tab.Screen 
        name="Диагностика" 
        component={HomeStack}
        options={{
          tabBarLabel: 'Диагностика',
          tabBarItemStyle: {
            flexShrink: 0, // Предотвращаем сжатие элемента таба
            minWidth: 90, // Минимальная ширина для полного отображения подписи
            paddingHorizontal: 4, // Уменьшаем горизонтальный padding для уменьшения области нажатия (было 8)
            transform: [{ translateX: -3 }], // Сдвигаем иконку и подпись влево на 3px (было -5, сдвинули вправо на 2px)
          },
          tabBarIcon: ({ focused, color, size }) => {
            if (diagnosisIconSvg) {
              const iconColor = focused ? COLORS.active : COLORS.inactive;
              const coloredSvg = diagnosisIconSvg.replace(/#868C98/g, iconColor);
              return (
                <View style={{ marginTop: 2 }}>
                  <SvgXml 
                    xml={coloredSvg} 
                    width={23} 
                    height={23}
                  />
                </View>
              );
            }
            return (
              <View style={{ marginTop: 2 }}>
                <Ionicons 
                  name={focused ? 'add-circle' : 'add-circle-outline'} 
                  size={23} 
                  color={focused ? COLORS.active : COLORS.inactive} 
                />
              </View>
            );
          },
        }}
      />
      <Tab.Screen 
        name="AI-агент" 
        component={AIAssistantScreen}
        options={{
          tabBarLabel: 'AI-агент',
          tabBarItemStyle: {
            transform: [{ translateX: -25 }], // Сдвигаем иконку и подпись влево на 25px (было -27, сдвинули вправо на 2px)
          },
          tabBarIcon: ({ focused, color, size }) => {
            if (aiAgentIconSvg) {
              const iconColor = focused ? COLORS.active : COLORS.inactive;
              const coloredSvg = aiAgentIconSvg.replace(/#868C98/g, iconColor);
              return (
                <View style={{ marginTop: 2 }}>
                  <SvgXml 
                    xml={coloredSvg} 
                    width={23} 
                    height={23}
                  />
                </View>
              );
            }
            return (
              <View style={{ marginTop: 2 }}>
                <Ionicons 
                  name={focused ? 'chatbubble' : 'chatbubble-outline'} 
                  size={23} 
                  color={focused ? COLORS.active : COLORS.inactive} 
                />
              </View>
            );
          },
        }}
      />
      <Tab.Screen 
        name="Профиль" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Профиль',
          tabBarLabelStyle: {
            ...fixedTabBarLabelStyle,
            minWidth: 60,
          },
          tabBarItemStyle: {
            transform: [{ translateX: -14 }], // Сдвигаем иконку и подпись влево на 14px
          },
          tabBarIcon: ({ focused, color, size }) => {
            if (userIconSvg) {
              const iconColor = focused ? COLORS.active : COLORS.inactive;
              const coloredSvg = userIconSvg.replace(/#868C98/g, iconColor);
              return (
                <View style={{ marginTop: 2 }}>
                  <SvgXml 
                    xml={coloredSvg} 
                    width={23} 
                    height={23}
                  />
                </View>
              );
            }
            return (
              <View style={{ marginTop: 2 }}>
                <Ionicons 
                  name={focused ? 'person' : 'person-outline'} 
                  size={23} 
                  color={focused ? COLORS.active : COLORS.inactive} 
                />
              </View>
            );
          },
        }}
      />
    </Tab.Navigator>
  );
}
