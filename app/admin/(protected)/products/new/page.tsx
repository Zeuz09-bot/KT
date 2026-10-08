import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/modules/auth/guards';
import {
  adminListAllBrands,
  adminListAllCategories,
} from '@/modules/catalog/admin-repo';
import { NewProductForm } from './new-product-form';

export const metadata: Metadata = {
  title: 'New Product | Keraunous Admin',
};

export default async function NewProductPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [brands, categories] = await Promise.all([
    adminListAllBrands(supabase),
    adminListAllCategories(supabase),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <NewProductForm
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
