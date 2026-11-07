import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AuthService } from "../auth.service.js";
import { ApiError } from "../../../utils/responseHandler.js";

describe("AuthService", () => {
  let authService;
  let mockRepository;
  let mockSendVerificationEmail;
  let mockSendPasswordResetEmail;
  let mockClearCache;

  const sampleUser = {
    _id: "user-123",
    name: "Jane Doe",
    email: "jane@example.com",
    avatar: "https://example.com/avatar.jpg",
    isActive: true,
    isEmailVerified: true,
    comparePassword: jest.fn(),
    save: jest.fn().mockResolvedValue(true),
  };

  const sampleRole = {
    _id: "role-123",
    name: "customer",
    permissions: ["products:read"],
  };

  beforeEach(() => {
    mockRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByVerificationToken: jest.fn(),
      findByValidResetToken: jest.fn(),
      findByOAuthCriteria: jest.fn(),
      create: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
      findDefaultRole: jest.fn().mockResolvedValue(sampleRole),
      syncGuestOrders: jest.fn().mockResolvedValue(1),
      getGoogleClientId: jest.fn().mockResolvedValue("mock-client-id"),
    };

    mockSendVerificationEmail = jest.fn().mockResolvedValue(true);
    mockSendPasswordResetEmail = jest.fn().mockResolvedValue(true);
    mockClearCache = jest.fn();

    authService = new AuthService({
      repository: mockRepository,
      sendVerificationEmail: mockSendVerificationEmail,
      sendPasswordResetEmail: mockSendPasswordResetEmail,
      clearCache: mockClearCache,
      jwtSecret: "test-jwt-secret-key-12345",
    });
  });

  describe("register", () => {
    it("should successfully register a new user and return token and payload", async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        ...sampleUser,
        role: sampleRole._id,
      });

      const result = await authService.register({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "secretPassword123",
        guestId: "guest-456",
      });

      expect(mockRepository.findByEmail).toHaveBeenCalledWith("jane@example.com");
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockClearCache).toHaveBeenCalledWith("cache:/api/admin/dashboard*");
      expect(mockRepository.syncGuestOrders).toHaveBeenCalledWith("user-123", "guest-456");
      expect(result).toHaveProperty("token");
      expect(result.user.email).toBe("jane@example.com");
    });

    it("should reject registration if email is already registered", async () => {
      mockRepository.findByEmail.mockResolvedValue(sampleUser);

      await expect(
        authService.register({
          name: "Jane Doe",
          email: "jane@example.com",
          password: "secretPassword123",
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("login", () => {
    it("should successfully authenticate with valid credentials", async () => {
      const user = {
        ...sampleUser,
        role: sampleRole,
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      mockRepository.findByEmail.mockResolvedValue(user);

      const result = await authService.login({
        email: "jane@example.com",
        password: "validPassword",
        guestId: "guest-789",
      });

      expect(result).toHaveProperty("token");
      expect(result.user.name).toBe("Jane Doe");
      expect(mockRepository.syncGuestOrders).toHaveBeenCalledWith("user-123", "guest-789");
    });

    it("should throw 401 when user is not found", async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: "unknown@example.com",
          password: "password123",
        })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it("should throw 401 when password does not match", async () => {
      const user = {
        ...sampleUser,
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      mockRepository.findByEmail.mockResolvedValue(user);

      await expect(
        authService.login({
          email: "jane@example.com",
          password: "wrongPassword",
        })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it("should throw 403 when user account is deactivated", async () => {
      const inactiveUser = {
        ...sampleUser,
        isActive: false,
      };
      mockRepository.findByEmail.mockResolvedValue(inactiveUser);

      await expect(
        authService.login({
          email: "jane@example.com",
          password: "validPassword",
        })
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe("forgotPassword", () => {
    it("should return generic message when user does not exist to prevent enumeration", async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      const result = await authService.forgotPassword("absent@example.com");

      expect(result.message).toContain("If that email is registered");
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("should generate reset token and dispatch email when user exists", async () => {
      const user = { ...sampleUser, save: jest.fn().mockResolvedValue(true) };
      mockRepository.findByEmail.mockResolvedValue(user);

      const result = await authService.forgotPassword("jane@example.com");

      expect(result.message).toContain("If that email is registered");
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    it("should throw 400 when token is invalid or expired", async () => {
      mockRepository.findByValidResetToken.mockResolvedValue(null);

      await expect(
        authService.resetPassword({
          token: "invalid-token",
          password: "newPassword123",
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("should update password when token is valid", async () => {
      const user = { ...sampleUser, save: jest.fn().mockResolvedValue(true) };
      mockRepository.findByValidResetToken.mockResolvedValue(user);

      const result = await authService.resetPassword({
        token: "valid-token",
        password: "newPassword123",
      });

      expect(user.password).toBe("newPassword123");
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.message).toBe("Password reset successful. Please login.");
    });
  });

  describe("getCurrentUser", () => {
    it("should return user details when user exists", async () => {
      mockRepository.findById.mockResolvedValue(sampleUser);

      const result = await authService.getCurrentUser("user-123");

      expect(result._id).toBe("user-123");
      expect(result.name).toBe("Jane Doe");
    });

    it("should throw 404 when user is not found", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(authService.getCurrentUser("non-existent-id")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("verifyEmail", () => {
    it("should redirect to verified page on successful token validation", async () => {
      const user = { ...sampleUser, save: jest.fn().mockResolvedValue(true) };
      mockRepository.findByVerificationToken.mockResolvedValue(user);

      const result = await authService.verifyEmail("valid-token");

      expect(user.isEmailVerified).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.redirectUrl).toContain("verified=true");
    });

    it("should redirect to error page when token is invalid", async () => {
      mockRepository.findByVerificationToken.mockResolvedValue(null);

      const result = await authService.verifyEmail("invalid-token");

      expect(result.redirectUrl).toContain("error=invalid_token");
    });
  });
});

