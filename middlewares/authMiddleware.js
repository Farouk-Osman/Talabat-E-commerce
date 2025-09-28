/* eslint-disable import/no-extraneous-dependencies */
const { verify } = require('jsonwebtoken');
const ApiError = require('../utils/apiError');
const { findById } = require('../models/userModel');

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

async function protect(req, res, next) {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next(new ApiError('You are not logged in!', 401));
  try {
    const decoded = verify(token, SECRET_KEY);
    const currentUser = await findById(decoded.id);
    if (!currentUser) return next(new ApiError('The user no longer exists.', 401));
    req.user = currentUser;
    next();
  } catch (err) {
    return next(new ApiError('Invalid token or token expired', 401));
  }
}

function restrictTo(...roles) { return (req, res, next) => {
  if (!req.user) return next(new ApiError('Not authenticated', 401));
  if (!roles.includes(req.user.role)) return next(new ApiError('You do not have permission to perform this action', 403));
  next();
};     }

module.exports = {
  protect,
  restrictTo
};
