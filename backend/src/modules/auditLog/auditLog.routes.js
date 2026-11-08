import express from "express";
import {
  getAuditLogs,
  getAuditLogById,
  getAuditLogStats,
  createManualLog,
} from "./auditLog.controller.js";
import { authorize } from "../../middleware/rbac.js";

const router = express.Router();

// Administrative users with audit:view, settings:view, dashboard:view, orders:view, or all clearance
router.use(authorize(["audit:view", "settings:view", "dashboard:view", "orders:view", "all"]));

router.route("/")
  .get(getAuditLogs)
  .post(createManualLog);

router.get("/stats", getAuditLogStats);
router.get("/:id", getAuditLogById);

export default router;

