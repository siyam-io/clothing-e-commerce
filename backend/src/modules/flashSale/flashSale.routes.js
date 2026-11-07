import express from "express";
import {
  getActiveFlashSales,
  getFlashSaleProducts,
  getPublicFlashSaleBySlug,
  getAllFlashSales,
  getAdminFlashSaleById,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
} from "./flashSale.controller.js";
import { protect } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import { cacheMiddleware } from "../../middleware/cacheMiddleware.js";

const router = express.Router();

// Storefront routes
router.get("/active", cacheMiddleware(300), getActiveFlashSales);
router.get("/products", cacheMiddleware(300), getFlashSaleProducts);
router.get("/:slug", cacheMiddleware(300), getPublicFlashSaleBySlug);

// Administration routes
router
  .route("/admin")
  .get(protect, authorize("flash-sales:view"), getAllFlashSales)
  .post(protect, authorize("flash-sales:create"), createFlashSale);

router
  .route("/admin/:id")
  .get(protect, authorize("flash-sales:view"), getAdminFlashSaleById)
  .put(protect, authorize("flash-sales:update"), updateFlashSale)
  .delete(protect, authorize("flash-sales:delete"), deleteFlashSale);

export default router;

