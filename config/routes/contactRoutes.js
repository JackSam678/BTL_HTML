const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const adminAuth = require('../middleware/adminAuth');
const { contactValidationRules, validateContact } = require('../middleware/validateContact');

// 提交联系表单（POST请求） — 先校验字段再交由控制器
router.post('/', contactValidationRules, validateContact, contactController.submitContact);

// 获取所有表单提交（GET请求，仅管理员使用，需配置 ADMIN_TOKEN）
router.get('/', adminAuth, contactController.getContacts);

module.exports = router;
