# Пошаговая инструкция по развертыванию приложения на сервере

## Обзор

Эта инструкция поможет вам:
1. Разместить приложение на сервере для доступа по ссылке
2. Настроить бэкенд API для регистрации и хранения данных
3. Реализовать OTA (Over-The-Air) обновления приложения
4. Добавить кнопку обновления приложения

---

## Часть 1: Подготовка сервера

### Шаг 1.1: Выбор хостинга

**Варианты:**
- **Vercel** (рекомендуется для фронтенда) - бесплатный, простой деплой
- **Netlify** - бесплатный, хорошая поддержка PWA
- **Railway** - бесплатный, поддерживает Node.js бэкенд
- **DigitalOcean** / **AWS** / **VPS** - полный контроль, требует настройки

**Для этого проекта рекомендую:**
- **Frontend (приложение)**: Vercel или Netlify
- **Backend (API)**: Railway или собственный VPS

### Шаг 1.2: Установка необходимых инструментов

```bash
# Установите Node.js (версия 18+)
node --version

# Установите Expo CLI глобально
npm install -g expo-cli eas-cli

# Установите Git (если еще не установлен)
git --version
```

---

## Часть 2: Настройка бэкенд API

### Шаг 2.1: Создание структуры бэкенда

Создайте новую папку для бэкенда:

```bash
mkdir horeca-backend
cd horeca-backend
npm init -y
```

### Шаг 2.2: Установка зависимостей бэкенда

```bash
npm install express cors dotenv bcryptjs jsonwebtoken
npm install --save-dev @types/express @types/cors @types/bcryptjs @types/jsonwebtoken typescript ts-node nodemon
```

### Шаг 2.3: Настройка базы данных

**Вариант A: PostgreSQL (рекомендуется)**
```bash
# Установите PostgreSQL локально или используйте облачный сервис
# Облачные варианты: Supabase (бесплатно), Railway, Heroku
```

**Вариант B: MongoDB (проще для начала)**
```bash
npm install mongoose
# Используйте MongoDB Atlas (бесплатный кластер)
```

**Вариант C: SQLite (для тестирования)**
```bash
npm install sqlite3
```

### Шаг 2.4: Создание файлов бэкенда

См. файлы в папке `backend/`:
- `server.ts` - основной сервер
- `routes/auth.ts` - маршруты авторизации
- `routes/users.ts` - маршруты пользователей
- `routes/diagnosis.ts` - маршруты диагностики
- `models/User.ts` - модель пользователя
- `middleware/auth.ts` - middleware для проверки токенов
- `.env.example` - пример переменных окружения

---

## Часть 3: Настройка Expo EAS Update для OTA обновлений

### Шаг 3.1: Установка EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Шаг 3.2: Инициализация EAS в проекте

```bash
cd horeca-diagnosis
eas build:configure
eas update:configure
```

### Шаг 3.3: Настройка app.json

Добавьте в `app.json`:

```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/YOUR_PROJECT_ID",
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

### Шаг 3.4: Создание первого обновления

```bash
# После изменений в коде
eas update --branch production --message "Обновление приложения"
```

---

## Часть 4: Настройка деплоя фронтенда

### Шаг 4.1: Подготовка к деплою на Vercel

1. Установите Vercel CLI:
```bash
npm install -g vercel
```

2. Создайте файл `vercel.json` в корне проекта:
```json
{
  "buildCommand": "npm run web:build",
  "outputDirectory": ".expo/web-build",
  "devCommand": "npm run web",
  "installCommand": "npm install",
  "framework": null
}
```

3. Добавьте скрипт в `package.json`:
```json
{
  "scripts": {
    "web:build": "expo export:web"
  }
}
```

### Шаг 4.2: Деплой на Vercel

```bash
# Войдите в Vercel
vercel login

