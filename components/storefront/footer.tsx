/**
 * Storefront Footer — Navy branded footer with store info, quick links, and trust badges.
 */
import Link from 'next/link';
import { Phone, MapPin, Clock, ShieldCheck, Truck, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-brand-charcoal text-brand-silver/80 border-t border-brand-silver/30 font-sans" role="contentinfo">
      {/* Trust banner strip — Slate Navy grounding tone */}
      <div className="border-b border-brand-silver/20 bg-brand-navy py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-full bg-brand-cream/15 text-brand-silver border border-brand-silver/30">
                <Truck className="h-5 w-5 text-brand-champagne" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-display font-semibold text-brand-white tracking-display">Interstate Delivery</p>
                <p className="text-xs text-brand-silver/70">Ondo, Lagos, Ibadan, Abuja & more</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-full bg-brand-cream/15 text-brand-silver border border-brand-silver/30">
                <ShieldCheck className="h-5 w-5 text-brand-champagne" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-display font-semibold text-brand-white tracking-display">Tested & Verified</p>
                <p className="text-xs text-brand-silver/70">100% genuine guaranteed devices</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-full bg-brand-cream/15 text-brand-silver border border-brand-silver/30">
                <MessageCircle className="h-5 w-5 text-brand-champagne" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-display font-semibold text-brand-white tracking-display">Direct WhatsApp Orders</p>
                <p className="text-xs text-brand-silver/70">Confirm stock & inspect on delivery</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-full bg-brand-cream/15 text-brand-silver border border-brand-silver/30">
                <Clock className="h-5 w-5 text-brand-champagne" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-display font-semibold text-brand-white tracking-display">24/7 Availability</p>
                <p className="text-xs text-brand-silver/70">Always active for your gadget inquiries</p>
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
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-brand-navy border border-brand-silver/40 text-xs font-display font-bold text-brand-white tracking-widest">
                KT
              </span>
              <h3 className="text-lg font-display font-bold text-brand-white tracking-display">Keraunous Tech Store</h3>
            </div>
            <p className="text-sm text-brand-silver/80 leading-relaxed font-sans">
              Quiet tech luxury. Premium smartphones, tablets, MacBooks and authentic accessories with direct WhatsApp concierge for Nigerian tech enthusiasts.
            </p>
            <div className="space-y-2 text-sm text-brand-silver/80">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-champagne shrink-0" aria-hidden="true" />
                <span>Ondo State, Nigeria</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-champagne shrink-0" aria-hidden="true" />
                <span>Open 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-champagne shrink-0" aria-hidden="true" />
                <span>WhatsApp: +234 807 082 2409</span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-editorial uppercase tracking-editorial text-brand-champagne mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm font-sans">
              <li>
                <Link href="/shop" className="hover:text-brand-champagne transition-colors">
                  All Gadgets
                </Link>
              </li>
              <li>
                <Link href="/how-to-order" className="hover:text-brand-champagne transition-colors">
                  How to Order
                </Link>
              </li>
              <li>
                <Link href="/deals" className="hover:text-brand-champagne transition-colors">
                  Special Deals
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-brand-champagne transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-brand-champagne transition-colors">
                  Saved Items
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer policies */}
          <div>
            <h4 className="text-xs font-editorial uppercase tracking-editorial text-brand-champagne mb-4">Store Policies</h4>
            <ul className="space-y-2.5 text-sm font-sans">
              <li>
                <Link href="/delivery" className="hover:text-brand-champagne transition-colors">
                  Delivery & Pickup
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="hover:text-brand-champagne transition-colors">
                  Warranty & Returns
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-champagne transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-brand-champagne transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Support */}
          <div>
            <h4 className="text-xs font-editorial uppercase tracking-editorial text-brand-champagne mb-4">Trust & Verification</h4>
            <ul className="space-y-2.5 text-sm font-sans mb-4">
              <li>
                <Link href="/verify-accounts" className="text-brand-whatsapp hover:underline font-semibold flex items-center gap-1.5">
                  <span>Verify Our Official Accounts</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-brand-champagne transition-colors">
                  About Keraunous
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-champagne transition-colors">
                  Contact & Concierge
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-brand-champagne transition-colors">
                  FAQ & Inquiries
                </Link>
              </li>
            </ul>
            <div className="rounded-card-sm bg-brand-charcoal/95 p-3.5 border border-brand-champagne/30 shadow-foil">
              <p className="text-xs font-display font-semibold text-brand-champagne">Anti-Impersonation Protection</p>
              <p className="text-xs text-brand-silver/80 mt-1 leading-relaxed">
                We accept bank transfers strictly to our verified OPay account (8070822409).
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-brand-silver/20 flex flex-col sm:flex-row items-center justify-between text-xs text-brand-silver/60 gap-4">
          <p>© {new Date().getFullYear()} Keraunous Tech Store. All rights reserved.</p>
          <p className="tracking-wide">Prices in Nigerian Naira (₦). Quiet Tech Luxury.</p>
        </div>
      </div>
    </footer>
  );
}
