-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS ag_shop;

-- Use the database
USE ag_shop;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Drop existing purchases table if it exists
DROP TABLE IF EXISTS purchases;

-- Create purchases table
CREATE TABLE purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  buy_date DATE NOT NULL,
  immediate BOOLEAN NOT NULL DEFAULT TRUE,
  interest_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Add some sample users
INSERT INTO users (name, email, phone, address)
VALUES
  ('John Doe', 'john@example.com', '555-1234', '123 Main St, Anytown'),
  ('Jane Smith', 'jane@example.com', '555-5678', '456 Oak Ave, Somewhere'),
  ('Robert Johnson', 'robert@example.com', '555-9012', '789 Pine Rd, Elsewhere');

-- Add some sample data
INSERT INTO purchases (user_id, buy_date, immediate, interest_percentage, total_amount, paid_date)
VALUES
  (1, '2023-05-15', FALSE, 10.00, 5000.00, NULL),
  (2, '2023-05-20', TRUE, 0.00, 3500.00, '2023-05-20'),
  (3, '2023-05-25', FALSE, 15.00, 7500.00, NULL);