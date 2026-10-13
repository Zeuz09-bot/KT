/**
 * Keraunous Tech Store — Admin Order Contracts (U11)
 * Zod schemas and TypeScript types for admin order operations.
 * Blueprint §8.5, §5.6, §7.7
 */
import { z } from 'zod';
import type { OrderStatus, FulfilmentType } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Transition payload schemas — one per target status
// ---------------------------------------------------------------------------

/** new → confirmed: deduct stock */
export const ConfirmPayloadSchema = z.object({
  toStatus: z.literal('confirmed'),
  note: z.string().max(300).optional(),
});

/** new → cancelled */
export const CancelFromNewPayloadSchema = z.object({
  toStatus: z.literal('cancelled'),
  reason: z.string().min(3, 'Cancellation reason required').max(300),
});

/** confirmed → paid */
export const PaidPayloadSchema = z.object({
  toStatus: z.literal('paid'),
  paymentAmount: z.number().int().positive('Payment amount required'),
  paymentReference: z.string().max(100).optional(),
  overrideReason: z.string().max(300).optional(),
  note: z.string().max(300).optional(),
});

/** confirmed → cancelled */
export const CancelFromConfirmedPayloadSchema = z.object({
  toStatus: z.literal('cancelled'),
  reason: z.string().min(3, 'Cancellation reason required').max(300),
});

/** paid → processing */
export const ProcessingPayloadSchema = z.object({
  toStatus: z.literal('processing'),
  note: z.string().max(300).optional(),
});

/** paid → cancelled (owner only) */
export const CancelFromPaidPayloadSchema = z.object({
  toStatus: z.literal('cancelled'),
  reason: z.string().min(3, 'Cancellation reason required').max(300),
});

/** processing → shipped */
export const ShippedPayloadSchema = z.object({
  toStatus: z.literal('shipped'),
  /** IMEI is always optional per U11 decision */
  imei: z.string().max(20).optional(),
  courierName: z.string().max(100).optional(),
  trackingNumber: z.string().max(100).optional(),
  note: z.string().max(300).optional(),
});

/** processing → cancelled (owner only) */
export const CancelFromProcessingPayloadSchema = z.object({
  toStatus: z.literal('cancelled'),
  reason: z.string().min(3).max(300),
});

/** shipped → delivered */
export const DeliveredPayloadSchema = z.object({
  toStatus: z.literal('delivered'),
  note: z.string().max(300).optional(),
});

/** Universal cancel payload (runtime discriminated by calling code) */
export const CancelPayloadSchema = z.object({
  toStatus: z.literal('cancelled'),
  reason: z.string().min(3, 'Cancellation reason required').max(300),
});

/** Transition payload — discriminated by toStatus */
export const TransitionPayloadSchema = z.discriminatedUnion('toStatus', [
  ConfirmPayloadSchema,
  PaidPayloadSchema,
  ProcessingPayloadSchema,
  ShippedPayloadSchema,
  DeliveredPayloadSchema,
  CancelPayloadSchema,
]);

export type TransitionPayload = z.infer<typeof TransitionPayloadSchema>;

// ---------------------------------------------------------------------------
// Order filter schema
// ---------------------------------------------------------------------------

export const OrderFilterSchema = z.object({
  status: z.array(z.enum(['new', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'])).optional(),
  dateFrom: z.string().optional(), // ISO date string
  dateTo: z.string().optional(),
  fulfilment: z.enum(['delivery', 'pickup']).optional(),
  search: z.string().max(100).optional(), // public_id, name, or phone fragment
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type OrderFilter = z.infer<typeof OrderFilterSchema>;

// ---------------------------------------------------------------------------
// Admin-facing DTOs (returned by admin-repo queries)
// ---------------------------------------------------------------------------

export interface AdminOrderListItem {
  id: string;
  publicId: string;
  customerName: string;
  customerPhone: string; // masked at UI layer only
  status: OrderStatus;
  fulfilment: FulfilmentType;
  totalNgn: number;
  itemCount: number;
  createdAt: string;
  confirmedAt: string | null;
  whatsappOpenedAt: string | null;
  /** Dashboard alert badges */
  alerts: {
    notContacted: boolean;    // whatsapp_opened_at is null
    holdExpiring: boolean;    // confirmed > (hold_hours - 2) without payment
    awaitingPayment: boolean; // status = confirmed
    toShip: boolean;          // status = paid or processing
  };
}

export interface AdminOrderItem {
  id: string;
  variantId: string | null;
  productName: string;
  variantLabel: string;
  sku: string;
  listedPriceNgn: number;
  unitPriceNgn: number;
  qty: number;
  lineTotalNgn: number;
  imei: string | null;
  stockDeducted: boolean;
}

export interface AdminOrderEvent {
  id: number;
  type: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
  actorId: string | null;
  actorName: string | null;
  note: string | null;
  isCustomerVisible: boolean;
  createdAt: string;
}

export interface AdminOrderDetail {
  id: string;
  publicId: string;
  idempotencyKey: string;
  customerName: string;
  customerPhone: string;
  fulfilment: FulfilmentType;
  deliveryState: string | null;
  deliveryCity: string | null;
  deliveryAddress: string | null;
  customerNote: string | null;
  internalNote: string | null;
  status: OrderStatus;
  subtotalNgn: number;
  deliveryFeeNgn: number;
  discountNgn: number;
  totalNgn: number;
  paymentConfirmedAt: string | null;
  paymentAmountNgn: number | null;
  paymentReference: string | null;
  courierName: string | null;
  trackingNumber: string | null;
  whatsappOpenedAt: string | null;
  createdAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  items: AdminOrderItem[];
  events: AdminOrderEvent[];
}

export interface DashboardStats {
  newOrders: number;
  awaitingPayment: number;   // confirmed
  toShip: number;             // paid + processing
  deliveredThisWeek: number;
  expiringHolds: number;      // confirmed orders past (hold_hours - 2h)
  lowStockVariants: number;
  soldOutVariants: number;
}

// ---------------------------------------------------------------------------
// Note action schema
// ---------------------------------------------------------------------------
export const AddNoteSchema = z.object({
  orderId: z.string().uuid(),
  note: z.string().min(1).max(500),
  isCustomerVisible: z.boolean().default(false),
});

export type AddNote = z.infer<typeof AddNoteSchema>;

// ---------------------------------------------------------------------------
// Price adjustment
// ---------------------------------------------------------------------------
export const AdjustItemPriceSchema = z.object({
  itemId: z.string().uuid(),
  newPriceNgn: z.number().int().min(0),
  reason: z.string().min(3, 'Reason required').max(300),
});

export type AdjustItemPrice = z.infer<typeof AdjustItemPriceSchema>;

// ---------------------------------------------------------------------------
// Delivery fee
// ---------------------------------------------------------------------------
export const SetDeliveryFeeSchema = z.object({
  orderId: z.string().uuid(),
  feeNgn: z.number().int().min(0),
});

export type SetDeliveryFee = z.infer<typeof SetDeliveryFeeSchema>;

// ---------------------------------------------------------------------------
// Block phone
// ---------------------------------------------------------------------------
export const BlockPhoneSchema = z.object({
  phone: z.string().min(7).max(20),
  reason: z.string().min(3).max(300),
});

export type BlockPhone = z.infer<typeof BlockPhoneSchema>;

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------
export const ExportCsvSchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

export type ExportCsv = z.infer<typeof ExportCsvSchema>;
