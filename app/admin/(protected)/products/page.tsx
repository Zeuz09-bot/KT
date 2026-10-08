import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/modules/auth/guards';
import {
  adminListProducts,
  adminListAllBrands,
  adminListAllCategories,
} from '@/modules/catalog/admin-repo';
import { ProductListTable } from '@/components/admin/product-list-table';

export const metadata: Metadata = {
  title: 'Products | Keraunous Admin',
};

export default async function AdminProductsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ products }, brands, categories] = await Promise.all([
    adminListProducts(supabase),
    adminListAllBrands(supabase),
    adminListAllCategories(supabase),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Products</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage catalogue items, stock, variants, and storefront visibility.
          </p>
        </div>
      </div>

      <ProductListTable
        initialProducts={products}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
