import { jest } from "@jest/globals";
import { UserService } from "../user.service.js";

describe("UserService", () => {
  let userService;
  let mockUserModel;
  let mockUploadImage;
  let mockDeleteImage;
  let mockClearCache;

  beforeEach(() => {
    mockUserModel = {
      findById: jest.fn(),
      countDocuments: jest.fn(),
      find: jest.fn(),
    };
    mockUploadImage = jest.fn();
    mockDeleteImage = jest.fn();
    mockClearCache = jest.fn();

    userService = new UserService({
      userModel: mockUserModel,
      uploadImage: mockUploadImage,
      deleteImage: mockDeleteImage,
      clearCache: mockClearCache,
    });
  });

  describe("getMe", () => {
    it("should return populated user without password", async () => {
      const mockUser = { _id: "u1", name: "Alice", email: "alice@test.com", role: { name: "customer" } };
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await userService.getMe("u1");

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith("u1");
    });

    it("should throw 404 if user not found", async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(userService.getMe("invalid-id")).rejects.toThrow("User not found");
    });
  });

  describe("updateProfile", () => {
    it("should update profile fields, upload avatar, and clear cache", async () => {
      const existingUser = {
        _id: "u1",
        name: "Old Name",
        phone: "123",
        bio: "Old bio",
        avatar: "old-avatar.jpg",
        addresses: [],
        save: jest.fn().mockResolvedValue(true),
      };

      const populatedUser = {
        _id: "u1",
        name: "New Name",
        email: "alice@test.com",
        phone: "999",
        bio: "New bio",
        avatar: "new-avatar.jpg",
        role: { name: "customer" },
        addresses: [{ city: "Dhaka" }],
      };

      mockUserModel.findById
        .mockResolvedValueOnce(existingUser)
        .mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue(populatedUser),
        });

      mockUploadImage.mockResolvedValue("new-avatar.jpg");

      const result = await userService.updateProfile("u1", {
        name: "New Name",
        phone: "999",
        bio: "New bio",
        addresses: JSON.stringify([{ city: "Dhaka" }]),
        file: { buffer: Buffer.from("test") },
      });

      expect(mockUploadImage).toHaveBeenCalledWith({ buffer: expect.any(Buffer) }, "avatars", "old-avatar.jpg");
      expect(existingUser.save).toHaveBeenCalled();
      expect(mockClearCache).toHaveBeenCalledWith("cache:/api/admin/dashboard*");
      expect(result.name).toBe("New Name");
      expect(result.avatar).toBe("new-avatar.jpg");
      expect(result.addresses).toEqual([{ city: "Dhaka" }]);
    });
  });

  describe("changePassword", () => {
    it("should reject if fields are missing", async () => {
      await expect(userService.changePassword("u1", "", "123456")).rejects.toThrow(
        "Both current and new password are required"
      );
    });

    it("should reject if new password is too short", async () => {
      await expect(userService.changePassword("u1", "oldPass", "123")).rejects.toThrow(
        "New password must be at least 6 characters"
      );
    });

    it("should reject if current password does not match", async () => {
      const mockUser = {
        _id: "u1",
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(userService.changePassword("u1", "wrongPass", "newSecretPass")).rejects.toThrow(
        "Current password is incorrect"
      );
    });

    it("should update password when credentials match", async () => {
      const mockUser = {
        _id: "u1",
        password: "oldHashedPassword",
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await userService.changePassword("u1", "correctPass", "newSecretPass");

      expect(result).toEqual({ message: "Password updated successfully" });
      expect(mockUser.password).toBe("newSecretPass");
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe("getAllUsers", () => {
    it("should query paginated users with search term", async () => {
      const mockUsers = [{ _id: "u1", name: "Rahim" }];
      mockUserModel.countDocuments.mockResolvedValue(1);

      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockUsers),
      };
      mockUserModel.find.mockReturnValue(mockQueryChain);

      const result = await userService.getAllUsers({ search: "Rahim", page: 1, limit: 10 });

      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(1);
      expect(result.pages).toBe(1);
      expect(mockUserModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "Rahim", $options: "i" } },
          { email: { $regex: "Rahim", $options: "i" } },
        ],
      });
    });
  });

  describe("deleteUser", () => {
    it("should prevent admin from deleting own account", async () => {
      const mockUser = { _id: "admin-id" };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await expect(userService.deleteUser("admin-id", "admin-id")).rejects.toThrow(
        "You cannot delete your own account"
      );
    });

    it("should delete user and avatar, then clear dashboard cache", async () => {
      const mockUser = {
        _id: "target-user",
        avatar: "uploads/avatar.png",
        deleteOne: jest.fn().mockResolvedValue(true),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await userService.deleteUser("target-user", "admin-id");

      expect(result).toEqual({ message: "User removed successfully" });
      expect(mockDeleteImage).toHaveBeenCalledWith("uploads/avatar.png");
      expect(mockUser.deleteOne).toHaveBeenCalled();
      expect(mockClearCache).toHaveBeenCalledWith("cache:/api/admin/dashboard*");
    });
  });
});

