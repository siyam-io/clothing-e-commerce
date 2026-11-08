import Redis from "ioredis";
import { getRedisConnectionOptions, isRedisQuotaExceeded } from "../config/redis.js";
import logger from "../utils/logger.js";

/**
 * Create a dedicated Redis connection instance tailored for BullMQ.
 *
 * @returns {Redis|null} Configured ioredis client or null if Redis is not configured.
 */
export const createQueueConnection = () => {
  if (isRedisQuotaExceeded) {
    return null;
  }

  const options = getRedisConnectionOptions();
  if (!options || !process.env.REDIS_URL) {
    return null;
  }

  try {
    const client = new Redis(process.env.REDIS_URL, {
      ...options,
      maxRetriesPerRequest: null, // Strictly required by BullMQ
      enableReadyCheck: false,
    });

    client.on("error", (err) => {
      if (err.message && err.message.includes("max requests limit exceeded")) {
        return;
      }
      logger.warn("BullMQ Redis connection warning:", { error: err.message });
    });

    return client;
  } catch (error) {
    logger.warn("Failed to initialize BullMQ Redis connection (using in-process fallback):", {
      error: error.message,
    });
    return null;
  }
};

