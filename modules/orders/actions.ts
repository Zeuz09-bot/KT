'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, requireOwner } from '@/modules/auth/guards';
import { writeAuditLog } from '@/modules/security/audit';
import { ok, err, type ApiResponse, type ErrorCode } from '@/lib/result';
import {
  TransitionPayloadSchema,
  AddNoteSchema,
  SetDeliveryFeeSchema,
  AdjustItemPriceSchema,
  ExportCsvSchema,
} from '@/lib/contracts/admin-orders';
import { transitionOrder, setDeliveryFee, adjustOrderItemPrice } from './repo';
import { addOrderNote, exportOrdersCsv } from './admin-repo';
import { canTransition } from './transition';
import type { OrderStatus } from '@/lib/constants';

interface RpcResultResponse {
  ok: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Transition order status via the Postgres RPC with role guards & audit trail.
 */
export async function transitionOrderAction(
  orderId: string,
  rawPayload: unknown,
): Promise<ApiResponse<{ orderId: string; status: OrderStatus }>> {
  try {
    const { user, profile } = await requireAdmin();
    const supabase = await createClient();
    const admin = createAdminClient();

    const parsed = TransitionPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return err('VALIDATION_FAILED', 'Invalid transition payload', {
        errors: parsed.error.format(),
      });
    }

    const payload = parsed.data;

    // Get current order status to enforce transition state machine
    const { data: currentOrder, error: fetchErr } = await supabase
      .from('orders')
      .select('status, total_ngn')
      .eq('id', orderId)
      .single();

    if (fetchErr || !currentOrder) {
      return err('NOT_FOUND', 'Order not found');
    }

    const fromStatus = currentOrder.status as OrderStatus;
    const toStatus = payload.toStatus as OrderStatus;

    if (!canTransition(fromStatus, toStatus, profile.role)) {
      return err(
        'FORBIDDEN',
        `Transition from ${fromStatus} to ${toStatus} is not permitted for your role (${profile.role}).`,
      );
    }

    // Call database transition_order RPC
    const rpcPayload: Record<string, unknown> = {};
    if ('reason' in payload && payload.reason) {
      rpcPayload.reason = payload.reason;
    }
    if ('note' in payload && payload.note) {
      rpcPayload.note = payload.note;
    }

    const res = await transitionOrder(supabase, orderId, toStatus, rpcPayload);
    if (!res.ok) {
      return err(
        (res.error?.code as ErrorCode) || 'INTERNAL',
        res.error?.message || 'Transition failed',
      );
    }

    // Update status-specific metadata if needed
    if (toStatus === 'paid' && 'paymentAmount' in payload) {
      await admin
        .from('orders')
        .update({
          payment_confirmed_at: new Date().toISOString(),
          payment_confirmed_by: user.id,
          payment_amount_ngn: payload.paymentAmount,
          payment_reference: payload.paymentReference ?? null,
        })
        .eq('id', orderId);
    } else if (toStatus === 'shipped' && 'courierName' in payload) {
      const updateData: Record<string, unknown> = {
        courier_name: payload.courierName ?? null,
        tracking_number: payload.trackingNumber ?? null,
      };
      await admin.from('orders').update(updateData).eq('id', orderId);

      // If IMEI was provided, assign it to the order's first item if not already set
      if (payload.imei) {
        const { data: firstItem } = await admin
          .from('order_items')
          .select('id')
          .eq('order_id', orderId)
          .limit(1)
          .maybeSingle();

        if (firstItem) {
          await admin
            .from('order_items')
            .update({ imei: payload.imei })
            .eq('id', firstItem.id);
        }
      }
    }

    // Record audit log
    await writeAuditLog({
      actorId: user.id,
      action: 'order.transition',
      entity: 'orders',
      entityId: orderId,
      before: { status: fromStatus },
      after: { status: toStatus, payload },
    });

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/dashboard');

    return ok({ orderId, status: toStatus });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to transition order';
    return err('INTERNAL', message);
  }
}

/**
 * Add a note to the order's timeline.
 */
