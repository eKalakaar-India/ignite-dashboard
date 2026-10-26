import { Router } from 'express'
import { getDashboard, getPerformance } from './dashboard.controllers.js'
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router()

router.get(
  '/',
  authenticate,
  getDashboard
)

router.get(
  '/performance',
  authenticate,
  authorize(['Super Admin']),
  getPerformance
)

export default router