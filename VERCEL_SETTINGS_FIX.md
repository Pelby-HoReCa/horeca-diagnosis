# 🔧 Как изменить настройки в Vercel (если поля неактивны)

## Проблема
Поля Build Command и Output Directory неактивны и не дают редактировать.

## Решение 1: Через Settings (рекомендуется)

1. **Откройте ваш проект** в Vercel Dashboard
2. Перейдите во вкладку **"Settings"** (вверху, рядом с Deployments)
3. Прокрутите вниз до раздела **"Build & Development Settings"**
4. Найдите кнопку **"Edit"** или **"Override"** рядом с настройками
5. Измените:
   - **Build Command:** `npm run web:build`
   - **Output Directory:** `dist`
6. Нажмите **"Save"**

## Решение 2: Через vercel.json

Создайте файл `vercel.json` в корне проекта (уже создан):

```json
{
  "buildCommand": "npm run web:build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

Закоммитьте и запушьте:
```bash
git add vercel.json
git commit -m "Добавлена конфигурация Vercel"
git push origin main
```

Vercel автоматически применит настройки из `vercel.json`.

## Решение 3: Пересоздать проект

Если ничего не помогает:

1. Удалите текущий проект в Vercel
2. Создайте новый проект заново
3. При создании сразу укажите правильные настройки

## Проверка

После применения настроек:
- Vercel автоматически запустит новый деплой
- Проверьте логи сборки
- Должно быть: `Exported: dist`

