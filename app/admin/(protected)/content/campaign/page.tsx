import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/modules/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { adminListCampaigns } from '@/modules/content/repo';
import { CampaignForm } from '@/components/admin/campaign-form';

export const metadata: Metadata = {
  title: 'Flash Sale Campaign | Keraunous Admin',
};

export default async function AdminCampaignPage() {
  await requireAdmin();
  const supabase = await createClient();

  const campaigns = await adminListCampaigns(supabase);
  // Pick currently active or most recent campaign
  const activeCampaign =
    campaigns.find((c) => c.is_active && new Date(c.ends_at) > new Date()) ??
    campaigns[0] ??
    null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3 pb-4 border-b border-border-default">
        <Link
          href="/admin/content"
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Flash Sale Campaign</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Configure promotional countdowns and urgency banners on the storefront.
          </p>
        </div>
      </div>

      <CampaignForm initialCampaign={activeCampaign} />
    </div>
  );
}
