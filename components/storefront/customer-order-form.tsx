/**
 * Customer Order Form Component (U10)
 * Embedded on the Order List page to capture customer details, fulfilment preferences,
 * and submit structured orders to POST /api/orders with idempotency and price protection.
 * Blueprint §8.3, §10.3
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  NIGERIAN_STATES,
  type NigerianState,
  type CreateOrderRequest,
  CreateOrderRequestSchema,
} from '@/lib/contracts/orders';
import type { ResolvedLine } from '@/lib/contracts/list';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { AlertTriangle, Send } from 'lucide-react';
import { getStoredUtmParams, trackEvent } from '@/lib/analytics/tracker';

interface CustomerOrderFormProps {
  lines: ResolvedLine[];
  subtotalNgn: number;
  onPriceChanged?: () => void;
}

export function CustomerOrderForm({
  lines,
  subtotalNgn,
  onPriceChanged,
}: CustomerOrderFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [fulfilment, setFulfilment] = useState<'delivery' | 'pickup'>('delivery');
  const [state, setState] = useState<NigerianState>('Lagos');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [consent, setConsent] = useState(true);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [priceChangedAlert, setPriceChangedAlert] = useState<string | null>(null);

  const availableLines = lines.filter((l) => l.available);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (availableLines.length === 0) {
      setErrorMessage('No available items in your order list');
      return;
    }

    if (!consent) {
      setFieldErrors({ consent: 'You must agree to continue' });
      return;
    }

    const idempotencyKey = crypto.randomUUID();
    const payloadInput: CreateOrderRequest = {
      idempotencyKey,
      turnstileToken: 'test-token-auto-approved',
      customer: {
        name,
        phone,
      },
      fulfilment,
      delivery:
        fulfilment === 'delivery'
          ? {
              state,
              city,
              address,
            }
          : undefined,
      note: note.trim() ? note.trim().slice(0, 300) : undefined,
      items: availableLines.map((line) => ({
        variantId: line.variantId,
        qty: line.qty,
        expectedUnitPriceNgn: line.unitPriceNgn,
      })),
      expectedTotalNgn: subtotalNgn,
      utm: (getStoredUtmParams() || undefined) as Record<string, string> | undefined,
    };

    // Validate with Zod
    const validation = CreateOrderRequestSchema.safeParse(payloadInput);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const pathKey = issue.path.join('.');
        errors[pathKey] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    setErrorMessage(null);
    setPriceChangedAlert(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409 && json.error?.code === 'PRICE_CHANGED') {
          setPriceChangedAlert(
            json.error.message || 'One or more items had a price update. Please review your updated total and submit again.',
          );
          onPriceChanged?.();
          return;
        }

        if (res.status === 409 && json.error?.code === 'OUT_OF_STOCK') {
          setErrorMessage(
            json.error.message || 'One of the items in your order just sold out.',
          );
          onPriceChanged?.();
          return;
        }

        throw new Error(json.error?.message || 'Order submission failed');
      }

      // Track order_created event (zero PII)
      trackEvent('order_created', {
        publicId: json.data?.publicId,
        totalNgn: json.data?.totalNgn,
        itemCount: json.data?.items?.length,
      });

      // Success: Save order data in sessionStorage and navigate to /order/sent
      sessionStorage.setItem('krn:last_order', JSON.stringify(json.data));
      toast({
        title: 'Order Created!',
        description: 'Connecting you to WhatsApp to complete your order.',
        variant: 'success',
      });

      router.push('/order/sent');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not place order';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-card-md border border-neutral-200 bg-neutral-0 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-neutral-900">
        Customer Details
      </h2>
      <p className="mt-1 text-xs text-neutral-500">
        We save your order on our system first, then open WhatsApp with everything pre-filled.
      </p>

      {priceChangedAlert && (
        <div className="mt-4 flex items-start gap-3 rounded-card-md border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <strong>Notice:</strong> {priceChangedAlert}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 flex items-start gap-3 rounded-card-md border border-brand-danger/30 bg-red-50 p-3 text-xs text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0 text-brand-danger mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="customer-name" className="block text-xs font-semibold text-neutral-700">
            Full Name <span className="text-brand-danger">*</span>
          </label>
          <input
            id="customer-name"
            type="text"
            placeholder="e.g. Ade Bello"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
          {fieldErrors['customer.name'] && (
            <p className="mt-1 text-xs text-brand-danger">{fieldErrors['customer.name']}</p>
          )}
        </div>

        {/* WhatsApp Phone */}
        <div>
          <label htmlFor="customer-phone" className="block text-xs font-semibold text-neutral-700">
            WhatsApp Phone Number <span className="text-brand-danger">*</span>
          </label>
          <input
            id="customer-phone"
            type="tel"
            placeholder="0803 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
          {fieldErrors['customer.phone'] && (
            <p className="mt-1 text-xs text-brand-danger">{fieldErrors['customer.phone']}</p>
          )}
          <p className="mt-1 text-[11px] text-neutral-500">
            We use this number to contact you and verify delivery.
          </p>
        </div>

        {/* Fulfilment Type */}
        <div>
          <span className="block text-xs font-semibold text-neutral-700">
            Fulfilment Preference <span className="text-brand-danger">*</span>
          </span>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFulfilment('delivery')}
              className={`flex items-center justify-center rounded-md border p-3 text-xs font-medium transition ${
                fulfilment === 'delivery'
                  ? 'border-brand-blue bg-blue-50/50 text-brand-blue'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Delivery (Nationwide)
            </button>
            <button
              type="button"
              onClick={() => setFulfilment('pickup')}
              className={`flex items-center justify-center rounded-md border p-3 text-xs font-medium transition ${
                fulfilment === 'pickup'
                  ? 'border-brand-blue bg-blue-50/50 text-brand-blue'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              In-Store Pickup
            </button>
          </div>
        </div>

        {/* Delivery Details */}
        {fulfilment === 'delivery' && (
          <div className="space-y-4 rounded-md bg-neutral-50 p-4 border border-neutral-200">
            <h3 className="text-xs font-bold text-neutral-800">
              Delivery Destination
            </h3>

            <div>
              <label htmlFor="delivery-state" className="block text-xs font-medium text-neutral-700">
                State <span className="text-brand-danger">*</span>
              </label>
              <select
                id="delivery-state"
                value={state}
                onChange={(e) => setState(e.target.value as NigerianState)}
                className="mt-1 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="delivery-city" className="block text-xs font-medium text-neutral-700">
                City / Town <span className="text-brand-danger">*</span>
              </label>
              <input
                id="delivery-city"
                type="text"
                placeholder="e.g. Ikeja, Bodija, Akure"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              {fieldErrors['delivery.city'] && (
                <p className="mt-1 text-xs text-brand-danger">{fieldErrors['delivery.city']}</p>
              )}
            </div>

            <div>
              <label htmlFor="delivery-address" className="block text-xs font-medium text-neutral-700">
                Street Address <span className="text-brand-danger">*</span>
              </label>
              <textarea
                id="delivery-address"
                rows={2}
                placeholder="e.g. 15 Obafemi Awolowo Way"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              {fieldErrors['delivery.address'] && (
                <p className="mt-1 text-xs text-brand-danger">{fieldErrors['delivery.address']}</p>
              )}
            </div>
          </div>
        )}

        {/* Note */}
        <div>
          <label htmlFor="customer-note" className="block text-xs font-semibold text-neutral-700">
            Special Instructions / Note (Optional)
          </label>
          <input
            id="customer-note"
            type="text"
            maxLength={300}
            placeholder="e.g. Please deliver after 2pm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
        </div>

        {/* Consent Line linking to Privacy Policy */}
        <div className="pt-2">
          <label className="flex items-start gap-2 cursor-pointer text-xs text-neutral-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 rounded border-neutral-300 text-brand-blue focus:ring-brand-blue"
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" className="text-brand-blue hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-brand-blue hover:underline">
                Privacy Policy
              </Link>
              . No online card payments needed.
            </span>
          </label>
          {fieldErrors.consent && (
            <p className="mt-1 text-xs text-brand-danger">{fieldErrors.consent}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="whatsapp"
          size="lg"
          disabled={submitting || availableLines.length === 0}
          className="w-full gap-2 text-base font-semibold shadow-md"
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Creating Order...' : 'Send Order to WhatsApp'}
        </Button>
      </form>
    </div>
  );
}
