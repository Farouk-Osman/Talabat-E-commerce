const handlersFactory = require('./handlersFactory');
const productModel = require('../models/productModel');

// Use handlersFactory with mixed images: imageCover (single) + images (array)
const options = {
  imageFields: ['images'],
  singleImageField: 'imageCover',
  folderByField: { imageCover: 'uploads/products', images: 'uploads/products' },
  sizes: { imageCover: 800, images: 800 },
  returnImageFields: ['imageCover', 'images'],
};

const createProduct = handlersFactory.createOne(productModel, options);
const getProducts = handlersFactory.getAll(productModel, options);
const getProduct = handlersFactory.getOne(
  productModel,
  'category brand subcategories',
  options
);
const updateProduct = handlersFactory.updateOne(productModel, options);
const deleteProduct = handlersFactory.deleteOne(productModel);

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};
