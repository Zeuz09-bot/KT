'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Plus,
  Copy,
  ExternalLink,
  Edit,
  Archive,
  Send,
  Check,
  X,
  Package,
} from 'lucide-react';
import { formatNgn } from '@/lib/money';
import { StatusPill } from '@/components/admin/status-pill';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import {
  publishProductAction,
  archiveProductAction,
  duplicateProductAction,
  updateInlineStockAction,
} from '@/modules/catalog/actions';
import type { AdminProductRow } from '@/modules/catalog/admin-repo';

interface ProductListTableProps {
  initialProducts: AdminProductRow[];
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

export function ProductListTable({
  initialProducts,
  brands,
  categories,
}: ProductListTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [products, setProducts] = useState<AdminProductRow[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Inline stock editing state
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState<number>(0);

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (searchTerm) {
      const match =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }
    if (selectedStatus !== 'all' && p.status !== selectedStatus) {
      return false;
    }
    if (selectedBrand !== 'all' && p.brand?.id !== selectedBrand) {
      return false;
    }
    if (selectedCategory !== 'all' && p.category?.id !== selectedCategory) {
      return false;
    }
    if (stockFilter === 'low' && (p.totalStock === 0 || p.totalStock > 5)) {
      return false;
    }
    if (stockFilter === 'out' && p.totalStock !== 0) {
      return false;
    }
    return true;
  });

