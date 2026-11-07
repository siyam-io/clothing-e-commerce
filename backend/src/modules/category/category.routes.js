import express from "express";
import {
  getPublicCategories,
  getPublicCategoryBySlug,
  getAdminCategories,
  getAdminCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category.controller.js";
import { protect } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import upload from "../../middleware/upload.js";
import { cacheMiddleware } from "../../middleware/cacheMiddleware.js";

const router = express.Router();

// Storefront routes
router.get("/", cacheMiddleware(600), getPublicCategories);
router.get("/:slug", cacheMiddleware(300), getPublicCategoryBySlug);

// Protected administration routes
router
  .route("/admin")
  .get(protect, authorize("categories:view"), getAdminCategories)
  .post(protect, authorize("categories:create"), upload.single("image"), createCategory);

router
  .route("/admin/:id")
  .get(protect, authorize("categories:view"), getAdminCategoryById)
  .put(protect, authorize("categories:update"), upload.single("image"), updateCategory)
  .delete(protect, authorize("categories:delete"), deleteCategory);

export default router;

