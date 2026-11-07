import subcategoryService from "./subcategory.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

export const getSubcategories = asyncHandler(async (req, res) => {
  const result = await subcategoryService.getSubcategories(req.query);
  res.json(result);
});

export const getSubcategoryById = asyncHandler(async (req, res) => {
  const subcategory = await subcategoryService.getSubcategoryById(req.params.id);
  res.json(subcategory);
});

export const createSubcategory = asyncHandler(async (req, res) => {
  const subcategory = await subcategoryService.createSubcategory({
    ...req.body,
    file: req.file,
  });
  res.status(201).json(subcategory);
});

export const updateSubcategory = asyncHandler(async (req, res) => {
  const updated = await subcategoryService.updateSubcategory(
    req.params.id,
    req.body,
    req.file
  );
  res.json(updated);
});

export const deleteSubcategory = asyncHandler(async (req, res) => {
  const result = await subcategoryService.deleteSubcategory(req.params.id);
  res.json(result);
});
