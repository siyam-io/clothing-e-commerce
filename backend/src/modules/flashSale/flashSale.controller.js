import flashSaleService from "./flashSale.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

export const getActiveFlashSales = asyncHandler(async (req, res) => {
  const sales = await flashSaleService.getActiveFlashSales();
  res.json(sales);
});

export const getFlashSaleProducts = asyncHandler(async (req, res) => {
  const result = await flashSaleService.getLiveFlashSale();
  res.json(result);
});

export const getPublicFlashSaleBySlug = asyncHandler(async (req, res) => {
  const result = await flashSaleService.getFlashSaleBySlug(req.params.slug);
  res.json(result);
});

export const getAllFlashSales = asyncHandler(async (req, res) => {
  const result = await flashSaleService.getAllFlashSales(req.query);
  res.json(result);
});

export const getAdminFlashSaleById = asyncHandler(async (req, res) => {
  const sale = await flashSaleService.getFlashSaleById(req.params.id);
  res.json(sale);
});

export const createFlashSale = asyncHandler(async (req, res) => {
  const sale = await flashSaleService.createFlashSale(req.body);
  res.status(201).json(sale);
});

export const updateFlashSale = asyncHandler(async (req, res) => {
  const sale = await flashSaleService.updateFlashSale(req.params.id, req.body);
  res.json(sale);
});

export const deleteFlashSale = asyncHandler(async (req, res) => {
  const result = await flashSaleService.deleteFlashSale(req.params.id);
  res.json(result);
});

