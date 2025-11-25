const { pool } = require('../db');

// 返回简单的管理统计信息（仅供管理员查看）
exports.stats = async (req, res) => {
  try {
    const [[usersCount]] = await pool.execute('SELECT COUNT(*) as cnt FROM users');
    const [[contactsCount]] = await pool.execute('SELECT COUNT(*) as cnt FROM contacts');
    // products 表可能存在也可能不存在于某些部署
    let productsCount = 0;
    try {
      const [[p]] = await pool.execute("SELECT COUNT(*) as cnt FROM products");
      productsCount = p.cnt || 0;
    } catch (e) {
      // ignore if products table missing
    }

    res.json({ success: true, data: { users: usersCount.cnt || 0, contacts: contactsCount.cnt || 0, products: productsCount } });
  } catch (err) {
    console.error('获取管理统计失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};
