import redis from "../config/redis.js";
import logger from "../utils/logger.js";

/**
 * Express middleware for Redis response caching on idempotent GET requests.
 *
 * @param {number} [ttl=300] - Cache entry time to live in seconds.
 * @returns {Function} Express middleware handler.
 */
export const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    if (!redis || req.method !== "GET" || req.headers.authorization) {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      if (redis.status !== "ready") {
        return next();
      }

      const cachedResponse = await redis.get(key);
      if (cachedResponse) {
        return res.status(200).json(JSON.parse(cachedResponse));
      }

      const originalJson = res.json.bind(res);
      res.json = (data) => {
        if (res.statusCode === 200) {
          redis.set(key, JSON.stringify(data), "EX", ttl).catch((err) => {
            logger.error("Redis set operation failed:", { key, error: err.message });
          });
        }
        return originalJson(data);
      };

      next();
    } catch (err) {
      logger.error("Redis cache lookup error:", { key, error: err.message });
      next();
    }
  };
};

/**
 * Invalidate cached keys matching a glob pattern using Redis scan stream.
 *
 * @param {string} pattern - Key glob pattern (e.g. 'cache:/api/products*').
 */
export const clearCache = (pattern) => {
  if (!redis || redis.status !== "ready") return;

  const stream = redis.scanStream({
    match: pattern,
    count: 100,
  });

  stream.on("data", (resultKeys) => {
    if (resultKeys.length > 0) {
      redis.del(resultKeys).catch((err) => {
        logger.error("Redis key deletion failed:", { count: resultKeys.length, error: err.message });
      });
    }
  });

  stream.on("error", (err) => {
    logger.error("Redis key scan error:", { pattern, error: err.message });
  });
};
