import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    constant_rate: {
      executor: 'constant-arrival-rate',
      rate: 100, // 100 req/s as specified in Blueprint §13.3
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 50,
      maxVUs: 150,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200'], // P95 < 200ms
    http_req_failed: ['rate<0.01'],    // < 1% error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const QUERIES = ['iphone', 'samsung', 'pixel', 'pro', 'ultra', '128gb', 'galaxy', 'apple'];

export default function () {
  const query = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const res = http.get(`${BASE_URL}/api/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'k6-load-test/1.0',
    },
  });

  check(res, {
    'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
}
