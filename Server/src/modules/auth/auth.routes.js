import {Router} from 'express';
import validate from '../../middlewares/validate.js';
import { changePasswordSchema, loginSchema, registerAdminSchema } from './auth.validations.js';
import { changePassword, getCurrentUser, login, logout, registerAdmin, getAllUsers, blockUser, deleteUser, getGenderExperts } from './auth.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router()

router.post('/login', validate(loginSchema, 'body'), login);
router.post('/register', authenticate, authorize(['Super Admin']), validate(registerAdminSchema, 'body'), registerAdmin);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);
router.get('/fetch-experts', authenticate, authorize(['Super Admin']), getGenderExperts);
router.patch('/user-block/:id', authenticate, authorize(['Super Admin']), blockUser)
router.get('/fetch', authenticate, authorize(['Super Admin']), getAllUsers)

export default router