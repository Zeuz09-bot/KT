/**
 * Storefront Footer — Navy branded footer with store info, quick links, and trust badges.
 */
import Link from 'next/link';
import { Phone, MapPin, Clock, ShieldCheck, Truck, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-brand-navy text-neutral-300 border-t border-neutral-800" role="contentinfo">
      {/* Trust banner strip */}
      <div className="border-b border-neutral-800/80 bg-neutral-900/40">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-brand-blue/10 text-brand-blue">
                <Truck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-0">Interstate Delivery</p>
                <p className="text-xs text-neutral-400">Ondo, Lagos, Ibadan, Abuja & more</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-brand-blue/10 text-brand-blue">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-0">Tested & Verified</p>
                <p className="text-xs text-neutral-400">100% genuine guaranteed devices</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-brand-blue/10 text-brand-blue">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-0">Direct WhatsApp Orders</p>
                <p className="text-xs text-neutral-400">Confirm stock & pay on delivery/transfer</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-brand-blue/10 text-brand-blue">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-0">24/7 Availability</p>
                <p className="text-xs text-neutral-400">Always active for your gadget inquiries</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer navigation */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-neutral-0 tracking-tight">Keraunous Tech Store</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Premium phones, tablets, laptops and original accessories. Showcase catalogue with verified WhatsApp checkout for Nigerian tech enthusiasts.
            </p>
            <div className="space-y-2 text-sm text-neutral-400">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-blue shrink-0" aria-hidden="true" />
                <span>Ondo State, Nigeria</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-blue shrink-0" aria-hidden="true" />
                <span>Open 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-blue shrink-0" aria-hidden="true" />
                <span>WhatsApp: +234 807 082 2409</span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-0 uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop" className="hover:text-brand-blue transition-colors">
                  All Gadgets
                </Link>
              </li>
              <li>
                <Link href="/how-to-order" className="hover:text-brand-blue transition-colors">
                  How to Order
                </Link>
              </li>
              <li>
                <Link href="/deals" className="hover:text-brand-blue transition-colors">
                  Special Deals
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-brand-blue transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-brand-blue transition-colors">
                  Saved Items
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer policies */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-0 uppercase tracking-wider mb-4">Store Policies</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/delivery" className="hover:text-brand-blue transition-colors">
                  Delivery & Pickup
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="hover:text-brand-blue transition-colors">
                  Warranty & Returns
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-blue transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-brand-blue transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Support */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-0 uppercase tracking-wider mb-4">Trust & Support</h4>
            <ul className="space-y-2 text-sm mb-4">
              <li>
                <Link href="/verify-accounts" className="text-brand-whatsapp hover:underline font-semibold flex items-center gap-1">
                  <span>Verify Our Accounts</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-brand-blue transition-colors">
                  About Keraunous
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-blue transition-colors">
                  Contact & Location
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-brand-blue transition-colors">
                  FAQ & Inquiries
                </Link>
              </li>
            </ul>
            <div className="rounded-card-sm bg-neutral-900/80 p-3 border border-neutral-800">
              <p className="text-xs font-semibold text-neutral-200">Anti-Scam Protection</p>
              <p className="text-xs text-neutral-400 mt-1">
                We accept bank transfers strictly to our official OPay account (8070822409).
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} Keraunous Tech Store. All rights reserved.</p>
          <p>Prices in Nigerian Naira (₦). Built for trust and speed.</p>
        </div>
      </div>
    </footer>
  );
}
