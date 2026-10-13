import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    track_rate: {
      executor: 'constant-arrival-rate',
      rate: 50, // 50 lookups/min as specified in Blueprint §13.3
      timeUnit: '1m',
      duration: '2m',
      preAllocatedVUs: 10,
      maxVUs: 25,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<400'], // P95 < 400ms
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const payload = JSON.stringify({
    orderId: 'KRN-261013-DEMO1',
    phone: '+2348012345678',
  });

  const res = http.post(`${BASE_URL}/api/orders/track`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-load-test/1.0',
    },
  });

  check(res, {
    'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
}
