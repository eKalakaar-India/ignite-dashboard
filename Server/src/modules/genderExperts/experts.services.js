import { randomUUID } from 'node:crypto';
import ApiError from '../../utils/ApiError.js';
import { HTTP_STATUS } from '../../utils/constants.js';
import ExpertRepository from './experts.repository.js';
import StorageRepository from '../uploads/uploads.repository.js';
import { buildUniqueFileName } from '../../utils/fileNameHelper.js';
import {
  getAllowedMimeTypes,
  getStoragePath,
  MAX_FILES_PER_UPLOAD,
  MAX_IMAGE_SIZE_BYTES,
} from '../../config/folderConfig.js';
import { logger } from '../../utils/logger.js';
import {
  createQualitativeAnalysisSchema,
  createSessionRequestSchema,
} from './experts.validations.js';
import { getSessionDocumentationStatus } from '../../utils/sessionDocumentation.js';

const SESSION_CREATION_ROLES = [
  'Super Admin',
  'Project Head',
  'Regional Expert',
  'Gender Expert',
  'Gender Experts',
];

const SESSION_UPLOAD_FIELDS = {
  session_images: { folder: 'session_media', subfolder: 'images', sessionField: 'session_images_links' },
  geo_tagged_photos: { folder: 'geo-taggedPhotos', sessionField: 'geo-taggedPhotos_links' },
  attendance_sheets: { folder: 'attendance_sheets', sessionField: 'attendance_sheets_links' },
  consent_forms: { folder: 'consent_forms', sessionField: 'consent_forms_links' },
  feedback_forms: { folder: 'feedback_forms', sessionField: 'feedback_forms_links' },
};

function validateSessionFiles(files = {}) {
  if (!files || typeof files !== 'object' || Array.isArray(files)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Uploaded session files must be grouped by category.');
  }

  const errors = [];
  for (const [field, fieldFiles] of Object.entries(files)) {
    const config = SESSION_UPLOAD_FIELDS[field];
    if (!config) {
      errors.push({ field, message: 'Unsupported session upload category.' });
      continue;
    }
    if (!Array.isArray(fieldFiles)) {
      errors.push({ field, message: 'Uploaded files must be provided as a list.' });
      continue;
    }
    if (fieldFiles.length > MAX_FILES_PER_UPLOAD) {
      errors.push({ field, message: `A maximum of ${MAX_FILES_PER_UPLOAD} files is allowed per category.` });
      continue;
    }

    const allowedMimeTypes = getAllowedMimeTypes(config.folder, config.subfolder);
    fieldFiles.forEach((file, index) => {
      const filePath = `${field}.${index}`;
      if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
        errors.push({ field: filePath, message: 'The uploaded file is empty or invalid.' });
        return;
      }
      if (!allowedMimeTypes.includes(file.mimetype)) {
        errors.push({ field: filePath, message: `Unsupported file type "${file.mimetype}".` });
      }
      if (
        file.buffer.length > MAX_IMAGE_SIZE_BYTES ||
        (Number.isFinite(file.size) && file.size > MAX_IMAGE_SIZE_BYTES)
      ) {
        errors.push({
          field: filePath,
          message: `File exceeds the ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB limit.`,
        });
      }
      if (typeof file.originalname !== 'string' || !file.originalname.trim()) {
        errors.push({ field: filePath, message: 'The uploaded file must have a name.' });
      }
    });
  }

  if (errors.length) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid session uploads.', errors);
  }
}

class ExpertService {
  constructor() {
    this.repository = new ExpertRepository();
    this.storageRepository = new StorageRepository();
  }

