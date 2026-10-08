'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Layers,
  Image as ImageIcon,
  Sliders,
  FileText,
  Plus,
  Send,
  ArrowLeft,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { StatusPill } from '@/components/admin/status-pill';
import { VariantRow } from '@/components/admin/variant-row';
import { ImageUploader, type UploadedImage } from '@/components/admin/image-uploader';
import { generateSlug } from '@/modules/catalog/slug';
import { checkPublishGuard } from '@/modules/catalog/publish-guard';
import {
  updateProductAction,
  publishProductAction,
  archiveProductAction,
  createVariantAction,
  updateVariantAction,
  deleteVariantAction,
  setPrimaryImageAction,
  deleteProductImageAction,
} from '@/modules/catalog/actions';
import type { AdminProductDetail } from '@/modules/catalog/admin-repo';

interface ProductEditorTabsProps {
  product: AdminProductDetail;
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

export function ProductEditorTabs({
  product: initialProduct,
  brands,
  categories,
}: ProductEditorTabsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<'basics' | 'variants' | 'images' | 'specs' | 'preview'>('basics');
  const [product, setProduct] = useState<AdminProductDetail>(initialProduct);

  // Basics Form State
  const [basics, setBasics] = useState({
    name: product.name,
    slug: product.slug,
    brandId: product.brandId,
    categoryId: product.categoryId,
    badge: product.badge,
    isFeatured: product.isFeatured,
    shortDescription: product.shortDescription ?? '',
    description: product.description ?? '',
  });

  // Specs Form State
  const [specs, setSpecs] = useState<Record<string, string>>({
    display: product.specs.display ?? '',
    screen_inches: product.specs.screen_inches ?? '',
    chip: product.specs.chip ?? '',
    rear_camera: product.specs.rear_camera ?? '',
    front_camera: product.specs.front_camera ?? '',
    battery: product.specs.battery ?? '',
    os: product.specs.os ?? '',
    network: product.specs.network ?? '',
    sim: product.specs.sim ?? '',
    in_the_box: product.specs.in_the_box ?? '',
  });

  // New variant inline form state
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [newVariant, setNewVariant] = useState<{
    storageGb: number;
    ramGb: number;
    color: string;
    colorHex: string;
    condition: 'brand_new' | 'uk_used' | 'open_box';
    priceNgn: number;
    compareAtPriceNgn: number | '';
    salePriceNgn: number | '';
    stockQty: number;
    lowStockThreshold: number;
    warrantyMonths: number;
  }>({
    storageGb: 256,
    ramGb: 8,
    color: 'Black',
    colorHex: '#1E1E1E',
    condition: 'brand_new',
    priceNgn: 1000000,
    compareAtPriceNgn: '',
    salePriceNgn: '',
    stockQty: 5,
    lowStockThreshold: 2,
    warrantyMonths: 12,
  });

  // Image states adapted for ImageUploader
  const [uploaderImages, setUploaderImages] = useState<UploadedImage[]>(
    product.images.map((img) => ({
      id: img.id,
      url: img.path,
      path: img.path,
      alt: img.alt,
      isPrimary: img.is_primary,
      status: 'idle',
    }))
  );

  // Check duplicate combinations for variants
  const duplicateCombinations = React.useMemo(() => {
    const keys = new Map<string, number>();
    for (const v of product.variants) {
      const key = `${v.storage_gb ?? ''}-${v.color ?? ''}-${v.condition}`;
      keys.set(key, (keys.get(key) ?? 0) + 1);
    }
    const duplicates: string[] = [];
    keys.forEach((count, key) => {
      if (count > 1) duplicates.push(key);
    });
    return duplicates;
  }, [product.variants]);

  // Publish Guard Evaluation
  const publishGuard = checkPublishGuard({
    name: basics.name,
    slug: basics.slug,
    variants: product.variants.map((v) => ({
      id: v.id,
      priceNgn: v.price_ngn,
      isActive: v.is_active,
    })),
    hasPrimaryImageWithAlt: product.images.some(
      (img) => img.is_primary && Boolean(img.alt?.trim())
    ),
  });

  // Save Basics & Specs
  const handleSaveBasicsAndSpecs = () => {
    startTransition(async () => {
      // Clean specs: remove empty strings
      const cleanedSpecs: Record<string, string> = {};
      Object.entries(specs).forEach(([k, v]) => {
        if (v.trim()) cleanedSpecs[k] = v.trim();
      });

      const res = await updateProductAction({
        id: product.id,
        name: basics.name,
        slug: basics.slug,
        brandId: basics.brandId,
        categoryId: basics.categoryId,
        badge: basics.badge,
        isFeatured: basics.isFeatured,
        shortDescription: basics.shortDescription || undefined,
        description: basics.description || undefined,
        specs: cleanedSpecs,
      });

      if (res.ok) {
        toast({ title: 'Product Saved', message: 'Details updated successfully.', variant: 'success' });
        router.refresh();
      } else {
        toast({ title: 'Save Failed', message: res.error.message, variant: 'error' });
      }
    });
  };

  // Publish Product
  const handlePublish = () => {
    startTransition(async () => {
      const res = await publishProductAction({ id: product.id });
      if (res.ok) {
        toast({ title: 'Product Published', message: 'Live on storefront.', variant: 'success' });
        setProduct((prev) => ({ ...prev, status: 'published' }));
        router.refresh();
      } else {
        toast({
          title: 'Cannot Publish',
          message: res.error.message,
          variant: 'error',
        });
      }
    });
  };

  // Archive Product
  const handleArchive = () => {
    if (!confirm('Archive this product? It will no longer appear on the customer storefront.')) return;
    startTransition(async () => {
      const res = await archiveProductAction({ id: product.id });
      if (res.ok) {
        toast({ title: 'Product Archived', message: 'Status set to archived.', variant: 'info' });
        setProduct((prev) => ({ ...prev, status: 'archived' }));
        router.refresh();
      } else {
        toast({ title: 'Error', message: res.error.message, variant: 'error' });
      }
    });
  };

  // Add Variant
  const handleCreateVariant = async () => {
    startTransition(async () => {
      const res = await createVariantAction({
        productId: product.id,
        storageGb: newVariant.storageGb || undefined,
        ramGb: newVariant.ramGb || undefined,
        color: newVariant.color || undefined,
        colorHex: newVariant.colorHex || undefined,
        condition: newVariant.condition,
        priceNgn: Number(newVariant.priceNgn),
        compareAtPriceNgn: newVariant.compareAtPriceNgn ? Number(newVariant.compareAtPriceNgn) : undefined,
        salePriceNgn: newVariant.salePriceNgn ? Number(newVariant.salePriceNgn) : undefined,
        stockQty: Number(newVariant.stockQty),
        lowStockThreshold: Number(newVariant.lowStockThreshold),
        warrantyMonths: Number(newVariant.warrantyMonths),
        isActive: true,
      });

      if (res.ok) {
        toast({ title: 'Variant Added', variant: 'success' });
        setIsAddingVariant(false);
        router.refresh();
      } else {
        toast({ title: 'Failed to Add Variant', message: res.error.message, variant: 'error' });
      }
    });
  };

  // Update Variant
  const handleUpdateVariant = async (data: Parameters<typeof updateVariantAction>[0]) => {
    const res = await updateVariantAction(data);
    if (res.ok) {
      toast({ title: 'Variant Updated', variant: 'success' });
      router.refresh();
    } else {
      toast({ title: 'Update Failed', message: res.error.message, variant: 'error' });
    }
  };

  // Delete Variant
  const handleDeleteVariant = async (id: string) => {
    const res = await deleteVariantAction({ id });
    if (res.ok) {
      toast({ title: 'Variant Deleted', variant: 'info' });
      setProduct((prev) => ({
        ...prev,
        variants: prev.variants.filter((v) => v.id !== id),
      }));
      router.refresh();
    } else {
      toast({ title: 'Delete Failed', message: res.error.message, variant: 'error' });
    }
  };

  // Set Primary Image
  const handleSetPrimaryImage = async (imageId: string) => {
    const res = await setPrimaryImageAction(product.id, imageId);
    if (res.ok) {
      toast({ title: 'Primary Image Updated', variant: 'success' });
      setProduct((prev) => ({
        ...prev,
        images: prev.images.map((img) => ({
          ...img,
          is_primary: img.id === imageId,
        })),
      }));
      router.refresh();
    }
  };

  // Delete Image
  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Delete this product image?')) return;
    const res = await deleteProductImageAction(product.id, imageId);
    if (res.ok) {
      toast({ title: 'Image Deleted', variant: 'info' });
      setProduct((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img.id !== imageId),
      }));
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/admin/products">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-neutral-500">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight">{product.name}</h1>
              <StatusPill status={product.status} />
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">/{product.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Link href={`/admin/products/${product.id}/preview`} target="_blank">
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
              <Eye className="w-4 h-4" /> Preview
            </Button>
          </Link>

