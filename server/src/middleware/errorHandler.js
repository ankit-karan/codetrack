const ApiError = require('../utils/ApiError');

/** 404 for unmatched API routes. */
function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Centralized error handler.
 * Converts Mongoose validation/cast/duplicate-key errors into clean JSON
 * without ever leaking stack traces or internals to the client.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // Mongoose: schema validation failures
  if (err.name === 'ValidationError') {
    statusCode = 400;
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = details[0] ? details[0].message : 'Validation failed';
  }

  // Mongoose: malformed ObjectId in the URL
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for '${err.path}': ${err.value}`;
  }

  // MongoDB: duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field.charAt(0).toUpperCase()}${field.slice(1)} already exists.`;
    details = [{ field, message }];
  }

  // Body parser: malformed JSON payload
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON in request body.';
  }

  if (statusCode >= 500) {
    // Log server-side only; never expose internals to clients.
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { errors: details } : {}),
  });
}

module.exports = { notFound, errorHandler };
