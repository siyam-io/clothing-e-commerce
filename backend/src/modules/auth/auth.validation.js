import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name cannot exceed 60 characters"),
  email: z.string().trim().email("A valid email address is required").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("A valid email address is required").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("A valid email address is required").toLowerCase(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const googleLoginSchema = z
  .object({
    idToken: z.string().optional(),
    accessToken: z.string().optional(),
  })
  .refine((data) => Boolean(data.idToken || data.accessToken), {
    message: "Google ID Token or Access Token is required",
  });

export const facebookLoginSchema = z.object({
  accessToken: z.string().min(1, "Facebook Access Token is required"),
});