export async function addNoteAction(
  orderId: string,
  note: string,
  isCustomerVisible: boolean,
): Promise<ApiResponse<{ success: true }>> {
  try {
    const { user } = await requireAdmin();
    const admin = createAdminClient();

    const parsed = AddNoteSchema.safeParse({ orderId, note, isCustomerVisible });
    if (!parsed.success) {
      return err('VALIDATION_FAILED', 'Invalid note content');
    }

    await addOrderNote(admin, orderId, parsed.data.note, user.id, isCustomerVisible);

    await writeAuditLog({
      actorId: user.id,
      action: 'order.note_added',
      entity: 'orders',
      entityId: orderId,
      after: { note: parsed.data.note, isCustomerVisible },
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return ok({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add note';
    return err('INTERNAL', message);
  }
}

/**
 * Set the delivery fee for an order.
 */
export async function setDeliveryFeeAction(
  orderId: string,
  feeNgn: number,
): Promise<ApiResponse<{ orderId: string; feeNgn: number }>> {
  try {
    const { user } = await requireAdmin();
    const supabase = await createClient();

    const parsed = SetDeliveryFeeSchema.safeParse({ orderId, feeNgn });
    if (!parsed.success) {
      return err('VALIDATION_FAILED', 'Invalid delivery fee');
    }

    const res = await setDeliveryFee(supabase, orderId, parsed.data.feeNgn);
    const rpcRes = res as unknown as RpcResultResponse;
    if (!rpcRes?.ok) {
      return err((rpcRes?.error?.code as ErrorCode) || 'INTERNAL', rpcRes?.error?.message || 'Failed to set delivery fee');
    }

    await writeAuditLog({
      actorId: user.id,
      action: 'order.delivery_fee_set',
      entity: 'orders',
      entityId: orderId,
      after: { deliveryFeeNgn: feeNgn },
    });

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');
    return ok({ orderId, feeNgn });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to set delivery fee';
    return err('INTERNAL', message);
  }
}

/**
 * Adjust the price of an order item.
 */
export async function adjustItemPriceAction(
  itemId: string,
  newPriceNgn: number,
  reason: string,
): Promise<ApiResponse<{ success: true }>> {
  try {
    const { user } = await requireAdmin();
    const supabase = await createClient();

    const parsed = AdjustItemPriceSchema.safeParse({ itemId, newPriceNgn, reason });
    if (!parsed.success) {
      return err('VALIDATION_FAILED', 'Invalid price adjustment input');
    }

    const res = await adjustOrderItemPrice(supabase, itemId, parsed.data.newPriceNgn, parsed.data.reason);
    const rpcRes = res as unknown as RpcResultResponse;
    if (!rpcRes?.ok) {
      return err((rpcRes?.error?.code as ErrorCode) || 'INTERNAL', rpcRes?.error?.message || 'Failed to adjust price');
    }

    await writeAuditLog({
      actorId: user.id,
      action: 'order.price_adjusted',
      entity: 'order_items',
      entityId: itemId,
      after: { newPriceNgn, reason },
    });

    revalidatePath('/admin/orders');
    return ok({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to adjust price';
    return err('INTERNAL', message);
  }
}

/**
 * Export orders as CSV (STRICT: Owner only per blueprint).
 */
export async function exportOrdersCsvAction(
  dateFrom: string,
  dateTo: string,
): Promise<ApiResponse<{ csv: string }>> {
  try {
    const { user } = await requireOwner();
    const admin = createAdminClient();

    const parsed = ExportCsvSchema.safeParse({ dateFrom, dateTo });
    if (!parsed.success) {
      return err('VALIDATION_FAILED', 'Invalid date range');
    }

    const csv = await exportOrdersCsv(admin, parsed.data.dateFrom, parsed.data.dateTo);

    await writeAuditLog({
      actorId: user.id,
      action: 'orders.export_csv',
      entity: 'orders',
      after: { dateFrom, dateTo },
    });

    return ok({ csv });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to export orders CSV';
    return err('INTERNAL', message);
  }
}
