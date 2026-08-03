const subCategoryModel = require('../models/subCategory');
const ApiError = require('../utils/apiError');
const handlersFactory = require('./handlersFactory');

const setCategoryIdToBody = (req, res, next) => {
  try {
    // Initialize req.body if it doesn't exist
    if (!req.body) {
      req.body = {};
    }

    // If category is not in the body, check if it's in the params
    if (!req.body.category && req.params.categoryId) {
      req.body.category = req.params.categoryId;
    }

    // Validate that we have a category one way or another
    if (!req.body.category) {
      return next(
        new ApiError('Category ID is required either in body or URL', 400)
      );
    }

    next();
  } catch (error) {
    next(new ApiError('Error processing category ID', 400));
  }
};

const options = { searchFields: ['name'] };

const createSubCategory = handlersFactory.createOne(subCategoryModel, options);
const getSubCategories = handlersFactory.getAll(subCategoryModel, options);
const getSubCategoryById = handlersFactory.getOne(
  subCategoryModel,
  null,
  options
);
const updateSubCategory = handlersFactory.updateOne(subCategoryModel, options);
const deleteSubCategory = handlersFactory.deleteOne(subCategoryModel);


module.exports = {
  createSubCategory,
  getSubCategories,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
  setCategoryIdToBody,
};