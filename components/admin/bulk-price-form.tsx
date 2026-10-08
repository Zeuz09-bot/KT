'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Percent,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { formatNgn } from '@/lib/money';
import { parseCsvPriceRows } from '@/modules/catalog/bulk-price';
import {
  previewBulkPriceAction,
  applyBulkPriceAction,
  importCsvPricesAction,
} from '@/modules/catalog/actions';
import type { BulkPricePreviewRow } from '@/lib/contracts/catalog';

interface BulkPriceFormProps {
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

export function BulkPriceForm({ brands, categories }: BulkPriceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<'adjust' | 'csv'>('adjust');

  // Bulk Adjust State
  const [scope, setScope] = useState<'brand' | 'category' | 'condition'>('brand');
  const [scopeId, setScopeId] = useState<string>(brands[0]?.id ?? '');
  const [condition, setCondition] = useState<'brand_new' | 'uk_used' | 'open_box'>('brand_new');
  const [operation, setOperation] = useState<'increase_pct' | 'decrease_pct'>('increase_pct');
  const [percentage, setPercentage] = useState<number>(10);
  const [roundTo, setRoundTo] = useState<500 | 1000 | 5000 | undefined>(1000);

  const [previewRows, setPreviewRows] = useState<BulkPricePreviewRow[] | null>(null);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);

  // CSV Import State
  const [csvParsed, setCsvParsed] = useState<{
    rows: Array<{ sku: string; priceNgn: number }>;
    errors: Array<{ line?: number; message: string }>;
  } | null>(null);

  const handlePreview = () => {
    if (percentage <= 0 || percentage > 100) {
      toast({ title: 'Invalid Percentage', message: 'Percentage must be between 1 and 100', variant: 'error' });
      return;
    }

    startTransition(async () => {
      setPreviewRows(null);
      setAppliedCount(null);

      const res = await previewBulkPriceAction({
        scope,
        scopeId: scope !== 'condition' ? scopeId : undefined,
        condition: scope === 'condition' ? condition : undefined,
        operation,
        value: percentage,
        roundTo,
      });

      if (res.ok) {
        setPreviewRows(res.data);
        if (res.data.length === 0) {
          toast({ title: 'No Matching Variants', message: 'No variants found for the selected scope.', variant: 'info' });
        } else {
          toast({ title: 'Preview Ready', message: `${res.data.length} variants found.`, variant: 'success' });
        }
      } else {
        toast({ title: 'Preview Failed', message: res.error.message, variant: 'error' });
      }
    });
  };

