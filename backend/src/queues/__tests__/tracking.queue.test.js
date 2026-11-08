import { jest } from "@jest/globals";

const mockSendUnifiedCapiEvent = jest.fn().mockResolvedValue({ success: true });

jest.unstable_mockModule("../../services/tracking/multiPlatformCapiService.js", () => ({
  sendUnifiedCapiEvent: mockSendUnifiedCapiEvent,
}));

jest.unstable_mockModule("../../utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("BullMQ Tracking Queue", () => {
  let processTrackingJob;
  let queueTrackingEvent;

  beforeAll(async () => {
    const queueModule = await import("../tracking.queue.js");
    processTrackingJob = queueModule.processTrackingJob;
    queueTrackingEvent = queueModule.queueTrackingEvent;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("processTrackingJob dispatches capi event successfully", async () => {
    const eventPayload = {
      eventName: "Purchase",
      eventId: "evt_123",
      userData: { email: "test@example.com" },
    };

    const job = {
      id: "trk_1",
      name: "dispatch_capi_event",
      data: eventPayload,
    };

    const res = await processTrackingJob(job);
    expect(res).toEqual({ success: true });
    expect(mockSendUnifiedCapiEvent).toHaveBeenCalledWith(eventPayload);
  });

  test("processTrackingJob throws on unknown job name", async () => {
    const job = {
      id: "trk_2",
      name: "unknown_tracking",
      data: {},
    };

    await expect(processTrackingJob(job)).rejects.toThrow("Unknown tracking job type: unknown_tracking");
  });

  test("queueTrackingEvent falls back to direct execution in test environment", async () => {
    const payload = { eventName: "ViewContent", eventId: "v_1" };
    await queueTrackingEvent(payload);
    expect(mockSendUnifiedCapiEvent).toHaveBeenCalledWith(payload);
  });
});

