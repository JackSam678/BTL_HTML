const { body, validationResult } = require('express-validator');

const contactValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('姓名为必填项')
    .isLength({ max: 100 }).withMessage('姓名不能超过100字符'),

  body('email')
    .trim()
    .notEmpty().withMessage('邮箱为必填项')
    .isEmail().withMessage('无效的邮箱格式')
    .isLength({ max: 200 }).withMessage('邮箱长度超出限制'),

  body('subject')
    .trim()
    .notEmpty().withMessage('主题为必填项')
    .isLength({ max: 150 }).withMessage('主题不能超过150字符'),

  body('message')
    .trim()
    .notEmpty().withMessage('消息内容为必填项')
    .isLength({ max: 2000 }).withMessage('消息长度不能超过2000字符'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('电话号码过长')
];

const validateContact = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

module.exports = {
  contactValidationRules,
  validateContact
};
