// Экран деталей заказа

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IikoOrder, OrderStatus } from '../../types/iiko';
// import { getIikoOrderStatus } from '../../utils/iikoApi'; // Временно отключено
import { palette, spacing, radii, typography, shadows } from '../../styles/theme';

const getStatusText = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.NEW:
      return 'Новый';
    case OrderStatus.CONFIRMED:
      return 'Подтвержден';
    case OrderStatus.COOKING:
      return 'Готовится';
    case OrderStatus.READY:
      return 'Готов';
    case OrderStatus.DELIVERING:
      return 'Доставляется';
    case OrderStatus.DELIVERED:
      return 'Доставлен';
    case OrderStatus.CANCELLED:
      return 'Отменен';
    default:
      return status;
  }
};

const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.NEW:
    case OrderStatus.CONFIRMED:
      return palette.primaryOrange;
    case OrderStatus.COOKING:
    case OrderStatus.READY:
      return palette.warning;
    case OrderStatus.DELIVERING:
      return palette.accentPink;
    case OrderStatus.DELIVERED:
      return palette.success;
    case OrderStatus.CANCELLED:
      return palette.error;
    default:
      return palette.gray500;
  }
};

export default function OrderDetailScreen({ route }: any) {
  const { order }: { order: IikoOrder } = route.params;
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Временно отключено - обновление статуса
    // const interval = setInterval(async () => {
    //   try {
    //     const status = await getIikoOrderStatus(order.id);
    //     if (status) {
    //       setCurrentStatus(status);
    //     }
    //   } catch (error) {
    //     console.error('Ошибка обновления статуса:', error);
    //   }
    // }, 30000); // Каждые 30 секунд

    // return () => clearInterval(interval);
  }, [order.id]);

  const statusColor = getStatusColor(currentStatus);
  const statusText = getStatusText(currentStatus);
  const date = new Date(order.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Заголовок */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>Заказ #{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>

      {/* Статус */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Статус заказа</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusLabel}>{statusText}</Text>
        </View>
        {order.estimatedDeliveryTime && (
          <View style={styles.deliveryTime}>
            <Ionicons name="time-outline" size={20} color={palette.gray500} />
            <Text style={styles.deliveryTimeText}>
              Ориентировочное время доставки: {order.estimatedDeliveryTime}
            </Text>
          </View>
        )}
      </View>

      {/* Товары */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Состав заказа</Text>
        {order.items.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <View style={styles.orderItemHeader}>
              <Text style={styles.orderItemName}>{item.productName}</Text>
              <Text style={styles.orderItemPrice}>
                {item.price * item.quantity} ₽
              </Text>
            </View>
            <Text style={styles.orderItemQuantity}>
              {item.quantity} шт. × {item.price} ₽
            </Text>
            {item.modifiers && item.modifiers.length > 0 && (
              <View style={styles.modifiers}>
                {item.modifiers.map((mod, modIndex) => (
                  <Text key={modIndex} style={styles.modifier}>
                    + {mod.modifierName} (+{mod.price} ₽)
                  </Text>
                ))}
              </View>
            )}
            {item.comment && (
              <Text style={styles.itemComment}>Комментарий: {item.comment}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Адрес доставки */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Адрес доставки</Text>
        <View style={styles.addressContainer}>
          <Ionicons name="location-outline" size={20} color={palette.primaryOrange} />
          <Text style={styles.addressText}>{order.deliveryAddress}</Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Получатель:</Text>
          <Text style={styles.contactValue}>{order.deliveryName}</Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Телефон:</Text>
          <Text style={styles.contactValue}>{order.deliveryPhone}</Text>
        </View>
      </View>

      {/* Способ оплаты */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Способ оплаты</Text>
        <Text style={styles.paymentMethod}>
          {order.paymentMethod === 'CASH' && 'Наличными курьеру'}
          {order.paymentMethod === 'CARD' && 'Картой курьеру'}
          {order.paymentMethod === 'ONLINE' && 'Онлайн'}
        </Text>
      </View>

      {/* Комментарий */}
      {order.comment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Комментарий</Text>
          <Text style={styles.comment}>{order.comment}</Text>
        </View>
      )}

      {/* Итого */}
      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Итого:</Text>
        <Text style={styles.totalAmount}>{order.totalAmount} ₽</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: palette.white,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray200,
  },
  orderNumber: {
    ...typography.heading1,
    marginBottom: spacing.xs,
  },
  orderDate: {
    ...typography.body,
    color: palette.gray500,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  statusText: {
    ...typography.body,
    color: palette.white,
    fontWeight: '600',
  },
  section: {
    backgroundColor: palette.white,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading3,
    marginBottom: spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  deliveryTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  deliveryTimeText: {
    ...typography.body,
    color: palette.gray600,
  },
  orderItem: {
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray200,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  orderItemName: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  orderItemPrice: {
    ...typography.heading3,
    color: palette.primaryOrange,
  },
  orderItemQuantity: {
    ...typography.caption,
    color: palette.gray500,
    marginBottom: spacing.xs,
  },
  modifiers: {
    marginTop: spacing.xs,
  },
  modifier: {
    ...typography.caption,
    color: palette.gray600,
    marginBottom: 2,
  },
  itemComment: {
    ...typography.caption,
    color: palette.gray500,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  addressText: {
    ...typography.body,
    flex: 1,
  },
  contactInfo: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  contactLabel: {
    ...typography.body,
    color: palette.gray600,
    marginRight: spacing.xs,
  },
  contactValue: {
    ...typography.body,
    fontWeight: '600',
  },
  paymentMethod: {
    ...typography.body,
  },
  comment: {
    ...typography.body,
    color: palette.gray600,
    fontStyle: 'italic',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: palette.white,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  totalLabel: {
    ...typography.heading2,
  },
  totalAmount: {
    ...typography.heading1,
    color: palette.primaryOrange,
  },
});

