'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, ModalContent } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { transitionOrderAction } from '@/modules/orders/actions';
import { formatNgn } from '@/lib/money';
import type { OrderStatus } from '@/lib/constants';
import type { AdminRole } from '@/modules/orders/transition';
import type { TransitionPayload } from '@/lib/contracts/admin-orders';
import { AlertTriangle, Truck, DollarSign, XCircle } from 'lucide-react';

interface OrderTransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentStatus: OrderStatus;
  targetStatus: OrderStatus;
  orderTotalNgn: number;
  userRole: AdminRole;
}

export function OrderTransitionDialog({
  open,
  onOpenChange,
  orderId,
  currentStatus,
  targetStatus,
  orderTotalNgn,
  userRole,
}: OrderTransitionDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [paymentAmount, setPaymentAmount] = useState<number>(orderTotalNgn);
  const [paymentReference, setPaymentReference] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [imei, setImei] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [note, setNote] = useState('');

  // Role validation
  const isOwnerOnlyTransition =
    (currentStatus === 'paid' && targetStatus === 'cancelled') ||
    (currentStatus === 'processing' && targetStatus === 'cancelled');
  const roleForbidden = isOwnerOnlyTransition && userRole !== 'owner';

  const titles: Record<OrderStatus, string> = {
    new: 'Reset to New',
    confirmed: 'Confirm Order & Reserve Stock',
    paid: 'Record Bank Payment',
    processing: 'Move to Processing',
    shipped: 'Dispatch Order (Shipped / Ready)',
    delivered: 'Mark Order Delivered',
    cancelled: 'Cancel Order',
  };

  const descriptions: Record<OrderStatus, string> = {
    new: 'Return this order to new status.',
    confirmed:
      'Confirming will deduct stock for all variant lines in this order and start the hold window timer.',
    paid: 'Verify that the bank transfer has credited your account in your bank app before confirming.',
    processing: 'Device is being tested and prepared for packaging.',
    shipped: 'Record courier tracking details and optional device IMEI.',
    delivered: 'Customer has received the item. This is a terminal state.',
    cancelled:
      currentStatus === 'confirmed' || currentStatus === 'paid' || currentStatus === 'processing'
        ? 'Cancelling will automatically restore deducted stock back to inventory.'
        : 'Cancelling will mark this order as closed.',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (roleForbidden) {
      toast({
        title: 'Permission Denied',
        description: 'Only the store owner can cancel a paid or processing order.',
        variant: 'error',
      });
      return;
    }

    setIsLoading(true);

    try {
      let payload: TransitionPayload;

      if (targetStatus === 'confirmed') {
        payload = { toStatus: 'confirmed', note: note.trim() || undefined };
      } else if (targetStatus === 'paid') {
        if (!paymentAmount || paymentAmount <= 0) {
          toast({
            title: 'Invalid amount',
            description: 'Payment amount must be greater than zero.',
            variant: 'error',
          });
          setIsLoading(false);
          return;
        }
        if (paymentAmount < orderTotalNgn && !overrideReason.trim()) {
          toast({
            title: 'Override reason required',
            description: 'Payment is less than order total. Please specify an override reason.',
            variant: 'error',
          });
          setIsLoading(false);
          return;
        }
        payload = {
          toStatus: 'paid',
          paymentAmount: Math.round(paymentAmount),
          paymentReference: paymentReference.trim() || undefined,
          overrideReason: overrideReason.trim() || undefined,
          note: note.trim() || undefined,
        };
      } else if (targetStatus === 'processing') {
        payload = { toStatus: 'processing', note: note.trim() || undefined };
      } else if (targetStatus === 'shipped') {
        payload = {
          toStatus: 'shipped',
          courierName: courierName.trim() || undefined,
          trackingNumber: trackingNumber.trim() || undefined,
          imei: imei.trim() || undefined,
          note: note.trim() || undefined,
        };
      } else if (targetStatus === 'delivered') {
        payload = { toStatus: 'delivered', note: note.trim() || undefined };
      } else if (targetStatus === 'cancelled') {
        if (!cancelReason.trim() || cancelReason.trim().length < 3) {
          toast({
            title: 'Cancellation reason required',
            description: 'Please enter a clear reason of at least 3 characters.',
            variant: 'error',
          });
          setIsLoading(false);
          return;
        }
        payload = { toStatus: 'cancelled', reason: cancelReason.trim() };
      } else {
        return;
      }

      const res = await transitionOrderAction(orderId, payload);
      if (!res.ok) {
        toast({
          title: 'Transition Failed',
          description: res.error.message,
          variant: 'error',
        });
        return;
      }

      toast({
        title: 'Status Updated',
        description: `Order successfully updated to ${targetStatus.toUpperCase()}`,
        variant: 'success',
      });
      onOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update order status';
      toast({
        title: 'Error',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        title={titles[targetStatus] || `Transition to ${targetStatus}`}
        description={descriptions[targetStatus]}
        widthClass="max-w-lg"
      >
        {roleForbidden ? (
          <div className="p-4 rounded-card-sm bg-red-50 border border-red-200 text-red-800 text-sm space-y-2">
            <div className="flex items-center gap-2 font-semibold text-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Owner Authorization Required
            </div>
            <p>
              Only the store owner can cancel orders that are already paid or processing. Staff members do
              not have permission to execute this refund/cancellation.
            </p>
            <div className="pt-2 flex justify-end">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* PAID FIELDS */}
            {targetStatus === 'paid' && (
              <div className="space-y-3 bg-neutral-50 p-3.5 rounded-card-sm border border-neutral-200">
                <div className="text-xs font-semibold text-neutral-700 uppercase tracking-wide flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Bank Credit Verification
                </div>
                <div>
                  <label htmlFor="field-payment-amount" className="block text-xs font-medium text-neutral-700 mb-1">
                    Amount Received in Bank App (₦) *
                  </label>
                  <Input
                    id="field-payment-amount"
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    min={0}
                    step={1}
                    required
                    className="font-mono text-sm"
                  />
                  <span className="text-[11px] text-neutral-500 mt-0.5 block">
                    Expected total: {formatNgn(orderTotalNgn)}
                  </span>
                </div>

                {paymentAmount < orderTotalNgn && (
                  <div>
                    <label htmlFor="field-override-reason" className="block text-xs font-medium text-amber-800 mb-1">
                      Override Reason (Received less than total) *
                    </label>
                    <Input
                      id="field-override-reason"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. Discount approved by owner, customer agreed fee waived"
                      className="border-amber-300 text-xs"
                      required
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="field-payment-ref" className="block text-xs font-medium text-neutral-700 mb-1">
                    Bank Reference / Session ID (Optional)
                  </label>
                  <Input
                    id="field-payment-ref"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. OPAY-TXN-90234812"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {/* SHIPPED FIELDS */}
            {targetStatus === 'shipped' && (
              <div className="space-y-3 bg-neutral-50 p-3.5 rounded-card-sm border border-neutral-200">
                <div className="text-xs font-semibold text-neutral-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-brand-blue" />
                  Dispatch &amp; Device Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="field-courier-name" className="block text-xs font-medium text-neutral-700 mb-1">
                      Courier / Service Name
                    </label>
                    <Input
                      id="field-courier-name"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="e.g. GIG Logistics, DHL, Local Rider"
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="field-tracking-number" className="block text-xs font-medium text-neutral-700 mb-1">
                      Tracking / Waybill Number
                    </label>
                    <Input
                      id="field-tracking-number"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. GIG-998234-NG"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="field-imei" className="block text-xs font-medium text-neutral-700 mb-1">
                    Device IMEI (Optional)
                  </label>
                  <Input
                    id="field-imei"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    placeholder="e.g. 356938035643809 (15 digits)"
                    className="font-mono text-xs"
                  />
                  <span className="text-[11px] text-neutral-500 mt-0.5 block">
                    Recorded for warranty tracking and proof of fulfillment.
                  </span>
                </div>
              </div>
            )}

            {/* CANCELLED FIELDS */}
            {targetStatus === 'cancelled' && (
              <div className="space-y-2 bg-red-50/50 p-3.5 rounded-card-sm border border-red-200">
                <div className="text-xs font-semibold text-red-900 uppercase tracking-wide flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Cancellation Reason Required *
                </div>
                <Textarea
                  id="field-cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer declined bank transfer, item out of stock, fake order attempt"
                  rows={2}
                  required
                  className="text-xs"
                />
              </div>
            )}

            {/* OPTIONAL NOTE (for non-cancelled transitions) */}
            {targetStatus !== 'cancelled' && (
              <div>
                <label htmlFor="field-transition-note" className="block text-xs font-medium text-neutral-700 mb-1">
                  Timeline Note (Optional)
                </label>
                <Input
                  id="field-transition-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Internal note logged with this status update"
                  className="text-xs"
                />
              </div>
            )}

            {/* DIALOG ACTIONS */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={targetStatus === 'cancelled' ? 'secondary' : 'primary'}
                isLoading={isLoading}
                className={targetStatus === 'cancelled' ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : undefined}
              >
                Confirm {targetStatus.toUpperCase()}
              </Button>
            </div>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
