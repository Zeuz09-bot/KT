import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    orders_rate: {
      executor: 'constant-arrival-rate',
      rate: 20, // 20 orders/min as specified in Blueprint §13.3
      timeUnit: '1m',
      duration: '2m',
      preAllocatedVUs: 10,
      maxVUs: 30,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1200'], // P95 < 1200ms
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_VARIANT_ID = __ENV.TEST_VARIANT_ID || '00000000-0000-0000-0000-000000000001';

export default function () {
  const payload = JSON.stringify({
    customerName: 'K6 Load Tester',
    customerPhone: '+2348012345678',
    deliveryCity: 'Lagos',
    deliveryState: 'Lagos',
    deliveryAddress: '12 Admiralty Way, Lekki Phase 1',
    items: [
      {
        variantId: TEST_VARIANT_ID,
        quantity: 1,
        expectedPriceNgn: 450000,
      },
    ],
    clientExpectedTotalNgn: 450000,
  });

  const res = http.post(`${BASE_URL}/api/orders`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-load-test/1.0',
    },
  });

  check(res, {
    'status is 200 or 409 or 422': (r) => [200, 409, 422].includes(r.status),
  });
}
