import PageSetting from "./settings.model.js";
import ApiKey from "./apiKey.model.js";
import { uploadImage, deleteImage, bustStorageConfigCache } from "../../services/imageUploadService.js";
import { encrypt, decrypt } from "../../utils/encryption.js";
import { clearCache } from "../../middleware/cacheMiddleware.js";
import { ApiError } from "../../utils/responseHandler.js";
import logger from "../../utils/logger.js";

const PUBLIC_BRANDING_KEYS = [
  "siteName",
  "siteTitle",
  "description",
  "socialLinks",
  "logo",
  "logoDark",
  "favicon",
  "activeTheme",
  "defaultTheme",
  "defaultThemeColor",
  "defaultThemeFont",
  "defaultLanguage",
];

const PUBLIC_MARKETING_KEYS = [
  "fbPixelId",
  "gtmId",
  "tiktokPixelId",
  "snapPixelId",
  "pinterestTagId",
  "googleAdsId",
  "clarityId",
];

/**
 * Service managing site branding, payment gateway keys, analytics pixels, and shipping logistics.
 */
export class SettingsService {
  /**
   * @param {Object} [dependencies]
   * @param {typeof PageSetting} [dependencies.pageSettingModel]
   * @param {typeof ApiKey} [dependencies.apiKeyModel]
   * @param {Function} [dependencies.cacheClearer]
   * @param {Function} [dependencies.encryptFn]
   * @param {Function} [dependencies.decryptFn]
   * @param {Function} [dependencies.uploadImageFn]
   * @param {Function} [dependencies.deleteImageFn]
   */
  constructor(dependencies = {}) {
    this.pageSettingModel = dependencies.pageSettingModel || PageSetting;
    this.apiKeyModel = dependencies.apiKeyModel || ApiKey;
    this.cacheClearer = dependencies.cacheClearer || clearCache;
    this.encryptFn = dependencies.encryptFn || encrypt;
    this.decryptFn = dependencies.decryptFn || decrypt;
    this.uploadImageFn = dependencies.uploadImageFn || uploadImage;
    this.deleteImageFn = dependencies.deleteImageFn || deleteImage;
  }

  /**
   * Helper to mask sensitive secret credentials for admin display.
   */
  maskSecret(secret = "") {
    if (!secret || typeof secret !== "string") return "";
    return "••••••••";
  }

  /**
   * Safe eviction of settings-related cache tags.
   */
  bustSettingsCaches() {
    try {
      this.cacheClearer("cache:/api/settings*");
      bustStorageConfigCache();
    } catch (error) {
      logger.warn("Cache eviction skipped in SettingsService:", { error: error.message });
    }
  }

  /**
   * Retrieve storefront settings without exposing internal credentials.
   */
  async getPublicSettings() {
    try {
      let settings = await this.pageSettingModel.findOne().lean();
      if (!settings) {
        settings = {
          branding: { siteName: "Luxury Apparel", siteTitle: "Premium Apparel" },
          paymentOptions: { cod: true, online: true, bkash: true },
          config: { storageMethod: "cloudinary" },
        };
      }

      const apiKeys = await this.apiKeyModel.findOne().lean();
      const marketing = {};
      if (apiKeys) {
        PUBLIC_MARKETING_KEYS.forEach((key) => {
          if (apiKeys[key]) marketing[key] = apiKeys[key];
        });
      }

      const rawBranding = settings.branding || {};
      const branding = PUBLIC_BRANDING_KEYS.reduce((acc, k) => {
        if (rawBranding[k] !== undefined) acc[k] = rawBranding[k];
        return acc;
      }, {});

      return {
        branding,
        socialLinks: settings.socialLinks || [],
        paymentOptions: settings.paymentOptions || { cod: true, online: false, bkash: false },
        shipping: settings.shipping || { insideDhaka: 60, outsideDhaka: 120 },
        marketing,
        auth: {
          googleClientId: apiKeys?.googleClientId || process.env.GOOGLE_CLIENT_ID || "",
          facebookAppId: apiKeys?.facebookAppId || process.env.FACEBOOK_APP_ID || "",
        },
        config: {
          storageMethod: settings.config?.storageMethod || "cloudinary",
          maintenanceMode: Boolean(settings.config?.maintenanceMode),
        },
      };
    } catch (error) {
      logger.error("Failed to query public settings, serving safe defaults:", { error: error.message });
      return {
        branding: { siteName: "Luxury Apparel", siteTitle: "Premium Apparel" },
        paymentOptions: { cod: true, online: false, bkash: false },
        marketing: {},
        auth: {
          googleClientId: process.env.GOOGLE_CLIENT_ID || "",
          facebookAppId: process.env.FACEBOOK_APP_ID || "",
        },
      };
    }
  }

