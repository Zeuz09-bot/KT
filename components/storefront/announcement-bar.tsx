/**
 * AnnouncementBar — top banner for store announcements, notices, and delivery coverage.
 */
import { Sparkles } from 'lucide-react';

export interface AnnouncementBarProps {
  message?: string;
  badge?: string;
}

export function AnnouncementBar({
  message = 'Nationwide Interstate Delivery available across Ondo, Lagos, Ibadan, Abuja, Ekiti & more!',
  badge = 'Active',
}: AnnouncementBarProps) {
  return (
    <aside
      className="bg-brand-charcoal border-b border-brand-silver/20 text-brand-white text-xs py-2 px-4 transition-colors"
      aria-label="Announcement"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-champagne/20 border border-brand-champagne/40 px-2.5 py-0.5 font-medium text-brand-champagne text-[11px] tracking-wide">
          <Sparkles className="h-3 w-3 text-brand-champagne" aria-hidden="true" />
          {badge}
        </span>
        <span className="font-medium text-brand-silver/90 text-[11px] sm:text-xs tracking-wide">{message}</span>
      </div>
    </aside>
  );
}
