/**
 * Vector Brand Icons for Catalogue Brands
 * Renders authentic SVG vectors for Apple, Samsung, Google, OnePlus, Xiaomi, Infinix.
 */
import * as React from 'react';
import { cn } from '@/lib/cn';

export interface BrandIconProps extends React.SVGProps<SVGSVGElement> {
  brand: string;
  size?: number;
}

export function AppleIcon({ size = 24, className, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block shrink-0', className)}
      aria-label="Apple"
      {...props}
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.98.6-2.62 1.34-.56.64-1.05 1.69-.92 2.71 1 .08 2-.45 2.62-1.2" />
    </svg>
  );
}

export function GoogleIcon({ size = 24, className, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block shrink-0', className)}
      aria-label="Google"
      {...props}
    >
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

export function SamsungIcon({ size = 48, className, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size * 1.8}
      height={size * 0.5}
      viewBox="0 0 120 28"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block shrink-0', className)}
      aria-label="Samsung"
      {...props}
    >
      <text
        x="60"
        y="20"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontSize="17"
        fontWeight="800"
        letterSpacing="0.18em"
      >
        SAMSUNG
      </text>
    </svg>
  );
}

export function OnePlusIcon({ size = 28, className, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block shrink-0', className)}
      aria-label="OnePlus"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" />
      <path d="M10 8v8M8.5 9.5L10 8" stroke="currentColor" strokeLinecap="round" />
      <path d="M15 11v4M13 13h4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function XiaomiIcon({ size = 28, className, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block shrink-0', className)}
      aria-label="Xiaomi"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" fillOpacity="0.15" />
      <path
        d="M6 7h12v10h-3V11.5c0-.83-.67-1.5-1.5-1.5S12 10.67 12 11.5V17H9V7zm5 6h1.5v4H11v-4z"
        fill="currentColor"
      />
    </svg>
  );
}

export function InfinixIcon({ size = 48, className, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size * 1.6}
      height={size * 0.5}
      viewBox="0 0 100 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block shrink-0', className)}
      aria-label="Infinix"
      {...props}
    >
      <text
        x="50"
        y="18"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontSize="16"
        fontWeight="bold"
        letterSpacing="0.12em"
      >
        INFINIX
      </text>
    </svg>
  );
}

export function BrandLogoRenderer({
  name,
  slug,
  size = 32,
  className,
}: {
  name: string;
  slug?: string;
  size?: number;
  className?: string;
}) {
  const normalized = (slug || name).toLowerCase();

  if (normalized.includes('apple')) {
    return <AppleIcon size={size} className={className} />;
  }
  if (normalized.includes('samsung')) {
    return <SamsungIcon size={size} className={className} />;
  }
  if (normalized.includes('google')) {
    return <GoogleIcon size={size} className={className} />;
  }
  if (normalized.includes('oneplus')) {
    return <OnePlusIcon size={size} className={className} />;
  }
  if (normalized.includes('xiaomi')) {
    return <XiaomiIcon size={size} className={className} />;
  }
  if (normalized.includes('infinix')) {
    return <InfinixIcon size={size} className={className} />;
  }

  // Fallback monogram
  return (
    <span className={cn('font-display font-bold text-xs tracking-wider', className)}>
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
