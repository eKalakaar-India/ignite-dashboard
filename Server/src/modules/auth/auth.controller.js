import asyncHandler from '../../middlewares/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { HTTP_STATUS } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import AuthService from './auth.services.js';

const authService = new AuthService();

export const registerAdmin = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body, req.user);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('User registered successfully', user));
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.cookie('token', result.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  logger.info('Login success!')
//   console.log(result);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Login successful', { user: result.user, token : result.token }));
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Logout successful', null));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('User fetched successfully', user));
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user.userId, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Password changed successfully', result));
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await authService.getAllUsers();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Users fetched successfully', users));
})

export const blockUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const users = await authService.blockUser(userId)
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Users Blocked successfully'));
})

export const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  await authService.deleteUser(userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Users Deleted successfully'));
})

export const getGenderExperts = asyncHandler(async(req, res) => {
  const mobilizers = await authService.getMobilizers();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Fetched Mobilizers successfully', mobilizers));
})

