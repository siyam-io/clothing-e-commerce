import categoryService from "./category.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import auditLogService from "../auditLog/auditLog.service.js";

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

  if (category) {
    auditLogService.recordLog({
      req,
      action: "CREATE",
      module: "Category",
      resourceId: category._id,
      resourceName: category.name,
      description: `Created category: ${category.name}`,
    });
  }

  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const updated = await categoryService.updateCategory(req.params.id, {
    ...req.body,
    file: req.file,
  });

  if (updated) {
    auditLogService.recordLog({
      req,
      action: "UPDATE",
      module: "Category",
      resourceId: updated._id,
      resourceName: updated.name,
      description: `Updated category: ${updated.name}`,
    });
  }

  res.json(updated);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const result = await categoryService.deleteCategory(req.params.id);

  auditLogService.recordLog({
    req,
    action: "DELETE",
    module: "Category",
    resourceId: req.params.id,
    resourceName: "Category",
    description: `Deleted category ID: ${req.params.id}`,
  });

  res.json(result);
});

