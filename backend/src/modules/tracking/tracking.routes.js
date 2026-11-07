import express from "express";
import trackingController from "./tracking.controller.js";
import { optionalAuth } from "../../middleware/auth.js";

const router = express.Router();

router.post("/", optionalAuth, (req, res, next) =>
  trackingController.trackEvent(req, res, next)
);

export default router;
