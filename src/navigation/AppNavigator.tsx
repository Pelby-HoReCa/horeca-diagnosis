import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

import ActionPlanScreen from '../screens/ActionPlanScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import BlockQuestionsScreen from '../screens/BlockQuestionsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import QuestionnaireScreen from '../screens/QuestionnaireScreen';
import SelfDiagnosisBlocksScreen from '../screens/SelfDiagnosisBlocksScreen';
import { clearDataOnAppLaunch } from '../utils/appState';

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  gray: '#F0F0F0',
  white: '#FFFFFF',
  darkGray: '#666666',
};

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SelfDiagnosisBlocks" 
        component={SelfDiagnosisBlocksScreen} 
        options={{ title: 'Блоки диагностики' }} 
      />
      <Stack.Screen 
        name="BlockQuestions" 
        component={BlockQuestionsScreen} 
        options={{ title: 'Вопросы блока' }} 
      />
      <Stack.Screen 
        name="Questionnaire" 
        component={QuestionnaireScreen} 
        options={{ title: 'Анкетирование' }} 
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  useEffect(() => {
    clearDataOnAppLaunch();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.orange,
        tabBarInactiveTintColor: COLORS.blue,
        // Отключаем изменение URL на вебе
        ...(Platform.OS === 'web' && {
          linking: {
            enabled: false,
          },
        }),
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.gray,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          paddingHorizontal: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingHorizontal: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Главная" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Главная',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={22} 
              color={focused ? COLORS.orange : COLORS.blue} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Задачи" 
        component={ActionPlanScreen}
        options={{
          tabBarLabel: 'Задачи',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} 
              size={22} 
              color={focused ? COLORS.orange : COLORS.blue} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Диагностика" 
        component={HomeStack}
        options={{
          tabBarLabel: 'Диагностика',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'add-circle' : 'add-circle-outline'} 
              size={22} 
              color={focused ? COLORS.orange : COLORS.blue} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="AI-агент" 
        component={AIAssistantScreen}
        options={{
          tabBarLabel: 'AI-агент',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'chatbubble' : 'chatbubble-outline'} 
              size={22} 
              color={focused ? COLORS.orange : COLORS.blue} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Результаты" 
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Результаты',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'bar-chart' : 'bar-chart-outline'} 
              size={22} 
              color={focused ? COLORS.orange : COLORS.blue} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Профиль" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Профиль',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={22} 
              color={focused ? COLORS.orange : COLORS.blue} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}