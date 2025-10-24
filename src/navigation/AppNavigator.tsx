import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import ActionPlanScreen from '../screens/ActionPlanScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SelfDiagnosisBlocksScreen from '../screens/SelfDiagnosisBlocksScreen';

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
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.orange,
        tabBarInactiveTintColor: COLORS.blue,
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
    </Tab.Navigator>
  );
}