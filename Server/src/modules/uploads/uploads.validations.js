// validations/uploadValidation.js
import { z } from 'zod';
import { FOLDER_TREE, MAX_FILES_PER_UPLOAD } from '../../config/folderConfig.js';

const folderKeys = Object.keys(FOLDER_TREE);

// Params: :folder is required, :subfolder is optional
const folderParamsSchema = z.object({
  folder: z
    .string({
      required_error: 'folder param is required',
    })
    .refine((value) => folderKeys.includes(value), {
      message: `folder must be one of: ${folderKeys.join(', ')}`,
    }),

  subfolder: z.string().optional(),
});

// Extra metadata that might come in the body alongside the files
const uploadBodySchema = z
  .object({
    sessionId: z.string().optional(),
    uploadedBy: z.string().optional(),
  })
  .strict();

function validateFolderParams(req, res, next) {
  const result = folderParamsSchema.safeParse(req.params);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid folder path',
      errors: result.error.issues.map((issue) => issue.message),
    });
  }

  req.params = result.data;
  next();
}

function validateUploadBody(req, res, next) {
  const result = uploadBodySchema.safeParse(req.body || {});

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request body',
      errors: result.error.issues.map((issue) => issue.message),
    });
  }

  req.body = result.data;
  next();
}

// Runs AFTER multer, since req.files is only populated
// once multer has parsed the multipart body
function validateFilesPresence(req, res, next) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message:
        'At least one image file is required under the "images" field.',
    });
  }

  if (req.files.length > MAX_FILES_PER_UPLOAD) {
    return res.status(400).json({
      success: false,
      message: `You can upload a maximum of ${MAX_FILES_PER_UPLOAD} images per request.`,
    });
  }

  next();
}

export {
  validateFolderParams,
  validateUploadBody,
  validateFilesPresence,
};