# Деплой
vercel --prod
```

### Шаг 4.3: Настройка переменных окружения

В панели Vercel добавьте:
- `EXPO_PUBLIC_API_URL` - URL вашего бэкенд API
- `EXPO_PUBLIC_UPDATE_URL` - URL для EAS Updates

---

## Часть 5: Деплой бэкенда

### Шаг 5.1: Деплой на Railway

1. Зарегистрируйтесь на [railway.app](https://railway.app)
2. Создайте новый проект
3. Подключите GitHub репозиторий
4. Railway автоматически определит Node.js проект

### Шаг 5.2: Настройка переменных окружения

В Railway добавьте:
- `DATABASE_URL` - строка подключения к БД
- `JWT_SECRET` - секретный ключ для JWT токенов
- `PORT` - порт (Railway установит автоматически)
- `CORS_ORIGIN` - URL вашего фронтенда

### Шаг 5.3: Настройка базы данных

1. В Railway создайте PostgreSQL сервис
2. Скопируйте `DATABASE_URL` из настроек
3. Запустите миграции (см. `backend/migrations/`)

---

## Часть 6: Интеграция фронтенда с бэкендом

### Шаг 6.1: Обновление API функций

Обновите `src/utils/api.ts` для работы с реальным API:
- Замените локальные вызовы на `fetch` запросы
- Добавьте обработку ошибок
- Настройте токены авторизации

### Шаг 6.2: Настройка переменных окружения

Создайте `.env` файл:
```
EXPO_PUBLIC_API_URL=https://your-api.railway.app
EXPO_PUBLIC_UPDATE_URL=https://u.expo.dev/YOUR_PROJECT_ID
```

---

## Часть 7: Добавление кнопки обновления

Кнопка "Обновить приложение" будет добавлена в:
- `src/components/UpdateButton.tsx` - компонент кнопки
- Интеграция в `ProfileScreen.tsx` или отдельный экран настроек

### Функционал кнопки:
1. Проверяет наличие обновлений через EAS Update API
2. Загружает и применяет обновление
3. Показывает прогресс загрузки
4. Перезагружает приложение после обновления

---

## Часть 8: Настройка PWA для работы по ссылке

### Шаг 8.1: Обновление app.json

```json
{
  "expo": {
    "web": {
      "output": "static",
      "bundler": "metro",
      "favicon": "./assets/images/favicon.png",
      "name": "Horeca Diagnosis",
      "shortName": "Horeca",
      "lang": "ru",
      "scope": "/",
      "themeColor": "#007AFF",
      "backgroundColor": "#ffffff",
      "display": "standalone",
      "orientation": "portrait",
      "startUrl": "/",
      "splash": {
        "image": "./assets/images/splash-icon.png",
        "resizeMode": "contain",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

### Шаг 8.2: Создание manifest.json

Expo автоматически создаст `manifest.json` при сборке для web.

### Шаг 8.3: Тестирование PWA

1. Соберите приложение: `expo export:web`
2. Откройте в браузере
3. В Chrome DevTools > Application > Manifest проверьте настройки
4. Протестируйте установку как PWA

---

## Часть 9: Автоматизация деплоя

### Шаг 9.1: GitHub Actions для автоматического деплоя

Создайте `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run web:build
      - run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd backend && npm install
      # Railway автоматически деплоит при push
```

### Шаг 9.2: Скрипт для обновления приложения

Создайте `scripts/update-app.sh`:

```bash
#!/bin/bash
# Обновление приложения через EAS Update

echo "Создание обновления..."
eas update --branch production --message "Обновление от $(date)"

echo "Обновление создано!"
```

---

## Часть 10: Проверка и тестирование

### Шаг 10.1: Проверка регистрации

1. Откройте приложение по ссылке
2. Зарегистрируйте нового пользователя
3. Проверьте, что данные сохранились в БД

### Шаг 10.2: Проверка обновлений

1. Внесите изменения в код
2. Нажмите кнопку "Обновить приложение" в админ-панели
3. Запустите `eas update --branch production`
4. Перезагрузите приложение - изменения должны появиться

### Шаг 10.3: Проверка работы по ссылке

1. Откройте приложение в браузере
2. Проверьте, что оно работает как PWA
3. Установите на домашний экран (если возможно)
4. Проверьте оффлайн режим

---

## Часть 11: Безопасность

### Шаг 11.1: Настройка CORS

В бэкенде настройте CORS только для вашего домена:
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://your-app.vercel.app',
  credentials: true
}));
```

### Шаг 11.2: Хеширование паролей

Используйте `bcryptjs` для хеширования паролей:
```typescript
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash(password, 10);
```

### Шаг 11.3: Валидация данных

Добавьте валидацию на бэкенде (например, `joi` или `zod`):
```bash
npm install joi
```

---

## Часть 12: Мониторинг и логирование

### Шаг 12.1: Настройка логов

Используйте `winston` или `pino` для логирования:
```bash
npm install winston
```

### Шаг 12.2: Мониторинг ошибок

Настройте Sentry для отслеживания ошибок:
```bash
npm install @sentry/react-native
```

---

## Часто задаваемые вопросы

### Q: Как часто можно обновлять приложение?
A: EAS Update позволяет обновлять приложение неограниченное количество раз. Обновления применяются при следующем запуске приложения.

### Q: Нужно ли пересобирать приложение после изменений?
A: Нет, если изменения только в JavaScript коде. Нативные изменения требуют пересборки.

### Q: Как откатить обновление?
A: Используйте `eas update:rollback --branch production`

### Q: Можно ли использовать свой сервер для обновлений?
A: Да, но это сложнее. EAS Update - самый простой вариант.

---

## Полезные ссылки

- [Expo EAS Update документация](https://docs.expo.dev/eas-update/introduction/)
- [Vercel документация](https://vercel.com/docs)
- [Railway документация](https://docs.railway.app)
- [Expo Web документация](https://docs.expo.dev/workflow/web/)

---

## Поддержка

При возникновении проблем:
1. Проверьте логи в консоли браузера/терминала
2. Проверьте логи на сервере (Railway/Vercel)
3. Убедитесь, что все переменные окружения настроены
4. Проверьте подключение к базе данных

