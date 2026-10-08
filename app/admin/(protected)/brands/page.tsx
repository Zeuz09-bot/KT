import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/modules/auth/guards';
import { adminListAllBrands } from '@/modules/catalog/admin-repo';
import { BrandsManager } from '@/components/admin/brand-form';

export const metadata: Metadata = {
  title: 'Brands | Keraunous Admin',
};

export default async function BrandsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const brands = await adminListAllBrands(supabase);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BrandsManager initialBrands={brands} />
    </div>
  );
}
