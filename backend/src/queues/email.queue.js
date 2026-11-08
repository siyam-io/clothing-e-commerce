import { Queue, Worker } from "bullmq";
import { createQueueConnection } from "./queue.connection.js";
import {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../services/email.service.js";
import logger from "../utils/logger.js";

const QUEUE_NAME = "email-queue";

const defaultJobOptions = {
  attempts: 3,
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
let emailQueue = null;
let emailWorker = null;

// Initialize Queue instance if Redis is available
try {
  queueConnection = createQueueConnection();
  if (queueConnection) {
    emailQueue = new Queue(QUEUE_NAME, {
      connection: queueConnection,
      defaultJobOptions,
    });
    logger.info("BullMQ Email Queue initialized successfully");
  }
} catch (error) {
  logger.warn("BullMQ Email Queue initialization bypassed:", {
    error: error.message,
  });
}

/**
 * Worker processor function handling dispatched email jobs.
 */
export const processEmailJob = async (job) => {
  const { name, data } = job;
  logger.info(`Processing BullMQ email job [${name}] (ID: ${job.id})`);

  switch (name) {
    case "order_confirmation":
      await sendOrderConfirmationEmail(data.order);
      break;

    case "order_status_update":
      await sendOrderStatusUpdateEmail(data.order);
      break;

    case "verification_email":
      await sendVerificationEmail(data.email, data.url);
      break;

    case "password_reset":
      await sendPasswordResetEmail(data.email, data.url);
      break;

    default:
      logger.warn(`Unknown email job type received: ${name}`);
      throw new Error(`Unknown email job type: ${name}`);
  }

  return { success: true };
};

/**
 * Start the background worker for email queue.
 *
 * @returns {Worker|null}
 */
export const startEmailWorker = () => {
  if (emailWorker) return emailWorker;

  workerConnection = createQueueConnection();
  if (!workerConnection) {
    logger.info("Redis not available; email worker skipped (direct fallback active)");
    return null;
  }

  try {
    emailWorker = new Worker(QUEUE_NAME, processEmailJob, {
      connection: workerConnection,
      concurrency: 5, // Process up to 5 emails concurrently
    });

    emailWorker.on("error", (err) => {
      logger.warn(`BullMQ Email Worker connection notice: ${err.message}`);
    });

    emailWorker.on("completed", (job) => {
      logger.info(`Email job [${job.name}] (ID: ${job.id}) completed successfully`);
    });

    emailWorker.on("failed", (job, err) => {
      logger.error(`Email job [${job?.name}] (ID: ${job?.id}) failed:`, {
        error: err.message,
        attemptsMade: job?.attemptsMade,
      });
    });

    logger.info("BullMQ Email Worker started successfully");
    return emailWorker;
  } catch (error) {
    logger.error("Failed to start BullMQ Email Worker:", { error: error.message });
    return null;
  }
};

/**
 * Queue order confirmation email or fall back to direct dispatch.
 */
export const queueOrderConfirmationEmail = async (order) => {
  if (emailQueue) {
    try {
      const job = await emailQueue.add("order_confirmation", { order });
      logger.info(`Enqueued order confirmation email for Order #${order._id || order.id} (JobID: ${job.id})`);
      return job;
    } catch (err) {
      logger.warn("Failed to enqueue email to BullMQ, executing direct fallback:", {
        error: err.message,
      });
    }
  }

  // Graceful fallback to direct dispatch
  return sendOrderConfirmationEmail(order).catch((err) => {
    logger.error("Direct order confirmation email dispatch failed:", {
      error: err.message,
    });
  });
};

/**
 * Queue order status update email or fall back to direct dispatch.
 */
export const queueOrderStatusUpdateEmail = async (order) => {
  if (emailQueue) {
    try {
      return await emailQueue.add("order_status_update", { order });
    } catch (err) {
      logger.warn("Failed to enqueue status update email, executing direct fallback:", {
        error: err.message,
      });
    }
  }

  return sendOrderStatusUpdateEmail(order).catch((err) => {
    logger.error("Direct order status update email dispatch failed:", {
      error: err.message,
    });
  });
};

/**
 * Queue account verification email or fall back to direct dispatch.
 */
export const queueVerificationEmail = async (email, url) => {
  if (emailQueue) {
    try {
      return await emailQueue.add("verification_email", { email, url });
    } catch (err) {
      logger.warn("Failed to enqueue verification email, executing direct fallback:", {
        error: err.message,
      });
    }
  }

  return sendVerificationEmail(email, url).catch((err) => {
    logger.error("Direct verification email dispatch failed:", {
      error: err.message,
    });
  });
};

/**
 * Queue password reset email or fall back to direct dispatch.
 */
export const queuePasswordResetEmail = async (email, url) => {
  if (emailQueue) {
    try {
      return await emailQueue.add("password_reset", { email, url });
    } catch (err) {
      logger.warn("Failed to enqueue password reset email, executing direct fallback:", {
        error: err.message,
      });
    }
  }

  return sendPasswordResetEmail(email, url).catch((err) => {
    logger.error("Direct password reset email dispatch failed:", {
      error: err.message,
    });
  });
};

/**
 * Gracefully close email queue and worker connections.
 */
export const closeEmailQueue = async () => {
  try {
    if (emailWorker) {
      await emailWorker.close();
      emailWorker = null;
    }
    if (emailQueue) {
      await emailQueue.close();
      emailQueue = null;
    }
    if (workerConnection) {
      await workerConnection.quit();
      workerConnection = null;
    }
    if (queueConnection) {
      await queueConnection.quit();
      queueConnection = null;
    }
    logger.info("BullMQ Email Queue and Worker closed gracefully");
  } catch (err) {
    logger.error("Error closing BullMQ Email Queue/Worker:", { error: err.message });
  }
};

export { emailQueue, emailWorker };

