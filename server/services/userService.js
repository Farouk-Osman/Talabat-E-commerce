const asyncHandler = require('express-async-handler');
const userModel = require('../models/userModel');
const handlersFactory = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const { signToken } = require('./authService');

// enable profile image processing via handlersFactory
const options = {
  singleImageField: 'profileImage',
  folderByField: { profileImage: 'uploads/users' },
  sizes: { profileImage: 400 },
  returnImageFields: ['profileImage'],
};

// ---- Admin CRUD (protected by protect + restrictTo('admin')) ----
const createUser = handlersFactory.createOne(userModel, options);
const getUsers = handlersFactory.getAll(userModel, options);
const getUserById = handlersFactory.getOne(userModel, null, options);
const updateUser = handlersFactory.updateOne(userModel, options);
const deleteUser = handlersFactory.deleteOne(userModel);

const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  delete obj.passwordResetCode;
  delete obj.passwordResetExpires;
  delete obj.passwordResetVerified;
  return obj;
};

// ---- Self-service (require `protect` only; act on req.user) ----

// Load the logged-in user's own record by rewriting the id param
const getMe = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

// @desc   Update own profile (name/email/phone/profileImage only)
// @route  PUT /api/v1/users/updateMe
// @access Private
const updateMe = asyncHandler(async (req, res, next) => {
  if (req.body.password || req.body.newPassword) {
    return next(
      new ApiError(
        'This route is not for password updates. Use /updateMyPassword.',
        400
      )
    );
  }

  // Whitelist the fields a user is allowed to change about themselves.
  // Never trust role/active/etc. from the body here.
  const allowed = ['name', 'email', 'phone'];
  const filtered = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) filtered[field] = req.body[field];
  });
  if (req.body.profileImage !== undefined) {
    filtered.profileImage = req.body.profileImage;
  }

  const updated = await userModel.findByIdAndUpdate(req.user._id, filtered, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ status: 'success', data: sanitizeUser(updated) });
});

// @desc   Update own password
// @route  PUT /api/v1/users/updateMyPassword
// @access Private
const updateMyPassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await userModel.findById(req.user._id).select('+password');
  if (!user || !(await user.correctPassword(currentPassword, user.password))) {
    return next(new ApiError('Your current password is incorrect', 401));
  }

  user.password = newPassword;
  await user.save();

  // Issue a fresh token: the old one predates passwordChangedAt and is rejected.
  const token = signToken(user._id);
  res.status(200).json({ status: 'success', token });
});

// @desc   Deactivate own account (soft delete)
// @route  DELETE /api/v1/users/deleteMe
// @access Private
const deleteMe = asyncHandler(async (req, res) => {
  await userModel.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({ status: 'success', data: null });
});

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  updateMyPassword,
  deleteMe,
};
