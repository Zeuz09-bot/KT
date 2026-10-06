/**
 * BottomSheet — mobile sheet that slides up from the bottom.
 * Desktop: renders as a centred Modal instead.
 * Built on Radix Dialog for accessibility (focus trap, ESC, aria).
 */
'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export const BottomSheet = DialogPrimitive.Root;
export const BottomSheetTrigger = DialogPrimitive.Trigger;
export const BottomSheetClose = DialogPrimitive.Close;

export interface BottomSheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  title: string;
  description?: string;
}

export function BottomSheetContent({
  title,
  description,
  children,
  className,
  ...props
}: BottomSheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 animate-fade-in" />
      <DialogPrimitive.Content
        className={cn(
          // Mobile: full-width sheet from bottom
          'fixed bottom-0 left-0 right-0 z-50 max-h-[90dvh] overflow-y-auto',
          'rounded-t-card-lg bg-neutral-0 px-4 pb-safe pt-4 shadow-modal',
          'animate-slide-up',
          // Desktop: centred modal
          'sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-lg sm:w-[calc(100vw-2rem)]',
          'sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card-lg sm:p-6',
          className,
        )}
        {...props}
      >
        {/* Drag handle (mobile only) */}
        <div
          aria-hidden="true"
          className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-300 sm:hidden"
        />

        <div className="flex items-start justify-between gap-4">
          <div>
            <DialogPrimitive.Title className="text-base font-semibold text-neutral-900">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="mt-1 text-sm text-neutral-600">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            aria-label="Close"
            className="shrink-0 rounded-card-sm p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-brand-blue"
          >
            <X size={18} aria-hidden="true" />
          </DialogPrimitive.Close>
        </div>

        <div className="mt-4">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
