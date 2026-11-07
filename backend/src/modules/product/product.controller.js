import productService from "./product.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

export const getPublicProducts = asyncHandler(async (req, res) => {
  const result = await productService.getPublicProducts(req.query);
  res.json({ success: true, ...result });
});

export const getPublicProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);
  res.json(product);
});

export const getPublicProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.json(product);
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const products = await productService.getRelatedProducts(req.params.id, req.query);
  res.json(products);
});

export const getLowStockAlerts = asyncHandler(async (req, res) => {
  const alerts = await productService.getLowStockAlerts(req.query.threshold);
  res.json(alerts);
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.files);
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.files);
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id);
  res.json(result);
});

export const updateStock = asyncHandler(async (req, res) => {
  const product = await productService.updateStock(
    req.params.id,
    req.body.sizeId,
    req.body.stock
  );
  res.json(product);
});

