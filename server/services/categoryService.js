const categoryModel = require('../models/categoryModel');
const handlersFactory = require('./handlersFactory');

const options = {
  searchFields: ['name'],
};

// @desc   Create category      @route POST /api/v1/categories  @access admin
const createCategory = handlersFactory.createOne(categoryModel, options);
// @desc   List categories      @route GET  /api/v1/categories  @access public
const getCategories = handlersFactory.getAll(categoryModel, options);
// @desc   Get one category     @route GET  /api/v1/categories/:id @access public
const getCategoryById = handlersFactory.getOne(categoryModel, null, options);
// @desc   Update category      @route PUT  /api/v1/categories/:id @access admin
const updateCategory = handlersFactory.updateOne(categoryModel, options);
// @desc   Delete category      @route DELETE /api/v1/categories/:id @access admin
const deleteCategory = handlersFactory.deleteOne(categoryModel);

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  getCategoryById,
};
