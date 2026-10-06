/**
 * Navbar — primary site navigation.
 *
 * Blueprint §2 corrections:
 * - No cart → Order List icon (clipboard-list) with count badge
 * - No user avatar / accounts
 * - WhatsApp number always visible at top
 * - Search icon links to /shop
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Heart, ClipboardList, Menu, X, Phone } from 'lucide-react';

export interface NavbarProps {
  orderListCount?: number;
  wishlistCount?: number;
}

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Best Sellers', href: '/best-sellers' },
  { label: 'Deals', href: '/deals' },
  { label: 'Contact', href: '/contact' },
];

export function Navbar({ orderListCount = 0, wishlistCount = 0 }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-neutral-0 shadow-sm">
      {/* Top strip: WhatsApp number */}
      <div className="hidden bg-brand-navy py-1.5 text-center text-xs font-medium text-white sm:block">
        <a
          href="tel:+2348070822409"
          className="inline-flex items-center gap-1.5 hover:underline"
        >
          <Phone size={12} aria-hidden="true" />
          Call / WhatsApp: <strong>0807 082 2409</strong> · Open 24/7
        </a>
      </div>

      {/* Main bar */}
      <nav aria-label="Main navigation">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Keraunous Tech Store — Home">
            <span className="rounded-lg bg-brand-blue px-2 py-1 text-sm font-bold text-white tracking-tight">
              KT
            </span>
            <span className="hidden font-bold text-neutral-900 sm:block">Keraunous Tech</span>
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden items-center gap-1 lg:flex" role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-card-sm px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-brand-blue"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <Link
              href="/shop"
              aria-label="Search products"
              className="flex h-10 w-10 items-center justify-center rounded-card-sm text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand-blue"
            >
              <Search size={20} aria-hidden="true" />
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              aria-label={`Wishlist${wishlistCount > 0 ? ` (${wishlistCount} items)` : ''}`}
              className="relative flex h-10 w-10 items-center justify-center rounded-card-sm text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand-blue"
            >
              <Heart size={20} aria-hidden="true" />
              {wishlistCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-danger text-[10px] font-bold text-white">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Order List */}
            <Link
              href="/order-list"
              aria-label={`Order List${orderListCount > 0 ? ` (${orderListCount} items)` : ''}`}
              className="relative flex h-10 w-10 items-center justify-center rounded-card-sm text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand-blue"
            >
              <ClipboardList size={20} aria-hidden="true" />
              {orderListCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-blue text-[10px] font-bold text-white">
                  {orderListCount > 9 ? '9+' : orderListCount}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              className="flex h-10 w-10 items-center justify-center rounded-card-sm text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand-blue lg:hidden"
            >
              {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div id="mobile-nav" className="border-t border-neutral-200 bg-neutral-0 lg:hidden">
            <ul className="flex flex-col py-2" role="list">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-6 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="border-t border-neutral-200 mt-1 pt-2 px-6 py-3">
                <a
                  href="tel:+2348070822409"
                  className="flex items-center gap-2 text-sm font-medium text-neutral-700"
                >
                  <Phone size={14} aria-hidden="true" />
                  0807 082 2409 · 24/7
                </a>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}
