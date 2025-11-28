# 🚀 Пошаговое развертывание на Selectel

## Этап 1: Создание VPS на Selectel

### Шаг 1.1: Регистрация и вход
1. Откройте https://selectel.ru
2. Зарегистрируйтесь или войдите в аккаунт
3. Перейдите в раздел "Облачные вычисления" → "Виртуальные серверы"

### Шаг 1.2: Создание сервера
1. Нажмите "Создать сервер"
2. Выберите конфигурацию:
   - **ОС:** Выберите **"Ubuntu 24.04 LTS 64-bit"** (обычная версия БЕЗ GPU)
     - ⚠️ НЕ выбирайте варианты с "GPU Driver" или "GPU optimized" - они нам не нужны
     - ⚠️ Docker тоже не обязателен для начала
   - **RAM:** минимум 2GB (рекомендуется 4GB)
   - **CPU:** минимум 2 ядра
   - **Диск:** минимум 20GB SSD (рекомендуется 40GB)
   - **Регион:** выберите ближайший к вам
3. Настройте сеть:
   - Включите "Публичный IP"
   - Запишите IP адрес (он понадобится)
4. Нажмите "Создать сервер"
5. Дождитесь создания (обычно 2-3 минуты)

**Важно:** Выбирайте обычную Ubuntu 24.04 LTS без GPU оптимизации - это дешевле и нам не нужна видеокарта для Node.js приложения.

### Шаг 1.3: Получение доступа
1. В списке серверов найдите ваш сервер
2. Нажмите на него
3. Перейдите в "Доступ"
4. Запишите:
   - **IP адрес:** `XXX.XXX.XXX.XXX`
   - **Логин:** обычно `root`
   - **Пароль:** (если задавали при создании, или сгенерируйте новый)

## Этап 2: Подключение к серверу

### Шаг 2.1: Подключение через SSH

**На Mac/Linux:**
```bash
ssh root@YOUR_SERVER_IP
```

**На Windows:**
- Используйте PuTTY или Windows Terminal
- Host: `YOUR_SERVER_IP`
- Port: `22`
- Username: `root`

При первом подключении подтвердите подключение (введите `yes`).

### Шаг 2.2: Первоначальная настройка

После подключения выполните:

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка необходимых пакетов
apt install -y curl wget git ufw
```

## Этап 3: Установка Node.js

### Шаг 3.1: Установка Node.js 18.x

```bash
# Добавление репозитория NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# Установка Node.js
apt install -y nodejs

# Проверка установки
node --version  # должно быть v18.x или выше
npm --version
```

Должно вывести что-то вроде:
```
v18.17.0
9.6.7
```

### Шаг 3.2: Установка PM2

```bash
npm install -g pm2
pm2 --version
```

## Этап 4: Установка и настройка Nginx

### Шаг 4.1: Установка Nginx

```bash
apt install -y nginx

# Запуск и автозапуск
systemctl start nginx
systemctl enable nginx

# Проверка статуса
systemctl status nginx
```

### Шаг 4.2: Проверка работы Nginx

Откройте в браузере: `http://YOUR_SERVER_IP`

Должна открыться страница "Welcome to nginx!"

## Этап 5: Деплой бэкенда

### Шаг 5.1: Клонирование репозитория

```bash
# Создаем директорию для приложения
mkdir -p /var/www
cd /var/www

# Клонируем репозиторий (замените на ваш URL)
git clone https://github.com/YOUR_USERNAME/horeca-diagnosis.git
cd horeca-diagnosis/backend
```

**Если репозиторий приватный или еще не создан:**
- Сначала создайте репозиторий на GitHub
- Или загрузите код через SCP (см. ниже)

### Шаг 5.2: Загрузка кода (если нет GitHub)

**На вашем компьютере:**
```bash
cd /Users/sergopelby/Pelby_pr/horeca-diagnosis
tar -czf deploy.tar.gz --exclude='node_modules' --exclude='.git' --exclude='.expo' .
scp deploy.tar.gz root@YOUR_SERVER_IP:/tmp/
```

**На сервере:**
```bash
cd /var/www
mkdir -p horeca-diagnosis
cd horeca-diagnosis
tar -xzf /tmp/deploy.tar.gz
rm /tmp/deploy.tar.gz
cd backend
```

### Шаг 5.3: Установка зависимостей бэкенда

```bash
cd /var/www/horeca-diagnosis/backend
npm install
```

### Шаг 5.4: Настройка переменных окружения

```bash
nano .env
```

Добавьте (замените значения на свои):
```env
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
JWT_SECRET=ваш-случайный-секретный-ключ-минимум-32-символа-изменяйте-это
```

**Важно:** 
- Замените `JWT_SECRET` на случайную строку (минимум 32 символа)
- Если нет домена, используйте IP: `CORS_ORIGIN=http://YOUR_SERVER_IP`

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 5.5: Сборка TypeScript

```bash
npm run build
```

### Шаг 5.6: Запуск через PM2

```bash
# Запуск
pm2 start dist/server.js --name horeca-backend

# Сохранение конфигурации
pm2 save

# Настройка автозапуска
pm2 startup
```

Выполните команду, которую выведет `pm2 startup` (она будет начинаться с `sudo env PATH=...`).

### Шаг 5.7: Проверка работы бэкенда

```bash
# Проверка статуса
pm2 status

# Просмотр логов
pm2 logs horeca-backend

# Проверка порта
curl http://localhost:3000/health
```

Должен вернуться JSON: `{"status":"ok",...}`

