// 错误写法（删除）
// const { pool } = require('../config/db');

// 正确写法（添加）
const { pool } = require('../db');  // 从 controllers 目录向上一级（即 config 目录）找 db.js

// 以下代码保持不变
exports.submitContact = async (req, res) => {
  try {
    const { name, email, company, subject, message, phone } = req.body;
    // 详细字段校验由路由中的中间件完成（validateContact），控制器假定通过校验的数据
    const [result] = await pool.execute(
      `INSERT INTO contacts 
       (name, email, company, subject, message, phone) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, company || '', subject, message, phone || '']
    );
    
    res.status(201).json({
      success: true,
      message: '消息发送成功，我们将尽快回复您！',
      data: { id: result.insertId }
    });
  } catch (err) {
    console.error('提交失败:', err);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

exports.getContacts = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('查询失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};
