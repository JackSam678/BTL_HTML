const path = require('path');
const dotenv = require('dotenv');
const app = require('./app');
const { testDbConnection, closePool } = require('./db');

// Load env from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3000;

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
