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
    <section className="bg-background border-y">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item, index) => {
            const Icon = iconMap[item.icon] || Check;
            return (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
