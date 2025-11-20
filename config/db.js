// config/db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from project root if not already loaded by app
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Use environment variables; provide sensible defaults for local dev
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '123456';
const DB_NAME = process.env.DB_NAME || 'btl_robotics';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
const CONNECTION_LIMIT = process.env.DB_CONNECTION_LIMIT ? Number(process.env.DB_CONNECTION_LIMIT) : 10;

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT,
  connectionLimit: CONNECTION_LIMIT,
  charset: 'utf8mb4'
});

async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
  } catch (err) {
    console.error('❌ 数据库连接失败:', err.message);
  }
}

// Helper to close pool gracefully
async function closePool() {
  try {
    await pool.end();
    console.log('数据库连接池已关闭');
  } catch (err) {
    console.error('关闭连接池失败:', err.message);
  }
}

module.exports = { pool, testDbConnection, closePool };
