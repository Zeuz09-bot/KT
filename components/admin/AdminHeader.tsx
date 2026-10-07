'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { logoutAction } from '@/modules/auth/actions';
import { Badge } from '@/components/ui/badge';
import type { AdminUserProfile } from '@/modules/auth/repo';

interface AdminHeaderProps {
  profile: AdminUserProfile;
  email?: string;
}

export function AdminHeader({ profile, email }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push('/admin/login');
    router.refresh();
  };

  const navLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(profile.role === 'owner'
      ? [
          { href: '/admin/staff', label: 'Staff Management', icon: Users },
          { href: '/admin/audit', label: 'Audit Log', icon: ShieldAlert },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-border-default shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <a
              href="/admin/dashboard"
              className="flex items-center gap-2 font-bold text-text-primary tracking-tight text-lg"
            >
              <span className="w-8 h-8 rounded-lg bg-accent-orange text-white flex items-center justify-center font-black">
                K
              </span>
              <span>KERAUNOUS</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono bg-neutral-100 text-neutral-600 font-normal">
                ADMIN
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-neutral-100 text-text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-neutral-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-sm font-semibold text-text-primary">
                  {profile.displayName}
                </span>
                <Badge
                  variant={profile.role === 'owner' ? 'bestseller' : 'generic'}
                  className="capitalize text-[10px] py-0 px-1.5"
                >
                  {profile.role}
                </Badge>
              </div>
              <div className="text-xs text-text-muted flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3 h-3 text-green-600" />
                MFA Verified · {email || 'Admin'}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
              title="Logout everywhere"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
