// config/app.js（仅修改路由引用部分）
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { testDbConnection, closePool } = require('./db'); // db helpers

// Load env from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10kb' })); // limit payload size

// Health check
app.get('/health', (req, res) => res.json({ ok: true, timestamp: Date.now() }));

// Root
app.get('/', (req, res) => {
  res.json({ message: '博特勒机器人API服务运行中' });
});

// Routes
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/products', require('./routes/productRoutes'));

const server = app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  testDbConnection();
});

// Graceful shutdown
async function shutdown(signal) {
  console.log(`收到 ${signal}，正在优雅关闭...`);
  server.close(async (err) => {
    if (err) {
      console.error('关闭服务器出错:', err);
      process.exit(1);
    }
    await closePool();
    console.log('已优雅关闭');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

