# Stage 1 Checkpoint (Release Prep)

Этот шаг делает "точку восстановления" перед релизом и App Store подачей.

## Быстрый запуск

```bash
cd /Users/sergopelby/Pelby_pr/horeca-diagnosis
npm run checkpoint:stage1
```

Артефакты сохраняются в `.backups/release-checkpoints/<timestamp>/`.

## Что делает скрипт

1. Снимает состояние git (ветка, commit, diff).
2. Загружает `.env` (если есть).
3. Запускает `smoke:server`.
4. Запускает JSON backup админки (если заданы `ADMIN_EMAIL` + `ADMIN_PASSWORD`).
5. Делает `pg_dump` (если задан `DATABASE_URL_EXTERNAL` или `DATABASE_URL` и установлен `pg_dump`).
6. Считает checksums.
7. Упаковывает всё в `.tar.gz`.

Итоговый статус смотри в `meta/summary.txt` внутри директории checkpoint.

## Включить автотег git

```bash
npm run checkpoint:stage1:tag
```

Скрипт создаст и запушит тег `pre-appstore-<timestamp>`.

## Важные переменные окружения

```bash
export ADMIN_EMAIL="..."
export ADMIN_PASSWORD="..."
export DATABASE_URL_EXTERNAL="postgresql://..."
```

Без этих переменных скрипт отработает, но часть шагов будет помечена как `skipped`.
