# Быстрый старт - Развертывание приложения

## Шаг 1: Установка зависимостей

### Фронтенд
```bash
cd /Users/sergopelby/Pelby_pr/horeca-diagnosis
npm install
npm install expo-updates
```

### Бэкенд
```bash
cd backend
npm install
```

## Шаг 2: Настройка переменных окружения

### Фронтенд
Создайте файл `.env` в корне проекта:
```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_USE_SERVER_API=true
```

### Бэкенд
Создайте файл `backend/.env`:
```bash
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

## Шаг 3: Запуск бэкенда

```bash
cd backend
npm run dev
```

Бэкенд будет доступен на `http://localhost:3000`

## Шаг 4: Запуск фронтенда

В новом терминале:
```bash
cd /Users/sergopelby/Pelby_pr/horeca-diagnosis
npm start
```

## Шаг 5: Настройка EAS Update (для OTA обновлений)

```bash
# Установите EAS CLI глобально
npm install -g eas-cli

# Войдите в аккаунт Expo
eas login

# Настройте проект
eas build:configure
eas update:configure
```

## Шаг 6: Деплой на сервер

### Бэкенд на Railway

1. Зарегистрируйтесь на [railway.app](https://railway.app)
2. Создайте новый проект
3. Подключите GitHub репозиторий
4. Выберите папку `backend`
5. Добавьте переменные окружения в настройках Railway
6. Railway автоматически задеплоит проект

### Фронтенд на Vercel

1. Зарегистрируйтесь на [vercel.com](https://vercel.com)
2. Подключите GitHub репозиторий
3. В настройках проекта:
   - Build Command: `npm run web:build`
   - Output Directory: `.expo/web-build`
4. Добавьте переменные окружения:
   - `EXPO_PUBLIC_API_URL` - URL вашего бэкенда
   - `EXPO_PUBLIC_USE_SERVER_API=true`
5. Деплой произойдет автоматически

## Шаг 7: Создание обновления приложения

После внесения изменений в код:

```bash
npm run update:app
```

Или вручную:
```bash
eas update --branch production --message "Описание обновления"
```

## Проверка работы

1. Откройте приложение по ссылке (после деплоя на Vercel)
2. Зарегистрируйте нового пользователя
3. Проверьте, что данные сохраняются
4. Войдите с созданными учетными данными
5. Перейдите в Профиль → Обновление приложения
6. Нажмите "Обновить приложение"

## Важные замечания

- Для production измените `JWT_SECRET` на случайную строку
- Настройте CORS на бэкенде для вашего домена
- Для продакшена рекомендуется использовать PostgreSQL вместо файлового хранилища
- Обновления через EAS Update работают только в production сборках

## Следующие шаги

См. подробную инструкцию в `DEPLOYMENT_GUIDE.md`

