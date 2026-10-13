'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageCircle,
  Copy,
  Clock,
  User,
  Truck,
  DollarSign,
  Edit2,
  CheckCircle,
  XCircle,
  Package,
  Plus,
} from 'lucide-react';
import { StatusPill } from '@/components/admin/status-pill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Modal, ModalContent } from '@/components/ui/modal';
import { toast } from '@/components/ui/toast';
import { formatNgn } from '@/lib/money';
import { formatPhoneDisplay } from '@/lib/phone';
import { formatLagosDateTime } from '@/lib/dates';
import { allowedNextStatuses } from '@/modules/orders/transition';
import {
  addNoteAction,
  setDeliveryFeeAction,
  adjustItemPriceAction,
} from '@/modules/orders/actions';
import { OrderTransitionDialog } from '@/components/admin/order-transition-dialog';
import { OrderTimeline } from '@/components/admin/order-timeline';
import { OrderMessageTemplates } from '@/components/admin/order-message-templates';
import type { AdminOrderDetail, AdminOrderItem } from '@/lib/contracts/admin-orders';
import type { OrderStatus } from '@/lib/constants';
import type { AdminRole } from '@/modules/orders/transition';

interface OrderDetailViewProps {
  order: AdminOrderDetail;
  userRole: AdminRole;
}