  /**
   * Retrieve categorized settings with masked secrets for administration.
   */
  async getAdminSettings() {
    let [settings, apiKeys] = await Promise.all([
      this.pageSettingModel.findOne(),
      this.apiKeyModel.findOne(),
    ]);

    if (!settings) settings = await this.pageSettingModel.create({});
    if (!apiKeys) apiKeys = await this.apiKeyModel.create({});

    const a = apiKeys.toObject();
    const s = settings.toObject();

    return {
      branding: s.branding || {},
      socialLinks: s.socialLinks || [],
      contact: s.contact || {},
      shipping: s.shipping || {},
      paymentOptions: s.paymentOptions || {},
      config: s.config || {},
      auth: {
        googleClientId: a.googleClientId || "",
        googleClientSecret: this.maskSecret(a.googleClientSecret),
        facebookAppId: a.facebookAppId || "",
      },
      payments: {
        sslStoreId: a.sslStoreId,
        sslStorePassword: this.maskSecret(a.sslStorePassword),
        sslIsTest: a.sslIsTest,
        bkashAppKey: a.bkashAppKey,
        bkashAppSecret: this.maskSecret(a.bkashAppSecret),
        bkashUsername: a.bkashUsername,
        bkashPassword: this.maskSecret(a.bkashPassword),
        bkashIsTest: a.bkashIsTest,
      },
      marketing: {
        fbPixelId: a.fbPixelId,
        fbAccessToken: this.maskSecret(a.fbAccessToken),
        gtmId: a.gtmId,
        tiktokPixelId: a.tiktokPixelId,
        tiktokAccessToken: this.maskSecret(a.tiktokAccessToken),
        googleAdsId: a.googleAdsId,
        clarityId: a.clarityId,
      },
      smtp: {
        mailHost: a.mailHost,
        mailPort: a.mailPort,
        mailUser: a.mailUser,
        mailPass: this.maskSecret(a.mailPass),
        mailFrom: a.mailFrom,
      },
      storage: {
        cloudinaryCloudName: a.cloudinaryCloudName,
        cloudinaryApiKey: a.cloudinaryApiKey,
        cloudinaryApiSecret: this.maskSecret(a.cloudinaryApiSecret),
      },
      ai: {
        geminiApiKey: this.maskSecret(a.geminiApiKey),
      },
    };
  }

  /**
   * Update settings and encrypt modified credentials safely.
   */
  async updateSettings(bodyData = {}, files = {}) {
    let [settings, apiKeys] = await Promise.all([
      this.pageSettingModel.findOne(),
      this.apiKeyModel.findOne(),
    ]);

    if (!settings) settings = await this.pageSettingModel.create({});
    if (!apiKeys) apiKeys = await this.apiKeyModel.create({});

    // Asset uploads for branding
    for (const assetKey of ["logo", "logoDark", "favicon"]) {
      if (files[assetKey]?.[0]) {
        try {
          const url = await this.uploadImageFn(files[assetKey][0], "branding");
          settings.branding[assetKey] = url;
        } catch (err) {
          logger.error(`Branding upload failed for ${assetKey}:`, { error: err.message });
        }
      }
    }

    if (bodyData.branding) {
      const parsedBranding =
        typeof bodyData.branding === "string" ? JSON.parse(bodyData.branding) : bodyData.branding;
      settings.branding = { ...settings.branding, ...parsedBranding };
    }

    if (bodyData.contact) {
      const parsedContact =
        typeof bodyData.contact === "string" ? JSON.parse(bodyData.contact) : bodyData.contact;
      settings.contact = { ...settings.contact, ...parsedContact };
    }

    if (bodyData.paymentOptions) {
      const parsedPayments =
        typeof bodyData.paymentOptions === "string"
          ? JSON.parse(bodyData.paymentOptions)
          : bodyData.paymentOptions;
      settings.paymentOptions = { ...settings.paymentOptions, ...parsedPayments };
    }

    if (bodyData.auth) {
      const parsedAuth =
        typeof bodyData.auth === "string" ? JSON.parse(bodyData.auth) : bodyData.auth;
      if (parsedAuth.googleClientId !== undefined) {
        apiKeys.googleClientId = parsedAuth.googleClientId.trim();
      }
      if (parsedAuth.googleClientSecret !== undefined && parsedAuth.googleClientSecret !== "••••••••") {
        apiKeys.googleClientSecret = parsedAuth.googleClientSecret
          ? this.encryptFn(parsedAuth.googleClientSecret.trim())
          : "";
      }
      if (parsedAuth.facebookAppId !== undefined) {
        apiKeys.facebookAppId = parsedAuth.facebookAppId.trim();
      }
    }

    // Encrypt sensitive secrets only if changed and not masked
    const encryptFields = [
      "sslStorePassword",
      "bkashAppSecret",
      "bkashPassword",
      "mailPass",
      "cloudinaryApiSecret",
      "geminiApiKey",
      "googleClientSecret",
      "fbAccessToken",
      "tiktokAccessToken",
    ];

    for (const key of Object.keys(bodyData)) {
      if (bodyData[key] !== undefined && bodyData[key] !== "••••••••") {
        if (encryptFields.includes(key) && bodyData[key]) {
          apiKeys[key] = this.encryptFn(bodyData[key]);
        } else if (apiKeys.schema.paths[key]) {
          apiKeys[key] = bodyData[key];
        }
      }
    }

    await Promise.all([settings.save(), apiKeys.save()]);
    this.bustSettingsCaches();

    return { message: "Settings updated successfully", settings };
  }

  /**
   * Update shipping logistics configurations.
   */
  async updateShipping(shippingData) {
    let settings = await this.pageSettingModel.findOne();
    if (!settings) settings = await this.pageSettingModel.create({});

    settings.shipping = {
      insideDhaka: Number(shippingData.insideDhaka) || settings.shipping?.insideDhaka || 60,
      outsideDhaka: Number(shippingData.outsideDhaka) || settings.shipping?.outsideDhaka || 120,
      couriers: Array.isArray(shippingData.couriers) ? shippingData.couriers : settings.shipping?.couriers || [],
    };

    await settings.save();
    this.bustSettingsCaches();
    return settings.shipping;
  }
}

export default new SettingsService();

