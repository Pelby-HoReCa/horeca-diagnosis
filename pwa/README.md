# PWA сборка (отдельно от приложения)

Эта папка используется только для PWA-экспорта и деплоя веб-версии.

## Локальная сборка

```bash
npm run pwa:build
```

Результат появится в `pwa/dist`.

## Деплой на Vercel (отдельный проект)

1. Создай новый проект в Vercel из этого репозитория.
2. **Framework Preset**: Other
3. **Root Directory**: `.`
4. **Build Command**: `npm run pwa:build`
5. **Output Directory**: `pwa/dist`

Так PWA будет полностью изолирована от мобильной версии.
