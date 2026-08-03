const express = require('express');
const { uploadSingleImage } = require('../utils/uploadImage');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  updateMyPassword,
  deleteMe,
} = require('../services/userService');
const {
  createUserValidator,
  getUserByIdValidator,
  updateUserValidator,
  deleteUserValidator,
  updateMeValidator,
  updateMyPasswordValidator,
} = require('../utils/validators/userValidator');

const router = express.Router();

// Everything below requires a valid token
router.use(protect);

// ---- Self-service (logged-in user acting on themselves) ----
router.get('/me', getMe, getUserById);
router.put(
  '/updateMe',
  uploadSingleImage('profileImage', 'uploads/users'),
  updateMeValidator,
  updateMe
);
router.put('/updateMyPassword', updateMyPasswordValidator, updateMyPassword);
router.delete('/deleteMe', deleteMe);

// ---- Admin-only CRUD ----
router.use(restrictTo('admin'));

router
  .route('/')
  .post(
    uploadSingleImage('profileImage', 'uploads/users'),
    createUserValidator,
    createUser
  )
  .get(getUsers);
router
  .route('/:id')
  .get(getUserByIdValidator, getUserById)
  .put(
    uploadSingleImage('profileImage', 'uploads/users'),
    updateUserValidator,
    updateUser
  )
  .delete(deleteUserValidator, deleteUser);

module.exports = router;
