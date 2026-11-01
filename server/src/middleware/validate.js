const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Runs express-validator chains and converts failures into a 400 ApiError
 * with a structured `details` array: [{ field, message }]
 */
function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((err) => ({
    field: err.path || err.param || 'body',
    message: err.msg,
  }));

  const first = details[0] ? details[0].message : 'Validation failed';
  return next(ApiError.badRequest(first, details));
}

module.exports = { validate };
