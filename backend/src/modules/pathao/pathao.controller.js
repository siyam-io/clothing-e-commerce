import pathaoModuleService from "./pathao.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

export const getCities = asyncHandler(async (req, res) => {
  const cities = await pathaoModuleService.getCities();
  res.json(cities);
});

export const getZones = asyncHandler(async (req, res) => {
  const zones = await pathaoModuleService.getZones(req.params.cityId);
  res.json(zones);
});

export const getAreas = asyncHandler(async (req, res) => {
  const areas = await pathaoModuleService.getAreas(req.params.zoneId);
  res.json(areas);
});

export const getStores = asyncHandler(async (req, res) => {
  const stores = await pathaoModuleService.getStores();
  res.json(stores);
});
