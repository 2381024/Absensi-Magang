-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS nim VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS major VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS internship_location VARCHAR(300);
ALTER TABLE users ADD COLUMN IF NOT EXISTS division VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS internship_status VARCHAR(20) DEFAULT 'active' CHECK (internship_status IN ('active', 'completed', 'suspended'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS target_hours INTEGER DEFAULT 480;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- Add attendance_type column to shifts table
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS attendance_type VARCHAR(20) DEFAULT 'hadir' CHECK (attendance_type IN ('hadir', 'izin', 'sakit', 'alpha'));

-- Add companies table
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

-- Settings table for feature toggles (e.g., geofence enforcement)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
