-- Run against your database (e.g. Aiven defaultdb):
-- mysql --ssl-mode=REQUIRED -u avnadmin -p -h host -P port defaultdb < schema.sql

CREATE TABLE IF NOT EXISTS users (
  id         VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  name       VARCHAR(255) NOT NULL,
  role       ENUM('admin', 'viewer') NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contents (
  id          INT AUTO_INCREMENT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  category    VARCHAR(100),
  type        ENUM('video', 'pdf', 'html') NOT NULL,
  file_path   VARCHAR(500),
  views_count INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contents_category (category),
  KEY idx_contents_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;