import express from "express";
import {
  getActiveLayout,
  getAllLayouts,
  createLayout,
  updateLayout,
  switchLayout,
  deleteLayout,
} from "./homeLayout.controller.js";
import { protect } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import { cacheMiddleware } from "../../middleware/cacheMiddleware.js";

const router = express.Router();

// Public storefront layout
router.get("/", cacheMiddleware(1800), getActiveLayout);
router.get("/active", cacheMiddleware(1800), getActiveLayout);

// Administrative layout management
router.get("/all", protect, authorize("homeLayout:view"), getAllLayouts);
router.post("/", protect, authorize("homeLayout:create"), createLayout);
router.put("/:id", protect, authorize("homeLayout:update"), updateLayout);
router.patch("/:id", protect, authorize("homeLayout:update"), updateLayout);
router.put("/:id/switch", protect, authorize("homeLayout:update"), switchLayout);
router.patch("/:id/switch", protect, authorize("homeLayout:update"), switchLayout);
router.delete("/:id", protect, authorize("homeLayout:delete"), deleteLayout);

export default router;
