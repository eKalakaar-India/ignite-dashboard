import { z } from 'zod';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';

const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const data = req[source];
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Validation failed', errors));
    }

    req[source] = parsed.data;
    return next();
  } catch (error) {
    return next(error);
  }
};

export default validate;
