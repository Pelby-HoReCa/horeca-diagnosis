-- Миграция для создания таблицы истории диагностики
-- Используйте эту миграцию при переходе на PostgreSQL

CREATE TABLE IF NOT EXISTS diagnosis_history (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  blocks JSONB NOT NULL,
  tasks JSONB NOT NULL,
  efficiency DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_diagnosis_user_id ON diagnosis_history(user_id);
CREATE INDEX idx_diagnosis_created_at ON diagnosis_history(created_at DESC);

