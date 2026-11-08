import blogService from "./blog.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import auditLogService from "../auditLog/auditLog.service.js";

/**
 * Controller delegating blog post requests to domain service.
 */
export class BlogController {
  /**
   * @param {import("./blog.service.js").BlogService} [service]
   */
  constructor(service = blogService) {
    this.service = service;
  }

  createPost = asyncHandler(async (req, res) => {
    const { title, content, category, status, seo, featuredImage, isFeatured, tags, excerpt, slug } = req.body;
    const blog = await this.service.createPost({
      title,
      content,
      category,
      status,
      seo,
      file: req.file,
      user: req.user,
      featuredImageUrl: featuredImage,
      isFeatured,
      tags,
      excerpt,
      slug,
    });

    if (blog) {
      auditLogService.recordLog({
        req,
        action: "CREATE",
        module: "Blog",
        resourceId: blog._id,
        resourceName: blog.title,
        description: `Created blog article: ${blog.title}`,
      });
    }

    res.status(201).json(blog);
  });

  getPosts = asyncHandler(async (req, res) => {
    const { category, status, fields, page, limit } = req.query;
    const result = await this.service.getPosts({ category, status, fields, page, limit });
    res.status(200).json(result);
  });

  getPostBySlug = asyncHandler(async (req, res) => {
    const blog = await this.service.getPostBySlug(req.params.slug);
    res.status(200).json(blog);
  });

  getPostById = asyncHandler(async (req, res) => {
    const blog = await this.service.getPostById(req.params.id);
    res.status(200).json(blog);
  });

  updatePost = asyncHandler(async (req, res) => {
    const updated = await this.service.updatePost(req.params.id, req.body, req.file);

    if (updated) {
      auditLogService.recordLog({
        req,
        action: "UPDATE",
        module: "Blog",
        resourceId: updated._id,
        resourceName: updated.title,
        description: `Updated blog article: ${updated.title}`,
      });
    }

    res.status(200).json(updated);
  });

  deletePost = asyncHandler(async (req, res) => {
    const result = await this.service.deletePost(req.params.id);

    auditLogService.recordLog({
      req,
      action: "DELETE",
      module: "Blog",
      resourceId: req.params.id,
      resourceName: "Blog Post",
      description: `Deleted blog article ID: ${req.params.id}`,
    });

    res.status(200).json(result);
  });
}

const blogController = new BlogController();

export const createPost = blogController.createPost;
export const getPosts = blogController.getPosts;
export const getPostBySlug = blogController.getPostBySlug;
export const getPostById = blogController.getPostById;
export const updatePost = blogController.updatePost;
export const deletePost = blogController.deletePost;

export default blogController;
