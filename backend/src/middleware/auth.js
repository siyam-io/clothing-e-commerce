import jwt from "jsonwebtoken";
import User from "../modules/user/user.model.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    // Populate role to get its name and permissions
    const user = await User.findById(decoded.id).select("-password").populate("role");
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account has been deactivated/blocked by admin" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const admin = (req, res, next) => {
  // Fallback: Only allow superadmin by default if using legacy admin check
  const roleName = req.user.role?.name;
  if (roleName === "superadmin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden. SuperAdmin clearance required for this legacy route." });
};

export const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
      const user = await User.findById(decoded.id).select("-password").populate("role");
      if (user && user.isActive !== false) req.user = user;
    } catch (error) {
    }
  }
  next();
};

export const requireAuth = protect;
export const extractUser = optionalAuth;