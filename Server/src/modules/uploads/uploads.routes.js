// routes/uploadRoutes.js
import express from 'express';
import { handleImagesUpload }from '../../middlewares/upload.middleware.js';
import {
  validateFolderParams,
  validateUploadBody,
  validateFilesPresence,
} from './uploads.validations.js';
import { getSessionDocumentation, uploadImages }from './uploads.controllers.js';
import { authenticate } from '../../middlewares/auth.js';
/**
 * Top-level folders without subfolders:
 *   POST /api/uploads/attendance_sheets
 *   POST /api/uploads/consent_forms
 *   POST /api/uploads/feedback_forms
 *   POST /api/uploads/geo-taggedPhotos
 *   POST /api/uploads/IEC_materials_photos
 *
 * Folder with subfolders:
 *   POST /api/uploads/session_media/videos
 *   POST /api/uploads/session_media/images
 *
 * Order matters: params validation -> multer parses multipart -> file presence
 * check -> body validation -> controller.
 */

const router =express.Router();
router.get(
  '/session/:id/documentation',
  authenticate,
  getSessionDocumentation
);

router.post(
  '/:folder',
  authenticate,
  validateFolderParams,
  handleImagesUpload,
  validateFilesPresence,
  validateUploadBody,
  uploadImages
);

router.post(
  '/:folder/:subfolder',
  authenticate,
  validateFolderParams,
  handleImagesUpload,
  validateFilesPresence,
  validateUploadBody,
  uploadImages
);

export default router;
