import express from "express";
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  googleLogin,
  facebookLogin,
} from "./auth.controller.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleLoginSchema,
  facebookLoginSchema,
} from "./auth.validation.js";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { loginLimiter, registerLimiter } from "../../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", registerLimiter, validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/google-login", loginLimiter, validate(googleLoginSchema), googleLogin);
router.post("/facebook-login", loginLimiter, validate(facebookLoginSchema), facebookLogin);
router.get("/verify-email", verifyEmail);
router.post("/forgot-password", loginLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", loginLimiter, validate(resetPasswordSchema), resetPassword);
router.get("/me", protect, getMe);

export default router;
