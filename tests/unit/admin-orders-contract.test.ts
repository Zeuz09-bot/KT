/**
 * U11 — Admin Orders Contracts & Validation Tests
 * Verifies Zod schemas for order transition payloads, filters, notes, price adjustments,
 * and CSV export parameters.
 * Blueprint §8.5, §7.7
 */
import { describe, it, expect } from 'vitest';
import {
  TransitionPayloadSchema,
  OrderFilterSchema,
  AddNoteSchema,
  AdjustItemPriceSchema,
  SetDeliveryFeeSchema,
  BlockPhoneSchema,
  ExportCsvSchema,
} from '../../lib/contracts/admin-orders';

describe('Admin Orders Contracts (U11)', () => {
  describe('TransitionPayloadSchema discriminated union', () => {
    it('validates confirm payload with optional note', () => {
      const valid = { toStatus: 'confirmed', note: 'Customer called and confirmed' };
      const res = TransitionPayloadSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('validates confirm payload with no note', () => {
      const valid = { toStatus: 'confirmed' };
      const res = TransitionPayloadSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('validates paid payload requiring paymentAmount', () => {
      const valid = {
        toStatus: 'paid',
        paymentAmount: 1650000,
        paymentReference: 'OPAY-992384729',
        note: 'Verified in OPay app',
      };
      const res = TransitionPayloadSchema.safeParse(valid);
      expect(res.success).toBe(true);

      const missingAmount = {
        toStatus: 'paid',
        paymentReference: 'OPAY-992384729',
      };
      expect(TransitionPayloadSchema.safeParse(missingAmount).success).toBe(false);

      const negativeAmount = {
        toStatus: 'paid',
        paymentAmount: -5000,
      };
      expect(TransitionPayloadSchema.safeParse(negativeAmount).success).toBe(false);
    });

    it('validates shipped payload with optional courier, tracking, and IMEI', () => {
      const valid = {
        toStatus: 'shipped',
        imei: '356938035643809',
        courierName: 'GIG Logistics',
        trackingNumber: 'GIG-1234567',
        note: 'Handed to driver',
      };
      const res = TransitionPayloadSchema.safeParse(valid);
      expect(res.success).toBe(true);

      const minimal = { toStatus: 'shipped' };
      expect(TransitionPayloadSchema.safeParse(minimal).success).toBe(true);
    });

    it('validates delivered payload', () => {
      const valid = { toStatus: 'delivered', note: 'Customer signed waybill' };
      const res = TransitionPayloadSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('validates cancelled payload requiring reason', () => {
      const valid = {
        toStatus: 'cancelled',
        reason: 'Customer declined bank transfer',
      };
      const res = TransitionPayloadSchema.safeParse(valid);
      expect(res.success).toBe(true);

      const missingReason = { toStatus: 'cancelled' };
      expect(TransitionPayloadSchema.safeParse(missingReason).success).toBe(false);

      const shortReason = { toStatus: 'cancelled', reason: 'no' };
      expect(TransitionPayloadSchema.safeParse(shortReason).success).toBe(false);
    });

    it('rejects unknown toStatus', () => {
      const invalid = { toStatus: 'bogus_status' };
      expect(TransitionPayloadSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('OrderFilterSchema', () => {
    it('applies defaults for page and pageSize', () => {
      const res = OrderFilterSchema.safeParse({});
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.page).toBe(1);
        expect(res.data.pageSize).toBe(20);
      }
    });

    it('validates status filter array and search term', () => {
      const valid = {
        status: ['confirmed', 'paid'],
        search: 'Ade',
        fulfilment: 'delivery',
        page: 2,
        pageSize: 50,
      };
      const res = OrderFilterSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });
  });

  describe('AddNoteSchema', () => {
    it('validates orderId and note text', () => {
      const valid = {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        note: 'Customer requested afternoon delivery',
        isCustomerVisible: true,
      };
      expect(AddNoteSchema.safeParse(valid).success).toBe(true);

      const emptyNote = {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        note: '',
      };
      expect(AddNoteSchema.safeParse(emptyNote).success).toBe(false);
    });
  });

  describe('AdjustItemPriceSchema', () => {
    it('requires positive price and mandatory reason', () => {
      const valid = {
        itemId: '550e8400-e29b-41d4-a716-446655440000',
        newPriceNgn: 1600000,
        reason: 'Price matched WhatsApp quote',
      };
      expect(AdjustItemPriceSchema.safeParse(valid).success).toBe(true);

      const missingReason = {
        itemId: '550e8400-e29b-41d4-a716-446655440000',
        newPriceNgn: 1600000,
      };
      expect(AdjustItemPriceSchema.safeParse(missingReason).success).toBe(false);
    });
  });

  describe('SetDeliveryFeeSchema', () => {
    it('accepts non-negative integers', () => {
      const valid = {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        feeNgn: 5000,
      };
      expect(SetDeliveryFeeSchema.safeParse(valid).success).toBe(true);

      const negative = {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        feeNgn: -500,
      };
      expect(SetDeliveryFeeSchema.safeParse(negative).success).toBe(false);
    });
  });

  describe('BlockPhoneSchema', () => {
    it('validates phone and reason', () => {
      const valid = {
        phone: '+2348031234567',
        reason: 'Serial scammer placing fake orders',
      };
      expect(BlockPhoneSchema.safeParse(valid).success).toBe(true);

      const missingReason = {
        phone: '+2348031234567',
      };
      expect(BlockPhoneSchema.safeParse(missingReason).success).toBe(false);
    });
  });

  describe('ExportCsvSchema', () => {
    it('validates YYYY-MM-DD format for date range', () => {
      const valid = {
        dateFrom: '2026-10-01',
        dateTo: '2026-10-31',
      };
      expect(ExportCsvSchema.safeParse(valid).success).toBe(true);

      const invalidDate = {
        dateFrom: '01/10/2026',
        dateTo: '2026-10-31',
      };
      expect(ExportCsvSchema.safeParse(invalidDate).success).toBe(false);
    });
  });
});
