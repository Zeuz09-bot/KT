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
      className="bg-brand-navy-light border-b border-brand-navy/30 text-neutral-0 text-xs py-2 px-4 transition-colors"
      aria-label="Announcement"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
        <span className="inline-flex items-center gap-1 rounded bg-brand-blue/30 px-2 py-0.5 font-semibold text-brand-blue-subtle text-[11px]">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          {badge}
        </span>
        <span className="font-medium text-neutral-200">{message}</span>
      </div>
    </aside>
  );
}
