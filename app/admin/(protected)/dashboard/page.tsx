import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/modules/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/modules/orders/admin-repo';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  ShoppingCart,
  Users,
  Clock,
  Truck,
  CreditCard,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard | Keraunous Admin',
};

export default async function AdminDashboardPage() {
  const { user, profile } = await requireAdmin();
  const supabase = await createClient();

  const stats = await getDashboardStats(supabase);

  return (
    <div className="space-y-6 max-w-6xl">
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
            Logged in as {user.email}. Store operations and status transitions are audited.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-800 text-xs font-medium w-fit">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span>AAL2 TOTP MFA Active</span>
        </div>
      </div>

      {/* Orders Operational Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Order Fulfillment Pipeline
          </h2>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-brand-blue hover:underline inline-flex items-center gap-1"
          >
            Open Orders Desk <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* New Orders */}
          <Link
            href="/admin/orders?status=new"
            className="bg-white border border-border-default rounded-xl p-5 shadow-xs hover:border-blue-300 transition-colors block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                New Incoming
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-text-primary">{stats.newOrders}</div>
            <div className="text-xs text-text-muted mt-1">Pending WhatsApp review</div>
          </Link>

          {/* Awaiting Payment */}
          <Link
            href="/admin/orders?status=confirmed"
            className="bg-white border border-border-default rounded-xl p-5 shadow-xs hover:border-purple-300 transition-colors block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Awaiting Payment
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-text-primary">{stats.awaitingPayment}</div>
            <div className="text-xs text-text-muted mt-1">
              {stats.expiringHolds > 0 ? (
                <span className="text-red-600 font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {stats.expiringHolds} hold expiring
                </span>
              ) : (
                'Stock committed on hold'
              )}
            </div>
          </Link>

          {/* To Ship */}
          <Link
            href="/admin/orders?status=paid"
            className="bg-white border border-border-default rounded-xl p-5 shadow-xs hover:border-indigo-300 transition-colors block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                To Ship / Dispatch
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-text-primary">{stats.toShip}</div>
            <div className="text-xs text-text-muted mt-1">Paid &amp; processing orders</div>
          </Link>

          {/* Delivered This Week */}
          <Link
            href="/admin/orders?status=delivered"
            className="bg-white border border-border-default rounded-xl p-5 shadow-xs hover:border-green-300 transition-colors block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Delivered This Week
              </span>
              <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-text-primary">{stats.deliveredThisWeek}</div>
            <div className="text-xs text-text-muted mt-1">Past 7 days completed</div>
          </Link>
        </div>
      </div>

      {/* Inventory & Stock Health */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
          Inventory Alerts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/products"
            className="bg-white border border-border-default rounded-xl p-4 shadow-xs hover:border-amber-300 transition-colors flex items-center justify-between"
          >
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-neutral-500">Low Stock Variants (&le; 2 left)</div>
              <div className="text-xl font-bold text-amber-700">{stats.lowStockVariants}</div>
            </div>
            <span className="text-xs font-medium text-brand-blue">View Catalog &rarr;</span>
          </Link>

          <Link
            href="/admin/products"
            className="bg-white border border-border-default rounded-xl p-4 shadow-xs hover:border-red-300 transition-colors flex items-center justify-between"
          >
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-neutral-500">Sold Out Variants (0 left)</div>
              <div className="text-xl font-bold text-red-700">{stats.soldOutVariants}</div>
            </div>
            <span className="text-xs font-medium text-brand-blue">Restock &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Admin Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {profile.role === 'owner' && (
          <Link
            href="/admin/staff"
            className="block p-5 bg-white border border-border-default rounded-xl hover:border-accent-orange/40 transition-colors shadow-xs group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-orange/10 text-accent-orange flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary group-hover:text-accent-orange transition-colors">
                  Staff &amp; Role Management &rarr;
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Invite employees, change roles, deactivate accounts, or reset MFA.
                </p>
              </div>
            </div>
          </Link>
        )}

        {profile.role === 'owner' && (
          <Link
            href="/admin/audit"
            className="block p-5 bg-white border border-border-default rounded-xl hover:border-accent-orange/40 transition-colors shadow-xs group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary group-hover:text-accent-orange transition-colors">
                  Security &amp; Audit Log &rarr;
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  View immutable audit trails for authentication, price changes, and orders.
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
