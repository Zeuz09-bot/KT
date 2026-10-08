import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/modules/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { adminGetBanner } from '@/modules/content/repo';
import { BannerForm } from '@/components/admin/banner-form';

export const metadata: Metadata = {
  title: 'Edit Banner | Keraunous Admin',
};

interface EditBannerPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditBannerPage({ params }: EditBannerPageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [banner, { data: products }] = await Promise.all([
    adminGetBanner(supabase, id),
    supabase.from('products').select('id, name').order('name', { ascending: true }),
  ]);

  if (!banner) {
    notFound();
  }

  return (
    <div className="py-2">
      <BannerForm initialBanner={banner} products={products ?? []} />
    </div>
  );
}
