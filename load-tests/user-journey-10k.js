
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for deep observability
const orderSuccessRate = new Rate('order_success_rate');
const catalogDuration = new Trend('catalog_duration', true);
const detailsDuration = new Trend('details_duration', true);

/**
 * Realistic E-Commerce Customer Journey Stress Test
 * Uses REAL, dynamically discovered products, categories, and inventory from the running database.
 */
export const options = {
  stages: [
    { duration: '30s', target: 200 },    // Warmup: Ramp to 200 users
    { duration: '1m', target: 1000 },   // Step 1: Scale to 1,000 users
    { duration: '1m30s', target: 3000 }, // Step 2: Ramp to 3,000 users
    { duration: '2m', target: 5000 },   // Step 3: High Stress 5,000 users
    { duration: '2m', target: 10000 },  // Step 4: Peak Flash-Sale 10,000 users
    { duration: '1m', target: 10000 },  // Step 5: Sustain at peak 10,000 users
    { duration: '1m', target: 0 },      // Step 6: Graceful cool-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],      // Less than 5% total failure under load
    http_req_duration: ['p(95)<3500'],   // 95% of responses within 3.5s under massive concurrency
    'order_success_rate': ['rate>0.85'], // Orders should successfully process >85% (accounting for sold out items)
  },
  noConnectionReuse: false,
  discardResponseBodies: false,
  userAgent: 'k6-RealisticUserEngine/2.0',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

const BANGLADESH_NAMES = [
  'Tanvir Ahmed', 'Rahim Chowdhury', 'Sadia Islam', 'Kamrul Hasan',
  'Fatima Akter', 'Nafis Al-Amin', 'Farhana Yeasmin', 'Arif Hossain',
  'Sumaiya Rahman', 'Mahmudul Karim', 'Tasnim Jahan', 'Shakib Khan',
  'Tamim Iqbal', 'Mushfiqur Rahim', 'Mehedi Hasan', 'Anika Tabassum',
  'Zubair Hossain', 'Nazmul Huda', 'Sharmin Sultana', 'Rashedul Islam',
  'Hasan Mahmud', 'Nusrat Jahan', 'Fahim Morshed', 'Tariqul Islam'
];

const BANGLADESH_ADDRESSES = [
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
  'Station Road, Rangpur Sadar, Rangpur'
];

const SEARCH_KEYWORDS = ['shirt', 'pant', 'denim', 'cotton', 'slim', 'track', 'jacket', 'casual', 'polo', 'black', 'white', 'fit'];

/**
 * Global Setup: Executes once before VUs spawn.
 * Fetches real products, real categories, and store settings from the live system.
 */
export function setup() {
  console.log(`[setup] Discarding dummy data. Querying live catalog from ${BASE_URL}...`);

  // 1. Fetch real products (up to 100)
  const prodRes = http.get(`${BASE_URL}/api/products?limit=100`, {
    headers: { 'Accept': 'application/json' },
  });

  let validProducts = [];
  try {
    const prodJson = prodRes.json();
    if (prodJson && prodJson.products && prodJson.products.length > 0) {
      validProducts = prodJson.products.filter(
        (p) => p && p.slug && p.sizes && p.sizes.length > 0 && p.sizes.some((s) => s.stock > 0)
      );
    }
  } catch (e) {
    console.error('[setup] Failed to parse live products:', e.message);
  }

  // 2. Fetch real categories
  const catRes = http.get(`${BASE_URL}/api/categories`, {
    headers: { 'Accept': 'application/json' },
  });

  let validCategories = [];
  try {
    const catJson = catRes.json();
    if (Array.isArray(catJson)) {
      validCategories = catJson.filter((c) => c && c.slug && c.slug !== 'on-sale');
    }
  } catch (e) {
    console.error('[setup] Failed to parse live categories:', e.message);
  }

  // 3. Fetch real settings
  const settingsRes = http.get(`${BASE_URL}/api/settings`, {
    headers: { 'Accept': 'application/json' },
  });

  console.log(`[setup] Initialized with ${validProducts.length} real products and ${validCategories.length} categories.`);

  return {
    products: validProducts,
    categories: validCategories,
  };
}

/**
 * Main VU Lifecycle - Executes per virtual user
 */
export default function (data) {
  const { products, categories } = data;

  // Guard fallback if setup failed to reach backend
  if (!products || products.length === 0) {
    sleep(1);
    return;
  }

  const randomSalt = Math.random().toString(36).substring(2, 8);
  const guestId = `guest_vu_${__VU}_${__ITER}_${randomSalt}`;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': 'http://localhost:3000',
    'x-guest-id': guestId,
  };

  // Determine user persona action based on realistic e-commerce traffic distribution
  const actionRoll = Math.random();

  // ACTION 1: Catalog Browsing with real filters (~35% of traffic)
  if (actionRoll < 0.35) {
    group('Browse Catalog & Filter', () => {
      const page = Math.floor(Math.random() * 4) + 1;
      const limit = Math.random() > 0.5 ? 12 : 24;
      const sort = ['-createdAt', 'price', '-price', 'featured'][Math.floor(Math.random() * 4)];

      let queryUrl = `${BASE_URL}/api/products?page=${page}&limit=${limit}&sort=${sort}`;

      // Randomly filter by real category
      if (categories.length > 0 && Math.random() > 0.4) {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        queryUrl += `&category=${cat.slug}`;
      }

      const res = http.get(queryUrl, { headers });
      catalogDuration.add(res.timings.duration);

      check(res, {
        'Catalog list status 200': (r) => r.status === 200,
        'Catalog returned products': (r) => {
          try {
            return r.json().products !== undefined;
          } catch (e) {
            return false;
          }
        },
      });
    });
  }
  // ACTION 2: Search with real product keywords (~20% of traffic)
  else if (actionRoll < 0.55) {
    group('Search Products', () => {
      const keyword = SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
      const searchRes = http.get(`${BASE_URL}/api/products?search=${encodeURIComponent(keyword)}&limit=10`, { headers });

      check(searchRes, {
        'Search status 200': (r) => r.status === 200,
      });
    });
  }
  // ACTION 3: Explore Categories & Settings (~15% of traffic)
  else if (actionRoll < 0.70) {
    group('Browse Categories & Store Info', () => {
      // Hit categories list
      const catRes = http.get(`${BASE_URL}/api/categories`, { headers });
      check(catRes, {
        'Categories status 200': (r) => r.status === 200,
      });

      // Hit store settings
      const setRes = http.get(`${BASE_URL}/api/settings`, { headers });
      check(setRes, {
        'Settings status 200': (r) => r.status === 200,
      });
    });
  }
  // ACTION 4: Deep Product Details Exploration (~20% of traffic)
  else if (actionRoll < 0.90) {
    group('View Product Details', () => {
      const product = products[Math.floor(Math.random() * products.length)];
      const detailRes = http.get(`${BASE_URL}/api/products/details/${product.slug}`, { headers });
      detailsDuration.add(detailRes.timings.duration);

      check(detailRes, {
        'Product details 200': (r) => r.status === 200,
        'Correct product returned': (r) => {
          try {
            return r.json().slug === product.slug;
          } catch (e) {
            return false;
          }
        },
      });
    });
  }
  // ACTION 5: Full Order Initiation with Real Inventory (~10% of traffic)
  else {
    group('Place Real COD Order', () => {
      // Select a real product that has available sizes
      const product = products[Math.floor(Math.random() * products.length)];
      const availableSizes = product.sizes.filter((s) => s.stock > 0);

      if (availableSizes.length > 0) {
        const selectedSize = availableSizes[Math.floor(Math.random() * availableSizes.length)];
        const sizeId = selectedSize.size?._id || selectedSize.size;

        const customerName = BANGLADESH_NAMES[Math.floor(Math.random() * BANGLADESH_NAMES.length)];
        const address = BANGLADESH_ADDRESSES[Math.floor(Math.random() * BANGLADESH_ADDRESSES.length)];
        const phone = `017${Math.floor(10000000 + Math.random() * 90000000)}`;
        const deliveryZone = Math.random() > 0.5 ? 'insideDhaka' : 'outsideDhaka';

        const orderPayload = JSON.stringify({
          orderItems: [
            {
              product: product._id,
              size: sizeId,
              quantity: 1,
            },
          ],
          shippingAddress: {
            name: customerName,
            phone: phone,
            address: address,
          },
          deliveryZone: deliveryZone,
          paymentMethod: 'cod',
        });

        const orderRes = http.post(`${BASE_URL}/api/orders/init`, orderPayload, { headers });
        const isSuccess = orderRes.status === 200 && orderRes.json('url') !== undefined;
        // Either order succeeds or stock was legitimately claimed by another concurrent user (out of stock)
        const isGraceful =
          isSuccess ||
          (orderRes.status === 400 &&
            (orderRes.body.includes('inventory') ||
              orderRes.body.includes('stock') ||
              orderRes.body.includes('unavailable') ||
              orderRes.body.includes('cancelled') ||
              orderRes.body.includes('out of stock')));
        orderSuccessRate.add(isSuccess);

        if (isSuccess) {
          const url = orderRes.json('url') || '';
          const orderId = url.includes('orderId=') ? url.split('orderId=')[1] : 'OK';
          console.log(`⚡ [LIVE-ORDER] #${orderId.slice(-8).toUpperCase()} | Customer: ${customerName} | Product: ${product.name.slice(0, 25)}...`);
        }

        check(orderRes, {
          'Order processed gracefully (200 OK or 400 OutOfStock)': () => isGraceful,
        });
      }
    });
  }

  // Realistic human think time between actions (300ms to 1.2s under load)
  sleep(0.3 + Math.random() * 0.9);
}
