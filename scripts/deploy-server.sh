#!/bin/bash

# Скрипт для деплоя на собственный сервер
# Использование: ./scripts/deploy-server.sh

set -e

echo "🚀 Начало деплоя на сервер..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo -e "${RED}Ошибка: запустите скрипт из корня проекта${NC}"
    exit 1
fi

# Переменные (настройте под ваш сервер)
SERVER_USER="${SERVER_USER:-root}"
SERVER_HOST="${SERVER_HOST:-your-server.com}"
SERVER_PATH="${SERVER_PATH:-/var/www/horeca-diagnosis}"

echo -e "${YELLOW}Настройки деплоя:${NC}"
echo "  Сервер: $SERVER_USER@$SERVER_HOST"
echo "  Путь: $SERVER_PATH"
echo ""

read -p "Продолжить? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# 1. Сборка фронтенда
echo -e "${GREEN}📦 Сборка фронтенда...${NC}"
npm run web:build

# 2. Сборка бэкенда
echo -e "${GREEN}📦 Сборка бэкенда...${NC}"
cd backend
npm run build
cd ..

# 3. Создание архива (опционально)
echo -e "${GREEN}📦 Создание архива...${NC}"
tar -czf deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.expo' \
    --exclude='.env' \
    --exclude='backend/data' \
    .

# 4. Копирование на сервер
echo -e "${GREEN}📤 Копирование на сервер...${NC}"
scp deploy.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

# 5. Распаковка на сервере
echo -e "${GREEN}📥 Распаковка на сервере...${NC}"
ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
cd /var/www/horeca-diagnosis
tar -xzf /tmp/deploy.tar.gz
rm /tmp/deploy.tar.gz
ENDSSH

# 6. Установка зависимостей и перезапуск
echo -e "${GREEN}🔄 Установка зависимостей и перезапуск...${NC}"
ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
cd /var/www/horeca-diagnosis

# Фронтенд
npm install --production

# Бэкенд
cd backend
npm install --production
npm run build
pm2 restart horeca-backend || pm2 start dist/server.js --name horeca-backend

# Перезагрузка Nginx
sudo systemctl reload nginx

echo "✅ Деплой завершен!"
ENDSSH

# 7. Очистка
rm deploy.tar.gz

echo -e "${GREEN}✅ Деплой успешно завершен!${NC}"
echo ""
echo "Проверьте приложение:"
echo "  Фронтенд: https://your-domain.com"
echo "  Бэкенд: https://api.your-domain.com/health"

