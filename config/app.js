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
// Products endpoints disabled: productRoutes removed from API to stop realtime product module
// If you need to re-enable, uncomment the following line:
// app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
// Admin endpoints
app.use('/api/admin', require('./routes/adminRoutes'));

// Export app so tests can require it without starting a server
// If this file is run directly (node config/app.js), start the server.
if (require.main === module) {
  const http = require('http');
  const server = http.createServer(app);
  server.listen(PORT, async () => {
    try {
      await testDbConnection();
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    } catch (err) {
      console.error('数据库连接失败，服务器将退出', err);
      process.exit(1);
    }
  });

  const graceful = async () => {
    console.log('收到停止信号，正在优雅关闭...');
    server.close(() => {
      closePool().then(() => process.exit(0)).catch(() => process.exit(0));
    });
  };

  process.on('SIGINT', graceful);
  process.on('SIGTERM', graceful);
}

module.exports = app;

