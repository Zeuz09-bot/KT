/**
 * U12 — Public Order Tracking Logic & Projection Tests
 * Tests timeline state progression, minimal privacy projection, and constant-shape failure responses.
 * Blueprint §8.4, §10.3 U12, §12.3
 */
import { describe, it, expect } from 'vitest';
import {
  buildTrackingTimeline,
  buildTrackProjection,
} from '../../modules/orders/track';
import type { OrderStatus } from '../../lib/constants';

describe('Public Order Tracking Logic (U12)', () => {
  const baseTimestamps = {
    createdAt: '2026-10-06T10:00:00Z',
    confirmedAt: '2026-10-06T11:00:00Z',
    paymentConfirmedAt: '2026-10-06T12:00:00Z',
    shippedAt: '2026-10-06T14:00:00Z',
    deliveredAt: null,
  };

  describe('buildTrackingTimeline', () => {
    it('sets past steps to "done", active step to "current", and future steps to "upcoming"', () => {
      const timeline = buildTrackingTimeline('shipped', 'delivery', baseTimestamps);

      expect(timeline).toHaveLength(6);

      const newStep = timeline.find((s) => s.key === 'new');
      expect(newStep?.state).toBe('done');
      expect(newStep?.label).toBe('Order received');

      const confirmedStep = timeline.find((s) => s.key === 'confirmed');
      expect(confirmedStep?.state).toBe('done');
      expect(confirmedStep?.label).toBe('Confirmed, awaiting payment');

      const paidStep = timeline.find((s) => s.key === 'paid');
      expect(paidStep?.state).toBe('done');

      const processingStep = timeline.find((s) => s.key === 'processing');
      expect(processingStep?.state).toBe('done');

      const shippedStep = timeline.find((s) => s.key === 'shipped');
      expect(shippedStep?.state).toBe('current');
      expect(shippedStep?.label).toBe('On the way');

      const deliveredStep = timeline.find((s) => s.key === 'delivered');
      expect(deliveredStep?.state).toBe('upcoming');
      expect(deliveredStep?.label).toBe('Delivered');
    });

    it('adapts labels appropriately for store pickup', () => {
      const timeline = buildTrackingTimeline('shipped', 'pickup', baseTimestamps);

      const shippedStep = timeline.find((s) => s.key === 'shipped');
      expect(shippedStep?.label).toBe('Ready for pickup');

      const deliveredStep = timeline.find((s) => s.key === 'delivered');
      expect(deliveredStep?.label).toBe('Picked up');
    });

    it('handles cancelled orders with a clear cancelled step', () => {
      const cancelledTimestamps = {
        createdAt: '2026-10-06T10:00:00Z',
        cancelledAt: '2026-10-06T15:00:00Z',
      };

      const timeline = buildTrackingTimeline('cancelled', 'delivery', cancelledTimestamps);
      expect(timeline).toHaveLength(2);
      expect(timeline[0].key).toBe('new');
      expect(timeline[0].state).toBe('done');
      expect(timeline[1].key).toBe('cancelled');
      expect(timeline[1].state).toBe('current');
      expect(timeline[1].label).toBe('Order cancelled');
    });
  });

  describe('buildTrackProjection (Minimal Public Privacy)', () => {
    it('produces public projection containing only allowed fields and no private customer data', () => {
      const projection = buildTrackProjection({
        publicId: 'KRN-261006-7F3KQ',
        status: 'shipped',
        fulfilment: 'delivery',
        createdAt: '2026-10-06T10:00:00Z',
        totalNgn: 1650000,
        deliveryCity: 'Ibadan',
        deliveryState: 'Oyo',
        items: [
          {
            product_name: 'iPhone 15 Pro Max',
            variant_label: '256GB · Natural Titanium · Brand New',
            qty: 1,
            unit_price_ngn: 1650000,
            line_total_ngn: 1650000,
          },
        ],
        timestamps: baseTimestamps,
        courierName: 'GIG Logistics',
        trackingNumber: 'GIG-998124',
        customerVisibleEvents: [
          { note: 'Rider assigned to waybill.', created_at: '2026-10-06T14:05:00Z' },
        ],
      });

      // Verify allowed fields
      expect(projection.publicId).toBe('KRN-261006-7F3KQ');
      expect(projection.status).toBe('shipped');
      expect(projection.fulfilment).toBe('delivery');
      expect(projection.deliveryCity).toBe('Ibadan');
      expect(projection.deliveryState).toBe('Oyo');
      expect(projection.totalNgn).toBe(1650000);
      expect(projection.courier?.name).toBe('GIG Logistics');
      expect(projection.courier?.trackingNumber).toBe('GIG-998124');
      expect(projection.latestNote).toBe('Rider assigned to waybill.');
      expect(projection.items).toHaveLength(1);

      // Verify privacy guarantees: no customer phone, no street address, no internal notes, no IMEI
      const keys = Object.keys(projection);
      expect(keys).not.toContain('customerPhone');
      expect(keys).not.toContain('deliveryAddress');
      expect(keys).not.toContain('internalNote');
      expect(keys).not.toContain('imei');
      expect(keys).not.toContain('paymentReference');
      expect(keys).not.toContain('paymentConfirmedBy');
    });

    it('extracts the latest customer-visible note when multiple exist', () => {
      const projection = buildTrackProjection({
        publicId: 'KRN-261006-7F3KQ',
        status: 'processing',
        fulfilment: 'delivery',
        createdAt: '2026-10-06T10:00:00Z',
        totalNgn: 500000,
        deliveryCity: 'Akure',
        deliveryState: 'Ondo',
        items: [],
        timestamps: baseTimestamps,
        customerVisibleEvents: [
          { note: 'Payment verified.', created_at: '2026-10-06T11:00:00Z' },
          { note: 'Device tested and passed QC.', created_at: '2026-10-06T12:00:00Z' },
        ],
      });

      expect(projection.latestNote).toBe('Device tested and passed QC.');
    });

    it('sets courier to null when no courier details are present', () => {
      const projection = buildTrackProjection({
        publicId: 'KRN-261006-7F3KQ',
        status: 'new',
        fulfilment: 'pickup',
        createdAt: '2026-10-06T10:00:00Z',
        totalNgn: 250000,
        deliveryCity: null,
        deliveryState: null,
        items: [],
        timestamps: { createdAt: '2026-10-06T10:00:00Z' },
      });

      expect(projection.courier).toBeNull();
      expect(projection.latestNote).toBeNull();
    });
  });
});
