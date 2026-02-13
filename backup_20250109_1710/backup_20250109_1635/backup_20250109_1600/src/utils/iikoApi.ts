// Утилиты для работы с iiko API

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    CreateOrderRequest,
    CreateOrderResponse,
    IikoApiConfig,
    IikoCategory,
    IikoOrder,
    IikoProduct,
    OrderStatus,
} from '../types/iiko';

const IIKO_CONFIG_KEY = 'iiko_config';

// Получение конфигурации iiko из хранилища
export const getIikoConfig = async (): Promise<IikoApiConfig | null> => {
  try {
    const configStr = await AsyncStorage.getItem(IIKO_CONFIG_KEY);
    if (!configStr) return null;
    return JSON.parse(configStr);
  } catch (error) {
    console.error('Ошибка получения конфигурации iiko:', error);
    return null;
  }
};

// Сохранение конфигурации iiko
export const saveIikoConfig = async (config: IikoApiConfig): Promise<void> => {
  try {
    await AsyncStorage.setItem(IIKO_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Ошибка сохранения конфигурации iiko:', error);
    throw error;
  }
};

// Получение токена авторизации iiko
const getIikoToken = async (config: IikoApiConfig): Promise<string | null> => {
  try {
    // iiko API требует авторизацию через /api/0/auth
    const response = await fetch(`${config.baseUrl}/api/0/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: config.login,
        password: config.password,
      }),
    });

    if (!response.ok) {
      throw new Error('Ошибка авторизации в iiko');
    }

    const data = await response.json();
    return data.token || null;
  } catch (error) {
    console.error('Ошибка получения токена iiko:', error);
    return null;
  }
};

// Получение меню из iiko
export const getIikoMenu = async (): Promise<IikoProduct[]> => {
  try {
    const config = await getIikoConfig();
    if (!config) {
      throw new Error('Конфигурация iiko не найдена');
    }

    const token = await getIikoToken(config);
    if (!token) {
      throw new Error('Не удалось получить токен авторизации');
    }

    // Получаем меню через iiko API
    // В реальной интеграции используйте правильные эндпоинты iiko
    const response = await fetch(
      `${config.baseUrl}/api/0/nomenclature?organizationId=${config.organizationId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Ошибка получения меню');
    }

    const data = await response.json();
    
    // Преобразуем данные iiko в наш формат
    // Структура ответа зависит от версии API iiko
    return transformIikoMenuToProducts(data);
  } catch (error) {
    console.error('Ошибка получения меню iiko:', error);
    // Возвращаем тестовые данные для разработки
    return getMockMenu();
  }
};

// Получение категорий меню
export const getIikoCategories = async (): Promise<IikoCategory[]> => {
  try {
    const config = await getIikoConfig();
    if (!config) {
      throw new Error('Конфигурация iiko не найдена');
    }

    const token = await getIikoToken(config);
    if (!token) {
      throw new Error('Не удалось получить токен авторизации');
    }

    const response = await fetch(
      `${config.baseUrl}/api/0/nomenclature?organizationId=${config.organizationId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Ошибка получения категорий');
    }

    const data = await response.json();
    return transformIikoCategories(data);
  } catch (error) {
    console.error('Ошибка получения категорий iiko:', error);
    return getMockCategories();
  }
};

// Создание заказа в iiko
export const createIikoOrder = async (
  orderRequest: CreateOrderRequest
): Promise<CreateOrderResponse> => {
  try {
    const config = await getIikoConfig();
    if (!config) {
      return {
        success: false,
        error: 'Конфигурация iiko не найдена',
      };
    }

    const token = await getIikoToken(config);
    if (!token) {
      return {
        success: false,
        error: 'Не удалось получить токен авторизации',
      };
    }

    // Создаем заказ через iiko API
    const response = await fetch(
      `${config.baseUrl}/api/0/orders/create?organizationId=${config.organizationId}&terminalGroupId=${config.terminalGroupId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: orderRequest.items,
          deliveryAddress: orderRequest.deliveryAddress,
          deliveryPhone: orderRequest.deliveryPhone,
          deliveryName: orderRequest.deliveryName,
          comment: orderRequest.comment,
          paymentMethod: orderRequest.paymentMethod,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Ошибка создания заказа',
      };
    }

    const data = await response.json();
    return {
      success: true,
      orderId: data.id,
      orderNumber: data.orderNumber,
    };
  } catch (error) {
    console.error('Ошибка создания заказа iiko:', error);
    return {
      success: false,
      error: 'Ошибка подключения к серверу',
    };
  }
};

// Получение статуса заказа
export const getIikoOrderStatus = async (orderId: string): Promise<OrderStatus | null> => {
  try {
    const config = await getIikoConfig();
    if (!config) {
      return null;
    }

    const token = await getIikoToken(config);
    if (!token) {
      return null;
    }

    const response = await fetch(
      `${config.baseUrl}/api/0/orders/${orderId}/status?organizationId=${config.organizationId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.status as OrderStatus;
  } catch (error) {
    console.error('Ошибка получения статуса заказа:', error);
    return null;
  }
};

// Получение истории заказов пользователя
export const getIikoOrderHistory = async (phone: string): Promise<IikoOrder[]> => {
  try {
    const config = await getIikoConfig();
    if (!config) {
      return [];
    }

    const token = await getIikoToken(config);
    if (!token) {
      return [];
    }

    const response = await fetch(
      `${config.baseUrl}/api/0/orders/history?organizationId=${config.organizationId}&phone=${phone}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return transformIikoOrders(data);
  } catch (error) {
    console.error('Ошибка получения истории заказов:', error);
    return [];
  }
};

// Вспомогательные функции для преобразования данных

function transformIikoMenuToProducts(data: any): IikoProduct[] {
  // Преобразование зависит от структуры ответа iiko API
  // Это примерная реализация
  if (!data.items || !Array.isArray(data.items)) {
    return [];
  }

  return data.items.map((item: any) => ({
    id: item.id || item.productId,
    name: item.name,
    description: item.description,
    price: item.price || 0,
    imageUrl: item.imageUrl,
    categoryId: item.categoryId || '',
    categoryName: item.categoryName || '',
    isAvailable: item.isAvailable !== false,
    modifiers: item.modifiers || [],
    weight: item.weight,
    energyValue: item.energyValue,
    proteins: item.proteins,
    fats: item.fats,
    carbohydrates: item.carbohydrates,
  }));
}

function transformIikoCategories(data: any): IikoCategory[] {
  if (!data.categories || !Array.isArray(data.categories)) {
    return [];
  }

  return data.categories.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    imageUrl: cat.imageUrl,
    parentId: cat.parentId,
  }));
}

