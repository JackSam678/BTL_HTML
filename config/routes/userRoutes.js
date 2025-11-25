const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const adminAuth = require('../middleware/adminAuth');


// 注册
router.post('/register', userController.register);

// 登录，返回 JWT
router.post('/login', userController.login);

// 列出所有用户（仅管理员可用）
router.get('/', adminAuth, userController.listUsers);

// 更新用户（仅管理员可用）
router.patch('/:id', adminAuth, userController.updateUser);

// 删除用户（仅管理员可用）
router.delete('/:id', adminAuth, userController.deleteUser);

module.exports = router;
