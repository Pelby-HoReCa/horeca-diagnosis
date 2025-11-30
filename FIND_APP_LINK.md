# 🔍 Как найти ссылку на приложение

## Проблема
Не можете найти ссылку на основное приложение, видите только админку.

## Решение

### Вариант 1: Проверить Vercel Dashboard

1. Откройте https://vercel.com/dashboard
2. Посмотрите список проектов
3. Должно быть **ДВА проекта**:
   - `horeca-diagnosis` (или похожее) - **основное приложение**
   - `horeca-admin` (или похожее) - **админка**

4. Нажмите на проект **основного приложения**
5. Скопируйте URL из раздела **Domains** или **Deployments**

### Вариант 2: Если проекта нет

Если видите только админку, значит основное приложение не развернуто.

**Нужно развернуть:**

1. В Vercel Dashboard нажмите **"Add New Project"**
2. Выберите репозиторий `Pelby-HoReCa/horeca-diagnosis`
3. **Важно:** Укажите **Root Directory:** `./` (корень проекта)
4. **Build Command:** `npm run web:build`
5. **Output Directory:** `dist`
6. Добавьте переменные:
   - `EXPO_PUBLIC_API_URL` = `https://horeca-backend-6zl1.onrender.com`
   - `EXPO_PUBLIC_USE_SERVER_API` = `true`
7. Нажмите **Deploy**

### Вариант 3: Проверить через GitHub

1. Откройте https://github.com/Pelby-HoReCa/horeca-diagnosis
2. Перейдите в **Settings** → **Pages** (если настроено)
3. Или проверьте **Deployments** в репозитории

## Типичные URL

- **Приложение:** `https://horeca-diagnosis-xxxxx.vercel.app`
- **Админка:** `https://horeca-diagnosis-p35v.vercel.app` (ваша текущая)

## Если не можете найти

Напишите мне, и я помогу развернуть приложение заново.

