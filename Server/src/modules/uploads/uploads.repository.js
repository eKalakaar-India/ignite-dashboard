// repositories/storageRepository.js
import { supabase, SUPABASE_BUCKET } from'../../config/supabase.js';

/**
 * Repository layer: only talks to Supabase Storage. No business rules here.
 */
class StorageRepository {
  getStorageObjectPath(storagePath) {
    if (typeof storagePath !== 'string' || !storagePath.trim()) {
      throw new Error('A valid storage path is required to create a signed URL.');
    }

    let objectPath = storagePath.trim();
    if (/^https?:\/\//i.test(objectPath) || objectPath.startsWith('/storage/v1/object/')) {
      const parsedUrl = new URL(objectPath, 'https://storage.local');
      const match = parsedUrl.pathname.match(
        /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/
      );
      if (!match || decodeURIComponent(match[1]) !== SUPABASE_BUCKET) {
        throw new Error('The stored documentation URL does not belong to the configured Supabase bucket.');
      }
      objectPath = decodeURIComponent(match[2]);
    } else if (objectPath.startsWith(`${SUPABASE_BUCKET}/`)) {
      objectPath = objectPath.slice(SUPABASE_BUCKET.length + 1);
    }

    if (!objectPath) {
      throw new Error('The stored documentation reference does not contain a storage object path.');
    }
    return objectPath;
  }

  /**
   * Uploads a single file buffer to the given storage path.
   * @param {string} storagePath e.g. "session_media/images/uuid_photo.jpg"
   * @param {Buffer} buffer
   * @param {string} contentType
   */
  async uploadFile(storagePath, buffer, contentType) {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(storagePath, buffer, {
        contentType,
        upsert: false, // fail if same key already exists; we generate unique names anyway
      });

    if (error) {
      const err = new Error(`Supabase upload failed: ${error.message}`);
      err.cause = error;
      throw err;
    }

    return data; // { path }
  }

  /**
   * Returns a public URL for a file (only correct if the bucket/objects are public).
   */
  getPublicUrl(storagePath) {
    const { data } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(storagePath);
    return data?.publicUrl || null;
  }

  /**
   * Returns a time-limited signed URL (use this if the bucket is private).
   */
  async getSignedUrl(storagePath, expiresInSeconds = 60 * 60) {
    const objectPath = this.getStorageObjectPath(storagePath);
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .createSignedUrl(objectPath, expiresInSeconds);

    if (error) {
      const err = new Error(`Failed to sign storage object "${objectPath}": ${error.message}`);
      err.cause = error;
      throw err;
    }
    return data.signedUrl;
  }

  /**
   * Removes uploaded files (used for rollback if a batch partially fails).
   */
  async removeFiles(storagePaths = []) {
    if (!storagePaths.length) return;
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .remove(storagePaths);

    if (error) {
      const err = new Error(`Failed to remove uploaded files: ${error.message}`);
      err.cause = error;
      throw err;
    }
  }
}

export default StorageRepository;