  async createSession(request, files, requester) {
    if (!SESSION_CREATION_ROLES.includes(requester?.role)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not allowed to create outreach sessions.');
    }

    const validatedRequest = createSessionRequestSchema.safeParse(request);
    if (!validatedRequest.success) {
      throw new ApiError(
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        'Session creation request is invalid.',
        validatedRequest.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }))
      );
    }
    validateSessionFiles(files);

    const uploadedPaths = [];
    const sessionId = randomUUID();
    let sessionInsertAttempted = false;
    let qualitativeWriteAttempted = false;
    const {
      session: validatedSession,
      qualitative_report: qualitativeReport,
    } = validatedRequest.data;
    const sessionPayload = validatedSession;

    try {
      const payload = { ...sessionPayload };
      for (const [fileField, config] of Object.entries(SESSION_UPLOAD_FIELDS)) {
        const fieldFiles = files?.[fileField] || [];
        if (fieldFiles.length === 0) continue;
        const storageFolder = getStoragePath(config.folder, config.subfolder);
        const existingPaths = Array.isArray(payload[config.sessionField])
          ? payload[config.sessionField]
          : [];
        const filePaths = [];
        for (const file of fieldFiles) {
          const path = `${storageFolder}/${buildUniqueFileName(file.originalname)}`;
          uploadedPaths.push(path);
          await this.storageRepository.uploadFile(path, file.buffer, file.mimetype);
          filePaths.push(path);
        }
        payload[config.sessionField] = [...existingPaths, ...filePaths];
      }

      sessionInsertAttempted = true;
      const createdSession = await this.repository.createSession({
        ...payload,
        id: sessionId,
        status: getSessionDocumentationStatus(payload),
        expert_id: payload.expert_id ?? requester.id ?? null,
      });

      if (qualitativeReport) {
        qualitativeWriteAttempted = true;
        await this.repository.createQualitativeAnalysis({
          ...qualitativeReport,
          session_id: sessionId,
        });
      }

      logger.info({ state: createdSession.state, district: createdSession.district }, 'Session Created');
      return createdSession;
    } catch (error) {
      const cleanupErrors = await this.rollbackSessionCreation({
        sessionId,
        uploadedPaths,
        qualitativeReport,
        qualitativeWriteAttempted,
        sessionInsertAttempted,
      });
      if (cleanupErrors.length) {
        logger.error(
          { creationError: error?.message, cleanupErrors, sessionId },
          'Session creation failed and rollback was incomplete'
        );
        throw new ApiError(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          'Session creation failed and rollback was incomplete.',
          [
            { field: 'session', message: error?.message || 'Unknown creation error.' },
            ...cleanupErrors.map(({ field, message }) => ({ field, message })),
          ]
        );
      }
      throw error;
    }
  }

  async rollbackSessionCreation({
    sessionId,
    uploadedPaths,
    qualitativeReport,
    qualitativeWriteAttempted,
    sessionInsertAttempted,
  }) {
    const cleanupErrors = [];

    if (qualitativeWriteAttempted) {
      try {
        await this.repository.deleteQualitativeAnalysis(
          sessionId,
          qualitativeReport.outreach_type
        );
      } catch (error) {
        cleanupErrors.push({
          field: 'qualitative_report_cleanup',
          message: error.message || 'Unable to remove the qualitative report.',
        });
      }
    }

    let canRemoveUploadedFiles = true;
    if (sessionInsertAttempted) {
      try {
        await this.repository.deleteSession(sessionId);
      } catch (error) {
        canRemoveUploadedFiles = false;
        cleanupErrors.push({
          field: 'session_cleanup',
          message: error.message || 'Unable to remove the partially created session.',
        });
      }
    }

    if (canRemoveUploadedFiles && uploadedPaths.length) {
      try {
        await this.storageRepository.removeFiles(uploadedPaths);
      } catch (error) {
        cleanupErrors.push({
          field: 'upload_cleanup',
          message: error.message || 'Unable to remove the uploaded session files.',
        });
      }
    }

    return cleanupErrors;
  }

  async createQualitativeAnalysis(payload, requester) {
    if (!['Super Admin', 'Project Head', 'Regional Expert', 'Gender Expert', 'Gender Experts'].includes(requester.role)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not allowed to submit qualitative analyses');
    }

    const validatedReport = createQualitativeAnalysisSchema.safeParse(payload);
    if (!validatedReport.success) {
      throw new ApiError(
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        'Qualitative report is invalid.',
        validatedReport.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }))
      );
    }

    const report = validatedReport.data;
    const session = await this.repository.fetchSessionById(report.session_id);
    if (session.type_of_session?.toUpperCase() !== report.outreach_type) {
      throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Qualitative report type must match the selected session');
    }
    if (['School Visit', 'ITI Visit'].includes(session.type_of_outreach)) {
      throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Qualitative analysis is not available for visit sessions.');
    }

    return this.repository.createQualitativeAnalysis(report);
  }

  async updateSession(payload, requester, id) {
    if (!['Super Admin', 'Project Head', 'Regional Expert', 'Gender Expert', 'Gender Experts'].includes(requester.role)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not allowed to update outreach sessions');
    }

    const current = await this.repository.fetchSessionById(id);
    const merged = createSessionSchema.safeParse({ ...current, ...payload });
    if (!merged.success) {
      throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Validation failed', merged.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })));
    }
    if (!merged.data.type_of_session || !merged.data.type_of_outreach) {
      throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Session type and activity are required.', [
        {
          field: !merged.data.type_of_session ? 'type_of_session' : 'type_of_outreach',
          message: 'Session type and activity must satisfy the sessions check constraint.',
        },
      ]);
    }
    const session = await this.repository.updateSession({
      ...payload,
      status: getSessionDocumentationStatus({ ...current, ...payload }),
    }, id);

    logger.info({state:session.state, district: session.district}, 'Session Updated');
    return session;
  }

  async getDailyReport(){
    const session = await this.repository.fetchDailyReportSession()
    logger.info('Report Fetched');
    return session;
  }

  async getAllSessions() {
    const sessions = await this.repository.fetchAllSessions();
    return sessions;
  }

  async fetchSessionsByExperts(id){
    const sessions = await this.repository.fetchSessionsByExperts(id);
    return sessions;
  }

  async getSessionById(id) {
    return this.repository.fetchSessionById(id);
  }

}

export default ExpertService;
