const { ZodError } = require('zod');
const logger = require('../config/logger');

function handleValidationError(req, res, next) {
  return (error) => {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    next(error);
  };
}

function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

module.exports = { handleValidationError, errorHandler, notFoundHandler };
