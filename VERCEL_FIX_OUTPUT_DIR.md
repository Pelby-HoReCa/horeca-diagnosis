# 🔧 Исправление: Vercel ищет "web-build" вместо "dist"

## Проблема
```
Error: No Output Directory named "web-build" found after the Build completed.
```
Но сборка успешна и создает папку `dist` ✅

## Причина
Vercel использует настройки из UI (которые имеют приоритет), а не из `vercel.json`.

## Решение 1: Удалить настройки из UI (рекомендуется)

1. **Откройте проект** в Vercel Dashboard
2. Перейдите в **Settings** → **General**
3. Прокрутите до **"Build & Development Settings"**
4. Найдите поле **"Output Directory"** (сейчас там `.expo/web-build`)
5. **Нажмите на иконку карандаша** (Edit) справа от поля
6. **Удалите значение** (оставьте пустым) или введите `dist`
7. Нажмите **"Save"**

После этого Vercel будет использовать `vercel.json`, где указано `"outputDirectory": "dist"`.

## Решение 2: Пересоздать проект (если не получается)

1. **Удалите проект:**
   - Settings → General → Scroll down → "Delete Project"
   - Подтвердите удаление

2. **Создайте новый проект:**
   - Add New Project
   - Импортируйте `Pelby-HoReCa/horeca-diagnosis`
   - **НЕ заполняйте Build Settings вручную!**
   - Оставьте все поля пустыми
   - Vercel автоматически использует `vercel.json`

3. **Добавьте только Environment Variables:**
   - `EXPO_PUBLIC_API_URL` = `https://horeca-backend-6zl1.onrender.com`
   - `EXPO_PUBLIC_USE_SERVER_API` = `true`

4. Нажмите **"Deploy"**

## Решение 3: Использовать Vercel CLI

Если у вас установлен Vercel CLI:

```bash
# 1. Войдите в аккаунт
vercel login

# 2. Свяжите проект
vercel link

# 3. Удалите настройки из UI через CLI (если возможно)
# Или просто задеплойте - CLI использует vercel.json
vercel --prod
```

## Проверка

После применения решения:
- Vercel автоматически запустит новый деплой
- В логах должно быть: `Exported: dist`
- Ошибка должна исчезнуть
- Приложение должно быть доступно по URL

## Текущий статус

✅ `vercel.json` правильный:
```json
{
  "outputDirectory": "dist",
  "buildCommand": "npm run web:build"
}
```

✅ Сборка работает и создает `dist`

❌ Vercel UI все еще ищет `web-build` (старые настройки)

