'use client';

import React, { useState } from 'react';
import { Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNgn } from '@/lib/money';
import type { Database, ItemCondition } from '@/lib/database.types';

type VariantRowData = Database['public']['Tables']['product_variants']['Row'];

interface VariantRowProps {
  variant: VariantRowData;
  onUpdate: (updated: Partial<VariantRowData> & { id: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function VariantRow({ variant, onUpdate, onDelete }: VariantRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaleDates, setShowSaleDates] = useState(Boolean(variant.sale_price_ngn));

  const [formData, setFormData] = useState({
    storageGb: variant.storage_gb ?? '',
    ramGb: variant.ram_gb ?? '',
    color: variant.color ?? '',
    colorHex: variant.color_hex ?? '#000000',
    condition: variant.condition as ItemCondition,
    priceNgn: variant.price_ngn,
    compareAtPriceNgn: variant.compare_at_price_ngn ?? '',
    salePriceNgn: variant.sale_price_ngn ?? '',
    saleStartsAt: variant.sale_starts_at ? variant.sale_starts_at.slice(0, 16) : '',
    saleEndsAt: variant.sale_ends_at ? variant.sale_ends_at.slice(0, 16) : '',
    stockQty: variant.stock_qty,
    lowStockThreshold: variant.low_stock_threshold,
    warrantyMonths: variant.warranty_months ?? 12,
    isActive: variant.is_active,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        id: variant.id,
        storage_gb: formData.storageGb ? Number(formData.storageGb) : null,
        ram_gb: formData.ramGb ? Number(formData.ramGb) : null,
        color: formData.color || null,
        color_hex: formData.colorHex || null,
        condition: formData.condition,
        price_ngn: Number(formData.priceNgn),
        compare_at_price_ngn: formData.compareAtPriceNgn ? Number(formData.compareAtPriceNgn) : null,
        sale_price_ngn: formData.salePriceNgn ? Number(formData.salePriceNgn) : null,
        sale_starts_at: formData.saleStartsAt ? new Date(formData.saleStartsAt).toISOString() : null,
        sale_ends_at: formData.saleEndsAt ? new Date(formData.saleEndsAt).toISOString() : null,
        stock_qty: Number(formData.stockQty),
        low_stock_threshold: Number(formData.lowStockThreshold),
        warranty_months: formData.warrantyMonths ? Number(formData.warrantyMonths) : null,
        is_active: formData.isActive,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`border rounded-xl transition-all ${
        isEditing
          ? 'bg-blue-50/20 border-blue-200 p-4 shadow-xs'
          : 'bg-white border-neutral-200 p-3.5 hover:border-neutral-300'
      }`}
    >
      {/* Top summary row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3">
          {/* Color swatch */}
          {variant.color_hex ? (
            <span
              className="w-5 h-5 rounded-full border border-neutral-300 shadow-xs flex-shrink-0"
              style={{ backgroundColor: variant.color_hex }}
              title={variant.color ?? undefined}
            />
          ) : (
            <span className="w-5 h-5 rounded-full bg-neutral-200 border border-neutral-300 flex-shrink-0" />
          )}

          <div>
            <div className="font-semibold text-neutral-900 flex items-center gap-2">
              <span>
                {variant.storage_gb ? `${variant.storage_gb}GB` : ''}
                {variant.ram_gb ? ` / ${variant.ram_gb}GB RAM` : ''}
                {variant.color ? ` · ${variant.color}` : ''}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md font-medium capitalize bg-neutral-100 text-neutral-700">
                {variant.condition.replace('_', ' ')}
              </span>
              {!variant.is_active && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600">
                  Inactive
                </span>
              )}
            </div>
            <div className="text-xs font-mono text-neutral-400">SKU: {variant.sku}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Pricing display */}
          <div className="text-right">
            <div className="font-bold text-neutral-900">{formatNgn(variant.price_ngn)}</div>
            {variant.sale_price_ngn && (
              <div className="text-xs text-red-600 font-semibold">
                Sale: {formatNgn(variant.sale_price_ngn)}
              </div>
            )}
            {variant.compare_at_price_ngn && (
              <div className="text-xs text-neutral-400 line-through">
                Old: {formatNgn(variant.compare_at_price_ngn)}
              </div>
            )}
          </div>

          {/* Stock display */}
          <div className="text-right min-w-[70px]">
            <div
              className={`text-xs font-semibold px-2 py-0.5 rounded inline-block ${
                variant.stock_qty === 0
                  ? 'bg-red-50 text-red-700'
                  : variant.stock_qty <= variant.low_stock_threshold
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-green-50 text-green-800'
              }`}
            >
              {variant.stock_qty} in stock
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs h-8"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('Delete this variant?')) onDelete(variant.id);
              }}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
              title="Delete variant"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Edit Form */}
      {isEditing && (
        <div className="mt-4 pt-4 border-t border-neutral-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Storage (GB)</label>
            <input
              type="number"
              placeholder="e.g. 256"
              value={formData.storageGb}
              onChange={(e) => setFormData({ ...formData, storageGb: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">RAM (GB)</label>
            <input
              type="number"
              placeholder="e.g. 8"
              value={formData.ramGb}
              onChange={(e) => setFormData({ ...formData, ramGb: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Color Name</label>
            <input
              type="text"
              placeholder="e.g. Natural Titanium"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Color Hex</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.colorHex}
                onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                className="w-8 h-8 rounded border border-neutral-300 cursor-pointer p-0"
              />
              <input
                type="text"
                value={formData.colorHex}
                onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                className="flex-1 font-mono uppercase px-2 py-1.5 border border-neutral-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Condition</label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value as ItemCondition })}
              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md"
            >
              <option value="brand_new">Brand New</option>
              <option value="uk_used">UK Used</option>
              <option value="open_box">Open Box</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Regular Price (₦) *</label>
            <input
              type="number"
              min={1}
              required
              value={formData.priceNgn}
              onChange={(e) => setFormData({ ...formData, priceNgn: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Compare-at Price (₦)</label>
            <input
              type="number"
              min={1}
              placeholder="Old price before discount"
              value={formData.compareAtPriceNgn}
              onChange={(e) => setFormData({ ...formData, compareAtPriceNgn: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Sale Price (₦)</label>
            <input
              type="number"
              min={1}
              placeholder="Active promotional price"
              value={formData.salePriceNgn}
              onChange={(e) => {
                setFormData({ ...formData, salePriceNgn: e.target.value });
                if (e.target.value) setShowSaleDates(true);
              }}
              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md font-mono"
            />
          </div>

          {showSaleDates && (
            <>
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Sale Starts At</label>
                <input
                  type="datetime-local"
                  value={formData.saleStartsAt}
                  onChange={(e) => setFormData({ ...formData, saleStartsAt: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Sale Ends At</label>
                <input
                  type="datetime-local"
                  value={formData.saleEndsAt}
                  onChange={(e) => setFormData({ ...formData, saleEndsAt: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md"
                />
              </div>
            </>
          )}

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Stock Quantity</label>
            <input
              type="number"
              min={0}
              value={formData.stockQty}
              onChange={(e) => setFormData({ ...formData, stockQty: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Low Stock Threshold</label>
            <input
              type="number"
              min={0}
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Warranty (Months)</label>
            <input
              type="number"
              min={0}
              max={36}
              value={formData.warrantyMonths}
              onChange={(e) => setFormData({ ...formData, warrantyMonths: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md"
            />
          </div>

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id={`active-${variant.id}`}
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor={`active-${variant.id}`} className="font-medium text-neutral-800 cursor-pointer">
              Active Variant
            </label>
          </div>

          <div className="col-span-full flex justify-end gap-2 pt-2 border-t border-neutral-200">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isSaving}
              onClick={handleSave}
              className="gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
