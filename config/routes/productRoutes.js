const express = require('express');
const router = express.Router();
// 从routes目录向上一级找controllers/productController.js
const productController = require('../controllers/productController');

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

module.exports = router;
