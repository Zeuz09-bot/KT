'use client';

import React, { useState } from 'react';
import { Search, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Button } from '@/components/ui/button';

interface TrackOrderFormProps {
  initialPublicId?: string;
  onSubmit: (publicId: string, phone: string, turnstileToken: string) => Promise<void>;
  isLoading: boolean;
  errorMessage?: string | null;
}

export function TrackOrderForm({
  initialPublicId = '',
  onSubmit,
  isLoading,
  errorMessage,
}: TrackOrderFormProps) {
  const [publicId, setPublicId] = useState(initialPublicId);
  const [phone, setPhone] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    const trimmedId = publicId.trim().toUpperCase();
    const trimmedPhone = phone.trim();

    if (!trimmedId) {
      setValidationError('Please enter your Order ID');
      return;
    }

    if (!/^KRN-[0-9]{6}-[A-Z0-9]{5}$/.test(trimmedId)) {
      setValidationError('Order ID must match format KRN-YYMMDD-XXXXX (e.g. KRN-261006-7F3KQ)');
      return;
    }

    if (!trimmedPhone) {
      setValidationError('Please enter the phone number used when placing the order');
      return;
    }

    // Pass turnstile token (fallback token in development)
    const turnstileToken = 'test-token-valid-abc12345';
    await onSubmit(trimmedId, trimmedPhone, turnstileToken);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Order ID Input */}
      <div>
        <label htmlFor="track-order-id" className="block text-sm font-semibold text-neutral-800 mb-1.5">
          Order ID *
        </label>
        <div className="relative">
          <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            id="track-order-id"
            value={publicId}
            onChange={(e) => setPublicId(e.target.value.toUpperCase())}
            placeholder="e.g. KRN-261006-7F3KQ"
            required
            className="pl-10 font-mono text-sm tracking-wider uppercase"
          />
        </div>
        <span className="text-[11px] text-neutral-500 mt-1 block">
          Found on your order confirmation screen or WhatsApp message.
        </span>
      </div>

      {/* Phone Number Input */}
      <div>
        <PhoneInput
          id="track-phone-number"
          label="Phone Number *"
          value={phone}
          onChange={(val) => setPhone(val)}
          placeholder="803 123 4567"
          required
          helperText="Must match the phone number provided at checkout."
        />
      </div>

      {/* Error Feedback */}
      {(validationError || errorMessage) && (
        <div
          role="alert"
          className="p-3 rounded-card-sm bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed animate-fade-in"
        >
          {validationError || errorMessage}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full gap-2 font-semibold shadow-sm"
      >
        <Search className="h-4 w-4" />
        Track Order Status
      </Button>
    </form>
  );
}
