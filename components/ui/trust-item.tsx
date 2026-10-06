/**
 * TrustItem — icon + label for the trust bar strip (e.g. "Genuine Products", "Nationwide Delivery").
 * Blueprint §2 correction: no "Secure Payment" or false social proof.
 */
import * as React from 'react';
import { cn } from '@/lib/cn';

export interface TrustItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
}

export function TrustItem({ icon, label, sublabel, className, ...props }: TrustItemProps) {
  return (
    <div
      className={cn('flex items-center gap-3', className)}
      {...props}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blueLight text-brand-blue">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-neutral-900">{label}</p>
        {sublabel && <p className="text-xs text-neutral-500">{sublabel}</p>}
      </div>
    </div>
  );
}
