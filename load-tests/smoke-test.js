import http from 'k6/http';
import { check, sleep } from 'k6';

// Smoke test: 5 users for 20 seconds to confirm everything works before scaling up
export const options = {
  vus: 5,
  duration: '20s',
  thresholds: {
    http_req_failed: ['rate<0.01'], // less than 1% failure
    http_req_duration: ['p(95)<800'], // 95% of requests under 800ms (accounting for initial cold queries)
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'x-guest-id': `smoke-user-${__VU}`,
  };

  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'Health check passes (200)': (r) => r.status === 200,
  });

  // 2. Fetch public products
  const productsRes = http.get(`${BASE_URL}/api/products?page=1&limit=10`, { headers });
  check(productsRes, {
    'Products list returns 200': (r) => r.status === 200,
  });

  sleep(1);
}

