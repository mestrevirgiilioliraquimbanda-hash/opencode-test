const { handleValidationError } = require('./errorHandler');

function validate(schema) {
  return (req, res, next) => {
    try {
      const dataToValidate = {};

      if (req.body && Object.keys(req.body).length > 0) {
        dataToValidate.body = req.body;
      }
      if (req.query && Object.keys(req.query).length > 0) {
        dataToValidate.query = req.query;
      }
      if (req.params && Object.keys(req.params).length > 0) {
        dataToValidate.params = req.params;
      }

      if (Object.keys(dataToValidate).length === 0) {
        return next();
      }

      schema.parse(dataToValidate);
      next();
    } catch (error) {
      handleValidationError(req, res, next)(error);
    }
  };
}

module.exports = validate;
