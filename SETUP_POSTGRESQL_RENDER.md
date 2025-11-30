# 🚀 Настройка PostgreSQL на Render

## Шаг 1: Создать PostgreSQL базу данных

1. Откройте https://dashboard.render.com
2. Нажмите **"New +"** → **"PostgreSQL"**
3. Заполните:
   - **Name:** `horeca-database` (или любое другое)
   - **Database:** `horeca_db` (или любое другое)
   - **User:** оставьте по умолчанию
   - **Region:** выберите ближайший
   - **PostgreSQL Version:** 15 (или последняя)
   - **Plan:** Free (для начала)
4. Нажмите **"Create Database"**
5. Дождитесь создания (1-2 минуты)

## Шаг 2: Получить Connection String

1. После создания откройте базу данных
2. В разделе **"Connections"** найдите **"Internal Database URL"**
3. Скопируйте строку вида:
   ```
   postgresql://user:password@host:port/database
   ```

## Шаг 3: Добавить переменную окружения в Render

1. Откройте ваш сервис `horeca-backend`
2. Перейдите в **Environment**
3. Добавьте переменную:
   - **Key:** `DATABASE_URL`
   - **Value:** вставьте скопированный connection string
4. Сохраните

## Шаг 4: Выполнить миграции

После деплоя бэкенда с новым кодом, таблицы создадутся автоматически при первом запросе.

Или выполните вручную через psql:

```bash
# Подключитесь к базе через Render Dashboard → Shell
psql $DATABASE_URL

# Выполните миграции
\i backend/migrations/001_create_users_table.sql
\i backend/migrations/002_create_diagnosis_table.sql
```

## Шаг 5: Проверить работу

1. Зарегистрируйте тестового пользователя
2. Проверьте админку - пользователь должен появиться
3. Перезапустите Render - данные должны сохраниться!

## ⚠️ Важно

- Connection string должен быть в переменной `DATABASE_URL`
- После добавления переменной Render перезапустит сервис
- Данные теперь сохраняются навсегда!

