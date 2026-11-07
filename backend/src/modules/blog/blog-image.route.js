import express from "express";
import upload from "../../middleware/upload.js";
import { protect, admin } from "../../middleware/auth.js";
import { uploadImage } from "../../services/imageUploadService.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { ApiError } from "../../utils/responseHandler.js";
import logger from "../../utils/logger.js";

const router = express.Router();

router.post(
  "/upload/blog-image",
  protect,
  admin,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, "No image file provided");
    }

    try {
      const imageUrl = await uploadImage(req.file, "blogs");
      res.json({ url: imageUrl });
    } catch (error) {
      logger.error("Blog image upload error", { error: error.message });
      throw new ApiError(500, "Image upload failed");
    }
  })
);

export default router;
