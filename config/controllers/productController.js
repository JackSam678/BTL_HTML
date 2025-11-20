// 引入path模块处理绝对路径
const path = require('path');
// 从当前目录（controllers）向上一级找db.js
const { pool } = require(path.join(__dirname, '../db'));

// 产品列表接口
exports.getProducts = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE status = 1 ORDER BY sort_order DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('获取产品失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 产品详情接口
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE id = ? AND status = 1',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('获取产品详情失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};


