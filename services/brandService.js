const brandModel = require('../models/brand');
const handlersFactory = require('./handlersFactory');

// Use handlersFactory with image support: single image field `image`
const options = {
  singleImageField: 'image',
  folderByField: { image: 'uploads/brands' },
  sizes: { image: 600 },
  returnImageFields: ['image'],
};

const createBrand = handlersFactory.createOne(brandModel, options);
const getBrands = handlersFactory.getAll(brandModel, options);
const getBrandById = handlersFactory.getOne(brandModel, null, options);
const updateBrand = handlersFactory.updateOne(brandModel, options);
const deleteBrand = handlersFactory.deleteOne(brandModel);

module.exports = {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
};
