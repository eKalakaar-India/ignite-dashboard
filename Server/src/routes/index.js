import { Router } from 'express'
import authRoutes from '../modules/auth/auth.routes.js';
import expertRoutes from '../modules/genderExperts/experts.routes.js'
import uploadRoutes from '../modules/uploads/uploads.routes.js'
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js'

const router = Router();

router.use('/auth', authRoutes);
router.use('/session', expertRoutes);
router.use('/uploads', uploadRoutes)
router.use('/dashboard', dashboardRoutes)

export default router;