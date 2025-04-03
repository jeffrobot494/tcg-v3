// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Pool } = require('pg');  // Import PostgreSQL client

const app = express();
app.use(cors());
app.use(express.json());

// Create a connection pool to PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Now using .env
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ dbTime: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database connection error');
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('Nigger!');
});

// Start the server
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
