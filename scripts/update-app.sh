#!/bin/bash

# Скрипт для обновления приложения через EAS Update
# Использование: ./scripts/update-app.sh [message]

MESSAGE=${1:-"Обновление приложения $(date +'%Y-%m-%d %H:%M:%S')"}

echo "🚀 Создание обновления приложения..."
echo "📝 Сообщение: $MESSAGE"

# Проверяем, установлен ли EAS CLI
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI не установлен. Установите: npm install -g eas-cli"
    exit 1
fi

# Создаем обновление
eas update --branch production --message "$MESSAGE"

if [ $? -eq 0 ]; then
    echo "✅ Обновление успешно создано!"
    echo "📱 Пользователи получат обновление при следующем запуске приложения"
else
    echo "❌ Ошибка при создании обновления"
    exit 1
fi

