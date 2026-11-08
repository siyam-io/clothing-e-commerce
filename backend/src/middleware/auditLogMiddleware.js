import auditLogService from "../modules/auditLog/auditLog.service.js";
import logger from "../utils/logger.js";

/**
 * Sensitive field names that must never be exposed or persisted in plain text logs.
 */
const SENSITIVE_KEYS = new Set([
  "password",
  "currentpassword",
  "newpassword",
  "confirmpassword",
  "token",
  "refreshtoken",
  "accesstoken",
  "secret",
  "apikey",
  "authorization",
  "creditcard",
  "cardnumber",
  "cvv",
  "cvc",
  "sslstorepassword",
  "bkashappsecret",
  "val_id",
]);

/**
 * Deep sanitization of objects to mask sensitive data before audit logging.
 */
function sanitizeDetails(data, depth = 0) {
  if (!data || depth > 4) return null;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.slice(0, 10).map((item) => sanitizeDetails(item, depth + 1));
  }

  const clean = {};
  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      clean[key] = "***MASKED***";
    } else if (typeof val === "object" && val !== null) {
      clean[key] = sanitizeDetails(val, depth + 1);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

/**
 * Infer module name based on request path.
 */
function inferModule(url) {
  const path = url.toLowerCase();
  if (path.includes("/orders") || path.includes("/pathao")) return "Order";
  if (path.includes("/products")) return "Product";
  if (path.includes("/categories") || path.includes("/subcategories") || path.includes("/sizes")) return "Category";
  if (path.includes("/coupons")) return "Coupon";
  if (path.includes("/flash-sales")) return "FlashSale";
  if (path.includes("/banner-campaigns")) return "Banner";
  if (path.includes("/blogs")) return "Blog";
  if (path.includes("/settings")) return "Settings";
  if (path.includes("/roles")) return "Role";
  if (path.includes("/users")) return "User";
  if (path.includes("/reviews")) return "Review";
  if (path.includes("/cart")) return "Cart";
  if (path.includes("/wishlist")) return "Wishlist";
  if (path.includes("/chat") || path.includes("/ai-chat")) return "Chat";
  if (path.includes("/auth")) return "Auth";
  return "System";
}

/**
 * Infer action type based on method and route.
 */
function inferAction(method, url) {
  const path = url.toLowerCase();
  if (path.includes("/login")) return "LOGIN";
  if (path.includes("/register")) return "REGISTER";
  if (path.includes("/logout")) return "LOGOUT";
  if (path.includes("/forgot-password") || path.includes("/reset-password")) return "PASSWORD_RESET";
  if (path.includes("/dispatch")) return "DISPATCH";
  if (path.includes("/cancel")) return "CANCEL";
  if (path.includes("/status")) return "STATUS_CHANGE";
  if (path.includes("/export") || path.includes("/report")) return "EXPORT";

  switch (method) {
    case "POST":
      return "CREATE";
    case "PUT":
    case "PATCH":
      return "UPDATE";
    case "DELETE":
      return "DELETE";
    default:
      return "ACCESS";
  }
}

/**
 * Express middleware for automated, production-grade audit logging of all important
 * admin & user API actions and critical security endpoints.
 */
export function auditLogMiddleware(req, res, next) {
  const start = Date.now();

  res.on("finish", async () => {
    try {
      // 1. Skip if already logged with rich domain context by controller
      if (req._auditLogged) return;

      // 2. Skip non-API or internal infra routes
      const url = req.originalUrl || req.url || "";
      if (
        !url.startsWith("/api") ||
        url.startsWith("/api-docs") ||
        url.startsWith("/api/admin/audit-logs") || // Crucial: avoid self-logging loop
        url.includes("/chat/unread") ||
        url.startsWith("/api/track") ||
        req.method === "OPTIONS"
      ) {
        return;
      }

      // 3. Determine if this is an "important" action / endpoint
      const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
      const isSecurityEvent = res.statusCode === 401 || res.statusCode === 403;
      const isServerError = res.statusCode >= 500;
      const isExportOrReport = (url.includes("/export") || url.includes("/report")) && req.method === "GET";

      if (!isMutating && !isSecurityEvent && !isServerError && !isExportOrReport) {
        return;
      }

      const durationMs = Date.now() - start;
      const module = inferModule(url);
      const action = inferAction(req.method, url);

      // Determine outcome status
      let status = "SUCCESS";
      if (isSecurityEvent) {
        status = "WARNING";
      } else if (res.statusCode >= 400) {
        status = "FAILED";
      }

      // Extract user info
      const actor = req.user;
      const actorRole = actor?.role?.name || (typeof actor?.role === "string" ? actor.role : (actor ? "user" : "guest"));
      const fallbackName = req.body?.name || req.body?.customerName || req.body?.shippingAddress?.name;
      const fallbackEmail = req.body?.email || req.body?.customerEmail || req.body?.shippingAddress?.email;

      const actorLabel = actor?.name
        ? `${actor.name} (${actorRole})`
        : fallbackName
        ? `${fallbackName} (Customer)`
        : fallbackEmail
        ? `${fallbackEmail} (Guest)`
        : `Guest (${actorRole})`;

      // Build descriptive message
      let description;
      if (isSecurityEvent) {
        description = `Security alert: Unauthorized access attempt on ${req.method} ${url} (${res.statusCode})`;
      } else if (isServerError) {
        description = `System error: Request failed with status ${res.statusCode} on ${req.method} ${url}`;
      } else if (action === "LOGIN") {
        description = `${actorLabel} attempted login via ${url}`;
      } else if (action === "REGISTER") {
        description = `New account registration submitted via ${url}`;
      } else {
        description = `${actorLabel} executed ${action} on ${module} via ${req.method} ${url}`;
      }

      // Extract target resource identifier if available
      const resourceId =
        req.params?.id ||
        req.params?.orderId ||
        req.params?.productId ||
        req.params?.sessionId ||
        req.body?.id ||
        req.body?._id;

      const resourceName = req.body?.title || req.body?.name || req.body?.code;

      // Build sanitized details payload
      const details = {
        method: req.method,
        url,
        statusCode: res.statusCode,
        durationMs,
        ip: req.ip || req.headers?.["x-forwarded-for"],
      };

      if (req.body && Object.keys(req.body).length > 0) {
        details.body = sanitizeDetails(req.body);
      }
      if (req.query && Object.keys(req.query).length > 0) {
        details.query = sanitizeDetails(req.query);
      }
      if (req.params && Object.keys(req.params).length > 0) {
        details.params = sanitizeDetails(req.params);
      }

      await auditLogService.recordLog({
        req,
        action,
        module,
        resourceId,
        resourceName,
        description,
        details,
        status,
      });
    } catch (err) {
      logger.error("Audit log middleware failed (isolated):", { error: err.message });
    }
  });

  next();
}

export default auditLogMiddleware;
