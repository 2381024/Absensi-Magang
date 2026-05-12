-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  -- Profile fields for interns
  full_name VARCHAR(200),
  nim VARCHAR(50),
  major VARCHAR(200),
  internship_location VARCHAR(300),
  division VARCHAR(200),
  internship_status VARCHAR(20) DEFAULT 'active' CHECK (internship_status IN ('active', 'completed', 'suspended')),
  target_hours INTEGER DEFAULT 480,
  profile_photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Geofences table
CREATE TABLE IF NOT EXISTS geofences (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  geofence_id INTEGER REFERENCES geofences(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  start_lat DOUBLE PRECISION,
  start_lng DOUBLE PRECISION,
  end_lat DOUBLE PRECISION,
  end_lng DOUBLE PRECISION,
  description TEXT,
  attendance_type VARCHAR(20) DEFAULT 'hadir' CHECK (attendance_type IN ('hadir', 'izin', 'sakit', 'alpha')),
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(300) NOT NULL,
  address TEXT,
  contact_person VARCHAR(200),
  contact_email VARCHAR(200),
  contact_phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed admin user (password: admin123)
-- Run this after table creation:
-- INSERT INTO users (username, password_hash, role)
-- VALUES ('admin', '<bcrypt hash of admin123>', 'admin')
-- ON CONFLICT (username) DO NOTHING;