# 🚀 Быстрый старт админки

## Вариант 1: Локальный запуск (для тестирования)

### Шаг 1: Установите зависимости

```bash
cd admin
npm install
```

### Шаг 2: Создайте файл .env.local

Создайте файл `admin/.env.local`:

```
NEXT_PUBLIC_API_URL=https://horeca-backend-6zl1.onrender.com
```

### Шаг 3: Запустите админку

```bash
npm run dev
```

### Шаг 4: Откройте в браузере

Откройте: [http://localhost:3000](http://localhost:3000)

### Шаг 5: Войдите

- **Логин:** `Sergo1289`
- **Пароль:** `1289`

---

## Вариант 2: Деплой на Vercel (для постоянного доступа)

### Шаг 1: Создайте проект в Vercel

1. Откройте [vercel.com](https://vercel.com)
2. Нажмите **"Add New Project"**
3. Импортируйте репозиторий `Pelby-HoReCa/horeca-diagnosis`

### Шаг 2: Настройте проект

**Важно:** Укажите правильные настройки!

- **Root Directory:** `admin` ⚠️ (не корень проекта!)
- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (или оставьте по умолчанию)
- **Output Directory:** `.next` (или оставьте по умолчанию)
- **Install Command:** `npm install` (или оставьте по умолчанию)

### Шаг 3: Добавьте переменные окружения

В разделе **"Environment Variables"** добавьте:

- **Key:** `NEXT_PUBLIC_API_URL`
- **Value:** `https://horeca-backend-6zl1.onrender.com`

### Шаг 4: Деплой

1. Нажмите **"Deploy"**
2. Дождитесь завершения (обычно 2-3 минуты)
3. Получите URL вида: `https://horeca-admin-xxxxx.vercel.app`

### Шаг 5: Войдите

- **Логин:** `Sergo1289`
- **Пароль:** `1289`

---

## ⚠️ Важно: Настройка бэкенда

Перед использованием админки добавьте переменные окружения в **Render**:

1. Откройте Render Dashboard
2. Перейдите в ваш сервис `horeca-backend`
3. Откройте **Environment Variables**
4. Добавьте:
   - `ADMIN_EMAIL` = `Sergo1289`
   - `ADMIN_PASSWORD` = `1289`
5. Render автоматически перезапустит сервис

---

## 🔗 Ссылки

- **Локально:** http://localhost:3000
- **Vercel:** будет доступен после деплоя

## 📝 Учетные данные

- **Логин:** `Sergo1289`
- **Пароль:** `1289`

