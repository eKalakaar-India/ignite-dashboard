// services/uploadService.js
import storageRepository from './uploads.repository.js';
import ExpertRepository from '../genderExperts/experts.repository.js'
import { buildUniqueFileName } from'../../utils/fileNameHelper.js';
import {
  isValidFolderPath,
  getStoragePath,
  MAX_FILES_PER_UPLOAD,
} from '../../config/folderConfig.js';
import { getSessionDocumentationStatus } from '../../utils/sessionDocumentation.js';

class UploadService {

    constructor() {
        this.repository = new storageRepository();
        this.sessionRepository = new ExpertRepository();
    }


  /**
   * Uploads up to MAX_FILES_PER_UPLOAD image files to the given folder/subfolder.
   * Rolls back any already-uploaded files in the batch if one fails partway through.
   *
   * @param {string} folder
   * @param {string|undefined} subfolder
   * @param {Array<Express.Multer.File>} files
   * @returns {Promise<Array<{originalName: string, path: string, url: string|null}>>}
   */
  async uploadFilesToFolder(folder, subfolder, files, id) {
    if (!isValidFolderPath(folder, subfolder)) {
      const err = new Error('Invalid folder or subfolder for upload.');
      err.statusCode = 400;
      throw err;
    }

    if (!files || files.length === 0) {
      const err = new Error('No files provided for upload.');
      err.statusCode = 400;
      throw err;
    }

    if (!id) {
      const err = new Error('A session ID is required to attach uploaded files.');
      err.statusCode = 400;
      throw err;
    }

    if (files.length > MAX_FILES_PER_UPLOAD) {
      const err = new Error(
        `Cannot upload more than ${MAX_FILES_PER_UPLOAD} images at once.`
      );
      err.statusCode = 400;
      throw err;
    }

    const basePath = getStoragePath(folder, subfolder);
    const uploadedPaths = [];
    const results = [];
    
    try {
      const fieldByPath = {
        attendance_sheets: 'attendance_sheets_links',
        consent_forms: 'consent_forms_links',
        feedback_forms: 'feedback_forms_links',
        'geo-taggedPhotos': 'geo-taggedPhotos_links',
        IEC_materials_photos: 'IEC_materials_photos_links',
        'session_media/images': 'session_images_links',
        'session_media/videos': 'session_videos_links',
      };
      const field = fieldByPath[subfolder ? `${folder}/${subfolder}` : folder];
      if (!field) {
        const err = new Error('No session media column is configured for this upload path.');
        err.statusCode = 400;
        throw err;
      }

      const session = await this.sessionRepository.fetchSessionById(id);
      const existingPaths = Array.isArray(session[field]) ? session[field] : [];
      // Sequential upload keeps rollback simple and avoids hammering Supabase
      // concurrently; switch to Promise.all if throughput matters more than that.
      for (const file of files) {
        const uniqueName = buildUniqueFileName(file.originalname);
        const storagePath = `${basePath}/${uniqueName}`;

        await this.repository.uploadFile(
          storagePath,
          file.buffer,
          file.mimetype
        );

        uploadedPaths.push(storagePath);
        results.push({
          originalName: file.originalname,
          path: storagePath,
          size: file.size,
          mimeType: file.mimetype,
        });
      }
      const path = results.map((result) => result.path);
      const updatedSession = await this.sessionRepository.updateSession({
        [field]: [...existingPaths, ...path],
        status: getSessionDocumentationStatus({
          ...session,
          [field]: [...existingPaths, ...path],
        }),
      }, id);

      return { paths: path, session: updatedSession };
    } catch (err) {
      // Rollback any files that made it in before the failure
      let cleanupMessage = '';
      try {
        await this.repository.removeFiles(uploadedPaths);
      } catch (cleanupError) {
        cleanupMessage = ` Cleanup failed: ${cleanupError.message}`;
      }
      const wrapped = new Error(
        `Upload failed; rolled back or attempted to remove ${uploadedPaths.length} file(s): ${err.message}.${cleanupMessage}`,
        { cause: err }
      );
      wrapped.statusCode = err.statusCode || 502;
      throw wrapped;
    }
  }

  async getSessionDocumentation(sessionId) {
    const session = await this.sessionRepository.fetchSessionById(sessionId);
    const categories = [
      ['Attendance sheets', session.attendance_sheets_links],
      ['Consent forms', session.consent_forms_links],
      ['Feedback forms', session.feedback_forms_links],
      ['IEC material photos', session.IEC_materials_photos_links],
      ['Geo-tagged photos', session['geo-taggedPhotos_links']],
      ['Session images', session.session_images_links],
    ];

    return Promise.all(categories.map(async ([label, paths]) => ({
      label,
      files: await Promise.all(
        (Array.isArray(paths) ? paths : []).map(async (path) => {
          try {
            return { path, url: await this.repository.getSignedUrl(path) };
          } catch (error) {
            return { path, error: error.message };
          }
        })
      ),
    })));
  }
}

export default UploadService;