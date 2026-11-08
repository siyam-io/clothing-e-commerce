import flashSaleService from "./flashSale.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import auditLogService from "../auditLog/auditLog.service.js";

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
  auditLogService.recordLog({
    req,
    action: "CREATE",
    module: "FlashSale",
    resourceId: sale._id,
    resourceName: sale.name,
    description: `Created new flash sale campaign: ${sale.name}`,
    details: { discountPercentage: sale.discountPercentage, startTime: sale.startTime, endTime: sale.endTime },
    status: "SUCCESS",
  });
  res.status(201).json(sale);
});

export const updateFlashSale = asyncHandler(async (req, res) => {
  const sale = await flashSaleService.updateFlashSale(req.params.id, req.body);
  auditLogService.recordLog({
    req,
    action: "UPDATE",
    module: "FlashSale",
    resourceId: req.params.id,
    resourceName: sale?.name,
    description: `Updated flash sale campaign: ${sale?.name || req.params.id}`,
    details: req.body,
    status: "SUCCESS",
  });
  res.json(sale);
});

export const deleteFlashSale = asyncHandler(async (req, res) => {
  const result = await flashSaleService.deleteFlashSale(req.params.id);
  auditLogService.recordLog({
    req,
    action: "DELETE",
    module: "FlashSale",
    resourceId: req.params.id,
    description: `Deleted flash sale campaign #${req.params.id}`,
    status: "SUCCESS",
  });
  res.json(result);
});

