import slugify from "slugify";
import Blog from "./blog.model.js";
import { uploadImage, deleteImage } from "../../services/imageUploadService.js";
import { clearCache } from "../../middleware/cacheMiddleware.js";
import { ApiError } from "../../utils/responseHandler.js";
import logger from "../../utils/logger.js";

/**
 * Domain service managing publishing workflows, view counters, and article assets with fault isolation.
 */
export class BlogService {
  /**
   * @param {Object} [dependencies]
   * @param {typeof Blog} [dependencies.blogModel]
   * @param {Function} [dependencies.uploadImageFn]
   * @param {Function} [dependencies.deleteImageFn]
   * @param {Function} [dependencies.cacheClearer]
   */
  constructor(dependencies = {}) {
    this.blogModel = dependencies.blogModel || Blog;
    this.uploadImageFn = dependencies.uploadImageFn || uploadImage;
    this.deleteImageFn = dependencies.deleteImageFn || deleteImage;
    this.cacheClearer = dependencies.cacheClearer || clearCache;
  }

  /**
   * Calculate reading time estimate based on 200 words per minute average.
   */
  calculateReadingTime(htmlContent = "") {
    const text = htmlContent.replace(/<[^>]*>/g, "");
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
  }

  /**
   * Parse SEO meta tags safely.
   */
  parseSeoPayload(seoInput) {
    if (!seoInput) return {};
    if (typeof seoInput === "object") return seoInput;
    try {
      return JSON.parse(seoInput);
    } catch (err) {
      logger.warn("Malformed SEO payload provided to BlogService:", { error: err.message });
      return {};
    }
  }

  /**
   * Safe cache invalidation for admin dashboards.
   */
  bustDashboardCache() {
    try {
      this.cacheClearer("cache:/api/admin/dashboard*");
    } catch (err) {
      logger.warn("Cache eviction skipped in BlogService:", { error: err.message });
    }
  }

  /**
   * Publish a new blog post.
   */
  async createPost({ title, content, category, status, seo, file, user, featuredImageUrl }) {
    let finalImageUrl = featuredImageUrl || "";

    if (file) {
      try {
        finalImageUrl = await this.uploadImageFn(file, "blogs");
      } catch (err) {
        logger.error("Blog image upload failed:", { error: err.message });
        throw new ApiError(500, "Failed to upload article image");
      }
    }

    if (!finalImageUrl) {
      throw new ApiError(400, "A featured image is required to publish an article");
    }

    const slug = slugify(title, { lower: true, strict: true });
    const readingTime = this.calculateReadingTime(content);
    const parsedSeo = this.parseSeoPayload(seo);

    const blog = await this.blogModel.create({
      title,
      slug,
      content,
      featuredImage: finalImageUrl,
      category,
      status: status || "PUBLISHED",
      readingTime,
      seo: parsedSeo,
      author: user._id,
    });

    this.bustDashboardCache();
    return blog;
  }

  /**
   * Retrieve paginated public articles.
   */
  async getPosts({ category, status = "PUBLISHED", fields, page = 1, limit = 30 }) {
    const query = {};
    if (status !== "all") query.status = status;
    if (category) query.category = category;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 30);

    const total = await this.blogModel.countDocuments(query);
    let postsQuery = this.blogModel
      .find(query)
      .populate("author", "name avatar")
      .sort("-isFeatured -createdAt")
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    if (fields) {
      postsQuery = postsQuery.select(fields.split(",").join(" "));
    }

    const posts = await postsQuery.lean();

    return {
      blogs: posts,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Retrieve single article by slug and atomically bump view counter.
   */
  async getPostBySlug(slug) {
    const blog = await this.blogModel
      .findOneAndUpdate({ slug }, { $inc: { viewCount: 1 } }, { new: true })
      .populate("author", "name avatar")
      .populate("comments.user", "name avatar")
      .lean();

    if (!blog) {
      throw new ApiError(404, "Article not found");
    }
    return blog;
  }

  /**
   * Retrieve article by ID for administration.
   */
  async getPostById(id) {
    const blog = await this.blogModel
      .findById(id)
      .populate("author", "name avatar")
      .populate("comments.user", "name avatar");

    if (!blog) {
      throw new ApiError(404, "Article not found");
    }
    return blog;
  }

  /**
   * Update article attributes and reconcile storage assets.
   */
  async updatePost(id, bodyData, file) {
    const blog = await this.getPostById(id);
    const { title, content, seo, ...rest } = bodyData;

    if (file) {
      if (blog.featuredImage) {
        try {
          await this.deleteImageFn(blog.featuredImage);
        } catch (err) {
          logger.warn("Old blog image deletion failed, continuing update:", { error: err.message });
        }
      }
      blog.featuredImage = await this.uploadImageFn(file, "blogs");
    }

    if (title) {
      blog.title = title;
      blog.slug = slugify(title, { lower: true, strict: true });
    }

    if (content) {
      blog.content = content;
      blog.readingTime = this.calculateReadingTime(content);
    }

    if (seo) {
      blog.seo = this.parseSeoPayload(seo);
    }

    Object.assign(blog, rest);
    const updated = await blog.save();
    this.bustDashboardCache();
    return updated;
  }

  /**
   * Delete article and clean up media assets safely.
   */
  async deletePost(id) {
    const blog = await this.getPostById(id);

    if (blog.featuredImage) {
      try {
        await this.deleteImageFn(blog.featuredImage);
      } catch (err) {
        logger.warn("Image deletion failed during article deletion, continuing:", {
          error: err.message,
        });
      }
    }

    await blog.deleteOne();
    this.bustDashboardCache();
    return { message: "Article removed successfully" };
  }
}

export default new BlogService();

