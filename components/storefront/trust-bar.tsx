/**
 * Trust Bar
 * Displays 4 trust items (icon, title, subtitle) from site settings.
 */
import { Check, Truck, Shield, HeadphonesIcon } from 'lucide-react';

export interface TrustItem {
  icon: string;
  title: string;
  subtitle: string;
}

interface TrustBarProps {
  items: TrustItem[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  check: Check,
  truck: Truck,
  shield: Shield,
  headphones: HeadphonesIcon,
};

export function TrustBar({ items }: TrustBarProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="bg-brand-white border-y border-brand-silver/40 shadow-sm">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {items.map((item, index) => {
            const Icon = iconMap[item.icon] || Check;
            return (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-brand-cream/40">
                <div className="flex-shrink-0 p-2.5 rounded-full bg-brand-cream border border-brand-silver/60 text-brand-navy shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm text-brand-charcoal tracking-display">{item.title}</h3>
                  <p className="text-xs text-brand-charcoal/60 mt-0.5">{item.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
