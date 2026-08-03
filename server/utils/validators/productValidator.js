const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddlewares');
const categoryModel = require('../../models/categoryModel');
const subCategoryModel = require('../../models/subCategory');

const createProductValidator = [
  check('title')
    .notEmpty()
    .withMessage('Product title is required')
    .isLength({ min: 3 })
    .withMessage('Product title must be at least 3 characters long')
    .isLength({ max: 100 })
    .withMessage('Product title must be at most 100 characters long'),
  check('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ max: 500 })
    .withMessage('Product description must be at most 500 characters long'),
  check('price')
    .notEmpty()
    .withMessage('Product price is required')
    .isFloat({ min: 0 })
    .withMessage('Product price must be a positive number')
    .isNumeric()
    .withMessage('Product price must be a number'),
  check('category')
    .notEmpty()
    .withMessage('Product category is required')
    .isMongoId()
    .withMessage('Invalid Product category ID')
    .custom((value) =>
      categoryModel.findById(value).then((category) => {
        if (!category) {
          return Promise.reject(new Error('Category not found'));
        }
      })
    ),
  check('subcategories')
    .optional()
    .isArray()
    .withMessage('Subcategories must be an array')
    .custom((value) =>
      subCategoryModel
        .find({ _id: { $exists: true, $in: value } })
        .then((subcategories) => {
          if (subcategories.length !== value.length) {
            return Promise.reject(
              new Error('One or more Subcategories not found')
            );
          }
        })
    )
    .custom((value, { req }) => subCategoryModel.find({ category: req.body.category }).then((subcategories) => {
      const subcategoryIdsInDB = [];
        subcategories.forEach(subcategory => subcategoryIdsInDB.push(subcategory._id.toString()));
        const checker = value.every(v => subcategoryIdsInDB.includes(v));
        if (!checker) {
          return Promise.reject(
            new Error('One or more Subcategories do not belong to the specified category')
          );
        }
    })),
  check('brand')
    .notEmpty()
    .withMessage('Product brand is required')
    .isMongoId()
    .withMessage('Invalid Product brand ID'),
  check('quantity')
    .notEmpty()
    .withMessage('Product quantity is required')
    .isInt({ min: 0 })
    .withMessage('Product quantity must be a non-negative integer'),
  check('priceAfterDiscount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Product price after discount must be a positive number')
    .isNumeric()
    .withMessage('Product price after discount must be a number')
    .custom((value, { req }) => {
      if (value >= req.body.price) {
        throw new Error(
          'Product price after discount must be less than the regular price'
        );
      }
      return true;
    }),

  validatorMiddleware,
];


const getProductValidator = [
    check('id').isMongoId().withMessage('Invalid Product ID'),
    validatorMiddleware,
];


const updateProductValidator = [
    check('id').isMongoId().withMessage('Invalid Product ID'),
    check('title')
        .optional()
        .isLength({ min: 3 })
        .withMessage('Product title must be at least 3 characters long')
        .isLength({ max: 100 })
        .withMessage('Product title must be at most 100 characters long'),
    check('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Product description must be at most 500 characters long'),
    check('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Product price must be a positive number')
        .isNumeric()
        .withMessage('Product price must be a number'),
    check('category')
        .optional()
        .isMongoId()
        .withMessage('Invalid Product category ID'),
    check('subcategories')
        .optional()
        .isArray()
        .withMessage('Subcategories must be an array')
        .custom((value) => {
            if (!value.every((id) => id.match(/^[0-9a-fA-F]{24}$/))) {
                throw new Error('Invalid Subcategory ID in the array');
            }
            return true;
        }),
    check('brand')
        .optional()
        .isMongoId()
        .withMessage('Invalid Product brand ID'),
    check('quantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Product quantity must be a non-negative integer'),
    validatorMiddleware,
];


const deleteProductValidator = [
    check('id').isMongoId().withMessage('Invalid Product ID'),
    validatorMiddleware,
];


const filterProductsValidator = [
    check('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('minPrice must be a positive number'),
    check('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('maxPrice must be a positive number'),
    check('category')
        .optional()
        .isMongoId()
        .withMessage('Invalid Product category ID'),
    check('brand')
        .optional()
        .isMongoId()
        .withMessage('Invalid Product brand ID'),
    check('title')
        .optional()
        .isString()
        .withMessage('Title must be a string'),
    check('sort')
        .optional()
        .isIn(['price', '-price', 'title', '-title', 'createdAt', '-createdAt'])
        .withMessage('Invalid sort value'),
    check('rating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Rating must be a number between 0 and 5'),
    validatorMiddleware,
];

module.exports = {
    createProductValidator,
    getProductValidator,
    updateProductValidator,
    deleteProductValidator,
    filterProductsValidator
};