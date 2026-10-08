/**
 * Keraunous Tech Store — Bulk Price Math & CSV Parsing (U05)
 *
 * Pure functions for bulk price adjustments and CSV price import.
 * No database calls.
 */

import { CsvPriceRowSchema, type CsvPriceRow } from '@/lib/contracts/catalog';

export type PriceOperation = 'increase_pct' | 'decrease_pct';

/**
 * Calculates new price after applying percentage change and optional rounding.
 * Guarantee: result is always an integer >= 1.
 */
export function applyPriceChange(
  priceNgn: number,
  operation: PriceOperation,
  value: number,
  roundTo?: number
): number {
  const multiplier = operation === 'increase_pct' ? 1 + value / 100 : 1 - value / 100;
  const raw = priceNgn * multiplier;

  let rounded: number;
  if (roundTo && roundTo > 0) {
    rounded = Math.round(raw / roundTo) * roundTo;
  } else {
    rounded = Math.round(raw);
  }

  // Price must never fall below 1 Naira
  return Math.max(1, rounded);
}

export interface BulkPreviewInputVariant {
  id: string;
  sku: string;
  priceNgn: number;
}

export interface BulkPreviewRow {
  id: string;
  sku: string;
  oldPriceNgn: number;
  newPriceNgn: number;
}

/**
 * Computes preview rows for a list of variants.
 */
export function computeBulkPreview(
  variants: BulkPreviewInputVariant[],
  operation: PriceOperation,
  value: number,
  roundTo?: number
): BulkPreviewRow[] {
  return variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    oldPriceNgn: variant.priceNgn,
    newPriceNgn: applyPriceChange(variant.priceNgn, operation, value, roundTo),
  }));
}

export interface CsvParseResult {
  rows: CsvPriceRow[];
  errors: Array<{ line?: number; message: string }>;
}

/**
 * Parses and validates CSV price import.
 * Expected header: sku,price_ngn
 */
export function parseCsvPriceRows(csvText: string): CsvParseResult {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const rows: CsvPriceRow[] = [];
  const errors: Array<{ line?: number; message: string }> = [];

  if (lines.length === 0) {
    return { rows: [], errors: [{ message: 'CSV file is empty' }] };
  }

  // Header validation
  const headerParts = lines[0].split(',').map((h) => h.trim().toLowerCase());
  if (headerParts.length < 2 || headerParts[0] !== 'sku' || headerParts[1] !== 'price_ngn') {
    return {
      rows: [],
      errors: [{ line: 1, message: 'Invalid CSV header. Expected: sku,price_ngn' }],
    };
  }

  const seenSkus = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1;
    const parts = lines[i].split(',').map((p) => p.trim());
    if (parts.length < 2) {
      errors.push({ line: lineNumber, message: `Line ${lineNumber}: Invalid column count` });
      continue;
    }

    const sku = parts[0];
    const rawPrice = parts[1];
    const numPrice = Number(rawPrice);

    if (seenSkus.has(sku)) {
      errors.push({ line: lineNumber, message: `Line ${lineNumber}: Duplicate SKU "${sku}" found` });
      continue;
    }
    seenSkus.add(sku);

    const validation = CsvPriceRowSchema.safeParse({
      sku,
      priceNgn: isNaN(numPrice) ? rawPrice : numPrice,
    });

    if (!validation.success) {
      errors.push({
        line: lineNumber,
        message: `Line ${lineNumber} (${sku}): ${validation.error.errors.map((e) => e.message).join(', ')}`,
      });
      continue;
    }

    rows.push(validation.data);
  }

  return { rows, errors };
}
