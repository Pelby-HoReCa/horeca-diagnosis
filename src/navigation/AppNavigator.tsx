import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import ActionPlanScreen from '../screens/ActionPlanScreen';
import TaskSubtasksScreen from '../screens/TaskSubtasksScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import BlockQuestionsScreen from '../screens/BlockQuestionsScreen';
import BlockResultsScreen from '../screens/BlockResultsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DiagnosisHistoryScreen from '../screens/DiagnosisHistoryScreen';
import HelpScreen from '../screens/HelpScreen';
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
      <Stack.Screen
        name="DiagnosisHistory"
        component={DiagnosisHistoryScreen}
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
  const targetBlockId = typeof blockId === 'string' && blockId ? blockId : 'all';
  const actionPlanRouteParams = {
    screen: 'ActionPlanMain',
    params: {
      selectedTab: targetBlockId,
      targetBlockId,
      jumpNonce: Date.now(),
    },
  };

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
          parentNav.navigate('Задачи', actionPlanRouteParams);
        } else {
          navigation.navigate('Задачи', actionPlanRouteParams);
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

function AIAssistantStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AIAssistantMain" component={AIAssistantScreen} />
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
    paddingBottom: 11,
    paddingTop: 3,
    height: 73,
    paddingHorizontal: 0,
    elevation: 8, // Для Android
    shadowColor: '#000', // Для iOS
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  };

  const fixedTabBarLabelStyle = {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '400' as const,
    marginTop: 3,
    width: '100%',
    textAlign: 'center' as const,
    includeFontPadding: false,
  };

  const fixedTabBarItemStyle = {
    paddingHorizontal: 0,
    paddingTop: 2,
    paddingBottom: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  const baseIconSlotStyle = {
    marginTop: 2,
    width: 23,
    height: 23,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  const renderFixedTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const focusedDescriptor = descriptors[state.routes[state.index].key];
    const focusedTabBarStyle = StyleSheet.flatten(focusedDescriptor?.options?.tabBarStyle as any);
    if (focusedTabBarStyle?.display === 'none') {
      return null;
    }

    return (
      <View style={fixedTabBarStyle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', width: '100%' }}>
          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            const { options } = descriptor;
            const isFocused = state.index === index;
            const color = isFocused ? COLORS.active : COLORS.inactive;
            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : typeof options.title === 'string'
                  ? options.title
                  : route.name;

            const icon =
              typeof options.tabBarIcon === 'function'
                ? options.tabBarIcon({ focused: isFocused, color, size: 23 })
                : null;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name as never);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.85}
                style={[
                  fixedTabBarItemStyle,
                  {
                    width: `${100 / state.routes.length}%`,
                    minWidth: `${100 / state.routes.length}%`,
                    maxWidth: `${100 / state.routes.length}%`,
                  },
                ]}
              >
                {icon}
                <Text style={[fixedTabBarLabelStyle, { color }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Tab.Navigator
      ref={tabRef}
      tabBar={renderFixedTabBar}
      initialRouteName={route?.params?.tab && tabNames.includes(route?.params?.tab) ? route?.params?.tab : 'Главная'}
      screenOptions={({ route }) => {
        const focusedRouteName = getFocusedRouteNameFromRoute(route) ?? '';
        const hideTabBar = focusedRouteName === 'Help' || focusedRouteName === 'TaskSubtasks';
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
          tabBarStyle: hideTabBar ? { display: 'none' } : undefined,
        };
      }}
    >
      <Tab.Screen 
        name="Главная" 
        component={DashboardStack}
        options={{
          tabBarLabel: 'Главная',
          tabBarIcon: ({ focused, color, size }) => {
            if (homeIconSvg) {
              const iconColor = focused ? COLORS.active : COLORS.inactive;
              const coloredSvg = homeIconSvg.replace(/#868C98/g, iconColor);
              return (
                <View style={baseIconSlotStyle}>
                  <SvgXml 
                    xml={coloredSvg} 
                    width={23} 
                    height={23}
                  />
                </View>
              );
            }
            return (
              <View style={baseIconSlotStyle}>
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
          tabBarIcon: ({ focused, color, size }) => {
            if (taskIconSvg) {
              const iconColor = focused ? COLORS.active : COLORS.inactive;
              const coloredSvg = taskIconSvg.replace(/#868C98/g, iconColor);
              return (
                <View style={baseIconSlotStyle}>
                  <SvgXml 
                    xml={coloredSvg} 
                    width={23} 
                    height={23}
                  />
                </View>
              );
            }
            return (
              <View style={baseIconSlotStyle}>
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
          tabBarIcon: ({ focused, color, size }) => {
            if (diagnosisIconSvg) {
              const iconColor = focused ? COLORS.active : COLORS.inactive;
              const coloredSvg = diagnosisIconSvg.replace(/#868C98/g, iconColor);
              return (
                <View style={baseIconSlotStyle}>
                  <SvgXml 
                    xml={coloredSvg} 
                    width={23} 
                    height={23}
                  />
                </View>
              );
            }
            return (
              <View style={baseIconSlotStyle}>
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
        component={AIAssistantStack}
        options={{
          tabBarLabel: 'AI-агент',
          tabBarIcon: ({ focused, color, size }) => {
            if (aiAgentIconSvg) {
              const iconColor = focused ? COLORS.active : COLORS.inactive;
              const coloredSvg = aiAgentIconSvg.replace(/#868C98/g, iconColor);
              return (
                <View style={baseIconSlotStyle}>
                  <SvgXml 
                    xml={coloredSvg} 
                    width={23} 
                    height={23}
                  />
                </View>
              );
            }
            return (
              <View style={baseIconSlotStyle}>
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
          tabBarIcon: ({ focused, color, size }) => {
            if (userIconSvg) {
              const iconColor = focused ? COLORS.active : COLORS.inactive;
              const coloredSvg = userIconSvg.replace(/#868C98/g, iconColor);
              return (
                <View style={baseIconSlotStyle}>
                  <SvgXml 
                    xml={coloredSvg} 
                    width={23} 
                    height={23}
                  />
                </View>
              );
            }
            return (
              <View style={baseIconSlotStyle}>
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
