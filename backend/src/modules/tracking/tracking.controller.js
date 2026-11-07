import trackingService from "./tracking.service.js";

/**
 * Controller handling marketing and analytics tracking events.
 */
class TrackingController {
  /**
   * Receives and dispatches a tracking event.
   */
  async trackEvent(req, res, next) {
    try {
      const {
        eventName,
        eventData = {},
        userData = {},
        eventId,
        eventSourceUrl = req.body.eventSourceUrl || req.headers.referer || "",
      } = req.body;

      const ip = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
      const userAgent = req.headers["user-agent"];

      const result = await trackingService.trackEvent({
        eventName,
        eventData,
        userData,
        eventId,
        eventSourceUrl,
        cookies: req.cookies || {},
        ip,
        userAgent,
        currentUser: req.user,
      });

      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }
}

export default new TrackingController();

