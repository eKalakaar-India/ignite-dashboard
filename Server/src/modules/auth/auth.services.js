import ApiError from '../../utils/ApiError.js';
import { HTTP_STATUS } from '../../utils/constants.js';
import AuthRepository from './auth.repository.js';
import { logger } from '../../utils/logger.js';

class AuthService {
  constructor() {
    this.repository = new AuthRepository();
  }

  async registerUser(payload, requester) {
    if (requester.role !== 'Super Admin' && requester.role !== 'Project Head') {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Only super admins and project heads can register users');
    }

    const existingUser = await this.repository.findUserByEmail(payload.email);
    if (existingUser) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'User with this email already exists');
    }

    const hashedPassword = await this.repository.hashPassword(payload.password);
    const user = await this.repository.createUser({
      name: payload.name,
      email:payload.email,
      password_hash: hashedPassword,
      phone_no:payload.phone_no,
      role: payload.role || 'Regional Expert',
      created_at: new Date().toISOString(),
    });

    logger.info({ email: payload.email, role: payload.role }, 'User registered');
    return this.sanitizeUser(user);
  }

  async login(payload) {
    const user = await this.repository.findUserByEmail(payload.email);
    logger.info(payload)
    if (!user) {
      logger.warn({ email: payload.email }, 'Failed login attempt');
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials');
    }
    if(user.isBlocked){
      logger.warn({ email: payload.email }, 'Blocked user login attempt');
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'User is blocked. Please contact the administrator.');
    }

    const isValidPassword = await this.repository.comparePassword(payload.password, user.password_hash);
    if (!isValidPassword) {
      logger.warn({ email: payload.email }, 'Failed login attempt');
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials');
    }

    const token = this.repository.signToken(user);
    logger.info({ userId: user.id, role: user.role }, 'User logged in');
    return { user: this.sanitizeUser(user), token };
  }

  async getCurrentUser(userId) {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }
    return this.sanitizeUser(user);
  }

  async changePassword(userId, payload) {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    const isValidPassword = await this.repository.comparePassword(payload.currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Current password is incorrect');
    }

    const hashedPassword = await this.repository.hashPassword(payload.newPassword);
    await this.repository.updateUser(userId, { password_hash: hashedPassword });

    return { message: 'Password changed successfully' };
  }

  sanitizeUser(user) {
    const { password_hash, ...rest } = user;
    return rest;
  }

  async getAllUsers() {
    const users = await this.repository.getAllUsers();
    return users.map(user => this.sanitizeUser(user));
  }

  async blockUser(userId) {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }
    await this.repository.updateUser(userId, { isBlocked: true });
    logger.info({ userId }, 'User blocked');
    return { message: 'User blocked successfully' };
  }

  async deleteUser(userId) {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }
    await this.repository.deleteUser(userId);
    logger.info({ userId }, 'User deleted');
    return { message: 'User deleted successfully' };
  }

  async getMobilizers(){
    const res  = await this.repository.findUserByRole("Mobilizer")
    if(!res){
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Invalid Role.")
    }
    logger.info("Fetched users by role.");
    return res
  }
}

export default AuthService;
