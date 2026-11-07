import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../config/redis.js";
import logger from "../utils/logger.js";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Instantiate Redis rate limit store with fallback to in-memory handling.
 *
 * @param {string} prefix - Key prefix for bucket partitioning.
 * @returns {RedisStore|undefined} Store instance or undefined to use memory.
 */
const createRedisStore = (prefix) => {
  if (!redisClient) return undefined;
  try {
    return new RedisStore({
      prefix,
      sendCommand: async (...args) => {
        try {
          return await redisClient.call(args[0], ...args.slice(1));
        } catch (err) {
          logger.warn(`Redis rate limit command error (${prefix}), falling back to memory:`, {
            error: err.message,
          });
          throw err;
        }
      },
    });
  } catch (err) {
    logger.error(`Failed to initialize Redis rate limit store for prefix ${prefix}:`, {
      error: err.message,
    });
    return undefined;
  }
};

if (redisClient) {
  logger.info("Distributed Redis rate limiting initialized");
} else {
  logger.info(`In-memory rate limiting initialized (Redis unavailable) [${isDev ? "DEV" : "PROD"}]`);
}

/**
 * Standardized rate limit rejection response formatter.
 */
const rateLimitHandler = (req, res, next, options) => {
  res.status(429).json({
    success: false,
    message: options.message,
    timestamp: new Date().toISOString(),
  });
};

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 0 : 300,
  message: "Too many requests from this address. Please retry after a minute.",
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("rl:api:"),
  passOnStoreError: true,
  skip: (req) => req.method === "OPTIONS" || isDev,
  handler: rateLimitHandler,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 20 : 5,
  message: "Too many login attempts. Please retry after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("rl:login:"),
  passOnStoreError: true,
  keyGenerator: (req, res) => {
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : "";
    const ip = ipKeyGenerator(req, res);
    return email ? `login:${ip}:${email}` : `login:${ip}`;
  },
  handler: rateLimitHandler,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 20 : 3,
  message: "Too many account registrations attempted. Please retry after an hour.",
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("rl:register:"),
  passOnStoreError: true,
  handler: rateLimitHandler,
});

export const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 50 : 10,
  message: "Checkout velocity limit reached. Please retry after an hour.",
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("rl:checkout:"),
  passOnStoreError: true,
  keyGenerator: (req, res) => {
    const userId = req.user?._id || req.user?.id;
    const ip = ipKeyGenerator(req, res);
    return userId ? `checkout:${userId}` : `checkout:${ip}`;
  },
  handler: rateLimitHandler,
});
