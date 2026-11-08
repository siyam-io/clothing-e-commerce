import { startEmailWorker, closeEmailQueue } from "./email.queue.js";
import { startOrderPlacementWorker, closeOrderPlacementQueue } from "./order.queue.js";
import { startCourierWorker, closeCourierQueue } from "./courier.queue.js";
import { startImageWorker, closeImageQueue } from "./image.queue.js";
import { startTrackingWorker, closeTrackingQueue } from "./tracking.queue.js";
import logger from "../utils/logger.js";

/**
 * Initialize all BullMQ background workers.
 */
export const initQueuesAndWorkers = () => {
  try {
    startEmailWorker();
    startOrderPlacementWorker();
    startCourierWorker();
    startImageWorker();
    startTrackingWorker();
    logger.info("BullMQ queue system initialized with all background workers");
  } catch (error) {
    logger.error("Failed to initialize BullMQ system:", { error: error.message });
  }
};

/**
 * Gracefully close all BullMQ queues and workers on shutdown.
 */
export const shutdownQueues = async () => {
  logger.info("Shutting down BullMQ queues and workers...");
  await Promise.allSettled([
    closeEmailQueue(),
    closeOrderPlacementQueue(),
    closeCourierQueue(),
    closeImageQueue(),
    closeTrackingQueue(),
  ]);
};

export * from "./email.queue.js";
export * from "./order.queue.js";
export * from "./courier.queue.js";
export * from "./image.queue.js";
export * from "./tracking.queue.js";
