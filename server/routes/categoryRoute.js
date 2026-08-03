const express = require('express');
const subCategoryRoute = require('./subCategoryRoute');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  getCategoryByIdValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
  createCategoryValidator,
} = require('../utils/validators/categoryValidator');

const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../services/categoryService');

// Nested route for subcategories
router.use('/:categoryId/subcategories', subCategoryRoute);

// Category routes

router
  .route('/')
  .post(
    protect,
    restrictTo('admin'),
    createCategoryValidator,
    createCategory
  )
  .get(getCategories);
router
  .route('/:id')
  .get(getCategoryByIdValidator, getCategoryById)
  .put(
    protect,
    restrictTo('admin'),
    updateCategoryValidator,
    updateCategory
  )
  .delete(
    protect,
    restrictTo('admin'),
    deleteCategoryValidator,
    deleteCategory
  );

module.exports = router;
