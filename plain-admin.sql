-- Create a new admin user with a plain text password for testing
-- WARNING: This is for testing only and should not be used in production!
INSERT INTO users (username, email, password, role) 
VALUES ('plainadmin', 'plainadmin@example.com', 'plainpassword', 'admin');

-- Verify the user was created
SELECT id, username, email, role FROM users WHERE username = 'plainadmin'; 