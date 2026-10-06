/**
 * Modal — accessible dialog built on Radix Dialog primitive.
 * Focus is trapped, ESC closes, backdrop click closes.
 */
'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export const Modal = DialogPrimitive.Root;
export const ModalTrigger = DialogPrimitive.Trigger;
export const ModalClose = DialogPrimitive.Close;

export interface ModalContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  title: string;
  description?: string;
  /** Width class, default max-w-lg */
  widthClass?: string;
}

export function ModalContent({
  title,
  description,
  widthClass = 'max-w-lg',
  children,
  className,
  ...props
}: ModalContentProps) {
  return (
    <DialogPrimitive.Portal>
      {/* Backdrop */}
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 animate-fade-in" />

      {/* Panel */}
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2',
          'rounded-card-lg bg-neutral-0 p-6 shadow-modal animate-slide-up',
          widthClass,
          className,
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <DialogPrimitive.Title className="text-lg font-semibold text-neutral-900">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="mt-1 text-sm text-neutral-600">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            aria-label="Close dialog"
            className="shrink-0 rounded-card-sm p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-brand-blue"
          >
            <X size={20} aria-hidden="true" />
          </DialogPrimitive.Close>
        </div>

        {/* Body */}
        <div className="mt-4">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
