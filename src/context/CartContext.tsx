// Контекст для управления корзиной

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Cart } from '../types/cart';
import { IikoModifier, IikoProduct } from '../types/iiko';

interface CartContextType {
  cart: Cart;
  addToCart: (product: IikoProduct, quantity?: number, modifiers?: Map<string, IikoModifier[]>, comment?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'delivery_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart>({
    items: [],
    totalAmount: 0,
  });

  // Загрузка корзины из хранилища при монтировании
  useEffect(() => {
    loadCartFromStorage();
  }, []);

  // Сохранение корзины в хранилище при изменении
  useEffect(() => {
    saveCartToStorage();
    updateTotalAmount();
  }, [cart.items]);

  const loadCartFromStorage = async () => {
    try {
      const cartStr = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (cartStr) {
        const savedCart = JSON.parse(cartStr);
        // Восстанавливаем Map для modifiers
        const restoredCart: Cart = {
          ...savedCart,
          items: savedCart.items.map((item: any) => ({
            ...item,
            selectedModifiers: new Map(Object.entries(item.selectedModifiers || {})),
          })),
        };
        setCart(restoredCart);
      }
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error);
    }
  };

  const saveCartToStorage = async () => {
    try {
      // Преобразуем Map в объект для сохранения
      const cartToSave = {
        ...cart,
        items: cart.items.map(item => ({
          ...item,
          selectedModifiers: Object.fromEntries(item.selectedModifiers),
        })),
      };
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartToSave));
    } catch (error) {
      console.error('Ошибка сохранения корзины:', error);
    }
  };

  const updateTotalAmount = () => {
    const total = cart.items.reduce((sum, item) => {
      const productPrice = item.product.price;
      const modifiersPrice = Array.from(item.selectedModifiers.values())
        .flat()
        .reduce((modSum, mod) => modSum + mod.price, 0);
      return sum + (productPrice + modifiersPrice) * item.quantity;
    }, 0);

    setCart(prev => ({ ...prev, totalAmount: total }));
  };

  const addToCart = useCallback((
    product: IikoProduct,
    quantity: number = 1,
    modifiers: Map<string, IikoModifier[]> = new Map(),
    comment?: string
  ) => {
    setCart(prev => {
      const existingItemIndex = prev.items.findIndex(
        item => item.product.id === product.id
      );

      if (existingItemIndex >= 0) {
        // Обновляем существующий товар
        const updatedItems = [...prev.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
          selectedModifiers: modifiers,
          comment: comment || updatedItems[existingItemIndex].comment,
        };
        return { ...prev, items: updatedItems };
      } else {
        // Добавляем новый товар
        return {
          ...prev,
          items: [
            ...prev.items,
            {
              product,
              quantity,
              selectedModifiers: modifiers,
              comment,
            },
          ],
        };
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.filter(item => item.product.id !== productId),
    }));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    }));
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart({
      items: [],
      totalAmount: 0,
    });
    AsyncStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const getTotalAmount = useCallback(() => {
    return cart.items.reduce((sum, item) => {
      const productPrice = item.product.price;
      const modifiersPrice = Array.from(item.selectedModifiers.values())
        .flat()
        .reduce((modSum, mod) => modSum + mod.price, 0);
      return sum + (productPrice + modifiersPrice) * item.quantity;
    }, 0);
  }, [cart.items]);

  const getItemCount = useCallback(() => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart.items]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalAmount,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};


