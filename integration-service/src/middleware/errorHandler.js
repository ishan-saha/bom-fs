// Global error handling middleware
function errorHandler(err, req, res, next) {
  console.error('❌ Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = 'Internal server error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = err.details;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service unavailable - database connection failed';
  } else if (err.message.includes('invalid input syntax')) {
    statusCode = 400;
    message = 'Invalid request format';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    details: process.env.NODE_ENV === 'development' ? details || err.message : undefined,
    timestamp: new Date().toISOString(),
    requestId: req.id || null
  });
}

// 404 error handler
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
    message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