  const handlePublish = (productId: string) => {
    startTransition(async () => {
      const res = await publishProductAction({ id: productId });
      if (res.ok) {
        toast({ title: 'Product Published', message: 'The product is now live on the storefront.', variant: 'success' });
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, status: 'published' } : p))
        );
        router.refresh();
      } else {
        toast({
          title: 'Cannot Publish Product',
          message: res.error.message || 'Validation failed',
          variant: 'error',
        });
      }
    });
  };

  const handleArchive = (productId: string) => {
    if (!confirm('Are you sure you want to archive this product? It will be hidden from the storefront.')) return;
    startTransition(async () => {
      const res = await archiveProductAction({ id: productId });
      if (res.ok) {
        toast({ title: 'Product Archived', message: 'The product is now archived.', variant: 'info' });
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, status: 'archived' } : p))
        );
        router.refresh();
      } else {
        toast({ title: 'Error', message: res.error.message, variant: 'error' });
      }
    });
  };

  const handleDuplicate = (productId: string) => {
    startTransition(async () => {
      const res = await duplicateProductAction({ id: productId });
      if (res.ok) {
        toast({ title: 'Product Duplicated', message: 'Draft clone created.', variant: 'success' });
        router.push(`/admin/products/${res.data.id}/edit`);
      } else {
        toast({ title: 'Duplicate Failed', message: res.error.message, variant: 'error' });
      }
    });
  };

  const startEditStock = (p: AdminProductRow) => {
    setEditingStockId(p.id);
    setEditingStockValue(p.totalStock);
  };

  const saveInlineStock = async (p: AdminProductRow) => {
    if (editingStockValue < 0) {
      toast({ title: 'Invalid Stock', message: 'Stock quantity cannot be negative', variant: 'error' });
      return;
    }
    // Update local state first
    setProducts((prev) =>
      prev.map((prod) => (prod.id === p.id ? { ...prod, totalStock: editingStockValue } : prod))
    );
    setEditingStockId(null);

    if (p.firstVariantId) {
      await updateInlineStockAction({ id: p.firstVariantId, stockQty: editingStockValue });
    }
    toast({ title: 'Stock Updated', message: `Stock set to ${editingStockValue}`, variant: 'success' });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by product name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Link href="/admin/products/new">
              <Button variant="primary" size="sm" className="gap-2 whitespace-nowrap">
                <Plus className="w-4 h-4" /> Add Product
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Selects & Chips */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-neutral-100 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-500 font-medium">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md font-medium text-neutral-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md font-medium text-neutral-700 focus:outline-none"
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md font-medium text-neutral-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                stockFilter === 'low'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              Low Stock (≤5)
            </button>
            <button
              type="button"
              onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                stockFilter === 'out'
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              Sold Out
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-800">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase font-semibold text-neutral-500">
              <tr>
                <th className="px-4 py-3.5 w-16">Image</th>
                <th className="px-4 py-3.5">Product</th>
                <th className="px-4 py-3.5">Brand / Category</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Price Range</th>
                <th className="px-4 py-3.5">Stock</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    <Package className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                    <p className="font-medium text-neutral-700">No products found</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Try clearing filters or search query, or add a new product.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Thumbnail */}
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center">
                          {p.primaryImage ? (
                            <div className="w-full h-full relative">
                              <NextImage
                                src={p.primaryImage}
                                alt={p.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          ) : (
                            <Package className="w-5 h-5 text-neutral-300" />
                          )}
                        </div>
                      </td>

                      {/* Product Name & Slug */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-neutral-900 line-clamp-1">{p.name}</div>
                        <div className="text-xs text-neutral-400 font-mono line-clamp-1">
                          /{p.slug}
                        </div>
                        {p.badge && (
                          <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                            {p.badge}
                          </span>
                        )}
                      </td>

                      {/* Brand & Category */}
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-neutral-800">
                          {p.brand?.name ?? '—'}
                        </div>
                        <div className="text-neutral-500">{p.category?.name ?? '—'}</div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusPill status={p.status} />
                      </td>

                      {/* Price Range */}
                      <td className="px-4 py-3 font-mono text-xs">
                        {p.minPriceNgn > 0 ? (
                          p.minPriceNgn === p.maxPriceNgn ? (
                            <span className="font-semibold text-neutral-900">
                              {formatNgn(p.minPriceNgn)}
                            </span>
                          ) : (
                            <span>
                              <span className="font-semibold text-neutral-900">
                                {formatNgn(p.minPriceNgn)}
                              </span>{' '}
                              – {formatNgn(p.maxPriceNgn)}
                            </span>
                          )
                        ) : (
                          <span className="text-neutral-400">No variants</span>
                        )}
                        <div className="text-[11px] text-neutral-400">
                          {p.variantsCount} {p.variantsCount === 1 ? 'variant' : 'variants'}
                        </div>
                      </td>

                      {/* Stock with inline edit */}
                      <td className="px-4 py-3">
                        {editingStockId === p.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              value={editingStockValue}
                              onChange={(e) => setEditingStockValue(parseInt(e.target.value) || 0)}
                              className="w-16 px-1.5 py-1 text-xs border border-blue-500 rounded font-mono focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => saveInlineStock(p)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingStockId(null)}
                              className="p-1 text-neutral-400 hover:bg-neutral-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => startEditStock(p)}
                            className="cursor-pointer group inline-flex items-center gap-1.5"
                            title="Click to edit stock inline"
                          >
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                p.totalStock === 0
                                  ? 'bg-red-50 text-red-700'
                                  : p.totalStock <= 5
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-green-50 text-green-800'
                              }`}
                            >
                              {p.totalStock} units
                            </span>
                            <Edit className="w-3 h-3 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/products/${p.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1.5 h-8 w-8 text-neutral-600 hover:text-neutral-900"
                              title="Edit product"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>

                          <Link href={`/admin/products/${p.id}/preview`} target="_blank">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1.5 h-8 w-8 text-neutral-600 hover:text-neutral-900"
                              title="Preview draft"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleDuplicate(p.id)}
                            className="p-1.5 h-8 w-8 text-neutral-600 hover:text-neutral-900"
                            title="Duplicate product"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>

                          {p.status !== 'published' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handlePublish(p.id)}
                              className="p-1.5 h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Publish product"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleArchive(p.id)}
                              className="p-1.5 h-8 w-8 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
                              title="Archive product"
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
