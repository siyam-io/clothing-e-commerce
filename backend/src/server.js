import "dotenv/config";
import dns from "dns";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import app, { isAllowedOrigin } from "./app.js";
import { socketAuth } from "./middleware/socketAuth.js";
import { initSocketEvents } from "./modules/chat/chat.socket.js";
import redisClient from "./config/redis.js";
import { initQueuesAndWorkers, shutdownQueues } from "./queues/index.js";
import logger from "./utils/logger.js";

// Override DNS servers locally to prevent local interface resolution timeouts on Windows
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS unauthorized"));
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

if (redisClient) {
  try {
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();

    pubClient.on("error", (err) => {
      if (err.message && err.message.includes("max requests limit exceeded")) return;
      logger.warn("Redis pub client notice:", { error: err.message });
    });
    subClient.on("error", (err) => {
      if (err.message && err.message.includes("max requests limit exceeded")) return;
      logger.warn("Redis sub client notice:", { error: err.message });
    });

    let isAdapterLinked = false;
    const attachAdapter = () => {
      if (isAdapterLinked) return;
      if (pubClient.status === "ready" && subClient.status === "ready") {
        try {
          io.adapter(createAdapter(pubClient, subClient));
          logger.info("Socket.io Redis adapter attached successfully");
          isAdapterLinked = true;
        } catch (err) {
          logger.warn("Failed to attach Socket.io Redis adapter (default memory adapter active):", { error: err.message });
        }
      }
    };

    pubClient.on("ready", attachAdapter);
    subClient.on("ready", attachAdapter);
    attachAdapter();
  } catch (err) {
    logger.warn("Redis adapter duplicate skipped, using in-memory socket adapter:", { error: err.message });
  }
}

io.use(socketAuth);

io.on("connection", (socket) => {
  logger.info(`Socket client connected: ${socket.id} (Active: ${io.engine.clientsCount})`);

  socket.on("disconnect", (reason) => {
    logger.info(`Socket client disconnected: ${socket.id} (Reason: ${reason})`);
  });

  socket.on("error", (error) => {
    logger.error(`Socket connection error for ${socket.id}:`, { error });
  });
});

const startKeepAlivePing = () => {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl || process.env.NODE_ENV !== "production") return;

  setInterval(async () => {
    try {
      const res = await fetch(backendUrl);
      logger.info(`Keep-alive ping response: ${res.status}`);
    } catch (err) {
      logger.error("Keep-alive ping failure:", { error: err.message });
    }
  }, 10 * 60 * 1000);
};

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 200,
      minPoolSize: 20,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
    });
    logger.info("Database connection established successfully");

    initSocketEvents(io);
    app.set("io", io);

    initQueuesAndWorkers(io);

    server.on("error", (e) => {
      if (e.code === "EADDRINUSE") {
        logger.warn(`Port ${PORT} in use, retrying listen in 1s...`);
        setTimeout(() => {
          server.close();
          server.listen(PORT, 2048, () => {
            logger.info(`Server listening on port ${PORT}`);
            startKeepAlivePing();
          });
        }, 1000);
      } else {
        logger.error("Server error:", { error: e.message });
      }
    });

    server.listen(PORT, 2048, () => {
      logger.info(`Server listening on port ${PORT}`);
      startKeepAlivePing();
    });
  } catch (error) {
    logger.error("Failed to start server:", { error: error.message });
    process.exit(1);
  }
};

const handleShutdown = async (signal) => {
  logger.info(`Received ${signal}. Initiating graceful shutdown.`);
  server.close(async () => {
    logger.info("HTTP server closed.");
    await shutdownQueues();
    await mongoose.connection.close();
    logger.info("Database connection closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));
process.once("SIGUSR2", () => {
  handleShutdown("SIGUSR2");
});

process.on("unhandledRejection", (reason) => {
  logger.warn("Unhandled promise rejection intercepted safely:", {
    reason: reason?.message || reason,
  });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception intercepted safely:", {
    error: error?.message || error,
  });
});

startServer();
