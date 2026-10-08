'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Truck,
  MessageCircle,
  RefreshCw,
  CheckCircle,
  Star,
  Clock,
  MapPin,
  Save,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { TrustItem } from '@/components/ui/trust-item';
import { saveTrustBarAction } from '@/modules/content/actions';
import {
  TRUST_BAR_ICONS,
  type TrustBarItem,
  type TrustBarIcon,
} from '@/lib/contracts/content';

interface TrustBarFormProps {
  initialTrustBar: TrustBarItem[];
}

export function getTrustBarIcon(icon: TrustBarIcon) {
  switch (icon) {
    case 'shield':
      return <Shield className="w-5 h-5" />;
    case 'truck':
      return <Truck className="w-5 h-5" />;
    case 'message-circle':
      return <MessageCircle className="w-5 h-5" />;
    case 'refresh-cw':
      return <RefreshCw className="w-5 h-5" />;
    case 'check-circle':
      return <CheckCircle className="w-5 h-5" />;
    case 'star':
      return <Star className="w-5 h-5" />;
    case 'clock':
      return <Clock className="w-5 h-5" />;
    case 'map-pin':
      return <MapPin className="w-5 h-5" />;
    default:
      return <Shield className="w-5 h-5" />;
  }
}

export function TrustBarForm({ initialTrustBar }: TrustBarFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Ensure exactly 4 items
  const [items, setItems] = useState<TrustBarItem[]>(() => {
    if (Array.isArray(initialTrustBar) && initialTrustBar.length === 4) {
      return initialTrustBar;
    }
    return [
      { icon: 'shield', title: 'Genuine Products', subtitle: 'Every item verified authentic' },
      { icon: 'truck', title: 'Nationwide Delivery', subtitle: 'Fast delivery across Nigeria' },
      { icon: 'message-circle', title: 'WhatsApp Support', subtitle: 'Chat with us 24/7' },
      { icon: 'refresh-cw', title: 'Inspect Before You Pay', subtitle: 'Pickup available in Ondo State' },
    ];
  });

  const updateItem = (index: number, field: keyof TrustBarItem, val: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    for (let i = 0; i < 4; i++) {
      if (!items[i].title.trim()) {
        toast({
          title: 'Validation Error',
          message: `Item #${i + 1} title cannot be empty`,
          variant: 'error',
        });
        return;
      }
      if (!items[i].subtitle.trim()) {
        toast({
          title: 'Validation Error',
          message: `Item #${i + 1} subtitle cannot be empty`,
          variant: 'error',
        });
        return;
      }
    }

    startTransition(async () => {
      const res = await saveTrustBarAction(items);
      if (res.ok) {
        toast({
          title: 'Trust Bar Saved',
          message: 'Homepage trust badges updated successfully',
          variant: 'success',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error Saving',
          message: res.error.message,
          variant: 'error',
        });
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      {/* Informational callout */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
        <HelpCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
        <div>
          <span className="font-semibold text-amber-950 block mb-0.5">
            Blueprint Rule: Honest Promises Only
          </span>
          No fake social proof, no invented customer counts, no &ldquo;Secure Card Payment&rdquo; badges
          (Keraunous operates via WhatsApp order confirmation with bank transfer or pickup inspection).
        </div>
      </div>

      {/* Editor Cards (4 Items) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-xl border border-border-default shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Trust Badge #{idx + 1}
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
                {getTrustBarIcon(item.icon)}
              </span>
            </div>

            {/* Icon picker */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Badge Icon
              </label>
              <select
                value={item.icon}
                onChange={(e) => updateItem(idx, 'icon', e.target.value as TrustBarIcon)}
                className="w-full text-xs rounded-lg border border-border-default px-3 py-2 bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                {TRUST_BAR_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label htmlFor={`trust-title-${idx}`} className="block text-xs font-semibold text-text-secondary mb-1">
                Headline / Title
              </label>
              <Input
                id={`trust-title-${idx}`}
                value={item.title}
                onChange={(e) => updateItem(idx, 'title', e.target.value)}
                maxLength={60}
                required
              />
            </div>

            {/* Subtitle */}
            <div>
              <label htmlFor={`trust-subtitle-${idx}`} className="block text-xs font-semibold text-text-secondary mb-1">
                Sublabel / Description
              </label>
              <Input
                id={`trust-subtitle-${idx}`}
                value={item.subtitle}
                onChange={(e) => updateItem(idx, 'subtitle', e.target.value)}
                maxLength={120}
                required
              />
            </div>
          </div>
        ))}
      </div>

      {/* Live Preview Strip */}
      <div className="bg-white p-6 rounded-xl border border-border-default shadow-xs space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          Live Storefront Preview
        </h3>
        <p className="text-xs text-text-muted">
          This is exactly how the 4 trust badges will appear across the homepage strip:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-3 p-4 bg-neutral-50 rounded-lg border border-border-subtle">
          {items.map((item, idx) => (
            <TrustItem
              key={idx}
              icon={getTrustBarIcon(item.icon)}
              label={item.title || 'Untitled'}
              sublabel={item.subtitle}
            />
          ))}
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="px-6 py-2.5 gap-2"
        disabled={isPending}
      >
        <Save className="w-4 h-4" />
        {isPending ? 'Saving...' : 'Save Trust Badges'}
      </Button>
    </form>
  );
}
