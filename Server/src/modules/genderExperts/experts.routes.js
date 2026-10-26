import { Router } from 'express'
import validate from '../../middlewares/validate.js';
import {createSession, createQualitativeAnalysis, updateSession, fetchSessionByExperts, fetchAllSession, fetchDailyReport, fetchSessionById} from './experts.controllers.js'
import { authenticate, authorize } from '../../middlewares/auth.js';
import { handleSessionCreateUpload } from '../../middlewares/upload.middleware.js';
import {parseSessionCreateRequest} from './sessionCreate.middleware.js';
import {createSessionRequestSchema, createQualitativeAnalysisSchema, updateSessionSchema} from './experts.validations.js'

const router = Router()

router.post('/create-session', authenticate, authorize(['Regional Expert', 'Gender Expert', 'Gender Experts', 'Super Admin', 'Project Head']), handleSessionCreateUpload, parseSessionCreateRequest, validate(createSessionRequestSchema, 'body'), createSession)
router.post('/qualitative', authenticate, authorize(['Regional Expert', 'Gender Expert', 'Gender Experts', 'Super Admin', 'Project Head']), validate(createQualitativeAnalysisSchema, 'body'), createQualitativeAnalysis)
router.patch('/update-session/:id', authenticate, authorize(['Regional Expert', 'Gender Expert', 'Gender Experts', 'Super Admin', 'Project Head']), validate(updateSessionSchema, 'body'), updateSession)
router.get('/dailyreport', authenticate, authorize(['Regional Expert', 'Gender Expert', 'Gender Experts', 'Super Admin']), fetchDailyReport)
router.get('/fetchby-expert/:id', authenticate, authorize(['Regional Expert', 'Gender Expert', 'Gender Experts', 'Super Admin']), fetchSessionByExperts)
router.get('/fetchall', authenticate, authorize(['Super Admin']), fetchAllSession)
router.get('/:id', authenticate, authorize(['Regional Expert', 'Gender Expert', 'Gender Experts', 'Super Admin', 'Project Head']), fetchSessionById)


export default router;