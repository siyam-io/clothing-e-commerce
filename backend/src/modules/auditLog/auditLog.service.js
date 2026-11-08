import AuditLog from "./auditLog.model.js";
import logger from "../../utils/logger.js";

/**
 * Service managing administrative and security audit logging.
 */
export class AuditLogService {
  /**
   * Record a new audit log entry with complete isolation.
   *
   * @param {Object} params
   * @param {Object} [params.req] - Express request object for IP and agent extraction.
   * @param {Object} [params.user] - Actor user object.
   * @param {string} params.action - Action identifier (CREATE, UPDATE, DELETE, etc.).
   * @param {string} params.module - Target domain module.
   * @param {string} [params.resourceId] - Target document identifier.
   * @param {string} [params.resourceName] - Target resource display name.
   * @param {string} params.description - Human-readable action description.
   * @param {Object} [params.details] - Detailed changes or payload.
   * @param {string} [params.status="SUCCESS"] - Outcome status.
   * @returns {Promise<Object|null>} Persisted log or null on failure.
   */
  async recordLog({
    req,
    user,
    action,
    module,
    resourceId,
    resourceName,
    description,
    details = null,
    status = "SUCCESS",
  }) {
    try {
      const actor = user || req?.user;
      const ipAddress =
        req?.ip ||
        req?.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
        req?.socket?.remoteAddress ||
        "127.0.0.1";
      const userAgent = req?.headers?.["user-agent"] || "Server/Internal";

      const fallbackName =
        req?.body?.name ||
        req?.body?.customerName ||
        req?.body?.shippingAddress?.name;
      const fallbackEmail =
        req?.body?.email ||
        req?.body?.customerEmail ||
        req?.body?.shippingAddress?.email;

      const userName =
        actor?.name ||
        fallbackName ||
        (actor ? "User" : "Guest / Anonymous");
      const userEmail =
        actor?.email ||
        fallbackEmail ||
        (actor ? "user@store" : "guest@store");
      const userRole =
        actor?.role?.name ||
        (typeof actor?.role === "string" ? actor.role : (actor ? "user" : "guest"));

      const log = new AuditLog({
        user: actor?._id || actor?.id,
        userName,
        userEmail,
        userRole,
        action: String(action || "SYSTEM").toUpperCase(),
        module: module ? (module.charAt(0).toUpperCase() + module.slice(1)) : "System",
        resourceId: resourceId ? String(resourceId) : undefined,
        resourceName: resourceName ? String(resourceName) : undefined,
        description,
        details,
        status: status || "SUCCESS",
        ipAddress,
        userAgent,
      });

      await log.save();
      if (req) {
        req._auditLogged = true;
      }
      logger.info(`AuditLog recorded [${module}:${action}] - ${description}`);
      return log;
    } catch (err) {
      logger.error("Failed to persist AuditLog entry (isolated):", {
        error: err.message,
        action,
        module,
      });
      return null;
    }
  }

  /**
   * Fetch paginated audit logs with dynamic multi-field filtering.
   */
  async getAuditLogs({
    page = 1,
    limit = 20,
    search,
    module,
    action,
    status,
    role,
    startDate,
    endDate,
    userId,
  } = {}) {
    const query = {};

    if (module && module !== "all") {
      query.module = new RegExp(`^${module.trim()}$`, "i");
    }

    if (action && action !== "all") {
      query.action = new RegExp(`^${action.trim()}$`, "i");
    }

    if (status && status !== "all") {
      // Handle both FAILED and FAILURE
      const normalizedStatus = status.trim().toUpperCase() === "FAILURE" ? "FAILED" : status.trim().toUpperCase();
      query.status = normalizedStatus;
    }

    if (role && role !== "all") {
      query.userRole = new RegExp(`^${role.trim()}$`, "i");
    }

    if (userId) {
      query.user = userId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { description: regex },
        { userName: regex },
        { userEmail: regex },
        { userRole: regex },
        { resourceName: regex },
        { resourceId: regex },
        { action: regex },
        { module: regex },
        { ipAddress: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("user", "name email avatar role")
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      success: true,
      logs,
      total,
      pages: totalPages,
      currentPage: pageNum,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
      },
    };
  }

  /**
   * Retrieve single audit log by primary identifier.
   */
  async getAuditLogById(id) {
    return AuditLog.findById(id).populate("user", "name email avatar role").lean();
  }

  /**
   * Compute high-level analytics for the audit dashboard cards.
   */
  async getAuditLogStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalLogs, todayLogs, failedCount, actionAggregation, moduleAggregation] =
      await Promise.all([
        AuditLog.countDocuments(),
        AuditLog.countDocuments({ createdAt: { $gte: todayStart } }),
        AuditLog.countDocuments({ status: "FAILED" }),
        AuditLog.aggregate([
          { $group: { _id: "$action", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
        AuditLog.aggregate([
          { $group: { _id: "$module", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
      ]);

    return {
      totalLogs,
      todayLogs,
      failedCount,
      failureLogs: failedCount,
      topActions: actionAggregation.map((a) => ({ action: a._id, count: a.count })),
      topModules: moduleAggregation.map((m) => ({ module: m._id, count: m.count })),
    };
  }
}

export const auditLogService = new AuditLogService();
export default auditLogService;

