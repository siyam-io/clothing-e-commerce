// src/config/redis.js
import Redis from 'ioredis';

let redisClient = null;
let hasLoggedConnection = false;
export let isRedisQuotaExceeded = false;

export const getRedisConnectionOptions = () => {
  if (!process.env.REDIS_URL || process.env.NODE_ENV === 'test' || isRedisQuotaExceeded) {
    return null;
  }

  const isTls =
    process.env.REDIS_URL.startsWith('rediss://') ||
    process.env.REDIS_URL.includes('upstash.io');

  const options = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    keepAlive: 10000,
    retryStrategy: (times) => {
      if (isRedisQuotaExceeded) return null;
      if (times > 5) return null;
      return Math.min(times * 200, 2000);
    },
    reconnectOnError: (err) => {
      if (err.message && err.message.includes("max requests limit exceeded")) {
        isRedisQuotaExceeded = true;
        return false;
      }
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        return true;
      }
      if (err.message.includes("ECONNRESET") || err.message.includes("closed")) {
        return true;
      }
      return false;
    },
  };

  if (isTls) {
    options.tls = {
      rejectUnauthorized: false,
    };
  }

  return options;
};

const createClient = () => {
  if (process.env.NODE_ENV === 'test' || isRedisQuotaExceeded) {
    return null;
  }

  if (!process.env.REDIS_URL) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(' Redis not configured. Performance will be degraded.');
    }
    return null;
  }

  const redisOptions = getRedisConnectionOptions();
  if (!redisOptions) return null;

  try {
    const client = new Redis(process.env.REDIS_URL, redisOptions);

    client.on('connect', () => {
      if (!hasLoggedConnection) {
        console.log(' Redis connection established');
        hasLoggedConnection = true;
      }
    });

    client.on('error', (err) => {
      if (err.message && err.message.includes("max requests limit exceeded")) {
        if (!isRedisQuotaExceeded) {
          isRedisQuotaExceeded = true;
          console.warn(' Upstash Redis quota limit exceeded. Gracefully bypassing Redis operations.');
        }
        return;
      }
      // Only log actual errors, not disconnects if already reconnecting
      if (client.status !== 'reconnecting' || process.env.NODE_ENV === 'development') {
        console.error(' Redis error:', err.message);
      }
    });

    return client;
  } catch (error) {
    console.warn(' Failed to construct Redis client, bypassing:', error.message);
    return null;
  }
};

if (!redisClient) {
  redisClient = createClient();
}

export default redisClient;