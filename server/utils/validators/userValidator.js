const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddlewares');

const createUserValidator = [
  check('name').notEmpty().withMessage('Name is required'),
  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address'),
  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  check('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  validatorMiddleware,
];

const getUserByIdValidator = [
  check('id').isMongoId().withMessage('Invalid user ID'),
  validatorMiddleware,
];

const updateUserValidator = [
  check('id').isMongoId().withMessage('Invalid user ID'),
  check('email').optional().isEmail().withMessage('Invalid email address'),
  check('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  validatorMiddleware,
];

const deleteUserValidator = [
  check('id').isMongoId().withMessage('Invalid user ID'),
  validatorMiddleware,
];

const updateMeValidator = [
  check('email').optional().isEmail().withMessage('Invalid email address'),
  validatorMiddleware,
];

const updateMyPasswordValidator = [
  check('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  check('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  validatorMiddleware,
];

module.exports = {
  createUserValidator,
  getUserByIdValidator,
  updateUserValidator,
  deleteUserValidator,
  updateMeValidator,
  updateMyPasswordValidator,
};
