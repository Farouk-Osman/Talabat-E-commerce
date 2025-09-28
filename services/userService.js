const userModel = require('../models/userModel');
const handlersFactory = require('./handlersFactory');

// enable profile image processing via handlersFactory
const options = {
  singleImageField: 'profileImage',
  folderByField: { profileImage: 'uploads/users' },
  sizes: { profileImage: 400 },
  returnImageFields: ['profileImage'],
};

const createUser = handlersFactory.createOne(userModel, options);
const getUsers = handlersFactory.getAll(userModel, options);
const getUserById = handlersFactory.getOne(userModel, null, options);
const updateUser = handlersFactory.updateOne(userModel, options);
const deleteUser = handlersFactory.deleteOne(userModel);

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};