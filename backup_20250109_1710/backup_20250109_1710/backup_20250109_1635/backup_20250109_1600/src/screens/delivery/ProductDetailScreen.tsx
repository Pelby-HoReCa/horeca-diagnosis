// Экран деталей товара

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { IikoProduct, IikoModifier } from '../../types/iiko';
import { palette, spacing, radii, typography, shadows } from '../../styles/theme';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { product }: { product: IikoProduct } = route.params;
  const { addToCart } = useCart();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<Map<string, IikoModifier[]>>(new Map());
  const [comment, setComment] = useState('');

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedModifiers, comment);
    navigation.goBack();
  };

  const toggleModifier = (modifier: IikoModifier) => {
    const groupModifiers = selectedModifiers.get(modifier.groupId) || [];
    const isSelected = groupModifiers.some(m => m.id === modifier.id);
    
    const newModifiers = new Map(selectedModifiers);
    
    if (isSelected) {
      newModifiers.set(
        modifier.groupId,
        groupModifiers.filter(m => m.id !== modifier.id)
      );
    } else {
      if (modifier.isRequired && groupModifiers.length === 0) {
        newModifiers.set(modifier.groupId, [modifier]);
      } else {
        newModifiers.set(modifier.groupId, [...groupModifiers, modifier]);
      }
    }
    
    setSelectedModifiers(newModifiers);
  };

  const modifiersPrice = Array.from(selectedModifiers.values())
    .flat()
    .reduce((sum, mod) => sum + mod.price, 0);
  
  const totalPrice = (product.price + modifiersPrice) * quantity;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Изображение */}
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={64} color={palette.gray400} />
          </View>
        )}

        {/* Информация о товаре */}
        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>
          
          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}

          {/* Характеристики */}
          {(product.weight || product.energyValue) && (
            <View style={styles.characteristics}>
              {product.weight && (
                <View style={styles.characteristic}>
                  <Ionicons name="scale-outline" size={20} color={palette.gray500} />
                  <Text style={styles.characteristicText}>{product.weight} г</Text>
                </View>
              )}
              {product.energyValue && (
                <View style={styles.characteristic}>
                  <Ionicons name="flame-outline" size={20} color={palette.gray500} />
                  <Text style={styles.characteristicText}>{product.energyValue} ккал</Text>
                </View>
              )}
            </View>
          )}

          {/* Модификаторы */}
          {product.modifiers && product.modifiers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Дополнения</Text>
              {product.modifiers.map((modifier) => {
                const groupModifiers = selectedModifiers.get(modifier.groupId) || [];
                const isSelected = groupModifiers.some(m => m.id === modifier.id);
                
                return (
                  <TouchableOpacity
                    key={modifier.id}
                    style={[
                      styles.modifierItem,
                      isSelected && styles.modifierItemSelected,
                    ]}
                    onPress={() => toggleModifier(modifier)}
                  >
                    <View style={styles.modifierInfo}>
                      <Text style={styles.modifierName}>{modifier.name}</Text>
                      {modifier.isRequired && (
                        <Text style={styles.required}>Обязательно</Text>
                      )}
                    </View>
                    <View style={styles.modifierRight}>
                      <Text style={styles.modifierPrice}>+{modifier.price} ₽</Text>
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color={palette.white} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Комментарий */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Комментарий к заказу</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Особые пожелания..."
              placeholderTextColor={palette.gray400}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      {/* Нижняя панель */}
      <View style={styles.footer}>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Ionicons name="remove" size={20} color={palette.primaryOrange} />
          </TouchableOpacity>
          <Text style={styles.quantity}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Ionicons name="add" size={20} color={palette.primaryOrange} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddToCart}
          disabled={!product.isAvailable}
        >
          <Text style={styles.addButtonText}>
            В корзину • {totalPrice} ₽
          </Text>
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
  image: {
    width: '100%',
    height: 300,
    backgroundColor: palette.gray200,
  },
  placeholderImage: {
    width: '100%',
    height: 300,
    backgroundColor: palette.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
  },
  name: {
    ...typography.heading1,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: palette.gray600,
    marginBottom: spacing.md,
  },
  characteristics: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  characteristic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  characteristicText: {
    ...typography.body,
    color: palette.gray600,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading3,
    marginBottom: spacing.sm,
  },
  modifierItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: palette.white,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.gray200,
  },
  modifierItemSelected: {
    borderColor: palette.primaryOrange,
    backgroundColor: palette.gray100,
  },
  modifierInfo: {
    flex: 1,
  },
  modifierName: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  required: {
    ...typography.caption,
    color: palette.error,
  },
  modifierRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modifierPrice: {
    ...typography.body,
    color: palette.primaryOrange,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: palette.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: palette.primaryOrange,
    borderColor: palette.primaryOrange,
  },
  commentInput: {
    ...typography.body,
    backgroundColor: palette.white,
    borderRadius: radii.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.gray200,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.gray200,
    gap: spacing.md,
    ...shadows.floating,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.gray100,
    borderRadius: radii.sm,
    padding: spacing.xs,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    ...typography.heading3,
    minWidth: 30,
    textAlign: 'center',
  },
  addButton: {
    flex: 1,
    backgroundColor: palette.primaryOrange,
    borderRadius: radii.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addButtonText: {
    ...typography.heading3,
    color: palette.white,
  },
});


