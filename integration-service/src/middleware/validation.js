// Validation middleware using Joi
function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorDetails
      });
    }
    
    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
}

module.exports = {
  validateRequest
};
