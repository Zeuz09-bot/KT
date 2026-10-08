import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/modules/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { adminGetAllSettings, DEFAULT_TRUST_BAR } from '@/modules/content/repo';
import { TrustBarForm } from '@/components/admin/trust-bar-form';
import type { TrustBarItem } from '@/lib/contracts/content';

export const metadata: Metadata = {
  title: 'Trust Badges | Keraunous Admin',
};

export default async function AdminTrustBarPage() {
  await requireAdmin();
  const supabase = await createClient();

  const settings = await adminGetAllSettings(supabase);
  const rawTrustBar = settings['trust_bar'];

  const trustBar: TrustBarItem[] =
    Array.isArray(rawTrustBar) && rawTrustBar.length === 4
      ? (rawTrustBar as TrustBarItem[])
      : DEFAULT_TRUST_BAR;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3 pb-4 border-b border-border-default">
        <Link
          href="/admin/content"
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Trust Badges</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Configure the 4 reassurance items displayed below the homepage hero carousel.
          </p>
        </div>
      </div>

      <TrustBarForm initialTrustBar={trustBar} />
    </div>
  );
}
