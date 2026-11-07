import axios from "axios";
import { asyncHandler } from "../../../middleware/asyncHandler.js";
import ApiKey from "../../settings/apiKey.model.js";
import PageSetting from "../../settings/settings.model.js";
import { decrypt } from "../../../utils/encryption.js";

export const generateProductAiContent = asyncHandler(async (req, res) => {
  const { name, categoryName } = req.body;

  if (!name || !categoryName) {
    return res.status(400).json({
      success: false,
      message: "Product name and category name are required for AI generation.",
    });
  }

  let siteName = "Store";
  try {
    const settings = await PageSetting.findOne();
    if (settings && settings.branding && settings.branding.siteName) {
      siteName = settings.branding.siteName;
    }
  } catch (error) {
    console.error("Error reading siteName from PageSetting:", error.message);
  }

  const brand = req.body.brand || siteName;

  let apiKey = "";
  try {
    const apiKeys = await ApiKey.findOne();
    if (apiKeys && apiKeys.geminiApiKey) {
      apiKey = decrypt(apiKeys.geminiApiKey);
    }
  } catch (error) {
    console.error("Error reading geminiApiKey from DB:", error.message);
  }

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "GEMINI_API_KEY is not configured on the server. Please add it to your Settings or environment variables.",
    });
  }

  const prompt = `You are an expert e-commerce copywriter. Generate high-converting SEO metadata and structured specification details for a clothing product with:
Name: "${name}"
Category: "${categoryName}"
Brand: "${brand}"

Generate:
1. metaTitle: Compelling meta title (under 60 chars) including the brand.
2. metaDescription: Enticing meta description (under 160 chars) highlighting quality and fit.
3. keywords: Comma-separated SEO search keywords (6-8 keywords).
4. fit: Specification fit (e.g. Slim Fit, Regular Fit, Oversized, Boxy Fit).
5. sleeve: Specification sleeve (e.g. Short Sleeve, Long Sleeve, Drop Shoulder, Sleeveless).
6. pattern: Specification pattern (e.g. Solid Color, Graphic Print, Striped, Checked).
7. collar: Specification collar/neck (e.g. Crewneck, Hooded, Polo Collar, V-Neck).
8. material: Material type inferred from name (e.g. 100% Cotton, Denim, Linen, Polyester).
9. color: Primary color inferred from name (e.g. Obsidian Black, Off-White, Sage Green, Crimson Red).
10. gender: Inferred target gender. Must be exactly one of: "Men", "Women", "Unisex", "Kids".
11. description: Detailed, engaging, and high-converting product description (around 100-150 words).
12. tags: Array of 6-8 relevant search tags/keywords for internal catalog search.
13. faqs: 3 relevant FAQs (Frequently Asked Questions) about the material, sizing, or care, formatted as an array of objects with 'question' and 'answer' fields.

Your response must be a single, valid JSON object containing exactly these keys: "metaTitle", "metaDescription", "keywords", "fit", "sleeve", "pattern", "collar", "material", "color", "gender", "description", "tags", "faqs". Do not include markdown code blocks.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(url, {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const candidateText = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("Empty response from Gemini API.");
    }

    const aiData = JSON.parse(candidateText.trim());
    res.json({
      success: true,
      data: aiData,
    });
  } catch (err) {
    console.error(" GEMINI API ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: `Failed to generate AI content: ${err.message}`,
    });
  }
});
