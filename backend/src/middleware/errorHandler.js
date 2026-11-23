import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  logger.error({
    err: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  }, 'Unhandled HTTP Request Error');

  // Handle PayloadTooLargeError from body-parser
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Payload Too Large: email body or attachments exceed allowable request size.'
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}
