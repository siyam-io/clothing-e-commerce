import Product from "../../product/product.model.js";
import logger from "../../../utils/logger.js";

/**
 * Service managing semantic vector search operations against indexed product embeddings.
 */
export class VectorSearchService {
  /**
   * Executes MongoDB Atlas Vector Search on the products collection.
   *
   * @param {number[]} queryVector - Normalized query vector embedding.
   * @param {number} [limit=4] - Maximum matches to return.
   * @param {number} [minScore=0.70] - Minimum cosine similarity threshold.
   * @returns {Promise<Array<Object>>} Matched product projections with similarity scores.
   */
  static async searchByVector(queryVector, limit = 4, minScore = 0.70) {
    if (!queryVector || !Array.isArray(queryVector) || queryVector.length === 0) {
      return [];
    }

    try {
      const pipeline = [
        {
          $vectorSearch: {
            index: "product_vector_index",
            path: "embedding",
            queryVector,
            numCandidates: Math.max(50, limit * 10),
            limit,
            filter: {
              isActive: true,
            },
          },
        },
        {
          $project: {
            name: 1,
            slug: 1,
            price: 1,
            discount: 1,
            images: 1,
            sku: 1,
            sizes: 1,
            category: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
        {
          $match: {
            score: { $gte: minScore },
          },
        },
      ];

      return await Product.aggregate(pipeline);
    } catch (err) {
      logger.warn("Atlas Vector Search index fallback to empty result set:", {
        error: err.message,
      });
      return [];
    }
  }
}
