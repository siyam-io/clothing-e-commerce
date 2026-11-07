import User from "./user.model.js";
import { uploadImage, deleteImage } from "../../services/imageUploadService.js";
import { clearCache } from "../../middleware/cacheMiddleware.js";

/**
 * Service managing user profiles, account settings, and administrative operations.
 */
export class UserService {
  /**
   * @param {Object} [dependencies]
   * @param {Object} [dependencies.userModel]
   * @param {Function} [dependencies.uploadImage]
   * @param {Function} [dependencies.deleteImage]
   * @param {Function} [dependencies.clearCache]
   */
  constructor(dependencies = {}) {
    this.userModel = dependencies.userModel || User;
    this.uploadImage = dependencies.uploadImage || uploadImage;
    this.deleteImage = dependencies.deleteImage || deleteImage;
    this.clearCache = dependencies.clearCache || clearCache;
  }

  /**
   * Retrieves profile of current authenticated user.
   */
  async getMe(userId) {
    const user = await this.userModel.findById(userId).select("-password").populate("role");
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  /**
   * Updates profile attributes of current authenticated user.
   */
  async updateProfile(userId, { name, phone, bio, addresses, file }) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (file) {
      user.avatar = await this.uploadImage(file, "avatars", user.avatar);
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (bio !== undefined) user.bio = bio;

    if (addresses !== undefined) {
      user.addresses = this._parseAddresses(addresses);
    }

    await user.save();
    this.clearCache("cache:/api/admin/dashboard*");

    const updatedUser = await this.userModel.findById(user._id).populate("role");
    return {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      addresses: updatedUser.addresses,
    };
  }

  /**
   * Modifies password after authenticating current credentials.
   */
  async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      const error = new Error("Both current and new password are required");
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 6) {
      const error = new Error("New password must be at least 6 characters");
      error.statusCode = 400;
      throw error;
    }

    const user = await this.userModel.findById(userId).select("+password");
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      const error = new Error("Current password is incorrect");
      error.statusCode = 401;
      throw error;
    }

    user.password = newPassword;
    await user.save();

    return { message: "Password updated successfully" };
  }

  /**
   * Queries paginated users matching criteria.
   */
  async getAllUsers({ search, sort, page = 1, limit = 30 }) {
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const sortOrder = sort ? sort.split(",").join(" ") : "-createdAt";
    const total = await this.userModel.countDocuments(query);
    const users = await this.userModel
      .find(query)
      .select("-password")
      .populate("role")
      .sort(sortOrder)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    return {
      users,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    };
  }

  /**
   * Retrieves single user profile by identifier.
   */
  async getUserById(id) {
    const user = await this.userModel.findById(id).select("-password").populate("role");
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  /**
   * Administrative update of user record and role assignment.
   */
  async updateUser(id, { name, email, role, phone, bio, isActive, addresses, file }) {
    const user = await this.userModel.findById(id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;

    if (isActive !== undefined) {
      user.isActive = isActive === "true" || isActive === true;
    }

    if (addresses !== undefined) {
      user.addresses = this._parseAddresses(addresses);
    }

    if (file) {
      user.avatar = await this.uploadImage(file, "avatars", user.avatar);
    }

    await user.save();
    this.clearCache("cache:/api/admin/dashboard*");

    const updatedUser = await this.userModel.findById(user._id).populate("role");
    return {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
      addresses: updatedUser.addresses,
      isActive: updatedUser.isActive,
    };
  }

  /**
   * Administrative deletion of user with safeguards against self-deletion.
   */
  async deleteUser(id, currentUserId) {
    const user = await this.userModel.findById(id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (user._id.toString() === currentUserId?.toString()) {
      const error = new Error("You cannot delete your own account");
      error.statusCode = 400;
      throw error;
    }

    if (user.avatar) {
      await this.deleteImage(user.avatar);
    }

    await user.deleteOne();
    this.clearCache("cache:/api/admin/dashboard*");

    return { message: "User removed successfully" };
  }

  /**
   * Internal helper parsing addresses structure safely.
   */
  _parseAddresses(addresses) {
    if (typeof addresses === "string") {
      try {
        return JSON.parse(addresses);
      } catch (err) {
        return addresses;
      }
    }
    return addresses;
  }
}

export default new UserService();

