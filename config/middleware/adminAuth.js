// Simple admin auth middleware using an environment token
module.exports = function adminAuth(req, res, next) {
  const adminToken = process.env.ADMIN_TOKEN || null;
  if (!adminToken) return res.status(403).json({ success: false, message: '管理员令牌未配置' });
  const provided = req.get('x-admin-token') || req.query.admin_token;
  if (!provided || provided !== adminToken) {
    return res.status(401).json({ success: false, message: '未授权' });
  }
  next();
};
