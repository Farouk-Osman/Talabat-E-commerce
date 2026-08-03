const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const userModel = require('../models/userModel');
const ApiError = require('../utils/apiError');
const config = require('../config/env');

const signToken = (id) =>
  jwt.sign({ id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

const sanitizeUser = (user) => {
  const obj = user.toObject();
  delete obj.password;
  delete obj.passwordResetCode;
  delete obj.passwordResetExpires;
  delete obj.passwordResetVerified;
  return obj;
};

// @desc   Register a new user
// @route  POST /api/v1/auth/signup
// @access Public
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError('name, email and password are required', 400);
  }
  const existing = await userModel.findOne({ email });
  if (existing) throw new ApiError('Email already in use', 400);

  // Role is NEVER taken from the request body — always defaults to "user".
  // Admins are created only via the protected admin user routes.
  const user = await userModel.create({ name, email, password });
  const token = signToken(user._id);
  res
    .status(201)
    .json({ status: 'success', token, data: { user: sanitizeUser(user) } });
});

// @desc   Login
// @route  POST /api/v1/auth/login
// @access Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError('Please provide email and password', 400);
  }
  const user = await userModel.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new ApiError('Incorrect email or password', 401);
  }
  const token = signToken(user._id);
  res
    .status(200)
    .json({ status: 'success', token, data: { user: sanitizeUser(user) } });
});

// @desc   Request a password reset code
// @route  POST /api/v1/auth/forgotPassword
// @access Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) throw new ApiError('No user found with that email', 404);

  // 6-digit reset code; store only its hash
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.passwordResetCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  user.passwordResetVerified = false;
  await user.save({ validateBeforeSave: false });

  // No mailer wired up: in non-production, surface the code so the flow is
  // testable. Swap this block for a real email send (nodemailer) in prod.
  if (!config.isProd) {
    // eslint-disable-next-line no-console
    console.log(`Password reset code for ${email}: ${resetCode}`);
    return res.status(200).json({
      status: 'success',
      message: 'Reset code sent',
      ...(config.isProd ? {} : { resetCode }),
    });
  }
  res.status(200).json({ status: 'success', message: 'Reset code sent' });
});

// @desc   Verify the reset code
// @route  POST /api/v1/auth/verifyResetCode
// @access Public
const verifyResetCode = asyncHandler(async (req, res) => {
  const { resetCode } = req.body;
  const hashed = crypto.createHash('sha256').update(resetCode).digest('hex');
  const user = await userModel.findOne({
    passwordResetCode: hashed,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new ApiError('Reset code invalid or expired', 400);

  user.passwordResetVerified = true;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({ status: 'success' });
});

// @desc   Set a new password after code verification
// @route  POST /api/v1/auth/resetPassword
// @access Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) throw new ApiError('No user found with that email', 404);
  if (!user.passwordResetVerified) {
    throw new ApiError('Reset code not verified', 400);
  }

  user.password = newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;
  await user.save();

  const token = signToken(user._id);
  res.status(200).json({ status: 'success', token });
});

module.exports = {
  signup,
  login,
  signToken,
  forgotPassword,
  verifyResetCode,
  resetPassword,
};
