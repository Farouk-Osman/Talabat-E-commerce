const express = require('express');
const { uploadSingleImage } = require('../utils/uploadImage');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../services/userService');

const router = express.Router();

router.route('/').post(uploadSingleImage('profileImage', 'uploads/users'), createUser).get(getUsers);
router.route('/:id').get(getUserById).put(protect, uploadSingleImage('profileImage', 'uploads/users'), updateUser).delete(protect, restrictTo('admin'), deleteUser);

module.exports = router;
