import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/modules/auth/guards';
import {
  adminGetProductById,
  adminListAllBrands,
  adminListAllCategories,
} from '@/modules/catalog/admin-repo';
import { ProductEditorTabs } from '@/components/admin/product-editor/product-editor-tabs';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const product = await adminGetProductById(supabase, id);

  return {
    title: product ? `Edit ${product.name} | Keraunous Admin` : 'Product Not Found',
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [product, brands, categories] = await Promise.all([
    adminGetProductById(supabase, id),
    adminListAllBrands(supabase),
    adminListAllCategories(supabase),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ProductEditorTabs
        product={product}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