export function OrderDetailView({ order, userRole }: OrderDetailViewProps) {
  const router = useRouter();

  // Transition Dialog state
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<OrderStatus>('confirmed');

  // Add Note state
  const [newNote, setNewNote] = useState('');
  const [isCustomerVisible, setIsCustomerVisible] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Edit Delivery Fee modal state
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [deliveryFeeInput, setDeliveryFeeInput] = useState<number>(order.deliveryFeeNgn);
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);

  // Edit Item Price modal state
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AdminOrderItem | null>(null);
  const [newPriceInput, setNewPriceInput] = useState<number>(0);
  const [priceReasonInput, setPriceReasonInput] = useState('');
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  const cleanPhone = order.customerPhone.replace(/\+/g, '');
  const waChatUrl = `https://wa.me/${cleanPhone}`;
  const nextStatuses = allowedNextStatuses(order.status, userRole);
  const canEditPrices = order.status === 'new' || order.status === 'confirmed';

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
      variant: 'info',
    });
  }

  function openTransition(status: OrderStatus) {
    setTargetStatus(status);
    setTransitionDialogOpen(true);
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const res = await addNoteAction(order.id, newNote.trim(), isCustomerVisible);
      if (!res.ok) {
        toast({
          title: 'Failed to add note',
          description: res.error.message,
          variant: 'error',
        });
        return;
      }

      toast({
        title: 'Note added',
        description: 'New note recorded in order timeline.',
        variant: 'success',
      });
      setNewNote('');
      setIsCustomerVisible(false);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not record note';
      toast({
        title: 'Error',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsAddingNote(false);
    }
  }

  async function handleSaveDeliveryFee(e: React.FormEvent) {
    e.preventDefault();
    if (deliveryFeeInput < 0) return;

    setIsUpdatingFee(true);
    try {
      const res = await setDeliveryFeeAction(order.id, deliveryFeeInput);
      if (!res.ok) {
        toast({
          title: 'Failed to update fee',
          description: res.error.message,
          variant: 'error',
        });
        return;
      }

      toast({
        title: 'Delivery Fee Updated',
        description: `Fee set to ${formatNgn(deliveryFeeInput)}`,
        variant: 'success',
      });
      setFeeModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not update delivery fee';
      toast({
        title: 'Error',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsUpdatingFee(false);
    }
  }

  function openPriceAdjust(item: AdminOrderItem) {
    setSelectedItem(item);
    setNewPriceInput(item.unitPriceNgn);
    setPriceReasonInput('');
    setPriceModalOpen(true);
  }

  async function handleSaveItemPrice(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem || newPriceInput < 0 || !priceReasonInput.trim()) return;

    setIsUpdatingPrice(true);
    try {
      const res = await adjustItemPriceAction(selectedItem.id, newPriceInput, priceReasonInput.trim());
      if (!res.ok) {
        toast({
          title: 'Failed to adjust price',
          description: res.error.message,
          variant: 'error',
        });
        return;
      }

      toast({
        title: 'Price Adjusted',
        description: `Unit price updated to ${formatNgn(newPriceInput)}`,
        variant: 'success',
      });
      setPriceModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not adjust price';
      toast({
        title: 'Error',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsUpdatingPrice(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Top Bar: Back link & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono text-neutral-900 tracking-tight">
              {order.publicId}
            </h1>
            <StatusPill status={order.status} />
          </div>
          <p className="text-xs text-neutral-500">
            Placed on {formatLagosDateTime(order.createdAt)}
          </p>
        </div>

        {/* Action Buttons for allowed transitions */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={waChatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Chat on WhatsApp
          </a>

          {/* Dynamic transition buttons based on allowedNextStatuses */}
          {nextStatuses.map((st) => {
            const isCancel = st === 'cancelled';
            return (
              <Button
                key={st}
                type="button"
                variant={isCancel ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => openTransition(st)}
                className={`capitalize text-xs font-semibold gap-1 ${
                  isCancel ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : ''
                }`}
              >
                {isCancel ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                Mark as {st}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Items & Delivery & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table */}
          <div className="bg-neutral-0 rounded-card-md border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-brand-blue" />
                Ordered Items ({order.items.length})
              </h2>
              {canEditPrices && (
                <span className="text-[11px] text-neutral-400">
                  Prices editable while New or Confirmed
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-50/75 border-b border-neutral-200 text-xs font-semibold text-neutral-600 uppercase">
                    <th className="py-2.5 px-4">Item</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-neutral-900">{item.productName}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">{item.variantLabel}</div>
                        <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                          SKU: {item.sku}
                        </div>
                        {item.imei && (
                          <div className="text-[11px] font-mono text-purple-700 bg-purple-50 inline-block px-1.5 py-0.2 rounded mt-1 border border-purple-200">
                            IMEI: {item.imei}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium">{item.qty}</td>
                      <td className="py-3 px-4 text-right align-top">
                        <div className="font-mono">{formatNgn(item.unitPriceNgn)}</div>
                        {canEditPrices && (
                          <button
                            type="button"
                            onClick={() => openPriceAdjust(item)}
                            className="inline-flex items-center gap-1 text-[11px] text-brand-blue hover:underline mt-1"
                          >
                            <Edit2 className="h-2.5 w-2.5" /> Adjust
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-neutral-900">
                        {formatNgn(item.lineTotalNgn)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-neutral-50/50 border-t border-neutral-200 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-mono">{formatNgn(order.subtotalNgn)}</span>
              </div>
              <div className="flex justify-between items-center text-neutral-600">
                <span className="flex items-center gap-1.5">
                  Delivery Fee
                  {canEditPrices && (
                    <button
                      type="button"
                      onClick={() => setFeeModalOpen(true)}
                      className="text-brand-blue hover:underline text-[11px] flex items-center gap-0.5"
                    >
                      <Edit2 className="h-2.5 w-2.5" /> Edit
                    </button>
                  )}
                </span>
                <span className="font-mono">
                  {order.deliveryFeeNgn === 0 ? '₦0 (Included / Free)' : formatNgn(order.deliveryFeeNgn)}
                </span>
              </div>
              {order.discountNgn > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-mono">- {formatNgn(order.discountNgn)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                <span>Total Due</span>
                <span className="font-mono text-base">{formatNgn(order.totalNgn)}</span>
              </div>
            </div>
          </div>

          {/* Add Internal / Public Note Form */}
          <div className="bg-neutral-0 rounded-card-md border border-neutral-200 p-4 space-y-3 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-purple-600" />
              Add Order Note / Timeline Event
            </h2>
            <form onSubmit={handleAddNote} className="space-y-3">
              <Textarea
                id="order-detail-note-input"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Record customer communication, delivery instructions, or special requests..."
                rows={2}
                required
                className="text-xs"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCustomerVisible}
                    onChange={(e) => setIsCustomerVisible(e.target.checked)}
                    className="rounded border-neutral-300 text-brand-blue focus:ring-brand-blue h-3.5 w-3.5"
                  />
                  <span>Visible to customer on public tracking page (/track)</span>
                </label>
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  isLoading={isAddingNote}
                  className="text-xs font-semibold"
                >
                  Save Note
                </Button>
              </div>
            </form>
          </div>

          {/* Timeline of Order Events */}
          <div className="bg-neutral-0 rounded-card-md border border-neutral-200 p-4 space-y-4 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-neutral-600" />
              Order Event Timeline ({order.events.length})
            </h2>
            <OrderTimeline events={order.events} />
          </div>
        </div>

        {/* Right Column (1 Col): Customer info, Fulfilment info, Message Templates */}
        <div className="space-y-6">
          {/* Customer Info Card */}
          <div className="bg-neutral-0 rounded-card-md border border-neutral-200 p-4 space-y-3 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5 border-b border-neutral-100 pb-2">
              <User className="h-4 w-4 text-brand-blue" />
              Customer Information
            </h2>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-neutral-500 block text-[11px]">Full Name</span>
                <span className="font-medium text-neutral-900 text-sm">{order.customerName}</span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px]">Phone Number</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-medium text-neutral-900">
                    {formatPhoneDisplay(order.customerPhone)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.customerPhone, 'Phone number')}
                    className="text-neutral-400 hover:text-neutral-700"
                    title="Copy Phone"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {order.customerNote && (
                <div className="pt-2 border-t border-neutral-100">
                  <span className="text-neutral-500 block text-[11px]">Customer Note</span>
                  <p className="text-neutral-700 bg-neutral-50 p-2 rounded border border-neutral-200 text-xs italic mt-0.5">
                    &ldquo;{order.customerNote}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fulfilment & Delivery Card */}
          <div className="bg-neutral-0 rounded-card-md border border-neutral-200 p-4 space-y-3 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5 border-b border-neutral-100 pb-2">
              <Truck className="h-4 w-4 text-brand-blue" />
              Fulfilment &amp; Destination
            </h2>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-neutral-500 block text-[11px]">Method</span>
                <span className="font-semibold capitalize text-neutral-900">
                  {order.fulfilment === 'delivery' ? 'Nationwide Delivery' : 'Store Pickup (Akure, Ondo)'}
                </span>
              </div>

              {order.fulfilment === 'delivery' && (
                <>
                  <div>
                    <span className="text-neutral-500 block text-[11px]">Destination State / City</span>
                    <span className="font-medium text-neutral-800">
                      {order.deliveryCity}, {order.deliveryState}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[11px]">Delivery Street Address</span>
                    <p className="text-neutral-800 bg-neutral-50 p-2 rounded border border-neutral-200 mt-0.5 leading-relaxed">
                      {order.deliveryAddress}
                    </p>
                  </div>
                </>
              )}

              {/* Courier info if dispatched */}
              {order.courierName && (
                <div className="pt-2 border-t border-neutral-100 space-y-1">
                  <span className="text-neutral-500 block text-[11px]">Courier Service</span>
                  <span className="font-medium text-neutral-900">{order.courierName}</span>
                  {order.trackingNumber && (
                    <div className="font-mono text-neutral-700 text-[11px]">
                      Tracking: {order.trackingNumber}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Payment Card if paid */}
          {order.paymentConfirmedAt && (
            <div className="bg-neutral-0 rounded-card-md border border-emerald-200 p-4 space-y-3 shadow-sm bg-emerald-50/20">
              <h2 className="text-sm font-semibold text-emerald-900 flex items-center gap-1.5 border-b border-emerald-100 pb-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Payment Record
              </h2>
              <div className="space-y-1.5 text-xs text-neutral-700">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Amount Paid:</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {order.paymentAmountNgn ? formatNgn(order.paymentAmountNgn) : 'N/A'}
                  </span>
                </div>
                {order.paymentReference && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Reference:</span>
                    <span className="font-mono">{order.paymentReference}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-500">Verified On:</span>
                  <span>{formatLagosDateTime(order.paymentConfirmedAt)}</span>
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Message Templates Component */}
          <OrderMessageTemplates order={order} />
        </div>
      </div>

      {/* TRANSITION DIALOG */}
      <OrderTransitionDialog
        open={transitionDialogOpen}
        onOpenChange={setTransitionDialogOpen}
        orderId={order.id}
        currentStatus={order.status}
        targetStatus={targetStatus}
        orderTotalNgn={order.totalNgn}
        userRole={userRole}
      />

      {/* EDIT DELIVERY FEE MODAL */}
      <Modal open={feeModalOpen} onOpenChange={setFeeModalOpen}>
        <ModalContent
          title="Adjust Delivery Fee"
          description="Update the delivery fee for this order. Subtotal and total will be recalculated."
          widthClass="max-w-md"
        >
          <form onSubmit={handleSaveDeliveryFee} className="space-y-4">
            <div>
              <label htmlFor="field-delivery-fee-input" className="block text-xs font-medium text-neutral-700 mb-1">
                Delivery Fee (₦)
              </label>
              <Input
                id="field-delivery-fee-input"
                type="number"
                value={deliveryFeeInput}
                onChange={(e) => setDeliveryFeeInput(Number(e.target.value))}
                min={0}
                step={500}
                required
                className="font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <Button type="button" variant="ghost" onClick={() => setFeeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isUpdatingFee}>
                Save Delivery Fee
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>

      {/* ADJUST ITEM PRICE MODAL */}
      <Modal open={priceModalOpen} onOpenChange={setPriceModalOpen}>
        <ModalContent
          title="Adjust Unit Price"
          description="Modify the unit price for this ordered item. A mandatory reason is required for the audit log."
          widthClass="max-w-md"
        >
          {selectedItem && (
            <form onSubmit={handleSaveItemPrice} className="space-y-4">
              <div className="text-xs bg-neutral-50 p-2.5 rounded border border-neutral-200">
                <div className="font-semibold text-neutral-900">{selectedItem.productName}</div>
                <div className="text-neutral-500">{selectedItem.variantLabel}</div>
                <div className="font-mono text-neutral-700 mt-1">
                  Current unit price: {formatNgn(selectedItem.unitPriceNgn)}
                </div>
              </div>

              <div>
                <label htmlFor="field-adjust-new-price" className="block text-xs font-medium text-neutral-700 mb-1">
                  New Unit Price (₦) *
                </label>
                <Input
                  id="field-adjust-new-price"
                  type="number"
                  value={newPriceInput}
                  onChange={(e) => setNewPriceInput(Number(e.target.value))}
                  min={0}
                  step={500}
                  required
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <label htmlFor="field-adjust-price-reason" className="block text-xs font-medium text-neutral-700 mb-1">
                  Reason for Adjustment *
                </label>
                <Input
                  id="field-adjust-price-reason"
                  value={priceReasonInput}
                  onChange={(e) => setPriceReasonInput(e.target.value)}
                  placeholder="e.g. WhatsApp discount approved, price match, promo agreed"
                  required
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <Button type="button" variant="ghost" onClick={() => setPriceModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isUpdatingPrice}>
                  Update Price
                </Button>
              </div>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
