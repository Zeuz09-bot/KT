import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireOwner } from '@/modules/auth/guards';
import {
  adminListAllBrands,
  adminListAllCategories,
} from '@/modules/catalog/admin-repo';
import { BulkPriceForm } from '@/components/admin/bulk-price-form';

export const metadata: Metadata = {
  title: 'Bulk Price Tool | Keraunous Admin',
};

export default async function BulkPricePage() {
  // strictly owner-only: staff gets 403 FORBIDDEN
  await requireOwner();
  const supabase = await createClient();

  const [brands, categories] = await Promise.all([
    adminListAllBrands(supabase),
    adminListAllCategories(supabase),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <BulkPriceForm
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
