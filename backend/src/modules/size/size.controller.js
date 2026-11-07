import sizeService from "./size.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

export const getSizes = asyncHandler(async (req, res) => {
  const result = await sizeService.getSizes(req.query);
  res.json(result);
});

export const getSizeById = asyncHandler(async (req, res) => {
  const size = await sizeService.getSizeById(req.params.id);
  res.json(size);
});

export const createSize = asyncHandler(async (req, res) => {
  const size = await sizeService.createSize(req.body);
  res.status(201).json(size);
});

export const updateSize = asyncHandler(async (req, res) => {
  const size = await sizeService.updateSize(req.params.id, req.body);
  res.json(size);
});

export const deleteSize = asyncHandler(async (req, res) => {
  const result = await sizeService.deleteSize(req.params.id);
  res.json(result);
});
