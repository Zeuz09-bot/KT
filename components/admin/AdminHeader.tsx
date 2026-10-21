'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  LogOut,
  Package,
  Tag,
  FolderTree,
  Percent,
  ShieldCheck,
  Layers,
  Settings,
  ShoppingCart,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { logoutAction } from '@/modules/auth/actions';
import { Badge } from '@/components/ui/badge';
import { KeraunosLogo } from '@/components/ui/keraunos-logo';
import type { AdminUserProfile } from '@/modules/auth/repo';

interface AdminHeaderProps {
  profile: AdminUserProfile;
  email?: string;
}

export function AdminHeader({ profile, email }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [catalogOpen, setCatalogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const catalogRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (catalogRef.current && !catalogRef.current.contains(event.target as Node)) {
        setCatalogOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
    setCatalogOpen(false);
    setSettingsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logoutAction();
    router.push('/admin/login');
    router.refresh();
  };

  const isCatalogActive =
    pathname.startsWith('/admin/brands') ||
    pathname.startsWith('/admin/categories') ||
    pathname.startsWith('/admin/tools/bulk-price');

  const isSettingsActive =
    pathname.startsWith('/admin/settings') ||
    pathname.startsWith('/admin/staff') ||
    pathname.startsWith('/admin/audit');

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-border-default shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Primary Navigation */}
          <div className="flex items-center gap-4 lg:gap-6">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 font-bold tracking-tight text-base sm:text-lg group shrink-0"
            >
              <KeraunosLogo size="xs" variant="primary" />
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-neutral-100 text-neutral-600 font-semibold tracking-wider">
                ADMIN
              </span>
            </Link>

            {/* Desktop Navigation — Grouped to prevent clutter */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                href="/admin/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/admin/dashboard'
                    ? 'bg-neutral-100 text-neutral-900 font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-neutral-500" />
                Dashboard
              </Link>

              <Link
                href="/admin/orders"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin/orders')
                    ? 'bg-neutral-100 text-neutral-900 font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <ShoppingCart className="w-4 h-4 text-neutral-500" />
                Orders
              </Link>

              <Link
                href="/admin/products"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin/products')
                    ? 'bg-neutral-100 text-neutral-900 font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <Package className="w-4 h-4 text-neutral-500" />
                Products
              </Link>

              {/* Catalog Dropdown */}
              <div className="relative" ref={catalogRef}>
                <button
                  type="button"
                  onClick={() => {
                    setCatalogOpen(!catalogOpen);
                    setSettingsOpen(false);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isCatalogActive
                      ? 'bg-neutral-100 text-neutral-900 font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <Tag className="w-4 h-4 text-neutral-500" />
                  Catalog
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${catalogOpen ? 'rotate-180' : ''}`} />
                </button>

                {catalogOpen && (
                  <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-neutral-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                    <Link
                      href="/admin/brands"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                    >
                      <Tag className="w-4 h-4 text-neutral-400" />
                      Brands
                    </Link>
                    <Link
                      href="/admin/categories"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                    >
                      <FolderTree className="w-4 h-4 text-neutral-400" />
                      Categories
                    </Link>
                    {profile.role === 'owner' && (
                      <Link
                        href="/admin/tools/bulk-price"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                      >
                        <Percent className="w-4 h-4 text-neutral-400" />
                        Bulk Pricing
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <Link
                href="/admin/content"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin/content')
                    ? 'bg-neutral-100 text-neutral-900 font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <Layers className="w-4 h-4 text-neutral-500" />
                Content
              </Link>

              {/* Owner Settings Dropdown */}
              {profile.role === 'owner' && (
                <div className="relative" ref={settingsRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(!settingsOpen);
                      setCatalogOpen(false);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isSettingsActive
                        ? 'bg-neutral-100 text-neutral-900 font-semibold'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                    }`}
                  >
                    <Settings className="w-4 h-4 text-neutral-500" />
                    Management
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {settingsOpen && (
                    <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-neutral-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                      <Link
                        href="/admin/settings"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                      >
                        <Settings className="w-4 h-4 text-neutral-400" />
                        Store Settings
                      </Link>
                      <Link
                        href="/admin/staff"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                      >
                        <Users className="w-4 h-4 text-neutral-400" />
                        Staff Management
                      </Link>
                      <Link
                        href="/admin/audit"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                      >
                        <ShieldAlert className="w-4 h-4 text-neutral-400" />
                        Audit Log
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>

          {/* User profile & Mobile Menu Trigger */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-xs sm:text-sm font-semibold text-neutral-900 truncate max-w-[140px]">
                  {profile.displayName}
                </span>
                <Badge
                  variant={profile.role === 'owner' ? 'bestseller' : 'generic'}
                  className="capitalize text-[10px] py-0 px-1.5"
                >
                  {profile.role}
                </Badge>
              </div>
              <div className="text-[11px] text-neutral-500 flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3 h-3 text-green-600 shrink-0" />
                MFA Verified
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors shrink-0"
              title="Logout everywhere"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Logout</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white px-4 py-4 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {/* User badge on mobile */}
          <div className="sm:hidden pb-3 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-neutral-900">{profile.displayName}</div>
              <div className="text-xs text-neutral-500">{email}</div>
            </div>
            <Badge variant={profile.role === 'owner' ? 'bestseller' : 'generic'} className="capitalize text-[10px]">
              {profile.role}
            </Badge>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Operations
            </div>
            <div className="space-y-1">
              <Link
                href="/admin/dashboard"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname === '/admin/dashboard' ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-neutral-500" />
                Dashboard
              </Link>
              <Link
                href="/admin/orders"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname.startsWith('/admin/orders') ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <ShoppingCart className="w-4 h-4 text-neutral-500" />
                Orders
              </Link>
              <Link
                href="/admin/products"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname.startsWith('/admin/products') ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Package className="w-4 h-4 text-neutral-500" />
                Products
              </Link>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Catalog & Inventory
            </div>
            <div className="space-y-1">
              <Link
                href="/admin/brands"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname.startsWith('/admin/brands') ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Tag className="w-4 h-4 text-neutral-500" />
                Brands
              </Link>
              <Link
                href="/admin/categories"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname.startsWith('/admin/categories') ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <FolderTree className="w-4 h-4 text-neutral-500" />
                Categories
              </Link>
              {profile.role === 'owner' && (
                <Link
                  href="/admin/tools/bulk-price"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    pathname.startsWith('/admin/tools/bulk-price') ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <Percent className="w-4 h-4 text-neutral-500" />
                  Bulk Pricing
                </Link>
              )}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Storefront Content
            </div>
            <div className="space-y-1">
              <Link
                href="/admin/content"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname.startsWith('/admin/content') ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Layers className="w-4 h-4 text-neutral-500" />
                Banners & Campaigns
              </Link>
            </div>
          </div>

          {profile.role === 'owner' && (
            <div>
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Administration
              </div>
              <div className="space-y-1">
                <Link
                  href="/admin/settings"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    pathname.startsWith('/admin/settings') ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <Settings className="w-4 h-4 text-neutral-500" />
                  Store Settings
                </Link>
                <Link
                  href="/admin/staff"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    pathname.startsWith('/admin/staff') ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <Users className="w-4 h-4 text-neutral-500" />
                  Staff Management
                </Link>
                <Link
                  href="/admin/audit"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    pathname.startsWith('/admin/audit') ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-neutral-500" />
                  Audit Log
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

