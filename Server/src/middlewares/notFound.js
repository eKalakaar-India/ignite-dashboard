import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';

const notFound = (req, res, next) => {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Resource not found'));
};

export default notFound;
