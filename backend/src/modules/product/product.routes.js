import express from "express";
import {
  getPublicProducts,
  getPublicProductBySlug,
  getPublicProductById,
  getRelatedProducts,
  getLowStockAlerts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
} from "./product.controller.js";
import { protect } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import upload from "../../middleware/upload.js";
import { cacheMiddleware } from "../../middleware/cacheMiddleware.js";

const router = express.Router();

// Public storefront routes
router.get("/", cacheMiddleware(300), getPublicProducts);
router.get("/alerts/low-stock", protect, authorize("products:view"), getLowStockAlerts);
router.get("/:slug", cacheMiddleware(300), getPublicProductBySlug);
router.get("/details/:id", cacheMiddleware(300), getPublicProductById);
router.get("/:id/related", cacheMiddleware(300), getRelatedProducts);

// Administration routes
router
  .route("/admin")
  .get(protect, authorize("products:view"), getPublicProducts)
  .post(protect, authorize("products:create"), upload.array("images", 10), createProduct);

router
  .route("/admin/:id")
  .get(protect, authorize("products:view"), getPublicProductById)
  .put(protect, authorize("products:update"), upload.array("images", 10), updateProduct)
  .delete(protect, authorize("products:delete"), deleteProduct);

router.patch("/admin/:id/stock", protect, authorize("products:update"), updateStock);

export default router;

