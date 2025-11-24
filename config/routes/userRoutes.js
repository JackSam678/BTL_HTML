const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const adminAuth = require('../middleware/adminAuth');

// 注册
router.post('/register', userController.register);

// 列出所有用户（仅管理员可用）
router.get('/', adminAuth, userController.listUsers);

module.exports = router;
