import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import Product from '../../product/product.model.js';

const VLM_SERVICE_URL = process.env.VLM_SERVICE_URL || 'http://localhost:8000';
const VLM_TIMEOUT_MS = parseInt(process.env.VLM_TIMEOUT_MS, 10) || 20000; // 20 seconds timeout

export class VlmClientService {
  /**
   * Forwards user message and optional image buffer to the local Python FastAPI VLM engine.
   *
   * @param {Object} params
   * @param {string} params.message - Customer message
   * @param {Object} [params.file] - Multer file object with buffer & mimetype
   * @param {string} [params.imageUrl] - Image URL or local uploaded file path
   * @param {Array} [params.history] - Recent conversation turns
   * @returns {Promise<{ reply: string, action_payload: Object|null, matchedProducts?: Array, isFallback?: boolean }>}
   */
  static async sendChatMessage({ message, file, imageUrl, history = [] }) {
    const formData = new FormData();
    formData.append('message', message || 'Please check this item.');

    if (file && file.buffer) {
      formData.append('image', file.buffer, {
        filename: file.originalname || 'upload.jpg',
        contentType: file.mimetype || 'image/jpeg',
      });
    } else if (imageUrl) {
      try {
        let imgBuffer = null;
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 8000 });
          imgBuffer = Buffer.from(imgRes.data);
        } else if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('uploads/')) {
          const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
          const localPath = path.join(process.cwd(), cleanPath);
          imgBuffer = await fs.readFile(localPath);
        }
        if (imgBuffer) {
          formData.append('image', imgBuffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg',
          });
        }
      } catch (e) {
        console.warn('⚠️ Failed to load image buffer for VLM:', e.message);
      }
    }

    if (history && history.length > 0) {
      formData.append('history', JSON.stringify(history));
    }

    try {
      const response = await axios.post(`${VLM_SERVICE_URL}/api/vlm/chat`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: VLM_TIMEOUT_MS,
      });

      if (response.data && response.data.success) {
        const matchedProducts = await this.findRelevantProducts(message, response.data.action_payload);
        return {
          reply: response.data.reply,
          action_payload: response.data.action_payload || null,
          has_image: response.data.has_image || false,
          matchedProducts,
          isFallback: false,
        };
      }

      throw new Error('VLM server returned unsuccessful payload');
    } catch (error) {
      console.warn(`⚠️ Local VLM Server call failed (${error.code || error.message}). Activating graceful fallback...`);
      return await this.handleGracefulFallback(message, file);
    }
  }

  static async findRelevantProducts(message, actionPayload) {
    try {
      let queryKeywords = [];
      if (actionPayload?.product_name) queryKeywords.push(actionPayload.product_name);
      if (actionPayload?.sku) queryKeywords.push(actionPayload.sku);

      if (queryKeywords.length === 0 && message) {
        const words = message.toLowerCase().match(/\b(shirt|polo|t-shirt|pant|jeans|chinos|formal|panjabi|hoodie|jacket|dress|trouser|kurti)\b/g);
        if (words && words.length > 0) {
          queryKeywords.push(...words);
        }
      }

      if (queryKeywords.length === 0) return [];

      const regexQuery = queryKeywords.map(k => new RegExp(k, 'i'));
      return await Product.find({
        isActive: true,
        $or: [
          { name: { $in: regexQuery } },
          { tags: { $in: regexQuery } },
          { sku: { $in: regexQuery } }
        ]
      })
        .limit(3)
        .select('name price discount sku images sizes slug')
        .populate('sizes.size', 'name');
    } catch (err) {
      console.warn('Product search failed:', err.message);
      return [];
    }
  }

  /**
   * Graceful fallback when Python VLM server is busy, compiling CUDA kernels, or unreachable.
   * Uses MongoDB text/regex search so customer is never stranded.
   */
  static async handleGracefulFallback(message, file) {
    let matchedProducts = [];

    if (message) {
      // Clean query and search products
      const cleanQuery = message.replace(/[^\w\s]/gi, '').trim();
      if (cleanQuery.length > 2) {
        matchedProducts = await Product.find({
          isActive: true,
          $or: [
            { name: { $regex: cleanQuery, $options: 'i' } },
            { tags: { $in: [new RegExp(cleanQuery, 'i')] } },
            { sku: { $regex: cleanQuery, $options: 'i' } },
          ],
        })
          .limit(3)
          .select('name price discount sku images sizes')
          .populate('sizes.size', 'name');
      }
    }

    let fallbackReply = '';
    let fallbackAction = null;

    if (matchedProducts.length > 0) {
      const p = matchedProducts[0];
      const priceText = p.discount > 0 ? `৳${p.price - (p.price * p.discount / 100)} (${p.discount}% OFF)` : `৳${p.price}`;
      const sizeNames = (p.sizes || []).filter(s => s.stock > 0).map(s => s.size?.name || 'Standard');

      fallbackReply = `I'm currently running in lightweight mode, but I found **${p.name}** (SKU: \`${p.sku || 'N/A'}\`) for ${priceText}. Available sizes: ${sizeNames.join(', ') || 'In Stock'}. Would you like to select a size?`;
    } else if (file) {
      fallbackReply = "I received your photo! Our GPU vision engine is warming up. In the meantime, you can mention the item name or SKU you're looking for, and I'll find it instantly.";
    } else {
      fallbackReply = "Hello! I am your AI Shopping Assistant. How can I assist you with our clothing catalog, sizing, or placing an order today?";
    }

    return {
      reply: fallbackReply,
      action_payload: fallbackAction,
      has_image: !!file,
      isFallback: true,
      matchedProducts,
    };
  }
}
