import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Layers, Flame, ShieldCheck, ArrowRight } from 'lucide-react';
import { requireAdmin } from '@/modules/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { adminListBanners, adminListCampaigns } from '@/modules/content/repo';

export const metadata: Metadata = {
  title: 'Site Content | Keraunous Admin',
};

export default async function AdminContentHubPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [banners, campaigns] = await Promise.all([
    adminListBanners(supabase),
    adminListCampaigns(supabase),
  ]);

  const activeBannersCount = banners.filter((b) => b.is_active).length;
  const activeCampaign = campaigns.find((c) => c.is_active && new Date(c.ends_at) > new Date());

  const sections = [
    {
      title: 'Banners & Carousels',
      description: 'Manage homepage hero carousels and promotional feature banners.',
      href: '/admin/content/banners',
      icon: Layers,
      badge: `${activeBannersCount} active (${banners.length} total)`,
      color: 'bg-blue-50 text-brand-blue',
    },
    {
      title: 'Flash Sale Campaign',
      description: 'Configure real scheduled promotional countdowns and urgency strips.',
      href: '/admin/content/campaign',
      icon: Flame,
      badge: activeCampaign ? 'Campaign Live' : 'No Active Campaign',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      title: 'Trust Badges',
      description: 'Edit the 4 storefront trust badges (genuine products, delivery, warranty).',
      href: '/admin/content/trust-bar',
      icon: ShieldCheck,
      badge: '4 Badges Active',
      color: 'bg-emerald-50 text-emerald-600',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Site Content</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Customize homepage messaging, promotional banners, and trust promises without writing code.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group p-6 bg-white rounded-xl border border-border-default shadow-xs hover:shadow-md hover:border-brand-blue transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${section.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">
                    {section.badge}
                  </span>
                </div>

                <div>
                  <h2 className="text-base font-bold text-text-primary group-hover:text-brand-blue transition-colors">
                    {section.title}
                  </h2>
                  <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="pt-6 flex items-center gap-1 text-xs font-semibold text-brand-blue group-hover:translate-x-0.5 transition-transform">
                Manage Section
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
