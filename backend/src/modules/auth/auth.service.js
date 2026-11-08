import crypto from "crypto";
import jwt from "jsonwebtoken";
import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import { AuthRepository } from "./auth.repository.js";
import { queueVerificationEmail, queuePasswordResetEmail } from "../../queues/index.js";
import { clearCache } from "../../middleware/cacheMiddleware.js";
import { ApiError } from "../../utils/responseHandler.js";
import logger from "../../utils/logger.js";

/**
 * Domain service implementing authentication workflows, credential verification, and token lifecycle.
 */
export class AuthService {
  /**
   * @param {Object} [dependencies]
   * @param {AuthRepository} [dependencies.repository]
   * @param {Function} [dependencies.sendVerificationEmail]
   * @param {Function} [dependencies.sendPasswordResetEmail]
   * @param {Function} [dependencies.clearCache]
   * @param {string} [dependencies.jwtSecret]
   */
  constructor(dependencies = {}) {
    this.repository = dependencies.repository || new AuthRepository();
    this.sendVerificationEmail = dependencies.sendVerificationEmail || queueVerificationEmail;
    this.sendPasswordResetEmail = dependencies.sendPasswordResetEmail || queuePasswordResetEmail;
    this.clearCache = dependencies.clearCache || clearCache;
    this.jwtSecret = dependencies.jwtSecret || process.env.JWT_SECRET;
  }

  /**
   * Issue a signed JSON Web Token for the user identity.
   *
   * @param {string} userId - User identifier.
   * @returns {string} Signed JWT.
   */
  generateToken(userId) {
    if (!this.jwtSecret) {
      throw new ApiError(500, "JWT secret key is not configured");
    }
    return jwt.sign({ id: userId }, this.jwtSecret, { expiresIn: "7d", algorithm: "HS256" });
  }

  /**
   * Generate a SHA-256 hash of a plaintext token.
   *
   * @param {string} token - Raw token string.
   * @returns {string} Hex-encoded SHA-256 hash.
   */
  hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Register a new user account with credentials.
   *
   * @param {Object} input
   * @param {string} input.name
   * @param {string} input.email
   * @param {string} input.password
   * @param {string} [input.guestId]
   * @returns {Promise<Object>}
   */
  async register({ name, email, password, guestId }) {
    const existingUser = await this.repository.findByEmail(email);
    if (existingUser) {
      throw new ApiError(400, "Email already registered");
    }

    const customerRole = await this.repository.findDefaultRole();
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await this.repository.create({
      name,
      email: email.toLowerCase(),
      password,
      role: customerRole ? customerRole._id : null,
      emailVerificationToken: verificationToken,
      isEmailVerified: false,
    });

    this.clearCache("cache:/api/admin/dashboard*");
    const emailSent = await this.handleRegistrationEmail(user, verificationToken);

    if (guestId) {
      this.repository.syncGuestOrders(user._id, guestId);
    }

    return {
      message: emailSent
        ? "Registration successful! Please check your email to verify your account."
        : "Registration successful! (Email verification skipped)",
      token: this.generateToken(user._id),
      user: this.formatUserPayload(user, customerRole),
    };
  }

  /**
   * Dispatches verification email or marks verified if SMTP is omitted.
   *
   * @private
   */
  async handleRegistrationEmail(user, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    try {
      await this.sendVerificationEmail(user.email, verificationUrl);
      return true;
    } catch (error) {
      logger.warn("Verification email dispatch failed:", { error: error.message });
      if (!process.env.SMTP_HOST) {
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        await this.repository.save(user);
      }
      return false;
    }
  }

