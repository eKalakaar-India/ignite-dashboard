import multer from "multer";

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  if (file.fieldname === "batch_img") {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
  }

  if (file.fieldname === "batch_video") {
    if (!file.mimetype.startsWith("video/")) {
      return cb(new Error("Only video files are allowed."));
    }
  }

  cb(null, true);
};

export const uploadBatchMedia = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // max per file
  },
}).fields([
  {
    name: "batch_img",
    maxCount: 2,
  },
  {
    name: "batch_video",
    maxCount: 1,
  },
]);