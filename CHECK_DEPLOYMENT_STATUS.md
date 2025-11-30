# 🔍 Проверка статуса деплоя

## Проблема
- Не могу найти ссылку на основное приложение
- В админке пропали пользователи

## Что нужно проверить

### 1. В Vercel Dashboard

Откройте https://vercel.com/dashboard и проверьте:

**Вариант А: Один проект**
- Если видите только `horeca-diagnosis-p35v` - это может быть:
  - Админка (если Root Directory = `admin`)
  - Или фронтенд (если Root Directory = `./`)

**Вариант Б: Два проекта**
- `horeca-diagnosis-xxxxx` - фронтенд
- `horeca-admin-xxxxx` или `horeca-diagnosis-p35v` - админка

### 2. Как определить, что есть

**Проверьте настройки проекта в Vercel:**
1. Откройте проект
2. Settings → General
3. Посмотрите **Root Directory**:
   - Если `admin` → это админка
   - Если `./` или пусто → это фронтенд

### 3. Проверка пользователей

**Почему нет пользователей:**
1. Файл `backend/data/users.json` на Render пустой
2. Еще никто не регистрировался через основное приложение
3. Данные были очищены при перезапуске Render

**Решение:**
- Зарегистрируйте тестового пользователя через основное приложение
- Проверьте админку снова

## Быстрое решение

### Если фронтенд не развернут:

1. В Vercel Dashboard → Add New Project
2. Выберите репозиторий `Pelby-HoReCa/horeca-diagnosis`
3. **Root Directory:** `./` (корень, НЕ admin!)
4. **Build Command:** `npm run web:build`
5. **Output Directory:** `dist`
6. Переменные:
   - `EXPO_PUBLIC_API_URL` = `https://horeca-backend-6zl1.onrender.com`
   - `EXPO_PUBLIC_USE_SERVER_API` = `true`
7. Deploy

### Если админка и фронтенд в одном проекте:

Нужно создать ОТДЕЛЬНЫЙ проект для админки:
1. Add New Project
2. Root Directory: `admin`
3. Build Command: `npm run build`
4. Output Directory: `.next`

