import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/modules/auth/guards';
import { adminListAllCategories } from '@/modules/catalog/admin-repo';
import { CategoriesManager } from '@/components/admin/category-form';

export const metadata: Metadata = {
  title: 'Categories | Keraunous Admin',
};

export default async function CategoriesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const categories = await adminListAllCategories(supabase);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <CategoriesManager initialCategories={categories} />
    </div>
  );
}
