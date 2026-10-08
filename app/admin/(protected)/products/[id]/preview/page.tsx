import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import NextImage from 'next/image';
import { notFound } from 'next/navigation';
import { Edit, MessageSquare, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/modules/auth/guards';
import { adminGetProductById } from '@/modules/catalog/admin-repo';
import { Button } from '@/components/ui/button';
import { formatNgn } from '@/lib/money';

interface PreviewProductPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Draft Preview | Keraunous Admin',
};

export default async function PreviewProductPage({ params }: PreviewProductPageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const product = await adminGetProductById(supabase, id);
  if (!product) notFound();

  const primaryImage = product.images.find((i) => i.is_primary) ?? product.images[0];
  const lowestPrice =
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => v.price_ngn).filter((p) => p > 0))
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-amber-500 text-white px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>ADMIN DRAFT PREVIEW — This product is currently in {product.status.toUpperCase()} status.</span>
        </div>
        <Link href={`/admin/products/${product.id}/edit`}>
          <Button variant="secondary" size="sm" className="h-7 text-xs bg-white text-neutral-900 border-none">
            <Edit className="w-3.5 h-3.5 mr-1" /> Return to Editor
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery Preview */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center relative">
              {primaryImage ? (
                <NextImage
                  src={primaryImage.path}
                  alt={primaryImage.alt || ''}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <Package className="w-16 h-16 text-neutral-300" />
              )}
              {product.badge && (
                <span className="absolute top-4 left-4 uppercase font-bold text-xs tracking-wider px-2.5 py-1 rounded-full bg-blue-600 text-white shadow-xs">
                  {product.badge}
                </span>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img) => (
                  <div
                    key={img.id}
                    className={`w-16 h-16 rounded-xl border bg-neutral-50 overflow-hidden flex-shrink-0 cursor-pointer ${
                      img.is_primary ? 'border-blue-600 ring-2 ring-blue-100' : 'border-neutral-200'
                    }`}
                  >
                  <div className="w-full h-full relative">
                    <NextImage src={img.path} alt={img.alt || ''} fill className="object-cover" sizes="64px" />
                  </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details Preview */}
          <div className="space-y-6">
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-blue-600 mb-1">
                {product.brand?.name} · {product.category?.name}
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-neutral-900 tracking-tight">
                {product.name}
              </h1>
              {product.shortDescription && (
                <p className="text-sm text-neutral-600 mt-2">{product.shortDescription}</p>
              )}
            </div>

            {/* Price Preview */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <div className="text-xs text-neutral-500 font-medium">Starting from</div>
              <div className="text-2xl font-black text-neutral-900 font-mono">
                {lowestPrice > 0 ? formatNgn(lowestPrice) : 'Price Pending'}
              </div>
            </div>

            {/* Variants Preview */}
            {product.variants.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Available Variants ({product.variants.length})
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {product.variants.map((v) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-lg border border-neutral-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {v.color_hex && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-neutral-300"
                            style={{ backgroundColor: v.color_hex }}
                          />
                        )}
                        <span className="font-semibold text-neutral-800">
                          {v.storage_gb ? `${v.storage_gb}GB` : ''} {v.color ? `· ${v.color}` : ''}
                        </span>
                        <span className="capitalize px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 text-[10px]">
                          {v.condition.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="font-bold text-neutral-900 font-mono">
                        {formatNgn(v.price_ngn)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action CTA Preview */}
            <div className="pt-4 border-t border-neutral-200">
              <Button
                variant="whatsapp"
                size="lg"
                className="w-full gap-2 text-sm justify-center shadow-md opacity-90 cursor-default"
              >
                <MessageSquare className="w-5 h-5" /> Order on WhatsApp (Preview)
              </Button>
              <p className="text-[11px] text-neutral-400 text-center mt-2">
                Simulated WhatsApp handoff button — in preview mode.
              </p>
            </div>
          </div>
        </div>

        {/* Specifications Tab Preview */}
        {Object.keys(product.specs).length > 0 && (
          <div className="mt-12 pt-8 border-t border-neutral-200">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs">
              {Object.entries(product.specs).map(([key, val]) => (
                <div key={key} className="flex justify-between py-2 border-b border-neutral-100">
                  <span className="font-semibold text-neutral-500 uppercase">{key.replace('_', ' ')}</span>
                  <span className="font-medium text-neutral-900 text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
