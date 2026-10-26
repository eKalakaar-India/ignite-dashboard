import multer from "multer";
import {
  MAX_FILES_PER_UPLOAD,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  getAllowedMimeTypes,
  getMaxFileSize,
} from "../config/folderConfig.js";

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const { folder, subfolder } = req.params;
  const allowedMimeTypes = getAllowedMimeTypes(folder, subfolder);
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new multer.MulterError(
      "LIMIT_UNEXPECTED_FILE",
      `Unsupported file type "${file.mimetype}" for ${subfolder ? `${folder}/${subfolder}` : folder}. Allowed: ${allowedMimeTypes.join(", ")}`
    ));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE_BYTES,
    files: MAX_FILES_PER_UPLOAD,
  },
});
const uploadImages = upload.array("images", MAX_FILES_PER_UPLOAD);

export function handleImagesUpload(req, res, next) {
  uploadImages(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          success: false,
          message: `You can upload a maximum of ${MAX_FILES_PER_UPLOAD} images per request.`,
        });
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        const maxSize = getMaxFileSize(req.params.folder, req.params.subfolder);
        return res.status(400).json({
          success: false,
          message: `Each file must be smaller than ${maxSize / (1024 * 1024)}MB.`,
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    const { folder, subfolder } = req.params;
    const maxSize = getMaxFileSize(folder, subfolder);
    const oversized = (req.files || []).find((file) => file.size > maxSize);
    if (oversized) {
      return res.status(400).json({
        success: false,
        message: `"${oversized.originalname}" exceeds the ${maxSize / (1024 * 1024)}MB limit for ${subfolder ? `${folder}/${subfolder}` : folder}.`,
      });
    }
    next();
  });
}

const sessionCreateFileFields = [
  { name: "session_images", folder: "session_media", subfolder: "images" },
  { name: "geo_tagged_photos", folder: "geo-taggedPhotos" },
  { name: "attendance_sheets", folder: "attendance_sheets" },
  { name: "consent_forms", folder: "consent_forms" },
  { name: "feedback_forms", folder: "feedback_forms" },
];
const sessionCreateFieldsByName = Object.fromEntries(
  sessionCreateFileFields.map(({ name, ...destination }) => [name, destination])
);
const sessionCreateUpload = multer({
  storage,
  fileFilter(req, file, cb) {
    const destination = sessionCreateFieldsByName[file.fieldname];
    if (!destination) {
      return cb(new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        `Unsupported session upload field "${file.fieldname}".`
      ));
    }
    const allowedMimeTypes = getAllowedMimeTypes(destination.folder, destination.subfolder);
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        `Unsupported file type "${file.mimetype}" for ${file.fieldname}. Allowed: ${allowedMimeTypes.join(", ")}`
      ));
    }
    cb(null, true);
  },
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: MAX_FILES_PER_UPLOAD * sessionCreateFileFields.length,
  },
}).fields(sessionCreateFileFields.map(({ name }) => ({
  name,
  maxCount: MAX_FILES_PER_UPLOAD,
})));

export function handleSessionCreateUpload(req, res, next) {
  if (!req.is("multipart/form-data")) return next();

  sessionCreateUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message = err.code === "LIMIT_FILE_SIZE"
        ? `Each uploaded image must be smaller than ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`
        : err.code === "LIMIT_FILE_COUNT"
          ? `You can upload a maximum of ${MAX_FILES_PER_UPLOAD} images per category.`
          : err.message;
      return res.status(400).json({ success: false, message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}
