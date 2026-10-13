import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 300 }, // Peak 300 VUs as specified in Blueprint §13.3
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'], // P95 < 800ms
    http_req_failed: ['rate<0.01'],    // < 1% error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const pages = ['/', '/catalog', '/track'];
  const target = pages[Math.floor(Math.random() * pages.length)];

  const res = http.get(`${BASE_URL}${target}`, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml',
      'User-Agent': 'k6-load-test/1.0',
    },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'body has content': (r) => r.body && r.body.length > 500,
  });

  sleep(Math.random() * 2 + 1); // 1-3s user think time
}
