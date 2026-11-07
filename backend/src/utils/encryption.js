import crypto from "crypto";
import logger from "./logger.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit nonce standard for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

const RAW_KEY = process.env.ENCRYPTION_KEY;
if (!RAW_KEY || Buffer.from(RAW_KEY, "utf-8").length < 32) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Configuration error: ENCRYPTION_KEY environment variable must be defined with at least 32 bytes of entropy."
    );
  } else {
    logger.warn(
      "ENCRYPTION_KEY is missing or below 32 bytes. Utilizing development session fallback key."
    );
  }
}

const DERIVED_KEY = crypto
  .createHash("sha256")
  .update(RAW_KEY || "default_dev_secret_key_32_characters_min!!")
  .digest();

/**
 * Encrypts plaintext using AES-256-GCM.
 * Output format: iv:authTag:ciphertext (Hex-encoded).
 *
 * @param {string} text - Plaintext to encrypt.
 * @returns {string} Colon-delimited hex string.
 */
export const encrypt = (text) => {
  if (!text || typeof text !== "string") return "";
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, DERIVED_KEY, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    logger.error("Encryption procedure failed:", { error: error.message });
    return "";
  }
};

/**
 * Decrypts hex-encoded ciphertext back to plaintext.
 * Supports both AES-256-GCM (3 segments) and legacy AES-256-CBC (2 segments).
 *
 * @param {string} text - Encrypted colon-delimited string.
 * @returns {string} Decrypted plaintext or empty string on failure.
 */
export const decrypt = (text) => {
  if (!text || typeof text !== "string" || !text.includes(":")) return text;

  const parts = text.split(":");

  if (parts.length === 3) {
    try {
      const iv = Buffer.from(parts[0], "hex");
      const authTag = Buffer.from(parts[1], "hex");
      const encryptedText = Buffer.from(parts[2], "hex");

      const decipher = crypto.createDecipheriv(ALGORITHM, DERIVED_KEY, iv, {
        authTagLength: AUTH_TAG_LENGTH,
      });
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedText, "binary", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      logger.error("Decryption failed (Authentication Tag mismatch or corrupted payload):", {
        error: error.message,
      });
      return "";
    }
  }

  if (parts.length === 2) {
    try {
      const iv = Buffer.from(parts[0], "hex");
      const encryptedText = Buffer.from(parts[1], "hex");
      const legacyKey = Buffer.from(
        (RAW_KEY || "default_dev_secret_key_32_characters_min!!").padEnd(32, "0").slice(0, 32)
      );

      const decipher = crypto.createDecipheriv("aes-256-cbc", legacyKey, iv);
      let decrypted = decipher.update(encryptedText, "binary", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      logger.error("Legacy CBC decryption failed:", { error: error.message });
      return "";
    }
  }

  return text;
};
