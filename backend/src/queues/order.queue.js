import { Queue, Worker, QueueEvents } from "bullmq";
import { createQueueConnection } from "./queue.connection.js";
import { createOrderWithTransaction } from "../modules/order/order.service.js";
import logger from "../utils/logger.js";

const QUEUE_NAME = "order-placement-queue";

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 500,
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
let eventsConnection = null;
let orderPlacementQueue = null;
let orderPlacementWorker = null;
let orderPlacementEvents = null;

try {
  queueConnection = createQueueConnection();
  if (queueConnection) {
    orderPlacementQueue = new Queue(QUEUE_NAME, {
      connection: queueConnection,
      defaultJobOptions,
    });
    orderPlacementQueue.drain().catch(() => {});
    logger.info("BullMQ Order Placement Queue initialized successfully");
  }

  eventsConnection = createQueueConnection();
  if (eventsConnection) {
    orderPlacementEvents = new QueueEvents(QUEUE_NAME, {
      connection: eventsConnection,
    });
  }
} catch (error) {
  logger.warn("BullMQ Order Placement Queue initialization bypassed:", {
    error: error.message,
  });
}

/**
 * Worker processor for order creation transactions.
 */
export const processOrderPlacementJob = async (job) => {
  const { name, data } = job;
  logger.info(`Processing BullMQ order placement job [${name}] (ID: ${job.id})`);

  if (name === "place_order") {
    const { orderPayload, isCOD } = data;
    const order = await createOrderWithTransaction(orderPayload, isCOD);
    return order;
  }

  throw new Error(`Unknown order placement job type: ${name}`);
};

/**
 * Start the background worker for order placement queue.
 */
export const startOrderPlacementWorker = () => {
  if (orderPlacementWorker) return orderPlacementWorker;

  workerConnection = createQueueConnection();
  if (!workerConnection) {
    logger.info("Redis not available; order placement worker skipped (direct fallback active)");
    return null;
  }

  try {
    orderPlacementWorker = new Worker(QUEUE_NAME, processOrderPlacementJob, {
      connection: workerConnection,
      concurrency: 8, // Smooth transaction concurrency to eliminate MongoDB WriteConflict storms
    });

    orderPlacementWorker.on("error", (err) => {
      logger.warn(`BullMQ Order Placement Worker connection notice: ${err.message}`);
    });

    orderPlacementWorker.on("completed", (job) => {
      logger.info(`Order placement job [${job.id}] committed successfully`);
    });

    orderPlacementWorker.on("failed", (job, err) => {
      logger.error(`Order placement job [${job?.id}] failed:`, {
        error: err.message,
        attemptsMade: job?.attemptsMade,
      });
    });

    logger.info("BullMQ Order Placement Worker started successfully");
    return orderPlacementWorker;
  } catch (error) {
    logger.error("Failed to start BullMQ Order Placement Worker:", { error: error.message });
    return null;
  }
};

/**
 * Submit order to BullMQ concurrency queue and await completion, with direct fallback.
 *
 * @param {Object} orderPayload
 * @param {boolean} isCOD
 * @returns {Promise<Object>} Created order document.
 */
export const queueOrderPlacement = async (orderPayload, isCOD = false) => {
  if (orderPlacementQueue && orderPlacementEvents) {
    try {
      const job = await orderPlacementQueue.add("place_order", {
        orderPayload,
        isCOD,
      });

      // Await job processing with a 15-second timeout window
      const result = await job.waitUntilFinished(orderPlacementEvents, 15000);
      return result;
    } catch (err) {
      logger.warn("Order queue wait timed out or failed, falling back to direct transaction:", {
        error: err.message,
      });
    }
  }

  // Graceful direct transaction fallback
  return createOrderWithTransaction(orderPayload, isCOD);
};

/**
 * Gracefully close order placement queue, worker, and events listener.
 */
export const closeOrderPlacementQueue = async () => {
  try {
    if (orderPlacementWorker) {
      await orderPlacementWorker.close();
      orderPlacementWorker = null;
    }
    if (orderPlacementEvents) {
      await orderPlacementEvents.close();
      orderPlacementEvents = null;
    }
    if (orderPlacementQueue) {
      await orderPlacementQueue.close();
      orderPlacementQueue = null;
    }
    if (eventsConnection) {
      await eventsConnection.quit();
      eventsConnection = null;
    }
    if (workerConnection) {
      await workerConnection.quit();
      workerConnection = null;
    }
    if (queueConnection) {
      await queueConnection.quit();
      queueConnection = null;
    }
    logger.info("BullMQ Order Placement Queue and Worker closed gracefully");
  } catch (err) {
    logger.error("Error closing BullMQ Order Placement Queue/Worker:", { error: err.message });
  }
};

export { orderPlacementQueue, orderPlacementWorker, orderPlacementEvents };

