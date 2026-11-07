import Role from "./role.model.js";
import User from "../user/user.model.js";
import { ApiError } from "../../utils/responseHandler.js";

/**
 * Service managing user roles, access control boundaries, and administrative authorization.
 */
export class RoleService {
  /**
   * @param {Object} [dependencies]
   * @param {typeof Role} [dependencies.roleModel]
   * @param {typeof User} [dependencies.userModel]
   */
  constructor(dependencies = {}) {
    this.roleModel = dependencies.roleModel || Role;
    this.userModel = dependencies.userModel || User;
  }

  /**
   * Retrieve all roles in the system.
   */
  async getRoles() {
    return await this.roleModel.find({}).sort("name").lean();
  }

  /**
   * Retrieve single role by document ID.
   */
  async getRoleById(id) {
    const role = await this.roleModel.findById(id).lean();
    if (!role) {
      throw new ApiError(404, "Role not found");
    }
    return role;
  }

  /**
   * Create a new custom role with designated permissions.
   */
  async createRole({ name, description, permissions }) {
    if (!name || !name.trim()) {
      throw new ApiError(400, "Role name is required");
    }

    const normalizedName = name.trim().toLowerCase();
    const existing = await this.roleModel.findOne({ name: normalizedName });
    if (existing) {
      throw new ApiError(400, "Role with this name already exists");
    }

    return await this.roleModel.create({
      name: normalizedName,
      description: description?.trim() || "",
      permissions: Array.isArray(permissions) ? permissions : [],
      isEditable: true,
    });
  }

  /**
   * Update permissions or description of an editable role.
   */
  async updateRole(id, { name, description, permissions }) {
    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new ApiError(404, "Role not found");
    }

    if (role.isEditable === false) {
      throw new ApiError(403, "System roles cannot be modified");
    }

    if (name && name.trim()) {
      const normalizedName = name.trim().toLowerCase();
      if (normalizedName !== role.name) {
        const existing = await this.roleModel.findOne({ name: normalizedName });
        if (existing) throw new ApiError(400, "Role name already in use");
        role.name = normalizedName;
      }
    }

    if (description !== undefined) role.description = description.trim();
    if (Array.isArray(permissions)) role.permissions = permissions;

    return await role.save();
  }

  /**
   * Delete a custom role with active user assignment protection.
   */
  async deleteRole(id) {
    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new ApiError(404, "Role not found");
    }

    if (role.isEditable === false) {
      throw new ApiError(403, "System roles cannot be deleted");
    }

    const assignedCount = await this.userModel.countDocuments({ role: id });
    if (assignedCount > 0) {
      throw new ApiError(400, `Cannot delete role currently assigned to ${assignedCount} user(s)`);
    }

    await role.deleteOne();
    return { message: "Role removed successfully" };
  }
}

export default new RoleService();

