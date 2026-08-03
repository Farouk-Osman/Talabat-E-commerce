const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

const validatorMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => `${err.path}: ${err.msg}`)
      .join(', ');
    return next(new ApiError(errorMessages, 400));
  }
  next();
};

module.exports = validatorMiddleware;
