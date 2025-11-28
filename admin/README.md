# Horeca Diagnosis - Админ-панель

Админ-панель для управления пользователями и диагностиками приложения Horeca Diagnosis.

## Установка

```bash
cd admin
npm install
```

## Настройка

Создайте файл `.env.local`:

```
NEXT_PUBLIC_API_URL=https://horeca-backend-6zl1.onrender.com
```

## Запуск

### Development

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

### Production

```bash
npm run build
npm start
```

## Деплой на Vercel

1. Подключите репозиторий к Vercel
2. Укажите корневую папку: `admin`
3. Build Command: `npm run build`
4. Output Directory: `.next`
5. Добавьте переменную окружения:
   - `NEXT_PUBLIC_API_URL` = `https://horeca-backend-6zl1.onrender.com`

## Авторизация

По умолчанию:
- Email: `admin@horeca-diagnosis.com` (или значение из `ADMIN_EMAIL`)
- Пароль: `admin123` (или значение из `ADMIN_PASSWORD`)

**Важно:** В продакшене измените эти значения в переменных окружения бэкенда!

## Функциональность

- ✅ Авторизация админа
- ✅ Статистика (пользователи, диагностики, эффективность)
- ✅ Список всех пользователей
- ✅ Список всех диагностик
- ✅ Детальная информация о пользователе
- ✅ Детальная информация о диагностике

