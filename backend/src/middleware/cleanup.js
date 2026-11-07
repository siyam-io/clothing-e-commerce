import fs from "fs/promises";
import logger from "../utils/logger.js";

/**
 * Remove temporary files uploaded during aborted or failed requests.
 *
 * @param {Array<Object>|Object} files - Multer file objects or array of files.
 */
export const cleanupFiles = async (files) => {
  if (!files) return;

  const filesToDelete = Array.isArray(files) ? files : [files];

  for (const file of filesToDelete) {
    if (file?.path) {
      try {
        await fs.unlink(file.path);
        logger.info(`Removed temporary upload file: ${file.path}`);
      } catch (err) {
        logger.error(`Failed to delete temporary file: ${file.path}`, { error: err.message });
      }
    }
  }
};

/**
 * Error boundary hook for handling upload-related stream aborts.
 */
export const handleFileError = (req, res, next) => {
  next();
};
