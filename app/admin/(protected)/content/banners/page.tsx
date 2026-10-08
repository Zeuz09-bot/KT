import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Edit2, Layers, Calendar, ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/modules/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { adminListBanners } from '@/modules/content/repo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Banners | Keraunous Admin',
};

export default async function AdminBannersListPage() {
  await requireAdmin();
  const supabase = await createClient();
  const banners = await adminListBanners(supabase);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/content"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Banners &amp; Carousels</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Manage promotional visuals, hero carousels, and banner click destinations.
            </p>
          </div>
        </div>

        <Link href="/admin/content/banners/new">
          <Button variant="primary" size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Banner
          </Button>
        </Link>
      </div>

      {banners.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-border-default space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-text-primary">No banners found</h2>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Create your first hero banner to showcase products on the homepage.
          </p>
          <Link href="/admin/content/banners/new" className="inline-block pt-2">
            <Button variant="primary" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Create Hero Banner
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border-default shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-border-default text-text-secondary font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Banner</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4 text-center">Order</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {banners.map((banner) => {
                  const now = new Date();
                  const isScheduled = banner.starts_at && new Date(banner.starts_at) > now;
                  const isExpired = banner.ends_at && new Date(banner.ends_at) <= now;

                  return (
                    <tr key={banner.id} className="hover:bg-neutral-50/75 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-10 rounded bg-neutral-100 overflow-hidden shrink-0 border border-border-default">
                            {banner.image_path ? (
                              <Image
                                src={banner.image_path}
                                alt={banner.title}
                                fill
                                className="object-cover"
                                unoptimized={banner.image_path.startsWith('http')}
                              />
                            ) : null}
                          </div>
                          <div>
                            {banner.eyebrow && (
                              <span className="block text-[10px] font-semibold text-brand-blue uppercase tracking-wider">
                                {banner.eyebrow}
                              </span>
                            )}
                            <span className="font-semibold text-text-primary block text-sm">
                              {banner.title}
                            </span>
                            {banner.subtitle && (
                              <span className="text-text-muted line-clamp-1 max-w-xs text-[11px]">
                                {banner.subtitle}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={banner.type === 'hero' ? 'info' : 'generic'}
                          className="capitalize text-[10px] py-0 px-2"
                        >
                          {banner.type}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        {banner.cta_href ? (
                          <span className="font-mono text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded text-[11px]">
                            {banner.cta_href}
                          </span>
                        ) : (
                          <span className="text-text-muted">No link</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isExpired ? (
                          <span className="text-red-600 font-medium text-[11px] flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Expired
                          </span>
                        ) : isScheduled ? (
                          <span className="text-amber-600 font-medium text-[11px] flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Scheduled
                          </span>
                        ) : (
                          <span className="text-green-700 font-medium text-[11px]">
                            Always Live
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-medium">
                        {banner.sort_order}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {banner.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
                            Disabled
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/content/banners/${banner.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit2 className="w-3.5 h-3.5 text-text-secondary" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
