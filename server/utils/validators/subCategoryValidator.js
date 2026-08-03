const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddlewares');

const getSubCategoryByIdValidator = [
  check('id').isMongoId().withMessage('Invalid SubCategory ID'),
  validatorMiddleware,
];
const updateSubCategoryValidator = [
  check('id').isMongoId().withMessage('Invalid SubCategory ID'),
  check('name')
    .notEmpty()
    .withMessage('SubCategory name is required')
    .isLength({ min: 3 })
    .withMessage('SubCategory name must be at least 3 characters long')
    .isLength({ max: 50 })
    .withMessage('SubCategory name must be at most 50 characters long'),
  check('category')
    .notEmpty()
    .withMessage('SubCategory must belong to a Category')
    .isMongoId()
    .withMessage('Invalid Category ID'),
  validatorMiddleware,
];

const deleteSubCategoryValidator = [
  check('id').isMongoId().withMessage('Invalid SubCategory ID'),
  validatorMiddleware,
];

const createSubCategoryValidator = [
  check('name')
    .notEmpty()
    .withMessage('SubCategory name is required')
    .isLength({ min: 3 })
    .withMessage('SubCategory name must be at least 3 characters long')
    .isLength({ max: 50 })
    .withMessage('SubCategory name must be at most 50 characters long'),
  check('category')
    .optional() // Make category optional in body since it might come from URL
    .isMongoId()
    .withMessage('Invalid Category ID format'),
  check('categoryId') // Add validation for URL parameter
    .optional()
    .isMongoId()
    .withMessage('Invalid Category ID format in URL'),
  validatorMiddleware,
];

module.exports = {
  getSubCategoryByIdValidator,
  updateSubCategoryValidator,
  deleteSubCategoryValidator,
  createSubCategoryValidator,
};
