-- This updates the admin user with a fresh hash
-- The hash below is: bcryptjs hash of "admin123" (generated fresh)
UPDATE users 
SET password_hash = '$2a$10$dXJ3SW6G7P50eS3ykevH2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW'
WHERE email = 'admin@example.com';
