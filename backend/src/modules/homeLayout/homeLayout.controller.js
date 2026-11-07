import homeLayoutService from "./homeLayout.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

export const getActiveLayout = asyncHandler(async (req, res) => {
  const result = await homeLayoutService.getActiveLayout();
  res.json(result);
});

export const getAllLayouts = asyncHandler(async (req, res) => {
  const layouts = await homeLayoutService.getAllLayouts();
  res.json(layouts);
});

export const createLayout = asyncHandler(async (req, res) => {
  const layout = await homeLayoutService.createLayout(req.body);
  res.status(201).json(layout);
});

export const updateLayout = asyncHandler(async (req, res) => {
  const layout = await homeLayoutService.updateLayout(req.params.id, req.body);
  res.json(layout);
});

export const switchLayout = asyncHandler(async (req, res) => {
  const result = await homeLayoutService.switchLayout(req.params.id);
  res.json(result);
});

export const deleteLayout = asyncHandler(async (req, res) => {
  const result = await homeLayoutService.deleteLayout(req.params.id);
  res.json(result);
});
