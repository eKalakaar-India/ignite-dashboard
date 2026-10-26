import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../../config/supabase.js';
import { env } from '../../config/env.js';
import ApiError from '../../utils/ApiError.js';
import { HTTP_STATUS } from '../../utils/constants.js';

class AuthRepository {
  constructor() {
    this.table = 'afc_giz_users';
  }

  async createUser(payload) {
    const { data, error } = await supabase.from(this.table).insert(payload).select().single();
    if (error) throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Unable to create user', [{ field: 'user', message: error.message }]);
    return data;
  }

  async findUserByEmail(email) {
    const { data, error } = await supabase.from(this.table).select('*').eq('email', email).maybeSingle();
    if (error) throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Unable to fetch user', [{ field: 'email', message: error.message }]);
    return data;
  }

  async findUserById(id) {
    const { data, error } = await supabase.from(this.table).select('*').eq('id', id).maybeSingle();
    if (error) throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Unable to fetch user', [{ field: 'id', message: error.message }]);
    return data;
  }

  async findUserByRole(role) {
    const { data, error } = await supabase.from(this.table).select('*').eq('role', role);
    if (error) throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Unable to fetch users by role', [{ field: 'User by Role', message: error.message }]);
    return data;
  }

  async updateUser(id, payload) {
    const { data, error } = await supabase.from(this.table).update(payload).eq('id', id).select().single();
    if (error) throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Unable to update user', [{ field: 'id', message: error.message }]);
    return data;
  }

  async getAllUsers (){
    const { data, error } = await supabase.from(this.table).select('*');
    if (error) throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Unable to fetch users', [{ field: 'users', message: error.message }]);
    return data;
  }

  async deleteUser (id){
    const {data, error} = await supabase.from(this.table).delete().eq('id', id);
    if (error) throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Unable to Delete users', [{ field: 'users', message: error.message }]);
    return data;
  }

  async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  signToken(user) {
    return jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  }
}

export default AuthRepository;
