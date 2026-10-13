import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    single_ip_burst: {
      executor: 'per-vu-iterations',
      vus: 1, // Single client / IP
      iterations: 20,
      maxDuration: '30s',
    },
  },
  thresholds: {
    // We expect 429 responses after rate limit is exceeded
    checks: ['rate>0.70'], // At least 70% of requests should correctly trigger checks
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const payload = JSON.stringify({
    customerName: 'Rate Limit Attacker',
    customerPhone: '+2348099999999',
    deliveryCity: 'Lagos',
    deliveryState: 'Lagos',
    deliveryAddress: 'Abuse Street',
    items: [
      {
        variantId: '00000000-0000-0000-0000-000000000001',
        quantity: 1,
        expectedPriceNgn: 10000,
      },
    ],
    clientExpectedTotalNgn: 10000,
  });

  const res = http.post(`${BASE_URL}/api/orders`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '198.51.100.99', // Fixed test IP to trigger single-IP throttling
    },
  });

  // Verify that the server either rejects or rate limits (429)
  check(res, {
    'received rate limit 429 or validation error': (r) => r.status === 429 || r.status === 422 || r.status === 409 || r.status === 400,
  });
}
