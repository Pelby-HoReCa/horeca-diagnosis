// Экран корзины

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '../../components/delivery/CartItem';
import { useCart } from '../../context/CartContext';
import { palette, spacing, radii, typography, shadows } from '../../styles/theme';

export default function CartScreen({ navigation }: any) {
  const { cart, updateQuantity, removeFromCart, clearCart, getTotalAmount } = useCart();

  const handleCheckout = () => {
    if (cart.items.length === 0) return;
    navigation.navigate('Checkout');
  };

  if (cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={64} color={palette.gray400} />
        <Text style={styles.emptyText}>Корзина пуста</Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('Menu')}
        >
          <Text style={styles.browseButtonText}>Перейти к меню</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Корзина</Text>
          <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearText}>Очистить</Text>
          </TouchableOpacity>
        </View>

        {cart.items.map((item) => (
          <CartItem
            key={item.product.id}
            item={item}
            onIncrease={() => updateQuantity(item.product.id, item.quantity + 1)}
            onDecrease={() => updateQuantity(item.product.id, item.quantity - 1)}
            onRemove={() => removeFromCart(item.product.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Итого:</Text>
          <Text style={styles.totalAmount}>{getTotalAmount()} ₽</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>Оформить заказ</Text>
          <Ionicons name="arrow-forward" size={20} color={palette.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: palette.white,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray200,
  },
  title: {
    ...typography.heading1,
  },
  clearText: {
    ...typography.body,
    color: palette.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.background,
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.heading2,
    color: palette.gray500,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  browseButton: {
    backgroundColor: palette.primaryOrange,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
  },
  browseButtonText: {
    ...typography.heading3,
    color: palette.white,
  },
  footer: {
    backgroundColor: palette.white,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.gray200,
    ...shadows.floating,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalLabel: {
    ...typography.heading2,
  },
  totalAmount: {
    ...typography.heading1,
    color: palette.primaryOrange,
  },
  checkoutButton: {
    backgroundColor: palette.primaryOrange,
    borderRadius: radii.sm,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkoutButtonText: {
    ...typography.heading3,
    color: palette.white,
  },
});


