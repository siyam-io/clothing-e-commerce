// src/middleware/upload.js
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists (only for local storage)
const ensureDir = (dir) => {
  if (process.env.STORAGE_TYPE !== 'local') return;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Allowed file types
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const ALLOWED_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// Use memory storage to get buffer for Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`File type not allowed: ${ext}`), false);
  }
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return cb(new Error("Invalid file type"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB safe ceiling to prevent memory exhaustion DoS
  fileFilter,
});

// For local storage, we might want to still save files to disk
// We'll handle that inside the image upload service when storageType === 'local'
// For now, multer just gives us buffers.

export default upload;
