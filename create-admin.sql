-- Create a new admin user with password "password"
INSERT INTO users (username, email, password, role) 
VALUES ('newadmin', 'newadmin@example.com', '$2a$10$NlUO.wATsKO/eSHWw3JxaOKPwwO9j3Bm3JQyHJhnbHfcUXVf7vhTC', 'admin');

-- Update the existing admin user's password to "password"
UPDATE users 
SET password = '$2a$10$NlUO.wATsKO/eSHWw3JxaOKPwwO9j3Bm3JQyHJhnbHfcUXVf7vhTC' 
WHERE username = 'admin';

-- Verify users
SELECT id, username, email, role FROM users; 