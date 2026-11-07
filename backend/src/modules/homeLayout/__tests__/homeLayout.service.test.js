import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { HomeLayoutService } from "../homeLayout.service.js";
import { ApiError } from "../../../utils/responseHandler.js";

describe("HomeLayoutService", () => {
  let service;
  let mockHomeLayoutModel;
  let mockCacheClearer;

  beforeEach(() => {
    mockHomeLayoutModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      updateMany: jest.fn(),
    };
    mockCacheClearer = jest.fn();

    service = new HomeLayoutService({
      homeLayoutModel: mockHomeLayoutModel,
      cacheClearer: mockCacheClearer,
    });
  });

  describe("getActiveLayout", () => {
    it("returns sections from active layout document", async () => {
      const mockLayout = {
        _id: "layout_1",
        name: "Spring",
        isActive: true,
        sections: [{ id: "hero-1", type: "HERO" }],
      };
      mockHomeLayoutModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockLayout),
      });

      const result = await service.getActiveLayout();
      expect(result.sections).toEqual(mockLayout.sections);
    });

    it("isolates database error and returns default sections fallback", async () => {
      mockHomeLayoutModel.findOne.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error("Database disconnected")),
      });

      const result = await service.getActiveLayout();
      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.sections[0].type).toBe("HERO");
    });
  });

  describe("createLayout", () => {
    it("creates inactive layout with cloned sections and busts cache", async () => {
      const activeLayout = {
        sections: [{ id: "sec-1", type: "HERO" }],
      };
      mockHomeLayoutModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(activeLayout),
      });

      const mockCreated = { _id: "layout_2", name: "Festival", isActive: false };
      mockHomeLayoutModel.create.mockResolvedValue(mockCreated);

      const result = await service.createLayout({ name: "Festival" });
      expect(result).toEqual(mockCreated);
      expect(mockHomeLayoutModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Festival", isActive: false })
      );
      expect(mockCacheClearer).toHaveBeenCalledWith("cache:/api/home-layout*");
    });
  });

  describe("updateLayout", () => {
    it("throws 400 ApiError when update payload is empty", async () => {
      await expect(service.updateLayout("l1", {})).rejects.toThrow(ApiError);
    });

    it("updates layout fields and clears cache", async () => {
      const updated = { _id: "l1", name: "Updated Name" };
      mockHomeLayoutModel.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await service.updateLayout("l1", { name: "Updated Name" });
      expect(result).toEqual(updated);
      expect(mockCacheClearer).toHaveBeenCalledWith("cache:/api/home-layout*");
    });
  });

  describe("switchLayout", () => {
    it("deactivates all layouts and activates the selected one", async () => {
      mockHomeLayoutModel.updateMany.mockResolvedValue({ modifiedCount: 2 });
      const activated = { _id: "l2", name: "Eid Festive", isActive: true };
      mockHomeLayoutModel.findByIdAndUpdate.mockResolvedValue(activated);

      const result = await service.switchLayout("l2");
      expect(result.layout).toEqual(activated);
      expect(mockHomeLayoutModel.updateMany).toHaveBeenCalledWith({}, { isActive: false });
      expect(mockCacheClearer).toHaveBeenCalledWith("cache:/api/home-layout*");
    });
  });

  describe("deleteLayout", () => {
    it("throws 400 ApiError when attempting to delete active layout", async () => {
      mockHomeLayoutModel.findById.mockResolvedValue({ _id: "l3", isActive: true });

      await expect(service.deleteLayout("l3")).rejects.toThrow(
        "Cannot delete currently active layout"
      );
    });

    it("deletes inactive layout and clears cache", async () => {
      const mockLayout = {
        _id: "l4",
        isActive: false,
        deleteOne: jest.fn().mockResolvedValue(true),
      };
      mockHomeLayoutModel.findById.mockResolvedValue(mockLayout);

      const result = await service.deleteLayout("l4");
      expect(mockLayout.deleteOne).toHaveBeenCalled();
      expect(result.message).toContain("removed successfully");
      expect(mockCacheClearer).toHaveBeenCalledWith("cache:/api/home-layout*");
    });
  });
});

