-- Reset admin user password to plain text "admin123"
UPDATE users 
SET password_hash = 'admin123'
WHERE email = 'admin@example.com';
