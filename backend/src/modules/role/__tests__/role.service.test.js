import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { RoleService } from "../role.service.js";
import { ApiError } from "../../../utils/responseHandler.js";

describe("RoleService", () => {
  let service;
  let mockRoleModel;
  let mockUserModel;

  beforeEach(() => {
    mockRoleModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    };
    mockUserModel = {
      countDocuments: jest.fn(),
    };

    service = new RoleService({
      roleModel: mockRoleModel,
      userModel: mockUserModel,
    });
  });

  describe("createRole", () => {
    it("throws 400 when role name is omitted", async () => {
      await expect(service.createRole({ name: "" })).rejects.toThrow(ApiError);
    });

    it("throws 400 when role with same name already exists", async () => {
      mockRoleModel.findOne.mockResolvedValue({ _id: "r1", name: "manager" });

      await expect(
        service.createRole({ name: "Manager", permissions: [] })
      ).rejects.toThrow("Role with this name already exists");
    });

    it("creates custom role with lowercase name and permissions", async () => {
      const mockCreated = {
        _id: "r2",
        name: "support",
        permissions: ["chat:read"],
        isEditable: true,
      };
      mockRoleModel.findOne.mockResolvedValue(null);
      mockRoleModel.create.mockResolvedValue(mockCreated);

      const result = await service.createRole({
        name: "SUPPORT",
        permissions: ["chat:read"],
      });

      expect(result.name).toBe("support");
      expect(mockRoleModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "support", isEditable: true })
      );
    });
  });

  describe("updateRole", () => {
    it("throws 403 when attempting to edit a system role", async () => {
      mockRoleModel.findById.mockResolvedValue({
        _id: "r_sys",
        name: "superadmin",
        isEditable: false,
      });

      await expect(
        service.updateRole("r_sys", { name: "modified" })
      ).rejects.toThrow("System roles cannot be modified");
    });

    it("updates role successfully", async () => {
      const mockRole = {
        _id: "r3",
        name: "editor",
        isEditable: true,
        save: jest.fn().mockResolvedValue(true),
      };
      mockRoleModel.findById.mockResolvedValue(mockRole);
      mockRoleModel.findOne.mockResolvedValue(null);

      await service.updateRole("r3", { description: "Content editor" });
      expect(mockRole.description).toBe("Content editor");
      expect(mockRole.save).toHaveBeenCalled();
    });
  });

  describe("deleteRole", () => {
    it("throws 403 when trying to delete system role", async () => {
      mockRoleModel.findById.mockResolvedValue({
        _id: "r_sys",
        isEditable: false,
      });

      await expect(service.deleteRole("r_sys")).rejects.toThrow("System roles cannot be deleted");
    });

    it("throws 400 when active users are assigned to this role", async () => {
      mockRoleModel.findById.mockResolvedValue({
        _id: "r4",
        isEditable: true,
      });
      mockUserModel.countDocuments.mockResolvedValue(3);

      await expect(service.deleteRole("r4")).rejects.toThrow(
        "Cannot delete role currently assigned to 3 user(s)"
      );
    });

    it("deletes role when no users are assigned", async () => {
      const mockRole = {
        _id: "r5",
        isEditable: true,
        deleteOne: jest.fn().mockResolvedValue(true),
      };
      mockRoleModel.findById.mockResolvedValue(mockRole);
      mockUserModel.countDocuments.mockResolvedValue(0);

      const result = await service.deleteRole("r5");
      expect(mockRole.deleteOne).toHaveBeenCalled();
      expect(result.message).toContain("removed successfully");
    });
  });
});

