# 🆓 Бесплатное развертывание через GitHub

## Вариант 1: Vercel (фронтенд) + Railway (бэкенд) - ВСЁ БЕСПЛАТНО

### Преимущества:
- ✅ Полностью бесплатно
- ✅ Автоматический деплой при push в GitHub
- ✅ HTTPS из коробки
- ✅ Простая настройка

---

## Этап 1: Подготовка репозитория на GitHub

### Шаг 1.1: Создание репозитория

1. Откройте https://github.com/new
2. Название: `horeca-diagnosis`
3. Выберите **Public** (для бесплатного использования) или **Private**
4. **НЕ** добавляйте README, .gitignore или лицензию (они уже есть)
5. Нажмите "Create repository"

### Шаг 1.2: Загрузка кода на GitHub

**На вашем компьютере:**

```bash
cd /Users/sergopelby/Pelby_pr/horeca-diagnosis

# Проверьте, что все закоммичено
git status

# Если есть незакоммиченные изменения
git add .
git commit -m "Готово к деплою"

# Подключите удаленный репозиторий (замените YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/horeca-diagnosis.git

# Загрузите код
git branch -M main
git push -u origin main
```

**Если репозиторий уже существует:**
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/horeca-diagnosis.git
git push -u origin main
```

---

## Этап 2: Деплой бэкенда на Railway (БЕСПЛАТНО)

### Шаг 2.1: Регистрация на Railway

1. Откройте https://railway.app
2. Нажмите "Start a New Project"
3. Войдите через **GitHub** (это важно!)
4. Подтвердите доступ к репозиториям

### Шаг 2.2: Создание проекта

1. Нажмите "New Project"
2. Выберите "Deploy from GitHub repo"
3. Выберите репозиторий `horeca-diagnosis`
4. Railway автоматически определит проект

### Шаг 2.3: Настройка бэкенда

1. Railway покажетч список файлов - выберите папку `backend`
2. Или в настройках проекта:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

### Шаг 2.4: Настройка переменных окружения

В настройках проекта → Variables добавьте:

```
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-app.vercel.app
JWT_SECRET=ваш-случайный-секретный-ключ-минимум-32-символа
```

**Важно:** Замените `JWT_SECRET` на случайную строку!

### Шаг 2.5: Получение URL бэкенда

1. После деплоя Railway создаст URL вида: `https://horeca-backend-production.up.railway.app`
2. Скопируйте этот URL - он понадобится для фронтенда
3. Или настройте кастомный домен (опционально)

### Шаг 2.6: Проверка бэкенда

Откройте в браузере: `https://your-backend-url.railway.app/health`

Должен вернуться JSON: `{"status":"ok",...}`

---

## Этап 3: Деплой фронтенда на Vercel (БЕСПЛАТНО)

### Шаг 3.1: Регистрация на Vercel

1. Откройте https://vercel.com
2. Нажмите "Sign Up"
3. Войдите через **GitHub** (это важно!)
4. Подтвердите доступ к репозиториям

### Шаг 3.2: Создание проекта

1. Нажмите "Add New Project"
2. Выберите репозиторий `horeca-diagnosis`
3. Настройте проект:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (оставьте пустым)
   - **Build Command:** `npm run web:build`
   - **Output Directory:** `.expo/web-build`
   - **Install Command:** `npm install` (по умолчанию)

### Шаг 3.3: Настройка переменных окружения

В настройках проекта → Environment Variables добавьте:

```
EXPO_PUBLIC_API_URL=https://your-backend-url.onrender.com
EXPO_PUBLIC_USE_SERVER_API=true
```

**Важно:** Замените `your-backend-url.onrender.com` на реальный URL из Render!

### Шаг 3.4: Деплой

1. Нажмите "Deploy"
2. Дождитесь завершения (обычно 2-3 минуты)
3. Vercel автоматически создаст URL вида: `https://horeca-diagnosis.vercel.app`

### Шаг 3.5: Проверка фронтенда

Откройте в браузере URL, который создал Vercel.

Приложение должно загрузиться!

---

## Этап 4: Обновление приложения

### Автоматическое обновление

После каждого `git push`:
- **Railway** автоматически пересоберет и задеплоит бэкенд
- **Vercel** автоматически пересоберет и задеплоит фронтенд

### Ручное обновление

```bash
# Внесите изменения в код
git add .
git commit -m "Описание изменений"
git push origin main

# Оба сервиса автоматически задеплоят обновления!
```

---

## Лимиты бесплатных планов

### Render (бэкенд)
- ✅ Бесплатный план для веб-сервисов
- ✅ Автоматические деплои
- ✅ HTTPS из коробки
- ⚠️ Сервис "засыпает" после 15 минут неактивности (первый запрос после пробуждения может занять 30-60 секунд)

### Vercel (фронтенд)
- ✅ Неограниченное количество деплоев
- ✅ 100GB трафика в месяц
- ✅ Автоматические деплои
- ✅ HTTPS из коробки
- ✅ CDN по всему миру

---

## Альтернативные бесплатные варианты

### Вариант 2: Render (бэкенд) + Vercel (фронтенд)

**Render для бэкенда:**
1. https://render.com
2. Регистрация через GitHub
3. New → Web Service
4. Подключите репозиторий
5. Root Directory: `backend`
6. Build: `npm install && npm run build`
7. Start: `npm start`

**Плюсы Render:**
- ✅ Бесплатный план доступен
- ✅ Не засыпает (но может быть медленнее)

### Вариант 3: Netlify (фронтенд) + Railway (бэкенд)

**Netlify для фронтенда:**
1. https://netlify.com
2. Регистрация через GitHub
3. New site from Git
4. Выберите репозиторий
5. Build command: `npm run web:build`
6. Publish directory: `.expo/web-build`

---

## Решение проблем

### Бэкенд не работает
1. Проверьте логи в Railway: Project → Deployments → View Logs
2. Проверьте переменные окружения
3. Убедитесь, что `PORT` не задан (Railway сам назначает)

### Фронтенд не подключается к бэкенду
1. Проверьте `EXPO_PUBLIC_API_URL` в Vercel
2. Проверьте `CORS_ORIGIN` в Railway (должен быть URL Vercel)
3. Проверьте консоль браузера (F12) на ошибки

### Ошибка сборки
1. Проверьте логи в Vercel: Deployments → View Logs
2. Убедитесь, что `package.json` содержит скрипт `web:build`
3. Проверьте, что все зависимости установлены

---

## Полезные ссылки

- **Railway:** https://railway.app
- **Vercel:** https://vercel.com
- **GitHub:** https://github.com

---

## Итого: Что получаем БЕСПЛАТНО

✅ **Фронтенд:** https://your-app.vercel.app  
✅ **Бэкенд:** https://your-backend.railway.app  
✅ **Автоматические обновления** при каждом push  
✅ **HTTPS** из коробки  
✅ **CDN** для быстрой загрузки  
✅ **Мониторинг** и логи  

**Всё это абсолютно бесплатно!** 🎉

