# 🚀 Пошаговый деплой фронтенда на Vercel

## Шаг 1: Регистрация на Vercel

1. Откройте https://vercel.com
2. Нажмите **"Sign Up"** (если еще не зарегистрированы)
3. Войдите через **GitHub** (важно!)
4. Подтвердите доступ к репозиториям

## Шаг 2: Создание проекта

1. В Dashboard нажмите **"Add New Project"**
2. Найдите репозиторий `Pelby-HoReCa/horeca-diagnosis`
3. Нажмите **"Import"**

## Шаг 3: Настройка проекта

Заполните форму:

### Основные настройки:
- **Project Name:** `horeca-diagnosis` (или любое другое)
- **Framework Preset:** **Other** (или оставьте пустым)
- **Root Directory:** `./` (оставьте пустым)

### Build Settings:
- **Build Command:** `npm run web:build`
- **Output Directory:** `dist` ✅ (проверено - экспорт создает папку dist)
- **Install Command:** `npm install` (по умолчанию)

## Шаг 4: Переменные окружения

Прокрутите вниз до **"Environment Variables"** и добавьте:

**Переменная 1:**
- **Key:** `EXPO_PUBLIC_API_URL`
- **Value:** `https://horeca-backend-6zl1.onrender.com`

**Переменная 2:**
- **Key:** `EXPO_PUBLIC_USE_SERVER_API`
- **Value:** `true`

## Шаг 5: Деплой

1. Прокрутите вниз
2. Нажмите **"Deploy"**
3. Дождитесь завершения (обычно 2-3 минуты)

## Шаг 6: Получение URL

После успешного деплоя:
1. Vercel автоматически создаст URL вида: `https://horeca-diagnosis.vercel.app`
2. Скопируйте этот URL
3. Он понадобится для обновления CORS в Render

## Шаг 7: Обновление CORS в Render

1. Откройте Render Dashboard
2. Перейдите в ваш сервис `horeca-backend`
3. Откройте **Environment Variables**
4. Найдите `CORS_ORIGIN`
5. Измените значение на URL вашего Vercel приложения:
   ```
   https://your-app.vercel.app
   ```
6. Сохраните изменения
7. Render автоматически перезапустит сервис

## Шаг 8: Проверка работы

1. Откройте URL вашего Vercel приложения
2. Попробуйте зарегистрироваться
3. Проверьте авторизацию
4. Проверьте работу диагностики

## Готово! 🎉

Ваше приложение теперь доступно по ссылке!

