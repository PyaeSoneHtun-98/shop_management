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
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ag_shop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
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
  } else {
    console.log('Database connected successfully');
    connection.release();
  }
});

// Handle unexpected errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed');
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
    const userId = req.params.id;
    
    // Validate user ID
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
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
app.get('/api/purchases/user/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Validate user ID
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // First check if the user exists
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const [rows] = await pool.query(`
      SELECT p.*, u.name as user_name, u.email as user_email 
      FROM purchases p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [userId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching purchases by user ID:', error);
    res.status(500).json({ error: 'Failed to fetch user purchases' });
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
    console.log('Received purchase data:', req.body);
    const { user_id, buy_date, immediate, interest_percentage, total_amount } = req.body;
    
    // Validate required fields
    if (!user_id) {
      console.log('Missing user_id');
      return res.status(400).json({ message: 'Missing user_id' });
    }
    if (!buy_date) {
      console.log('Missing buy_date');
      return res.status(400).json({ message: 'Missing buy_date' });
    }
    if (immediate === undefined) {
      console.log('Missing immediate flag');
      return res.status(400).json({ message: 'Missing immediate flag' });
    }
    if (total_amount === undefined) {
      console.log('Missing total_amount');
      return res.status(400).json({ message: 'Missing total_amount' });
    }
    
    // Convert values to appropriate types
    const parsedUserId = parseInt(user_id);
    const parsedImmediate = Boolean(immediate);
    const parsedInterestPercentage = parseFloat(interest_percentage || 0);
    const parsedTotalAmount = parseFloat(total_amount);
    
    // Additional validation
    if (isNaN(parsedUserId) || parsedUserId <= 0) {
      console.log('Invalid user_id:', user_id);
      return res.status(400).json({ message: 'Invalid user_id' });
    }
    
    if (isNaN(parsedTotalAmount) || parsedTotalAmount <= 0) {
      console.log('Invalid total_amount:', total_amount);
      return res.status(400).json({ message: 'Total amount must be a positive number' });
    }
    
    if (isNaN(parsedInterestPercentage) || parsedInterestPercentage < 0 || parsedInterestPercentage > 100) {
      console.log('Invalid interest_percentage:', interest_percentage);
      return res.status(400).json({ message: 'Interest percentage must be between 0 and 100' });
    }
    
    // Format date
    const formattedDate = new Date(buy_date).toISOString().split('T')[0];
    
    console.log('Inserting purchase with values:', {
      user_id: parsedUserId,
      buy_date: formattedDate,
      immediate: parsedImmediate,
      interest_percentage: parsedInterestPercentage,
      total_amount: parsedTotalAmount
    });
    
    const [result] = await pool.query(
      'INSERT INTO purchases (user_id, buy_date, immediate, interest_percentage, total_amount) VALUES (?, ?, ?, ?, ?)',
      [parsedUserId, formattedDate, parsedImmediate, parsedInterestPercentage, parsedTotalAmount]
    );
    
    console.log('Purchase inserted successfully, ID:', result.insertId);
    
    res.status(201).json({ 
      message: 'Purchase added successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error adding purchase:', error);
    
    // Check for specific error types
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Invalid user ID. User does not exist.' });
    }
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ message: 'Database schema error. Please check your database structure.' });
    }
    
    res.status(500).json({ 
      message: 'Failed to add purchase', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
    const { user_id, buy_date, immediate, interest_percentage, total_amount, paid_date } = req.body;
    const id = req.params.id;
    
    // Validate required fields
    if (!user_id || !buy_date || immediate === undefined || interest_percentage === undefined || !total_amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate data types and ranges
    if (isNaN(parseFloat(interest_percentage)) || parseFloat(interest_percentage) < 0 || parseFloat(interest_percentage) > 100) {
      return res.status(400).json({ message: 'Interest percentage must be a number between 0 and 100' });
    }

    if (isNaN(parseFloat(total_amount)) || parseFloat(total_amount) <= 0) {
      return res.status(400).json({ message: 'Total amount must be a positive number' });
    }

    // Check if user exists
    const [userExists] = await pool.query('SELECT id FROM users WHERE id = ?', [user_id]);
    if (userExists.length === 0) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Format dates
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : null;
    const formattedBuyDate = formatDate(buy_date);
    const formattedPaidDate = formatDate(paid_date);
    
    // If immediate is true and paid_date is not provided, set paid_date to today
    const finalPaidDate = immediate ? (formattedPaidDate || new Date().toISOString().split('T')[0]) : formattedPaidDate;
    
    const purchaseData = [
      parseInt(user_id),
      formattedBuyDate,
      Boolean(immediate),
      parseFloat(interest_percentage),
      parseFloat(total_amount),
      finalPaidDate,
      id
    ];
    
    const [result] = await pool.query(
      'UPDATE purchases SET user_id = ?, buy_date = ?, immediate = ?, interest_percentage = ?, total_amount = ?, paid_date = ? WHERE id = ?',
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