-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Dynamic fields for each project
CREATE TABLE IF NOT EXISTS project_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  field_name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) DEFAULT 'number',
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, field_name)
);

-- Tiers table (hierarchical structure)
CREATE TABLE IF NOT EXISTS tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tiers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  allow_child_creation BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, name)
);

-- Tier data values
CREATE TABLE IF NOT EXISTS tier_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id UUID REFERENCES tiers(id) ON DELETE CASCADE,
  field_id UUID REFERENCES project_fields(id) ON DELETE CASCADE,
  value NUMERIC,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tier_id, field_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tiers_project ON tiers(project_id);
CREATE INDEX IF NOT EXISTS idx_tiers_parent ON tiers(parent_id);
CREATE INDEX IF NOT EXISTS idx_tier_data_tier ON tier_data(tier_id);
CREATE INDEX IF NOT EXISTS idx_tier_data_field ON tier_data(field_id);
CREATE INDEX IF NOT EXISTS idx_project_fields_project ON project_fields(project_id);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, is_admin) 
VALUES ('admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', true)
ON CONFLICT (email) DO NOTHING;
