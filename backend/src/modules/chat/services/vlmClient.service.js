import fs from 'fs/promises';
import path from 'path';
import { URL } from 'url';
import axios from 'axios';
import FormData from 'form-data';
import Product from '../../product/product.model.js';
import '../../size/size.model.js';
import logger from '../../../utils/logger.js';

const VLM_SERVICE_URL = process.env.VLM_SERVICE_URL || 'http://localhost:8000';
const VLM_TIMEOUT_MS = parseInt(process.env.VLM_TIMEOUT_MS, 10) || 35000; // 20 seconds timeout

const ALLOWED_REMOTE_IMAGE_DOMAINS = [
  'res.cloudinary.com',
  'clothing-e-commerce-web.vercel.app',
  'images.unsplash.com'
];
const LOCAL_UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

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
    // 1. Pre-retrieve matching products to supply live store knowledge context (RAG)
    let preMatched = [];
    try {
      preMatched = await this.findRelevantProducts(message);
    } catch (_) {}

    let enrichedMessage = message || 'Please check this item.';
    if (preMatched && preMatched.length > 0) {
      const liveSpecs = preMatched.slice(0, 2).map((p) => {
        const finalPrice = p.discount > 0 ? Math.round(p.price - (p.price * p.discount / 100)) : p.price;
        const discountStr = p.discount > 0 ? ` (${p.discount}% OFF, Regular ৳${p.price})` : '';
        const sizeNames = (p.sizes || [])
          .filter((s) => s.stock > 0 || typeof s.stock === 'undefined')
          .map((s) => `${s.size?.name || s.sizeName || s.name || 'Size'}${s.stock ? ` (${s.stock} in stock)` : ''}`)
          .join(', ');
        return `- Product: "${p.name}" | SKU: ${p.sku || 'N/A'}\n  Price: ৳${finalPrice}${discountStr}\n  Available Sizes: ${sizeNames || 'In Stock'}\n  Description/Fabric: ${p.description || 'Premium comfort wear, authentic fabric.'}`;
      }).join('\n');

      enrichedMessage = `${message}\n\n[Live Store Inventory Context:\n${liveSpecs}\nRule: Use this real store knowledge to answer any customer question about fabric, material, sizes, price, and ordering with 100% precision. If the user asks to buy or order, confirm enthusiastically and output the ADD_TO_CART action JSON.]`;
    }

    const formData = new FormData();
    formData.append('message', enrichedMessage);

    if (file && file.buffer) {
      formData.append('image', file.buffer, {
        filename: file.originalname || 'upload.jpg',
        contentType: file.mimetype || 'image/jpeg',
      });
    } else if (imageUrl && typeof imageUrl === 'string') {
      try {
        let imgBuffer = null;
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          const parsedUrl = new URL(imageUrl);
          const isDomainAllowed = ALLOWED_REMOTE_IMAGE_DOMAINS.includes(parsedUrl.hostname.toLowerCase());
          const isPrivateIp = /^(localhost|127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.)/.test(parsedUrl.hostname);

          if (!isDomainAllowed || isPrivateIp) {
            logger.warn(`SSRF attempt blocked. Disallowed hostname: ${parsedUrl.hostname}`);
            throw new Error("Target image host is not on the approved external domain whitelist.");
          }

          const imgRes = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 5000,
            maxContentLength: 10 * 1024 * 1024
          });
          imgBuffer = Buffer.from(imgRes.data);
        } else if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('uploads/')) {
          const relativeSub = path.normalize(imageUrl.replace(/^\/?uploads\/?/, '')).replace(/^(\.\.[\/\\])+/, '');
          const safeLocalPath = path.resolve(LOCAL_UPLOADS_DIR, relativeSub);

          if (!safeLocalPath.startsWith(LOCAL_UPLOADS_DIR + path.sep)) {
            logger.warn(`Path traversal attempt blocked: ${imageUrl}`);
            throw new Error("Access Denied: Path escapes sandbox boundaries.");
          }

          imgBuffer = await fs.readFile(safeLocalPath);
        }
        if (imgBuffer) {
          formData.append('image', imgBuffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg',
          });
        }
      } catch (e) {
        logger.warn('Image acquisition rejected for VLM:', { error: e.message });
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
        let replyText = response.data.reply || '';

        // Clean template tags
        replyText = replyText.replace(/\{\{Currency Symbol\}\}\s*/gi, '৳');
        replyText = replyText.replace(/\{\{Money Amount\}\}/gi, '');
        replyText = replyText.replace(/\{\{([^}]+)\}\}/g, '**$1**');

        let actionPayload = response.data.action_payload || null;
        let matchedProducts = (preMatched && preMatched.length > 0)
          ? preMatched
          : await this.findRelevantProducts(
              message,
              response.data.action_payload,
              response.data.reply
            );

        // Conversational ordering detection (English & Bengali)
        const orderIntent = /\b(order|kinte|buy|checkout|purchase|lagbe|nibo|nebo|dorkar|pathiye dao|kore dao)\b/i.test(message);
        if (!actionPayload && matchedProducts.length > 0 && orderIntent) {
          const chosenProd = matchedProducts[0];
          const sizeMatch = message.match(/\b(XS|S|M|L|XL|XXL|3XL|universal|std)\b/i);
          const inStock = (chosenProd.sizes || []).find((s) => s.stock > 0);
          const rawSize = sizeMatch
            ? sizeMatch[1].toUpperCase()
            : (inStock?.size?.name || inStock?.sizeName || inStock?.name || "M");
          
          actionPayload = {
            action: "ADD_TO_CART",
            product_name: chosenProd.name,
            sku: chosenProd.sku,
            size: rawSize,
            quantity: 1,
          };

          if (!replyText.toLowerCase().includes('order') && !replyText.toLowerCase().includes('cart')) {
            replyText += `\n\nI've selected **${chosenProd.name}** (Size: ${rawSize}) for you! You can click **"Order Now"** below to finalize checkout with Cash on Delivery.`;
          }
        }

        // If the reply is evasive or asked price without price in answer:
        const isEvasive = /please bear with me|gather the information|let me (quickly )?check|moment while I|will check that for you/i.test(replyText);
        const askedPrice = /\b(price|cost|dam|koto|pricing|rate|how much|taka|tk|৳)\b/i.test(message);

        if (matchedProducts.length > 0 && (isEvasive || (askedPrice && !/\b৳?\d{2,}\b/.test(replyText)))) {
          const p = matchedProducts[0];
          const finalPrice = p.discount > 0 ? Math.round(p.price - (p.price * p.discount / 100)) : p.price;
          const discountStr = p.discount > 0 ? ` (${p.discount}% OFF, Regular ৳${p.price})` : '';
          const sizeList = (p.sizes || []).filter(s => (s.stock > 0 || typeof s.stock === 'undefined')).map(s => s.size?.name || s.sizeName || s.name || s).filter(Boolean).join(', ');

          replyText = `The current price for **${p.name}** is **৳${finalPrice}**${discountStr}.${sizeList ? ` Available sizes: ${sizeList}.` : ''} You can view details, select your size, and click "Order Now" or "Cart" directly below!`;
        } else if (isEvasive) {
          replyText = replyText.replace(/Let me quickly check that for you.*?feel free to let me know\./is, "I've checked our catalog for you. You can explore the matching items, select your size, and order directly!");
        }

        return {
          reply: replyText,
          action_payload: actionPayload,
          has_image: response.data.has_image || false,
          matchedProducts,
          isFallback: false,
        };
      }

      throw new Error('VLM server returned unsuccessful payload');
    } catch (error) {
      logger.warn(`VLM Server call failed (${error.code || error.message}). Activating fallback.`);
      return await this.handleGracefulFallback(message, file);
    }
  }

  static async findRelevantProducts(message = '', actionPayload = null, reply = '') {
    try {
      const queryNames = [];
      const querySkus = [];

      if (actionPayload?.product_name) queryNames.push(actionPayload.product_name);
      if (actionPayload?.sku) querySkus.push(actionPayload.sku);

      // Extract bold and template product titles and SKUs from AI model reply (e.g. **Baby Hooded Towel 10** or {{Cotton Linen Pajamas 18}})
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
          const cleaned = bold.replace(/\s+\d+$/, '').trim();
          if (cleaned && cleaned !== bold) {
            queryNames.push(cleaned);
          }
        }

        const templateMatches = Array.from(reply.matchAll(/\{\{([^}]+)\}\}/g))
          .map((m) => m[1].trim())
          .filter(
            (b) =>
              b.length > 2 &&
              !['currency symbol', 'money amount', 'order id', 'date', 'price'].some((s) => b.toLowerCase().includes(s))
          );

        for (const tm of templateMatches) {
          queryNames.push(tm);
          const cleaned = tm.replace(/\s+\d+$/, '').trim();
          if (cleaned && cleaned !== tm) {
            queryNames.push(cleaned);
          }
          const subWords = cleaned.split(/\s+/);
          if (subWords.length > 1) {
            for (const sw of subWords) {
              if (sw.length > 3) queryNames.push(sw);
            }
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
        /\b(shirt|polo|t-shirt|pant|pants|jeans|chinos|formal|panjabi|hoodie|jacket|dress|trouser|trousers|kurti|towel|baby|bodysuit|sweater|cardigan|coat|sandals|sneakers|backpack|cap|pajama|pajamas|pyjama|pyjamas|sleepwear|nightwear|cotton|linen|silk|satin|lounge|loungewear|suit|blazer|shorts|tee|top|skirt)\b/gi
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
            .select('name price discount sku images sizes slug description tags')
            .populate({ path: 'sizes.size', select: 'name' })
            .lean();
        }

        if ((!mongoMatches || mongoMatches.length === 0) && uniqueNames.length > 0) {
          for (const uName of uniqueNames) {
            if (uName.length > 3) {
              const partial = await Product.find({
                isActive: true,
                name: { $regex: uName, $options: 'i' },
              })
                .limit(3)
                .select('name price discount sku images sizes slug description tags')
                .populate({ path: 'sizes.size', select: 'name' })
                .lean();
              if (partial && partial.length > 0) {
                mongoMatches = partial;
                break;
              }
            }
          }
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
        logger.warn('MongoDB query failed in findRelevantProducts, falling back to catalog:', { error: dbErr.message });
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
                  description: item.description || '',
                  sizes: (item.sizes || []).map((s) => {
                    const rawId = s.sizeId || (typeof s.size === 'object' && s.size ? (s.size._id || s.size.id) : s.size) || s._id || s.id || '';
                    const rawName = s.sizeName || (typeof s.size === 'object' && s.size ? (s.size.name || s.size.sizeName) : s.size) || s.name || 'Standard';
                    return {
                      size: {
                        _id: typeof rawId === 'object' ? String(rawId?._id || rawId?.id || '') : String(rawId),
                        name: typeof rawName === 'object' ? String(rawName?.name || rawName?.sizeName || 'Standard') : String(rawName),
                      },
                      stock: typeof s.stock === 'number' ? s.stock : 20,
                    };
                  }),
                });
              }
            }
            if (catalogMatches.length >= 3) break;
          }

          if (catalogMatches.length > 0) return catalogMatches;
        }
      } catch (catErr) {
        logger.warn('Catalog file fallback failed:', { error: catErr.message });
      }

      return [];
    } catch (err) {
      logger.warn('Product matching failed:', { error: err.message });
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
