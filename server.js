import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ag_shop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as test');
    res.json({ message: 'Database connection successful', data: rows });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});

// Add a new user
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, address) VALUES (?, ?, ?, ?)',
      [name, email, phone || null, address || null]
    );
    
    res.status(201).json({ 
      message: 'User added successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ message: 'Failed to add user', error: error.message });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const id = req.params.id;
    
    const [result] = await pool.query(
      'UPDATE users SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      [name, email, phone, address, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

// Get purchases by user ID
app.get('/api/users/:id/purchases', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM purchases WHERE user_id = ? ORDER BY buy_date DESC', [req.params.id]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    res.status(500).json({ message: 'Failed to fetch user purchases', error: error.message });
  }
});

// Get all purchases
app.get('/api/purchases', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.name as user_name 
      FROM purchases p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.buy_date DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: 'Failed to fetch purchases', error: error.message });
  }
});

// Add a new purchase
app.post('/api/purchases', async (req, res) => {
  try {
    const { user_id, buy_date, immediate, deposit_percentage, total_amount, due_date } = req.body;
    
    // Validate required fields
    if (!user_id || !buy_date || immediate === undefined || !total_amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO purchases (user_id, buy_date, immediate, deposit_percentage, total_amount, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, buy_date, immediate, deposit_percentage, total_amount, due_date || null]
    );
    
    res.status(201).json({ 
      message: 'Purchase added successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error adding purchase:', error);
    res.status(500).json({ message: 'Failed to add purchase', error: error.message });
  }
});

// Get purchase by ID
app.get('/api/purchases/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.address as user_address 
      FROM purchases p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching purchase:', error);
    res.status(500).json({ message: 'Failed to fetch purchase', error: error.message });
  }
});

// Update purchase
app.put('/api/purchases/:id', async (req, res) => {
  try {
    const { user_id, buy_date, immediate, deposit_percentage, total_amount, due_date } = req.body;
    const id = req.params.id;
    
    // Validate required fields
    if (!user_id || !buy_date || immediate === undefined || deposit_percentage === undefined || !total_amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate data types and ranges
    if (isNaN(parseFloat(deposit_percentage)) || parseFloat(deposit_percentage) < 0 || parseFloat(deposit_percentage) > 100) {
      return res.status(400).json({ message: 'Deposit percentage must be a number between 0 and 100' });
    }

    if (isNaN(parseFloat(total_amount)) || parseFloat(total_amount) <= 0) {
      return res.status(400).json({ message: 'Total amount must be a positive number' });
    }

    // Check if user exists
    const [userExists] = await pool.query('SELECT id FROM users WHERE id = ?', [user_id]);
    if (userExists.length === 0) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Convert string values to appropriate types and format dates
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : null;
    const purchaseData = [
      parseInt(user_id),
      formatDate(buy_date),
      Boolean(immediate),
      parseFloat(deposit_percentage),
      parseFloat(total_amount),
      formatDate(due_date),
      id
    ];
    
    const [result] = await pool.query(
      'UPDATE purchases SET user_id = ?, buy_date = ?, immediate = ?, deposit_percentage = ?, total_amount = ?, due_date = ? WHERE id = ?',
      purchaseData
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    
    res.json({ message: 'Purchase updated successfully' });
  } catch (error) {
    console.error('Error updating purchase:', error);
    // Check for foreign key constraint violation
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ 
      message: 'Failed to update purchase', 
      error: error.message,
      details: 'Please check that all fields have valid values and try again'
    });
  }
});

// Delete purchase
app.delete('/api/purchases/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM purchases WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    
    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({ message: 'Failed to delete purchase', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});