const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddlewares');

const getCategoryByIdValidator = [
  check('id').isMongoId().withMessage('Invalid category ID'),
  validatorMiddleware,
];
const updateCategoryValidator = [
  check('id').isMongoId().withMessage('Invalid category ID'),
  check('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 3 })
    .withMessage('Category name must be at least 3 characters long')
    .isLength({ max: 50 })
    .withMessage('Category name must be at most 50 characters long'),
  validatorMiddleware,
];

const deleteCategoryValidator = [
  check('id').isMongoId().withMessage('Invalid category ID'),
  validatorMiddleware,
];

const createCategoryValidator = [
  check('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 3 })
    .withMessage('Category name must be at least 3 characters long')
    .isLength({ max: 50 })
    .withMessage('Category name must be at most 50 characters long'),
  validatorMiddleware,
];

module.exports = {
  getCategoryByIdValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
  createCategoryValidator,
};
