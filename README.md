# Horeca Diagnosis - Приложение самодиагностики бизнеса ХОРЕКА

Приложение для самодиагностики бизнеса в сфере HoReCa, построенное на Expo/React Native.

## 🚀 Статус проекта

✅ **Приложение развернуто в онлайне:**
- **Фронтенд:** Vercel (PWA)
- **Бэкенд:** Render (Node.js/Express API)
- **Админка:** Vercel (Next.js)

✅ **Функциональность:**
- Регистрация и авторизация пользователей
- Самодиагностика по блокам
- Сохранение данных на сервере
- История диагностик
- План действий с задачами
- OTA обновления приложения
- Админ-панель для управления

## 📱 Быстрый старт

### Локальная разработка

```bash
# Установка зависимостей
npm install
cd backend && npm install

# Запуск фронтенда
npm start

# Запуск бэкенда (в отдельном терминале)
cd backend
npm run dev
```

### Онлайн версия

Приложение доступно по ссылке (после деплоя):
- **Фронтенд:** https://horeca-diagnosis-xxxxx.vercel.app
- **Бэкенд:** https://horeca-backend-6zl1.onrender.com
- **Админка:** https://horeca-admin-xxxxx.vercel.app

## 🔐 Учетные данные

### Админ-панель
- **Логин:** `Sergo1289`
- **Пароль:** `1289`

## 📚 Документация

### Развертывание
- **[QUICK_START.md](./QUICK_START.md)** - Быстрый старт
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Подробная инструкция
- **[DEPLOY_VERCEL_STEP_BY_STEP.md](./DEPLOY_VERCEL_STEP_BY_STEP.md)** - Деплой фронтенда на Vercel
- **[DEPLOY_RENDER.md](./DEPLOY_RENDER.md)** - Деплой бэкенда на Render
- **[ADMIN_QUICK_START.md](./ADMIN_QUICK_START.md)** - Быстрый старт админки

### Техническая документация
- **[DATA_ARCHITECTURE.md](./DATA_ARCHITECTURE.md)** - Архитектура данных
- **[DATA_SAVING_ANALYSIS.md](./DATA_SAVING_ANALYSIS.md)** - Анализ сохранения данных
- **[DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)** - Статус деплоя и процесс обновлений
- **[ADMIN_PLAN.md](./ADMIN_PLAN.md)** - План и структура админки

### Отчеты по задачам
- **[TASK_1_REPORT.md](./TASK_1_REPORT.md)** - Прямой доступ к приложению
- **[TASK_2_REPORT.md](./TASK_2_REPORT.md)** - Кнопка обновления для web
- **[TASK_3_REPORT.md](./TASK_3_REPORT.md)** - Сохранение данных
- **[TASK_4_REPORT.md](./TASK_4_REPORT.md)** - Создание админки

## 🏗️ Структура проекта

```
horeca-diagnosis/
├── admin/                    # Админ-панель (Next.js)
│   ├── app/                 # Next.js App Router
│   ├── lib/                 # API клиент
│   └── package.json
├── backend/                 # Бэкенд API (Node.js/Express)
│   ├── routes/              # API маршруты
│   │   ├── auth.ts          # Авторизация
│   │   ├── users.ts         # Пользователи
│   │   ├── diagnosis.ts     # Диагностика
│   │   └── admin.ts         # Админ API
│   ├── models/              # Модели данных
│   ├── middleware/         # Middleware
│   └── server.ts            # Основной сервер
├── src/                     # Исходный код приложения
│   ├── components/          # React компоненты
│   ├── screens/             # Экраны приложения
│   ├── utils/               # Утилиты (API, хранилище)
│   └── navigation/          # Навигация
├── app.json                 # Конфигурация Expo
├── package.json             # Зависимости фронтенда
└── vercel.json              # Конфигурация Vercel
```

## 🔄 Обновление приложения

### Автоматические обновления

После каждого `git push`:
- **Vercel** автоматически деплоит фронтенд
- **Render** автоматически деплоит бэкенд
- **Vercel** автоматически деплоит админку

### OTA обновления (для мобильных)

1. В приложении нажмите "Обновить приложение" в профиле
2. Приложение загрузит и применит обновления

### Web обновления

1. В приложении нажмите "Обновить приложение" в профиле
2. Страница перезагрузится с последней версией

## 🛠️ Технологии

- **Frontend:** Expo, React Native, TypeScript
- **Backend:** Node.js, Express, TypeScript
- **Admin:** Next.js 14, React, TypeScript, Tailwind CSS
- **Хранилище:** AsyncStorage (локально), API (сервер)
- **Деплой:** Vercel (фронтенд, админка), Render (бэкенд)

## 📋 Переменные окружения

### Фронтенд (.env)
```
EXPO_PUBLIC_API_URL=https://horeca-backend-6zl1.onrender.com
EXPO_PUBLIC_USE_SERVER_API=true
```

### Бэкенд (backend/.env)
```
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://horeca-diagnosis-xxxxx.vercel.app
JWT_SECRET=your-secret-key
ADMIN_EMAIL=Sergo1289
ADMIN_PASSWORD=1289
```

### Админка (admin/.env.local)
```
NEXT_PUBLIC_API_URL=https://horeca-backend-6zl1.onrender.com
```

## 📞 Поддержка

Для вопросов и проблем создайте issue в репозитории.

## 📄 Лицензия

Private project
