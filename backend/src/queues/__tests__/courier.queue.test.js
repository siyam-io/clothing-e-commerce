import { jest } from "@jest/globals";

const mockCreateOrder = jest.fn().mockResolvedValue({ consignment_id: "PATHAO-123" });
const mockFindById = jest.fn();

jest.unstable_mockModule("../../services/pathao.service.js", () => ({
  default: {
    createOrder: mockCreateOrder,
  },
}));

jest.unstable_mockModule("../../modules/order/order.model.js", () => ({
  default: {
    findById: mockFindById,
  },
}));

jest.unstable_mockModule("../../utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("BullMQ Courier Queue", () => {
  let processCourierJob;
  let queuePathaoDispatch;

  beforeAll(async () => {
    const queueModule = await import("../courier.queue.js");
    processCourierJob = queueModule.processCourierJob;
    queuePathaoDispatch = queueModule.queuePathaoDispatch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("processCourierJob creates Pathao consignment and updates order", async () => {
    const mockOrderDoc = {
      _id: "order_999",
      pathaoConsignmentId: null,
      pathaoStatus: null,
      save: jest.fn().mockResolvedValue(true),
    };
    mockFindById.mockResolvedValue(mockOrderDoc);

    const job = {
      id: "cour_1",
      name: "dispatch_pathao_order",
      data: {
        orderId: "order_999",
        payload: { recipient_phone: "01700000000" },
        pKeys: { storeId: "123" },
      },
    };

    const res = await processCourierJob(job);
    expect(res).toEqual({ success: true, consignmentId: "PATHAO-123" });
    expect(mockCreateOrder).toHaveBeenCalledWith(job.data.payload, job.data.pKeys);
    expect(mockOrderDoc.pathaoConsignmentId).toBe("PATHAO-123");
    expect(mockOrderDoc.pathaoStatus).toBe("Synced");
    expect(mockOrderDoc.save).toHaveBeenCalled();
  });

  test("queuePathaoDispatch executes direct fallback in test mode", async () => {
    const mockOrderDoc = {
      _id: "order_888",
      save: jest.fn().mockResolvedValue(true),
    };
    mockFindById.mockResolvedValue(mockOrderDoc);

    const res = await queuePathaoDispatch({
      orderId: "order_888",
      payload: { recipient_phone: "01800000000" },
      pKeys: { storeId: "456" },
    });

    expect(res).toEqual({ queued: false, consignmentId: "PATHAO-123" });
    expect(mockCreateOrder).toHaveBeenCalled();
  });
});

