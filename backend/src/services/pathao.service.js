import axios from "axios";
import redisClient from "../config/redis.js";
import logger from "../utils/logger.js";

const DEFAULT_HTTP_TIMEOUT_MS = 10000;
const FALLBACK_CACHE_MARGIN_SECONDS = 300;

/**
 * Service orchestrating integration with the Pathao Courier Logistics API.
 */
export class PathaoService {
  /**
   * @param {Object} [dependencies]
   * @param {import("ioredis").Redis} [dependencies.redis]
   * @param {import("axios").AxiosInstance} [dependencies.httpClient]
   */
  constructor(dependencies = {}) {
    this.redis = dependencies.redis !== undefined ? dependencies.redis : redisClient;
    this.http = dependencies.httpClient || axios;
    this.localTokenCache = new Map();
  }

  get isCacheReady() {
    return Boolean(this.redis && this.redis.status === "ready");
  }

  formatUrl(url) {
    return (url || "https://courier-api-sandbox.pathao.com").replace(/\/$/, "");
  }

  /**
   * Acquire or retrieve cached OAuth access token for Pathao API.
   *
   * @param {Object} credentials - Merchant API credentials.
   * @returns {Promise<string>} Bearer access token.
   */
  async getToken(credentials) {
    const cacheKey = `pathao:token:${credentials.clientId}`;

    if (this.isCacheReady) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) return cached;
      } catch (err) {
        logger.warn("Redis lookup failed in PathaoService, using local cache:", { error: err.message });
      }
    } else {
      const local = this.localTokenCache.get(cacheKey);
      if (local && Date.now() < local.expiresAt) {
        return local.token;
      }
    }

    const url = this.formatUrl(credentials.baseURL);

    try {
      const response = await this.http.post(
        `${url}/aladdin/api/v1/issue-token`,
        {
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          username: credentials.userName,
          password: credentials.password,
          grant_type: "password",
        },
        { timeout: DEFAULT_HTTP_TIMEOUT_MS }
      );

      const token = response.data?.access_token;
      if (!token) {
        throw new Error("Missing access_token in Pathao authentication response");
      }

      const expiresIn = response.data.expires_in || 3600;
      const ttl = Math.max(60, expiresIn - FALLBACK_CACHE_MARGIN_SECONDS);

      if (this.isCacheReady) {
        await this.redis.setex(cacheKey, ttl, token).catch((err) => {
          logger.warn("Redis write error in PathaoService:", { error: err.message });
        });
      } else {
        this.localTokenCache.set(cacheKey, {
          token,
          expiresAt: Date.now() + ttl * 1000,
        });
      }

      return token;
    } catch (error) {
      logger.error("Pathao authentication error:", {
        error: error.response?.data || error.message,
      });
      throw new Error(`Pathao authentication failure: ${error.response?.data?.message || "Verify credentials."}`);
    }
  }

  /**
   * Resolve geographic city and zone identifiers for a free-form address string.
   *
   * @param {string} addressString - Target street and city text.
   * @param {Object} credentials - Merchant API credentials.
   * @returns {Promise<Object|null>} Geographic identification parameters.
   */
  async autoResolveAddress(addressString, credentials) {
    if (!addressString || typeof addressString !== "string") {
      return null;
    }

    const token = await this.getToken(credentials);
    const url = this.formatUrl(credentials.baseURL);

    try {
      const response = await this.http.get(`${url}/aladdin/api/v1/areas/search`, {
        params: { name: addressString },
        headers: { Authorization: `Bearer ${token}` },
        timeout: DEFAULT_HTTP_TIMEOUT_MS,
      });

      const suggestions = response.data?.data;
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        const bestMatch = suggestions[0];
        return {
          city_id: bestMatch.city_id,
          zone_id: bestMatch.zone_id,
          area_id: bestMatch.area_id,
          full_address: bestMatch.full_address,
        };
      }
      return null;
    } catch (error) {
      logger.error("Pathao address resolution error:", { error: error.message });
      return null;
    }
  }

  /**
   * Dispatch consignment delivery consignment request to Pathao Courier.
   *
   * @param {Object} payload - Standard Pathao order consignment body.
   * @param {Object} credentials - Merchant API credentials.
   * @returns {Promise<Object>} Created consignment metadata.
   */
  async createOrder(payload, credentials) {
    const token = await this.getToken(credentials);
    const url = this.formatUrl(credentials.baseURL);

    try {
      const response = await this.http.post(`${url}/aladdin/api/v1/orders`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: DEFAULT_HTTP_TIMEOUT_MS,
      });

      return response.data?.data;
    } catch (error) {
      logger.error("Pathao order creation failed:", {
        error: error.response?.data || error.message,
      });
      throw new Error(error.response?.data?.message || "Failed to synchronize shipment with Pathao.");
    }
  }
}

export default new PathaoService();
