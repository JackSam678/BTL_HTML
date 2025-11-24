const { pool } = require('../db');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ success: false, message: '缺少必填字段' });

    // Basic checks
    const [exists] = await pool.execute('SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1', [email, username]);
    if (exists.length > 0) return res.status(409).json({ success: false, message: '用户名或邮箱已存在' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash, role, is_super) VALUES (?, ?, ?, ?, ?)',
      [username, email, hash, 'user', 0]
    );

    res.status(201).json({ success: true, message: '注册成功', data: { id: result.insertId } });
  } catch (err) {
    console.error('用户注册失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// Simple helper to list users (admin-only access should be enforced by middleware in routes)
exports.listUsers = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, username, email, role, is_super, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('查询用户失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};
