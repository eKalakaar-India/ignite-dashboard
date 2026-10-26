import { ApiError } from "../../utils/ApiError.js";
import { IMAGE_CONFIG } from "./gallery.constants.js";

export const validateUploadedImage = (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, "Image is required."));
  }

  if (
    !IMAGE_CONFIG.ALLOWED_MIME_TYPES.includes(req.file.mimetype)
  ) {
    return next(
      new ApiError(
        400,
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      )
    );
  }

  if (req.file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
    return next(
      new ApiError(400, "Maximum image size is 5 MB.")
    );
  }

  next();
};


export const validateMultipleImages = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new ApiError(400, "Please upload at least one image."));
  }

  if (req.files.length > IMAGE_CONFIG.MAX_FILES) {
    return next(
      new ApiError(
        400,
        `Maximum ${IMAGE_CONFIG.MAX_FILES} images are allowed.`
      )
    );
  }

  for (const file of req.files) {
    if (
      !IMAGE_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)
    ) {
      return next(
        new ApiError(
          400,
          `${file.originalname} is not a supported image.`
        )
      );
    }

    if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
      return next(
        new ApiError(
          400,
          `${file.originalname} exceeds the 5 MB limit.`
        )
      );
    }
  }

  next();
};