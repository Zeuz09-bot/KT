/**
 * U10 — WhatsApp Message and URL Builder Tests
 * Blueprint §9.4, §10.3
 */
import { describe, it, expect } from 'vitest';
import {
  buildOrderMessage,
  buildWaUrl,
  buildWaWebUrl,
  buildQuestionUrl,
} from '../../modules/whatsapp/builder';

describe('buildOrderMessage', () => {
  const baseOrder = {
    publicId: 'KRN-261013-ABC78',
    customerName: 'Ade Bello',
    customerPhone: '+2348031234567',
    fulfilment: 'delivery' as const,
    deliveryState: 'Oyo',
    deliveryCity: 'Ibadan',
    deliveryAddress: '12 Bodija Road',
    customerNote: 'Please call before arriving',
    items: [
      {
        productName: 'iPhone 15 Pro Max',
        variantLabel: '256GB · Natural Titanium · Brand New',
        qty: 1,
        unitPriceNgn: 1650000,
      },
    ],
    totalNgn: 1650000,
  };

  it('builds a structured order message for delivery', () => {
    const msg = buildOrderMessage(baseOrder);
    expect(msg).toContain('Hello Keraunous 👋');
    expect(msg).toContain('Order ID: KRN-261013-ABC78');
    expect(msg).toContain('1x iPhone 15 Pro Max · 256GB · Natural Titanium · Brand New: ₦1,650,000');
    expect(msg).toContain('Total: ₦1,650,000');
    expect(msg).toContain('Name: Ade Bello');
    expect(msg).toContain('Delivery: 12 Bodija Road, Ibadan, Oyo');
    expect(msg).toContain('Note: Please call before arriving');
    expect(msg).toContain('Please confirm availability and the final price. Thank you!');
  });

  it('builds a structured order message for pickup', () => {
    const pickupOrder = {
      ...baseOrder,
      fulfilment: 'pickup' as const,
      deliveryState: undefined,
      deliveryCity: undefined,
      deliveryAddress: undefined,
    };
    const msg = buildOrderMessage(pickupOrder);
    expect(msg).toContain('Fulfilment: In-store Pickup');
    expect(msg).not.toContain('Delivery:');
  });

  it('truncates item list to 8 lines with overflow note if more than 8 items', () => {
    const tenItemsOrder = {
      ...baseOrder,
      items: Array.from({ length: 10 }, (_, i) => ({
        productName: `Gadget ${i + 1}`,
        variantLabel: 'Standard',
        qty: 1,
        unitPriceNgn: 50000,
      })),
      totalNgn: 500000,
    };
    const msg = buildOrderMessage(tenItemsOrder);
    expect(msg).toContain('1x Gadget 1 · Standard: ₦50,000');
    expect(msg).toContain('1x Gadget 8 · Standard: ₦50,000');
    expect(msg).toContain('+ 2 more items (see order KRN-261013-ABC78)');
    expect(msg).not.toContain('Gadget 9');
  });

  it('guards message length under 1800 characters by trimming long notes first', () => {
    const longNoteOrder = {
      ...baseOrder,
      customerNote: 'Important delivery instructions '.repeat(50), // very long note
    };
    const msg = buildOrderMessage(longNoteOrder);
    expect(msg.length).toBeLessThanOrEqual(1800);
    expect(msg).toContain('Order ID: KRN-261013-ABC78');
    expect(msg).toContain('Total: ₦1,650,000');
  });
});

describe('buildWaUrl & buildWaWebUrl', () => {
  it('formats wa.me link with digits only (no +, no leading 0)', () => {
    const url = buildWaUrl('+2348070822409', 'Hello Store');
    expect(url.startsWith('https://wa.me/2348070822409?text=Hello%20Store')).toBe(true);
  });

  it('formats WhatsApp Web URL for desktop fallback', () => {
    const url = buildWaWebUrl('+2348070822409', 'Hello Store');
    expect(url.startsWith('https://web.whatsapp.com/send?phone=2348070822409&text=Hello%20Store')).toBe(true);
  });

  it('formats product inquiry question URL', () => {
    const url = buildQuestionUrl('+2348070822409', 'iPhone 16 Pro', 'https://keraunous.ng/product/iphone-16-pro');
    expect(url).toContain('https://wa.me/2348070822409?text=');
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain("Hi, I'm interested in iPhone 16 Pro");
    expect(decoded).toContain('https://keraunous.ng/product/iphone-16-pro');
  });
});
