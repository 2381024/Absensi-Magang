-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed admin user (password: admin123)
-- Run this after table creation:
-- INSERT INTO users (username, password_hash, role)
-- VALUES ('admin', '<bcrypt hash of admin123>', 'admin')
-- ON CONFLICT (username) DO NOTHING;