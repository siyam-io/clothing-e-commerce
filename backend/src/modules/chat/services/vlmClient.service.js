import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import Product from '../../product/product.model.js';
import '../../size/size.model.js';

const VLM_SERVICE_URL = process.env.VLM_SERVICE_URL || 'http://localhost:8000';
const VLM_TIMEOUT_MS = parseInt(process.env.VLM_TIMEOUT_MS, 10) || 20000; // 20 seconds timeout

let _cachedCatalog = null;
const loadCatalog = async () => {
  if (_cachedCatalog) return _cachedCatalog;
  const possiblePaths = [
    path.resolve(process.cwd(), 'products_data/products_detailed.json'),
    path.resolve(process.cwd(), '../products_data/products_detailed.json'),
    path.resolve(process.cwd(), '../../products_data/products_detailed.json'),
  ];
  for (const p of possiblePaths) {
    try {
      const content = await fs.readFile(p, 'utf-8');
      _cachedCatalog = JSON.parse(content);
      return _cachedCatalog;
    } catch (_) {}
  }
  return [];
};

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
        const matchedProducts = await this.findRelevantProducts(
          message,
          response.data.action_payload,
          response.data.reply
        );
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

  static async findRelevantProducts(message = '', actionPayload = null, reply = '') {
    try {
      const queryNames = [];
      const querySkus = [];

      if (actionPayload?.product_name) queryNames.push(actionPayload.product_name);
      if (actionPayload?.sku) querySkus.push(actionPayload.sku);

      // Extract bold product titles and SKUs from AI model reply (e.g. **Baby Hooded Towel 10**)
      if (reply) {
        const boldMatches = Array.from(reply.matchAll(/\*\*([^*]+)\*\*/g))
          .map((m) => m[1].trim())
          .filter(
            (b) =>
              b.length > 2 &&
              !b.endsWith(':') &&
              !b.startsWith('৳') &&
              !['pricing', 'availability', 'category', 'target', 'regular', 'units', 'details', 'status'].some(
                (s) => b.toLowerCase().includes(s)
              )
          );

        for (const bold of boldMatches) {
          queryNames.push(bold);
          // If title has a trailing number (e.g. "Baby Hooded Towel 10"), also add base name "Baby Hooded Towel"
          const cleaned = bold.replace(/\s+\d+$/, '').trim();
          if (cleaned && cleaned !== bold) {
            queryNames.push(cleaned);
          }
        }

        const skuMatches = reply.match(/\bSKU[-_ ]?[A-Z0-9]+\b/gi);
        if (skuMatches) {
          for (const s of skuMatches) {
            querySkus.push(s.trim());
          }
        }
      }

      // Extract keywords from user message AND AI reply
      const combined = `${message || ''} ${reply || ''}`.toLowerCase();
      const words = combined.match(
        /\b(shirt|polo|t-shirt|pant|jeans|chinos|formal|panjabi|hoodie|jacket|dress|trouser|kurti|towel|baby|bodysuit|sweater|cardigan|coat|sandals|sneakers|backpack|cap)\b/g
      );
      if (words) {
        queryNames.push(...words);
      }

      const uniqueNames = Array.from(new Set(queryNames)).filter(Boolean);
      const uniqueSkus = Array.from(new Set(querySkus)).filter(Boolean);

      if (uniqueNames.length === 0 && uniqueSkus.length === 0) return [];

      const nameRegexes = uniqueNames.map((n) => new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
      const skuRegexes = uniqueSkus.map((s) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));

      // 1. Try to match in MongoDB Product collection (with name prioritized first)
      let mongoMatches = [];
      try {
        if (nameRegexes.length > 0) {
          mongoMatches = await Product.find({
            isActive: true,
            $or: [{ name: { $in: nameRegexes } }, { tags: { $in: nameRegexes } }],
          })
            .limit(3)
            .select('name price discount sku images sizes slug')
            .populate({ path: 'sizes.size', select: 'name' })
            .lean();
        }

        if ((!mongoMatches || mongoMatches.length === 0) && skuRegexes.length > 0) {
          mongoMatches = await Product.find({
            isActive: true,
            sku: { $in: skuRegexes },
          })
            .limit(3)
            .select('name price discount sku images sizes slug')
            .populate({ path: 'sizes.size', select: 'name' })
            .lean();
        }
      } catch (dbErr) {
        console.warn('⚠️ MongoDB query failed in findRelevantProducts, falling back to catalog:', dbErr.message);
      }

      if (mongoMatches && mongoMatches.length > 0) {
        return mongoMatches;
      }

      // 2. Fallback to full catalog (products_detailed.json) which has all catalog images
      try {
        const catalog = await loadCatalog();
        if (catalog && catalog.length > 0) {
          const catalogMatches = [];
          for (const item of catalog) {
            const itemName = (item.name || '').toLowerCase();
            const itemSku = (item.sku || '').toLowerCase();

            // Match by name or SKU
            const nameMatch = uniqueNames.some((q) => {
              const lowQ = q.toLowerCase();
              return itemName.includes(lowQ) || lowQ.includes(itemName);
            });
            const skuMatch = uniqueSkus.some((s) => s.toLowerCase() === itemSku);

            if (nameMatch || skuMatch) {
              if (!catalogMatches.some((m) => m.name === item.name)) {
                catalogMatches.push({
                  _id: item._id || item.sku || `prod_${catalogMatches.length + 1}`,
                  name: item.name,
                  sku: item.sku || 'IN-STOCK',
                  price: item.price || 0,
                  discount: item.discount || 0,
                  images: item.images || [],
                  slug: item.slug || '',
                  sizes: (item.sizes || []).map((s) => ({
                    size: { _id: s.size || s.name || s, name: s.size || s.name || s },
                    stock: s.stock || 20,
                  })),
                });
              }
            }
            if (catalogMatches.length >= 3) break;
          }

          if (catalogMatches.length > 0) return catalogMatches;
        }
      } catch (catErr) {
        console.warn('⚠️ Catalog file fallback failed:', catErr.message);
      }

      return [];
    } catch (err) {
      console.warn('⚠️ Product matching failed:', err.message);
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
