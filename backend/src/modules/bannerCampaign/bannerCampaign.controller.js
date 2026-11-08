import bannerCampaignService from "./bannerCampaign.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import auditLogService from "../auditLog/auditLog.service.js";

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

    auditLogService.recordLog({
      req,
      action: "CREATE",
      module: "Banner",
      resourceId: campaign._id,
      resourceName: campaign.name,
      description: `Created new banner campaign: ${campaign.name}`,
      details: { name, isActive },
      status: "SUCCESS",
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

    auditLogService.recordLog({
      req,
      action: "UPDATE",
      module: "Banner",
      resourceId: req.params.id,
      resourceName: campaign?.name,
      description: `Updated banner campaign: ${campaign?.name || req.params.id}`,
      details: { name, isActive },
      status: "SUCCESS",
    });

    res.status(200).json(campaign);
  });

  deleteCampaign = asyncHandler(async (req, res) => {
    const result = await this.service.deleteCampaign(req.params.id);

    auditLogService.recordLog({
      req,
      action: "DELETE",
      module: "Banner",
      resourceId: req.params.id,
      description: `Deleted banner campaign #${req.params.id}`,
      status: "SUCCESS",
    });

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
