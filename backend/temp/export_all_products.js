import 'dotenv/config';
import dns from 'dns';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dns.setServers(['8.8.8.8', '8.8.4.4']);

async function exportAll() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI is missing from backend/.env');
    process.exit(1);
  }

  console.log('📡 Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB successfully.');

  const db = mongoose.connection.db;

  // Destination folder: root/products_data
  const outputDir = path.resolve(__dirname, '../../products_data');
  const imagesDir = path.join(outputDir, 'images');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  console.log('Fetching collections data...');
  const [products, categories, subcategories, sizes] = await Promise.all([
    db.collection('products').find({}).toArray(),
    db.collection('categories').find({}).toArray(),
    db.collection('subcategories').find({}).toArray(),
    db.collection('sizes').find({}).toArray(),
  ]);

  console.log(`📦 Found:
  - Products: ${products.length}
  - Categories: ${categories.length}
  - Subcategories: ${subcategories.length}
  - Sizes: ${sizes.length}`);

  // Save raw data
  fs.writeFileSync(path.join(outputDir, 'products_raw.json'), JSON.stringify(products, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'categories.json'), JSON.stringify(categories, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'subcategories.json'), JSON.stringify(subcategories, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'sizes.json'), JSON.stringify(sizes, null, 2), 'utf-8');

  // Mappings
  const categoryMap = new Map(categories.map(c => [c._id.toString(), c.name]));
  const subcategoryMap = new Map(subcategories.map(sc => [sc._id.toString(), sc.name]));
  const sizeMap = new Map(sizes.map(s => [s._id.toString(), s.name || s.size || s.label]));

  // Process & enrich
  const enrichedProducts = [];
  const imageDownloadList = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const catName = p.category ? categoryMap.get(p.category.toString()) || p.category : null;
    const subCatName = p.subcategory ? subcategoryMap.get(p.subcategory.toString()) || p.subcategory : null;
    
    const enrichedSizes = (p.sizes || []).map(s => {
      const sId = s.size ? s.size.toString() : '';
      return {
        sizeId: s.size,
        sizeName: sizeMap.get(sId) || sId,
        stock: s.stock || 0
      };
    });

    const totalStock = enrichedSizes.reduce((acc, curr) => acc + (curr.stock || 0), 0);

    const localImages = [];
    (p.images || []).forEach((imgUrl, idx) => {
      if (typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
        const cleanSku = (p.sku || p.slug || `prod_${i}`).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${cleanSku}_img${idx + 1}.jpg`;
        imageDownloadList.push({ url: imgUrl, filename });
        localImages.push(`images/${filename}`);
      } else {
        localImages.push(imgUrl);
      }
    });

    enrichedProducts.push({
      id: p._id,
      name: p.name,
      slug: p.slug,
      sku: p.sku || `SKU-${i + 1}`,
      price: p.price,
      discount: p.discount || 0,
      finalPrice: p.discount ? Number((p.price - (p.price * p.discount / 100)).toFixed(2)) : p.price,
      category: catName,
      subcategory: subCatName,
      gender: p.gender || 'Unisex',
      brand: p.brand || null,
      material: p.material || null,
      color: p.color || null,
      description: p.description || '',
      tags: p.tags || [],
      sizes: enrichedSizes,
      totalStock: totalStock,
      images: p.images || [],
      localImages: localImages,
      isActive: p.isActive !== false,
      isFeatured: !!p.isFeatured,
      averageRating: p.averageRating || 0,
      totalReviews: p.totalReviews || 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    });
  }

  // Save enriched JSON
  fs.writeFileSync(
    path.join(outputDir, 'products_detailed.json'),
    JSON.stringify(enrichedProducts, null, 2),
    'utf-8'
  );

  // Markdown Summary
  let md = `# Downloaded Product Catalog\n\n`;
  md += `> **Total Products Exported:** ${enrichedProducts.length}\n`;
  md += `> **Export Timestamp:** ${new Date().toISOString()}\n\n`;
  md += `| # | SKU | Name | Category | Gender | Price (BDT) | Discount | Stock | Remote Images |\n`;
  md += `|---|:---|:---|:---|:---|:---|:---|:---|:---|\n`;

  enrichedProducts.forEach((p, idx) => {
    md += `| ${idx + 1} | \`${p.sku}\` | **${p.name.replace(/\|/g, '-')}** | ${p.category || '-'} | ${p.gender} | ৳${p.price} | ${p.discount}% | ${p.totalStock} | ${p.images.length} |\n`;
  });

  fs.writeFileSync(path.join(outputDir, 'README.md'), md, 'utf-8');
  console.log(`✅ Saved products_detailed.json and README.md in: ${outputDir}`);

  // Download product images locally with concurrency
  console.log(`🖼️ Downloading ${imageDownloadList.length} product images locally...`);
  let downloadedCount = 0;
  const CONCURRENCY = 20;

  async function downloadImage(item) {
    const dest = path.join(imagesDir, item.filename);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      downloadedCount++;
      return;
    }
    try {
      const response = await axios.get(item.url, { responseType: 'arraybuffer', timeout: 20000 });
      fs.writeFileSync(dest, Buffer.from(response.data));
      downloadedCount++;
    } catch (err) {
      console.error(`\n⚠️ Failed to download ${item.url}: ${err.message}`);
    }
  }

  for (let i = 0; i < imageDownloadList.length; i += CONCURRENCY) {
    const chunk = imageDownloadList.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(downloadImage));
    process.stdout.write(`\rDownloaded ${downloadedCount}/${imageDownloadList.length} images...`);
  }
  console.log(`\n🎉 Completed image download: ${downloadedCount}/${imageDownloadList.length} saved to products_data/images/`);

  await mongoose.disconnect();
  console.log('✅ Done! All product information has been exported successfully.');
}

exportAll().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
