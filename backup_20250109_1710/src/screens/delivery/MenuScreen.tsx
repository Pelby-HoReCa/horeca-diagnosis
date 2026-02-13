// Экран каталога меню

import React, { useState, useEffect, useMemo } from 'react';
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
import { ProductCard } from '../../components/delivery/ProductCard';
import { useCart } from '../../context/CartContext';
// import { getIikoMenu, getIikoCategories } from '../../utils/iikoApi'; // Временно отключено
import { IikoProduct, IikoCategory } from '../../types/iiko';
import { palette, spacing, radii, typography } from '../../styles/theme';

export default function MenuScreen({ navigation }: any) {
  const [products, setProducts] = useState<IikoProduct[]>([]);
  const [categories, setCategories] = useState<IikoCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { addToCart } = useCart();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Временно отключено - используем моковые данные
      // const [menuData, categoriesData] = await Promise.all([
      //   getIikoMenu(),
      //   getIikoCategories(),
      // ]);
      
      // Моковые данные для разработки
      const menuData: IikoProduct[] = [
        {
          id: '1',
          name: 'Пельмени классические',
          description: 'Свинина и говядина, тесто',
          price: 350,
          categoryId: 'pelmeni',
          categoryName: 'Пельмени',
          isAvailable: true,
          weight: 500,
        },
        {
          id: '2',
          name: 'Вареники с картошкой',
          description: 'Картофель, лук, тесто',
          price: 280,
          categoryId: 'vareniki',
          categoryName: 'Вареники',
          isAvailable: true,
          weight: 400,
        },
        {
          id: '3',
          name: 'Момо с курицей',
          description: 'Курица, специи, тесто',
          price: 320,
          categoryId: 'momo',
          categoryName: 'Момо',
          isAvailable: true,
          weight: 350,
        },
        {
          id: '4',
          name: 'Вонтоны с креветками',
          description: 'Креветки, имбирь, тесто',
          price: 420,
          categoryId: 'wontons',
          categoryName: 'Вонтоны',
          isAvailable: true,
          weight: 300,
        },
      ];
      
      const categoriesData: IikoCategory[] = [
        { id: 'pelmeni', name: 'Пельмени' },
        { id: 'vareniki', name: 'Вареники' },
        { id: 'momo', name: 'Момо' },
        { id: 'wontons', name: 'Вонтоны' },
      ];
      
      setProducts(menuData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Ошибка загрузки меню:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter(p => p.categoryId === selectedCategory);
  }, [products, selectedCategory]);

  const handleProductPress = (product: IikoProduct) => {
    navigation.navigate('ProductDetail', { product });
  };

  const handleAddToCart = (product: IikoProduct) => {
    addToCart(product, 1);
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
      {/* Категории */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: 'Все' }, ...categories]}
          keyExtractor={(item) => item.id || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item.id || null)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item.id && styles.categoryTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Список товаров */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => handleProductPress(item)}
            onAddToCart={() => handleAddToCart(item)}
          />
        )}
        contentContainerStyle={styles.productsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color={palette.gray400} />
            <Text style={styles.emptyText}>Товары не найдены</Text>
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
  categoriesContainer: {
    backgroundColor: palette.white,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray200,
  },
  categoriesList: {
    paddingHorizontal: spacing.md,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: palette.gray200,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: palette.primaryOrange,
  },
  categoryText: {
    ...typography.body,
    color: palette.gray600,
  },
  categoryTextActive: {
    color: palette.white,
    fontWeight: '600',
  },
  productsList: {
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    ...typography.body,
    color: palette.gray500,
    marginTop: spacing.md,
  },
});

