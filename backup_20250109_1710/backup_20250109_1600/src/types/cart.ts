// Типы для корзины

import { IikoModifier, IikoProduct } from './iiko';

export interface CartItem {
  product: IikoProduct;
  quantity: number;
  selectedModifiers: Map<string, IikoModifier[]>; // groupId -> modifiers[]
  comment?: string;
}

export interface Cart {
  items: CartItem[];
  totalAmount: number;
  deliveryAddress?: string;
}


