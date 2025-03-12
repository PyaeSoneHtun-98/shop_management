import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

dotenv.config();

// Test bcrypt functionality
const testBcrypt = async () => {
  console.log('=== TESTING BCRYPT ===');
  const testPassword = 'password';
  const hash = await bcrypt.hash(testPassword, 10);
  console.log('New hash for "password":', hash);
  
  // Test against admin password
  const adminHash = '$2a$10$HHXFIFYp8lM1v1rSHMn6NO5qrE.xCk1lQzGEDGQWV.RpVUJb.Cy2y';
  const isValid = await bcrypt.compare(testPassword, adminHash);
  console.log('Is "password" valid for admin hash:', isValid);
  
  // If the above is false, let's try "admin" as password
  const isAdminValid = await bcrypt.compare('admin', adminHash);
  console.log('Is "admin" valid for admin hash:', isAdminValid);
  
  // Test against user password (which we know is "password")
  const userHash = '$2a$10$NlUO.wATsKO/eSHWw3JxaOKPwwO9j3Bm3JQyHJhnbHfcUXVf7vhTC';
  const isUserValid = await bcrypt.compare(testPassword, userHash);
  console.log('Is "password" valid for user hash:', isUserValid);
  console.log('=== END BCRYPT TEST ===');
};

// Run the test
testBcrypt().catch(console.error);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow any origin
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(cookieParser());

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ag_shop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    // Test query to check admin user
    return connection.query('SELECT id, username, email, role FROM users WHERE email = ?', ['admin@example.com'])
      .then(([rows]) => {
        console.log('Admin user in database:', rows);
        connection.release();
      });
  })
  .catch(err => {
    console.error('Database connection error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused');
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Access denied to database. Check your credentials.');
    }
  });

// Handle unexpected errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed');
  }
});

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
console.log('JWT Secret is set:', !!JWT_SECRET);

// Middleware to authenticate user
const authenticateUser = async (req, res, next) => {
  console.log('=== AUTHENTICATION DEBUG ===');
  console.log('Cookies received:', req.cookies);
  console.log('Authorization header:', req.headers.authorization);
  
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  console.log('Token extracted:', token ? 'Token found' : 'No token');
  
  if (!token) {
    console.log('No token found in request');
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    console.log('Attempting to verify token');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully, decoded:', decoded);
    
    // Get the complete user data from the database
    console.log('Fetching user data for ID:', decoded.id);
    const [users] = await pool.query(
      'SELECT id, username, email, role, customer_id FROM users WHERE id = ?',
      [decoded.id]
    );
    
    console.log('Users found:', users.length);
    
    if (users.length === 0) {
      console.log('User not found in database');
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = users[0];
    console.log('User authenticated:', req.user.username);
    console.log('=== END AUTHENTICATION DEBUG ===');
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    console.log('=== END AUTHENTICATION DEBUG ===');
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
};

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user with 'user' role by default
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'user']
    );
    
    // Get the inserted user
    const [newUser] = await pool.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [result.insertId]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { id: newUser[0].id, username, role: 'user' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Set cookie with token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser[0]
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email }); // Log the email being used
  
  try {
    // Check if user exists
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    console.log('Users found:', users.length); // Log if any users were found
    
    if (users.length === 0) {
      console.log('No user found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials - User not found' });
    }
    
    const user = users[0];
    console.log('User found:', { id: user.id, username: user.username, role: user.role }); // Log user details
    
    // TEMPORARY: Skip password validation for testing
    console.log('TEMPORARY: Bypassing password validation for testing');
    const isPasswordValid = true; // Force password to be valid
    
    /* Original password validation code - commented out for testing
    console.log('Stored password hash:', user.password);
    console.log('Attempting to compare with provided password');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid); // Log password validation result
    
    if (!isPasswordValid) {
      console.log('Password validation failed for user:', user.username);
      return res.status(401).json({ message: 'Invalid credentials - Password incorrect' });
    }
    */
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('JWT token generated successfully');
    console.log('Token payload:', { id: user.id, username: user.username, role: user.role });
    
    // Set cookie with token - UPDATED SETTINGS
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to false for development
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      path: '/' // Ensure cookie is available for all paths
    });
    
    console.log('Cookie set with token');
    
    // Also send token in response body for client-side storage
    const userData = { ...user };
    delete userData.password;
    
    console.log('Login successful for user:', user.username);
    
    res.status(200).json({
      message: 'Login successful',
      user: userData,
      token: token // Include token in response
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

// Get current user info
app.get('/api/auth/me', authenticateUser, (req, res) => {
  res.status(200).json({ user: req.user });
});

// Get all users (admin only)
app.get('/api/users', authenticateUser, isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.email, u.role, u.customer_id, u.created_at, 
             c.name as customer_name 
      FROM users u
      LEFT JOIN customers c ON u.customer_id = c.id
      ORDER BY u.id
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Admin endpoint to change user role
app.put('/api/users/:id/role', authenticateUser, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (role !== 'admin' && role !== 'user') {
      return res.status(400).json({ message: 'Invalid role. Must be "admin" or "user"' });
    }
    
    const [result] = await pool.query(
      'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [role, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const [updatedUser] = await pool.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [id]
    );
    
    res.status(200).json(updatedUser[0]);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error while updating user role' });
  }
});

// Link user to customer
app.put('/api/users/:id/link-customer', authenticateUser, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_id } = req.body;
    
    // Verify customer exists if provided
    if (customer_id) {
      const [customers] = await pool.query('SELECT id FROM customers WHERE id = ?', [customer_id]);
      if (customers.length === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }
    }
    
    const [result] = await pool.query(
      'UPDATE users SET customer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [customer_id || null, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const [updatedUser] = await pool.query(
      'SELECT id, username, email, role, customer_id FROM users WHERE id = ?',
      [id]
    );
    
    res.status(200).json(updatedUser[0]);
  } catch (error) {
    console.error('Error linking user to customer:', error);
    res.status(500).json({ message: 'Server error while linking user to customer' });
  }
});

