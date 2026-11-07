import User from "../user/user.model.js";
import Role from "../role/role.model.js";
import Order from "../order/order.model.js";
import ApiKey from "../settings/apiKey.model.js";
import { decrypt } from "../../utils/encryption.js";
import logger from "../../utils/logger.js";

/**
 * Data access repository for authentication, user credentials, and authorization roles.
 */
export class AuthRepository {
  /**
   * @param {Object} [models] - Database model dependencies.
   * @param {typeof User} [models.userModel]
   * @param {typeof Role} [models.roleModel]
   * @param {typeof Order} [models.orderModel]
   * @param {typeof ApiKey} [models.apiKeyModel]
   */
  constructor(models = {}) {
    this.userModel = models.userModel || User;
    this.roleModel = models.roleModel || Role;
    this.orderModel = models.orderModel || Order;
    this.apiKeyModel = models.apiKeyModel || ApiKey;
  }

  /**
   * Find a user by normalized email address.
   *
   * @param {string} email - User email address.
   * @param {Object} [options]
   * @param {boolean} [options.includePassword=false]
   * @param {boolean} [options.populateRole=true]
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email, { includePassword = false, populateRole = true } = {}) {
    const normalizedEmail = email.toLowerCase().trim();
    let query = this.userModel.findOne({ email: normalizedEmail });

    if (includePassword) {
      query = query.select("+password");
    }
    if (populateRole) {
      query = query.populate("role");
    }

    return query.exec();
  }

  /**
   * Find a user by primary ID.
   *
   * @param {string} userId - User identifier.
   * @param {Object} [options]
   * @param {boolean} [options.populateRole=true]
   * @returns {Promise<Object|null>}
   */
  async findById(userId, { populateRole = true } = {}) {
    let query = this.userModel.findById(userId).select("-password");
    if (populateRole) {
      query = query.populate("role");
    }
    return query.exec();
  }

  /**
   * Find user matching verification token.
   *
   * @param {string} token - Email verification token.
   * @returns {Promise<Object|null>}
   */
  async findByVerificationToken(token) {
    return this.userModel.findOne({ emailVerificationToken: token }).exec();
  }

  /**
   * Find user matching active, unexpired reset token.
   *
   * @param {string} hashedToken - SHA-256 hashed password reset token.
   * @returns {Promise<Object|null>}
   */
  async findByValidResetToken(hashedToken) {
    return this.userModel
      .findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
      })
      .exec();
  }

  /**
   * Find user matching social OAuth parameters.
   *
   * @param {Object} filter - Match query filter.
   * @returns {Promise<Object|null>}
   */
  async findByOAuthCriteria(filter) {
    return this.userModel.findOne(filter).populate("role").exec();
  }

  /**
   * Create a new user record in the database.
   *
   * @param {Object} userData - User record attributes.
   * @returns {Promise<Object>}
   */
  async create(userData) {
    return this.userModel.create(userData);
  }

  /**
   * Save changes on an existing user instance.
   *
   * @param {Object} userDocument - Mongoose document to persist.
   * @returns {Promise<Object>}
   */
  async save(userDocument) {
    return userDocument.save();
  }

  /**
   * Retrieve the default customer role.
   *
   * @returns {Promise<Object|null>}
   */
  async findDefaultRole() {
    return this.roleModel.findOne({ name: "customer" }).exec();
  }

  /**
   * Reassign guest orders to an authenticated user account.
   *
   * @param {string} userId - Target authenticated user ID.
   * @param {string} guestId - Guest session identifier.
   * @returns {Promise<number>} Count of reassigned order records.
   */
  async syncGuestOrders(userId, guestId) {
    if (!userId || !guestId) {
      return 0;
    }

    try {
      const result = await this.orderModel.updateMany(
        {
          guestId,
          $or: [{ user: { $exists: false } }, { user: null }],
        },
        {
          $set: {
            user: userId,
            isGuest: false,
          },
        }
      );
      return result.modifiedCount || 0;
    } catch (error) {
      logger.error("Failed to synchronize guest orders:", {
        userId,
        guestId,
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Fetch decrypted Google Client ID from application settings if available.
   *
   * @returns {Promise<string|null>}
   */
  async getGoogleClientId() {
    try {
      const apiKeys = await this.apiKeyModel.findOne().exec();
      if (apiKeys?.googleClientId) {
        return decrypt(apiKeys.googleClientId);
      }
    } catch (error) {
      logger.error("Failed to retrieve Google Client ID from database settings:", {
        error: error.message,
      });
    }
    return process.env.GOOGLE_CLIENT_ID || null;
  }
}

export default new AuthRepository();

