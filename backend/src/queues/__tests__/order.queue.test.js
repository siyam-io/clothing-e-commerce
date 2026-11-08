import { jest } from "@jest/globals";

const mockCreateOrderWithTransaction = jest.fn();

jest.unstable_mockModule("../../modules/order/order.service.js", () => ({
  createOrderWithTransaction: mockCreateOrderWithTransaction,
}));

jest.unstable_mockModule("../../utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("BullMQ Order Placement Queue", () => {
  let processOrderPlacementJob;
  let queueOrderPlacement;

  beforeAll(async () => {
    const queueModule = await import("../order.queue.js");
    processOrderPlacementJob = queueModule.processOrderPlacementJob;
    queueOrderPlacement = queueModule.queueOrderPlacement;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("processOrderPlacementJob executes createOrderWithTransaction", async () => {
    const expectedOrder = { _id: "order_bullmq_1", totalPrice: 1200 };
    mockCreateOrderWithTransaction.mockResolvedValue(expectedOrder);

    const job = {
      id: "ord_job_1",
      name: "place_order",
      data: {
        orderPayload: { itemsPrice: 1000 },
        isCOD: true,
      },
    };

    const res = await processOrderPlacementJob(job);
    expect(res).toBe(expectedOrder);
    expect(mockCreateOrderWithTransaction).toHaveBeenCalledWith(
      { itemsPrice: 1000 },
      true
    );
  });

  test("processOrderPlacementJob throws on unknown job name", async () => {
    const job = {
      id: "ord_job_2",
      name: "invalid_order_action",
      data: {},
    };

    await expect(processOrderPlacementJob(job)).rejects.toThrow(
      "Unknown order placement job type: invalid_order_action"
    );
  });

  test("queueOrderPlacement falls back to direct transaction in test environment", async () => {
    const directOrder = { _id: "order_direct_fallback" };
    mockCreateOrderWithTransaction.mockResolvedValue(directOrder);

    const res = await queueOrderPlacement({ itemsPrice: 500 }, false);
    expect(res).toBe(directOrder);
    expect(mockCreateOrderWithTransaction).toHaveBeenCalledWith(
      { itemsPrice: 500 },
      false
    );
  });
});