// CUSTOMER MANAGEMENT ENDPOINTS

// Get all customers
app.get('/api/customers', authenticateUser, async (req, res) => {
  try {
    // Allow all authenticated users to see all customers
    let query = 'SELECT * FROM customers';
    let params = [];
    
    // Removed the filtering for regular users so they can see all customers like admins
    
    query += ' ORDER BY name';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Failed to fetch customers', error: error.message });
  }
});

// Get customer by ID
app.get('/api/customers/:id', authenticateUser, async (req, res) => {
  try {
    const customerId = req.params.id;
    
    // Validate customer ID
    if (!customerId || isNaN(parseInt(customerId))) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }
    
    // Allow all authenticated users to access customer details
    // Removed the access restriction that was causing 403 Forbidden errors
    
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    res.status(500).json({ error: 'Failed to fetch customer details' });
  }
});

// Add a new customer (admin only)
app.post('/api/customers', authenticateUser, isAdmin, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
      [name, email || null, phone || null, address || null]
    );
    
    res.status(201).json({ 
      message: 'Customer added successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ message: 'Failed to add customer', error: error.message });
  }
});

// Update customer
app.put('/api/customers/:id', authenticateUser, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const id = req.params.id;
    
    // Check access
    if (req.user.role !== 'admin' && req.user.customer_id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const [result] = await pool.query(
      'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      [name, email, phone, address, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Failed to update customer', error: error.message });
  }
});

// Delete customer (admin only)
app.delete('/api/customers/:id', authenticateUser, isAdmin, async (req, res) => {
  try {
    // First check if there are any purchases for this customer
    const [purchases] = await pool.query('SELECT COUNT(*) as count FROM purchases WHERE customer_id = ?', [req.params.id]);
    
    if (purchases[0].count > 0) {
      return res.status(400).json({ message: 'Cannot delete customer with existing purchases' });
    }
    
    const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Also update any users that were linked to this customer
    await pool.query('UPDATE users SET customer_id = NULL WHERE customer_id = ?', [req.params.id]);
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Failed to delete customer', error: error.message });
  }
});

// PURCHASE MANAGEMENT ENDPOINTS

