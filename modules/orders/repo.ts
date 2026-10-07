/**
 * Orders Data Repository
 * Wraps database functions for order placement, tracking, state transitions, and price adjustments.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, OrderStatus, FulfilmentType } from '@/lib/database.types';

export interface CreateOrderItemInput {
  variant_id: string;
  qty: number;
}

export interface CreateOrderPayload {
  idempotency_key: string;
  customer_name: string;
  customer_phone: string;
  fulfilment: FulfilmentType;
  delivery_state?: string;
  delivery_city?: string;
  delivery_address?: string;
  customer_note?: string;
  expected_total: number;
  items: CreateOrderItemInput[];
  utm?: Record<string, string>;
  ip_hash?: string;
}

export interface OrderTrackResult {
  public_id: string;
  status: OrderStatus;
  fulfilment: FulfilmentType;
  delivery_city: string | null;
  delivery_state: string | null;
  total_ngn: number;
  created_at: string;
  items: {
    product_name: string;
    variant_label: string;
    qty: number;
    unit_price_ngn: number;
    line_total_ngn: number;
  }[];
  timeline: {
    type: string;
    to_status: OrderStatus | null;
    note: string | null;
    created_at: string;
  }[];
}

export async function createOrder(
  adminSupabase: SupabaseClient<Database>,
  payload: CreateOrderPayload,
) {
  const { data, error } = await adminSupabase.rpc('create_order', {
    payload: payload as unknown as Database['public']['Tables']['orders']['Insert'],
  });

  if (error) throw error;
  return data as {
    ok: boolean;
    data?: {
      order_id: string;
      public_id: string;
      status: OrderStatus;
      total_ngn: number;
      idempotent?: boolean;
    };
    error?: {
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };
  };
}

export async function trackOrder(
  adminSupabase: SupabaseClient<Database>,
  publicId: string,
  phone: string,
): Promise<OrderTrackResult | null> {
  const { data, error } = await adminSupabase.rpc('track_order', {
    p_public_id: publicId,
    p_phone: phone,
  });

  if (error) throw error;
  return (data as unknown as OrderTrackResult) ?? null;
}

export async function transitionOrder(
  supabase: SupabaseClient<Database>,
  orderId: string,
  toStatus: OrderStatus,
  payload: { note?: string; reason?: string } = {},
) {
  const { data, error } = await supabase.rpc('transition_order', {
    p_order_id: orderId,
    p_to_status: toStatus,
    p_payload: payload,
  });

  if (error) throw error;
  return data as {
    ok: boolean;
    data?: { order_id: string; status: OrderStatus };
    error?: { code: string; message: string };
  };
}

export async function adjustOrderItemPrice(
  supabase: SupabaseClient<Database>,
  itemId: string,
  newPrice: number,
  reason: string,
) {
  const { data, error } = await supabase.rpc('adjust_order_item_price', {
    p_item_id: itemId,
    p_new_price: newPrice,
    p_reason: reason,
  });

  if (error) throw error;
  return data;
}

export async function setDeliveryFee(
  supabase: SupabaseClient<Database>,
  orderId: string,
  fee: number,
) {
  const { data, error } = await supabase.rpc('set_delivery_fee', {
    p_order_id: orderId,
    p_fee: fee,
  });

  if (error) throw error;
  return data;
}

export async function markWhatsAppOpened(
  adminSupabase: SupabaseClient<Database>,
  publicId: string,
  tokenOk: boolean,
) {
  const { data, error } = await adminSupabase.rpc('mark_whatsapp_opened', {
    p_public_id: publicId,
    p_token_ok: tokenOk,
  });

  if (error) throw error;
  return data;
}
