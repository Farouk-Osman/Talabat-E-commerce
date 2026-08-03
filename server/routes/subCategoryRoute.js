const express = require('express');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  createSubCategoryValidator,
  getSubCategoryByIdValidator,
  updateSubCategoryValidator,
  deleteSubCategoryValidator,
} = require('../utils/validators/subCategoryValidator');


const {
  createSubCategory,
  getSubCategories,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
  setCategoryIdToBody,
} = require('../services/subCategoryServices');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .post(
    protect,
    restrictTo('admin'),
    express.json(),
    setCategoryIdToBody,
    createSubCategoryValidator,
    createSubCategory
  )
  .get(getSubCategories);
router
  .route('/:id')
  .get(getSubCategoryByIdValidator, getSubCategoryById)
  .put(
    protect,
    restrictTo('admin'),
    updateSubCategoryValidator,
    updateSubCategory
  )
  .delete(
    protect,
    restrictTo('admin'),
    deleteSubCategoryValidator,
    deleteSubCategory
  );

module.exports = router;