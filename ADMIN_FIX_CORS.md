# 🔧 Исправление проблемы "Failed to fetch" в админке

## Проблема
Ошибка "Failed to fetch" при попытке входа в админку.

## Причины
1. **Переменная окружения не установлена в Vercel**
2. **CORS не разрешает запросы с админки**

## Решение

### Шаг 1: Установить переменную окружения в Vercel

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите проект админки (`horeca-admin` или похожий)
3. Перейдите в **Settings** → **Environment Variables**
4. Добавьте переменную:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://horeca-backend-6zl1.onrender.com`
   - **Environment:** Production, Preview, Development (все три)
5. Нажмите **Save**
6. Пересоберите проект (Settings → Deployments → Redeploy)

### Шаг 2: Обновить CORS на бэкенде (Render)

1. Откройте [Render Dashboard](https://dashboard.render.com)
2. Выберите сервис `horeca-backend`
3. Перейдите в **Environment**
4. Найдите переменную `CORS_ORIGIN`
5. Добавьте URL админки. У вас есть три домена:
   - `horeca-diagnosis-p35v.vercel.app` - основной production
   - `horeca-diagnosis-p35v-git-main-pelby1.vercel.app` - preview для main
   - `horeca-diagnosis-p35v-b5p5ziesw-pelby1.vercel.app` - preview для коммита
   
   **Рекомендуется добавить все три через запятую:**
   ```
   https://horeca-diagnosis-p35v.vercel.app,https://horeca-diagnosis-p35v-git-main-pelby1.vercel.app,https://horeca-diagnosis-p35v-b5p5ziesw-pelby1.vercel.app
   ```
   
   **Или только основной (production):**
   ```
   https://horeca-diagnosis-p35v.vercel.app
   ```
   
   **Или используйте `*` для разрешения всех доменов (для тестирования):**
   ```
   *
   ```
6. Сохраните изменения
7. Render автоматически перезапустит сервис

### Шаг 3: Проверить работу

1. Откройте админку: https://horeca-diagnosis-p35v.vercel.appчраузера (F12)
3. Введите логин: `Sergo1289`, пароль: `1289`
4. Нажмите "Войти"
5. Проверьте логи в консоли

## Альтернативное решение (если не помогло)

Если проблема сохраняется, проверьте:

1. **Бэкенд доступен:**
   ```bash
   curl https://horeca-backend-6zl1.onrender.com/health
   ```
   Должен вернуть: `{"status":"ok",...}`

2. **API endpoint работает:**
   ```bash
   curl -X POST https://horeca-backend-6zl1.onrender.com/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"email":"Sergo1289","password":"1289"}'
   ```

3. **Проверьте логи Render:**
   - Откройте Render Dashboard
   - Выберите сервис
   - Перейдите в **Logs**
   - Проверьте, приходят ли запросы

## Быстрое решение для тестирования

Если нужно быстро протестировать, временно измените CORS на бэкенде:

```typescript
// backend/server.ts
app.use(cors({
  origin: '*', // Временно разрешить все домены
  credentials: true
}));
```

**⚠️ Внимание:** В продакшене используйте конкретные домены!

