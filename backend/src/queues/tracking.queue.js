import { Queue, Worker } from "bullmq";
import { createQueueConnection } from "./queue.connection.js";
import { sendUnifiedCapiEvent } from "../services/tracking/multiPlatformCapiService.js";
import logger from "../utils/logger.js";

const QUEUE_NAME = "tracking-queue";

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1500,
  },
  removeOnComplete: {
    count: 500,
  },
  removeOnFail: {
    count: 1000,
  },
};

let queueConnection = null;
let workerConnection = null;
let trackingQueue = null;
let trackingWorker = null;

try {
  queueConnection = createQueueConnection();
  if (queueConnection) {
    trackingQueue = new Queue(QUEUE_NAME, {
      connection: queueConnection,
      defaultJobOptions,
    });
    logger.info("BullMQ Tracking Queue initialized successfully");
  }
} catch (error) {
  logger.warn("BullMQ Tracking Queue initialization bypassed:", {
    error: error.message,
  });
}

/**
 * Worker processor for tracking events (Meta CAPI & TikTok API).
 */
export const processTrackingJob = async (job) => {
  const { name, data } = job;
  logger.info(`Processing BullMQ tracking job [${name}] (ID: ${job.id})`);

  if (name === "dispatch_capi_event") {
    await sendUnifiedCapiEvent(data);
    return { success: true };
  }

  throw new Error(`Unknown tracking job type: ${name}`);
};

/**
 * Start the background worker for tracking queue.
 */
export const startTrackingWorker = () => {
  if (trackingWorker) return trackingWorker;

  workerConnection = createQueueConnection();
  if (!workerConnection) {
    logger.info("Redis not available; tracking worker skipped (direct fallback active)");
    return null;
  }

  try {
    trackingWorker = new Worker(QUEUE_NAME, processTrackingJob, {
      connection: workerConnection,
      concurrency: 10, // Handle up to 10 marketing API dispatches concurrently
    });

    trackingWorker.on("error", (err) => {
      logger.warn(`BullMQ Tracking Worker connection notice: ${err.message}`);
    });

    trackingWorker.on("completed", (job) => {
      logger.info(`Tracking event job [${job.id}] dispatched to marketing APIs successfully`);
    });

    trackingWorker.on("failed", (job, err) => {
      logger.error(`Tracking event job [${job?.id}] failed:`, {
        error: err.message,
        attemptsMade: job?.attemptsMade,
      });
    });

    logger.info("BullMQ Tracking Worker started successfully");
    return trackingWorker;
  } catch (error) {
    logger.error("Failed to start BullMQ Tracking Worker:", { error: error.message });
    return null;
  }
};

/**
 * Queue marketing tracking event or fall back to direct dispatch.
 */
export const queueTrackingEvent = async (params) => {
  if (trackingQueue) {
    try {
      const job = await trackingQueue.add("dispatch_capi_event", params);
      return job;
    } catch (err) {
      logger.warn("Failed to enqueue tracking event, falling back to direct dispatch:", {
        error: err.message,
      });
    }
  }

  return sendUnifiedCapiEvent(params).catch((err) => {
    logger.error("Direct tracking event dispatch failed:", { error: err.message });
  });
};

/**
 * Gracefully close tracking queue and worker.
 */
export const closeTrackingQueue = async () => {
  try {
    if (trackingWorker) {
      await trackingWorker.close();
      trackingWorker = null;
    }
    if (trackingQueue) {
      await trackingQueue.close();
      trackingQueue = null;
    }
    if (workerConnection) {
      await workerConnection.quit();
      workerConnection = null;
    }
    if (queueConnection) {
      await queueConnection.quit();
      queueConnection = null;
    }
    logger.info("BullMQ Tracking Queue and Worker closed gracefully");
  } catch (err) {
    logger.error("Error closing BullMQ Tracking Queue/Worker:", { error: err.message });
  }
};

export { trackingQueue, trackingWorker };

