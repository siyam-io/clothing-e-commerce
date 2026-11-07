import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import PageSetting from "../modules/settings/settings.model.js";
import ApiKey from "../modules/settings/apiKey.model.js";
import { decrypt } from "../utils/encryption.js";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultStorageType = (process.env.STORAGE_TYPE || "cloudinary").toLowerCase().trim();

if (defaultStorageType === "cloudinary") {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    logger.warn("Cloudinary credentials missing in environment variables.");
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

let configCache = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL_MS = 60 * 1000;

/**
 * Retrieve active image storage configuration with a 60-second in-memory cache.
 *
 * @returns {Promise<Object>} Storage provider credentials and strategy.
 */
const getStorageConfig = async () => {
  const now = Date.now();
  if (configCache && now - configCacheTime < CONFIG_CACHE_TTL_MS) {
    return configCache;
  }

  try {
    const settings = await PageSetting.findOne();
    const apiKeys = await ApiKey.findOne();

    let storageType = "cloudinary";
    if (settings?.config?.storageMethod) {
      storageType = settings.config.storageMethod === "server" ? "local" : "cloudinary";
    } else if (process.env.STORAGE_TYPE) {
      storageType =
        process.env.STORAGE_TYPE.toLowerCase().trim() === "server" ? "local" : "cloudinary";
    }

    let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    let apiKey = process.env.CLOUDINARY_API_KEY;
    let apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (apiKeys) {
      if (apiKeys.cloudinaryCloudName) {
        const decCloudName = decrypt(apiKeys.cloudinaryCloudName);
        if (decCloudName) cloudName = decCloudName;
      }
      if (apiKeys.cloudinaryApiKey) {
        const decApiKey = decrypt(apiKeys.cloudinaryApiKey);
        if (decApiKey) apiKey = decApiKey;
      }
      if (apiKeys.cloudinaryApiSecret) {
        const decApiSecret = decrypt(apiKeys.cloudinaryApiSecret);
        if (decApiSecret) apiSecret = decApiSecret;
      }
    }

    configCache = { storageType, cloudName, apiKey, apiSecret };
    configCacheTime = now;
    return configCache;
  } catch (err) {
    logger.error("Error loading storage configuration from database, falling back to environment:", {
      error: err.message,
    });
    return {
      storageType:
        (process.env.STORAGE_TYPE || "cloudinary").toLowerCase().trim() === "server"
          ? "local"
          : "cloudinary",
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    };
  }
};

/**
 * Invalidate the storage configuration cache.
 */
export const bustStorageConfigCache = () => {
  configCache = null;
  configCacheTime = 0;
};

/**
 * Upload image buffer to Cloudinary CDN.
 *
 * @param {Buffer} fileBuffer - Image binary buffer.
 * @param {string} folder - Target folder category.
 * @param {Object} config - Cloudinary credentials.
 * @returns {Promise<string>} Public URL of uploaded asset.
 */
const uploadToCloudinary = (fileBuffer, folder, config) => {
  return new Promise((resolve, reject) => {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    });

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `ecowear/${folder}`,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          logger.error("Cloudinary upload failure:", { error: error.message });
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Save image buffer to local filesystem storage.
 *
 * @param {Buffer} fileBuffer - Image binary buffer.
 * @param {string} folder - Destination subfolder.
 * @param {string} originalname - Original file name.
 * @returns {Promise<string>} Relative URL path.
 */
const saveToLocal = async (fileBuffer, folder, originalname) => {
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(originalname)}`;
  const relativeDir = `uploads/${folder}`;
  const fullDirPath = path.join(process.cwd(), relativeDir);

  await fs.mkdir(fullDirPath, { recursive: true });

  const fullPath = path.join(fullDirPath, fileName);
  await fs.writeFile(fullPath, fileBuffer);

  return `/${relativeDir}/${fileName}`;
};

/**
 * Remove image asset from either Cloudinary or local storage.
 *
 * @param {string} imageUrl - Resource URL or relative path.
 */
export const deleteImage = async (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") return;

  const config = await getStorageConfig();

  if (config.storageType === "cloudinary" && imageUrl.includes("cloudinary.com")) {
    try {
      const parts = imageUrl.split("/");
      const fileNameWithExt = parts.pop();
      const folderPart = parts.slice(parts.indexOf("ecowear")).join("/");
      const publicId = `${folderPart}/${fileNameWithExt.split(".")[0]}`;

      cloudinary.config({
        cloud_name: config.cloudName,
        api_key: config.apiKey,
        api_secret: config.apiSecret,
      });

      await cloudinary.uploader.destroy(publicId);
      logger.info(`Purged Cloudinary asset: ${publicId}`);
    } catch (err) {
      logger.error("Cloudinary asset deletion error:", { error: err.message });
    }
  } else if (imageUrl.startsWith("/uploads") || imageUrl.startsWith("uploads")) {
    try {
      const uploadsBaseDir = path.resolve(process.cwd(), "uploads");
      const sanitizedRelative = path
        .normalize(imageUrl.replace(/^\/?uploads\/?/, ""))
        .replace(/^(\.\.[/\\])+/, "");

      const fullPath = path.resolve(uploadsBaseDir, sanitizedRelative);

      if (!fullPath.startsWith(uploadsBaseDir + path.sep) && fullPath !== uploadsBaseDir) {
        logger.warn(`Path traversal attempt blocked in deleteImage: ${imageUrl}`);
        return;
      }

      await fs.access(fullPath);
      await fs.unlink(fullPath);
      logger.info(`Deleted local upload: ${fullPath}`);
    } catch (err) {
      logger.warn(`Local file deletion skipped or file absent: ${imageUrl}`);
    }
  }
};

/**
 * Process and optimize single image before persistence.
 *
 * @param {Object} file - Multer file object.
 * @param {string} folder - Destination category folder.
 * @param {string|null} [oldUrl] - Previous image URL to purge upon replacement.
 * @returns {Promise<string|null>} Storage URL.
 */
export const uploadImage = async (file, folder, oldUrl = null) => {
  if (!file?.buffer) return null;

  if (oldUrl) {
    await deleteImage(oldUrl);
  }

  let processedBuffer = file.buffer;
  let processedName = file.originalname;

  try {
    const sharp = (await import("sharp")).default;
    const isLogoOrFavicon = folder === "settings";
    const enableBgRemoval = process.env.ENABLE_BG_REMOVAL === "true";

    if (isLogoOrFavicon && enableBgRemoval) {
      try {
        const tempDir = path.join(__dirname, "../../temp");
        await fs.mkdir(tempDir, { recursive: true });

        const tempInput = path.join(
          tempDir,
          `input_${Date.now()}_${Math.random().toString(36).substring(7)}.png`
        );
        const tempOutput = path.join(
          tempDir,
          `output_${Date.now()}_${Math.random().toString(36).substring(7)}.png`
        );

        await fs.writeFile(tempInput, processedBuffer);

        const runnerPath = path.join(__dirname, "bgRemoverRunner.js");
        const { exec } = await import("child_process");
        const util = await import("util");
        const execPromise = util.promisify(exec);

        await execPromise(`node "${runnerPath}" "${tempInput}" "${tempOutput}"`);
        processedBuffer = await fs.readFile(tempOutput);

        fs.unlink(tempInput).catch(() => {});
        fs.unlink(tempOutput).catch(() => {});
      } catch (err) {
        logger.error("Background removal process error, retaining original:", {
          error: err.message,
        });
      }
    }

    const isPng =
      file.mimetype === "image/png" ||
      file.mimetype === "image/webp" ||
      file.originalname.endsWith(".png") ||
      file.originalname.endsWith(".webp") ||
      isLogoOrFavicon;

    const maxWidth = 1200;
    const sharpInstance = sharp(processedBuffer).resize({ width: maxWidth, withoutEnlargement: true });

    if (isPng) {
      processedBuffer = await sharpInstance.png({ compressionLevel: 8 }).toBuffer();
      processedName = `${path.basename(file.originalname, path.extname(file.originalname))}.png`;
    } else {
      processedBuffer = await sharpInstance.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
      processedName = `${path.basename(file.originalname, path.extname(file.originalname))}.jpg`;
    }
  } catch (error) {
    logger.error("Image optimization pipeline error, falling back to original buffer:", {
      error: error.message,
    });
  }

  const config = await getStorageConfig();
  if (config.storageType === "cloudinary") {
    return uploadToCloudinary(processedBuffer, folder, config);
  }
  return saveToLocal(processedBuffer, folder, processedName);
};

/**
 * Process and persist multiple uploaded images.
 *
 * @param {Array<Object>} files - Array of Multer file objects.
 * @param {string} folder - Target category folder.
 * @param {Array<string>} [oldUrls=[]] - Previous image URLs to remove.
 * @returns {Promise<Array<string>>} List of stored URLs.
 */
export const uploadMultipleImages = async (files, folder, oldUrls = []) => {
  if (!files || files.length === 0) return [];

  if (oldUrls.length > 0) {
    await Promise.all(oldUrls.map((url) => deleteImage(url)));
  }

  const uploadTasks = files.map((file) => uploadImage(file, folder));
  return Promise.all(uploadTasks);
};
