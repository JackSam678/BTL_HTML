// 数据库连接配置
module.exports = {
  host: 'localhost',       // 数据库主机地址（本地为localhost）
  user: 'root',            // 数据库用户名（默认多为root）
  password: '123456', // 替换为你的数据库密码（如root用户密码）
  database: 'btl_robotics', // 数据库名称（必须与创建的数据库一致）
  port: 3306,              // MySQL默认端口
  connectionLimit: 10,     // 连接池最大连接数
  charset: 'utf8mb4'       // 字符集
};
// 引入配置
const dbConfig = require('../config/db.config.js');
// 使用mysql模块连接数据库
const mysql = require('mysql2/promise');

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功！');
    connection.release();
  } catch (err) {
    console.error('数据库连接失败：', err);
  }
}

testConnection();
