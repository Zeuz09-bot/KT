'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Save, Trash2, Calendar, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { saveBannerAction, deleteBannerAction } from '@/modules/content/actions';
import { isValidInternalPath, type BannerType } from '@/lib/contracts/content';
import type { Database } from '@/lib/database.types';

type BannerRow = Database['public']['Tables']['banners']['Row'];

interface BannerFormProps {
  initialBanner?: BannerRow | null;
  products?: Array<{ id: string; name: string }>;
}

export function BannerForm({ initialBanner, products = [] }: BannerFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(initialBanner?.id);

  const [type, setType] = useState<BannerType>(initialBanner?.type ?? 'hero');
  const [eyebrow, setEyebrow] = useState(initialBanner?.eyebrow ?? '');
  const [title, setTitle] = useState(initialBanner?.title ?? '');
  const [subtitle, setSubtitle] = useState(initialBanner?.subtitle ?? '');
  const [ctaLabel, setCtaLabel] = useState(initialBanner?.cta_label ?? '');
  const [ctaHref, setCtaHref] = useState(initialBanner?.cta_href ?? '');
  const [imagePath, setImagePath] = useState(initialBanner?.image_path ?? '');
  const [productId, setProductId] = useState(initialBanner?.product_id ?? '');
  const [startsAt, setStartsAt] = useState(
    initialBanner?.starts_at ? new Date(initialBanner.starts_at).toISOString().slice(0, 16) : '',
  );
  const [endsAt, setEndsAt] = useState(
    initialBanner?.ends_at ? new Date(initialBanner.ends_at).toISOString().slice(0, 16) : '',
  );
  const [sortOrder, setSortOrder] = useState(initialBanner?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(initialBanner?.is_active ?? true);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Title is required';
    if (!imagePath.trim()) errors.image_path = 'Image path or URL is required';
    if (ctaHref.trim() && !isValidInternalPath(ctaHref.trim())) {
      errors.cta_href = 'Must be an internal link starting with / (e.g. /shop/phones)';
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
        message: 'Please resolve errors before saving.',
        variant: 'error',
      });
      return;
    }

    startTransition(async () => {
      const payload = {
        id: initialBanner?.id,
        type,
        eyebrow: eyebrow.trim() || null,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        cta_label: ctaLabel.trim() || null,
        cta_href: ctaHref.trim() || null,
        image_path: imagePath.trim(),
        product_id: productId || null,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
      };

      const res = await saveBannerAction(payload);
      if (res.ok) {
        toast({
          title: 'Success',
          message: isEditing ? 'Banner updated successfully' : 'Banner created successfully',
          variant: 'success',
        });
        router.push('/admin/content/banners');
        router.refresh();
      } else {
        toast({
          title: 'Error Saving Banner',
          message: res.error.message,
          variant: 'error',
        });
      }
    });
  };

  const handleDelete = () => {
    if (!initialBanner?.id) return;
    startTransition(async () => {
      const res = await deleteBannerAction(initialBanner.id);
      if (res.ok) {
        toast({
          title: 'Deleted',
          message: 'Banner removed successfully',
          variant: 'success',
        });
        router.push('/admin/content/banners');
        router.refresh();
      } else {
        toast({
          title: 'Error Deleting',
          message: res.error.message,
          variant: 'error',
        });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border-default">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/content/banners')}
            className="gap-1 text-text-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Banners
          </Button>
          <h1 className="text-xl font-bold text-text-primary">
            {isEditing ? 'Edit Banner' : 'Create New Banner'}
          </h1>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
            disabled={isPending}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content col */}
          <div className="md:col-span-2 space-y-5 bg-white p-6 rounded-xl border border-border-default shadow-xs">
            <h2 className="text-base font-semibold text-text-primary">Banner Details</h2>

            {/* Banner Type */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Banner Placement / Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('hero')}
                  className={`p-3 rounded-lg border text-sm font-medium text-left transition-all ${
                    type === 'hero'
                      ? 'border-brand-blue bg-blue-50/50 text-brand-blue ring-1 ring-brand-blue'
                      : 'border-border-default hover:bg-neutral-50 text-text-secondary'
                  }`}
                >
                  <span className="block font-semibold">Hero Banner</span>
                  <span className="text-xs text-text-muted">Top carousel on homepage</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('promo')}
                  className={`p-3 rounded-lg border text-sm font-medium text-left transition-all ${
                    type === 'promo'
                      ? 'border-brand-blue bg-blue-50/50 text-brand-blue ring-1 ring-brand-blue'
                      : 'border-border-default hover:bg-neutral-50 text-text-secondary'
                  }`}
                >
                  <span className="block font-semibold">Promo Banner</span>
                  <span className="text-xs text-text-muted">Mid-page promotional feature</span>
                </button>
              </div>
            </div>

            {/* Eyebrow */}
            <div>
              <label htmlFor="banner-eyebrow" className="block text-xs font-semibold text-text-secondary mb-1">
                Eyebrow (Small Tagline)
              </label>
              <Input
                id="banner-eyebrow"
                placeholder="e.g. New Release, Flash Deal, Limited Stock"
                value={eyebrow}
                onChange={(e) => setEyebrow(e.target.value)}
                maxLength={60}
              />
            </div>

            {/* Title */}
            <div>
              <label htmlFor="banner-title" className="block text-xs font-semibold text-text-secondary mb-1">
                Headline / Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="banner-title"
                placeholder="e.g. iPhone 16 Pro Max in Desert Titanium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
              />
              {fieldErrors.title && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.title}</p>
              )}
            </div>

            {/* Subtitle */}
            <div>
              <label htmlFor="banner-subtitle" className="block text-xs font-semibold text-text-secondary mb-1">
                Subtitle / Description
              </label>
              <Input
                id="banner-subtitle"
                placeholder="e.g. Supercharged by the A18 Pro chip. Nationwide delivery available."
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                maxLength={200}
              />
            </div>

            {/* CTA section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="banner-cta-label" className="block text-xs font-semibold text-text-secondary mb-1">
                  CTA Button Label
                </label>
                <Input
                  id="banner-cta-label"
                  placeholder="e.g. Order Now, View Deals"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div>
                <label htmlFor="banner-cta-href" className="block text-xs font-semibold text-text-secondary mb-1">
                  CTA Internal Link
                </label>
                <div className="relative">
                  <Input
                    id="banner-cta-href"
                    placeholder="/shop/phones"
                    value={ctaHref}
                    onChange={(e) => setCtaHref(e.target.value)}
                    className="pl-8"
                  />
                  <LinkIcon className="w-4 h-4 text-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
                {fieldErrors.cta_href ? (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.cta_href}</p>
                ) : (
                  <p className="text-[11px] text-text-muted mt-1">
                    Must start with / (e.g. /shop/phones). No external links.
                  </p>
                )}
              </div>
            </div>

            {/* Image path */}
            <div>
              <label htmlFor="banner-image-path" className="block text-xs font-semibold text-text-secondary mb-1">
                Image Path or Storage URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="banner-image-path"
                  placeholder="e.g. banners/hero-iphone-16.webp or https://..."
                  value={imagePath}
                  onChange={(e) => setImagePath(e.target.value)}
                  className="pl-8"
                  required
                />
                <ImageIcon className="w-4 h-4 text-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
              {fieldErrors.image_path && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.image_path}</p>
              )}
            </div>

            {/* Image Preview */}
            {imagePath && (
              <div className="mt-2 p-3 bg-neutral-50 rounded-lg border border-border-default">
                <p className="text-xs font-medium text-text-secondary mb-2">Image Preview</p>
                <div className="relative h-44 w-full rounded-md overflow-hidden bg-neutral-200">
                  <Image
                    src={imagePath}
                    alt={title || 'Banner Preview'}
                    fill
                    className="object-cover"
                    unoptimized={imagePath.startsWith('http')}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar col */}
          <div className="space-y-5">
            {/* Publishing & Status card */}
            <div className="bg-white p-5 rounded-xl border border-border-default shadow-xs space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">Status & Sorting</h3>

              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <div>
                  <span className="text-xs font-semibold text-text-primary block">Active</span>
                  <span className="text-[11px] text-text-muted">Display banner on website</span>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-brand-blue rounded border-neutral-300 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label htmlFor="banner-sort-order" className="block text-xs font-semibold text-text-secondary mb-1">
                  Sort Order
                </label>
                <Input
                  id="banner-sort-order"
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
                <p className="text-[11px] text-text-muted mt-1">Lower numbers display first (0 = top priority).</p>
              </div>

              {/* Linked Product */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Linked Product (Optional)
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border-default px-3 py-2 bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-blue"
                >
                  <option value="">None (Custom banner)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-text-muted mt-1">
                  Connects this banner to product inventory or pricing.
                </p>
              </div>
            </div>

            {/* Scheduling card */}
            <div className="bg-white p-5 rounded-xl border border-border-default shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-blue" />
                <h3 className="text-sm font-semibold text-text-primary">Schedule Window</h3>
              </div>
              <p className="text-[11px] text-text-muted">
                Leave dates empty to keep banner continuously active.
              </p>

              <div>
                <label htmlFor="banner-starts-at" className="block text-xs font-semibold text-text-secondary mb-1">
                  Starts At
                </label>
                <Input
                  id="banner-starts-at"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="banner-ends-at" className="block text-xs font-semibold text-text-secondary mb-1">
                  Ends At
                </label>
                <Input
                  id="banner-ends-at"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
                {fieldErrors.ends_at && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.ends_at}</p>
                )}
              </div>
            </div>

            {/* Save Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 gap-2"
              disabled={isPending}
            >
              <Save className="w-4 h-4" />
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Banner'}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Banner"
        description="Are you sure you want to delete this banner? This action will remove it from the homepage."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isPending}
      />
    </div>
  );
}
