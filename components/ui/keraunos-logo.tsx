/**
 * KeraunosLogo Component
 *
 * Authentic vector brandmark and wordmark for Keraunous Tech Store.
 * Supports:
 * - 01 / Primary: Obsidian Charcoal mark on light/transparent background
 * - 02 / Signature: Brushed Silver / Chrome foil mark
 * - 03 / Luxury: Champagne Gold foil mark
 * - Layouts: 'horizontal' (navbar/footer), 'stacked' (cards/editorial), or 'mark-only'
 */
import * as React from 'react';
import { cn } from '@/lib/cn';

export type LogoVariant = 'primary' | 'signature' | 'luxury' | 'white' | 'auto';
export type LogoLayout = 'horizontal' | 'stacked' | 'mark-only';

export interface KeraunosLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: LogoVariant;
  layout?: LogoLayout;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  withContainer?: boolean;
}

const sizeMap = {
  xs: { mark: 22, height: 24, text: 'text-sm', sub: 'text-[9px]' },
  sm: { mark: 28, height: 32, text: 'text-base', sub: 'text-[10px]' },
  md: { mark: 36, height: 40, text: 'text-lg', sub: 'text-xs' },
  lg: { mark: 48, height: 54, text: 'text-2xl', sub: 'text-sm' },
  xl: { mark: 72, height: 80, text: 'text-3xl', sub: 'text-base' },
};

/**
 * Authentic "K" Brand Mark
 * Composed of rounded tubular circuit/audio line strokes with terminal nodes.
 */
export function KMark({
  size = 36,
  className,
  color,
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 transition-colors', className)}
      aria-hidden="true"
    >
      {/* Node Dots */}
      <circle cx="34" cy="33" r="4.2" fill={color || 'currentColor'} />
      <circle cx="34" cy="67" r="4.2" fill={color || 'currentColor'} />

      {/* Left Vertical Spine with Upper Loop */}
      <path
        d="M24 50 V28 C24 20 34 16 41 21 C45 24 45 30 45 33"
        stroke={color || 'currentColor'}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Left Vertical Spine with Lower Loop */}
      <path
        d="M24 50 V72 C24 80 34 84 41 79 C45 76 45 70 45 67"
        stroke={color || 'currentColor'}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dynamic Swooping Upper Arm */}
      <path
        d="M25 64 C25 54 36 38 49 29 L73 19 C79 16 85 20 84 27 C83 32 77 38 68 46 L46 64"
        stroke={color || 'currentColor'}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lower Diagonal Leg */}
      <path
        d="M48 57 L72 81 C77 86 84 83 85 76 C86 71 81 64 73 57 L60 48"
        stroke={color || 'currentColor'}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KeraunosLogo({
  variant = 'auto',
  layout = 'horizontal',
  size = 'md',
  withContainer = false,
  className,
  ...props
}: KeraunosLogoProps) {
  const s = sizeMap[size];

  // Colors based on brand guidelines
  let markColor = 'currentColor';
  let textColor = 'text-brand-charcoal';
  let subColor = 'text-brand-charcoal/70';
  let containerBg = '';

  if (variant === 'primary') {
    markColor = '#18191B';
    textColor = 'text-[#18191B]';
    subColor = 'text-[#18191B]/80';
    containerBg = 'bg-[#F3EFEA] border border-brand-silver/50';
  } else if (variant === 'signature') {
    markColor = '#D4D8DD';
    textColor = 'text-[#D4D8DD]';
    subColor = 'text-[#D4D8DD]/80';
    containerBg = 'bg-[#3B4854] border border-brand-silver/30 shadow-card';
  } else if (variant === 'luxury') {
    markColor = '#C5B49C';
    textColor = 'text-[#C5B49C]';
    subColor = 'text-[#C5B49C]/80';
    containerBg = 'bg-[#18191B] border border-brand-champagne/40 shadow-foil';
  } else if (variant === 'white') {
    markColor = '#FFFFFF';
    textColor = 'text-white';
    subColor = 'text-white/80';
  }

  const markElement = <KMark size={s.mark} color={markColor} />;

  if (layout === 'mark-only') {
    if (withContainer) {
      return (
        <div
          className={cn(
            'flex items-center justify-center rounded-xl p-2',
            containerBg,
            className,
          )}
          {...props}
        >
          {markElement}
        </div>
      );
    }
    return <div className={cn('inline-flex', className)} {...props}>{markElement}</div>;
  }

  if (layout === 'stacked') {
    return (
      <div
        className={cn(
          'flex flex-col items-center text-center gap-2 select-none',
          withContainer && 'p-6 rounded-card-lg',
          withContainer && containerBg,
          className,
        )}
        {...props}
      >
        {markElement}
        <div className="flex flex-col items-center">
          <span
            className={cn(
              'font-display font-bold tracking-tight lowercase leading-none',
              s.text,
              textColor,
            )}
          >
            keraunos
          </span>
          <span
            className={cn(
              'font-display font-medium uppercase tracking-[0.22em] text-center mt-1 leading-none',
              s.sub,
              subColor,
            )}
          >
            tech
          </span>
        </div>
      </div>
    );
  }

  // Horizontal layout (default for navbar and headers)
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 select-none group',
        withContainer && 'px-3 py-1.5 rounded-lg',
        withContainer && containerBg,
        className,
      )}
      {...props}
    >
      {markElement}
      <div className="flex flex-col justify-center leading-none">
        <span
          className={cn(
            'font-display font-bold tracking-tight lowercase leading-tight',
            s.text,
            textColor,
          )}
        >
          keraunos
        </span>
        <span
          className={cn(
            'font-display font-medium uppercase tracking-[0.24em] leading-tight text-[10px] sm:text-[11px] -mt-0.5',
            subColor,
          )}
        >
          tech
        </span>
      </div>
    </div>
  );
}
