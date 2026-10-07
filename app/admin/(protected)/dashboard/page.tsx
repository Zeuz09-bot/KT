import React from 'react';
import type { Metadata } from 'next';
import { requireAdmin } from '@/modules/auth/guards';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Package, ShoppingCart, Users, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard | Keraunous Admin',
};

export default async function AdminDashboardPage() {
  const { user, profile } = await requireAdmin();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Welcome back, {profile.displayName}
            </h1>
            <Badge
              variant={profile.role === 'owner' ? 'bestseller' : 'generic'}
              className="capitalize"
            >
              {profile.role}
            </Badge>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Logged in as {user.email}. Administrative operations are audited.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-800 text-xs font-medium w-fit">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span>AAL2 TOTP MFA Active</span>
        </div>
      </div>

      {/* Overview Stat Cards (Scaffolding for U05 & U11) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-border-default rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Active Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-text-primary">0</div>
          <div className="text-xs text-text-muted mt-1">Ready for U11 pipeline</div>
        </div>

        <div className="bg-white border border-border-default rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Published Products
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-text-primary">5</div>
          <div className="text-xs text-text-muted mt-1">Seed catalogue active</div>
        </div>

        <div className="bg-white border border-border-default rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Staff Accounts
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-text-primary">1</div>
          <div className="text-xs text-text-muted mt-1">Owner account active</div>
        </div>

        <div className="bg-white border border-border-default rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Session Lifetime
            </span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-text-primary">8h</div>
          <div className="text-xs text-text-muted mt-1">Enforced with AAL2</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profile.role === 'owner' && (
          <a
            href="/admin/staff"
            className="block p-5 bg-white border border-border-default rounded-xl hover:border-accent-orange/40 transition-colors shadow-xs group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-orange/10 text-accent-orange flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary group-hover:text-accent-orange transition-colors">
                  Staff & Role Management →
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Invite employees, change roles, deactivate accounts, or reset MFA.
                </p>
              </div>
            </div>
          </a>
        )}

        {profile.role === 'owner' && (
          <a
            href="/admin/audit"
            className="block p-5 bg-white border border-border-default rounded-xl hover:border-accent-orange/40 transition-colors shadow-xs group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary group-hover:text-accent-orange transition-colors">
                  Security & Audit Log →
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  View immutable audit trails for authentication, price changes, and orders.
                </p>
              </div>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}
