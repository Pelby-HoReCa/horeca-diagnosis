# Настройка интеграции с iiko

## Описание

Приложение доставки интегрировано с системой автоматизации ресторанного бизнеса iiko. Для работы приложения необходимо настроить подключение к iiko API.

## Требования

1. Аккаунт в системе iiko
2. Доступ к iiko API
3. Данные для авторизации:
   - URL сервера iiko
   - Логин
   - Пароль
   - ID организации
   - ID группы терминалов

## Настройка

### 1. Получение данных для подключения

Обратитесь к администратору iiko для получения:
- URL API сервера (например: `https://iiko.biz:9900`)
- Логин и пароль для API
- ID организации (organizationId)
- ID группы терминалов (terminalGroupId)

### 2. Настройка в приложении

В текущей версии приложения конфигурация iiko сохраняется локально через AsyncStorage. Для настройки создайте экран настроек или используйте консоль разработчика.

Пример настройки через код:

```typescript
import { saveIikoConfig } from './src/utils/iikoApi';

await saveIikoConfig({
  baseUrl: 'https://iiko.biz:9900',
  login: 'your_login',
  password: 'your_password',
  organizationId: 'your_organization_id',
  terminalGroupId: 'your_terminal_group_id',
});
```

### 3. API эндпоинты iiko

Приложение использует следующие эндпоинты iiko API:

- **Авторизация**: `POST /api/0/auth`
- **Получение меню**: `GET /api/0/nomenclature?organizationId={id}`
- **Создание заказа**: `POST /api/0/orders/create?organizationId={id}&terminalGroupId={id}`
- **Статус заказа**: `GET /api/0/orders/{orderId}/status?organizationId={id}`
- **История заказов**: `GET /api/0/orders/history?organizationId={id}&phone={phone}`

**Важно**: Структура API может отличаться в зависимости от версии iiko. Проверьте документацию вашей версии iiko API.

## Тестовые данные

Для разработки и тестирования приложение использует моковые данные, если подключение к iiko недоступно. Это позволяет разрабатывать и тестировать приложение без реального подключения к iiko.

## Структура данных

### Товар (IikoProduct)
```typescript
{
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  categoryName: string;
  isAvailable: boolean;
  modifiers?: IikoModifier[];
}
```

### Заказ (IikoOrder)
```typescript
{
  id: string;
  orderNumber: string;
  items: IikoOrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  deliveryPhone: string;
  deliveryName: string;
  status: OrderStatus;
  createdAt: string;
  paymentMethod: PaymentMethod;
}
```

## Статусы заказа

- `NEW` - Новый заказ
- `CONFIRMED` - Подтвержден
- `COOKING` - Готовится
- `READY` - Готов
- `DELIVERING` - Доставляется
- `DELIVERED` - Доставлен
- `CANCELLED` - Отменен

## Способы оплаты

- `CASH` - Наличными курьеру
- `CARD` - Картой курьеру
- `ONLINE` - Онлайн оплата

## Устранение неполадок

### Ошибка авторизации
- Проверьте правильность логина и пароля
- Убедитесь, что URL сервера указан верно
- Проверьте доступность сервера iiko

### Ошибка получения меню
- Проверьте правильность organizationId
- Убедитесь, что у пользователя есть права на получение меню
- Проверьте формат ответа API (может отличаться в зависимости от версии)

### Ошибка создания заказа
- Проверьте правильность terminalGroupId
- Убедитесь, что все обязательные поля заполнены
- Проверьте формат данных заказа

## Дополнительная информация

Для получения актуальной документации по iiko API обратитесь к официальной документации iiko или к администратору системы.


