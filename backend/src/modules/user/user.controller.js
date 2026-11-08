import userService from "./user.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import auditLogService from "../auditLog/auditLog.service.js";

/**
 * Controller managing user accounts and profiles.
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getMe(req.user._id);
  res.json(user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const result = await userService.updateProfile(req.user._id, {
    name: req.body.name,
    phone: req.body.phone,
    bio: req.body.bio,
    addresses: req.body.addresses,
    file: req.file,
  });

  auditLogService.recordLog({
    req,
    action: "UPDATE",
    module: "User",
    resourceId: req.user._id,
    resourceName: result?.name || req.user.name,
    description: `User ${result?.name || req.user.name} updated personal profile`,
    status: "SUCCESS",
  });

  res.json(result);
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await userService.changePassword(
    req.user._id,
    req.body.currentPassword,
    req.body.newPassword
  );

  auditLogService.recordLog({
    req,
    action: "PASSWORD_RESET",
    module: "User",
    resourceId: req.user._id,
    description: `User ${req.user.name || "User"} changed account password`,
    status: "SUCCESS",
  });

  res.json(result);
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const { search, sort, page = 1, limit = 30 } = req.query;
  const result = await userService.getAllUsers({ search, sort, page, limit });
  res.json(result);
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json(user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const result = await userService.updateUser(req.params.id, {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    phone: req.body.phone,
    bio: req.body.bio,
    isActive: req.body.isActive,
    addresses: req.body.addresses,
    file: req.file,
  });

  auditLogService.recordLog({
    req,
    action: "UPDATE",
    module: "User",
    resourceId: req.params.id,
    resourceName: result?.name,
    description: `Administrator ${req.user?.name || "Admin"} updated user account: ${result?.name || req.params.id} (Role: ${result?.role?.name || result?.role})`,
    details: {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      isActive: req.body.isActive,
    },
    status: "SUCCESS",
  });

  res.json(result);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.params.id, req.user._id);

  auditLogService.recordLog({
    req,
    action: "DELETE",
    module: "User",
    resourceId: req.params.id,
    description: `Administrator ${req.user?.name || "Admin"} deleted user account #${req.params.id}`,
    status: "SUCCESS",
  });

  res.json(result);
});

export default {
  getMe,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
