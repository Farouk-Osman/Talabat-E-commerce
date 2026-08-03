const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const userModel = require('../models/userModel');
const config = require('../config/env');

// Verify JWT, load the current user onto req.user
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next(new ApiError('You are not logged in!', 401));

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    return next(new ApiError('Invalid token or token expired', 401));
  }

  const currentUser = await userModel.findById(decoded.id);
  if (!currentUser) {
    return next(new ApiError('The user no longer exists.', 401));
  }

  // Reject tokens issued before the user last changed their password
  if (currentUser.passwordChangedAt) {
    const changedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );
    if (decoded.iat < changedTimestamp) {
      return next(
        new ApiError('Password recently changed, please log in again.', 401)
      );
    }
  }

  req.user = currentUser;
  next();
});

// Restrict a route to specific roles
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new ApiError('Not authenticated', 401));
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
