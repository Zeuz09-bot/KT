/**
 * Catalogue Filter Panel (U08)
 * Desktop sidebar + mobile bottom sheet.
 * All state lives in URL search params (shareable, back-button safe).
 * Blueprint §9.7
 */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterConfig {
  brands?: FilterOption[];
  categories?: FilterOption[];
  storages?: FilterOption[];   // e.g. ['64', '128', '256', '512']
  conditions?: FilterOption[];
  minPrice?: number;
  maxPrice?: number;
}

interface FilterPanelProps {
  config: FilterConfig;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest first' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Toggle a value in a comma-separated URL param list */
function toggleMulti(current: string | null, value: string): string {
  const set = new Set((current ?? '').split(',').filter(Boolean));
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return [...set].join(',');
}

// ─── FilterContent (shared between sidebar & sheet) ───────────────────────────

function FilterContent({
  config,
  onApply,
}: FilterPanelProps & { onApply?: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.delete('page'); // reset pagination on filter change
      startTransition(() => {
        router.push(`?${next.toString()}`, { scroll: false });
        onApply?.();
      });
    },
    [params, router, onApply],
  );

  const toggle = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      next.set(key, toggleMulti(next.get(key), value));
      if (!next.get(key)) next.delete(key);
      next.delete('page');
      startTransition(() => {
        router.push(`?${next.toString()}`, { scroll: false });
        onApply?.();
      });
    },
    [params, router, onApply],
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push('?', { scroll: false });
      onApply?.();
    });
  }, [router, onApply]);

  const sort = params.get('sort') || 'newest';
  const selectedBrands = new Set((params.get('brand') ?? '').split(',').filter(Boolean));
  const selectedCategories = new Set((params.get('category') ?? '').split(',').filter(Boolean));
  const selectedStorages = new Set((params.get('storage') ?? '').split(',').filter(Boolean));
  const selectedConditions = new Set((params.get('condition') ?? '').split(',').filter(Boolean));
  const inStockOnly = params.get('in_stock') === '1';
  const onSaleOnly = params.get('on_sale') === '1';

  const activeCount = [
    params.get('brand'),
    params.get('category'),
    params.get('storage'),
    params.get('condition'),
    params.get('in_stock'),
    params.get('on_sale'),
  ].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Active filter chips + Clear all */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {params.get('brand') && (
            <ActiveChip label={`Brand: ${params.get('brand')}`} onRemove={() => update('brand', '')} />
          )}
          {params.get('category') && (
            <ActiveChip label={`Category: ${params.get('category')}`} onRemove={() => update('category', '')} />
          )}
          {params.get('storage') && (
            <ActiveChip label={`Storage: ${params.get('storage')}GB`} onRemove={() => update('storage', '')} />
          )}
          {params.get('condition') && (
            <ActiveChip
              label={params.get('condition') === 'brand_new' ? 'Brand New' : 'UK Used'}
              onRemove={() => update('condition', '')}
            />
          )}
          {inStockOnly && <ActiveChip label="In Stock" onRemove={() => update('in_stock', '')} />}
          {onSaleOnly && <ActiveChip label="On Sale" onRemove={() => update('on_sale', '')} />}
          <button
            onClick={clearAll}
            className="text-xs font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-800"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Sort */}
      <Section title="Sort by">
        <div className="space-y-1">
          {SORT_OPTIONS.map((o) => (
            <RadioOption
              key={o.value}
              label={o.label}
              checked={sort === o.value}
              onChange={() => update('sort', o.value)}
            />
          ))}
        </div>
      </Section>

      {/* Quick toggles */}
      <Section title="Availability">
        <CheckOption
          label="In stock only"
          checked={inStockOnly}
          onChange={() => update('in_stock', inStockOnly ? '' : '1')}
        />
        <CheckOption
          label="On sale"
          checked={onSaleOnly}
          onChange={() => update('on_sale', onSaleOnly ? '' : '1')}
        />
      </Section>

      {/* Condition */}
      {config.conditions && config.conditions.length > 0 && (
        <Section title="Condition">
          <div className="space-y-1">
            {config.conditions.map((c) => (
              <CheckOption
                key={c.value}
                label={c.label}
                checked={selectedConditions.has(c.value)}
                onChange={() => toggle('condition', c.value)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Brands */}
      {config.brands && config.brands.length > 0 && (
        <Section title="Brand">
          <div className="space-y-1">
            {config.brands.map((b) => (
              <CheckOption
                key={b.value}
                label={b.label}
                checked={selectedBrands.has(b.value)}
                onChange={() => toggle('brand', b.value)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Categories */}
      {config.categories && config.categories.length > 0 && (
        <Section title="Category">
          <div className="space-y-1">
            {config.categories.map((c) => (
              <CheckOption
                key={c.value}
                label={c.label}
                checked={selectedCategories.has(c.value)}
                onChange={() => toggle('category', c.value)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Storage */}
      {config.storages && config.storages.length > 0 && (
        <Section title="Storage">
          <div className="flex flex-wrap gap-2">
            {config.storages.map((s) => (
              <button
                key={s.value}
                onClick={() => toggle('storage', s.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedStorages.has(s.value)
                    ? 'border-brand-blue bg-brand-blue text-white'
                    : 'border-neutral-200 text-neutral-700 hover:border-brand-blue'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-neutral-100 pb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mb-2 flex w-full items-center justify-between text-sm font-semibold text-neutral-800"
        aria-expanded={open}
      >
        {title}
        {open ? (
          <ChevronUp className="h-4 w-4 text-neutral-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        )}
      </button>
      {open && children}
    </div>
  );
}

function CheckOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-neutral-300 accent-brand-blue"
      />
      <span className="text-sm text-neutral-700">{label}</span>
    </label>
  );
}

function RadioOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-0.5">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-brand-blue"
      />
      <span className="text-sm text-neutral-700">{label}</span>
    </label>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-medium text-brand-blue">
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="ml-0.5 rounded-full hover:text-brand-blue/70"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// ─── Desktop Sidebar ───────────────────────────────────────────────────────────

export function FilterSidebar({ config }: FilterPanelProps) {
  return (
    <aside
      aria-label="Filter products"
      className="hidden w-56 shrink-0 lg:block"
    >
      <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
        Filters
      </p>
      <FilterContent config={config} />
    </aside>
  );
}

// ─── Mobile Bottom Sheet trigger + panel ──────────────────────────────────────

export function FilterBottomSheet({ config }: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const params = useSearchParams();

  const activeCount = [
    params.get('brand'),
    params.get('category'),
    params.get('storage'),
    params.get('condition'),
    params.get('in_stock'),
    params.get('on_sale'),
  ].filter(Boolean).length;

  return (
    <>
      {/* Trigger button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="filter-sheet"
        className="lg:hidden flex items-center gap-2"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filters
        {activeCount > 0 && (
          <Badge variant="info" className="ml-1 h-4 min-w-4 px-1 text-[10px]">
            {activeCount}
          </Badge>
        )}
      </Button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sheet */}
      <div
        id="filter-sheet"
        role="dialog"
        aria-label="Filter products"
        aria-modal="true"
        className={`fixed bottom-0 left-0 right-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white px-5 pt-4 pb-8 shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900">Filters</h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close filters"
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <FilterContent config={config} onApply={() => setOpen(false)} />
        <div className="mt-6">
          <Button className="w-full" onClick={() => setOpen(false)}>
            Show results
          </Button>
        </div>
      </div>
    </>
  );
}
