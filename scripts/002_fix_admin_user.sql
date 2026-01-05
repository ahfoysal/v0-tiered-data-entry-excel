-- Drop and recreate users table with correct admin user
DELETE FROM users WHERE email = 'admin@example.com';

-- Insert admin user with a simple approach - we'll use a known bcryptjs hash
-- This hash is bcryptjs.hashSync('admin123', 10)
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMye4zf0KaSmqaseQSyTMqHVacrVrF3KTAM
INSERT INTO users (id, email, password_hash, role, created_at) VALUES
  (
    gen_random_uuid(),
    'admin@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye4zf0KaSmqaseQSyTMqHVacrVrF3KTAM',
    'admin',
    NOW()
  );
