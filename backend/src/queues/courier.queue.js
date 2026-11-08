import { Queue, Worker } from "bullmq";
import { createQueueConnection } from "./queue.connection.js";
import pathaoService from "../services/pathao.service.js";
import Order from "../modules/order/order.model.js";
import logger from "../utils/logger.js";

const QUEUE_NAME = "courier-queue";

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 3000,
  },
  removeOnComplete: {
    count: 200,
  },
  removeOnFail: {
    count: 500,
  },
};

let queueConnection = null;
let workerConnection = null;
let courierQueue = null;
let courierWorker = null;

try {
  queueConnection = createQueueConnection();
  if (queueConnection) {
    courierQueue = new Queue(QUEUE_NAME, {
      connection: queueConnection,
      defaultJobOptions,
    });
    logger.info("BullMQ Courier Queue initialized successfully");
  }
} catch (error) {
  logger.warn("BullMQ Courier Queue initialization bypassed:", {
    error: error.message,
  });
}

/**
 * Worker processor for Courier operations (Pathao).
 */
export const processCourierJob = async (job) => {
  const { name, data } = job;
  logger.info(`Processing BullMQ courier job [${name}] (ID: ${job.id})`);

  if (name === "dispatch_pathao_order") {
    const { orderId, payload, pKeys } = data;
    const pRes = await pathaoService.createOrder(payload, pKeys);

    const order = await Order.findById(orderId);
    if (order) {
      order.pathaoConsignmentId = pRes.consignment_id;
      order.pathaoStatus = "Synced";
      await order.save();
      logger.info(`Order #${orderId} successfully synced with Pathao (Consignment: ${pRes.consignment_id})`);
    }

    return { success: true, consignmentId: pRes.consignment_id };
  }

  throw new Error(`Unknown courier job type: ${name}`);
};

/**
 * Start the background worker for courier queue.
 */
export const startCourierWorker = (io = null) => {
  if (courierWorker) return courierWorker;

  workerConnection = createQueueConnection();
  if (!workerConnection) {
    logger.info("Redis not available; courier worker skipped (direct fallback active)");
    return null;
  }

  try {
    courierWorker = new Worker(QUEUE_NAME, processCourierJob, {
      connection: workerConnection,
      concurrency: 2, // Conservative rate limiting for Courier APIs
    });

    courierWorker.on("error", (err) => {
      logger.warn(`BullMQ Courier Worker connection notice: ${err.message}`);
    });

    courierWorker.on("completed", (job, result) => {
      logger.info(`Courier job [${job.id}] completed successfully:`, result);
      if (io && job.data?.orderId) {
        io.emit("order_updated", {
          orderId: job.data.orderId,
          pathaoConsignmentId: result.consignmentId,
          pathaoStatus: "Synced",
        });
      }
    });

    courierWorker.on("failed", (job, err) => {
      logger.error(`Courier job [${job?.id}] failed:`, {
        error: err.message,
        attemptsMade: job?.attemptsMade,
      });
    });

    logger.info("BullMQ Courier Worker started successfully");
    return courierWorker;
  } catch (error) {
    logger.error("Failed to start BullMQ Courier Worker:", { error: error.message });
    return null;
  }
};

/**
 * Queue a Pathao dispatch job or fall back to direct execution.
 */
export const queuePathaoDispatch = async ({ orderId, payload, pKeys }) => {
  if (courierQueue) {
    try {
      const job = await courierQueue.add("dispatch_pathao_order", {
        orderId,
        payload,
        pKeys,
      });
      return { queued: true, jobId: job.id };
    } catch (err) {
      logger.warn("Failed to enqueue courier dispatch, falling back to direct call:", {
        error: err.message,
      });
    }
  }

  // Direct fallback
  const pRes = await pathaoService.createOrder(payload, pKeys);
  const order = await Order.findById(orderId);
  if (order) {
    order.pathaoConsignmentId = pRes.consignment_id;
    order.pathaoStatus = "Synced";
    await order.save();
  }
  return { queued: false, consignmentId: pRes.consignment_id };
};

/**
 * Gracefully close courier queue and worker.
 */
export const closeCourierQueue = async () => {
  try {
    if (courierWorker) {
      await courierWorker.close();
      courierWorker = null;
    }
    if (courierQueue) {
      await courierQueue.close();
      courierQueue = null;
    }
    if (workerConnection) {
      await workerConnection.quit();
      workerConnection = null;
    }
    if (queueConnection) {
      await queueConnection.quit();
      queueConnection = null;
    }
    logger.info("BullMQ Courier Queue and Worker closed gracefully");
  } catch (err) {
    logger.error("Error closing BullMQ Courier Queue/Worker:", { error: err.message });
  }
};

export { courierQueue, courierWorker };

