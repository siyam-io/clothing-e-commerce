import roleService from "./role.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

export const getRoles = asyncHandler(async (req, res) => {
  const roles = await roleService.getRoles();
  res.json(roles);
});

export const getRoleById = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id);
  res.json(role);
});

export const createRole = asyncHandler(async (req, res) => {
  const role = await roleService.createRole(req.body);
  res.status(201).json(role);
});

export const updateRole = asyncHandler(async (req, res) => {
  const role = await roleService.updateRole(req.params.id, req.body);
  res.json(role);
});

export const deleteRole = asyncHandler(async (req, res) => {
  const result = await roleService.deleteRole(req.params.id);
  res.json(result);
});
