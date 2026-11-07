// backend/src/scripts/seedBlogs.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Blog from '../modules/blog/blog.model.js';
import User from '../modules/user/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env configuration
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(" MONGO_URI is missing from the environment configuration!");
  process.exit(1);
}

const blogs = [
  {
    title: "The Evolution of Minimalist Denim in Modern Streetwear",
    slug: "evolution-of-minimalist-denim-modern-streetwear",
    category: "COLLECTION",
    featuredImage: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80",
    readingTime: "4 min read",
    tags: ["denim", "streetwear", "minimalism", "fashion-trends"],
    status: "PUBLISHED",
    isFeatured: true,
    viewCount: 154,
    content: `
      <h2>The Rise of Understated Comfort</h2>
      <p>Denim has always been the cornerstone of casual attire, but in recent years, it has undergone a remarkable metamorphosis. The flashy, heavily distressed styles of the early 2000s have given way to clean lines, raw finishes, and architectural silhouettes. Today's modern streetwear enthusiast prioritizes structured minimalism over decorative excess.</p>
      
      <blockquote>"Minimalism isn't about lack of something. It's about the perfect amount of something."</blockquote>
      
      <h2>Key Denim Trends to Follow</h2>
      <ul>
        <li><strong>Raw & Unwashed Finishes:</strong> Providing a deep indigo luster that breaks in naturally over time.</li>
        <li><strong>Relaxed, Architectural Fits:</strong> Moving away from tight-fitting styles to wider, structured leg silhouettes.</li>
        <li><strong>Functional Detailing:</strong> Subtle rivets, clean contrast stitching, and invisible pocket linings.</li>
      </ul>
      
      <h2>Styling Minimalist Denim</h2>
      <p>The beauty of minimalist denim lies in its adaptability. Combine a raw relaxed-fit jean with a structured monochrome tee or a premium trench coat. The clean aesthetic allows for elevated styling that transitions effortlessly from day to night.</p>
    `,
    seo: {
      metaTitle: "Minimalist Denim in Streetwear | Premium Fashion Insights",
      metaDescription: "Explore how clean, minimalist denim is redefining modern streetwear aesthetics. Discover raw finishes, structured fits, and styling tips.",
      keywords: ["denim", "minimalist fashion", "streetwear trends", "premium denim"]
    }
  },
  {
    title: "Sustainable Fabric Innovation: From Pineapple Leaves to Premium Jackets",
    slug: "sustainable-fabric-innovation-pineapple-leaves-premium-jackets",
    category: "FABRIC",
    featuredImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80",
    readingTime: "6 min read",
    tags: ["sustainability", "eco-friendly", "textiles", "innovation"],
    status: "PUBLISHED",
    isFeatured: true,
    viewCount: 210,
    content: `
      <h2>The Next Frontier in Green Luxury</h2>
      <p>As the fashion industry faces growing environmental challenges, material scientists and designers are collaborating to discover innovative alternative fabrics. One of the most remarkable breakthroughs of the decade is the conversion of agricultural waste into luxurious textiles. Pineapple leaf fibers, traditionally discarded, are now being spun into high-end leather alternatives and breathable summer jacket materials.</p>
      
      <h2>Why Organic Waste Fabrics represent the Future</h2>
      <p>Using pineapple leaf fibers (Piñatex) and other bio-materials reduces dependence on synthetic polymers and petro-chemical plastics. Not only is the material fully biodegradable, but it also creates secondary streams of income for local farmers in tropical regions.</p>
      
      <h2>Performance Meets Aesthetics</h2>
      <p>These sustainable materials do not sacrifice quality or design. They boast:
      <ul>
        <li>Incredible tensile strength and durability.</li>
        <li>Natural water-resistant properties.</li>
        <li>A unique textured organic finish that gives premium outerwear an unmatched luxury character.</li>
      </ul>
    `,
    seo: {
      metaTitle: "Sustainable Fabric Innovations & Bio-Materials in Fashion",
      metaDescription: "How pineapple leaves and agricultural waste are engineered into high-performance sustainable fabrics for premium luxury outerwear.",
      keywords: ["sustainable fabrics", "pinatex", "eco fashion", "innovative textiles"]
    }
  },
  {
    title: "Unveiling the Cyberpunk & Vanguard Aesthetics of 2026 Fashion",
    slug: "unveiling-cyberpunk-vanguard-aesthetics-2026-fashion",
    category: "COLLECTION",
    featuredImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
    readingTime: "5 min read",
    tags: ["vanguard", "cyberpunk", "futuristic", "outerwear"],
    status: "PUBLISHED",
    isFeatured: false,
    viewCount: 98,
    content: `
      <h2>Welcome to the Cyber-Realist Era</h2>
      <p>As technology integrates deeply with daily life, fashion has begun responding with functional, dystopian, and protective aesthetics. The Cyberpunk and Vanguard styles of 2026 feature hyper-functional utility, matte black palettes, and reflective neon geometric details. Outerwear is no longer just shielding against the cold—it is an armor for the metropolitan landscape.</p>
      
      <h2>Anatomy of the Vanguard Silhouette</h2>
      <p>The Vanguard silhouette blends technical utility with high-fashion tailoring. Think oversized technical hoods, asymmetrical zippers, magnetic utility clasps, and high-tenacity ripstop nylon. The design communicates strength, sophistication, and preparedness.</p>
      
      <h2>Color Palettes & Accents</h2>
      <p>While monochrome matte black forms the base, active neon elements, iridescent grey coatings, and deep purple accents provide visual contrast under low-light night-time environments.</p>
    `,
    seo: {
      metaTitle: "Cyberpunk & Vanguard Fashion Aesthetics of 2026",
      metaDescription: "Uncover the design elements behind cyberpunk streetwear and vanguard techwear. Explore the futuristic styles shaping 2026 wardrobes.",
      keywords: ["cyberpunk fashion", "techwear", "vanguard outerwear", "futuristic style"]
    }
  },
  {
    title: "How Indigo Dyeing Techniques Define Traditional Cultural Heritage",
    slug: "how-indigo-dyeing-techniques-define-traditional-cultural-heritage",
    category: "CULTURE",
    featuredImage: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1200&q=80",
    readingTime: "5 min read",
    tags: ["indigo", "traditional-dye", "heritage", "artisanal"],
    status: "PUBLISHED",
    isFeatured: false,
    viewCount: 125,
    content: `
      <h2>The Soul of Deep Blue</h2>
      <p>Artisanal indigo dyeing is one of the oldest textile traditions, spanning continents and centuries. From Japan’s ancient Aizome workshops to the indigo pits of West Africa, natural indigo is far more than a pigment; it is a cultural legacy that carries the stories of the people who cultivate it.</p>
      
      <h2>The Craftsmanship of Natural Fermentation</h2>
      <p>True indigo is extracted from the leaves of the <i>Indigofera</i> plant. Unlike synthetic chemical dyes, natural indigo requires a delicate fermentation process that can take weeks. The dye bath itself is a living organism, requiring precise temperature control and balance.</p>
      
      <h2>A Unique Living Finish</h2>
      <p>One of the reasons natural indigo is so celebrated is its "living color." Over time, indigo-dyed fabrics fade selectively based on the wear and environment of the user, creating a completely unique map of their life on the fabric itself.</p>
    `,
    seo: {
      metaTitle: "Artisanal Indigo Dyeing & Textile Heritage | Culture & Fashion",
      metaDescription: "Discover the heritage, process, and cultural significance of natural indigo dyeing. Learn about Japanese Aizome and African indigo traditions.",
      keywords: ["indigo dyeing", "artisanal fashion", "textile heritage", "organic pigments"]
    }
  },
  {
    title: "The Art of Slow Fashion: Building a Timeless Capsule Wardrobe",
    slug: "art-of-slow-fashion-building-timeless-capsule-wardrobe",
    category: "LIFESTYLE",
    featuredImage: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1200&q=80",
    readingTime: "4 min read",
    tags: ["slow-fashion", "capsule-wardrobe", "minimalism", "sustainable-lifestyle"],
    status: "PUBLISHED",
    isFeatured: true,
    viewCount: 312,
    content: `
      <h2>Quality Over Quantity</h2>
      <p>The modern consumer is increasingly turning away from fast, disposable fashion cycles in favor of slow fashion—an intentional approach that emphasizes longevity, ethical production, and timeless styling. Building a capsule wardrobe is the perfect entry point into this rewarding lifestyle.</p>
      
      <h2>Steps to Create Your Capsule Wardrobe</h2>
      <ol>
        <li><strong>Audit Your Current Pieces:</strong> Identify the clothes you love and wear repeatedly, and note their fabrics and fits.</li>
        <li><strong>Establish a Core Color Palette:</strong> Select warm neutrals (cream, beige, brown) or cool neutrals (navy, black, grey) to make mixing and matching effortless.</li>
        <li><strong>Invest in Premium Foundation Items:</strong> Prioritize high-quality organic cotton tees, tailored linen trousers, and structured wool coats.</li>
      </ol>
      
      <blockquote>"Buy less, choose well, make it last." – Vivienne Westwood</blockquote>
    `,
    seo: {
      metaTitle: "How to Build a Timeless Capsule Wardrobe | Slow Fashion",
      metaDescription: "Learn the fundamentals of slow fashion. Discover our step-by-step guide to curating a minimalist, premium, and highly versatile capsule wardrobe.",
      keywords: ["capsule wardrobe", "slow fashion", "minimalist lifestyle", "sustainable clothing"]
    }
  },
  {
    title: "Eco-Conscious Linen: Why It's the Ultimate Breathable Summer Fabric",
    slug: "eco-conscious-linen-ultimate-breathable-summer-fabric",
    category: "FABRIC",
    featuredImage: "https://images.unsplash.com/photo-1520006403909-838d6b929222?auto=format&fit=crop&w=1200&q=80",
    readingTime: "3 min read",
    tags: ["linen", "sustainable-fabric", "summer-fashion", "breathable"],
    status: "PUBLISHED",
    isFeatured: false,
    viewCount: 75,
    content: `
      <h2>The Organic Cooling System</h2>
      <p>Linen is derived from the resilient flax plant and is celebrated as one of the oldest cultivated fabrics in the world. Thanks to its hollow fibers and loose weave, linen allows air to circulate freely around the body, absorbing moisture and drying rapidly in high-humidity climates.</p>
      
      <h2>Environmental Benefits of Flax Cultivation</h2>
      <p>Flax is highly sustainable:
      <ul>
        <li>It requires significantly less water and chemical pesticides than conventional cotton.</li>
        <li>It grows in poor soil conditions, meaning it does not compete with agriculture for food resources.</li>
        <li>Every single part of the flax plant is used—eliminating waste completely.</li>
      </ul>
      
      <h2>Styling Breezy Linen Outfits</h2>
      <p>Linen’s natural crinkles and raw textures represent effortless luxury. Wear an oversized linen shirt with relaxed linen trousers for a sophisticated, breathable summer outfit that looks refined and relaxed.</p>
    `,
    seo: {
      metaTitle: "Linen: The Most Sustainable Summer Fabric | Eco Wear",
      metaDescription: "Discover why organic linen is the perfect choice for keeping cool sustainably during summer. Explore the benefits of flax cultivation.",
      keywords: ["linen fabric", "flax linen", "breathable clothes", "eco-friendly linen"]
    }
  },
  {
    title: "Behind the Seams: The Making of the Premium Vanguard Trench Coat",
    slug: "behind-the-seams-making-of-premium-vanguard-trench-coat",
    category: "COLLECTION",
    featuredImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=80",
    readingTime: "7 min read",
    tags: ["outerwear", "craftsmanship", "behind-the-scenes", "design-process"],
    status: "PUBLISHED",
    isFeatured: true,
    viewCount: 188,
    content: `
      <h2>Crafting the Modern Armor</h2>
      <p>The Vanguard Trench Coat represents our design philosophy: merging high-performance technical utility with sophisticated tailoring. In this article, we take you behind the seams to witness the meticulous prototyping, drafting, and sewing processes that bring this masterpiece to life.</p>
      
      <h2>Choosing the Technical Shell</h2>
      <p>We began by sourcing a high-density, three-layer waterproof technical laminate. The outer face features a matte texture, while the interior is bonded to a breathable membrane that blocks heavy rain but allows body heat to escape seamlessly.</p>
      
      <h2>The Precision Tailoring Process</h2>
      <p>Every pattern block is digitally drafted for ergonomic motion. We've incorporated pre-curved sleeves, laser-cut utility pockets, and seam tapes to ensure total weather protection. Over 48 hours of meticulous craftsmanship go into sewing and taping a single coat.</p>
    `,
    seo: {
      metaTitle: "Behind the Scenes: Making the Vanguard Trench Coat",
      metaDescription: "A deep dive into the engineering, technical shell sourcing, and bespoke craftsmanship behind our signature Vanguard Trench Coat.",
      keywords: ["vanguard trench coat", "outerwear design", "technical garment manufacturing", "waterproof coats"]
    }
  },
  {
    title: "Sustainable Fashion Pioneers: Shaping the Next Generation",
    slug: "sustainable-fashion-pioneers-shaping-next-generation",
    category: "NEWS",
    featuredImage: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    readingTime: "4 min read",
    tags: ["news", "industry-leaders", "pioneers", "circularity"],
    status: "PUBLISHED",
    isFeatured: false,
    viewCount: 82,
    content: `
      <h2>Global Circularity Summit Highlights</h2>
      <p>This week, the annual Global Circularity Summit gathered the most forward-thinking textile designers, founders, and activists. The message was loud and clear: circular fashion is no longer a luxury choice; it is an immediate mandate. We cover the breakthrough ideas, technologies, and pioneers shaping the industry.</p>
      
      <h2>Redesigning the Lifecycle of Apparel</h2>
      <p>Pioneering startup brands are implementing full circular lifecycles. Customers can return worn garments for credit, which are then disassembled, chemically shredded, and respun into new high-grade polyester or organic cotton blends, bypassing landfills entirely.</p>
      
      <h2>Government Regulations & Policy Support</h2>
      <p>New European Union guidelines scheduled for late 2026 will enforce digital product passports for all garments, allowing consumers to scan a label and verify the exact carbon footprint and origin of their purchase.</p>
    `,
    seo: {
      metaTitle: "Sustainable Fashion Pioneers & Circularity News",
      metaDescription: "Catch up on the latest news from the Global Circularity Summit. Discover the technology and leaders driving next-gen textile recycling.",
      keywords: ["circular fashion", "textile recycling", "global fashion news", "sustainable pioneers"]
    }
  },
  {
    title: "Monochromatic Styling: Master the Art of Single-Tone Outfits",
    slug: "monochromatic-styling-master-art-of-single-tone-outfits",
    category: "LIFESTYLE",
    featuredImage: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80",
    readingTime: "4 min read",
    tags: ["styling", "monochrome", "lifestyle", "wardrobe-advice"],
    status: "PUBLISHED",
    isFeatured: false,
    viewCount: 147,
    content: `
      <h2>The Elegance of Simplicity</h2>
      <p>Dressing in a single tone or color family is one of the most powerful ways to create a striking, cohesive, and sophisticated look. Monochromatic styling elongates the body's silhouette and directs focus to the texture, drape, and tailoring of your pieces.</p>
      
      <h2>How to Avoid Looking Flat</h2>
      <p>The secret to successful monochromatic dressing is **tactile texture variation**. Combining pieces of the exact same fabric can look dull. Instead, mix:
      <ul>
        <li>A matte wool coat with a silk or satin undershirt.</li>
        <li>Heavily textured knitwear with smooth structured trousers.</li>
        <li>Buffed nubuck leather boots with flat canvas chinos.</li>
      </ul>
      
      <h2>Selecting the Ideal Shades</h2>
      <p>Start with accessible tones like slate grey, charcoal, deep olive, or warm oatmeal before venturing into vibrant jewel tones.</p>
    `,
    seo: {
      metaTitle: "Monochromatic Dressing & Style Guide | Luxury Aesthetics",
      metaDescription: "Master the art of single-tone styling. Learn how to combine textures, layer tones, and look incredibly sophisticated in monochrome.",
      keywords: ["monochrome styling", "style guide", "textural dressing", "capsule outfit"]
    }
  },
  {
    title: "E-commerce & Smart Textiles: The Future of Connected Clothing",
    slug: "ecommerce-smart-textiles-future-of-connected-clothing",
    category: "NEWS",
    featuredImage: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
    readingTime: "6 min read",
    tags: ["smart-textiles", "fashion-tech", "ecommerce", "industry-future"],
    status: "PUBLISHED",
    isFeatured: true,
    viewCount: 195,
    content: `
      <h2>Bridging Digital & Physical Wardrobes</h2>
      <p>Smart textiles—fabrics embedded with conductive fibers, microscopic sensors, or thermal elements—are transitioning from specialized laboratories to consumer retail closets. In this report, we analyze the upcoming integration of digital tech wear and e-commerce.</p>
      
      <h2>Heating & Ventilation on Demand</h2>
      <p>Imagine a coat that adapts dynamically to your environment. Equipped with Bluetooth micro-thermostats, users can adjust the warmth of their jackets using an app or set it to adjust automatically based on external weather feeds.</p>
      
      <h2>Digital Authenticity & NFC Passports</h2>
      <p>By embedding tiny washable NFC chips into high-end collections, brands can permanently resolve counterfeit issues while offering owners premium VIP experiences, early product drops, and exclusive digital style guides.</p>
    `,
    seo: {
      metaTitle: "The Future of Smart Textiles & Connected Apparel | News",
      metaDescription: "Discover how smart fabrics, built-in thermal heating, and NFC identity tags are transforming premium e-commerce fashion.",
      keywords: ["smart textiles", "fashion tech", "connected clothing", "nfc fashion"]
    }
  }
];

