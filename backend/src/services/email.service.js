import nodemailer from "nodemailer";
import ApiKey from "../modules/settings/apiKey.model.js";
import PageSetting from "../modules/settings/settings.model.js";
import { decrypt } from "../utils/encryption.js";
import logger from "../utils/logger.js";

const SETTINGS_CACHE_TTL_MS = 60 * 1000;

/**
 * Escape HTML special characters to prevent HTML/XSS injection in email templates.
 *
 * @param {*} str - Raw string or value.
 * @returns {string} Escaped string.
 */
export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sanitize email headers to prevent SMTP header injection (CRLF attacks).
 *
 * @param {*} val - Header value.
 * @returns {string} Sanitized single-line string.
 */
export function sanitizeHeader(val) {
  if (val == null) return "";
  return String(val).replace(/[\r\n]/g, "").trim();
}

/**
 * Service managing transactional email templates and SMTP transport.
 */
export class EmailService {
  /**
   * @param {Object} [dependencies]
   * @param {typeof ApiKey} [dependencies.apiKeyModel]
   * @param {typeof PageSetting} [dependencies.pageSettingModel]
   * @param {Function} [dependencies.transportFactory]
   */
  constructor(dependencies = {}) {
    this.apiKeyModel = dependencies.apiKeyModel || ApiKey;
    this.pageSettingModel = dependencies.pageSettingModel || PageSetting;
    this.transportFactory = dependencies.transportFactory || nodemailer.createTransport;

    this.cachedConfig = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Retrieve and decrypt SMTP configuration, cached for 60 seconds.
   *
   * @returns {Promise<Object>} SMTP configuration settings.
   */
  async getConfiguration() {
    const now = Date.now();
    if (this.cachedConfig && now - this.cacheTimestamp < SETTINGS_CACHE_TTL_MS) {
      return this.cachedConfig;
    }

    try {
      const [apiKeys, settings] = await Promise.all([
        this.apiKeyModel.findOne().exec(),
        this.pageSettingModel.findOne().exec(),
      ]);

      const siteName = settings?.branding?.siteName || "Store";

      if (apiKeys?.mailHost) {
        this.cachedConfig = {
          host: apiKeys.mailHost,
          port: parseInt(apiKeys.mailPort, 10),
          secure: Number(apiKeys.mailPort) === 465,
          auth: {
            user: apiKeys.mailUser,
            pass: decrypt(apiKeys.mailPass),
          },
          from: apiKeys.mailFrom && apiKeys.mailUser
            ? `"${apiKeys.mailFrom}" <${apiKeys.mailUser}>`
            : `"${siteName}" <${apiKeys.mailUser}>`,
          siteName,
        };
      } else {
        this.cachedConfig = {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587", 10),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          from: `"${process.env.EMAIL_FROM_NAME || siteName}" <${process.env.EMAIL_FROM_ADDRESS || "noreply@store.com"}>`,
          siteName,
        };
      }

      this.cacheTimestamp = now;
      return this.cachedConfig;
    } catch (error) {
      logger.error("Failed to load email configuration, falling back to environment variables:", {
        error: error.message,
      });

      return {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        from: `"${process.env.EMAIL_FROM_NAME || "Store"}" <${process.env.EMAIL_FROM_ADDRESS || "noreply@store.com"}>`,
        siteName: "Store",
      };
    }
  }

  /**
   * Reset configuration cache on settings mutation.
   */
  bustCache() {
    this.cachedConfig = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Build Nodemailer transporter from current configuration.
   *
   * @param {Object} config
   * @returns {import("nodemailer").Transporter}
   */
  createTransporter(config) {
    return this.transportFactory({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
  }

  /**
   * Dispatches email message through SMTP transporter.
   *
   * @param {Object} mailOptions
   * @param {string} mailOptions.to
   * @param {string} mailOptions.subject
   * @param {string} mailOptions.html
   * @returns {Promise<Object>}
   */
  async sendMail({ to, subject, html }) {
    const config = await this.getConfiguration();
    const transporter = this.createTransporter(config);

    const safeTo = sanitizeHeader(to);
    const safeSubject = sanitizeHeader(subject);

    const result = await transporter.sendMail({
      from: config.from,
      to: safeTo,
      subject: safeSubject,
      html,
    });

    logger.info(`Email dispatched: ${safeSubject} to ${safeTo}`);
    return result;
  }

  /**
   * Send account verification link.
   *
   * @param {string} email
   * @param {string} verificationUrl
   * @returns {Promise<Object>}
   */
  async sendVerificationEmail(email, verificationUrl) {
    const config = await this.getConfiguration();
    return this.sendMail({
      to: email,
      subject: `Verify your email - ${config.siteName}`,
      html: this.renderVerificationHtml(config.siteName, verificationUrl),
    });
  }

  /**
   * Send password reset link.
   *
   * @param {string} email
   * @param {string} resetUrl
   * @returns {Promise<Object>}
   */
  async sendPasswordResetEmail(email, resetUrl) {
    const config = await this.getConfiguration();
    return this.sendMail({
      to: email,
      subject: `Reset your password - ${config.siteName}`,
      html: this.renderPasswordResetHtml(config.siteName, resetUrl),
    });
  }

  /**
   * Send order placement confirmation invoice.
   *
   * @param {Object} order
   * @returns {Promise<Object>}
   */
  async sendOrderConfirmationEmail(order) {
    if (!order?.shippingAddress?.email) {
      return null;
    }
    const config = await this.getConfiguration();
    const shortOrderId = order._id.toString().slice(-6).toUpperCase();

    return this.sendMail({
      to: order.shippingAddress.email,
      subject: `Order Confirmation #${shortOrderId} - ${config.siteName}`,
      html: this.renderOrderConfirmationHtml(config.siteName, order, shortOrderId),
    });
  }

  /**
   * Send order status progression notice.
   *
   * @param {Object} order
   * @returns {Promise<Object>}
   */
  async sendOrderStatusUpdateEmail(order) {
    if (!order?.shippingAddress?.email) {
      return null;
    }
    const config = await this.getConfiguration();
    const shortOrderId = order._id.toString().slice(-6).toUpperCase();

    return this.sendMail({
      to: order.shippingAddress.email,
      subject: `Order Update: #${shortOrderId} is now ${order.orderStatus} - ${config.siteName}`,
      html: this.renderOrderStatusUpdateHtml(config.siteName, order, shortOrderId),
    });
  }

  renderVerificationHtml(siteName, url) {
    const safeSiteName = escapeHtml(siteName);
    const safeUrl = encodeURI(url);
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to ${safeSiteName}</h2>
        <p>Please verify your email address by selecting the button below:</p>
        <a href="${safeUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or paste this link into your browser: ${safeUrl}</p>
        <p>This verification link expires in 24 hours.</p>
      </div>
    `;
  }

  renderPasswordResetHtml(siteName, url) {
    const safeSiteName = escapeHtml(siteName);
    const safeUrl = encodeURI(url);
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Select the link below to set a new password:</p>
        <a href="${safeUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>Or paste this link into your browser: ${safeUrl}</p>
        <p>This link expires in 15 minutes.</p>
        <p>If you did not initiate this request, no action is needed.</p>
      </div>
    `;
  }

  renderOrderConfirmationHtml(siteName, order, shortOrderId) {
    const safeSiteName = escapeHtml(siteName);
    const safeShortOrderId = escapeHtml(shortOrderId);
    const customerName = escapeHtml(order.shippingAddress?.name || "Customer");
    const address = escapeHtml(order.shippingAddress?.address || "");
    const phone = escapeHtml(order.shippingAddress?.phone || "");

    const itemsHtml = (order.orderItems || [])
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(item.name)} x ${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price * item.quantity}</td>
        </tr>
      `
      )
      .join("");

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #000;">Order Confirmation</h2>
        <p>Hello ${customerName},</p>
        <p>Your order <strong>#${safeShortOrderId}</strong> has been received and is being processed.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f9f9f9;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Item</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #eee;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td style="padding: 10px; font-weight: bold;">Subtotal</td>
              <td style="padding: 10px; text-align: right; font-weight: bold;">${order.itemsPrice}</td>
            </tr>
            <tr>
              <td style="padding: 10px;">Shipping</td>
              <td style="padding: 10px; text-align: right;">${order.shippingPrice}</td>
            </tr>
            ${
              order.discountAmount > 0
                ? `<tr><td style="padding: 10px; color: #e11d48;">Discount</td><td style="padding: 10px; text-align: right; color: #e11d48;">-${order.discountAmount}</td></tr>`
                : ""
            }
            <tr style="font-size: 18px;">
              <td style="padding: 10px; font-weight: bold; border-top: 2px solid #000;">Total</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #000;">${order.totalPrice}</td>
            </tr>
          </tfoot>
        </table>
        <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
          <h4 style="margin-top: 0;">Shipping Details:</h4>
          <p style="margin-bottom: 0;">${address}<br>Phone: ${phone}</p>
        </div>
      </div>
    `;
  }

  renderOrderStatusUpdateHtml(siteName, order, shortOrderId) {
    const safeSiteName = escapeHtml(siteName);
    const customerName = escapeHtml(order.shippingAddress?.name || "Customer");
    const safeShortOrderId = escapeHtml(shortOrderId);
    const safeStatus = escapeHtml(order.orderStatus);

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #000;">Order Status Update</h2>
        <p>Hello ${customerName},</p>
        <p>The status of your order <strong>#${safeShortOrderId}</strong> has been updated to:</p>
        <div style="margin: 25px 0; padding: 15px; background-color: #000; color: #fff; border-radius: 8px; text-align: center; font-size: 20px; font-weight: bold; text-transform: uppercase;">
          ${safeStatus}
        </div>
        <p>You can track shipment progress from your customer account dashboard.</p>
      </div>
    `;
  }
}

const defaultEmailService = new EmailService();

export const sendVerificationEmail = (email, url) => defaultEmailService.sendVerificationEmail(email, url);
export const sendPasswordResetEmail = (email, url) => defaultEmailService.sendPasswordResetEmail(email, url);
export const sendOrderConfirmationEmail = (order) => defaultEmailService.sendOrderConfirmationEmail(order);
export const sendOrderStatusUpdateEmail = (order) => defaultEmailService.sendOrderStatusUpdateEmail(order);
export const bustEmailConfigCache = () => defaultEmailService.bustCache();

export default defaultEmailService;
