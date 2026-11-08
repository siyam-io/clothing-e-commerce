import { Queue, Worker } from "bullmq";
import { createQueueConnection } from "./queue.connection.js";
import { deleteImage } from "../services/imageUploadService.js";
import logger from "../utils/logger.js";

const QUEUE_NAME = "image-queue";

const defaultJobOptions = {
  attempts: 2,
  backoff: {
    type: "exponential",
    delay: 2000,
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
let imageQueue = null;
let imageWorker = null;

try {
  queueConnection = createQueueConnection();
  if (queueConnection) {
    imageQueue = new Queue(QUEUE_NAME, {
      connection: queueConnection,
      defaultJobOptions,
    });
    logger.info("BullMQ Image Queue initialized successfully");
  }
} catch (error) {
  logger.warn("BullMQ Image Queue initialization bypassed:", {
    error: error.message,
  });
}

/**
 * Worker processor for image asset optimization and deletions.
 */
export const processImageJob = async (job) => {
  const { name, data } = job;
  logger.info(`Processing BullMQ image job [${name}] (ID: ${job.id})`);

  if (name === "delete_asset") {
    await deleteImage(data.imageUrl);
    return { success: true };
  }

  throw new Error(`Unknown image job type: ${name}`);
};

/**
 * Start the background worker for image operations.
 */
export const startImageWorker = () => {
  if (imageWorker) return imageWorker;

  workerConnection = createQueueConnection();
  if (!workerConnection) {
    logger.info("Redis not available; image worker skipped (direct fallback active)");
    return null;
  }

  try {
    imageWorker = new Worker(QUEUE_NAME, processImageJob, {
      connection: workerConnection,
      concurrency: 2, // Limit concurrency to protect CPU from image spikes
    });

    imageWorker.on("error", (err) => {
      logger.warn(`BullMQ Image Worker connection notice: ${err.message}`);
    });

    imageWorker.on("completed", (job) => {
      logger.info(`Image job [${job.id}] completed successfully`);
    });

    imageWorker.on("failed", (job, err) => {
      logger.error(`Image job [${job?.id}] failed:`, {
        error: err.message,
        attemptsMade: job?.attemptsMade,
      });
    });

    logger.info("BullMQ Image Worker started successfully");
    return imageWorker;
  } catch (error) {
    logger.error("Failed to start BullMQ Image Worker:", { error: error.message });
    return null;
  }
};

/**
 * Queue an image deletion job to avoid blocking API responses during asset replacement.
 */
export const queueImageDelete = async (imageUrl) => {
  if (imageQueue) {
    try {
      return await imageQueue.add("delete_asset", { imageUrl });
    } catch (err) {
      logger.warn("Failed to enqueue image deletion, falling back to direct call:", {
        error: err.message,
      });
    }
  }

  return deleteImage(imageUrl).catch((err) => {
    logger.error("Direct image deletion failed:", { error: err.message });
  });
};

/**
 * Gracefully close image queue and worker.
 */
export const closeImageQueue = async () => {
  try {
    if (imageWorker) {
      await imageWorker.close();
      imageWorker = null;
    }
    if (imageQueue) {
      await imageQueue.close();
      imageQueue = null;
    }
    if (workerConnection) {
      await workerConnection.quit();
      workerConnection = null;
    }
    if (queueConnection) {
      await queueConnection.quit();
      queueConnection = null;
    }
    logger.info("BullMQ Image Queue and Worker closed gracefully");
  } catch (err) {
    logger.error("Error closing BullMQ Image Queue/Worker:", { error: err.message });
  }
};

export { imageQueue, imageWorker };

