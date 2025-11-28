// Экран истории заказов

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { getIikoOrderHistory } from '../../utils/iikoApi'; // Временно отключено
import { IikoOrder, OrderStatus } from '../../types/iiko';
// import { getUserData } from '../../utils/api'; // Временно отключено
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

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<IikoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Временно отключено
      // const user = await getUserData();
      // if (user && user.phone) {
      //   const ordersData = await getIikoOrderHistory(user.phone);
      //   setOrders(ordersData);
      // }
      
      // Моковые данные для разработки
      setOrders([]);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const renderOrder = ({ item }: { item: IikoOrder }) => {
    const statusColor = getStatusColor(item.status);
    const statusText = getStatusText(item.status);
    const date = new Date(item.createdAt).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { order: item })}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>Заказ #{item.orderNumber}</Text>
            <Text style={styles.orderDate}>{date}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.orderItems}>
            {item.items.length} {item.items.length === 1 ? 'товар' : 'товаров'}
          </Text>
          <Text style={styles.orderTotal}>{item.totalAmount} ₽</Text>
        </View>

        {item.estimatedDeliveryTime && (
          <View style={styles.deliveryTime}>
            <Ionicons name="time-outline" size={16} color={palette.gray500} />
            <Text style={styles.deliveryTimeText}>
              Доставка: {item.estimatedDeliveryTime}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={palette.primaryOrange} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={palette.gray400} />
            <Text style={styles.emptyText}>У вас пока нет заказов</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Menu')}
            >
              <Text style={styles.browseButtonText}>Перейти к меню</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.background,
  },
  list: {
    padding: spacing.md,
  },
  orderCard: {
    backgroundColor: palette.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  orderNumber: {
    ...typography.heading3,
    marginBottom: spacing.xs,
  },
  orderDate: {
    ...typography.caption,
    color: palette.gray500,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  statusText: {
    ...typography.caption,
    color: palette.white,
    fontWeight: '600',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderItems: {
    ...typography.body,
    color: palette.gray600,
  },
  orderTotal: {
    ...typography.heading3,
    color: palette.primaryOrange,
  },
  deliveryTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  deliveryTimeText: {
    ...typography.caption,
    color: palette.gray500,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
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
});

