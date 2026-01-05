-- Update admin user with correct bcrypt hash for password "admin123"
-- This hash was generated with bcryptjs using cost factor 10
UPDATE users 
SET password_hash = '$2b$10$slYQmyNdGzin7olVG0p5be9DQkmaqyH60/p1aSAstJ1PDJcj6M0Fm'
WHERE email = 'admin@example.com';
