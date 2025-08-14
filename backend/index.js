require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcrypt');
const authenticateToken=require('./auth')
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/register', async (req, res) => {
  const { username, email, password, phone } = req.body;

  if (!username || !email || !password || !phone) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // 🔐 Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      'INSERT INTO users (username, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, hashedPassword, phone]
    );

    res.status(201).json({
      message: 'User registered',
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        phone: result.rows[0].phone
        // Do not include the password in the response
      }
    });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      res.status(409).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});
// Use a secret key stored in .env
const JWT_SECRET = process.env.JWT_SECRET || 'yoursecretkey';

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    // Create a JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is protected', user: req.user });
});

// POST /api/products - Add a new product (requires auth)
app.post('/api/products', authenticateToken, async (req, res) => {
  const { name, category, price, quantity } = req.body;
  // const userId = req.user.id;

 if (!name || !category || !price || quantity === undefined) {
  return res.status(400).json({ message: 'All fields are required' });
}

  try {
  const result = await db.query(
  `INSERT INTO products (name, category, price, quantity)
   VALUES ($1, $2, $3, $4) RETURNING *`,
  [name, category, price, quantity]
);

    res.status(201).json({
      message: 'Product created',
      product: result.rows[0],
    });
  } catch (err) {
    console.error('Error inserting product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, category, price } = req.body;

  try {
    const result = await db.query(
      `UPDATE products SET name = $1, category = $2, price = $3 WHERE id = $4 RETURNING *`,
      [name, category, price, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated', product: result.rows[0] });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/products/:id/in', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  try {
const result=await db.query(
  `UPDATE products SET quantity = quantity + $1 WHERE id = $2 RETURNING *`,
  [amount, id]
);

await db.query(
  `INSERT INTO product_transactions (product_id, type, amount) VALUES ($1, 'in', $2)`,
  [id, amount]
);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product quantity increased', product: result.rows[0] });
  } catch (err) {
    console.error('Error increasing quantity:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/products/:id/out', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }

  try {
    // Step 1: Get current quantity
    const current = await db.query('SELECT quantity FROM products WHERE id = $1', [id]);

    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const currentQty = current.rows[0].quantity;

    // Step 2: Check if enough quantity is available
    if (amount > currentQty) {
      return res.status(400).json({
        message: `Insufficient stock. Available quantity is ${currentQty}`,
      });
    }

    // Step 3: Deduct and update
    const result = await db.query(
      `UPDATE products SET quantity = quantity - $1 WHERE id = $2 RETURNING *`,
      [amount, id]
    );

    // Step 4: Log the transaction
    await db.query(
      `INSERT INTO product_transactions (product_id, type, amount) VALUES ($1, 'out', $2)`,
      [id, amount]
    );

    res.json({
      message: 'Product quantity updated',
      product: result.rows[0],
    });
  } catch (err) {
    console.error('Error processing product out:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// app.get('/api/reports/transactions', authenticateToken, async (req, res) => {
//   try {
//     const result = await db.query(`
//       SELECT pt.id, p.name AS product_name, pt.type, pt.amount, pt.timestamp
//       FROM product_transactions pt
//       JOIN products p ON pt.product_id = p.id
//       ORDER BY pt.timestamp DESC
//     `);

//     res.json(result.rows);
//   } catch (err) {
//     console.error('Error fetching transaction report:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

app.get('/api/reports/transactions', authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;

  let query = `
    SELECT pt.id, p.name AS product_name,p.category AS product_category, pt.type, pt.amount, pt.timestamp
    FROM product_transactions pt
    JOIN products p ON pt.product_id = p.id
  `;
  const values = [];

  if (startDate && endDate) {
    query += ' WHERE pt.timestamp BETWEEN $1 AND $2';
    values.push(startDate, endDate);
  }

  query += ' ORDER BY pt.timestamp DESC';

  try {
    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching filtered transactions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`);
});