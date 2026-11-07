import authService from "./auth.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

/**
 * Controller handling user registration, authentication, token lifecycle, and federated login.
 */
export class AuthController {
  /**
   * @param {import("./auth.service.js").AuthService} [service]
   */
  constructor(service = authService) {
    this.service = service;
  }

  /**
   * Handle user account registration.
   */
  register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const guestId = req.headers["x-guest-id"];
    const result = await this.service.register({ name, email, password, guestId });
    res.status(201).json(result);
  });

  /**
   * Handle email and password credential authentication.
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const guestId = req.headers["x-guest-id"];
    const result = await this.service.login({ email, password, guestId });
    res.status(200).json(result);
  });

  /**
   * Handle email confirmation via token link.
   */
  verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;
    const { redirectUrl } = await this.service.verifyEmail(token);
    res.redirect(redirectUrl);
  });

  /**
   * Request password reset link for user email.
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await this.service.forgotPassword(email);
    res.status(200).json(result);
  });

  /**
   * Reset account password with token.
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.query;
    const { password } = req.body;
    const result = await this.service.resetPassword({ token, password });
    res.status(200).json(result);
  });

  /**
   * Retrieve current authenticated user profile.
   */
  getMe = asyncHandler(async (req, res) => {
    const user = await this.service.getCurrentUser(req.user.id);
    res.status(200).json(user);
  });

  /**
   * Handle federated Google OAuth sign-in.
   */
  googleLogin = asyncHandler(async (req, res) => {
    const { idToken, accessToken } = req.body;
    const guestId = req.headers["x-guest-id"];
    const result = await this.service.loginWithGoogle({ idToken, accessToken, guestId });
    res.status(200).json(result);
  });

  /**
   * Handle federated Facebook OAuth sign-in.
   */
  facebookLogin = asyncHandler(async (req, res) => {
    const { accessToken } = req.body;
    const guestId = req.headers["x-guest-id"];
    const result = await this.service.loginWithFacebook({ accessToken, guestId });
    res.status(200).json(result);
  });
}

const authController = new AuthController();

export const register = authController.register;
export const login = authController.login;
export const verifyEmail = authController.verifyEmail;
export const forgotPassword = authController.forgotPassword;
export const resetPassword = authController.resetPassword;
export const getMe = authController.getMe;
export const googleLogin = authController.googleLogin;
export const facebookLogin = authController.facebookLogin;

export default authController;
