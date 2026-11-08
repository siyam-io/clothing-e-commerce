import axios from "axios";
import logger from "../utils/logger.js";

const DEFAULT_HTTP_TIMEOUT_MS = 10000;
const TOKEN_CACHE_SAFETY_MARGIN_MS = 5 * 60 * 1000; // 5 minutes prior to expiry

/**
 * Service managing integration with the bKash Tokenized Checkout API.
 */
export class BkashService {
  /**
   * @param {Object} [dependencies]
   * @param {import("axios").AxiosInstance} [dependencies.httpClient]
   */
  constructor(dependencies = {}) {
    this.http = dependencies.httpClient || axios;
    this.tokenCache = new Map();
  }

  /**
   * Acquire or retrieve cached OAuth grant token for bKash merchant credentials.
   *
   * @param {Object} credentials - Merchant credential configuration.
   * @param {string} credentials.baseURL - Gateway base URL.
   * @param {string} credentials.appKey - Merchant app key.
   * @param {string} credentials.appSecret - Merchant app secret.
   * @returns {Promise<string>} bKash ID token string.
   */
  async getToken(credentials) {
    const cacheKey = `${credentials.baseURL}:${credentials.appKey}`;
    const cached = this.tokenCache.get(cacheKey);

    if (cached && Date.now() < cached.expiresAt) {
      return cached.token;
    }

    try {
      const response = await this.http.post(
        `${credentials.baseURL}/tokenized/checkout/token/grant`,
        {
          app_key: credentials.appKey,
          app_secret: credentials.appSecret,
        },
        { timeout: DEFAULT_HTTP_TIMEOUT_MS }
      );

      const idToken = response.data?.id_token;
      if (!idToken) {
        throw new Error("bKash authentication response omitted id_token");
      }

      // Default grant tokens last 3600s
      const expiresInMs = (parseInt(response.data.expires_in, 10) || 3600) * 1000;
      this.tokenCache.set(cacheKey, {
        token: idToken,
        expiresAt: Date.now() + expiresInMs - TOKEN_CACHE_SAFETY_MARGIN_MS,
      });

      return idToken;
    } catch (error) {
      logger.error("bKash token grant failure:", {
        error: error.response?.data || error.message,
      });
      throw new Error("Failed to obtain bKash payment authorization token");
    }
  }

  /**
   * Initialize a new bKash payment agreement session.
   *
   * @param {number|string} amount - Charge amount.
   * @param {string} orderId - Merchant reference / Order identifier.
   * @param {string} callbackURL - Target webhook callback endpoint.
   * @param {Object} credentials - Merchant credentials.
   * @returns {Promise<{ bkashURL: string, paymentID: string }>} Redirection details.
   */
  async createPayment(amount, orderId, callbackURL, credentials) {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error("Invalid payment amount: must be a positive number");
    }

    if (!orderId || typeof orderId !== "string" || !orderId.trim()) {
      throw new Error("Invalid orderId protocol");
    }

    const token = await this.getToken(credentials);
    const payload = {
      mode: "0011",
      payerReference: orderId.trim(),
      callbackURL,
      amount: numericAmount.toFixed(2),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: orderId.trim(),
    };

    try {
      const response = await this.http.post(
        `${credentials.baseURL}/tokenized/checkout/create`,
        payload,
        {
          headers: {
            Authorization: token,
            "X-APP-Key": credentials.appKey,
          },
          timeout: DEFAULT_HTTP_TIMEOUT_MS,
        }
      );

      return {
        bkashURL: response.data.bkashURL,
        paymentID: response.data.paymentID,
      };
    } catch (error) {
      logger.error("bKash payment initialization error:", {
        orderId,
        error: error.response?.data?.message || error.message,
      });
      throw new Error("Failed to initialize bKash payment transaction");
    }
  }

  /**
   * Finalize and capture an authorized payment session.
   *
   * @param {string} paymentID - Transaction ID returned during initialization.
   * @param {Object} credentials - Merchant credentials.
   * @returns {Promise<Object>} Execution receipt payload.
   */
  async executePayment(paymentID, credentials) {
    if (!paymentID || typeof paymentID !== "string" || !paymentID.trim()) {
      throw new Error("Invalid bKash paymentID");
    }
    const safePaymentID = paymentID.trim();
    const token = await this.getToken(credentials);

    try {
      const response = await this.http.post(
        `${credentials.baseURL}/tokenized/checkout/execute`,
        { paymentID: safePaymentID },
        {
          headers: {
            Authorization: token,
            "X-APP-Key": credentials.appKey,
          },
          timeout: DEFAULT_HTTP_TIMEOUT_MS,
        }
      );

      return response.data;
    } catch (error) {
      logger.error("bKash payment execution failure:", {
        paymentID: safePaymentID,
        error: error.response?.data?.message || error.message,
      });
      throw new Error("Failed to execute bKash payment capture");
    }
  }

  /**
   * Clear local token cache.
   */
  clearCache() {
    this.tokenCache.clear();
  }
}

export default new BkashService();
