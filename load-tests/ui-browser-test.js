import { browser } from 'k6/browser';
import { check } from 'k6';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      iterations: 1,
      vus: 1,
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    browser_web_vital_fcp: ['p(95)<3000'],
    browser_web_vital_lcp: ['p(95)<4000'],
    browser_web_vital_ttfb: ['p(95)<2000'],
  },
};

export default async function () {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  try {
    const res = await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    check(res, {
      'Frontend returned 200': (r) => r.status() === 200,
    });

    const nav = await page.waitForSelector('nav');
    check(nav, {
      'Navbar is rendered and visible in Chrome': (n) => n !== null,
    });

    const images = await page.$$('img');
    check(images, {
      'Catalog images loaded in Chrome': (imgs) => imgs.length > 0,
    });

    console.log(`[UI-TEST] Visited homepage successfully. Found ${images.length} rendered images on screen.`);
  } finally {
    await page.close();
  }
}
