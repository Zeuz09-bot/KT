import React from 'react';
import type { Metadata } from 'next';
import { requireAdmin } from '@/modules/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { BannerForm } from '@/components/admin/banner-form';

export const metadata: Metadata = {
  title: 'New Banner | Keraunous Admin',
};

export default async function AdminNewBannerPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .order('name', { ascending: true });

  return (
    <div className="py-2">
      <BannerForm products={products ?? []} />
    </div>
  );
}
