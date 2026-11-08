import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * =========================================================================
 *  E-Commerce Huge Random Activity & Stress Testing Suite
 *  Simulates dynamic, hyper-realistic customer behaviors across the full store:
 *    - 100% Random Product & Random Size selection across ALL 250+ products
 *    - Real COD order placement with live stock decrement & instant receipt tracking
 *    - Random catalog page hopping (?page=1..N, sorting, categories, price range)
 *    - Deep product inspection (details, size guides, reviews)
 *    - Keyword search across the store
 *    - Active promotional banner campaigns, home layouts, and flash sales
 * =========================================================================
 */

// Custom Metrics
const orderSuccessRate = new Rate('order_success_rate');
const catalogPageDuration = new Trend('catalog_page_duration', true);
const detailsDuration = new Trend('details_duration', true);
const orderInitDuration = new Trend('order_init_duration', true);
const totalOrdersPlaced = new Counter('orders_placed_total');
const randomPageHops = new Counter('random_page_hops_total');

export const options = {
  stages: [
    { duration: '20s', target: 50 },    // Warmup: Ramp to 50 VUs
    { duration: '40s', target: 200 },   // Step 1: Scale to 200 VUs
    { duration: '1m', target: 500 },    // Step 2: High concurrency 500 VUs
    { duration: '30s', target: 500 },   // Step 3: Sustain peak
    { duration: '30s', target: 0 },     // Graceful ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],           // Error rate below 5%
    http_req_duration: ['p(95)<3000'],        // 95% of requests under 3s
    order_success_rate: ['rate>0.85'],        // Order success > 85%
  },
  noConnectionReuse: false,
  discardResponseBodies: false,
  batch: 20,
  batchPerHost: 20,
  userAgent: 'k6-HugeActivityEngine/3.0',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// 45+ Diverse Bangladeshi Names for realistic guest customers
const BD_NAMES = [
  'Tanvir Ahmed', 'Rahim Chowdhury', 'Sadia Islam', 'Kamrul Hasan',
  'Fatima Akter', 'Nafis Al-Amin', 'Farhana Yeasmin', 'Arif Hossain',
  'Sumaiya Rahman', 'Mahmudul Karim', 'Tasnim Jahan', 'Shakib Khan',
  'Tamim Iqbal', 'Mushfiqur Rahim', 'Mehedi Hasan', 'Anika Tabassum',
  'Zubair Hossain', 'Nazmul Huda', 'Sharmin Sultana', 'Rashedul Islam',
  'Hasan Mahmud', 'Nusrat Jahan', 'Fahim Morshed', 'Tariqul Islam',
  'Rifat Hasan', 'Jannatul Ferdous', 'Shahriar Kabir', 'Nadia Afrin',
  'Saiful Islam', 'Tahmina Begum', 'Asifur Rahman', 'Shamim Reza',
  'Mithila Farzana', 'Emon Sarker', 'Rubina Parveen', 'Shuvo Paul',
  'Kazi Anowar', 'Bikash Roy', 'Joyonto Roy', 'Sayedur Rahman',
  'Humayun Kabir', 'Mousumi Akter', 'Rezaul Karim', 'Sabrina Mostafa'
];

// Diverse real addresses across Bangladesh
const BD_ADDRESSES = [
  'House 42, Road 11, Banani, Dhaka',
  'Plot 18, Block D, Bashundhara R/A, Dhaka',
  'House 5, Road 27, Dhanmondi, Dhaka',
  'Holding 102, GEC Circle, Nasirabad, Chattogram',
  'House 15, Sector 4, Uttara, Dhaka',
  'Shibganj Point, Sylhet Sadar, Sylhet',
  'Shaheb Bazar, Rajshahi City, Rajshahi',
  'House 88, Road 4, Mirpur DOHS, Dhaka',
  'Chashara More, Narayanganj Sadar, Narayanganj',
  'South Khulshi Residential Area, Chattogram',
  'Subidbazar, Sylhet Sadar, Sylhet',
  'Station Road, Rangpur Sadar, Rangpur',
  'Boyra Main Road, Khulna Sadar, Khulna',
  'Jaleshwaritola, Bogura Sadar, Bogura',
  'Kandirpar More, Cumilla Sadar, Cumilla',
  'Badambagicha, Mymensingh Sadar, Mymensingh'
];

const SEARCH_TERMS = [
  'shirt', 'pant', 'jeans', 'cotton', 'denim', 'jacket',
  'slim', 'casual', 'polo', 'black', 'white', 'blue',
  'track', 'hoodie', 'formal', 'blazer', 'fit', 'cargo'
];

const SORT_OPTIONS = ['-createdAt', 'price', '-price', 'featured', 'rating'];
const PAGE_LIMITS = [8, 12, 16, 24];

/**
 * Global Setup: Discovers ALL products, categories, subcategories, sizes,
 * promotional banners, and active home layouts from the live running database.
 */
export function setup() {
  console.log(`\n===============================================================`);
  console.log(`[setup] Discarding static mocks. Discovering live store from ${BASE_URL}...`);

  // 1. Fetch ALL products across the store (limit=300 to capture complete inventory)
  let allProducts = [];
  let totalCatalogPages = 1;

  try {
    const prodRes = http.get(`${BASE_URL}/api/products?limit=300`, {
      headers: { 'Accept': 'application/json' },
    });

    if (prodRes.status === 200) {
      const prodJson = prodRes.json();
      if (prodJson && prodJson.products && Array.isArray(prodJson.products)) {
        // Keep all products that have valid IDs, slugs, and sizes
        allProducts = prodJson.products.filter(
          (p) => p && p._id && p.slug && Array.isArray(p.sizes) && p.sizes.length > 0
        );
        totalCatalogPages = Math.ceil(allProducts.length / 12) || 21;
      }
    }
  } catch (err) {
    console.error('[setup] Failed to fetch live products:', err.message);
  }

  // 2. Fetch all real categories
  let allCategories = [];
  try {
    const catRes = http.get(`${BASE_URL}/api/categories`, {
      headers: { 'Accept': 'application/json' },
    });
    if (catRes.status === 200) {
      const catJson = catRes.json();
      if (Array.isArray(catJson)) {
        allCategories = catJson.filter((c) => c && c.slug && c.slug !== 'on-sale');
      }
    }
  } catch (err) {
    console.error('[setup] Failed to fetch live categories:', err.message);
  }

  // 3. Fetch subcategories & sizes for query variation
  let allSubcategories = [];
  try {
    const subRes = http.get(`${BASE_URL}/api/subcategories`, {
      headers: { 'Accept': 'application/json' },
    });
    if (subRes.status === 200) {
      const subJson = subRes.json();
      if (Array.isArray(subJson)) {
        allSubcategories = subJson;
      }
    }
  } catch (err) {}

  // 4. Calculate total in-stock items
  const inStockProducts = allProducts.filter((p) => p.sizes.some((s) => s.stock > 0));
  const totalStockUnits = allProducts.reduce((acc, p) => {
    return acc + p.sizes.reduce((sAcc, s) => sAcc + (s.stock || 0), 0);
  }, 0);

  console.log(`[setup] Total Products in Database: ${allProducts.length} (In Stock: ${inStockProducts.length})`);
  console.log(`[setup] Total Available Stock Units : ${totalStockUnits.toLocaleString()} units`);
  console.log(`[setup] Total Catalog Pages Found  : ${totalCatalogPages} pages`);
  console.log(`[setup] Total Categories Available : ${allCategories.length}`);
  console.log(`[setup] Setup complete. Ready for massive random user activity!`);
  console.log(`===============================================================\n`);

  return {
    products: allProducts,
    inStockProducts: inStockProducts,
    categories: allCategories,
    subcategories: allSubcategories,
    totalPages: totalCatalogPages,
  };
}

/**
 * Main Virtual User (VU) Execution Loop
 */
export default function (data) {
  const { products, inStockProducts, categories, subcategories, totalPages } = data;

  if (!products || products.length === 0) {
    sleep(1);
    return;
  }

  // Generate unique guest identity per iteration
  const randomSalt = Math.random().toString(36).substring(2, 9);
  const guestId = `guest_vu_${__VU}_${__ITER}_${randomSalt}`;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': 'http://localhost:3000',
    'x-guest-id': guestId,
    'Connection': 'keep-alive',
  };

  // Randomized activity selector:
  // 30% -> Random Product & Random Size Purchase Flow (High Intent Buyer)
  // 25% -> Random Page Navigation Across Entire Catalog (?page=X, filters, sorting)
  // 20% -> Random Product Deep Dive & Reviews Exploration
  // 15% -> Dynamic Keyword Search Across Store
  // 10% -> Promotional Banners, Home Layout & Flash Sale Exploration
  const activityRoll = Math.random();

  // =========================================================================
  // ACTIVITY 1: Random Product & Random Size Order Placement (30%)
  // =========================================================================
  if (activityRoll < 0.30) {
    group('Random Product & Size Order Placement', () => {
      // Pick a 100% RANDOM product from all in-stock products
      const pool = inStockProducts.length > 0 ? inStockProducts : products;
      const randomProduct = pool[Math.floor(Math.random() * pool.length)];

      // Pick a 100% RANDOM size from this product
      const availableSizes = randomProduct.sizes.filter((s) => s.stock > 0);
      const chosenSize = availableSizes.length > 0
        ? availableSizes[Math.floor(Math.random() * availableSizes.length)]
        : randomProduct.sizes[Math.floor(Math.random() * randomProduct.sizes.length)];

      const sizeId = chosenSize.size?._id || chosenSize.size;
      const sizeLabel = chosenSize.size?.name || chosenSize.name || 'Standard';

      // Authentic Bangladeshi Customer Details
      const customerName = BD_NAMES[Math.floor(Math.random() * BD_NAMES.length)];
      const customerAddress = BD_ADDRESSES[Math.floor(Math.random() * BD_ADDRESSES.length)];
      const prefixList = ['017', '018', '019', '013', '016'];
      const phonePrefix = prefixList[Math.floor(Math.random() * prefixList.length)];
      const customerPhone = `${phonePrefix}${Math.floor(10000000 + Math.random() * 90000000)}`;
      const deliveryZone = Math.random() > 0.45 ? 'insideDhaka' : 'outsideDhaka';
      const quantity = Math.random() > 0.85 ? 2 : 1;

      const orderPayload = JSON.stringify({
        orderItems: [
          {
            product: randomProduct._id,
            size: sizeId,
            quantity: quantity,
          },
        ],
        shippingAddress: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
        },
        deliveryZone: deliveryZone,
        paymentMethod: 'cod',
      });

      const startTime = Date.now();
      const orderRes = http.post(`${BASE_URL}/api/orders/init`, orderPayload, { headers });
      orderInitDuration.add(Date.now() - startTime);

      const isSuccess = orderRes.status === 200 && orderRes.json('url') !== undefined;
      const isOutOfStock =
        orderRes.status === 400 &&
        (orderRes.body.includes('out of stock') ||
          orderRes.body.includes('inventory') ||
          orderRes.body.includes('stock') ||
          orderRes.body.includes('unavailable') ||
          orderRes.body.includes('cancelled'));

      const isGraceful = isSuccess || isOutOfStock;
      orderSuccessRate.add(isSuccess);

      if (isSuccess) {
        totalOrdersPlaced.add(1);
        const redirectUrl = orderRes.json('url') || '';
        const orderId = redirectUrl.includes('orderId=')
          ? redirectUrl.split('orderId=')[1]
          : 'CONFIRMED';

        console.log(
          `⚡ [LIVE-ORDER] #${orderId.slice(-8).toUpperCase()} | Customer: ${customerName} | Product: "${randomProduct.name.slice(0, 28)}" | Size: ${sizeLabel} | Qty: ${quantity}`
        );

        // Immediate real-world behavior: Frontend redirects to success page and fetches order receipt
        if (orderId && orderId !== 'CONFIRMED') {
          const receiptRes = http.get(`${BASE_URL}/api/orders/${orderId}`, { headers });
          check(receiptRes, {
            'Order receipt fetched 200 OK': (r) => r.status === 200,
          });
        }
      }

      if (!isGraceful) {
        console.error(`❌ [ORDER-FAIL] Status: ${orderRes.status} | ErrCode: ${orderRes.error_code} | Err: ${orderRes.error} | Body: ${orderRes.body ? orderRes.body.slice(0, 100) : ''}`);
      }

      check(orderRes, {
        'Order placement status graceful (200 OK or 400 OutOfStock)': () => isGraceful,
      });
    });
  }

  // =========================================================================
  // ACTIVITY 2: Random Page Navigation Across Entire Catalog (25%)
  // =========================================================================
  else if (activityRoll < 0.55) {
    group('Random Catalog Page & Filter Hopping', () => {
      // Pick a 100% RANDOM page number dynamically scaled to the page limit
      const randomLimit = PAGE_LIMITS[Math.floor(Math.random() * PAGE_LIMITS.length)];
      const maxPages = Math.max(Math.ceil(products.length / randomLimit), 1);
      const randomPage = Math.floor(Math.random() * maxPages) + 1;
      const randomSort = SORT_OPTIONS[Math.floor(Math.random() * SORT_OPTIONS.length)];

      let catalogUrl = `${BASE_URL}/api/products?page=${randomPage}&limit=${randomLimit}&sort=${randomSort}`;

      // Randomly filter by a real category
      if (categories.length > 0 && Math.random() > 0.35) {
        const randCat = categories[Math.floor(Math.random() * categories.length)];
        catalogUrl += `&category=${randCat.slug}`;
      }

      // Randomly filter by price range
      if (Math.random() > 0.5) {
        const minP = Math.floor(Math.random() * 800) + 200;
        const maxP = minP + Math.floor(Math.random() * 2500) + 500;
        catalogUrl += `&minPrice=${minP}&maxPrice=${maxP}`;
      }

      randomPageHops.add(1);
      const startT = Date.now();
      const catRes = http.get(catalogUrl, { headers });
      catalogPageDuration.add(Date.now() - startT);

      if (catRes.status !== 200) {
        console.error(`❌ [CATALOG-FAIL] Status: ${catRes.status} | ErrCode: ${catRes.error_code} | Err: ${catRes.error}`);
      }

      check(catRes, {
        'Catalog random page 200 OK': (r) => r.status === 200,
        'Catalog returned products payload': (r) => {
          try {
            return r.json().products !== undefined;
          } catch (e) {
            return false;
          }
        },
      });
    });
  }

  // =========================================================================
  // ACTIVITY 3: Random Product Deep Dive & Reviews Exploration (20%)
  // =========================================================================
  else if (activityRoll < 0.75) {
    group('Random Product Deep Dive & Reviews', () => {
      // Pick a 100% RANDOM product from all products
      const randomProduct = products[Math.floor(Math.random() * products.length)];

      // 1. Fetch product details by slug
      const startT = Date.now();
      const detailRes = http.get(`${BASE_URL}/api/products/details/${randomProduct.slug}`, { headers });
      detailsDuration.add(Date.now() - startT);

      if (detailRes.status !== 200) {
        console.error(`❌ [DETAIL-FAIL] Status: ${detailRes.status} | ErrCode: ${detailRes.error_code} | Err: ${detailRes.error}`);
      }

      check(detailRes, {
        'Product details status 200': (r) => r.status === 200,
        'Returned matching product slug': (r) => {
          try {
            return r.json().slug === randomProduct.slug;
          } catch (e) {
            return false;
          }
        },
      });

      // 2. Fetch customer reviews for this specific product
      const reviewRes = http.get(`${BASE_URL}/api/reviews/product/${randomProduct._id}`, { headers });
      if (reviewRes.status !== 200) {
        console.error(`❌ [REVIEW-FAIL] Status: ${reviewRes.status} | ErrCode: ${reviewRes.error_code} | Err: ${reviewRes.error}`);
      }

      check(reviewRes, {
        'Product reviews status 200': (r) => r.status === 200,
      });
    });
  }

  // =========================================================================
  // ACTIVITY 4: Dynamic Keyword Search Across Store (15%)
  // =========================================================================
  else if (activityRoll < 0.90) {
    group('Dynamic Store Search', () => {
      let searchTerm;
      // 50% use curated keyword, 50% extract a word from a random product name
      if (Math.random() > 0.5) {
        searchTerm = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
      } else {
        const randProd = products[Math.floor(Math.random() * products.length)];
        const words = randProd.name.split(' ').filter((w) => w.length > 3);
        searchTerm = words.length > 0 ? words[Math.floor(Math.random() * words.length)] : 'shirt';
      }

      const searchPage = Math.floor(Math.random() * 3) + 1;
      const searchUrl = `${BASE_URL}/api/products?search=${encodeURIComponent(searchTerm)}&page=${searchPage}&limit=12`;

      const searchRes = http.get(searchUrl, { headers });
      if (searchRes.status !== 200) {
        console.error(`❌ [SEARCH-FAIL] Status: ${searchRes.status} | ErrCode: ${searchRes.error_code} | Err: ${searchRes.error}`);
      }

      check(searchRes, {
        'Search query status 200': (r) => r.status === 200,
        'Search returned valid payload': (r) => {
          try {
            return r.json().products !== undefined;
          } catch (e) {
            return false;
          }
        },
      });
    });
  }

  // =========================================================================
  // ACTIVITY 5: Promotional Banners, Home Layout & Flash Sales (10%)
  // =========================================================================
  else {
    group('Promotions & Store Information', () => {
      // 1. Fetch active modular homepage layout
      const layoutRes = http.get(`${BASE_URL}/api/home-layouts/active`, { headers });
      // 2. Fetch active banner campaigns
      const bannerRes = http.get(`${BASE_URL}/api/banner-campaigns/active`, { headers });
      // 3. Fetch active flash sales
      const flashRes = http.get(`${BASE_URL}/api/flash-sales/active`, { headers });
      // 4. Fetch store settings
      const settingsRes = http.get(`${BASE_URL}/api/settings`, { headers });

      if (layoutRes.status !== 200 || bannerRes.status !== 200 || flashRes.status !== 200 || settingsRes.status !== 200) {
        console.error(`❌ [PROMO-FAIL] Layout: ${layoutRes.status} | Banner: ${bannerRes.status} | Flash: ${flashRes.status} | Settings: ${settingsRes.status} | Err: ${layoutRes.error || bannerRes.error || flashRes.error || settingsRes.error}`);
      }

      check(layoutRes, {
        'Home layout status 200': (r) => r.status === 200,
      });
      check(bannerRes, {
        'Active banners status 200': (r) => r.status === 200,
      });
      check(flashRes, {
        'Flash sales status 200': (r) => r.status === 200,
      });
      check(settingsRes, {
        'Store settings status 200': (r) => r.status === 200,
      });
    });
  }

  // Realistic human think time between actions (800ms to 2.2s under high concurrency)
  sleep(0.8 + Math.random() * 1.4);
}
