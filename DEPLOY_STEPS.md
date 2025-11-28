# 🚀 Пошаговая инструкция деплоя на Vercel

## Шаг 1: Создайте репозиторий на GitHub

1. Откройте https://github.com/new
2. Название: `horeca-diagnosis`
3. Выберите "Private" или "Public"
4. НЕ добавляйте README, .gitignore или лицензию (они уже есть)
5. Нажмите "Create repository"

## Шаг 2: Подключите локальный репозиторий к GitHub

Выполните команды (замените YOUR_USERNAME на ваш GitHub username):

```bash
cd /Users/sergopelby/Pelby_pr/horeca-diagnosis

git remote add origin https://github.com/YOUR_USERNAME/horeca-diagnosis.git
git branch -M main
git push -u origin main
```

## Шаг 3: Деплой на Vercel

1. **Откройте [vercel.com](https://vercel.com)**
   - Войдите через GitHub (если еще не зарегистрированы)

2. **Нажмите "Add New Project"**

3. **Импортируйте репозиторий:**
   - Выберите `horeca-diagnosis` из списка
   - Или найдите через поиск

4. **Настройте проект:**
   - **Framework Preset:** Other
   - **Root Directory:** `./` (оставьте пустым)
   - **Build Command:** `npm run web:build`
   - **Output Directory:** `.expo/web-build`
   - **Install Command:** `npm install` (по умолчанию)

5. **Добавьте переменные окружения:**
   Нажмите "Environment Variables" и добавьте:
   - **Key:** `EXPO_PUBLIC_API_URL`
   - **Value:** `http://localhost:3000` (пока, потом замените на URL бэкенда)
   - **Key:** `EXPO_PUBLIC_USE_SERVER_API`
   - **Value:** `false` (пока используем локальное хранилище)

6. **Нажмите "Deploy"**

7. **Дождитесь завершения** (обычно 2-3 минуты)

8. **Получите ссылку!** 
   Vercel автоматически создаст URL вида:
   ```
   https://horeca-diagnosis-xxxxx.vercel.app
   ```
   Или кастомный домен, если настроен.

## Шаг 4: Проверка

1. Откройте ссылку в браузере
2. Приложение должно загрузиться
3. Проверьте регистрацию и авторизацию

## Обновление приложения

После изменений в коде:
```bash
git add .
git commit -m "Описание изменений"
git push
```

Vercel автоматически задеплоит новую версию!

## Проблемы?

- **Ошибка сборки:** Проверьте логи в панели Vercel → Deployments
- **Приложение не работает:** Проверьте консоль браузера (F12)
- **Нужна помощь:** См. `DEPLOYMENT_GUIDE.md`

