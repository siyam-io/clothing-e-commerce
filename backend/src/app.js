import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";

import userRoutes from "./modules/user/user.routes.js";
import publicCategoryRoutes from "./modules/category/routes/public.category.routes.js";
import subcategoryRoutes from "./modules/subcategory/subcategory.routes.js";
import sizeRoutes from "./modules/size/size.routes.js";
import publicProductRoutes from "./modules/product/routes/public.product.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import wishlistRoutes from "./modules/wishlist/wishlist.routes.js";
import publicOrderRoutes from "./modules/order/routes/public.order.routes.js";
import pathaoRoutes from "./modules/pathao/pathao.routes.js";
import reviewRoutes from "./modules/review/review.routes.js";
import publicFlashSaleRoutes from "./modules/flashSale/routes/public.flashSale.routes.js";
import bannerCampaignRoutes from "./modules/bannerCampaign/bannerCampaign.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import couponRoutes from "./modules/coupon/coupon.routes.js";
import trackingRoutes from "./modules/tracking/tracking.routes.js";
import settingsRoutes from "./modules/settings/settings.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import blogRoutes from "./modules/blog/blog.route.js";
import blogImageRoutes from "./modules/blog/blog-image.route.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import homeLayoutRoutes from "./modules/homeLayout/homeLayout.routes.js";
import roleRoutes from "./modules/role/role.routes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { handleFileError } from "./middleware/cleanup.js";
import contextMiddleware from "./middleware/context.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { swaggerUi, specs } from "./swagger.js";
import logger from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "blob:"],
        connectSrc: ["'self'", "https://res.cloudinary.com", "wss:", "ws:"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: "deny" },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

const configuredOrigins = [
  "http://localhost:3000",
  "https://clothing-e-commerce-web.vercel.app",
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .map((origin) => origin.trim().replace(/\/$/, ""));

/**
 * Validates incoming origin against whitelist and local development hosts.
 *
 * @param {string|undefined} origin - Origin request header.
 * @returns {boolean} True if origin is authorized.
 */
export const isAllowedOrigin = (origin) => {
  if (!origin || origin === "null") {
    return false;
  }

  const sanitized = origin.trim().replace(/\/$/, "");
  if (configuredOrigins.includes(sanitized)) {
    return true;
  }

  if (process.env.NODE_ENV !== "production") {
    if (/^http:\/\/localhost(:\d+)?$/.test(sanitized)) return true;
    if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(sanitized)) return true;
  }

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS rejected for unauthorized origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "x-guest-id",
      "x-requested-with",
      "Cookie",
      "x-vanguard-theme",
      "x-vanguard-lang",
      "x-vanguard-mode",
    ],
    exposedHeaders: ["set-cookie"],
  })
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use("/api", apiLimiter);
app.use(compression());

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.use(contextMiddleware);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "pass",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "operational",
    service: "clothing-ecommerce-backend",
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api/users", userRoutes);
app.use("/api/categories", publicCategoryRoutes);
app.use("/api/subcategories", subcategoryRoutes);
app.use("/api/sizes", sizeRoutes);
app.use("/api/products", publicProductRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", publicOrderRoutes);
app.use("/api/pathao", pathaoRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/flash-sales", publicFlashSaleRoutes);
app.use("/api/banner-campaigns", bannerCampaignRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/track", trackingRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api", blogImageRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/home-layouts", homeLayoutRoutes);
app.use("/api/roles", roleRoutes);

app.use(handleFileError);
app.use(errorHandler);

export default app;
