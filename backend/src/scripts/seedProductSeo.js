import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../modules/product/product.model.js";
import Category from "../modules/category/category.model.js";

dotenv.config();

const seedProductSeo = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is missing.");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully to MongoDB!");

    // Fetch all products
    const products = await Product.find({}).populate("category").lean();
    console.log(`Found ${products.length} products to process.`);

    let updatedCount = 0;

    for (const product of products) {
      const categoryName = product.category?.name || "Premium";
      
      // 1. Meta Title (Optimal: 50-60 characters)
      let metaTitle = `${product.name} | ${categoryName} Collection`;
      if (metaTitle.length > 60) {
        metaTitle = product.name;
        if (metaTitle.length > 60) {
          metaTitle = metaTitle.slice(0, 57) + "...";
        }
      }

      // 2. Meta Description (Optimal: 120-160 characters)
      let metaDescription = "";
      if (product.description && product.description.trim().length > 0) {
        const cleanDesc = product.description.replace(/\s+/g, " ").trim();
        if (cleanDesc.length > 155) {
          metaDescription = cleanDesc.slice(0, 152) + "...";
        } else {
          metaDescription = cleanDesc;
        }
      } else {
        metaDescription = `Shop the premium ${product.name} from our ${categoryName} line. Crafted with absolute premium quality materials and modern luxury tailoring.`;
      }

      // 3. Dynamic keywords
      const keywordsArray = [
        product.name.toLowerCase(),
        categoryName.toLowerCase(),
        product.brand ? product.brand.toLowerCase() : null,
        product.material ? product.material.toLowerCase() : null,
        product.color ? product.color.toLowerCase() : null,
        "premium clothing",
        "streetwear bangladesh",
        "bangladesh fashion",
        "exclusive apparel"
      ].filter(Boolean);

      // Unique-fy keywords
      const uniqueKeywords = [...new Set(keywordsArray)];
      const keywords = uniqueKeywords.join(", ");

      const seoData = {
        metaTitle,
        metaDescription,
        keywords
      };

      await Product.findByIdAndUpdate(
        product._id,
        { $set: { seo: seoData } },
        { new: true }
      );

      console.log(` Updated product [${product.name}] with SEO Metadata:`);
      console.log(`   - Title: "${metaTitle}"`);
      console.log(`   - Desc: "${metaDescription}"`);
      console.log(`   - Keywords: "${keywords}"\n`);
      updatedCount++;
    }

    console.log(` Done! Successfully populated SEO/AEO fields for ${updatedCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error(" Migration failed:", error);
    process.exit(1);
  }
};

seedProductSeo();
