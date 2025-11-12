import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

import ActionPlanScreen from '../screens/ActionPlanScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import BlockDetailScreen from '../screens/BlockDetailScreen';
import BlockQuestionsScreen from '../screens/BlockQuestionsScreen';
import DashboardScreen from '../screens/DashboardScreen';
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
    </Stack.Navigator>
  );
}

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="BlockDetail" component={BlockDetailScreen} />
    </Stack.Navigator>
  );
}

function ActionPlanStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ActionPlanMain" component={ActionPlanScreen} />
      <Stack.Screen name="BlockDetail" component={BlockDetailScreen} />
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
        component={DashboardStack}
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