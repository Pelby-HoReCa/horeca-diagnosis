# 🖥️ Развертывание на собственном сервере (VPS)

## Требования к серверу

- **ОС:** Ubuntu 20.04+ / Debian 11+ / CentOS 8+ (рекомендуется Ubuntu)
- **RAM:** минимум 2GB (рекомендуется 4GB+)
- **CPU:** 2+ ядра
- **Диск:** 20GB+ свободного места
- **Доступ:** SSH доступ к серверу
- **Домен:** (опционально) для доступа по домену вместо IP

## Шаг 1: Подготовка сервера

### 1.1 Подключение к серверу

```bash
ssh root@YOUR_SERVER_IP
# или
ssh your_user@YOUR_SERVER_IP
```

### 1.2 Обновление системы

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 1.3 Установка Node.js и npm

```bash
# Установка Node.js 18+ через NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка установки
node --version  # должно быть v18.x или выше
npm --version
```

### 1.4 Установка Git

```bash
sudo apt install git -y
```

### 1.5 Установка PM2 (для автозапуска)

```bash
sudo npm install -g pm2
```

## Шаг 2: Установка Nginx (веб-сервер)

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

Проверьте: откройте `http://YOUR_SERVER_IP` в браузере - должна быть страница Nginx.

## Шаг 3: Деплой бэкенда

### 3.1 Клонирование репозитория

```bash
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/horeca-diagnosis.git
cd horeca-diagnosis/backend
```

### 3.2 Установка зависимостей

```bash
npm install
```

### 3.3 Настройка переменных окружения

```bash
nano .env
```

Добавьте:
```env
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

**Важно:** Замените `JWT_SECRET` на случайную строку минимум 32 символа!

### 3.4 Сборка TypeScript

```bash
npm run build
```

### 3.5 Запуск через PM2

```bash
pm2 start dist/server.js --name horeca-backend
pm2 save
pm2 startup  # выполните команду, которую выведет PM2
```

Проверьте: `pm2 status` - должен быть запущен процесс `horeca-backend`

## Шаг 4: Деплой фронтенда

### 4.1 Сборка веб-версии

```bash
cd /var/www/horeca-diagnosis
npm install
npm run web:build
```

### 4.2 Настройка переменных окружения

```bash
nano .env
```

Добавьте:
```env
EXPO_PUBLIC_API_URL=https://api.your-domain.com
EXPO_PUBLIC_USE_SERVER_API=true
```

### 4.3 Настройка Nginx для фронтенда

```bash
sudo nano /etc/nginx/sites-available/horeca-frontend
```

Добавьте конфигурацию:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

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

Активируйте конфигурацию:
```bash
sudo ln -s /etc/nginx/sites-available/horeca-frontend /etc/nginx/sites-enabled/
sudo nginx -t  # проверка конфигурации
sudo systemctl reload nginx
```

## Шаг 5: Настройка Nginx для бэкенда (прокси)

```bash
sudo nano /etc/nginx/sites-available/horeca-backend
```

Добавьте:
```nginx
server {
    listen 80;
    server_name api.your-domain.com;

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

Активируйте:
```bash
sudo ln -s /etc/nginx/sites-available/horeca-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Шаг 6: Настройка SSL (HTTPS) через Let's Encrypt

### 6.1 Установка Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2 Получение SSL сертификатов

```bash
# Для фронтенда
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Для бэкенда
sudo certbot --nginx -d api.your-domain.com
```

Certbot автоматически обновит конфигурацию Nginx для HTTPS.

### 6.3 Автообновление сертификатов

```bash
sudo certbot renew --dry-run  # проверка
```

Сертификаты обновляются автоматически через cron.

## Шаг 7: Настройка файрвола

```bash
# Разрешить SSH
sudo ufw allow 22/tcp

# Разрешить HTTP и HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Включить файрвол
sudo ufw enable
sudo ufw status
```

## Шаг 8: Обновление приложения

### 8.1 Обновление кода

```bash
cd /var/www/horeca-diagnosis
git pull origin main

# Обновить бэкенд
cd backend
npm install
npm run build
pm2 restart horeca-backend

# Обновить фронтенд
cd ..
npm install
npm run web:build
sudo systemctl reload nginx
```

### 8.2 Автоматизация через скрипт

Создайте `/var/www/horeca-diagnosis/update.sh`:

```bash
#!/bin/bash
cd /var/www/horeca-diagnosis
git pull origin main

# Бэкенд
cd backend
npm install
npm run build
pm2 restart horeca-backend

# Фронтенд
cd ..
npm install
npm run web:build
sudo systemctl reload nginx

echo "Обновление завершено!"
```

Сделайте исполняемым:
```bash
chmod +x /var/www/horeca-diagnosis/update.sh
```

Использование:
```bash
sudo /var/www/horeca-diagnosis/update.sh
```

## Шаг 9: Мониторинг и логи

### 9.1 Логи бэкенда

```bash
pm2 logs horeca-backend
pm2 monit  # мониторинг в реальном времени
```

### 9.2 Логи Nginx

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Шаг 10: Резервное копирование

### 10.1 Резервная копия данных

```bash
# Создайте скрипт бэкапа
nano /var/www/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/horeca"

mkdir -p $BACKUP_DIR

# Бэкап данных бэкенда
tar -czf $BACKUP_DIR/backend_data_$DATE.tar.gz /var/www/horeca-diagnosis/backend/data

# Бэкап конфигураций
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /etc/nginx/sites-available/horeca-*

echo "Бэкап создан: $BACKUP_DIR"
```

### 10.2 Автоматический бэкап (cron)

```bash
crontab -e
```

Добавьте (ежедневно в 3:00):
```
0 3 * * * /var/www/backup.sh
```

## Проверка работы

1. **Фронтенд:** `https://your-domain.com`
2. **Бэкенд API:** `https://api.your-domain.com/health`
3. **Проверка PM2:** `pm2 status`

## Полезные команды

```bash
# Перезапуск бэкенда
pm2 restart horeca-backend

# Перезапуск Nginx
sudo systemctl restart nginx

# Проверка статуса
pm2 status
sudo systemctl status nginx

# Просмотр логов
pm2 logs horeca-backend
sudo journalctl -u nginx -f
```

## Безопасность

1. **Измените SSH порт** (опционально):
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Port 2222
   sudo systemctl restart sshd
   ```

2. **Отключите root логин:**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # PermitRootLogin no
   ```

3. **Используйте ключи SSH** вместо паролей

4. **Регулярно обновляйте систему:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## Проблемы и решения

### Бэкенд не запускается
```bash
pm2 logs horeca-backend  # проверьте логи
cd /var/www/horeca-diagnosis/backend
npm run build  # пересоберите
```

### Nginx ошибка 502
- Проверьте, что бэкенд запущен: `pm2 status`
- Проверьте порт: `netstat -tulpn | grep 3000`

### SSL не работает
- Проверьте DNS записи для домена
- Убедитесь, что порты 80 и 443 открыты
- Проверьте: `sudo certbot certificates`

## Следующие шаги

После успешного деплоя:
1. Настройте мониторинг (опционально: UptimeRobot, Pingdom)
2. Настройте автоматические бэкапы
3. Настройте домен и DNS записи
4. Протестируйте регистрацию и авторизацию

