import settingsService from "./settings.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

export const getSettings = asyncHandler(async (req, res) => {
  const userRole = req.user?.role?.name;
  const isAdmin = userRole === "admin" || userRole === "superadmin";

  if (!isAdmin) {
    const publicSettings = await settingsService.getPublicSettings();
    return res.status(200).json(publicSettings);
  }

  const adminSettings = await settingsService.getAdminSettings();
  res.status(200).json(adminSettings);
});

export const updateSettings = asyncHandler(async (req, res) => {
  const result = await settingsService.updateSettings(req.body, req.files);
  res.json(result);
});

export const updateShipping = asyncHandler(async (req, res) => {
  const shipping = await settingsService.updateShipping(req.body);
  res.json({ message: "Shipping updated successfully", shipping });
});
