import express from "express";
import {
  createPost,
  getPosts,
  getPostBySlug,
  getPostById,
  updatePost,
  deletePost,
} from "./blog.controller.js";
import { protect } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import upload from "../../middleware/upload.js";

const router = express.Router();

router
  .route("/")
  .get(getPosts)
  .post(protect, authorize("blogs:create"), upload.single("image"), createPost);

router
  .route("/admin/:id")
  .get(protect, authorize("blogs:view"), getPostById)
  .put(protect, authorize("blogs:update"), upload.single("image"), updatePost)
  .delete(protect, authorize("blogs:delete"), deletePost);

router.route("/:slug").get(getPostBySlug);

export default router;
