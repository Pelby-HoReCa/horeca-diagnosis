# 🚨 Быстрое исправление "Failed to fetch"

## Проблема
Ошибка "Failed to fetch" при входе в админку.

## Причина
CORS блокирует запросы с админки на бэкенд.

## Решение (2 минуты)

### Шаг 1: В Render Dashboard

1. Откройте https://dashboard.render.com
2. Выберите сервис `horeca-backend`
3. Перейдите в **Environment**
4. Найдите переменную `CORS_ORIGIN`
5. **Измените значение на:**
   ```
   *
   ```
   (звездочка разрешает все домены - для тестирования)
6. Нажмите **Save Changes**
7. Render автоматически перезапустит сервис (30-60 секунд)

### Шаг 2: Проверка

1. Подождите 1-2 минуты после сохранения
2. Откройте админку: https://horeca-diagnosis-p35v.vercel.app
3. Введите логин: `Sergo1289`, пароль: `1289`
4. Нажмите "Войти"

## Если не помогло

### Проверьте переменную в Vercel:

1. Откройте https://vercel.com/dashboard
2. Выберите проект админки
3. **Settings** → **Environment Variables**
4. Проверьте, есть ли `NEXT_PUBLIC_API_URL`
5. Если нет - добавьте:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://horeca-backend-6zl1.onrender.com`
   - Environment: все три (Production, Preview, Development)
6. Сохраните и пересоберите проект

## Альтернатива (если Render не работает)

Временно измените CORS в коде бэкенда:

```typescript
// backend/server.ts
app.use(cors({
  origin: '*', // Временно разрешить все
  credentials: true
}));
```

Затем закоммитьте и запушьте:
```bash
git add backend/server.ts
git commit -m "Временно разрешить все CORS"
git push
```

