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
import logger from "./utils/logger.js";

// Override DNS servers locally to prevent local interface resolution timeouts on Windows
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
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
  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();

  pubClient.on("error", (err) => logger.error("Redis pub client error:", { error: err.message }));
  subClient.on("error", (err) => logger.error("Redis sub client error:", { error: err.message }));

  let isAdapterLinked = false;
  const attachAdapter = () => {
    if (isAdapterLinked) return;
    if (pubClient.status === "ready" && subClient.status === "ready") {
      try {
        io.adapter(createAdapter(pubClient, subClient));
        logger.info("Socket.io Redis adapter attached successfully");
        isAdapterLinked = true;
      } catch (err) {
        logger.error("Failed to attach Socket.io Redis adapter:", { error: err.message });
      }
    }
  };

  pubClient.on("ready", attachAdapter);
  subClient.on("ready", attachAdapter);
  attachAdapter();
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
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("Database connection established successfully");

    initSocketEvents(io);
    app.set("io", io);

    server.listen(PORT, () => {
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
    await mongoose.connection.close();
    logger.info("Database connection closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

startServer();