          <Button
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={handleSaveBasicsAndSpecs}
            className="gap-1.5 text-xs"
          >
            <Save className="w-4 h-4" /> Save
          </Button>

          {product.status !== 'published' ? (
            <Button
              variant="primary"
              size="sm"
              disabled={isPending || !publishGuard.canPublish}
              onClick={handlePublish}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
              title={publishGuard.canPublish ? 'Publish product' : 'Fix requirements before publishing'}
            >
              <Send className="w-4 h-4" /> Publish
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={handleArchive}
              className="gap-1.5 text-xs text-neutral-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" /> Archive
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-neutral-200 bg-white px-4 rounded-xl shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('basics')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'basics'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <FileText className="w-4 h-4" /> Basics
        </button>

        <button
          onClick={() => setActiveTab('variants')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'variants'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Layers className="w-4 h-4" /> Variants & Pricing ({product.variants.length})
        </button>

        <button
          onClick={() => setActiveTab('images')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'images'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> Images ({product.images.length})
        </button>

        <button
          onClick={() => setActiveTab('specs')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'specs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Sliders className="w-4 h-4" /> Specifications
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'preview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Eye className="w-4 h-4" /> Preview & Checks
        </button>
      </div>

      {/* Tab 1: Basics */}
      {activeTab === 'basics' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={basics.name}
                onChange={(e) => {
                  setBasics({
                    ...basics,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  });
                }}
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={basics.slug}
                onChange={(e) => setBasics({ ...basics, slug: e.target.value })}
                className="w-full px-3.5 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-neutral-400 mt-1">
                Changing this creates an automatic redirect from the old URL.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Brand *</label>
              <select
                value={basics.brandId}
                onChange={(e) => setBasics({ ...basics, brandId: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
                Category *
              </label>
              <select
                value={basics.categoryId}
                onChange={(e) => setBasics({ ...basics, categoryId: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                value={basics.badge ?? ''}
                onChange={(e) =>
                  setBasics({
                    ...basics,
                    badge: (e.target.value as 'new' | 'best_seller' | 'hot' | 'limited' | '') || null,
                  })
                }
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                id="isFeatured"
                checked={basics.isFeatured}
                onChange={(e) => setBasics({ ...basics, isFeatured: e.target.checked })}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isFeatured" className="text-sm font-semibold text-neutral-800 cursor-pointer">
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
              value={basics.shortDescription}
              onChange={(e) => setBasics({ ...basics, shortDescription: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Quick one-line summary displayed on product cards"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
              Full Description
            </label>
            <textarea
              rows={5}
              value={basics.description}
              onChange={(e) => setBasics({ ...basics, description: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Plain text description of the device, highlights, and warranty details..."
            />
          </div>

          <div className="flex justify-end pt-3">
            <Button
              variant="primary"
              size="sm"
              disabled={isPending}
              onClick={handleSaveBasicsAndSpecs}
            >
              Save Basics
            </Button>
          </div>
        </div>
      )}

      {/* Tab 2: Variants & Pricing */}
      {activeTab === 'variants' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Product Variants</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Each combination of storage, RAM, color, and condition has its own price, stock, and SKU.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddingVariant(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="w-4 h-4" /> Add Variant
            </Button>
          </div>

          {/* Duplicate Combination Warning */}
          {duplicateCombinations.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Duplicate combinations detected!</span> Multiple variants have
                identical storage, color, and condition. Please differentiate or remove duplicates.
              </div>
            </div>
          )}

          {/* New Variant Inline Form */}
          {isAddingVariant && (
            <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200 space-y-4 text-xs">
              <div className="font-bold text-neutral-900 text-sm">New Variant</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Storage (GB)</label>
                  <input
                    type="number"
                    value={newVariant.storageGb}
                    onChange={(e) => setNewVariant({ ...newVariant, storageGb: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">RAM (GB)</label>
                  <input
                    type="number"
                    value={newVariant.ramGb}
                    onChange={(e) => setNewVariant({ ...newVariant, ramGb: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Color Name</label>
                  <input
                    type="text"
                    value={newVariant.color}
                    onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Color Hex</label>
                  <input
                    type="color"
                    value={newVariant.colorHex}
                    onChange={(e) => setNewVariant({ ...newVariant, colorHex: e.target.value })}
                    className="w-full h-8 rounded border border-neutral-300 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Condition</label>
                  <select
                    value={newVariant.condition}
                    onChange={(e) =>
                      setNewVariant({
                        ...newVariant,
                        condition: e.target.value as 'brand_new' | 'uk_used' | 'open_box',
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md"
                  >
                    <option value="brand_new">Brand New</option>
                    <option value="uk_used">UK Used</option>
                    <option value="open_box">Open Box</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Price (₦) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newVariant.priceNgn}
                    onChange={(e) => setNewVariant({ ...newVariant, priceNgn: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={newVariant.stockQty}
                    onChange={(e) => setNewVariant({ ...newVariant, stockQty: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Warranty (Months)</label>
                  <input
                    type="number"
                    min={0}
                    value={newVariant.warrantyMonths}
                    onChange={(e) => setNewVariant({ ...newVariant, warrantyMonths: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200">
                <Button variant="secondary" size="sm" onClick={() => setIsAddingVariant(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleCreateVariant} disabled={isPending}>
                  Add Variant
                </Button>
              </div>
            </div>
          )}

          {/* Variants List */}
          <div className="space-y-2.5">
            {product.variants.length === 0 ? (
              <div className="text-center py-10 text-neutral-400">
                No variants added yet. At least one active variant is required to publish.
              </div>
            ) : (
              product.variants.map((v) => (
                <VariantRow
                  key={v.id}
                  variant={v}
                  onUpdate={handleUpdateVariant}
                  onDelete={handleDeleteVariant}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Images */}
      {activeTab === 'images' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Product Images</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Upload WebP/JPEG/PNG images. Uploads are processed to WebP ≤250KB and EXIF metadata is stripped.
            </p>
          </div>

          <ImageUploader
            images={uploaderImages}
            productId={product.id}
            onChange={(newImgs) => setUploaderImages(newImgs)}
          />

          {/* Current Saved Images Grid */}
          <div className="pt-4 border-t border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-800 mb-3">Saved Gallery Images</h3>
            {product.images.length === 0 ? (
              <p className="text-xs text-neutral-400">No images saved for this product yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {product.images.map((img) => (
                  <div
                    key={img.id}
                    className="relative border rounded-xl overflow-hidden bg-neutral-50 group flex flex-col"
                  >
                    <div className="aspect-square w-full relative">
                      <NextImage src={img.path} alt={img.alt || ''} fill className="object-cover" sizes="200px" />
                      {img.is_primary && (
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="p-2.5 flex-1 flex flex-col justify-between text-xs bg-white border-t border-neutral-100">
                      <div className="truncate text-neutral-600 mb-2" title={img.alt}>
                        {img.alt || <span className="text-red-500 italic">No alt text</span>}
                      </div>
                      <div className="flex items-center justify-between gap-1 pt-2 border-t border-neutral-100">
                        {!img.is_primary && (
                          <button
                            onClick={() => handleSetPrimaryImage(img.id)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteImage(img.id)}
                          className="text-neutral-400 hover:text-red-600 ml-auto p-1"
                          title="Delete image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Specifications */}
      {activeTab === 'specs' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Technical Specifications</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Standard hardware and software specs displayed in the product specification table.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-neutral-800 block mb-1">Display</label>
              <input
                type="text"
                placeholder='e.g. 6.7" Super Retina XDR OLED, 120Hz'
                value={specs.display}
                onChange={(e) => setSpecs({ ...specs, display: e.target.value })}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-md"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-800 block mb-1">Screen Size (Inches)</label>
              <input
                type="text"
                placeholder='e.g. 6.7"'
                value={specs.screen_inches}
                onChange={(e) => setSpecs({ ...specs, screen_inches: e.target.value })}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-md"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-800 block mb-1">Processor / Chip</label>
              <input
                type="text"
                placeholder="e.g. Apple A17 Pro (3nm)"
                value={specs.chip}
                onChange={(e) => setSpecs({ ...specs, chip: e.target.value })}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-md"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-800 block mb-1">Rear Camera</label>
              <input
                type="text"
                placeholder="e.g. 48MP Main + 12MP Telephoto 5x + 12MP Ultra-wide"
                value={specs.rear_camera}
                onChange={(e) => setSpecs({ ...specs, rear_camera: e.target.value })}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-md"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-800 block mb-1">Front Camera</label>
              <input
                type="text"
                placeholder="e.g. 12MP TrueDepth"
                value={specs.front_camera}
                onChange={(e) => setSpecs({ ...specs, front_camera: e.target.value })}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-md"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-800 block mb-1">Battery</label>
              <input
                type="text"
                placeholder="e.g. 4,441 mAh with fast charging"
                value={specs.battery}
                onChange={(e) => setSpecs({ ...specs, battery: e.target.value })}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-md"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-800 block mb-1">Operating System</label>
              <input
                type="text"
                placeholder="e.g. iOS 18"
                value={specs.os}
                onChange={(e) => setSpecs({ ...specs, os: e.target.value })}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-md"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-800 block mb-1">Network</label>
              <input
                type="text"
                placeholder="e.g. 5G / 4G LTE"
                value={specs.network}
                onChange={(e) => setSpecs({ ...specs, network: e.target.value })}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-md"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-800 block mb-1">SIM Configuration</label>
              <input
                type="text"
                placeholder="e.g. Nano-SIM + eSIM"
                value={specs.sim}
                onChange={(e) => setSpecs({ ...specs, sim: e.target.value })}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-md"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-800 block mb-1">What&apos;s in the Box</label>
              <input
                type="text"
                placeholder="e.g. Device, USB-C Charge Cable, Documentation"
                value={specs.in_the_box}
                onChange={(e) => setSpecs({ ...specs, in_the_box: e.target.value })}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <Button
              variant="primary"
              size="sm"
              disabled={isPending}
              onClick={handleSaveBasicsAndSpecs}
            >
              Save Specifications
            </Button>
          </div>
        </div>
      )}

      {/* Tab 5: Preview & Publish Guard */}
      {activeTab === 'preview' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Pre-Publish Verification</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              The server enforces these rules before any product can transition to &apos;published&apos;.
            </p>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200">
              {basics.name ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <div>
                <div className="text-sm font-semibold text-neutral-800">Product Name</div>
                <div className="text-xs text-neutral-500">{basics.name || 'Missing name'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200">
              {basics.slug ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <div>
                <div className="text-sm font-semibold text-neutral-800">URL Slug</div>
                <div className="text-xs text-neutral-500">{basics.slug || 'Missing slug'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200">
              {product.variants.some((v) => v.is_active && v.price_ngn > 0) ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <div>
                <div className="text-sm font-semibold text-neutral-800">
                  Active Variant with Price &gt; 0
                </div>
                <div className="text-xs text-neutral-500">
                  {product.variants.filter((v) => v.is_active).length} active variant(s)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200">
              {product.images.some((i) => i.is_primary && Boolean(i.alt?.trim())) ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <div>
                <div className="text-sm font-semibold text-neutral-800">
                  Primary Image with Alt Text
                </div>
                <div className="text-xs text-neutral-500">
                  {product.images.some((i) => i.is_primary && Boolean(i.alt?.trim()))
                    ? 'Primary image configured with alt text'
                    : 'Requires one image set as primary with non-empty alt text'}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
            <div>
              {publishGuard.canPublish ? (
                <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Ready to publish
                </span>
              ) : (
                <span className="text-sm font-bold text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Incomplete: Resolve missing requirements above
                </span>
              )}
            </div>

            <Button
              variant="primary"
              size="md"
              disabled={isPending || !publishGuard.canPublish || product.status === 'published'}
              onClick={handlePublish}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="w-4 h-4" /> {product.status === 'published' ? 'Already Published' : 'Publish to Store'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
