// Типы для интеграции с iiko API

export interface IikoProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  categoryName: string;
  isAvailable: boolean;
  modifiers?: IikoModifier[];
  weight?: number;
  energyValue?: number;
  proteins?: number;
  fats?: number;
  carbohydrates?: number;
}

export interface IikoModifier {
  id: string;
  name: string;
  price: number;
  isRequired: boolean;
  groupId: string;
  groupName: string;
}

export interface IikoCategory {
  id: string;
  name: string;
  imageUrl?: string;
  parentId?: string;
}

export interface IikoOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  modifiers?: IikoOrderModifier[];
  comment?: string;
}

export interface IikoOrderModifier {
  modifierId: string;
  modifierName: string;
  quantity: number;
  price: number;
}

export interface IikoOrder {
  id: string;
  orderNumber: string;
  items: IikoOrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  deliveryPhone: string;
  deliveryName: string;
  comment?: string;
  status: OrderStatus;
  createdAt: string;
  estimatedDeliveryTime?: string;
  paymentMethod: PaymentMethod;
}

export enum OrderStatus {
  NEW = 'NEW',
  CONFIRMED = 'CONFIRMED',
  COOKING = 'COOKING',
  READY = 'READY',
  DELIVERING = 'DELIVERING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  ONLINE = 'ONLINE',
}

export interface IikoDeliveryAddress {
  id?: string;
  street: string;
  house: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  comment?: string;
  latitude?: number;
  longitude?: number;
}

export interface IikoApiConfig {
  baseUrl: string;
  login: string;
  password: string;
  organizationId: string;
  terminalGroupId: string;
}

export interface CreateOrderRequest {
  items: IikoOrderItem[];
  deliveryAddress: IikoDeliveryAddress;
  deliveryPhone: string;
  deliveryName: string;
  comment?: string;
  paymentMethod: PaymentMethod;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
}


