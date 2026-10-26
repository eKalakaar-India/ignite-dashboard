import { z } from 'zod';

export const registerAdminSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('A valid email is required'),
  phone_no: z.string().min(10, 'Phone number is required').max(10, 'Phone number must be 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/^(?=.*[A-Z])(?=.*\d)/, 'Password must include one uppercase letter and one number'),
  role: z.enum(['Super Admin', 'Regional Expert']),
});

export const loginSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').regex(/^(?=.*[A-Z])(?=.*\d)/, 'Password must include one uppercase letter and one number'),
});

export const authIdParamSchema = z.object({
  id: z.string().min(1, 'User id is required'),
});
