const express = require('express');
const { uploadSingleImage } = require('../utils/uploadImage');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const {
  createBrandValidator,
  getBrandValidator,
  updateBrandValidator,
  deleteBrandValidator,
} = require('../utils/validators/brandValidator');

const {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} = require('../services/brandService');

const router = express.Router();

router
  .route('/')
  .post(protect, restrictTo('admin'), uploadSingleImage('image'), createBrandValidator, createBrand)
  .get(getBrands);
router
    .route('/:id')
    .get(getBrandValidator, getBrandById)
    .put(protect, restrictTo('admin'), updateBrandValidator, updateBrand)
    .delete(protect, restrictTo('admin'), deleteBrandValidator, deleteBrand);

module.exports = router;