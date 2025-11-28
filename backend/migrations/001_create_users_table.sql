-- Миграция для создания таблицы пользователей
-- Используйте эту миграцию при переходе на PostgreSQL

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  position VARCHAR(255),
  phone VARCHAR(50),
  social_link VARCHAR(255),
  project_name VARCHAR(255),
  outlets_count VARCHAR(50),
  work_format VARCHAR(100),
  city VARCHAR(100),
  address TEXT,
  project_link VARCHAR(255),
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_id ON users(id);

