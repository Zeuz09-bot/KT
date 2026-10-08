'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { generateSlug } from '@/modules/catalog/slug';
import {
  createCategoryAction,
  updateCategoryAction,
  reorderCategoriesAction,
} from '@/modules/catalog/actions';
import type { Database } from '@/lib/database.types';

type CategoryRow = Database['public']['Tables']['categories']['Row'];

interface CategoriesManagerProps {
  initialCategories: CategoryRow[];
}

export function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<CategoryRow[]>(initialCategories);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<string>('');

  const openCreate = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setParentId('');
    setIsModalOpen(true);
  };

  const openEdit = (category: CategoryRow) => {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setParentId(category.parent_id ?? '');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: 'Validation Error', message: 'Category name is required', variant: 'error' });
      return;
    }

    startTransition(async () => {
      if (editingCategory) {
        const res = await updateCategoryAction({
          id: editingCategory.id,
          name: name.trim(),
          slug: slug.trim(),
          parentId: parentId ? parentId : null,
        });
        if (res.ok) {
          toast({ title: 'Category Updated', variant: 'success' });
          setIsModalOpen(false);
          router.refresh();
        } else {
          toast({ title: 'Error', message: res.error.message, variant: 'error' });
        }
      } else {
        const res = await createCategoryAction({
          name: name.trim(),
          slug: slug.trim(),
          parentId: parentId ? parentId : undefined,
          sortOrder: categories.length,
        });
        if (res.ok) {
          toast({ title: 'Category Created', variant: 'success' });
          setIsModalOpen(false);
          router.refresh();
        } else {
          toast({ title: 'Error', message: res.error.message, variant: 'error' });
        }
      }
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const updated = [...categories];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const items = updated.map((c, idx) => ({ id: c.id, sortOrder: idx }));
    setCategories(updated);

    startTransition(async () => {
      const res = await reorderCategoriesAction({ items });
      if (res.ok) {
        toast({ title: 'Order Saved', variant: 'success' });
        router.refresh();
      } else {
        toast({ title: 'Reorder Failed', message: res.error.message, variant: 'error' });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Categories</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Organize devices by categories (Phones, Tablets, Laptops, Accessories). Reorder with arrows.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm text-neutral-800">
          <thead className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase font-semibold text-neutral-500">
            <tr>
              <th className="px-4 py-3.5 w-16 text-center">Order</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Slug</th>
              <th className="px-4 py-3.5">Parent Category</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-neutral-400">
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((c, idx) => {
                const parent = categories.find((p) => p.id === c.parent_id);
                return (
                  <tr key={c.id} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          disabled={idx === 0 || isPending}
                          onClick={() => handleMove(idx, 'up')}
                          className="p-1 text-neutral-400 hover:text-neutral-800 disabled:opacity-20"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === categories.length - 1 || isPending}
                          onClick={() => handleMove(idx, 'down')}
                          className="p-1 text-neutral-400 hover:text-neutral-800 disabled:opacity-20"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-semibold text-neutral-900">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{c.slug}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{parent?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(c)}
                        className="p-1.5 h-8 w-8 text-neutral-600 hover:text-neutral-900"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h2 className="text-base font-bold text-neutral-900">
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) setSlug(generateSlug(e.target.value));
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  placeholder="e.g. Smart Phones, Tablets"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Parent Category</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                >
                  <option value="">None (Top Level)</option>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
              <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" disabled={isPending} onClick={handleSave}>
                Save Category
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
