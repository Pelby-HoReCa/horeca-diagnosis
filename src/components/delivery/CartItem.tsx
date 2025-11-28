// Компонент элемента корзины

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem as CartItemType } from '../../types/cart';
import { palette, spacing, radii, typography, shadows } from '../../styles/theme';

interface CartItemProps {
  item: CartItemType;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}) => {
  const modifiersPrice = Array.from(item.selectedModifiers.values())
    .flat()
    .reduce((sum, mod) => sum + mod.price, 0);
  
  const itemPrice = (item.product.price + modifiersPrice) * item.quantity;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.name}>{item.product.name}</Text>
        
        {item.comment && (
          <Text style={styles.comment}>Комментарий: {item.comment}</Text>
        )}
        
        {Array.from(item.selectedModifiers.values()).flat().length > 0 && (
          <View style={styles.modifiers}>
            {Array.from(item.selectedModifiers.values())
              .flat()
              .map((mod, index) => (
                <Text key={index} style={styles.modifier}>
                  + {mod.name} (+{mod.price} ₽)
                </Text>
              ))}
          </View>
        )}
        
        <Text style={styles.price}>{itemPrice} ₽</Text>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onDecrease}
        >
          <Ionicons name="remove" size={20} color={palette.primaryOrange} />
        </TouchableOpacity>
        
        <Text style={styles.quantity}>{item.quantity}</Text>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onIncrease}
        >
          <Ionicons name="add" size={20} color={palette.primaryOrange} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
        >
          <Ionicons name="trash-outline" size={20} color={palette.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: palette.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    ...typography.heading3,
    marginBottom: spacing.xs,
  },
  comment: {
    ...typography.caption,
    color: palette.gray500,
    marginBottom: spacing.xs,
    fontStyle: 'italic',
  },
  modifiers: {
    marginBottom: spacing.xs,
  },
  modifier: {
    ...typography.caption,
    color: palette.gray600,
    marginBottom: 2,
  },
  price: {
    ...typography.heading3,
    color: palette.primaryOrange,
    marginTop: spacing.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: palette.primaryOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    ...typography.heading3,
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
});

