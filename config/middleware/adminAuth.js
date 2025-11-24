// Admin auth middleware: supports legacy ADMIN_TOKEN or JWT Bearer token.
// If JWT provided, verifies with JWT_SECRET and requires role==='admin' or is_super===1.
const jwt = require('jsonwebtoken');

module.exports = function adminAuth(req, res, next) {
  const adminToken = process.env.ADMIN_TOKEN || null;
  const jwtSecret = process.env.JWT_SECRET || process.env.ADMIN_TOKEN || null; // fallback

  // First, check x-admin-token header (legacy shared secret)
  const provided = req.get('x-admin-token') || req.query.admin_token;
  if (adminToken && provided && provided === adminToken) {
    // allow with simple flag set on request
    req.admin = { method: 'token' };
    return next();
  }

  // Next, check Authorization: Bearer <token>
  const auth = req.get('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7).trim();
    if (!jwtSecret) return res.status(500).json({ success: false, message: 'JWT secret 未配置' });
    try {
      const payload = jwt.verify(token, jwtSecret);
      // payload expected to contain role/is_super
      if (payload && (payload.is_super === 1 || payload.role === 'admin')) {
        req.admin = { method: 'jwt', user: payload };
        return next();
      }
      return res.status(403).json({ success: false, message: '需要管理员权限' });
    } catch (err) {
      return res.status(401).json({ success: false, message: '无效的令牌' });
    }
  }

  // No valid auth provided
  return res.status(401).json({ success: false, message: '未授权' });
};
