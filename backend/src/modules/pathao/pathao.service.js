import underlyingPathaoService from "../../services/pathao.service.js";
import logger from "../../utils/logger.js";

/**
 * Domain service managing Pathao courier logistics and geographic endpoint resolution.
 */
export class PathaoModuleService {
  /**
   * @param {Object} [dependencies]
   * @param {Object} [dependencies.courierService]
   * @param {Function} [dependencies.credentialProvider]
   */
  constructor(dependencies = {}) {
    this.courierService = dependencies.courierService || underlyingPathaoService;
    this.credentialProvider =
      dependencies.credentialProvider ||
      (() => ({
        clientId: process.env.PATHAO_CLIENT_ID,
        clientSecret: process.env.PATHAO_CLIENT_SECRET,
        username: process.env.PATHAO_USERNAME,
        password: process.env.PATHAO_PASSWORD,
        baseURL: process.env.PATHAO_BASE_URL || "https://courier-api-sandbox.pathao.com",
        isActive: Boolean(process.env.PATHAO_CLIENT_ID),
      }));
  }

  /**
   * Retrieve list of serviceable cities with offline fault isolation.
   */
  async getCities() {
    const creds = this.credentialProvider();
    if (!creds.isActive || !creds.clientId) {
      logger.warn("Pathao credentials missing, returning empty cities fallback.");
      return [];
    }

    try {
      return await this.courierService.getCities(creds);
    } catch (error) {
      logger.error("Pathao getCities call failed, isolating failure:", { error: error.message });
      return [];
    }
  }

  /**
   * Retrieve delivery zones within a city.
   */
  async getZones(cityId) {
    const creds = this.credentialProvider();
    if (!creds.isActive || !creds.clientId || !cityId) {
      return [];
    }

    try {
      return await this.courierService.getZones(cityId, creds);
    } catch (error) {
      logger.error("Pathao getZones call failed, isolating failure:", { cityId, error: error.message });
      return [];
    }
  }

  /**
   * Retrieve sub-areas within a zone.
   */
  async getAreas(zoneId) {
    const creds = this.credentialProvider();
    if (!creds.isActive || !creds.clientId || !zoneId) {
      return [];
    }

    try {
      return await this.courierService.getAreas(zoneId, creds);
    } catch (error) {
      logger.error("Pathao getAreas call failed, isolating failure:", { zoneId, error: error.message });
      return [];
    }
  }

  /**
   * Retrieve active merchant pickup stores.
   */
  async getStores() {
    const creds = this.credentialProvider();
    if (!creds.isActive || !creds.clientId) {
      return [];
    }

    try {
      if (typeof this.courierService.getStores === "function") {
        return await this.courierService.getStores(creds);
      }
      return [];
    } catch (error) {
      logger.error("Pathao getStores call failed, isolating failure:", { error: error.message });
      return [];
    }
  }
}

export default new PathaoModuleService();