## Этап 6: Деплой фронтенда

### Шаг 6.1: Установка зависимостей фронтенда

```bash
cd /var/www/horeca-diagnosis
npm install
```

### Шаг 6.2: Настройка переменных окружения

```bash
nano .env
```

Добавьте:
```env
EXPO_PUBLIC_API_URL=http://YOUR_SERVER_IP:3000
EXPO_PUBLIC_USE_SERVER_API=true
```

**Позже, когда настроите домен, измените на:**
```env
EXPO_PUBLIC_API_URL=https://api.your-domain.com
```

### Шаг 6.3: Сборка веб-версии

```bash
npm run web:build
```

Это займет несколько минут. Дождитесь завершения.

### Шаг 6.4: Настройка Nginx для фронтенда

```bash
nano /etc/nginx/sites-available/horeca-frontend
```

Добавьте конфигурацию:
```nginx
server {
    listen 80;
    server_name YOUR_SERVER_IP;

    root /var/www/horeca-diagnosis/.expo/web-build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кэширование статических файлов
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 6.5: Активация конфигурации

```bash
# Создаем симлинк
ln -s /etc/nginx/sites-available/horeca-frontend /etc/nginx/sites-enabled/

# Удаляем дефолтную конфигурацию (опционально)
rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
nginx -t

# Перезагрузка Nginx
systemctl reload nginx
```

### Шаг 6.6: Проверка работы фронтенда

Откройте в браузере: `http://YOUR_SERVER_IP`

Должно открыться ваше приложение!

## Этап 7: Настройка Nginx для бэкенда (прокси)

### Шаг 7.1: Создание конфигурации

```bash
nano /etc/nginx/sites-available/horeca-backend
```

Добавьте:
```nginx
server {
    listen 80;
    server_name api.YOUR_SERVER_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Или проще - используйте путь вместо поддомена:**

```nginx
server {
    listen 80;
    server_name YOUR_SERVER_IP;

    # Фронтенд
    location / {
        root /var/www/horeca-diagnosis/.expo/web-build;
        try_files $uri $uri/ /index.html;
    }

    # Бэкенд API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Сохраните и активируйте:
```bash
ln -s /etc/nginx/sites-available/horeca-backend /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Этап 8: Настройка файрвола

### Шаг 8.1: Настройка UFW

```bash
# Разрешить SSH (важно сделать первым!)
ufw allow 22/tcp

# Разрешить HTTP и HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Включить файрвол
ufw enable

# Проверка статуса
ufw status
```

## Этап 9: Настройка SSL (HTTPS) - опционально

### Шаг 9.1: Установка Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### Шаг 9.2: Получение SSL сертификата

**Если у вас есть домен:**
```bash
certbot --nginx -d your-domain.com -d www.your-domain.com
```

**Если нет домена:**
- Можно использовать IP, но SSL не получится
- Или используйте бесплатный домен (например, через Freenom)

Certbot автоматически настроит HTTPS.

## Этап 10: Проверка работы

### Шаг 10.1: Проверка фронтенда
Откройте: `http://YOUR_SERVER_IP`

### Шаг 10.2: Проверка бэкенда
```bash
curl http://localhost:3000/health
```

Или в браузере: `http://YOUR_SERVER_IP/api/health`

### Шаг 10.3: Тестирование приложения
1. Откройте приложение в браузере
2. Попробуйте зарегистрироваться
3. Проверьте авторизацию
4. Проверьте работу диагностики

## Этап 11: Обновление приложения

### Шаг 11.1: Создание скрипта обновления

```bash
nano /var/www/horeca-diagnosis/update.sh
```

Добавьте:
```bash
#!/bin/bash
cd /var/www/horeca-diagnosis

# Обновление кода (если используете Git)
git pull origin main

# Или загрузите новый архив и распакуйте

# Обновление бэкенда
cd backend
npm install
npm run build
pm2 restart horeca-backend

# Обновление фронтенда
cd ..
npm install
npm run web:build

# Перезагрузка Nginx
systemctl reload nginx

echo "✅ Обновление завершено!"
```

Сделайте исполняемым:
```bash
chmod +x /var/www/horeca-diagnosis/update.sh
```

Использование:
```bash
/var/www/horeca-diagnosis/update.sh
```

## Полезные команды

```bash
# Логи бэкенда
pm2 logs horeca-backend

# Мониторинг PM2
pm2 monit

# Перезапуск бэкенда
pm2 restart horeca-backend

# Перезапуск Nginx
systemctl restart nginx

# Логи Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Проверка портов
netstat -tulpn | grep :3000
netstat -tulpn | grep :80
```

## Решение проблем

### Бэкенд не запускается
```bash
pm2 logs horeca-backend  # проверьте логи
cd /var/www/horeca-diagnosis/backend
npm run build  # пересоберите
```

### Nginx ошибка 502
- Проверьте: `pm2 status` - должен быть запущен `horeca-backend`
- Проверьте порт: `netstat -tulpn | grep 3000`

### Приложение не открывается
- Проверьте файрвол: `ufw status`
- Проверьте Nginx: `systemctl status nginx`
- Проверьте логи: `tail -f /var/log/nginx/error.log`

## Готово! 🎉

Ваше приложение должно быть доступно по адресу: `http://YOUR_SERVER_IP`

**Следующие шаги:**
1. Настройте домен (если нужно)
2. Настройте SSL (HTTPS)
3. Настройте автоматические бэкапы
4. Протестируйте все функции приложения

