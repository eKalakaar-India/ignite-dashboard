// config/folderConfig.js

/**
 * Whitelist of valid top-level folders and their allowed subfolders,
 * matching the storage structure shown in the bucket:
 *
 * attendance_sheets/
 * consent_forms/
 * feedback_forms/
 * geo-taggedPhotos/
 * IEC_materials_photos/
 * session_media/
 *    ├── videos/
 *    └── images/
 */
export const FOLDER_TREE = {
  attendance_sheets: [],
  consent_forms: [],
  feedback_forms: [],
  'geo-taggedPhotos': [],
  IEC_materials_photos: [],
  session_media: ['videos', 'images'],
};

export const MAX_FILES_PER_UPLOAD = 5;
 export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per image
 export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB per video

 export const ALLOWED_IMAGE_MIME_TYPES = [
   'image/jpeg',
   'image/png',
   'image/webp',
   'image/heic',
   'image/heif',
 ];

 export const ALLOWED_VIDEO_MIME_TYPES = [
   'video/mp4',
   'video/quicktime',
   'video/x-msvideo',
   'video/webm',
   'video/3gpp',
 ];

 export const FOLDER_MIME_MAP = {
   attendance_sheets: ALLOWED_IMAGE_MIME_TYPES,
   consent_forms: ALLOWED_IMAGE_MIME_TYPES,
   feedback_forms: ALLOWED_IMAGE_MIME_TYPES,
   'geo-taggedPhotos': ALLOWED_IMAGE_MIME_TYPES,
   IEC_materials_photos: ALLOWED_IMAGE_MIME_TYPES,
   'session_media/images': ALLOWED_IMAGE_MIME_TYPES,
   'session_media/videos': ALLOWED_VIDEO_MIME_TYPES,
 };

/**
 * Validates that `folder` is a known top-level folder, and if `subfolder`
 * is provided, that it belongs to that folder's allowed subfolder list.
 */
export function isValidFolderPath(folder, subfolder) {
  if (!Object.prototype.hasOwnProperty.call(FOLDER_TREE, folder)) {
    return false;
  }

  const allowedSubfolders = FOLDER_TREE[folder];

  // Folder has no subfolders -> subfolder must not be supplied
  if (allowedSubfolders.length === 0) {
    return !subfolder;
  }

  // Folder requires a subfolder from its allowed list
  return !!subfolder && allowedSubfolders.includes(subfolder);
}

export function getStoragePath(folder, subfolder) {
  return subfolder ? `${folder}/${subfolder}` : folder;
}


export function getAllowedMimeTypes(folder, subfolder) {
  const key = getStoragePath(folder, subfolder);
  return FOLDER_MIME_MAP[key] || ALLOWED_IMAGE_MIME_TYPES;
}

export function getMaxFileSize(folder, subfolder) {
  const key = getStoragePath(folder, subfolder);
  return key === 'session_media/videos' ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
}