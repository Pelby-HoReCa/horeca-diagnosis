# Horeca Diagnosis - Приложение самодиагностики бизнеса ХОРЕКА

Приложение для самодиагностики бизнеса в сфере HoReCa, построенное на Expo/React Native.

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
cd backend && npm install
```

### Запуск в режиме разработки

```bash
# Фронтенд
npm start

# Бэкенд (в отдельном терминале)
cd backend
npm run dev
```

## 📱 Развертывание на сервере

Приложение готово к развертыванию на сервере с поддержкой:
- ✅ Серверного API для регистрации и хранения данных
- ✅ OTA обновлений через Expo EAS Update
- ✅ PWA для работы по ссылке в браузере

### Документация по развертыванию

- **[QUICK_START.md](./QUICK_START.md)** - Быстрый старт
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Подробная инструкция
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Чеклист развертывания
- **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** - Резюме изменений

### Основные шаги

1. **Настройте переменные окружения:**
   - Создайте `.env` в корне проекта
   - Создайте `backend/.env`

2. **Настройте EAS Update:**
   ```bash
   npm install -g eas-cli
   eas login
   eas update:configure
   ```

3. **Задеплойте:**
   - Бэкенд: Railway или другой хостинг
   - Фронтенд: Vercel

4. **Создайте обновление:**
   ```bash
   npm run update:app
   ```

## 🏗️ Структура проекта

```
horeca-diagnosis/
├── backend/              # Бэкенд API (Node.js/Express)
├── src/                  # Исходный код приложения
├── app/                  # Expo Router файлы
└── assets/               # Ресурсы (изображения, иконки)
```

## 📚 Дополнительная информация

- [Expo документация](https://docs.expo.dev/)
- [Expo EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [React Navigation](https://reactnavigation.org/)

## 🔧 Разработка

### Доступные команды

```bash
npm start          # Запуск Expo dev server
npm run web        # Запуск веб-версии
npm run web:build  # Сборка для веба
npm run update:app # Создать OTA обновление
```

### Технологии

- **Frontend:** React Native, Expo, TypeScript
- **Backend:** Node.js, Express, TypeScript
- **Navigation:** React Navigation
- **Storage:** AsyncStorage (локально), Server API (production)
- **Updates:** Expo EAS Update
