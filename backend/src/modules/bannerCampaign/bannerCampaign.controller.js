import bannerCampaignService from "./bannerCampaign.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

/**
 * Controller delegating promotional banner campaign requests to domain service.
 */
export class BannerCampaignController {
  /**
   * @param {import("./bannerCampaign.service.js").BannerCampaignService} [service]
   */
  constructor(service = bannerCampaignService) {
    this.service = service;
  }

  getActiveCampaign = asyncHandler(async (req, res) => {
    const campaign = await this.service.getActiveCampaign();
    res.status(200).json(campaign);
  });

  getPublicCampaignById = asyncHandler(async (req, res) => {
    const campaign = await this.service.getCampaignById(req.params.id);
    res.status(200).json(campaign);
  });

  getAllCampaigns = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const result = await this.service.getAllCampaigns({ page, limit });
    res.status(200).json(result);
  });

  createCampaign = asyncHandler(async (req, res) => {
    const { name, description, slides, isActive } = req.body;
    const files = req.files || [];
    const campaign = await this.service.createCampaign({
      name,
      description,
      slides,
      isActive,
      files,
    });
    res.status(201).json(campaign);
  });

  updateCampaign = asyncHandler(async (req, res) => {
    const { name, description, slides, isActive } = req.body;
    const files = req.files || [];
    const campaign = await this.service.updateCampaign(req.params.id, {
      name,
      description,
      slides,
      isActive,
      files,
    });
    res.status(200).json(campaign);
  });

  deleteCampaign = asyncHandler(async (req, res) => {
    const result = await this.service.deleteCampaign(req.params.id);
    res.status(200).json(result);
  });
}

const bannerCampaignController = new BannerCampaignController();

export const getActiveCampaign = bannerCampaignController.getActiveCampaign;
export const getPublicCampaignById = bannerCampaignController.getPublicCampaignById;
export const getAllCampaigns = bannerCampaignController.getAllCampaigns;
export const createCampaign = bannerCampaignController.createCampaign;
export const updateCampaign = bannerCampaignController.updateCampaign;
export const deleteCampaign = bannerCampaignController.deleteCampaign;

export default bannerCampaignController;
