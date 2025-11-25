// integration/seed.js
// Seed script to create tables and insert demo data using config/db.js pool
const path = require('path');
const { pool } = require(path.join('..', 'config', 'db'));
const bcrypt = require('bcryptjs');

async function run() {
  try {
    console.log('Starting DB seed...');

    // Create tables if missing (idempotent)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company VARCHAR(255) DEFAULT '',
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        phone VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) DEFAULT NULL,
        series VARCHAR(255) DEFAULT NULL,
        category_id INT DEFAULT NULL,
        description TEXT,
        specification TEXT,
        price DECIMAL(12,2) DEFAULT 0.00,
        image_url VARCHAR(512) DEFAULT '',
        image VARCHAR(512) DEFAULT '',
        status TINYINT DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // users 表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'user',
        is_super TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure required columns exist (handle older schemas)
    try {
      const [cols] = await pool.execute("SHOW COLUMNS FROM users");
      const names = cols.map(c => c.Field);
      if (!names.includes('password_hash')) {
        await pool.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL AFTER email");
        console.log('已为 users 表添加 password_hash 列');
      }
      // If role exists but is not varchar, change its type to VARCHAR
      const roleCol = cols.find(c => c.Field === 'role');
      if (!roleCol) {
        await pool.execute("ALTER TABLE users ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'user'");
        console.log('已为 users 表添加 role 列');
      } else if (!/^varchar/i.test(roleCol.Type)) {
        await pool.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(32) NOT NULL DEFAULT 'user'");
        console.log('已将 users.role 字段修改为 VARCHAR(32)');
      }
      if (!names.includes('is_super')) {
        await pool.execute("ALTER TABLE users ADD COLUMN is_super TINYINT(1) DEFAULT 0");
        console.log('已为 users 表添加 is_super 列');
      }

      // If legacy `password` column exists (plain-text storage), allow NULL so we can insert password_hash safely
      if (names.includes('password')) {
        try {
          await pool.execute("ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL DEFAULT NULL");
          console.log('已将 users.password 字段修改为可空以兼容迁移');
        } catch (e) {
          console.warn('无法修改 users.password 字段:', e.message);
        }
      }
    } catch (e) {
      // If SHOW/ALTER fails, log and continue — later insert may still fail and be reported
      console.warn('检测/调整 users 表列时出错（可忽略）：', e.message);
    }

    // Ensure a super admin exists (idempotent)
    const superAdmin = {
      username: process.env.SUPER_ADMIN_USERNAME || 'admin',
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!'
    };

    // Check existing
    const [rows] = await pool.execute('SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1', [superAdmin.email, superAdmin.username]);
    if (rows.length === 0) {
      const hash = await bcrypt.hash(superAdmin.password, 10);
      await pool.execute(
        `INSERT INTO users (username, email, password_hash, role, is_super) VALUES (?, ?, ?, 'admin', 1)`,
        [superAdmin.username, superAdmin.email, hash]
      );
      console.log('已创建超级管理员用户:', superAdmin.username, superAdmin.email);
    } else {
      console.log('超级管理员已存在，跳过创建');
    }

    // Insert demo products adapted to existing schema (some deployments have different columns)
    // We'll insert into columns likely present: name, series, category_id, price, description, specification, image_url, status, sort_order
    const demoProducts = [
      {
        name: '高精度机械臂',
        series: '工业',
        category_id: 1,
        price: 128000.00,
        description: '重复定位精度±0.01mm，负载能力5-50kg，适用于精密装配、物料搬运等场景',
        specification: '关节数6，自适应控制，支持多种末端执行器',
        image_url: '/images/composite.66a232ce.png',
        status: 1,
        sort_order: 100
      },
      {
        name: '智能服务机器人',
        series: '服务',
        category_id: 2,
        price: 89000.00,
        description: '搭载多模态交互系统，支持语音识别、人脸识别，适用于酒店、机场等场景',
        specification: '多传感器融合，导航与避障',
        image_url: '/images/composite.66a232ce.png',
        status: 1,
        sort_order: 90
      },
      {
        name: '防爆巡检机器人',
        series: '特种',
        category_id: 3,
        price: 156000.00,
        description: 'IP68防护等级，支持红外测温、气体检测，适用于化工、电力等危险环境',
        specification: '防爆外壳，远程遥控',
        image_url: '/images/composite.66a232ce.png',
        status: 1,
        sort_order: 80
      }
    ];

    for (const p of demoProducts) {
      await pool.execute(
        `INSERT INTO products (name, series, category_id, price, description, specification, image_url, status, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), price=VALUES(price), specification=VALUES(specification), image_url=VALUES(image_url), status=VALUES(status), sort_order=VALUES(sort_order)`,
        [p.name, p.series, p.category_id, p.price, p.description, p.specification, p.image_url, p.status, p.sort_order]
      );
    }

    console.log('DB seed completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

run();
