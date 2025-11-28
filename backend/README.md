# Horeca Backend API

Backend API для приложения Horeca Diagnosis.

## Установка

```bash
npm install
```

## Настройка

1. Скопируйте `.env.example` в `.env`
2. Заполните необходимые переменные окружения

## Запуск

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Авторизация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/verify` - Проверка токена

### Пользователи
- `GET /api/users/me` - Получить данные текущего пользователя
- `PUT /api/users/me` - Обновить данные пользователя
- `DELETE /api/users/me` - Удалить аккаунт

### Диагностика
- `POST /api/diagnosis/history` - Сохранить историю диагностики
- `GET /api/diagnosis/history` - Получить историю диагностики
- `GET /api/diagnosis/history/:id` - Получить конкретную диагностику

## Примечания

Текущая реализация использует файловое хранилище для простоты.
Для продакшена рекомендуется заменить на PostgreSQL или MongoDB.

