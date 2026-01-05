-- Add user role support to the system
-- Adding is_employee flag and user_role to users table, default password for employees
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS is_employee BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) DEFAULT 'user'; -- 'admin' or 'user'

-- Create association between users and employees
CREATE TABLE IF NOT EXISTS user_employee_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id)
);

-- Set default user_role to 'admin' for existing users
UPDATE users SET user_role = 'admin' WHERE is_admin = TRUE;
