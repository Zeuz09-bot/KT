import React from 'react';
import type { Metadata } from 'next';
import { requireAdmin } from '@/modules/auth/guards';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const metadata: Metadata = {
  title: 'Admin Console | Keraunous Tech Store',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireAdmin();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      <AdminHeader profile={profile} email={user.email} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
