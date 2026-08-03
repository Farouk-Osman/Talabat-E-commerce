// NOTE: the 4th `next` param is required — Express only registers a middleware
// as an error handler when its arity is exactly 4. Without it, thrown ApiErrors
// (401/403/404…) fall through to Express's default handler and surface as 500.
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-use-before-define
    sendErrorForDev(err, res);
  } else {
    // eslint-disable-next-line no-use-before-define
    sendErrorForProd(err, res);
  }
};

const sendErrorForDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorForProd = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

module.exports = globalErrorHandler;
