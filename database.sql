-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS ag_shop;

-- Use the database
USE ag_shop;

-- Create customers table (previously users table)
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin' or 'user'
  customer_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Drop existing purchases table if it exists
DROP TABLE IF EXISTS purchases;

-- Create purchases table
CREATE TABLE purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  buy_date DATE NOT NULL,
  immediate BOOLEAN NOT NULL DEFAULT TRUE,
  interest_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  created_by BIGINT UNSIGNED,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Add some sample customers
INSERT INTO customers (name, email, phone, address)
VALUES
  ('John Doe', 'john@example.com', '555-1234', '123 Main St'),
  ('Jane Smith', 'jane@example.com', '555-5678', '456 Oak Ave'),
  ('Robert Johnson', 'robert@example.com', '555-9012', '789 Pine Rd');

-- Insert an admin user with hashed password (use bcrypt to hash these in production)
INSERT INTO users (username, email, password, role) 
VALUES ('admin', 'admin@example.com', '$2a$10$HHXFIFYp8lM1v1rSHMn6NO5qrE.xCk1lQzGEDGQWV.RpVUJb.Cy2y', 'admin');

-- Insert a regular user with hashed password (password is 'password')
INSERT INTO users (username, email, password, role, customer_id) 
VALUES ('user', 'user@example.com', '$2a$10$NlUO.wATsKO/eSHWw3JxaOKPwwO9j3Bm3JQyHJhnbHfcUXVf7vhTC', 'user', 1);

-- Add some sample data
INSERT INTO purchases (customer_id, buy_date, immediate, interest_percentage, total_amount, paid_date, created_by)
VALUES
  (1, '2023-05-15', FALSE, 10.00, 5000.00, NULL, 1),
  (2, '2023-05-20', TRUE, 0.00, 3500.00, '2023-05-20', 1),
  (3, '2023-05-25', FALSE, 15.00, 7500.00, NULL, 2);