async function seedBlogs() {
  try {
    console.log(" Connecting to MongoDB Database...");
    await mongoose.connect(MONGO_URI);
    console.log(" Successfully connected to MongoDB database!");

    // Find the eshtiyak ahmmed siyam user or fall back to any admin/user
    let authorUser = await User.findOne({ email: "ssiyam563@gmail.com" });
    if (!authorUser) {
      authorUser = await User.findOne();
    }

    if (!authorUser) {
      console.error(" No user/author found in the database. Please seed users first!");
      process.exit(1);
    }

    console.log(` Author assigned: ${authorUser.name} (${authorUser.email})`);

    // Prepare blogs with correct author ID
    const processedBlogs = blogs.map(blog => ({
      ...blog,
      author: authorUser._id
    }));

    console.log(" Purging any existing seeded blogs with identical slugs...");
    const slugs = processedBlogs.map(b => b.slug);
    await Blog.deleteMany({ slug: { $in: slugs } });

    console.log(` Inserting ${processedBlogs.length} premium blogs...`);
    const insertedBlogs = await Blog.insertMany(processedBlogs);
    console.log(` Successfully seeded ${insertedBlogs.length} premium blogs!`);

    process.exit(0);
  } catch (error) {
    console.error(" Seeding failed with error:", error);
    process.exit(1);
  }
}

seedBlogs();
