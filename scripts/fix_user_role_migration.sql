-- Add user_role column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) DEFAULT 'employee';

-- Add is_admin column if it doesn't exist (already exists based on schema)
-- Update existing records
UPDATE users SET user_role = 'admin' WHERE is_admin = true;
UPDATE users SET user_role = 'employee' WHERE is_admin = false;