  const handleApply = () => {
    if (!previewRows || previewRows.length === 0) return;
    if (!confirm(`Are you sure you want to update prices for ${previewRows.length} variant(s)? This runs in a single audited transaction.`)) {
      return;
    }

    startTransition(async () => {
      const res = await applyBulkPriceAction({
        scope,
        scopeId: scope !== 'condition' ? scopeId : undefined,
        condition: scope === 'condition' ? condition : undefined,
        operation,
        value: percentage,
        roundTo,
      });

      if (res.ok) {
        toast({ title: 'Bulk Pricing Applied', message: `Updated ${res.data.updatedCount} variant(s).`, variant: 'success' });
        setAppliedCount(res.data.updatedCount);
        setPreviewRows(null);
        router.refresh();
      } else {
        toast({ title: 'Apply Failed', message: res.error.message, variant: 'error' });
      }
    });
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseCsvPriceRows(content);
      setCsvParsed(parsed);
    };
    reader.readAsText(file);
  };

  const handleApplyCsv = () => {
    if (!csvParsed || csvParsed.rows.length === 0) return;

    startTransition(async () => {
      const res = await importCsvPricesAction(csvParsed.rows);
      if (res.ok) {
        toast({
          title: 'CSV Prices Imported',
          message: `Successfully updated ${res.data.updatedCount} prices.${
            res.data.notFoundSkus.length > 0 ? ` ${res.data.notFoundSkus.length} SKUs not found.` : ''
          }`,
          variant: 'success',
        });
        setCsvParsed(null);
        router.refresh();
      } else {
        toast({ title: 'Import Failed', message: res.error.message, variant: 'error' });
      }
    });
  };

  const downloadSampleCsv = () => {
    const sample = 'sku,price_ngn\nIPH-15PM-256-NAT,1650000\nSAM-S25U-512-TI,1550000\n';
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_prices.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Bulk Price Tool</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Owner-only utility to batch adjust prices by percentage or import pricing via CSV spreadsheet.
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 mt-6 border-b border-neutral-100 pb-2">
          <button
            onClick={() => setActiveTab('adjust')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'adjust'
                ? 'bg-blue-50 text-blue-700'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Adjust by Percentage
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'csv'
                ? 'bg-blue-50 text-blue-700'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            CSV Export / Import
          </button>
        </div>
      </div>

      {/* Adjust by Percentage Tab */}
      {activeTab === 'adjust' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Scope */}
            <div>
              <label className="font-semibold text-neutral-800 block mb-1.5">Scope</label>
              <select
                value={scope}
                onChange={(e) => {
                  const s = e.target.value as 'brand' | 'category' | 'condition';
                  setScope(s);
                  if (s === 'brand') setScopeId(brands[0]?.id ?? '');
                  if (s === 'category') setScopeId(categories[0]?.id ?? '');
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="brand">By Brand</option>
                <option value="category">By Category</option>
                <option value="condition">By Condition</option>
              </select>
            </div>

            {/* Scope Target */}
            <div>
              <label className="font-semibold text-neutral-800 block mb-1.5">Target</label>
              {scope === 'brand' && (
                <select
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}

              {scope === 'category' && (
                <select
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}

              {scope === 'condition' && (
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as 'brand_new' | 'uk_used' | 'open_box')}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                >
                  <option value="brand_new">Brand New</option>
                  <option value="uk_used">UK Used</option>
                  <option value="open_box">Open Box</option>
                </select>
              )}
            </div>

            {/* Operation & Percentage */}
            <div>
              <label className="font-semibold text-neutral-800 block mb-1.5">Operation</label>
              <div className="flex gap-2">
                <select
                  value={operation}
                  onChange={(e) => setOperation(e.target.value as 'increase_pct' | 'decrease_pct')}
                  className="w-2/3 px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                >
                  <option value="increase_pct">+ Increase %</option>
                  <option value="decrease_pct">− Decrease %</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={percentage}
                  onChange={(e) => setPercentage(Number(e.target.value))}
                  className="w-1/3 px-2 py-2 border border-neutral-300 rounded-lg text-sm text-center font-bold"
                />
              </div>
            </div>

            {/* Rounding Mode */}
            <div>
              <label className="font-semibold text-neutral-800 block mb-1.5">Rounding</label>
              <select
                value={roundTo ?? 'none'}
                onChange={(e) => {
                  const val = e.target.value;
                  setRoundTo(val === 'none' ? undefined : (Number(val) as 500 | 1000 | 5000));
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="none">No Rounding (Exact)</option>
                <option value="500">Nearest ₦500</option>
                <option value="1000">Nearest ₦1,000</option>
                <option value="5000">Nearest ₦5,000</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="md"
              disabled={isPending}
              onClick={handlePreview}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Preview Changes
            </Button>
          </div>

          {/* Result Alert */}
          {appliedCount !== null && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>
                Successfully updated <strong>{appliedCount}</strong> variant prices! Changes are now live.
              </span>
            </div>
          )}

          {/* Preview Table */}
          {previewRows && (
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Preview Changes ({previewRows.length} variants found)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Review old vs new prices before applying to the database.
                  </p>
                </div>
                {previewRows.length > 0 && (
                  <Button
                    variant="primary"
                    size="md"
                    disabled={isPending}
                    onClick={handleApply}
                    className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                  >
                    Apply All Changes
                  </Button>
                )}
              </div>

              <div className="rounded-xl border border-neutral-200 overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 uppercase font-semibold text-neutral-500 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3 text-right">Current Price</th>
                      <th className="px-4 py-3 text-center">→</th>
                      <th className="px-4 py-3 text-right">New Price</th>
                      <th className="px-4 py-3 text-right">Diff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {previewRows.map((row) => {
                      const diff = row.newPriceNgn - row.oldPriceNgn;
                      return (
                        <tr key={row.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-2.5 font-semibold text-neutral-900">
                            {row.productName}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-neutral-500">{row.sku}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-neutral-600">
                            {formatNgn(row.oldPriceNgn)}
                          </td>
                          <td className="px-4 py-2.5 text-center text-neutral-400">→</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-neutral-900">
                            {formatNgn(row.newPriceNgn)}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right font-mono font-semibold ${
                              diff >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {diff >= 0 ? `+${formatNgn(diff)}` : `-${formatNgn(Math.abs(diff))}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CSV Import Tab */}
      {activeTab === 'csv' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Import Prices from CSV</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Upload a CSV spreadsheet with columns <code className="font-mono">sku,price_ngn</code> to
                update prices in bulk.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={downloadSampleCsv}
              className="gap-1.5 text-xs"
            >
              <Download className="w-4 h-4" /> Download Sample CSV
            </Button>
          </div>

          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center space-y-3">
            <Upload className="w-8 h-8 mx-auto text-neutral-400" />
            <div className="text-sm font-medium text-neutral-700">
              Drag & drop your CSV file here, or browse
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              className="text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Validation Errors */}
          {csvParsed && csvParsed.errors.length > 0 && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-1 text-xs text-red-800">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                CSV Parsing Errors ({csvParsed.errors.length}):
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                {csvParsed.errors.map((e, idx) => (
                  <li key={idx}>{e.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Parsed Valid Rows */}
          {csvParsed && csvParsed.rows.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-900">
                  Ready to Import: {csvParsed.rows.length} valid row(s)
                </h3>
                <Button
                  variant="primary"
                  size="md"
                  disabled={isPending}
                  onClick={handleApplyCsv}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Import and Apply Prices
                </Button>
              </div>

              <div className="rounded-xl border border-neutral-200 overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 uppercase font-semibold text-neutral-500 sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5">SKU</th>
                      <th className="px-4 py-2.5 text-right">New Price (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {csvParsed.rows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 font-mono text-neutral-800">{row.sku}</td>
                        <td className="px-4 py-2 text-right font-mono font-bold text-neutral-900">
                          {formatNgn(row.priceNgn)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
