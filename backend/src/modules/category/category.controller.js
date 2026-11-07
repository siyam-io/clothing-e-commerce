import categoryService from "./category.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

export const getPublicCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getPublicCategories();
  res.json(categories);
});

export const getPublicCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await categoryService.getPublicCategoryBySlug(req.params.slug);
  res.json(category);
});

export const getAdminCategories = asyncHandler(async (req, res) => {
  const result = await categoryService.getAdminCategories(req.query);
  res.json(result);
});

export const getAdminCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  res.json(category);
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory({
    ...req.body,
    file: req.file,
  });
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const updated = await categoryService.updateCategory(req.params.id, {
    ...req.body,
    file: req.file,
  });
  res.json(updated);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const result = await categoryService.deleteCategory(req.params.id);
  res.json(result);
});

