import redis from "../config/redis.js";
import logger from "../utils/logger.js";

// Bounded in-memory cache fallback for high-throughput concurrency when Redis is offline
const memoryCache = new Map();
const MAX_MEMORY_CACHE_ENTRIES = 500;

const cleanExpiredMemoryCache = () => {
  const now = Date.now();
  for (const [key, item] of memoryCache.entries()) {
    if (item.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
};

// Periodic background cleanup every 30 seconds
setInterval(cleanExpiredMemoryCache, 30000).unref();

/**
 * Express middleware for Redis / In-Memory response caching on idempotent GET requests.
 *
 * @param {number} [ttl=300] - Cache entry time to live in seconds.
 * @returns {Function} Express middleware handler.
 */
export const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    if (req.method !== "GET" || req.headers.authorization) {
      return next();
    }

    const key = `cache:${req.originalUrl}`;
    const now = Date.now();

    // 1. Try Redis first if available and ready
    if (redis && redis.status === "ready") {
      try {
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

        return next();
      } catch (err) {
        logger.error("Redis cache lookup error:", { key, error: err.message });
      }
    }

    // 2. High-speed In-Memory Cache Fallback
    const cachedItem = memoryCache.get(key);
    if (cachedItem && cachedItem.expiresAt > now) {
      return res.status(200).json(cachedItem.data);
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode === 200) {
        if (memoryCache.size >= MAX_MEMORY_CACHE_ENTRIES) {
          // Evict oldest entry
          const firstKey = memoryCache.keys().next().value;
          if (firstKey) memoryCache.delete(firstKey);
        }
        memoryCache.set(key, {
          data,
          expiresAt: Date.now() + ttl * 1000,
        });
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Invalidate cached keys matching a glob pattern using Redis scan stream and in-memory cache.
 *
 * @param {string} pattern - Key glob pattern (e.g. 'cache:/api/products*').
 */
export const clearCache = (pattern) => {
  // Clear from in-memory fallback
  if (pattern) {
    const regexPattern = new RegExp(
      "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
    );
    for (const key of memoryCache.keys()) {
      if (regexPattern.test(key)) {
        memoryCache.delete(key);
      }
    }
  }

  // Clear from Redis if connected
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
