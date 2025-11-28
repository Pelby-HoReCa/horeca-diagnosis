// Компонент карточки товара

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IikoProduct } from '../../types/iiko';
import { palette, spacing, radii, shadows, typography } from '../../styles/theme';

interface ProductCardProps {
  product: IikoProduct;
  onPress: () => void;
  onAddToCart?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, !product.isAvailable && styles.disabledCard]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!product.isAvailable}
    >
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.placeholderImage}>
          <Ionicons name="image-outline" size={40} color={palette.gray400} />
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        
        {product.description && (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.price}>{product.price} ₽</Text>
          
          {product.isAvailable && onAddToCart && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
            >
              <Ionicons name="add" size={20} color={palette.white} />
            </TouchableOpacity>
          )}
          
          {!product.isAvailable && (
            <Text style={styles.unavailable}>Нет в наличии</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  disabledCard: {
    opacity: 0.6,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: palette.gray200,
  },
  placeholderImage: {
    width: '100%',
    height: 180,
    backgroundColor: palette.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
  },
  name: {
    ...typography.heading3,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.caption,
    color: palette.gray500,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    ...typography.heading3,
    color: palette.primaryOrange,
  },
  addButton: {
    backgroundColor: palette.primaryOrange,
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailable: {
    ...typography.caption,
    color: palette.error,
  },
});


