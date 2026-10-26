import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    logger.warn({ err, path: req.originalUrl, method: req.method }, 'Request failed');
    return res.status(err.statusCode).json(
      ApiResponse.error(err.message, err.errors, err.statusCode),
    );
  }

  const statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = 'Internal server error';
  logger.error({ err, path: req.originalUrl, method: req.method }, 'Unhandled error');

  return res.status(statusCode).json(ApiResponse.error(message, [], statusCode));
};

export default errorHandler;
