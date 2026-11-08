import { queueTrackingEvent } from "../../queues/tracking.queue.js";
import logger from "../../utils/logger.js";

/**
 * Service managing client-side and server-side marketing conversions and analytical tracking.
 */
export class TrackingService {
  /**
   * @param {Object} [dependencies]
   * @param {Function} [dependencies.capiSender]
   */
  constructor(dependencies = {}) {
    this.capiSender = dependencies.capiSender || queueTrackingEvent;
  }

  /**
   * Dispatches unified conversion event to analytics and advertising platforms with fault isolation.
   */
  async trackEvent({
    eventName,
    eventData = {},
    userData = {},
    eventId,
    eventSourceUrl = "",
    cookies = {},
    ip,
    userAgent,
    currentUser,
  }) {
    const source = eventSourceUrl || "";
    if (/\/admin(\/|$|\?)/.test(source)) {
      return { success: true, skipped: true, reason: "admin_route" };
    }

    const finalUserData = {
      ...(currentUser?.email && { email: currentUser.email }),
      ...(currentUser?.phone && { phone: currentUser.phone }),
      ...(currentUser?.name && { name: currentUser.name }),
      ...userData,
      ...(cookies._fbp && { fbp: cookies._fbp }),
      ...(cookies._fbc && { fbc: cookies._fbc }),
      ip,
      userAgent,
    };

    try {
      await this.capiSender({
        eventName,
        eventId,
        userData: finalUserData,
        customData: eventData,
        eventSourceUrl,
      });

      return { success: true };
    } catch (error) {
      logger.warn("Tracking event dispatch encountered an error, isolated from client:", {
        eventName,
        error: error.message,
      });
      return { success: true, delivered: false };
    }
  }
}

export default new TrackingService();

