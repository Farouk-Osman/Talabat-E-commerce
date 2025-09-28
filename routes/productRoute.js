const express = require('express');
const { uploadProductImages } = require('../utils/uploadImage');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  createProductValidator,
  getProductValidator,
  updateProductValidator,
  deleteProductValidator,
} = require('../utils/validators/productValidator');
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require('../services/productServices');

const router = express.Router();
router
  .route('/')
  .post(protect, restrictTo('admin'), uploadProductImages(), createProductValidator, createProduct);
router.route('/').get(getProducts);
router
  .route('/:id')
  .get(getProductValidator, getProduct)
  .put(protect, restrictTo('admin'), uploadProductImages(), updateProductValidator, updateProduct)
  .delete(protect, restrictTo('admin'), deleteProductValidator, deleteProduct);


module.exports = router;


