// Экран оформления заказа

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
// import { createIikoOrder } from '../../utils/iikoApi'; // Временно отключено
import { PaymentMethod, IikoDeliveryAddress } from '../../types/iiko';
import { getUserData } from '../../utils/api';
import { palette, spacing, radii, typography, shadows } from '../../styles/theme';

export default function CheckoutScreen({ navigation }: any) {
  const { cart, getTotalAmount, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [apartment, setApartment] = useState('');
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const user = await getUserData();
    if (user) {
      setDeliveryName(user.fullName || '');
      setDeliveryPhone(user.phone || '');
      if (user.address) {
        // Парсим адрес если он есть
        const addressParts = user.address.split(',');
        if (addressParts.length > 0) setStreet(addressParts[0].trim());
      }
    }
  };

  const validateForm = (): boolean => {
    if (!deliveryName.trim()) {
      Alert.alert('Ошибка', 'Укажите имя');
      return false;
    }
    if (!deliveryPhone.trim()) {
      Alert.alert('Ошибка', 'Укажите телефон');
      return false;
    }
    if (!street.trim()) {
      Alert.alert('Ошибка', 'Укажите улицу');
      return false;
    }
    if (!house.trim()) {
      Alert.alert('Ошибка', 'Укажите дом');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const deliveryAddress: IikoDeliveryAddress = {
        street: street.trim(),
        house: house.trim(),
        apartment: apartment.trim() || undefined,
        entrance: entrance.trim() || undefined,
        floor: floor.trim() || undefined,
        comment: comment.trim() || undefined,
      };

      const orderItems = cart.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        modifiers: Array.from(item.selectedModifiers.values())
          .flat()
          .map(mod => ({
            modifierId: mod.id,
            modifierName: mod.name,
            quantity: 1,
            price: mod.price,
          })),
        comment: item.comment,
      }));

      // Временно отключено - моковый ответ
      // const result = await createIikoOrder({
      //   items: orderItems,
      //   deliveryAddress,
      //   deliveryPhone: deliveryPhone.trim(),
      //   deliveryName: deliveryName.trim(),
      //   comment: comment.trim() || undefined,
      //   paymentMethod,
      // });

      // Моковый успешный ответ
      const mockOrderNumber = `ORD-${Date.now()}`;
      clearCart();
      Alert.alert(
        'Заказ оформлен!',
        `Номер заказа: ${mockOrderNumber}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Переходим к табу заказов
              navigation.getParent()?.navigate('OrdersTab');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Ошибка оформления заказа:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при оформлении заказа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Контактная информация */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Контактная информация</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Имя *"
            placeholderTextColor={palette.gray400}
            value={deliveryName}
            onChangeText={setDeliveryName}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Телефон *"
            placeholderTextColor={palette.gray400}
            value={deliveryPhone}
            onChangeText={setDeliveryPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Адрес доставки */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Адрес доставки</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Улица *"
            placeholderTextColor={palette.gray400}
            value={street}
            onChangeText={setStreet}
          />
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Дом *"
              placeholderTextColor={palette.gray400}
              value={house}
              onChangeText={setHouse}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Квартира"
              placeholderTextColor={palette.gray400}
              value={apartment}
              onChangeText={setApartment}
            />
          </View>
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Подъезд"
              placeholderTextColor={palette.gray400}
              value={entrance}
              onChangeText={setEntrance}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Этаж"
              placeholderTextColor={palette.gray400}
              value={floor}
              onChangeText={setFloor}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Способ оплаты */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Способ оплаты</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === PaymentMethod.CASH && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod(PaymentMethod.CASH)}
          >
            <Ionicons
              name={paymentMethod === PaymentMethod.CASH ? 'radio-button-on' : 'radio-button-off'}
              size={24}
              color={paymentMethod === PaymentMethod.CASH ? palette.primaryOrange : palette.gray400}
            />
            <Text style={styles.paymentOptionText}>Наличными курьеру</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === PaymentMethod.CARD && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod(PaymentMethod.CARD)}
          >
            <Ionicons
              name={paymentMethod === PaymentMethod.CARD ? 'radio-button-on' : 'radio-button-off'}
              size={24}
              color={paymentMethod === PaymentMethod.CARD ? palette.primaryOrange : palette.gray400}
            />
            <Text style={styles.paymentOptionText}>Картой курьеру</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === PaymentMethod.ONLINE && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod(PaymentMethod.ONLINE)}
          >
            <Ionicons
              name={paymentMethod === PaymentMethod.ONLINE ? 'radio-button-on' : 'radio-button-off'}
              size={24}
              color={paymentMethod === PaymentMethod.ONLINE ? palette.primaryOrange : palette.gray400}
            />
            <Text style={styles.paymentOptionText}>Онлайн</Text>
          </TouchableOpacity>
        </View>

        {/* Комментарий */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Комментарий к заказу</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Особые пожелания..."
            placeholderTextColor={palette.gray400}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>

      {/* Нижняя панель */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Итого:</Text>
          <Text style={styles.totalAmount}>{getTotalAmount()} ₽</Text>
        </View>

        <TouchableOpacity
          style={[styles.orderButton, loading && styles.orderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={palette.white} />
          ) : (
            <Text style={styles.orderButtonText}>Оформить заказ</Text>
          )}
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
  section: {
    backgroundColor: palette.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading3,
    marginBottom: spacing.md,
  },
  input: {
    ...typography.body,
    backgroundColor: palette.gray100,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.gray200,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.gray200,
    gap: spacing.sm,
  },
  paymentOptionSelected: {
    borderColor: palette.primaryOrange,
    backgroundColor: palette.gray100,
  },
  paymentOptionText: {
    ...typography.body,
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
  orderButton: {
    backgroundColor: palette.primaryOrange,
    borderRadius: radii.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  orderButtonDisabled: {
    opacity: 0.6,
  },
  orderButtonText: {
    ...typography.heading3,
    color: palette.white,
  },
});

