import { asyncHandler } from "../../middleware/asyncHandler.js";
import auditLogService from "./auditLog.service.js";

/**
 * @desc Get paginated audit logs with search and filtering
 * @route GET /api/admin/audit-logs
 * @access Private (Admin)
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditLogService.getAuditLogs(req.query);
  res.json(result);
});

/**
 * @desc Get audit log details by ID
 * @route GET /api/admin/audit-logs/:id
 * @access Private (Admin)
 */
export const getAuditLogById = asyncHandler(async (req, res) => {
  const log = await auditLogService.getAuditLogById(req.params.id);
  if (!log) {
    return res.status(404).json({ success: false, message: "Audit log entry not found." });
  }
  res.json({ success: true, log });
});

/**
 * @desc Get high-level audit logging statistics
 * @route GET /api/admin/audit-logs/stats
 * @access Private (Admin)
 */
export const getAuditLogStats = asyncHandler(async (req, res) => {
  const stats = await auditLogService.getAuditLogStats();
  res.json({ success: true, stats });
});

/**
 * @desc Record a custom admin annotation or note
 * @route POST /api/admin/audit-logs
 * @access Private (Admin)
 */
export const createManualLog = asyncHandler(async (req, res) => {
  const { action = "SYSTEM", module = "System", description, details, resourceId, resourceName } = req.body;

  if (!description) {
    return res.status(400).json({ success: false, message: "Log description is required." });
  }

  const log = await auditLogService.recordLog({
    req,
    action,
    module,
    resourceId,
    resourceName,
    description,
    details,
    status: "SUCCESS",
  });

  res.status(201).json({ success: true, log });
});

