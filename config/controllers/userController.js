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

// List users with pagination; hide sensitive fields
exports.listUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
    const offset = (page - 1) * limit;

    // Optional role filter
    const role = req.query.role;

    let countSql = 'SELECT COUNT(*) as cnt FROM users';
    let dataSql = 'SELECT id, username, email, role, is_super, created_at FROM users';
    const params = [];
    if (role) {
      countSql += ' WHERE role = ?';
      dataSql += ' WHERE role = ?';
      params.push(role);
    }
    dataSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    // Get total
    const [cntRows] = await pool.execute(countSql, role ? [role] : []);
    const total = cntRows && cntRows[0] ? cntRows[0].cnt : 0;

    // Get page data
    const qParams = params.concat([limit, offset]);
    const [rows] = await pool.execute(dataSql, qParams);

    // Ensure no sensitive fields are returned (password_hash etc.)
    const safeRows = rows.map(r => ({ id: r.id, username: r.username, email: r.email, role: r.role, is_super: !!r.is_super, created_at: r.created_at }));

    res.json({
      success: true,
      data: safeRows,
      meta: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('查询用户失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};
