/**
 * BrandTile — square tile linking to a brand page.
 * Shows brand logo (via next/image) and brand name.
 */
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export interface BrandTileProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  logoUrl: string;
  href: string;
}

export function BrandTile({ name, logoUrl, href, className, ...props }: BrandTileProps) {
  return (
    <div className={cn('', className)} {...props}>
      <Link
        href={href}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-card-md border border-neutral-200 bg-neutral-0 p-4',
          'transition-all duration-200 hover:border-brand-blue hover:shadow-card-hover',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue',
          'min-h-[100px]',
        )}
      >
        <div className="relative h-10 w-full">
          <Image
            src={logoUrl}
            alt={`${name} logo`}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 80px, 100px"
          />
        </div>
        <span className="text-xs font-semibold text-neutral-700">{name}</span>
      </Link>
    </div>
  );
}
