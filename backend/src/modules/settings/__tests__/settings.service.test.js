import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { SettingsService } from "../settings.service.js";

describe("SettingsService", () => {
  let service;
  let mockPageSettingModel;
  let mockApiKeyModel;
  let mockCacheClearer;
  let mockEncryptFn;
  let mockDecryptFn;
  let mockUploadImageFn;
  let mockDeleteImageFn;

  beforeEach(() => {
    mockPageSettingModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    mockApiKeyModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    mockCacheClearer = jest.fn();
    mockEncryptFn = jest.fn((val) => `encrypted_${val}`);
    mockDecryptFn = jest.fn((val) => `decrypted_${val}`);
    mockUploadImageFn = jest.fn();
    mockDeleteImageFn = jest.fn();

    service = new SettingsService({
      pageSettingModel: mockPageSettingModel,
      apiKeyModel: mockApiKeyModel,
      cacheClearer: mockCacheClearer,
      encryptFn: mockEncryptFn,
      decryptFn: mockDecryptFn,
      uploadImageFn: mockUploadImageFn,
      deleteImageFn: mockDeleteImageFn,
    });
  });

  describe("maskSecret", () => {
    it("returns bullets for any non-empty secret", () => {
      expect(service.maskSecret("super_secret_password")).toBe("••••••••");
    });

    it("returns empty string for null or empty secret", () => {
      expect(service.maskSecret(null)).toBe("");
      expect(service.maskSecret("")).toBe("");
    });
  });

  describe("getPublicSettings", () => {
    it("returns public branding and marketing IDs without secrets", async () => {
      const mockSettings = {
        branding: { siteName: "Elite Clothing", activeTheme: "luxury" },
        paymentOptions: { cod: true, online: true },
        shipping: { insideDhaka: 70 },
      };
      const mockApiKeys = {
        fbPixelId: "FB_12345",
        sslStorePassword: "secret_password",
        googleClientId: "test-google-client-id.apps.googleusercontent.com",
      };

      mockPageSettingModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockSettings),
      });
      mockApiKeyModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockApiKeys),
      });

      const result = await service.getPublicSettings();

      expect(result.branding.siteName).toBe("Elite Clothing");
      expect(result.marketing.fbPixelId).toBe("FB_12345");
      expect(result.auth.googleClientId).toBe("test-google-client-id.apps.googleusercontent.com");
      expect(result.sslStorePassword).toBeUndefined();
    });

    it("isolates query errors and returns safe default branding", async () => {
      mockPageSettingModel.findOne.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error("Database disconnected")),
      });

      const result = await service.getPublicSettings();
      expect(result.branding.siteName).toBeDefined();
      expect(result.paymentOptions.cod).toBe(true);
    });
  });

  describe("updateSettings", () => {
    it("encrypts secret fields and ignores unchanged masked values", async () => {
      const mockSettingsDoc = {
        branding: {},
        save: jest.fn().mockResolvedValue(true),
      };
      const mockApiKeysDoc = {
        schema: { paths: { fbPixelId: true, sslStorePassword: true } },
        save: jest.fn().mockResolvedValue(true),
      };

      mockPageSettingModel.findOne.mockResolvedValue(mockSettingsDoc);
      mockApiKeyModel.findOne.mockResolvedValue(mockApiKeysDoc);

      await service.updateSettings({
        sslStorePassword: "new_plain_password",
        bkashAppSecret: "••••••••", // Masked value should not overwrite
        fbPixelId: "NEW_PIXEL",
        auth: JSON.stringify({ googleClientId: "my-google-client-id" }),
      });

      expect(mockEncryptFn).toHaveBeenCalledWith("new_plain_password");
      expect(mockApiKeysDoc.sslStorePassword).toBe("encrypted_new_plain_password");
      expect(mockApiKeysDoc.fbPixelId).toBe("NEW_PIXEL");
      expect(mockApiKeysDoc.googleClientId).toBe("my-google-client-id");
      expect(mockCacheClearer).toHaveBeenCalledWith("cache:/api/settings*");
    });
  });

  describe("updateShipping", () => {
    it("updates delivery rates and persists changes", async () => {
      const mockSettingsDoc = {
        shipping: {},
        save: jest.fn().mockResolvedValue(true),
      };
      mockPageSettingModel.findOne.mockResolvedValue(mockSettingsDoc);

      const result = await service.updateShipping({
        insideDhaka: 80,
        outsideDhaka: 150,
      });

      expect(result.insideDhaka).toBe(80);
      expect(result.outsideDhaka).toBe(150);
      expect(mockSettingsDoc.save).toHaveBeenCalled();
    });
  });
});

