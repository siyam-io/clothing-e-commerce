import express from "express";
import {
  getDashboardData,
  getAdminCounts,
  getDashboardStats,
  getDashboardRecentOrders,
  getDashboardInventoryAlerts,
  getDashboardRevenueTrend,
  getDashboardCategoryStats,
  getDashboardCustomerGrowth,
  getDashboardRetention,
} from "./admin.controller.js";
import {
  handleAdminAiChat,
  handleAdminAiChatUndo,
  getAdminAiChatHistory,
  clearAdminAiChatHistory,
  getAdminAiChatSessions,
  createAdminAiChatSession,
  getAdminAiChatSessionMessages,
  deleteAdminAiChatSession,
  renameAdminAiChatSession,
} from "./ai-chat.controller.js";
import { protect } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import { cacheMiddleware } from "../../middleware/cacheMiddleware.js";
import upload from "../../middleware/upload.js";
import { uploadImage } from "../../services/imageUploadService.js";
import logger from "../../utils/logger.js";

import adminProductRoutes from "../product/routes/admin.product.routes.js";
import adminCategoryRoutes from "../category/routes/admin.category.routes.js";
import adminFlashSaleRoutes from "../flashSale/routes/admin.flashSale.routes.js";
import adminOrderRoutes from "../order/routes/admin.order.routes.js";
import auditLogRoutes from "../auditLog/auditLog.routes.js";

const router = express.Router();

router.use(protect);

// Defense-in-Depth: Reject unprivileged roles across all admin endpoints
router.use((req, res, next) => {
  const roleName = String(req.user?.role?.name || "").toLowerCase().trim();
  if (!roleName || roleName === "customer" || roleName === "user") {
    return res.status(403).json({ message: "Forbidden: Administrative clearance required." });
  }
  next();
});

router.get("/ai-chat/sessions", authorize(["ai-chat:view"]), getAdminAiChatSessions);
router.post("/ai-chat/sessions", authorize(["ai-chat:view"]), createAdminAiChatSession);
router.get("/ai-chat/sessions/:sessionId", authorize(["ai-chat:view"]), getAdminAiChatSessionMessages);
router.delete("/ai-chat/sessions/:sessionId", authorize(["ai-chat:view"]), deleteAdminAiChatSession);
router.patch("/ai-chat/sessions/:sessionId", authorize(["ai-chat:view"]), renameAdminAiChatSession);

router.get("/ai-chat/history", authorize(["ai-chat:view"]), getAdminAiChatHistory);
router.delete("/ai-chat/history", authorize(["ai-chat:view"]), clearAdminAiChatHistory);
router.post("/ai-chat", authorize(["ai-chat:view"]), handleAdminAiChat);
router.post("/ai-chat/undo", authorize(["ai-chat:view"]), handleAdminAiChatUndo);
router.post(
  "/ai-chat/upload",
  authorize(["ai-chat:view"]),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file provided" });
      }
      const imageUrl = await uploadImage(req.file, "ai");
      res.json({ success: true, url: imageUrl });
    } catch (error) {
      logger.error("AI chat image upload failed:", { error: error.message });
      res.status(500).json({ success: false, message: "Image upload failed" });
    }
  }
);

router.get(
  "/dashboard",
  authorize(["dashboard:view", "reports:view"]),
  cacheMiddleware(300),
  getDashboardData
);
router.get(
  "/dashboard/stats",
  authorize(["dashboard:view", "reports:view"]),
  cacheMiddleware(300),
  getDashboardStats
);
router.get(
  "/dashboard/recent-orders",
  authorize(["dashboard:view", "reports:view"]),
  cacheMiddleware(300),
  getDashboardRecentOrders
);
router.get(
  "/dashboard/inventory-alerts",
  authorize(["dashboard:view", "reports:view"]),
  cacheMiddleware(300),
  getDashboardInventoryAlerts
);
router.get(
  "/dashboard/revenue-trend",
  authorize(["dashboard:view", "reports:view"]),
  cacheMiddleware(300),
  getDashboardRevenueTrend
);
router.get(
  "/dashboard/category-stats",
  authorize(["dashboard:view", "reports:view"]),
  cacheMiddleware(300),
  getDashboardCategoryStats
);
router.get(
  "/dashboard/customer-growth",
  authorize(["dashboard:view", "reports:view"]),
  cacheMiddleware(300),
  getDashboardCustomerGrowth
);
router.get(
  "/dashboard/retention",
  authorize(["dashboard:view", "reports:view"]),
  cacheMiddleware(300),
  getDashboardRetention
);
router.get(
  "/counts",
  authorize(["dashboard:view", "reports:view"]),
  getAdminCounts
);

router.use("/products", adminProductRoutes);
router.use("/categories", adminCategoryRoutes);
router.use("/flash-sales", adminFlashSaleRoutes);
router.use("/orders", adminOrderRoutes);
router.use("/audit-logs", auditLogRoutes);

export default router;
