import { jest } from "@jest/globals";
import { TrackingService } from "../tracking.service.js";

describe("TrackingService", () => {
  let trackingService;
  let mockCapiSender;

  beforeEach(() => {
    mockCapiSender = jest.fn().mockResolvedValue({ success: true });
    trackingService = new TrackingService({ capiSender: mockCapiSender });
  });

  it("should skip tracking when URL matches admin paths", async () => {
    const result = await trackingService.trackEvent({
      eventName: "PageView",
      eventSourceUrl: "https://example.com/admin/dashboard",
    });

    expect(result).toEqual({ success: true, skipped: true, reason: "admin_route" });
    expect(mockCapiSender).not.toHaveBeenCalled();
  });

  it("should enrich payload with currentUser and cookies and dispatch event", async () => {
    const payload = {
      eventName: "Purchase",
      eventData: { value: 1200, currency: "BDT" },
      userData: { city: "Dhaka" },
      eventId: "evt-12345",
      eventSourceUrl: "https://example.com/checkout",
      cookies: { _fbp: "fb.1.123", _fbc: "fb.1.456" },
      ip: "103.20.10.1",
      userAgent: "Mozilla/5.0",
      currentUser: { email: "customer@example.com", phone: "01700000000", name: "Rahim" },
    };

    const result = await trackingService.trackEvent(payload);

    expect(result).toEqual({ success: true });
    expect(mockCapiSender).toHaveBeenCalledWith({
      eventName: "Purchase",
      eventId: "evt-12345",
      userData: {
        email: "customer@example.com",
        phone: "01700000000",
        name: "Rahim",
        city: "Dhaka",
        fbp: "fb.1.123",
        fbc: "fb.1.456",
        ip: "103.20.10.1",
        userAgent: "Mozilla/5.0",
      },
      customData: { value: 1200, currency: "BDT" },
      eventSourceUrl: "https://example.com/checkout",
    });
  });

  it("should handle anonymous guests without current user", async () => {
    const payload = {
      eventName: "ViewContent",
      eventData: { content_id: "prod-99" },
      userData: {},
      eventId: "evt-anon",
      eventSourceUrl: "https://example.com/product/t-shirt",
      cookies: {},
      ip: "127.0.0.1",
      userAgent: "JestRunner",
      currentUser: null,
    };

    const result = await trackingService.trackEvent(payload);

    expect(result).toEqual({ success: true });
    expect(mockCapiSender).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "ViewContent",
        userData: expect.objectContaining({
          ip: "127.0.0.1",
          userAgent: "JestRunner",
        }),
      })
    );
  });

  it("should safely catch and isolate external CAPI errors without throwing", async () => {
    mockCapiSender.mockRejectedValue(new Error("Network timeout to Facebook Graph API"));

    const result = await trackingService.trackEvent({
      eventName: "AddToCart",
      eventSourceUrl: "https://example.com/cart",
    });

    expect(result).toEqual({ success: true, delivered: false });
  });
});

