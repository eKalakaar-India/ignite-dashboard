import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1] || req.cookies?.token;

  if (!token) {
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired token'));
  }
};

export const authorize = (allowedRoles = []) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(HTTP_STATUS.FORBIDDEN, 'Insufficient permissions'));
  }

  return next();
};
