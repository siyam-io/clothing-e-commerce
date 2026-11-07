import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BlogService } from "../blog.service.js";
import { ApiError } from "../../../utils/responseHandler.js";

describe("BlogService", () => {
  let service;
  let mockBlogModel;
  let mockUploadImageFn;
  let mockDeleteImageFn;
  let mockCacheClearer;

  beforeEach(() => {
    mockBlogModel = {
      create: jest.fn(),
      countDocuments: jest.fn(),
      find: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findById: jest.fn(),
    };
    mockUploadImageFn = jest.fn();
    mockDeleteImageFn = jest.fn();
    mockCacheClearer = jest.fn();

    service = new BlogService({
      blogModel: mockBlogModel,
      uploadImageFn: mockUploadImageFn,
      deleteImageFn: mockDeleteImageFn,
      cacheClearer: mockCacheClearer,
    });
  });

  describe("calculateReadingTime", () => {
    it("returns minimum 1 min read for short content", () => {
      const result = service.calculateReadingTime("<p>Hello world</p>");
      expect(result).toBe("1 min read");
    });

    it("calculates accurate reading time for larger text blocks", () => {
      const words = new Array(500).fill("word").join(" ");
      const result = service.calculateReadingTime(`<article>${words}</article>`);
      expect(result).toBe("3 min read");
    });
  });

  describe("parseSeoPayload", () => {
    it("parses valid JSON string", () => {
      const seo = { metaTitle: "Summer Trends", metaDescription: "Best outfits" };
      const result = service.parseSeoPayload(JSON.stringify(seo));
      expect(result).toEqual(seo);
    });

    it("returns empty object on malformed JSON without crashing", () => {
      const result = service.parseSeoPayload("{ not valid json");
      expect(result).toEqual({});
    });
  });

  describe("createPost", () => {
    it("throws 400 error when no image is provided", async () => {
      await expect(
        service.createPost({
          title: "New Trends",
          content: "<p>Content</p>",
          category: "LIFESTYLE",
          user: { _id: "usr_1" },
        })
      ).rejects.toThrow(ApiError);
    });

    it("creates blog post with calculated slug and reading time", async () => {
      const mockCreated = {
        _id: "blog_1",
        title: "Summer 2026 Collection",
        slug: "summer-2026-collection",
        readingTime: "1 min read",
      };
      mockBlogModel.create.mockResolvedValue(mockCreated);

      const result = await service.createPost({
        title: "Summer 2026 Collection",
        content: "<p>Exciting new styles arriving this week.</p>",
        category: "COLLECTION",
        featuredImageUrl: "https://storage.example.com/banner.jpg",
        user: { _id: "usr_1" },
      });

      expect(result).toEqual(mockCreated);
      expect(mockBlogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: "summer-2026-collection",
          category: "COLLECTION",
          author: "usr_1",
        })
      );
    });
  });

  describe("getPostBySlug", () => {
    it("increments view count atomically and returns article", async () => {
      const mockArticle = { _id: "blog_2", title: "Fabric Care Guide", viewCount: 15 };
      mockBlogModel.findOneAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockArticle),
          }),
        }),
      });

      const result = await service.getPostBySlug("fabric-care-guide");
      expect(result).toEqual(mockArticle);
      expect(mockBlogModel.findOneAndUpdate).toHaveBeenCalledWith(
        { slug: "fabric-care-guide" },
        { $inc: { viewCount: 1 } },
        { new: true }
      );
    });

    it("throws 404 ApiError when article does not exist", async () => {
      mockBlogModel.findOneAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      await expect(service.getPostBySlug("non-existent")).rejects.toThrow(ApiError);
    });
  });

  describe("deletePost", () => {
    it("deletes post document even if image asset deletion fails", async () => {
      const mockArticle = {
        _id: "blog_3",
        featuredImage: "http://storage.example.com/img.jpg",
        deleteOne: jest.fn().mockResolvedValue(true),
      };
      mockBlogModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockArticle),
        }),
      });
      mockDeleteImageFn.mockRejectedValue(new Error("Storage unavailable"));

      const result = await service.deletePost("blog_3");

      expect(mockArticle.deleteOne).toHaveBeenCalled();
      expect(result.message).toContain("removed successfully");
    });
  });
});

