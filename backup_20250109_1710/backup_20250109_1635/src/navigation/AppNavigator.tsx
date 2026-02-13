import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Asset } from 'expo-asset';
import React, { useEffect, useState } from 'react';
import { Platform, Text, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import ActionPlanScreen from '../screens/ActionPlanScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import BlockQuestionsScreen from '../screens/BlockQuestionsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DiagnosisHistoryScreen from '../screens/DiagnosisHistoryScreen';
import HelpScreen from '../screens/HelpScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SelfDiagnosisBlocksScreen from '../screens/SelfDiagnosisBlocksScreen';
import { clearDataOnAppLaunch } from '../utils/appState';

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
        options={{
          tabBarStyle: { display: 'none' },
        }}
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
        name="DiagnosisHistory"
        component={DiagnosisHistoryScreen}
        options={{
          tabBarStyle: { display: 'none' },
        }}
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{
          tabBarStyle: { display: 'none' },
        }}
        listeners={{
          focus: () => {
            // Скрываем таб-бар при открытии экрана Help
          },
        }}
      />
    </Stack.Navigator>
  );
}

function ActionPlanStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ActionPlanMain" component={ActionPlanScreen} />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{
          tabBarStyle: { display: 'none' },
        }}
        listeners={{
          focus: () => {
            // Скрываем таб-бар при открытии экрана Help
          },
        }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const [homeIconSvg, setHomeIconSvg] = useState<string>('');
  const [taskIconSvg, setTaskIconSvg] = useState<string>('');
  const [diagnosisIconSvg, setDiagnosisIconSvg] = useState<string>('');
  const [aiAgentIconSvg, setAiAgentIconSvg] = useState<string>('');
  const [userIconSvg, setUserIconSvg] = useState<string>('');

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

  // ЕДИНЫЕ НАСТРОЙКИ МЕНЮ ДЛЯ ВСЕХ ЭКРАНОВ - ЗАКРЕПЛЕНО НАМЕРТВО
  const fixedTabBarStyle = {
    backgroundColor: 'transparent', // Прозрачный фон, белое поле через tabBarBackground
    borderTopWidth: 0, // Убираем границу, она в tabBarBackground
    paddingBottom: 6,
    paddingTop: -8,
    height: 70,
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
    marginTop: -3, // Поднимаем подписи иконок на 3px вверх (было -5, опустили еще на 2px вниз)
  };

  const fixedTabBarItemStyle = {
    paddingHorizontal: 0,
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        // Отключаем изменение URL на вебе
        ...(Platform.OS === 'web' && {
          linking: {
            enabled: false,
          },
        }),
        tabBarStyle: fixedTabBarStyle,
        tabBarLabelStyle: fixedTabBarLabelStyle,
        tabBarItemStyle: fixedTabBarItemStyle,
        tabBarBackground: () => (
          <View 
            style={{
              position: 'absolute',
              bottom: 10, // Поднимаем белое поле на 10px выше
              left: 0,
              right: 0,
              height: 70,
              backgroundColor: COLORS.white,
              borderTopColor: COLORS.gray,
              borderTopWidth: 1,
            }}
          />
        ),
      }}
    >
      <Tab.Screen 
        name="Главная" 
        component={DashboardStack}
        options={{
          tabBarLabel: 'Главная',
          tabBarItemStyle: {
            transform: [{ translateX: 9 }], // Сдвигаем иконку и подпись вправо на 9px (было 7, добавили еще 2)
          },
          tabBarIcon: ({ focused, color, size }) => {
            if (homeIconSvg) {
              const iconColor = focused ? COLORS.active : COLORS.inactive;
              const coloredSvg = homeIconSvg.replace(/#868C98/g, iconColor);
              return (
                <View style={{ marginTop: -8 }}>
                  <SvgXml 
                    xml={coloredSvg} 
                    width={23} 
                    height={23}
                  />
                </View>
              );
            }
            return (
              <View style={{ marginTop: -8 }}>
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
                <View style={{ marginTop: -8 }}>
                  <SvgXml 
                    xml={coloredSvg} 
                    width={23} 
                    height={23}
                  />
                </View>
              );
            }
            return (
              <View style={{ marginTop: -8 }}>
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
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '400' as const,
            marginTop: -3,
            flexShrink: 0, // Предотвращаем обрезание текста
          },
          tabBarIcon: ({ focused, color, size }) => {
            if (diagnosisIconSvg) {
              const iconColor = focused ? COLORS.active : COLORS.inactive;
              const coloredSvg = diagnosisIconSvg.replace(/#868C98/g, iconColor);
              return (
                <View style={{ marginTop: -8 }}>
                  <SvgXml 
                    xml={coloredSvg} 
                    width={23} 
                    height={23}
                  />
                </View>
              );
            }
            return (
              <View style={{ marginTop: -8 }}>
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
                <View style={{ marginTop: -8 }}>
                  <SvgXml 
                    xml={coloredSvg} 
                    width={23} 
                    height={23}
                  />
                </View>
              );
            }
            return (
              <View style={{ marginTop: -8 }}>
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
            fontSize: 11,
            fontWeight: '400' as const,
            marginTop: -3,
            flexShrink: 0,
            flexGrow: 0,
            width: 'auto',
            minWidth: 60,
          },
          tabBarItemStyle: {
            transform: [{ translateX: -10 }], // Сдвигаем иконку и подпись влево на 10px (было -7, добавили еще 3)
          },
          tabBarIcon: ({ focused, color, size }) => {
            if (userIconSvg) {
              const iconColor = focused ? COLORS.active : COLORS.inactive;
              const coloredSvg = userIconSvg.replace(/#868C98/g, iconColor);
              return (
                <View style={{ marginTop: -8 }}>
                  <SvgXml 
                    xml={coloredSvg} 
                    width={23} 
                    height={23}
                  />
                </View>
              );
            }
            return (
              <View style={{ marginTop: -8 }}>
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
