import User from "../modules/user/user.model.js";

/**
 * Middleware to check if the user has a specific permission.
 * Optimized: Uses flattened string check (e.g., "products:create")
 * @param {string} requiredPermission - The permission key to check
 */
export const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // 1. Ensure user is logged in (req.user should be set by protect middleware)
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, no user found" });
      }

      // 2. Fetch user with populated role (Optimized: In production, we'd cache this in JWT)
      const user = await User.findById(req.user._id).populate("role");
      
      if (!user || !user.role) {
        return res.status(403).json({ message: "Access denied, no role assigned" });
      }

      // 3. SuperAdmin has access to everything (case-insensitive check)
      const roleName = String(user.role.name || "").toLowerCase().trim();
      if (roleName === "superadmin") {
        return next();
      }

      // 4. Check for granular permission safely
      const permissionsToCheck = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
      const userPermissions = Array.isArray(user.role.permissions) ? user.role.permissions : [];
      const hasPermission = permissionsToCheck.some(p => userPermissions.includes(p));

      if (hasPermission) {
        return next();
      }

      // 5. Special check for "all" wildcard permission if defined
      if (userPermissions.includes("all")) {
        return next();
      }

      return res.status(403).json({ 
        message: `Forbidden: Missing required permission [${Array.isArray(requiredPermission) ? requiredPermission.join(' OR ') : requiredPermission}]` 
      });
    } catch (error) {
      console.error("RBAC Middleware Error:", error);
      res.status(500).json({ message: "Server Error during authorization" });
    }
  };
};
