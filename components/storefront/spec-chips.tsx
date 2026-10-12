/**
 * Spec Chips
 * Displays key product specifications as chips
 */
import type { Specs } from '@/lib/contracts/catalog';

interface SpecChipsProps {
  specs: Specs | null;
}

export function SpecChips({ specs }: SpecChipsProps) {
  if (!specs) return null;

  const chips: Array<{ label: string; icon: string }> = [
    specs.display ? { label: specs.display, icon: '📱' } : null,
    specs.chip ? { label: specs.chip, icon: '⚡' } : null,
    specs.network ? { label: specs.network, icon: '📡' } : null,
    specs.battery ? { label: specs.battery, icon: '🔋' } : null,
  ].filter((c): c is { label: string; icon: string } => c !== null);

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, index) => (
        <div
          key={index}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted rounded-full text-sm"
        >
          <span>{chip.icon}</span>
          <span>{chip.label}</span>
        </div>
      ))}
    </div>
  );
}
