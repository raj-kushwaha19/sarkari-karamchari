const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log full error server-side only
  logger.error(`[ErrorHandler] ${req.method} ${req.path}`, err);

  // Never expose stack traces, paths, or DB errors to client
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: 'Something went wrong. Please try again.',
  });
};

module.exports = errorHandler;
