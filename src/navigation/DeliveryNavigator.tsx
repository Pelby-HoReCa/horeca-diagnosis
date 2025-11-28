// Навигатор для приложения доставки

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { BlurView } from 'expo-blur';

import MenuScreen from '../screens/delivery/MenuScreen';
import ProductDetailScreen from '../screens/delivery/ProductDetailScreen';
import CartScreen from '../screens/delivery/CartScreen';
import CheckoutScreen from '../screens/delivery/CheckoutScreen';
import OrdersScreen from '../screens/delivery/OrdersScreen';
import OrderDetailScreen from '../screens/delivery/OrderDetailScreen';
import { useCart } from '../context/CartContext';
import { palette, spacing } from '../styles/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Стек для меню
function MenuStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: palette.white,
        },
        headerTintColor: palette.primaryOrange,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="Menu"
        component={MenuScreen}
        options={{ title: 'Меню' }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: 'Товар' }}
      />
    </Stack.Navigator>
  );
}

// Стек для корзины
function CartStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: palette.white,
        },
        headerTintColor: palette.primaryOrange,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'Корзина' }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Оформление заказа' }}
      />
    </Stack.Navigator>
  );
}

// Стек для заказов
function OrdersStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: palette.white,
        },
        headerTintColor: palette.primaryOrange,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: 'Мои заказы' }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Детали заказа' }}
      />
    </Stack.Navigator>
  );
}

export default function DeliveryNavigator() {
  // Компонент для бейджа на иконке корзины
  const CartTabIcon = ({ focused, color, size }: any) => {
    const { getItemCount } = useCart();
    const itemCount = getItemCount();

    return (
      <View>
        <Ionicons
          name={focused ? 'cart' : 'cart-outline'}
          size={size}
          color={color}
        />
        {itemCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {itemCount > 99 ? '99+' : itemCount}
            </Text>
          </View>
        )}
      </View>
    );
  };
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primaryOrange,
        tabBarInactiveTintColor: palette.gray600,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 20 : 10,
          left: spacing.xl,
          right: spacing.xl,
          backgroundColor: 'transparent',
          borderRadius: 35,
          height: 60,
          paddingBottom: Platform.OS === 'ios' ? 8 : 6,
          paddingTop: 6,
          paddingHorizontal: 10,
          borderTopWidth: 0,
          borderWidth: 0.5,
          borderColor: palette.white,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="light"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: 35,
                borderWidth: 0.5,
                borderColor: palette.white,
                overflow: 'hidden',
              },
            ]}
          />
        ),
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
        name="MenuTab"
        component={MenuStack}
        options={{
          tabBarLabel: 'Меню',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'restaurant' : 'restaurant-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartStack}
        options={{
          tabBarLabel: 'Корзина',
          tabBarIcon: ({ focused, color, size }) => (
            <CartTabIcon focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStack}
        options={{
          tabBarLabel: 'Заказы',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: palette.primaryOrange,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: palette.white,
    fontSize: 10,
    fontWeight: '600',
  },
});

