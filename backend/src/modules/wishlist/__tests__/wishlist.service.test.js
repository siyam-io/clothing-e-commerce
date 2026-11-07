import { jest } from "@jest/globals";
import { WishlistService } from "../wishlist.service.js";

describe("WishlistService", () => {
  let wishlistService;
  let mockWishlistModel;
  let mockProductModel;

  beforeEach(() => {
    mockWishlistModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn(),
    };
    mockProductModel = {
      findById: jest.fn(),
    };

    wishlistService = new WishlistService({
      wishlistModel: mockWishlistModel,
      productModel: mockProductModel,
    });
  });

  describe("getWishlist", () => {
    it("should return empty products array when user is not provided", async () => {
      const result = await wishlistService.getWishlist(null);
      expect(result).toEqual({ products: [] });
      expect(mockWishlistModel.findOne).not.toHaveBeenCalled();
    });

    it("should create empty wishlist if user has none", async () => {
      mockWishlistModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });
      mockWishlistModel.create.mockResolvedValue({ user: "u1", products: [] });

      const result = await wishlistService.getWishlist("u1");

      expect(result).toEqual({ user: "u1", products: [] });
      expect(mockWishlistModel.create).toHaveBeenCalledWith({ user: "u1", products: [] });
    });

    it("should prune dangling null products from deleted database records", async () => {
      const existingWishlist = {
        _id: "w1",
        user: "u1",
        products: [{ _id: "p1", name: "Shirt" }, null],
      };

      mockWishlistModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(existingWishlist),
      });

      const result = await wishlistService.getWishlist("u1");

      expect(result.products).toEqual([{ _id: "p1", name: "Shirt" }]);
      expect(mockWishlistModel.updateOne).toHaveBeenCalledWith(
        { _id: "w1" },
        { $set: { products: ["p1"] } }
      );
    });
  });

  describe("addToWishlist", () => {
    it("should throw 401 if unauthenticated", async () => {
      await expect(wishlistService.addToWishlist(null, "p1")).rejects.toThrow(
        "Authentication required to modify wishlist"
      );
    });

    it("should throw 404 if target product does not exist", async () => {
      mockProductModel.findById.mockResolvedValue(null);

      await expect(wishlistService.addToWishlist("u1", "missing-id")).rejects.toThrow(
        "Product not found"
      );
    });

    it("should add new product to wishlist and populate", async () => {
      mockProductModel.findById.mockResolvedValue({ _id: "p1", name: "Shirt" });
      const mockWishlist = {
        user: "u1",
        products: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(true),
      };
      mockWishlistModel.findOne.mockResolvedValue(mockWishlist);

      const result = await wishlistService.addToWishlist("u1", "p1");

      expect(mockWishlist.products).toContain("p1");
      expect(mockWishlist.save).toHaveBeenCalled();
      expect(mockWishlist.populate).toHaveBeenCalled();
      expect(result).toBe(mockWishlist);
    });

    it("should not duplicate product if already in wishlist", async () => {
      mockProductModel.findById.mockResolvedValue({ _id: "p1", name: "Shirt" });
      const mockWishlist = {
        user: "u1",
        products: ["p1"],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(true),
      };
      mockWishlistModel.findOne.mockResolvedValue(mockWishlist);

      await wishlistService.addToWishlist("u1", "p1");

      expect(mockWishlist.products).toHaveLength(1);
      expect(mockWishlist.save).not.toHaveBeenCalled();
    });
  });

  describe("removeFromWishlist", () => {
    it("should remove target product from wishlist", async () => {
      const mockWishlist = {
        user: "u1",
        products: ["p1", "p2"],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(true),
      };
      mockWishlistModel.findOne.mockResolvedValue(mockWishlist);

      const result = await wishlistService.removeFromWishlist("u1", "p1");

      expect(result.products).toEqual(["p2"]);
      expect(mockWishlist.save).toHaveBeenCalled();
    });

    it("should throw 404 if wishlist does not exist", async () => {
      mockWishlistModel.findOne.mockResolvedValue(null);

      await expect(wishlistService.removeFromWishlist("u1", "p1")).rejects.toThrow(
        "Wishlist not found"
      );
    });
  });

  describe("clearWishlist", () => {
    it("should empty wishlist products array", async () => {
      const mockWishlist = {
        user: "u1",
        products: ["p1", "p2"],
        save: jest.fn().mockResolvedValue(true),
      };
      mockWishlistModel.findOne.mockResolvedValue(mockWishlist);

      const result = await wishlistService.clearWishlist("u1");

      expect(result).toEqual({ message: "Wishlist cleared" });
      expect(mockWishlist.products).toEqual([]);
      expect(mockWishlist.save).toHaveBeenCalled();
    });
  });

  describe("bulkAddWishlist", () => {
    it("should reject non-array productIds", async () => {
      await expect(wishlistService.bulkAddWishlist("u1", "not-an-array")).rejects.toThrow(
        "productIds must be an array"
      );
    });

    it("should append unique product ids to wishlist", async () => {
      const mockWishlist = {
        user: "u1",
        products: ["p1"],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(true),
      };
      mockWishlistModel.findOne.mockResolvedValue(mockWishlist);

      await wishlistService.bulkAddWishlist("u1", ["p1", "p2", "p3"]);

      expect(mockWishlist.products).toEqual(["p1", "p2", "p3"]);
      expect(mockWishlist.save).toHaveBeenCalled();
    });
  });
});

