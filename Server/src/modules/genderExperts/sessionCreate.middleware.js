import ApiError from '../../utils/ApiError.js';
import { HTTP_STATUS } from '../../utils/constants.js';

function parseJsonField(value, fieldName, required = false) {
  if (value === undefined || value === '') {
    if (required) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, `${fieldName} is required.`);
    }
    return undefined;
  }
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `${fieldName} must contain valid JSON.`);
  }
}

export function parseSessionCreateRequest(req, res, next) {
  try {
    if (req.is('multipart/form-data')) {
      req.body = {
        session: parseJsonField(req.body.sessionData, 'sessionData', true),
        qualitative_report: parseJsonField(req.body.qualitativeReport, 'qualitativeReport'),
      };
    } else if (req.body.session === undefined) {
      req.body = { session: req.body };
    }
    next();
  } catch (error) {
    next(error);
  }
}
