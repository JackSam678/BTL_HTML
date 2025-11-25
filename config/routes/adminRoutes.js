const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

// 管理统计
router.get('/stats', adminAuth, adminController.stats);

module.exports = router;
