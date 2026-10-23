import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// 📦 Route Imports
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
// import bannerRoutes from "./modules/banner/banner.routes.js";
import settingsRoutes from "./modules/settings/settings.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import blogRoutes from "./modules/blog/blog.route.js";
import blogImageRoutes from './modules/blog/blog-image.route.js';
import chatRoutes from "./modules/chat/chat.routes.js";
import homeLayoutRoutes from "./modules/homeLayout/homeLayout.routes.js";
import roleRoutes from "./modules/role/role.routes.js";
// 🛡️ Middleware Imports
import { errorHandler } from "./middleware/errorHandler.js";
import { handleFileError } from "./middleware/cleanup.js";
import compression from "compression";
import contextMiddleware from "./middleware/context.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { swaggerUi, specs } from "./swagger.js";

const app = express();

// 🛡️ Trust proxy MUST be set before rate limiter so req.ip resolves correctly
// Without this, all requests appear to come from the same proxy IP
app.set("trust proxy", 1);

// 🛡️ Tactical CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:8081",
  "http://localhost:8082",
  "https://clothing-e-commerce-web.vercel.app",
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .map(origin => origin.trim().replace(/\/$/, "")); // Trim whitespace and remove trailing slashes

export const isAllowedOrigin = (origin) => {
  if (!origin || origin === "null") return true;

  const sanitized = origin.trim().replace(/\/$/, "");

  // Standard list of allowed domains
  if (allowedOrigins.includes(sanitized)) return true;

  // Allow localhost on any port
  if (/^http:\/\/localhost(:\d+)?$/.test(sanitized)) return true;
  if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(sanitized)) return true;

  // Allow local network IPs on any port (e.g. 192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  if (/^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(sanitized)) return true;

  return false;
};

app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS blocked for origin: ${origin}`);
        // Fallback for subdomains or development environments
        if (process.env.NODE_ENV === "development") {
          return callback(null, true);
        }
        callback(null, false); // Return false instead of throwing 500 error, letting browser handle CORS rejection cleanly
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
      "x-vanguard-mode"
    ],
    exposedHeaders: ["set-cookie"],
  })
);

// 📝 Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// 🛡️ Global Rate Limiting for all API endpoints
app.use("/api", apiLimiter);

app.use(compression());

// 📝 Request Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

app.use(contextMiddleware);

// Parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Static assets
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Vanguard System Engine is Active.",
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
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
// app.use("/api/banners", bannerRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes)
app.use('/api', blogImageRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/home-layouts", homeLayoutRoutes);
app.use("/api/roles", roleRoutes);

app.use(handleFileError);
app.use(errorHandler);

export default app;