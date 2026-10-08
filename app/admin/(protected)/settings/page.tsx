import React from 'react';
import type { Metadata } from 'next';
import { requireOwner } from '@/modules/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { adminGetAllSettings } from '@/modules/content/repo';
import { SettingsForm } from '@/components/admin/settings-form';

export const metadata: Metadata = {
  title: 'Site Settings | Keraunous Admin',
};

export default async function AdminSettingsPage() {
  // STRICT: Owner access only (§U06 item 4)
  await requireOwner();
  const supabase = await createClient();

  const settings = await adminGetAllSettings(supabase);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Site &amp; Store Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Owner-only controls for WhatsApp order routing, store operating hours, official account name, and kill switches.
        </p>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
