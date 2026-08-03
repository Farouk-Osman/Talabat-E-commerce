const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddlewares');

const getBrandValidator = [
  check('id').isMongoId().withMessage('Invalid Brand ID'),
    validatorMiddleware,
];
const updateBrandValidator = [
    check('id').isMongoId().withMessage('Invalid Brand ID'),
    check('name')
        .notEmpty()
        .withMessage('Brand name is required')
        .isLength({ min: 3 })
        .withMessage('Brand name must be at least 3 characters long')
        .isLength({ max: 50 })
        .withMessage('Brand name must be at most 50 characters long'),
    validatorMiddleware,
];
const deleteBrandValidator = [
    check('id').isMongoId().withMessage('Invalid Brand ID'),
    validatorMiddleware,
];

const createBrandValidator = [
    check('name')
        .notEmpty()
        .withMessage('Brand name is required')
        .isLength({ min: 3 })
        .withMessage('Brand name must be at least 3 characters long')
        .isLength({ max: 50 })
        .withMessage('Brand name must be at most 50 characters long'),
    validatorMiddleware,
];

module.exports = {
    getBrandValidator,
    updateBrandValidator,
    deleteBrandValidator,
    createBrandValidator,
};
