// utils/fileNameHelper.js
import crypto from 'crypto';
import path from 'path';

/**
 * Sanitizes the original filename and prefixes it with a UUID + timestamp
 * so concurrent uploads never collide and paths stay predictable.
 */
export function buildUniqueFileName(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 50);

  const uniqueId = crypto.randomUUID();
  const timestamp = Date.now();

  return `${timestamp}_${uniqueId}_${baseName}${ext}`;
}
