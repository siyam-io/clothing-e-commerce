import express from "express";
import publicOrderRoutes from "./routes/public.order.routes.js";
import adminOrderRoutes from "./routes/admin.order.routes.js";

const router = express.Router();

router.use("/", publicOrderRoutes);
router.use("/admin", adminOrderRoutes);

export default router;

