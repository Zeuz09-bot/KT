'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Flame, Link as LinkIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { saveCampaignAction } from '@/modules/content/actions';
import { isValidInternalPath } from '@/lib/contracts/content';
import type { Database } from '@/lib/database.types';

type CampaignRow = Database['public']['Tables']['campaigns']['Row'];

interface CampaignFormProps {
  initialCampaign?: CampaignRow | null;
}

export function CampaignForm({ initialCampaign }: CampaignFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialCampaign?.title ?? '');
  const [subtitle, setSubtitle] = useState(initialCampaign?.subtitle ?? '');
  const [href, setHref] = useState(initialCampaign?.href ?? '');
  const [startsAt, setStartsAt] = useState(
    initialCampaign?.starts_at
      ? new Date(initialCampaign.starts_at).toISOString().slice(0, 16)
      : '',
  );
  const [endsAt, setEndsAt] = useState(
    initialCampaign?.ends_at
      ? new Date(initialCampaign.ends_at).toISOString().slice(0, 16)
      : '',
  );
  const [isActive, setIsActive] = useState(initialCampaign?.is_active ?? true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Campaign title is required';
    if (!endsAt) errors.ends_at = 'Flash sale end date/time is required';
    if (href.trim() && !isValidInternalPath(href.trim())) {
      errors.href = 'Must be an internal link starting with / (e.g. /shop/deals)';
    }
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      errors.ends_at = 'End date must be after start date';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: 'Validation Error',
        message: 'Please check form errors before saving.',
        variant: 'error',
      });
      return;
    }

    startTransition(async () => {
      const payload = {
        id: initialCampaign?.id,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        href: href.trim() || null,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: new Date(endsAt).toISOString(),
        is_active: isActive,
      };

      const res = await saveCampaignAction(payload);
      if (res.ok) {
        toast({
          title: 'Campaign Saved',
          message: isActive
            ? 'Flash sale campaign is live and homepage is updated.'
            : 'Campaign saved (inactive).',
          variant: 'success',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error Saving Campaign',
          message: res.error.message,
          variant: 'error',
        });
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="max-w-3xl space-y-6">
      <div className="bg-white p-6 rounded-xl border border-border-default shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border-default">
          <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Flash Sale Campaign Banner
            </h2>
            <p className="text-xs text-text-secondary">
              Configures the high-urgency countdown timer strip on the public homepage.
            </p>
          </div>
        </div>

        {/* Informational banner about single active campaign */}
        <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Rule:</span> Only one active flash sale campaign runs
            at a time. Activating this campaign automatically deactivates any existing active
            campaign. Countdowns exist only for real scheduled sales (no fake urgency).
          </div>
        </div>

        {/* Campaign Title */}
        <div>
          <label htmlFor="campaign-title" className="block text-xs font-semibold text-text-secondary mb-1">
            Campaign Title <span className="text-red-500">*</span>
          </label>
          <Input
            id="campaign-title"
            placeholder="e.g. Independence Day Tech Blitz"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
          />
          {fieldErrors.title && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.title}</p>
          )}
        </div>

        {/* Campaign Subtitle */}
        <div>
          <label htmlFor="campaign-subtitle" className="block text-xs font-semibold text-text-secondary mb-1">
            Subtitle / Description
          </label>
          <Input
            id="campaign-subtitle"
            placeholder="e.g. Up to 30% off selected flagship devices while stock lasts"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={200}
          />
        </div>

        {/* Link */}
        <div>
          <label htmlFor="campaign-href" className="block text-xs font-semibold text-text-secondary mb-1">
            Target Page Link
          </label>
          <div className="relative">
            <Input
              id="campaign-href"
              placeholder="/shop/deals"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              className="pl-8"
            />
            <LinkIcon className="w-4 h-4 text-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
          {fieldErrors.href ? (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.href}</p>
          ) : (
            <p className="text-[11px] text-text-muted mt-1">
              Must be an internal route starting with / (e.g. /shop/deals or /category/phones)
            </p>
          )}
        </div>

        {/* Schedule grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label htmlFor="campaign-starts-at" className="block text-xs font-semibold text-text-secondary mb-1">
              Starts At (Optional)
            </label>
            <div className="relative">
              <Input
                id="campaign-starts-at"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              If omitted, campaign starts immediately.
            </p>
          </div>

          <div>
            <label htmlFor="campaign-ends-at" className="block text-xs font-semibold text-text-secondary mb-1">
              Ends At (Required Countdown Deadline) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="campaign-ends-at"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
              />
            </div>
            {fieldErrors.ends_at && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.ends_at}</p>
            )}
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-border-default">
          <div>
            <span className="text-xs font-semibold text-text-primary block">
              Campaign Active
            </span>
            <span className="text-[11px] text-text-muted">
              Display flash sale countdown banner on homepage
            </span>
          </div>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-5 h-5 text-brand-blue rounded border-neutral-300 focus:ring-brand-blue cursor-pointer"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full sm:w-auto px-6 py-2.5 gap-2"
          disabled={isPending}
        >
          <Save className="w-4 h-4" />
          {isPending ? 'Saving Campaign...' : 'Save Campaign'}
        </Button>
      </div>
    </form>
  );
}