  /**
   * Authenticate user credentials and issue session token.
   *
   * @param {Object} input
   * @param {string} input.email
   * @param {string} input.password
   * @param {string} [input.guestId]
   * @returns {Promise<Object>}
   */
  async login({ email, password, guestId }) {
    const user = await this.repository.findByEmail(email, {
      includePassword: true,
      populateRole: true,
    });

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (user.isActive === false) {
      throw new ApiError(403, "Your account has been deactivated/blocked by admin");
    }

    if (!user.isEmailVerified && process.env.SMTP_HOST) {
      throw new ApiError(401, "Please verify your email before logging in");
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (guestId) {
      this.repository.syncGuestOrders(user._id, guestId);
    }

    return {
      message: "Login successful",
      token: this.generateToken(user._id),
      user: this.formatUserPayload(user, user.role),
    };
  }

  /**
   * Verify account using email verification token.
   *
   * @param {string} token
   * @returns {Promise<{ redirectUrl: string }>}
   */
  async verifyEmail(token) {
    const frontendUrl = process.env.FRONTEND_URL || "";
    if (!token) {
      return { redirectUrl: `${frontendUrl}/login?error=invalid_token` };
    }

    const user = await this.repository.findByVerificationToken(token);
    if (!user) {
      return { redirectUrl: `${frontendUrl}/login?error=invalid_token` };
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await this.repository.save(user);

    return { redirectUrl: `${frontendUrl}/login?verified=true` };
  }

  /**
   * Initiate timing-safe password recovery.
   *
   * @param {string} email
   * @returns {Promise<{ message: string }>}
   */
  async forgotPassword(email) {
    const genericMessage =
      "If that email is registered in our records, a secure password reset link has been dispatched.";

    const user = await this.repository.findByEmail(email);
    if (!user) {
      return { message: genericMessage };
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = this.hashToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await this.repository.save(user);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    try {
      await this.sendPasswordResetEmail(user.email, resetUrl);
    } catch (error) {
      logger.error("Password reset email delivery failure:", { error: error.message });
    }

    return { message: genericMessage };
  }

  /**
   * Reset user password using single-use hashed token.
   *
   * @param {Object} input
   * @param {string} input.token
   * @param {string} input.password
   * @returns {Promise<{ message: string }>}
   */
  async resetPassword({ token, password }) {
    if (!token || !password) {
      throw new ApiError(400, "Token and password are required");
    }

    const hashedToken = this.hashToken(token);
    const user = await this.repository.findByValidResetToken(hashedToken);
    if (!user) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await this.repository.save(user);

    return { message: "Password reset successful. Please login." };
  }

  /**
   * Fetch authenticated user identity details.
   *
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getCurrentUser(userId) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return user;
  }

  /**
   * Authenticate user via Google OAuth2 ID Token or Access Token.
   *
   * @param {Object} input
   * @param {string} [input.idToken]
   * @param {string} [input.accessToken]
   * @param {string} [input.guestId]
   * @returns {Promise<Object>}
   */
  async loginWithGoogle({ idToken, accessToken, guestId }) {
    const googleProfile = await this.resolveGoogleProfile(idToken, accessToken);
    if (!googleProfile.email) {
      throw new ApiError(400, "Google account does not provide an email address");
    }

    const user = await this.upsertSocialUser({
      provider: "google",
      providerIdField: "googleId",
      providerId: googleProfile.googleId,
      email: googleProfile.email,
      name: googleProfile.name,
      avatar: googleProfile.picture,
    });

    if (guestId) {
      this.repository.syncGuestOrders(user._id, guestId);
    }

    return {
      message: "Google login successful",
      token: this.generateToken(user._id),
      user: this.formatUserPayload(user, user.role),
    };
  }

  /**
   * Authenticate user via Facebook Access Token.
   *
   * @param {Object} input
   * @param {string} input.accessToken
   * @param {string} [input.guestId]
   * @returns {Promise<Object>}
   */
  async loginWithFacebook({ accessToken, guestId }) {
    const fbResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
    );

    const { id: facebookId, name, email, picture } = fbResponse.data;
    const resolvedEmail = email ? email.toLowerCase() : `${facebookId}@facebook.com`;

    const user = await this.upsertSocialUser({
      provider: "facebook",
      providerIdField: "facebookId",
      providerId: facebookId,
      email: resolvedEmail,
      name,
      avatar: picture?.data?.url || "",
    });

    if (guestId) {
      this.repository.syncGuestOrders(user._id, guestId);
    }

    return {
      message: "Facebook login successful",
      token: this.generateToken(user._id),
      user: this.formatUserPayload(user, user.role),
    };
  }

  /**
   * Resolve user profile details from Google endpoints.
   *
   * @private
   */
  async resolveGoogleProfile(idToken, accessToken) {
    const isJWT = typeof idToken === "string" && idToken.split(".").length === 3;
    if (idToken && isJWT) {
      const clientId = await this.repository.getGoogleClientId();
      if (!clientId) {
        throw new ApiError(400, "Google client ID is not configured on the server.");
      }
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({ idToken, audience: clientId });
      const payload = ticket.getPayload();
      if (!payload?.email_verified) {
        throw new ApiError(400, "Google account email is not verified");
      }
      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };
    }

    const tokenToUse = accessToken || idToken;
    const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenToUse}` },
    });

    if (!response.data?.email_verified) {
      throw new ApiError(400, "Google account email is not verified");
    }

    return {
      googleId: response.data.sub,
      email: response.data.email,
      name: response.data.name,
      picture: response.data.picture,
    };
  }

  /**
   * Upsert user profile associated with a federated OAuth provider.
   *
   * @private
   */
  async upsertSocialUser({ provider, providerIdField, providerId, email, name, avatar }) {
    const normalizedEmail = email.toLowerCase();
    let user = await this.repository.findByOAuthCriteria({
      $or: [{ email: normalizedEmail }, { [providerIdField]: providerId }],
    });

    if (user) {
      if (user.isActive === false) {
        throw new ApiError(403, "Your account has been deactivated/blocked by admin");
      }
      user[providerIdField] = providerId;
      user.provider = provider;
      user.isEmailVerified = true;
      if (!user.avatar && avatar) user.avatar = avatar;
      await this.repository.save(user);
      return user;
    }

    const customerRole = await this.repository.findDefaultRole();
    const createdUser = await this.repository.create({
      name,
      email: normalizedEmail,
      avatar: avatar || "",
      isEmailVerified: true,
      provider,
      [providerIdField]: providerId,
      role: customerRole ? customerRole._id : null,
    });

    this.clearCache("cache:/api/admin/dashboard*");
    return this.repository.findById(createdUser._id);
  }

  /**
   * Format standardized user identity response.
   *
   * @private
   */
  formatUserPayload(user, role) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role,
    };
  }
}

export default new AuthService();

