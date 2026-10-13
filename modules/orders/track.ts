/**
 * Public Order Tracking Projection & Timeline Builder (U12)
 * Pure, tested logic for constructing customer-facing tracking views.
 * Blueprint §8.4, §5.4, §10.3 U12
 */
import type { OrderStatus, FulfilmentType } from '@/lib/constants';
import type {
  TrackOrderResponseData,
  TrackTimelineStep,
  TimelineStepState,
  TrackItemSnapshot,
} from '@/lib/contracts/track';

export interface OrderTimestamps {
  createdAt: string;
  confirmedAt?: string | null;
  paymentConfirmedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
}

const ORDER_PROGRESSION: OrderStatus[] = [
  'new',
  'confirmed',
  'paid',
  'processing',
  'shipped',
  'delivered',
];

export function buildTrackingTimeline(
  currentStatus: OrderStatus,
  fulfilment: FulfilmentType,
  timestamps: OrderTimestamps,
): TrackTimelineStep[] {
  const isPickup = fulfilment === 'pickup';

  const labels: Record<OrderStatus, string> = {
    new: 'Order received',
    confirmed: 'Confirmed, awaiting payment',
    paid: 'Payment received',
    processing: 'Preparing your order',
    shipped: isPickup ? 'Ready for pickup' : 'On the way',
    delivered: isPickup ? 'Picked up' : 'Delivered',
    cancelled: 'Order cancelled',
  };

  const timestampMap: Partial<Record<OrderStatus, string | null | undefined>> = {
    new: timestamps.createdAt,
    confirmed: timestamps.confirmedAt,
    paid: timestamps.paymentConfirmedAt,
    processing: timestamps.paymentConfirmedAt ?? timestamps.confirmedAt,
    shipped: timestamps.shippedAt,
    delivered: timestamps.deliveredAt,
    cancelled: timestamps.cancelledAt,
  };

  if (currentStatus === 'cancelled') {
    // Show new -> cancelled or up to cancelled
    return [
      {
        key: 'new',
        label: labels.new,
        at: timestamps.createdAt,
        state: 'done',
      },
      {
        key: 'cancelled',
        label: labels.cancelled,
        at: timestamps.cancelledAt ?? null,
        state: 'current',
      },
    ];
  }

  const currentIndex = ORDER_PROGRESSION.indexOf(currentStatus);

  return ORDER_PROGRESSION.map((status, index) => {
    let state: TimelineStepState = 'upcoming';
    if (index < currentIndex) {
      state = 'done';
    } else if (index === currentIndex) {
      state = 'current';
    }

    return {
      key: status,
      label: labels[status],
      at: (timestampMap[status] ?? null) as string | null,
      state,
    };
  });
}

export function buildTrackProjection(params: {
  publicId: string;
  status: OrderStatus;
  fulfilment: FulfilmentType;
  createdAt: string;
  totalNgn: number;
  deliveryCity: string | null;
  deliveryState: string | null;
  items: Array<{
    product_name: string;
    variant_label: string;
    qty: number;
    unit_price_ngn: number;
    line_total_ngn: number;
  }>;
  timestamps: OrderTimestamps;
  courierName?: string | null;
  trackingNumber?: string | null;
  customerVisibleEvents?: Array<{
    note: string | null;
    created_at: string;
  }>;
}): TrackOrderResponseData {
  const timeline = buildTrackingTimeline(params.status, params.fulfilment, params.timestamps);

  const items: TrackItemSnapshot[] = params.items.map((i) => ({
    name: i.product_name,
    label: i.variant_label,
    qty: i.qty,
    unitPriceNgn: i.unit_price_ngn,
    lineTotalNgn: i.line_total_ngn,
  }));

  // Find latest non-empty customer-visible note
  let latestNote: string | null = null;
  if (params.customerVisibleEvents && params.customerVisibleEvents.length > 0) {
    const reversed = [...params.customerVisibleEvents].reverse();
    const found = reversed.find((e) => e.note && e.note.trim().length > 0);
    if (found && found.note) {
      latestNote = found.note.trim();
    }
  }

  const courier =
    params.courierName || params.trackingNumber
      ? {
          name: params.courierName ?? null,
          trackingNumber: params.trackingNumber ?? null,
        }
      : null;

  return {
    publicId: params.publicId,
    status: params.status,
    fulfilment: params.fulfilment,
    createdAt: params.createdAt,
    timeline,
    items,
    totalNgn: params.totalNgn,
    deliveryCity: params.deliveryCity,
    deliveryState: params.deliveryState,
    courier,
    latestNote,
  };
}
