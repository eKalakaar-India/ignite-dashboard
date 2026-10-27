// controllers/uploadController.js
import uploadService from './uploads.services.js';

/**
 * POST /api/uploads/:folder
 * POST /api/uploads/:folder/:subfolder
 *
 * multipart/form-data, field name: "images" (max 5 files)
 
 */
const service  = new uploadService()


export async function uploadImages(req, res, next) {
  try {
    const { folder, subfolder } = req.params;
    const files = req.files;
    const id = req.body.sessionId;
    const result = await service.uploadFilesToFolder(folder, subfolder, files, id);

    return res.status(201).json({
      success: true,
      message: `${result.paths.length} image(s) uploaded successfully to ${
        subfolder ? `${folder}/${subfolder}` : folder
      }.`,
      data: result,
    });
  } catch (err) {
    console.log(err)
    next(err);
  }
}

export async function getSessionDocumentation(req, res, next) {
  try {
    const documents = await service.getSessionDocumentation(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Session documentation fetched successfully.',
      data: documents,
    });
  } catch (err) {
    next(err);
  }
}

export async function getSessionDocumentationForSessions(req, res, next) {
  try {
    const documents = await service.getSessionDocumentationForSessions(req.body?.sessionIds);
    return res.status(200).json({
      success: true,
      message: 'Session image links signed successfully.',
      data: documents,
    });
  } catch (err) {
    next(err);
  }
}
