const { pool } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

// Login - returns JWT token
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: '缺少邮箱或密码' });

    const [rows] = await pool.execute('SELECT id, username, email, password_hash, role, is_super FROM users WHERE email = ? LIMIT 1', [email]);
    if (!rows || rows.length === 0) return res.status(401).json({ success: false, message: '账号或密码错误' });

    const u = rows[0];
    const ok = await bcrypt.compare(password, u.password_hash || '');
    if (!ok) return res.status(401).json({ success: false, message: '账号或密码错误' });

    const secret = process.env.JWT_SECRET || process.env.ADMIN_TOKEN || 'change_this_secret';
    const payload = { id: u.id, username: u.username, email: u.email, role: u.role, is_super: u.is_super };
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });
    res.json({ success: true, data: { token, user: payload } });
  } catch (err) {
    console.error('用户登录失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// Update user role/is_super (admin only)
exports.updateUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: '无效用户 id' });
    const { role, is_super } = req.body;

    // Basic validation
    const updates = [];
    const params = [];
    if (role !== undefined) { updates.push('role = ?'); params.push(String(role)); }
    if (is_super !== undefined) { updates.push('is_super = ?'); params.push(Number(is_super) ? 1 : 0); }
    if (updates.length === 0) return res.status(400).json({ success: false, message: '没有提供要更新的字段' });

    params.push(id);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    const [result] = await pool.execute(sql, params);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: '用户未找到' });
    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    console.error('更新用户失败:', err);
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

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: '无效用户 id' });

    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: '用户未找到' });
    res.json({ success: true, message: '用户已删除' });
  } catch (err) {
    console.error('删除用户失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};