function transformIikoOrders(data: any): IikoOrder[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((order: any) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    items: order.items || [],
    totalAmount: order.totalAmount || 0,
    deliveryAddress: order.deliveryAddress || '',
    deliveryPhone: order.deliveryPhone || '',
    deliveryName: order.deliveryName || '',
    comment: order.comment,
    status: order.status || OrderStatus.NEW,
    createdAt: order.createdAt || new Date().toISOString(),
    estimatedDeliveryTime: order.estimatedDeliveryTime,
    paymentMethod: order.paymentMethod,
  }));
}

// Моковые данные для разработки
function getMockMenu(): IikoProduct[] {
  return [
    {
      id: '1',
      name: 'Пицца Маргарита',
      description: 'Томаты, моцарелла, базилик',
      price: 450,
      imageUrl: undefined,
      categoryId: 'pizza',
      categoryName: 'Пицца',
      isAvailable: true,
      weight: 500,
      energyValue: 1200,
    },
    {
      id: '2',
      name: 'Пицца Пепперони',
      description: 'Пепперони, моцарелла, томатный соус',
      price: 550,
      imageUrl: undefined,
      categoryId: 'pizza',
      categoryName: 'Пицца',
      isAvailable: true,
      weight: 600,
      energyValue: 1500,
    },
    {
      id: '3',
      name: 'Бургер Классический',
      description: 'Говядина, салат, помидор, лук, соус',
      price: 350,
      imageUrl: undefined,
      categoryId: 'burgers',
      categoryName: 'Бургеры',
      isAvailable: true,
      weight: 300,
      energyValue: 800,
    },
    {
      id: '4',
      name: 'Цезарь с курицей',
      description: 'Курица, салат, пармезан, соус цезарь',
      price: 320,
      imageUrl: undefined,
      categoryId: 'salads',
      categoryName: 'Салаты',
      isAvailable: true,
      weight: 250,
      energyValue: 400,
    },
    {
      id: '5',
      name: 'Кола',
      description: 'Газированный напиток 0.5л',
      price: 120,
      imageUrl: undefined,
      categoryId: 'drinks',
      categoryName: 'Напитки',
      isAvailable: true,
      weight: 500,
    },
  ];
}

function getMockCategories(): IikoCategory[] {
  return [
    { id: 'pizza', name: 'Пицца' },
    { id: 'burgers', name: 'Бургеры' },
    { id: 'salads', name: 'Салаты' },
    { id: 'drinks', name: 'Напитки' },
  ];
}


