'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { generateSlug } from '@/modules/catalog/slug';
import { createProductAction } from '@/modules/catalog/actions';

interface NewProductFormProps {
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

export function NewProductForm({ brands, categories }: NewProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [brandId, setBrandId] = useState(brands[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [badge, setBadge] = useState<'new' | 'best_seller' | 'hot' | 'limited' | ''>('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(generateSlug(val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Validation Error', message: 'Product name is required', variant: 'error' });
      return;
    }
    if (!brandId) {
      toast({ title: 'Validation Error', message: 'Please select a brand', variant: 'error' });
      return;
    }
    if (!categoryId) {
      toast({ title: 'Validation Error', message: 'Please select a category', variant: 'error' });
      return;
    }

    startTransition(async () => {
      const res = await createProductAction({
        name: name.trim(),
        slug: slug.trim(),
        brandId,
        categoryId,
        badge: badge || undefined,
        isFeatured,
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
      });

      if (res.ok) {
        toast({ title: 'Product Created', message: 'Continue by adding variants and images.', variant: 'success' });
        router.push(`/admin/products/${res.data.id}/edit`);
      } else {
        toast({ title: 'Creation Failed', message: res.error.message, variant: 'error' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <Link href="/admin/products">
            <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 text-neutral-500">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Create New Product</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Enter product basics. You will add variants and gallery images next.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Product Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Apple iPhone 15 Pro Max"
            className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-800 mb-1.5">URL Slug *</label>
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-3.5 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Brand *</label>
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Category *</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Badge</label>
          <select
            value={badge}
            onChange={(e) => setBadge(e.target.value as '' | 'new' | 'best_seller' | 'hot' | 'limited')}
            className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">None</option>
            <option value="new">New</option>
            <option value="best_seller">Best Seller</option>
            <option value="hot">Hot</option>
            <option value="limited">Limited</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="featured"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="featured" className="text-sm font-semibold text-neutral-800 cursor-pointer">
            Feature on Homepage
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
          Short Description (max 200 chars)
        </label>
        <input
          type="text"
          maxLength={200}
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="Quick summary shown on cards"
          className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Description</label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed device description..."
          className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg"
        />
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
        <Link href="/admin/products">
          <Button type="button" variant="secondary" size="md">
            Cancel
          </Button>
        </Link>
        <Button type="submit" variant="primary" size="md" disabled={isPending} className="gap-2">
          <Sparkles className="w-4 h-4" /> Create & Edit Details
        </Button>
      </div>
    </form>
  );
}
