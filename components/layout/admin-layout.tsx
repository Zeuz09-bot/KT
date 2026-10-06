/**
 * AdminLayout — protected back-office layout with sidebar navigation, top bar, and role badge.
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Image as ImageIcon,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

export interface AdminLayoutProps {
  children: React.ReactNode;
  userRole?: 'owner' | 'staff';
  userEmail?: string;
  onSignOut?: () => void;
}

const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Media Library', href: '/admin/media', icon: ImageIcon },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Audit Log', href: '/admin/audit-logs', icon: Shield },
];

export function AdminLayout({
  children,
  userRole = 'owner',
  userEmail = 'admin@keraunous.local',
  onSignOut,
}: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col md:flex-row antialiased text-neutral-900 font-sans">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-brand-navy text-neutral-200 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo & close button */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-800">
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="rounded-card-sm bg-brand-blue px-2.5 py-1 text-xs font-black text-white tracking-wider">
                KT
              </span>
              <div>
                <span className="font-bold text-sm text-neutral-0 block leading-tight">
                  Keraunous Admin
                </span>
                <span className="text-[10px] text-neutral-400 font-medium block">
                  Store Management
                </span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-neutral-400 hover:text-neutral-0"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-card-sm text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-neutral-300 hover:bg-neutral-800/80 hover:text-white',
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer: Store link & User info */}
          <div className="p-4 border-t border-neutral-800 space-y-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-card-sm text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <span>View Public Store</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-semibold text-neutral-0 truncate">{userEmail}</p>
                <div className="mt-0.5">
                  <span
                    className={cn(
                      'inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider',
                      userRole === 'owner'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-blue-500/20 text-blue-300',
                    )}
                  >
                    {userRole}
                  </span>
                </div>
              </div>
              {onSignOut && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-neutral-400 hover:text-state-error hover:bg-neutral-800"
                  onClick={onSignOut}
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-neutral-0 border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-neutral-700"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-neutral-900 tracking-tight">
              Keraunous Control Centre
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={cn(
                'hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
                userRole === 'owner'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200',
              )}
            >
              Role: {userRole.toUpperCase()}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
