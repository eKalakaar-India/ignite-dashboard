import asyncHandler from '../../middlewares/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { HTTP_STATUS } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import ExpertService from './experts.services.js';


const expertService  = new ExpertService()

export const createSession = asyncHandler(async(req, res)=>{
  const session = await expertService.createSession(req.body, req.files, req.user);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Session Created Successfully', session));
})

export const createQualitativeAnalysis = asyncHandler(async(req, res)=>{
  const { session_id: sessionId, ...report } = req.body;
  const analysis = await expertService.createQualitativeAnalysis(
    { ...report, session_id: sessionId },
    req.user
  );
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Qualitative report saved successfully', analysis));
})

export const updateSession = asyncHandler(async(req, res)=>{
    const id = req.params.id;
    const session = await expertService.updateSession(req.body, req.user, id);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success('Session Updated Successfully.', session))
})

export const fetchDailyReport = asyncHandler(async(req, res)=>{
  const session = await expertService.getDailyReport();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Report fetched successfully', session));
})

export const fetchSessionByExperts = asyncHandler(async(req, res)=>{
    const id = req.params.id
    const session = await expertService.fetchSessionsByExperts(id);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success('Session by experts fetched successfully', session)); 
})

export const fetchAllSession = asyncHandler(async(req, res)=>{
  const session = await expertService.getAllSessions();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Sessions fetched successfully', session));
})

export const fetchSessionById = asyncHandler(async(req, res)=>{
  const session = await expertService.getSessionById(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Session fetched successfully', session));
})