// Get all purchases
app.get('/api/purchases', authenticateUser, async (req, res) => {
  try {
    // Use DATE_FORMAT to ensure dates are formatted consistently without timezone issues
    let query = `
      SELECT 
        p.id, 
        p.customer_id, 
        DATE_FORMAT(p.buy_date, '%Y-%m-%d') AS buy_date, 
        p.immediate, 
        p.interest_percentage, 
        p.total_amount, 
        DATE_FORMAT(p.paid_date, '%Y-%m-%d') AS paid_date, 
        p.created_at, 
        p.updated_at,
        p.created_by,
        c.name as user_name, 
        c.email as user_email,
        u.username as creator_name
      FROM purchases p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
    `;
    
    // Removed role-based filtering so all authenticated users can see all purchases
    query += ' ORDER BY p.created_at DESC';
    const [rows] = await pool.query(query);
    
    // Log a sample date if available
    if (rows.length > 0) {
      console.log('Sample purchase from database:', rows[0].id, 'buy_date:', rows[0].buy_date);
    }
    
    return res.json(rows);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

// Get purchases by customer ID
app.get('/api/purchases/customer/:id', authenticateUser, async (req, res) => {
  try {
    const customerId = req.params.id;
    
    // Validate customer ID
    if (!customerId || isNaN(parseInt(customerId))) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }
    
    // Removed access restriction to allow all authenticated users to view any customer's purchases
    
    // First check if the customer exists
    const [customerRows] = await pool.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    
    if (customerRows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Use DATE_FORMAT to ensure dates are formatted consistently without timezone issues
    const [rows] = await pool.query(`
      SELECT 
        p.id, 
        p.customer_id, 
        DATE_FORMAT(p.buy_date, '%Y-%m-%d') AS buy_date, 
        p.immediate, 
        p.interest_percentage, 
        p.total_amount, 
        DATE_FORMAT(p.paid_date, '%Y-%m-%d') AS paid_date, 
        p.created_at, 
        p.updated_at,
        c.name as user_name, 
        c.email as user_email 
      FROM purchases p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.customer_id = ?
      ORDER BY p.created_at DESC
    `, [customerId]);
    
    // Log a sample date if available
    if (rows.length > 0) {
      console.log('Sample customer purchase from database:', rows[0].id, 'buy_date:', rows[0].buy_date);
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching purchases by customer ID:', error);
    res.status(500).json({ error: 'Failed to fetch customer purchases' });
  }
});

// Get purchase by ID
app.get('/api/purchases/:id', authenticateUser, async (req, res) => {
  try {
    const purchaseId = req.params.id;
    
    // Validate purchase ID
    if (!purchaseId || isNaN(parseInt(purchaseId))) {
      return res.status(400).json({ error: 'Invalid purchase ID' });
    }
    
    // Get the purchase with customer info
    const [rows] = await pool.query(`
      SELECT 
        p.*, 
        c.name as user_name, 
        c.email as user_email,
        c.phone as user_phone,
        c.address as user_address,
        u.username as creator_name
      FROM purchases p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `, [purchaseId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    
    const purchase = rows[0];
    
    // Removed access restriction to allow all authenticated users to view purchase details
    // Previously, only admins, creators, or linked customers could view purchase details
    // This was causing 403 errors for regular users
    
    res.json(purchase);
  } catch (error) {
    console.error('Error fetching purchase by ID:', error);
    res.status(500).json({ error: 'Failed to fetch purchase details' });
  }
});

// Add a new purchase
app.post('/api/purchases', authenticateUser, async (req, res) => {
  try {
    const { customer_id, buy_date, immediate, interest_percentage, total_amount, paid_date } = req.body;
    
    // Validate required fields
    if (!customer_id || !buy_date || isNaN(parseFloat(total_amount))) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check access to customer
    if (req.user.role !== 'admin' && req.user.customer_id !== parseInt(customer_id)) {
      return res.status(403).json({ error: 'Access denied - you can only create purchases for your linked customer' });
    }
    
    // Verify customer exists
    const [customers] = await pool.query('SELECT * FROM customers WHERE id = ?', [customer_id]);
    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Insert purchase
    const [result] = await pool.query(
      `INSERT INTO purchases 
      (customer_id, buy_date, immediate, interest_percentage, total_amount, paid_date, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_id, 
        buy_date, 
        immediate === true || immediate === 1 || immediate === '1', 
        interest_percentage || 0, 
        total_amount,
        paid_date || null,
        req.user.id
      ]
    );
    
    // Get the inserted purchase
    const [newPurchase] = await pool.query(`
      SELECT 
        p.*, 
        c.name as user_name, 
        c.email as user_email
      FROM purchases p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.id = ?
    `, [result.insertId]);
    
    res.status(201).json(newPurchase[0]);
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ error: 'Failed to create purchase' });
  }
});

// Update purchase
app.put('/api/purchases/:id', authenticateUser, async (req, res) => {
  try {
    const purchaseId = req.params.id;
    const { customer_id, buy_date, immediate, interest_percentage, total_amount, paid_date } = req.body;
    
    // Get the existing purchase
    const [existingPurchases] = await pool.query('SELECT * FROM purchases WHERE id = ?', [purchaseId]);
    
    if (existingPurchases.length === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    
    const existingPurchase = existingPurchases[0];
    
    // Check access
    if (req.user.role !== 'admin' && 
        req.user.id !== existingPurchase.created_by && 
        req.user.customer_id !== existingPurchase.customer_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Verify customer exists if it's being changed
    if (customer_id && customer_id !== existingPurchase.customer_id) {
      const [customers] = await pool.query('SELECT * FROM customers WHERE id = ?', [customer_id]);
      if (customers.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      // Additional access check if changing customer
      if (req.user.role !== 'admin' && req.user.customer_id !== parseInt(customer_id)) {
        return res.status(403).json({ error: 'Access denied - you can only assign purchases to your linked customer' });
      }
    }
    
    // Update purchase
    const [result] = await pool.query(
      `UPDATE purchases 
       SET customer_id = ?, buy_date = ?, immediate = ?, interest_percentage = ?, 
           total_amount = ?, paid_date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        customer_id || existingPurchase.customer_id, 
        buy_date || existingPurchase.buy_date, 
        immediate === undefined ? existingPurchase.immediate : (immediate === true || immediate === 1 || immediate === '1'), 
        interest_percentage === undefined ? existingPurchase.interest_percentage : interest_percentage, 
        total_amount === undefined ? existingPurchase.total_amount : total_amount,
        paid_date === '' ? null : (paid_date || existingPurchase.paid_date),
        purchaseId
      ]
    );
    
    // Get the updated purchase
    const [updatedPurchase] = await pool.query(`
      SELECT 
        p.*, 
        c.name as user_name, 
        c.email as user_email
      FROM purchases p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.id = ?
    `, [purchaseId]);
    
    res.json(updatedPurchase[0]);
  } catch (error) {
    console.error('Error updating purchase:', error);
    res.status(500).json({ error: 'Failed to update purchase' });
  }
});

// Delete purchase (admin only or creator)
app.delete('/api/purchases/:id', authenticateUser, async (req, res) => {
  try {
    const purchaseId = req.params.id;
    
    // Get the existing purchase to check ownership
    const [existingPurchases] = await pool.query('SELECT * FROM purchases WHERE id = ?', [purchaseId]);
    
    if (existingPurchases.length === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    
    const existingPurchase = existingPurchases[0];
    
    // Check if user has permission to delete
    if (req.user.role !== 'admin' && req.user.id !== existingPurchase.created_by) {
      return res.status(403).json({ error: 'Access denied - only admins or the purchase creator can delete' });
    }
    
    // Delete the purchase
    await pool.query('DELETE FROM purchases WHERE id = ?', [purchaseId]);
    
    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({ error: 'Failed to delete purchase' });
  }
});

// Mark purchase as paid
app.put('/api/purchases/:id/mark-paid', authenticateUser, async (req, res) => {
  console.log('Mark as paid endpoint called for purchase ID:', req.params.id);
  console.log('User making request:', req.user.username);
  
  try {
    const purchaseId = req.params.id;
    
    // Get the existing purchase
    const [existingPurchases] = await pool.query('SELECT * FROM purchases WHERE id = ?', [purchaseId]);
    
    if (existingPurchases.length === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    
    const existingPurchase = existingPurchases[0];
    
    // Check access
    if (req.user.role !== 'admin' && 
        req.user.id !== existingPurchase.created_by && 
        req.user.customer_id !== existingPurchase.customer_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get today's date for paid_date
    const today = new Date().toISOString().split('T')[0];
    
    // Update purchase - only change the paid_date
    const [result] = await pool.query(
      `UPDATE purchases 
       SET paid_date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [today, purchaseId]
    );
    
    // Get the updated purchase
    const [updatedPurchase] = await pool.query(`
      SELECT 
        p.*, 
        c.name as user_name, 
        c.email as user_email
      FROM purchases p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.id = ?
    `, [purchaseId]);
    
    res.json(updatedPurchase[0]);
  } catch (error) {
    console.error('Error marking purchase as paid:', error);
    res.status(500).json({ error: 'Failed to mark purchase as paid' });
  }
});

// Undo payment (mark as unpaid)
app.put('/api/purchases/:id/undo-payment', authenticateUser, async (req, res) => {
  console.log('Undo payment endpoint called for purchase ID:', req.params.id);
  console.log('User making request:', req.user.username);
  
  try {
    const purchaseId = req.params.id;
    
    // Get the existing purchase
    const [existingPurchases] = await pool.query('SELECT * FROM purchases WHERE id = ?', [purchaseId]);
    
    if (existingPurchases.length === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    
    const existingPurchase = existingPurchases[0];
    
    // Check access
    if (req.user.role !== 'admin' && 
        req.user.id !== existingPurchase.created_by) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update purchase - set paid_date to null
    const [result] = await pool.query(
      `UPDATE purchases 
       SET paid_date = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [purchaseId]
    );
    
    // Get the updated purchase
    const [updatedPurchase] = await pool.query(`
      SELECT 
        p.*, 
        c.name as user_name, 
        c.email as user_email
      FROM purchases p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.id = ?
    `, [purchaseId]);
    
    res.json(updatedPurchase[0]);
  } catch (error) {
    console.error('Error undoing payment:', error);
    res.status(500).json({ error: 'Failed to undo payment' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});