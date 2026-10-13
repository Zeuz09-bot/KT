/**
 * Keraunous Tech Store — Public Order Tracking Contracts (U12)
 *
 * Schemas and DTOs for public order tracking via POST /api/track and /track page.
 * Blueprint §8.4, §5.4, §10.3 U12
 */
import { z } from 'zod';
import type { OrderStatus, FulfilmentType } from '@/lib/constants';
import { ngPhoneSchema } from './orders';

export const publicOrderIdSchema = z
  .string()
  .trim()
  .transform((val) => val.toUpperCase())
  .refine(
    (val) => /^KRN-[0-9]{6}-[A-Z0-9]{5}$/.test(val),
    { message: 'Invalid Order ID format. Expected format: KRN-YYMMDD-XXXXX (e.g. KRN-261006-7F3KQ)' },
  );

export const TrackOrderRequestSchema = z.object({
  publicId: publicOrderIdSchema,
  phone: ngPhoneSchema,
  turnstileToken: z.string().optional(),
});

export type TrackOrderRequest = z.infer<typeof TrackOrderRequestSchema>;

export type TimelineStepState = 'done' | 'current' | 'upcoming';

export interface TrackTimelineStep {
  key: OrderStatus;
  label: string;
  at: string | null;
  state: TimelineStepState;
}

export interface TrackItemSnapshot {
  name: string;
  label: string;
  qty: number;
  unitPriceNgn: number;
  lineTotalNgn: number;
}

export interface TrackCourierInfo {
  name: string | null;
  trackingNumber: string | null;
}

export interface TrackOrderResponseData {
  publicId: string;
  status: OrderStatus;
  fulfilment: FulfilmentType;
  createdAt: string;
  timeline: TrackTimelineStep[];
  items: TrackItemSnapshot[];
  totalNgn: number;
  deliveryCity: string | null;
  deliveryState: string | null;
  courier: TrackCourierInfo | null;
  latestNote: string | null;
}
