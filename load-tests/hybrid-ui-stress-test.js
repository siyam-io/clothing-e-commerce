import { browser } from 'k6/browser';
import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Hybrid UI & Backend Concurrency Stress Test
 * 
 * Scenario 1 (background_load): 200 concurrent VUs hammering the backend API.
 * Scenario 2 (browser_experience): A real Google Chrome instance visiting the Next.js frontend
 *                                  to measure actual user-perceived Core Web Vitals (FCP, LCP, TTFB)
 *                                  WHILE the server is under heavy load!
 */
export const options = {
  scenarios: {
    // SCENARIO 1: Generates intense backend traffic
    background_load: {
      executor: 'constant-vus',
      vus: 100,
      duration: '45s',
      exec: 'apiTrafficGenerator',
    },
    // SCENARIO 2: Real Chrome browser measuring UI under that traffic
    browser_experience: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 3,
      maxDuration: '45s',
      exec: 'browserExperienceTest',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    // UI Experience Thresholds
    browser_web_vital_fcp: ['p(95)<3000'], // First Contentful Paint < 3s under load
    browser_web_vital_lcp: ['p(95)<4500'], // Largest Contentful Paint < 4.5s under load
    browser_web_vital_ttfb: ['p(95)<2500'], // Time to First Byte < 2.5s under load
    // API Thresholds
    http_req_failed: ['rate<0.05'],
  },
};

const API_BASE = __ENV.API_BASE || 'http://localhost:5000';
const WEB_BASE = __ENV.WEB_BASE || 'http://localhost:3000';

/**
 * Scenario 1: Continuous API Traffic
 */
export function apiTrafficGenerator() {
  const headers = {
    'Content-Type': 'application/json',
    'x-guest-id': `guest_ui_stress_${__VU}_${Math.random().toString(36).substring(2, 8)}`,
  };

  // Hit catalog & search rapidly
  http.get(`${API_BASE}/api/products?page=1&limit=12`, { headers });
  http.get(`${API_BASE}/api/categories`, { headers });
  http.get(`${API_BASE}/api/settings`, { headers });

  sleep(0.5);
}

/**
 * Scenario 2: Real User Browser Navigation & Core Web Vitals
 */
export async function browserExperienceTest() {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  try {
    console.log(`[Chrome UI] Loading ${WEB_BASE} while 100 users are hitting backend...`);
    const homeRes = await page.goto(WEB_BASE, { waitUntil: 'networkidle' });

    check(homeRes, {
      'Homepage loads 200 OK under load': (r) => r.status() === 200,
    });

    const nav = await page.waitForSelector('nav');
    check(nav, {
      'Navbar rendered under load': (n) => n !== null,
    });

    const images = await page.$$('img');
    check(images, {
      'Catalog visual images rendered': (imgs) => imgs.length > 0,
    });

    console.log(`[Chrome UI] Homepage rendered smoothly! Found ${images.length} images.`);

    // Simulate clicking or navigating to Products catalog
    await page.goto(`${WEB_BASE}/products`, { waitUntil: 'networkidle' });
    const productGrid = await page.waitForSelector('main');
    check(productGrid, {
      'Products catalog page rendered under load': (p) => p !== null,
    });

    console.log(`[Chrome UI] Products catalog rendered under heavy load.`);
    sleep(1);
  } finally {
    await page.close();
  }
}

