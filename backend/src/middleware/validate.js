import mongoose from "mongoose";
import { ZodError } from "zod";

/**
 * Express middleware generator that validates request payload against a Zod schema.
 *
 * @param {import("zod").ZodSchema} schema - Zod schema to validate against.
 * @returns {Function} Express middleware handler.
 */
export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return res.status(400).json({
        success: false,
        message: formattedErrors[0]?.message || "Validation failed",
        errors: formattedErrors,
      });
    }
    next(error);
  }
};

/**
 * Validates whether the 'id' parameter in request route is a valid MongoDB ObjectId.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 */
export const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid identifier format: ${id}`,
    });
  }
  next();
};
